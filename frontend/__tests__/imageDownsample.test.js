const DEFAULT_DATA_URL = `data:image/jpeg;base64,${Buffer.from('ok').toString('base64')}`;

const originalGlobals = {
    createImageBitmap: global.createImageBitmap,
    Image: global.Image,
    FileReader: global.FileReader,
    atob: global.atob,
    urlCreateObjectURL: global.URL?.createObjectURL,
    urlRevokeObjectURL: global.URL?.revokeObjectURL,
};

function mockFileReader({ result = DEFAULT_DATA_URL, error = null } = {}) {
    global.FileReader = class {
        constructor() {
            this.result = null;
            this.error = null;
            this.onload = null;
            this.onerror = null;
        }

        readAsDataURL(blob) {
            if (error) {
                this.error = error;
                this.onerror?.();
                return;
            }

            this.result =
                typeof result === 'function'
                    ? result(blob)
                    : result ?? `data:${blob.type};base64,${Buffer.from('ok').toString('base64')}`;
            this.onload?.();
        }
    };
}

function mockCanvas({
    toBlobImpl,
    toDataURLImpl,
    withContext = true,
} = {}) {
    const context = withContext
        ? {
              fillStyle: '',
              fillRect: jest.fn(),
              drawImage: jest.fn(),
          }
        : null;

    const canvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => context),
    };

    if (toBlobImpl) {
        canvas.toBlob = jest.fn(toBlobImpl);
    }

    if (toDataURLImpl) {
        canvas.toDataURL = jest.fn(toDataURLImpl);
    }

    return { canvas, context };
}

function mockImage({ width = 320, height = 240, shouldError = false } = {}) {
    global.Image = class {
        constructor() {
            this.onload = null;
            this.onerror = null;
            this.naturalWidth = width;
            this.naturalHeight = height;
            this.width = width;
            this.height = height;
        }

        set src(value) {
            if (shouldError) {
                this.onerror?.();
                return;
            }

            this.onload?.();
        }
    };
}

function mockUrl() {
    if (!global.URL) {
        global.URL = {};
    }
    global.URL.createObjectURL = jest.fn(() => 'blob:preview');
    global.URL.revokeObjectURL = jest.fn();
}

function createBitmap({ width = 1024, height = 768, close = jest.fn() } = {}) {
    return {
        width,
        height,
        close,
    };
}

function mockCanvasElement(canvas) {
    const originalCreateElement = document.createElement.bind(document);
    return jest.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
            return canvas;
        }
        return originalCreateElement(tag);
    });
}

beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    global.createImageBitmap = originalGlobals.createImageBitmap;
    global.Image = originalGlobals.Image;
    global.FileReader = originalGlobals.FileReader;
    global.atob = originalGlobals.atob;
    if (global.URL) {
        global.URL.createObjectURL = originalGlobals.urlCreateObjectURL;
        global.URL.revokeObjectURL = originalGlobals.urlRevokeObjectURL;
    }
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.dontMock('../src/utils/ssr.js');
    global.createImageBitmap = originalGlobals.createImageBitmap;
    global.Image = originalGlobals.Image;
    global.FileReader = originalGlobals.FileReader;
    global.atob = originalGlobals.atob;
    if (global.URL) {
        global.URL.createObjectURL = originalGlobals.urlCreateObjectURL;
        global.URL.revokeObjectURL = originalGlobals.urlRevokeObjectURL;
    }
});

describe('downsampleAndCompressToJpeg', () => {
    test('processes images with createImageBitmap and toBlob', async () => {
        const close = jest.fn();
        global.createImageBitmap = jest.fn(async () => createBitmap({ close }));
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb, type, quality) => {
                const size = Math.max(1, Math.round(60000 * (1 - quality)));
                cb(new Blob([new Uint8Array(size)], { type }));
            },
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 60000 });

        expect(global.createImageBitmap).toHaveBeenCalledWith(file, {
            imageOrientation: 'from-image',
        });
        expect(close).toHaveBeenCalledTimes(1);
        expect(result.dataUrl).toContain('data:image/jpeg;base64,');
        expect(result.width).toBe(512);
        expect(result.height).toBe(512);
        expect(result.bytes).toBeGreaterThan(0);
    });

    test('falls back to <img> decoding when createImageBitmap fails', async () => {
        global.createImageBitmap = jest.fn(async () => {
            throw new Error('bitmap not supported');
        });
        mockUrl();
        mockImage({ width: 400, height: 300 });
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb, type) => {
                cb(new Blob([new Uint8Array(1024)], { type }));
            },
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 2000 });

        expect(global.createImageBitmap).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
        expect(result.width).toBe(512);
        expect(result.height).toBe(512);
    });

    test('uses toDataURL fallback, Buffer decoding, and warns when target is missed', async () => {
        global.createImageBitmap = jest.fn(async () => createBitmap());
        mockFileReader();
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        global.atob = undefined;

        const base64Payload = Buffer.alloc(100).toString('base64');
        const { canvas } = mockCanvas({
            toDataURLImpl: () => `data:image/jpeg;base64,${base64Payload}`,
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 10 });

        expect(result.bytes).toBe(100);
        expect(result.dataUrl).toContain('data:image/jpeg;base64,');
        expect(warnSpy).toHaveBeenCalled();
    });

    test('throws when not running in a browser environment', async () => {
        jest.doMock('../src/utils/ssr.js', () => ({ isBrowser: false }));
        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');

        await expect(downsampleAndCompressToJpeg(null)).rejects.toThrow(
            'Image processing is only available in the browser.'
        );
    });

    test('throws when file input is invalid', async () => {
        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');

        await expect(downsampleAndCompressToJpeg({})).rejects.toThrow(
            'Expected a File to downsample.'
        );
    });

    test('throws when canvas context is missing', async () => {
        global.createImageBitmap = jest.fn(async () => createBitmap());
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb, type) => cb(new Blob([new Uint8Array(4)], { type })),
            withContext: false,
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Canvas rendering context is unavailable.'
        );
    });

    test('throws when image decoding fails in the fallback path', async () => {
        global.createImageBitmap = undefined;
        mockUrl();
        mockImage({ shouldError: true });

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Image failed to load.'
        );
    });

    test('throws when compression yields no size steps', async () => {
        const close = jest.fn();
        global.createImageBitmap = jest.fn(async () => createBitmap({ close }));
        mockFileReader();

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(
            downsampleAndCompressToJpeg(file, { maxSize: 0, minSize: 0, sizeStep: 1 })
        ).rejects.toThrow('Failed to compress image.');
        expect(close).toHaveBeenCalledTimes(1);
    });

    test('throws when canvas encoding fails', async () => {
        global.createImageBitmap = jest.fn(async () => createBitmap());
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb) => cb(null),
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Unable to encode image.'
        );
    });

    test('throws when FileReader returns a non-string result', async () => {
        global.createImageBitmap = jest.fn(async () => createBitmap());
        mockFileReader({ result: new ArrayBuffer(8) });

        const { canvas } = mockCanvas({
            toBlobImpl: (cb, type) => cb(new Blob([new Uint8Array(4)], { type })),
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Image preview is invalid.'
        );
    });

    test('throws when data URL is invalid', async () => {
        global.createImageBitmap = jest.fn(async () => createBitmap());
        mockFileReader();
        global.atob = undefined;

        const { canvas } = mockCanvas({
            toDataURLImpl: () => 'invalid-data-url',
        });

        mockCanvasElement(canvas);

        const { downsampleAndCompressToJpeg } = require('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow('Invalid data URL.');
    });
});
