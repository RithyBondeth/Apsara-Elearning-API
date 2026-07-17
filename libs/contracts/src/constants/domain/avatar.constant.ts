/**
 * The avatars a student can pick from. `users.avatar` stores one of these keys
 * — not a URL — so the artwork lives in the client and can be restyled or
 * re-themed without touching stored data.
 *
 * Keys are mirrored in the web app's `utils/constants/avatar.constant.ts`
 * — keep the two in sync.
 */
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

/** Used when a student has not picked one yet. */
export const DEFAULT_AVATAR: TAvatarPreset = 'rocket';
