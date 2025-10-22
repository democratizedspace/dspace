import 'vitest';

declare module 'vitest' {
  interface VitestUtils {
    mock(
      path: string,
      factory: (...args: any[]) => unknown,
      options: { virtual?: boolean },
    ): void;
  }
}
