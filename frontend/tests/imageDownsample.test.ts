import { Buffer } from 'node:buffer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATA_URL = `data:image/jpeg;base64,${Buffer.from('ok').toString('base64')}`;

const originalGlobals = {
    createImageBitmap: globalThis.createImageBitmap,
    Image: globalThis.Image,
    FileReader: globalThis.FileReader,
    atob: globalThis.atob,
    Buffer: globalThis.Buffer,
    urlCreateObjectURL: globalThis.URL?.createObjectURL,
    urlRevokeObjectURL: globalThis.URL?.revokeObjectURL,
};

function mockFileReader({ result = DEFAULT_DATA_URL, error = null } = {}) {
    globalThis.FileReader = class {
        result: string | ArrayBuffer | null;
        error: Error | null;
        onload: (() => void) | null;
        onerror: (() => void) | null;

        constructor() {
            this.result = null;
            this.error = null;
            this.onload = null;
            this.onerror = null;
        }

        readAsDataURL(blob: Blob) {
            if (error) {
                this.error = error;
                this.onerror?.();
                return;
            }

            this.result =
                typeof result === 'function'
                    ? result(blob)
                    : (result ??
                      `data:${blob.type};base64,${Buffer.from('ok').toString('base64')}`);
            this.onload?.();
        }
    } as typeof FileReader;
}

function mockCanvas({ toBlobImpl, toDataURLImpl, withContext = true } = {}) {
    const context = withContext
        ? {
              fillStyle: '',
              fillRect: vi.fn(),
              drawImage: vi.fn(),
          }
        : null;

    const canvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => context),
    };

    if (toBlobImpl) {
        canvas.toBlob = vi.fn(toBlobImpl);
    }

    if (toDataURLImpl) {
        canvas.toDataURL = vi.fn(toDataURLImpl);
    }

    return { canvas, context };
}

function mockImage({ width = 320, height = 240, shouldError = false } = {}) {
    globalThis.Image = class {
        onload: (() => void) | null;
        onerror: (() => void) | null;
        naturalWidth: number;
        naturalHeight: number;
        width: number;
        height: number;

        constructor() {
            this.onload = null;
            this.onerror = null;
            this.naturalWidth = width;
            this.naturalHeight = height;
            this.width = width;
            this.height = height;
        }

        set src(_value: string) {
            if (shouldError) {
                this.onerror?.();
                return;
            }

            this.onload?.();
        }
    } as typeof Image;
}

function mockUrl() {
    if (!globalThis.URL) {
        globalThis.URL = {} as typeof URL;
    }
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview');
    globalThis.URL.revokeObjectURL = vi.fn();
}

function createBitmap({ width = 1024, height = 768, close = vi.fn() } = {}) {
    return {
        width,
        height,
        close,
    };
}

function mockCanvasElement(canvas: HTMLCanvasElement) {
    const originalCreateElement = document.createElement.bind(document);
    return vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') {
            return canvas;
        }
        return originalCreateElement(tag);
    });
}

beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    globalThis.createImageBitmap = originalGlobals.createImageBitmap;
    globalThis.Image = originalGlobals.Image;
    globalThis.FileReader = originalGlobals.FileReader;
    globalThis.atob = originalGlobals.atob;
    globalThis.Buffer = originalGlobals.Buffer;
    if (globalThis.URL) {
        globalThis.URL.createObjectURL = originalGlobals.urlCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalGlobals.urlRevokeObjectURL;
    }
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unmock('../src/utils/ssr.js');
    globalThis.createImageBitmap = originalGlobals.createImageBitmap;
    globalThis.Image = originalGlobals.Image;
    globalThis.FileReader = originalGlobals.FileReader;
    globalThis.atob = originalGlobals.atob;
    globalThis.Buffer = originalGlobals.Buffer;
    if (globalThis.URL) {
        globalThis.URL.createObjectURL = originalGlobals.urlCreateObjectURL;
        globalThis.URL.revokeObjectURL = originalGlobals.urlRevokeObjectURL;
    }
});

