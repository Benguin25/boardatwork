/** URI-encodes inline SVG markup as a favicon `href` (SPEC §3.1: favicon follows the disguise). */
export function svgFavicon(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
