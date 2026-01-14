const DEFAULT_MAX_SIZE = 512;
const DEFAULT_TARGET_BYTES = 50 * 1024;
const DEFAULT_MIN_QUALITY = 0.35;
const DEFAULT_QUALITY_STEP = 0.05;
const DEFAULT_BACKGROUND = '#ffffff';
const DEFAULT_MIN_SIZE = 256;
const DEFAULT_START_QUALITY = 0.92;

function getSizeCandidates(maxSize, minSize) {
    const sizes = [];
    const step = 64;
    for (let size = maxSize; size >= minSize; size -= step) {
        sizes.push(size);
    }
    if (sizes[sizes.length - 1] !== minSize) {
        sizes.push(minSize);
    }
    return sizes;
}

function loadImageSource(file) {
    if (typeof createImageBitmap === 'function') {
        return createImageBitmap(file).then((bitmap) => ({
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            cleanup: () => {
                if (typeof bitmap.close === 'function') {
                    bitmap.close();
                }
            },
        }));
    }

    return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
            reject(new Error('Image processing requires a browser environment.'));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            resolve({
                source: image,
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
                cleanup: () => URL.revokeObjectURL(objectUrl),
            });
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image failed to load.'));
        };
        image.src = objectUrl;
    });
}

function getCanvasContext(size, background) {
    if (typeof document === 'undefined') {
        throw new Error('Image processing requires a browser environment.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Canvas context is unavailable.');
    }
    context.fillStyle = background;
    context.fillRect(0, 0, size, size);
    return { canvas, context };
}

function drawLetterboxedImage(context, source, size, sourceWidth, sourceHeight) {
    const scale = Math.min(size / sourceWidth, size / sourceHeight);
    const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
    const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
    const offsetX = Math.round((size - drawWidth) / 2);
    const offsetY = Math.round((size - drawHeight) / 2);
    context.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
}

function canvasToBlob(canvas, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve(blob ?? null);
            },
            'image/jpeg',
            quality
        );
    });
}

function dataUrlToBlob(dataUrl) {
    const [header, base64Data] = dataUrl.split(',');
    const match = /data:(.*?);base64/.exec(header);
    const contentType = match?.[1] ?? 'image/jpeg';
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: contentType });
}

async function canvasToBestEffortBlob(canvas, quality) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob) {
        return blob;
    }
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return dataUrlToBlob(dataUrl);
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob.'));
        reader.readAsDataURL(blob);
    });
}

async function compressAtSize(sourceInfo, size, options) {
    const { background, minQuality, qualityStep } = options;
    const { canvas, context } = getCanvasContext(size, background);
    drawLetterboxedImage(
        context,
        sourceInfo.source,
        size,
        sourceInfo.width,
        sourceInfo.height
    );

    let quality = DEFAULT_START_QUALITY;
    let lastBlob = null;
    let lastQuality = quality;

    while (quality >= minQuality) {
        const blob = await canvasToBestEffortBlob(canvas, quality);
        if (!blob) {
            throw new Error('Failed to encode image.');
        }
        lastBlob = blob;
        lastQuality = quality;

        if (blob.size <= options.targetBytes) {
            return {
                blob,
                qualityUsed: quality,
                width: size,
                height: size,
            };
        }

        quality = Math.max(minQuality, Number((quality - qualityStep).toFixed(2)));
        if (quality === lastQuality) {
            break;
        }
    }

    return {
        blob: lastBlob,
        qualityUsed: lastQuality,
        width: size,
        height: size,
    };
}

/**
 * Downsample and compress an image file to a 512x512 JPEG data URL.
 */
export async function downsampleAndCompressToJpeg(file, opts = {}) {
    const options = {
        maxSize: opts.maxSize ?? DEFAULT_MAX_SIZE,
        targetBytes: opts.targetBytes ?? DEFAULT_TARGET_BYTES,
        minQuality: opts.minQuality ?? DEFAULT_MIN_QUALITY,
        qualityStep: opts.qualityStep ?? DEFAULT_QUALITY_STEP,
        background: opts.background ?? DEFAULT_BACKGROUND,
        minSize: opts.minSize ?? DEFAULT_MIN_SIZE,
    };

    if (!file) {
        throw new Error('No file provided for image processing.');
    }

    const sourceInfo = await loadImageSource(file);
    let bestResult = null;

    try {
        const sizeCandidates = getSizeCandidates(options.maxSize, options.minSize);

        for (const size of sizeCandidates) {
            const result = await compressAtSize(sourceInfo, size, options);
            if (result?.blob) {
                if (!bestResult || result.blob.size < bestResult.blob.size) {
                    bestResult = result;
                }
                if (result.blob.size <= options.targetBytes) {
                    bestResult = result;
                    break;
                }
            }
        }
    } finally {
        if (typeof sourceInfo.cleanup === 'function') {
            sourceInfo.cleanup();
        }
    }

    if (!bestResult?.blob) {
        throw new Error('Unable to process image.');
    }

    if (bestResult.blob.size > options.targetBytes) {
        console.warn(
            `Compressed image exceeds target size (${bestResult.blob.size} bytes > ` +
                `${options.targetBytes} bytes).`
        );
    }

    const dataUrl = await blobToDataUrl(bestResult.blob);
    if (typeof dataUrl !== 'string') {
        throw new Error('Failed to produce image data URL.');
    }

    return {
        dataUrl,
        bytes: bestResult.blob.size,
        width: bestResult.width,
        height: bestResult.height,
        qualityUsed: bestResult.qualityUsed,
    };
}
