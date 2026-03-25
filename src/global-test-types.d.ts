declare module "jest-axe" {
  export function axe(
    container: Element | DocumentFragment,
    options?: unknown,
  ): Promise<{ violations: unknown[] }>;

  export function toHaveNoViolations(result: { violations: unknown[] }): {
    pass: boolean;
    message: () => string;
  };
}

import "vitest";

declare module "vitest" {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
