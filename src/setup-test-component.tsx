import { cleanup, render } from "@solidjs/testing-library";
import type { Component, JSX } from "solid-js";
import { afterEach, beforeEach, vi } from "vitest";

export const setupTestComponent = <P extends Record<string, unknown>>(
  TestComponent: Component<P>,
  {
    init,
  }: {
    init?: (TestComponent: Component<P>) => JSX.Element;
  } = {}
) => {
  beforeEach(() => {
    render(() => init?.(TestComponent) ?? <TestComponent {...({} as P)} />);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });
};
