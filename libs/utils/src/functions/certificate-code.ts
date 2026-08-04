import { randomInt } from 'crypto';

/**
 * Crockford base32 without I, L, O and U.
 *
 * Certificate codes get read off a printed page and typed into a verification
 * box by someone who has never seen it before, so the alphabet drops every
 * glyph pair that gets mistaken for another (I/1, O/0, L/1). U is excluded too
 * — it keeps accidental profanity out of generated codes.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const CERTIFICATE_CODE_PREFIX = 'APS';
const GROUPS = 3;
const GROUP_LENGTH = 4;

/**
 * A public certificate code, e.g. `APS-4K7M-QW2X-9BTF`.
 *
 * 12 random base32 characters is ~60 bits, so codes cannot be guessed or walked
 * — the verification endpoint is public and unauthenticated, and a sequential
 * id there would let anyone enumerate every certificate ever issued.
 *
 * `randomInt` is used rather than Math.random because this is a security
 * boundary, and it is unbiased across the alphabet.
 */
export function generateCertificateCode(): string {
  const groups = Array.from({ length: GROUPS }, () =>
    Array.from(
      { length: GROUP_LENGTH },
      () => ALPHABET[randomInt(ALPHABET.length)],
    ).join(''),
  );
  return [CERTIFICATE_CODE_PREFIX, ...groups].join('-');
}

/**
 * Accepts what a human actually types: any case, with or without the dashes.
 * Returns the canonical form, or null when it could not be a code at all.
 */
export function normalizeCertificateCode(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[\s-]/g, '');
  const body = cleaned.startsWith(CERTIFICATE_CODE_PREFIX)
    ? cleaned.slice(CERTIFICATE_CODE_PREFIX.length)
    : cleaned;

  if (body.length !== GROUPS * GROUP_LENGTH) return null;
  if (![...body].every((char) => ALPHABET.includes(char))) return null;

  const groups = Array.from({ length: GROUPS }, (_, i) =>
    body.slice(i * GROUP_LENGTH, (i + 1) * GROUP_LENGTH),
  );
  return [CERTIFICATE_CODE_PREFIX, ...groups].join('-');
}
