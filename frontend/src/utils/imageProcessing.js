import { isBrowser } from './ssr.js';

const DEFAULT_OPTIONS = {
    maxSize: 512,
    targetBytes: 50 * 1024,
    minQuality: 0.35,
    qualityStep: 0.05,
    background: '#fff',
    minSize: 256,
    initialQuality: 0.85,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function buildSizeSteps(maxSize, minSize) {
    const steps = [];
    let current = maxSize;
    const normalizedMin = Math.min(maxSize, minSize);

    while (current >= normalizedMin) {
        steps.push(current);
        if (current === normalizedMin) {
            break;
        }
        current = Math.max(normalizedMin, Math.round(current * 0.875));
    }

    return Array.from(new Set(steps));
}

async function decodeImage(file) {
    if (!isBrowser) {
        throw new Error('Image processing is only available in the browser.');
    }

    if (typeof createImageBitmap === 'function') {
        const bitmap = await createImageBitmap(file);
        return {
            image: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            cleanup: () => {
                if (typeof bitmap.close === 'function') {
                    bitmap.close();
                }
            },
        };
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';

    await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load.'));
        img.src = objectUrl;
    });

    return {
        image: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        cleanup: () => URL.revokeObjectURL(objectUrl),
    };
}

function drawLetterboxedCanvas({ image, width, height }, size, background) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Canvas 2D context not available.');
    }

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const scale = Math.min(size / width, size / height);
    const drawWidth = Math.round(width * scale);
    const drawHeight = Math.round(height * scale);
    const dx = Math.round((size - drawWidth) / 2);
    const dy = Math.round((size - drawHeight) / 2);

    ctx.drawImage(image, dx, dy, drawWidth, drawHeight);

    return canvas;
}

function canvasToJpegBlob(canvas, quality) {
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

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('Encoded image was invalid.'));
        };
        reader.onerror = () => {
            reject(reader.error ?? new Error('Failed to read image data.'));
        };
        reader.readAsDataURL(blob);
    });
}

export async function downsampleAndCompressToJpeg(file, options = {}) {
    if (!isBrowser) {
        throw new Error('Image processing is only available in the browser.');
    }

    if (!(file instanceof Blob)) {
        throw new Error('Invalid image file.');
    }

    const settings = {
        ...DEFAULT_OPTIONS,
        ...options,
    };

    settings.minQuality = clamp(settings.minQuality, 0.05, 1);
    settings.initialQuality = clamp(settings.initialQuality, settings.minQuality, 1);
    settings.qualityStep = clamp(settings.qualityStep, 0.01, 0.5);
    settings.minSize = Math.min(settings.minSize, settings.maxSize);

    const { image, width, height, cleanup } = await decodeImage(file);
    const sizeSteps = buildSizeSteps(settings.maxSize, settings.minSize);

    let bestCandidate = null;

    try {
        for (const size of sizeSteps) {
            const canvas = drawLetterboxedCanvas({ image, width, height }, size, settings.background);
            let quality = settings.initialQuality;

            while (true) {
                const blob = await canvasToJpegBlob(canvas, quality);

                if (!bestCandidate || blob.size < bestCandidate.bytes) {
                    bestCandidate = { blob, bytes: blob.size, size, quality };
                }

                if (blob.size <= settings.targetBytes) {
                    const dataUrl = await blobToDataUrl(blob);
                    return {
                        dataUrl,
                        bytes: blob.size,
                        width: size,
                        height: size,
                        qualityUsed: quality,
                    };
                }

                if (quality <= settings.minQuality) {
                    break;
                }

                const nextQuality = clamp(
                    Number((quality - settings.qualityStep).toFixed(2)),
                    settings.minQuality,
                    1
                );

                if (nextQuality === quality) {
                    break;
                }

                quality = nextQuality;
            }
        }
    } finally {
        if (typeof cleanup === 'function') {
            cleanup();
        }
    }

    if (!bestCandidate) {
        throw new Error('Image processing failed.');
    }

    const dataUrl = await blobToDataUrl(bestCandidate.blob);

    if (bestCandidate.bytes > settings.targetBytes) {
        console.warn('Image compression exceeded target size', {
            bytes: bestCandidate.bytes,
            targetBytes: settings.targetBytes,
            size: bestCandidate.size,
            quality: bestCandidate.quality,
        });
    }

    return {
        dataUrl,
        bytes: bestCandidate.bytes,
        width: bestCandidate.size,
        height: bestCandidate.size,
        qualityUsed: bestCandidate.quality,
    };
}
