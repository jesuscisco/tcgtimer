/** Parse hex (#fff, #ffffff) into {r,g,b} 0-255. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** hex → rgba() string. Used for overlays and layered colors. */
export function hexToRgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

/** Normalize any color input to a valid hex for <input type=color>. */
export function toHex(color: string): string {
  const m = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return `#${h.toLowerCase()}`;
  }
  const rgb = hexToRgba(color === "transparent" ? "#000000" : color, 1);
  const m2 = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m2) {
    return `#${[m2[1], m2[2], m2[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return "#000000";
}

/** Check whether a string looks like a solid hex color. */
export function isHex(color: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim());
}

export function contrastText(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
  return luminance > 150 ? "#0f172a" : "#ffffff";
}