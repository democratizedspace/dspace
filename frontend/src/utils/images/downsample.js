import { isBrowser } from '../ssr.js';

const DEFAULT_MAX_SIZE = 512;
const DEFAULT_TARGET_BYTES = 50 * 1024;
const DEFAULT_MIN_QUALITY = 0.35;
const DEFAULT_QUALITY_STEP = 0.05;
const DEFAULT_BACKGROUND = '#fff';
const DEFAULT_START_QUALITY = 0.92;
const DEFAULT_MIN_SIZE = 256;

function getSizeSteps(maxSize, minSize) {
    const steps = [
        maxSize,
        Math.round(maxSize * 0.875),
        Math.round(maxSize * 0.75),
        Math.round(maxSize * 0.625),
        Math.round(maxSize * 0.5),
    ];

    return Array.from(new Set(steps)).filter((size) => size >= minSize);
}

async function loadImageSource(file) {
    if (!isBrowser) {
        throw new Error('Image processing is only available in the browser.');
    }

    if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file);
        return {
            image: bitmap,
            cleanup: () => {
                if (typeof bitmap.close === 'function') {
                    bitmap.close();
                }
            },
        };
    }

    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        const loaded = new Promise((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Unable to decode the uploaded image.'));
        });
        image.src = objectUrl;
        await loaded;
        return {
            image,
            cleanup: () => URL.revokeObjectURL(objectUrl),
        };
    } catch (error) {
        URL.revokeObjectURL(objectUrl);
        throw error;
    }
}

function renderToCanvas(image, size, background) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas is not supported in this environment.');
    }

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);

    const sourceWidth = image.width || image.naturalWidth || size;
    const sourceHeight = image.height || image.naturalHeight || size;
    const scale = Math.min(size / sourceWidth, size / sourceHeight);
    const drawWidth = Math.round(sourceWidth * scale);
    const drawHeight = Math.round(sourceHeight * scale);
    const offsetX = Math.round((size - drawWidth) / 2);
    const offsetY = Math.round((size - drawHeight) / 2);

    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    return canvas;
}

function canvasToBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Failed to encode the image.'));
                    return;
                }
                resolve(blob);
            },
            'image/jpeg',
            quality
        );
    });
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('Failed to read image data.'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data.'));
        reader.readAsDataURL(blob);
    });
}

/**
 * Downsample and compress an uploaded image to a square JPEG.
 * @param {File} file
 * @param {Object} [opts]
 * @param {number} [opts.maxSize=512]
 * @param {number} [opts.targetBytes=51200]
 * @param {number} [opts.minQuality=0.35]
 * @param {number} [opts.qualityStep=0.05]
 * @param {string} [opts.background="#fff"]
 * @param {number} [opts.minSize=256]
 * @returns {Promise<{
 *   dataUrl: string,
 *   bytes: number,
 *   width: number,
 *   height: number,
 *   qualityUsed: number
 * }>}
 */
export async function downsampleAndCompressToJpeg(file, opts = {}) {
    const maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
    const targetBytes = opts.targetBytes ?? DEFAULT_TARGET_BYTES;
    const minQuality = opts.minQuality ?? DEFAULT_MIN_QUALITY;
    const qualityStep = opts.qualityStep ?? DEFAULT_QUALITY_STEP;
    const background = opts.background ?? DEFAULT_BACKGROUND;
    const minSize = Math.min(opts.minSize ?? DEFAULT_MIN_SIZE, maxSize);

    const { image, cleanup } = await loadImageSource(file);

    let bestResult = null;
    try {
        const sizes = getSizeSteps(maxSize, minSize);

        for (const size of sizes) {
            const canvas = renderToCanvas(image, size, background);
            let quality = DEFAULT_START_QUALITY;

            while (quality >= minQuality) {
                const blob = await canvasToBlob(canvas, quality);
                const result = { blob, size, quality };

                if (!bestResult || blob.size < bestResult.blob.size) {
                    bestResult = result;
                }

                if (blob.size <= targetBytes) {
                    const dataUrl = await blobToDataUrl(blob);
                    return {
                        dataUrl,
                        bytes: blob.size,
                        width: size,
                        height: size,
                        qualityUsed: quality,
                    };
                }

                if (quality === minQuality) {
                    break;
                }

                const nextQuality = Number((quality - qualityStep).toFixed(2));
                quality = Math.max(minQuality, nextQuality);
            }
        }
    } finally {
        cleanup();
    }

    if (!bestResult) {
        throw new Error('Unable to compress image.');
    }

    if (bestResult.blob.size > targetBytes) {
        console.warn(
            `Compressed image still above target (${bestResult.blob.size} bytes > ` +
                `${targetBytes} bytes).`
        );
    }

    const dataUrl = await blobToDataUrl(bestResult.blob);
    return {
        dataUrl,
        bytes: bestResult.blob.size,
        width: bestResult.size,
        height: bestResult.size,
        qualityUsed: bestResult.quality,
    };
}
