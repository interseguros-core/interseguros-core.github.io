export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

let idSequence = 0;

export function nextId(prefix) {
  idSequence += 1;
  return `${prefix}-${idSequence}`;
}
