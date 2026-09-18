export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** React's KeyboardEvent key for "+" varies by layout; normalize. */
export function isPlusKey(key: string): boolean {
  return key === "+" || key === "=" || key === "numadd";
}

export function isMinusKey(key: string): boolean {
  return key === "-" || key === "numsub";
}