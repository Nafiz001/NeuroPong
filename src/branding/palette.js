// JS mirror of branding/tokens.css. Consumed by Three.js materials and shader
// uniforms so the 3D scene matches the DOM palette exactly.

export const BRAND = {
  primary:   '#8B5CF6',
  secondary: '#0EA5E9',
  accent:    '#FBBF24'
};

export const VOLTARI = {
  id: 'voltari',
  name: 'VOLTARI',
  tagline: 'CALCULATED STORMS',
  agentHint: 'Minimax',
  owner: 'Nafiz',
  c600: '#6D28D9',
  c500: '#7C3AED',
  c400: '#A855F7',
  c300: '#C084FC',
  c200: '#DDD6FE',
  glow: '#7C3AED',
  glowRgba: 'rgba(124, 58, 237, 0.55)'
};

export const EMBERLYNX = {
  id: 'emberlynx',
  name: 'EMBER LYNX',
  tagline: 'INSTINCT BURNS BRIGHT',
  agentHint: 'Fuzzy',
  owner: 'Dewan',
  c600: '#C2410C',
  c500: '#F97316',
  c400: '#FB923C',
  c300: '#FDBA74',
  c200: '#FFEDD5',
  glow: '#F97316',
  glowRgba: 'rgba(249, 115, 22, 0.55)'
};

export const SURFACE = {
  bg0: '#05070D',
  bg1: '#0B0F1A',
  bg2: '#11172A',
  stroke1: 'rgba(255, 255, 255, 0.08)',
  stroke2: 'rgba(255, 255, 255, 0.16)'
};

export const TEXT = {
  hi: '#F8FAFC',
  md: '#CBD5E1',
  lo: '#64748B'
};

export const SEMANTIC = {
  success: '#10B981',
  warn:    '#F59E0B',
  danger:  '#EF4444',
  info:    '#22D3EE'
};

// The faction that owns each side of the table. Agent identity (minimax vs
// fuzzy) is independent and can be swapped per match; the faction visual
// identity stays tied to the side color.
export const SIDE_FACTION = {
  left:  VOLTARI,
  right: EMBERLYNX
};

export function factionForSide(side) {
  return SIDE_FACTION[side] ?? VOLTARI;
}
