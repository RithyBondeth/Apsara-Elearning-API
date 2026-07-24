export const AVATAR_PRESETS = [
  'rocket',
  'star',
  'flower',
  'cat',
  'bird',
  'fish',
  'ghost',
  'bot',
  'brain',
  'flame',
  'leaf',
  'music',
] as const;

export type TAvatarPreset = (typeof AVATAR_PRESETS)[number];

export const DEFAULT_AVATAR: TAvatarPreset = 'rocket';