describe('downsampleAndCompressToJpeg', () => {
    it('processes images with createImageBitmap and toBlob', async () => {
        const close = vi.fn();
        globalThis.createImageBitmap = vi.fn(async () => createBitmap({ close }));
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob) => void, type: string, quality: number) => {
                const size = Math.max(1, Math.round(60000 * (1 - quality)));
                cb(new Blob([new Uint8Array(size)], { type }));
            },
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 60000 });

        expect(globalThis.createImageBitmap).toHaveBeenCalledWith(file, {
            imageOrientation: 'from-image',
        });
        expect(close).toHaveBeenCalledTimes(1);
        expect(result.dataUrl).toContain('data:image/jpeg;base64,');
        expect(result.width).toBe(512);
        expect(result.height).toBe(512);
        expect(result.bytes).toBeGreaterThan(0);
    });

    it('falls back to <img> decoding when createImageBitmap fails', async () => {
        globalThis.createImageBitmap = vi.fn(async () => {
            throw new Error('bitmap not supported');
        });
        mockUrl();
        mockImage({ width: 400, height: 300 });
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob) => void, type: string) => {
                cb(new Blob([new Uint8Array(1024)], { type }));
            },
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 2000 });

        expect(globalThis.createImageBitmap).toHaveBeenCalled();
        expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
        expect(result.width).toBe(512);
        expect(result.height).toBe(512);
    });

    it('uses toDataURL fallback, Buffer decoding, and warns when target is missed', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader();
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        globalThis.atob = undefined;

        const base64Payload = Buffer.alloc(100).toString('base64');
        const { canvas } = mockCanvas({
            toDataURLImpl: () => `data:image/jpeg;base64,${base64Payload}`,
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        const result = await downsampleAndCompressToJpeg(file, { targetBytes: 10 });

        expect(result.bytes).toBe(100);
        expect(result.dataUrl).toContain('data:image/jpeg;base64,');
        expect(warnSpy).toHaveBeenCalled();
    });

    it('throws when not running in a browser environment', async () => {
        vi.doMock('../src/utils/ssr.js', () => ({ isBrowser: false }));
        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');

        await expect(downsampleAndCompressToJpeg(null)).rejects.toThrow(
            'Image processing is only available in the browser.'
        );
    });

    it('throws when file input is invalid', async () => {
        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');

        await expect(downsampleAndCompressToJpeg({})).rejects.toThrow(
            'Expected a File to downsample.'
        );
    });

    it('throws when canvas context is missing', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob) => void, type: string) =>
                cb(new Blob([new Uint8Array(4)], { type })),
            withContext: false,
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Canvas rendering context is unavailable.'
        );
    });

    it('throws when image decoding fails in the fallback path', async () => {
        globalThis.createImageBitmap = undefined;
        mockUrl();
        mockImage({ shouldError: true });

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow('Image failed to load.');
    });

    it('throws when compression yields no size steps', async () => {
        const close = vi.fn();
        globalThis.createImageBitmap = vi.fn(async () => createBitmap({ close }));
        mockFileReader();

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(
            downsampleAndCompressToJpeg(file, { maxSize: 0, minSize: 0, sizeStep: 1 })
        ).rejects.toThrow('Failed to compress image.');
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('throws when canvas encoding fails', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader();

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob | null) => void) => cb(null),
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow('Unable to encode image.');
    });

    it('throws when FileReader returns a non-string result', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader({ result: new ArrayBuffer(8) });

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob) => void, type: string) =>
                cb(new Blob([new Uint8Array(4)], { type })),
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Image preview is invalid.'
        );
    });

    it('throws when FileReader fails to load', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader({ error: new Error('Reader failed') });

        const { canvas } = mockCanvas({
            toBlobImpl: (cb: (blob: Blob) => void, type: string) =>
                cb(new Blob([new Uint8Array(4)], { type })),
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow('Reader failed');
    });

    it('throws when data URL is invalid', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        mockFileReader();
        globalThis.atob = undefined;

        const { canvas } = mockCanvas({
            toDataURLImpl: () => 'invalid-data-url',
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow('Invalid data URL.');
    });

    it('throws when base64 decoding is unavailable', async () => {
        globalThis.createImageBitmap = vi.fn(async () => createBitmap());
        const base64Payload = Buffer.from('data').toString('base64');
        globalThis.atob = undefined;
        globalThis.Buffer = undefined;
        const { canvas } = mockCanvas({
            toDataURLImpl: () => `data:image/jpeg;base64,${base64Payload}`,
        });

        mockCanvasElement(canvas as HTMLCanvasElement);

        const { downsampleAndCompressToJpeg } = await import('../src/utils/imageDownsample.js');
        const file = new File(['demo'], 'demo.jpg', { type: 'image/jpeg' });

        await expect(downsampleAndCompressToJpeg(file)).rejects.toThrow(
            'Base64 decoding is not available in this environment.'
        );
    });
});
