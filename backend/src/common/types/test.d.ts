// Vitest Snapshot v1, https://vitest.dev/guide/snapshot.html

declare module "vitest" {
  interface Assertion<T = any> extends jest.Matchers<T> {
    toMatchObject(expected: any): T;
    toHaveBeenCalledWith(expected: any): T;
    resolves: Assertion<Promise<T>>;
  }
}

export {};
