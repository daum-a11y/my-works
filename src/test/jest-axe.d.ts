declare module 'jest-axe' {
  export function axe(container: Element | DocumentFragment): Promise<{
    violations: Array<unknown>;
  }>;

  export function toHaveNoViolations(): {
    compare(actual: { violations: Array<unknown> }): {
      pass: boolean;
      message(): string;
    };
  };
}
