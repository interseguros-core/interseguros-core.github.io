/*
 * Encoding for the public PlantUML rendering server
 * (https://www.plantuml.com/plantuml/svg/...).
 *
 * The server's *default* URL format expects the text deflate-compressed and
 * then packed with PlantUML's own base64-like alphabet — reimplementing
 * DEFLATE by hand in vanilla JS (no libraries allowed here) is exactly the
 * kind of fragile, hard-to-verify code this project avoids.
 *
 * PlantUML also documents a much simpler *uncompressed* format: prefix the
 * path with `~h` followed by the plain hex encoding of the UTF-8 text. No
 * compression involved, trivial to implement correctly, at the cost of a
 * longer URL (2 hex chars per byte). That's the one used here.
 */

const PLANTUML_SVG_ENDPOINT = 'https://www.plantuml.com/plantuml/svg/~h';
const PLANTUML_PNG_ENDPOINT = 'https://www.plantuml.com/plantuml/png/~h';

export function encodePlantUmlHex(text) {
  const bytes = new TextEncoder().encode(text);
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function buildPlantUmlSvgUrl(text) {
  return `${PLANTUML_SVG_ENDPOINT}${encodePlantUmlHex(text)}`;
}

export function buildPlantUmlPngUrl(text) {
  return `${PLANTUML_PNG_ENDPOINT}${encodePlantUmlHex(text)}`;
}
