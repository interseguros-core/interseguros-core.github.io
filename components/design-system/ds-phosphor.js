/*
 * Single source of truth for iconography in the Design System.
 * Phosphor Icons is the only icon library used here — see ds-icons.js for
 * the full reference gallery. Icons render as an icon-font glyph (<i>), so
 * color always comes from currentColor and size from the --icon-* tokens
 * (assets/css/ds/tokens.css), never from arbitrary values.
 *
 * ICON_NAMES maps short, action-based keys (used as component attributes,
 * e.g. icon="download") to the official Phosphor icon slug, so the same
 * action always renders the same icon everywhere in the Design System.
 */
export const ICON_NAMES = {
  // Standard actions (spec table) — the short key is what components accept
  // as their `icon` attribute; every alias for the same action resolves to
  // the same Phosphor slug on purpose.
  edit: 'pencil',
  pencil: 'pencil',
  delete: 'trash',
  trash: 'trash',
  search: 'magnifying-glass',
  'magnifying-glass': 'magnifying-glass',
  add: 'plus',
  plus: 'plus',
  settings: 'gear',
  gear: 'gear',
  close: 'x',
  x: 'x',
  download: 'download-simple',
  upload: 'upload-simple',
  'more-vertical': 'dots-three-vertical',
  user: 'user',
  users: 'users',
  view: 'eye',
  eye: 'eye',

  // Other icons already in use across the Design System.
  check: 'check',
  'arrow-right': 'arrow-right',
  info: 'info',
  warning: 'warning',
  'warning-circle': 'warning-circle',
  'check-circle': 'check-circle',
  'x-circle': 'x-circle',
  'caret-down': 'caret-down',
  'caret-left': 'caret-left',
  'caret-right': 'caret-right',
  home: 'house',
  star: 'star',
  'shield-check': 'shield-check',
  heart: 'heart',
  bell: 'bell',
  'sort-ascending': 'sort-ascending',
  'sort-descending': 'sort-descending',
  'caret-up-down': 'caret-up-down',
  file: 'file',

  // Module icons — sidebar principal (ds-layout.js).
  dashboard: 'squares-four',
  'squares-four': 'squares-four',
  buildings: 'buildings',
  insurers: 'buildings',
  certificate: 'certificate',
  claims: 'siren',
  siren: 'siren',
};

const WEIGHT_CLASS = {
  regular: 'ph',
  bold: 'ph-bold',
  fill: 'ph-fill',
  duotone: 'ph-duotone',
};

/**
 * @param {keyof typeof ICON_NAMES | string} name short key from ICON_NAMES, or a raw Phosphor slug
 * @param {{size?: 'xs'|'sm'|'md'|'lg'|'xl', weight?: 'regular'|'bold'|'fill'|'duotone', className?: string}} [options]
 */
export function phosphorIcon(name, { size = 'md', weight = 'regular', className = '' } = {}) {
  const slug = ICON_NAMES[name] ?? name;
  if (!slug) return '';
  const weightClass = WEIGHT_CLASS[weight] ?? WEIGHT_CLASS.regular;
  return `<i class="${weightClass} ph-${slug} icon-${size} ${className}" aria-hidden="true"></i>`;
}
