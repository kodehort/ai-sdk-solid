import { cleanup, render } from '@solidjs/testing-library';
import { Component, JSX } from 'solid-js';
import { beforeEach, afterEach, vi } from 'vitest';

export const setupTestComponent = <P extends Record<string, any>>(
  TestComponent: Component<P>,
  {
    init,
  }: {
    init?: (TestComponent: Component<P>) => JSX.Element;
  } = {},
) => {
  beforeEach(() => {
    render(() => init?.(TestComponent) ?? <TestComponent {...({} as P)} />);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });
};
