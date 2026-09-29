/* =============================================================================
 * brand — the learn-alpine mark, in one place.
 *
 * An original twin-peak mark drawn for this course: a lit summit in the course
 * mint with a snow cap, a violet range behind it, and a small sun. It is
 * deliberately NOT the Alpine.js logo: that mark is a trademark of the Alpine
 * project (the framework's *code* is MIT, its logo is not), and a community
 * course should not imply it is official.
 *
 * Two forms, because one does not fit both jobs:
 *   - logoMark(): two peaks, snow cap, sun — use at 24px and above;
 *   - faviconSvg(): one peak, no back range — at 16px the twin peaks collapse
 *     into mush, so the favicon trades detail for legibility.
 *
 * index.html inlines the same paths; keep the two in step.
 * ========================================================================== */

const MARK = {
  front: ['M12.4 10.2', 'L21.6 26', 'H3.2', 'Z'],
  back: ['M21.4 13.2', 'L29 26', 'H13.8', 'Z'],
  snow: ['M12.4 10.2', 'L14.96 14.6', 'L9.84 14.6', 'Z'],
  sun: { cx: 24.4, cy: 9.4, r: 2.3 }
}

/** The full mark as SVG markup. `cls` styles it (default: the sidebar logo class). */
export function logoMark(cls = 'logo') {
  const p = (pts, fill) => `<path d="${pts.join(' ')}" fill="${fill}"/>`
  return `<svg class="${cls}" viewBox="0 0 32 32" role="img" aria-label="learn-alpine">
  <defs>
    <linearGradient id="laFront" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#5eead4"/>
    </linearGradient>
    <linearGradient id="laBack" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#7c5cf0"/><stop offset="1" stop-color="#b39dff"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="9" fill="#0f1729"/>
  <rect x=".5" y=".5" width="31" height="31" rx="8.5" fill="none" stroke="#253253"/>
  <circle cx="${MARK.sun.cx}" cy="${MARK.sun.cy}" r="${MARK.sun.r}" fill="#5eead4"/>
  ${p(MARK.back, 'url(#laBack)')}
  ${p(MARK.front, 'url(#laFront)')}
  ${p(MARK.snow, '#f2fffd')}
</svg>`
}

/** The favicon form (no gradients, no second peak) as an SVG source string. */
export function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">`
    + `<rect width="32" height="32" rx="9" fill="#0f1729"/>`
    + `<path d="M16 5.5 L29 27.5 H3 Z" fill="#5eead4"/>`
    + `<path d="M16 5.5 L19.1 11.5 H12.9 Z" fill="#f2fffd"/>`
    + `</svg>`
}

/** The favicon as a data: URI for <link rel="icon">. */
export function faviconDataUri() {
  return 'data:image/svg+xml,' + encodeURIComponent(faviconSvg().replace(/\n\s*/g, ' ').trim())
}
