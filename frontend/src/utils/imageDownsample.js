import { isBrowser } from './ssr.js';

const DEFAULT_MAX_SIZE = 512;
const DEFAULT_TARGET_BYTES = 50 * 1024;
const DEFAULT_MIN_QUALITY = 0.35;
const DEFAULT_QUALITY_STEP = 0.05;
const DEFAULT_BACKGROUND = '#fff';
const DEFAULT_MIN_SIZE = 256;
const DEFAULT_SIZE_STEP = 64;
const DEFAULT_START_QUALITY = 0.85;

function clampQuality(value) {
    return Math.min(1, Math.max(0, value));
}

function getSizeSteps(maxSize, minSize, sizeStep) {
    const steps = [];
    for (let size = maxSize; size >= minSize; size -= sizeStep) {
        steps.push(size);
    }
    if (steps.length === 0 || steps[steps.length - 1] !== minSize) {
        steps.push(minSize);
    }
    return Array.from(new Set(steps)).filter((size) => size > 0);
}

async function loadImageSource(file) {
    if (typeof createImageBitmap === 'function') {
        try {
            const bitmap = await createImageBitmap(file, {
                imageOrientation: 'from-image',
            });
            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                cleanup: () => bitmap.close?.(),
            };
        } catch {
            // Fall through to <img> decoding to preserve EXIF orientation when
            // createImageBitmap does not support the imageOrientation option.
        }
    }

    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            URL.revokeObjectURL(url);
            resolve({
                source: img,
                width,
                height,
                cleanup: () => {},
            });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Image failed to load.'));
        };
        img.src = url;
    });
}

function drawLetterboxedCanvas({ source, width, height }, canvasSize, background) {
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas rendering context is unavailable.');
    }

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const scale = Math.min(canvasSize / width, canvasSize / height);
    const drawWidth = Math.round(width * scale);
    const drawHeight = Math.round(height * scale);
    const offsetX = Math.round((canvasSize - drawWidth) / 2);
    const offsetY = Math.round((canvasSize - drawHeight) / 2);

    ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);

    return canvas;
}

function dataUrlToBlob(dataUrl) {
    const [header, data] = dataUrl.split(',');
    if (!header || !data) {
        throw new Error('Invalid data URL.');
    }
    const mimeMatch = header.match(/data:([^;]+);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    let binary;
    if (typeof atob === 'function') {
        binary = atob(data);
    } else if (typeof Buffer !== 'undefined') {
        binary = Buffer.from(data, 'base64').toString('binary');
    } else {
        throw new Error('Base64 decoding is not available in this environment.');
    }
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
}

async function canvasToBlob(canvas, quality) {
    if (!canvas.toBlob) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        return dataUrlToBlob(dataUrl);
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Unable to encode image.'));
                    return;
                }
                resolve(blob);
            },
            'image/jpeg',
            quality
        );
    });
}

async function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('Image preview is invalid.'));
        };
        reader.onerror = () => {
            reject(reader.error ?? new Error('Image preview failed to load.'));
        };
        reader.readAsDataURL(blob);
    });
}

async function compressCanvas(canvas, options) {
    const startQuality = clampQuality(options.startQuality ?? DEFAULT_START_QUALITY);
    const minQuality = clampQuality(options.minQuality);
    const qualityStep = options.qualityStep;
    const targetBytes = options.targetBytes;

    let bestCandidate = null;
    for (
        let currentQuality = startQuality;
        currentQuality >= minQuality;
        currentQuality -= qualityStep
    ) {
        const nextQuality = clampQuality(currentQuality);
        const blob = await canvasToBlob(canvas, nextQuality);
        if (!bestCandidate || blob.size < bestCandidate.blob.size) {
            bestCandidate = { blob, quality: nextQuality };
        }
        if (blob.size <= targetBytes) {
            return { blob, quality: nextQuality, hitTarget: true };
        }
    }

    return {
        blob: bestCandidate?.blob,
        quality: bestCandidate?.quality ?? minQuality,
        hitTarget: bestCandidate?.blob ? bestCandidate.blob.size <= targetBytes : false,
    };
}

/**
 * Downsample an image file into a square JPEG payload sized for IndexedDB storage.
 * @param {File} file
 * @param {object} [opts]
 * @param {number} [opts.maxSize=512]
 * @param {number} [opts.targetBytes=50*1024]
 * @param {number} [opts.minQuality=0.35]
 * @param {number} [opts.qualityStep=0.05]
 * @param {string} [opts.background='#fff']
 * @param {number} [opts.minSize=256]
 * @param {number} [opts.sizeStep=64]
 * @returns {Promise<{dataUrl: string; bytes: number; width: number; height: number;
 * qualityUsed: number;}>}
 */
export async function downsampleAndCompressToJpeg(file, opts = {}) {
    if (!isBrowser) {
        throw new Error('Image processing is only available in the browser.');
    }
    if (!(file instanceof File)) {
        throw new Error('Expected a File to downsample.');
    }

    const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
    const targetBytes = opts.targetBytes ?? DEFAULT_TARGET_BYTES;
    const minQuality = opts.minQuality ?? DEFAULT_MIN_QUALITY;
    const qualityStep = opts.qualityStep ?? DEFAULT_QUALITY_STEP;
    const background = opts.background ?? DEFAULT_BACKGROUND;
    const minSize = opts.minSize ?? DEFAULT_MIN_SIZE;
    const sizeStep = opts.sizeStep ?? DEFAULT_SIZE_STEP;

    const decoded = await loadImageSource(file);
    try {
        const sizeSteps = getSizeSteps(maxSize, minSize, sizeStep);
        let bestResult = null;

        for (const size of sizeSteps) {
            const canvas = drawLetterboxedCanvas(decoded, size, background);
            const result = await compressCanvas(canvas, {
                startQuality: opts.startQuality ?? DEFAULT_START_QUALITY,
                minQuality,
                qualityStep,
                targetBytes,
            });

            if (result?.blob) {
                const dataUrl = await blobToDataUrl(result.blob);
                const candidate = {
                    dataUrl,
                    bytes: result.blob.size,
                    width: size,
                    height: size,
                    qualityUsed: result.quality,
                };

                if (!bestResult || candidate.bytes < bestResult.bytes) {
                    bestResult = candidate;
                }

                if (result.hitTarget) {
                    return candidate;
                }
            }
        }

        if (bestResult) {
            if (bestResult.bytes > targetBytes) {
                console.warn(
                    `Image compression exceeded target size (${bestResult.bytes} bytes > ` +
                        `${targetBytes} bytes).`
                );
            }
            return bestResult;
        }

        throw new Error('Failed to compress image.');
    } finally {
        decoded.cleanup?.();
    }
}
