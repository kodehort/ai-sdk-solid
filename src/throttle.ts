import throttleFunction from "throttleit";

// biome-ignore lint/suspicious/noExplicitAny: generic function type requires any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  waitMs: number | undefined
): T {
  return waitMs != null ? throttleFunction(fn, waitMs) : fn;
}
