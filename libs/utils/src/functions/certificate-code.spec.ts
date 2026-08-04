import {
  CERTIFICATE_CODE_PREFIX,
  generateCertificateCode,
  normalizeCertificateCode,
} from './certificate-code';

describe('generateCertificateCode', () => {
  it('formats as APS-XXXX-XXXX-XXXX', () => {
    expect(generateCertificateCode()).toMatch(
      /^APS-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/,
    );
  });

  it('never emits glyphs that get misread off a printed page', () => {
    // I/1, L/1, O/0 are the classic transcription errors; U is dropped so
    // generated codes can't spell something unfortunate.
    const codes = Array.from({ length: 300 }, generateCertificateCode).join('');
    for (const banned of ['I', 'L', 'O', 'U']) {
      expect(codes).not.toContain(banned);
    }
  });

  it('does not repeat itself', () => {
    // ~60 bits of entropy: a collision across 500 draws would mean the
    // generator is not actually random.
    const codes = new Set(Array.from({ length: 500 }, generateCertificateCode));
    expect(codes.size).toBe(500);
  });
});

describe('normalizeCertificateCode', () => {
  const CODE = 'APS-4K7M-QW2X-9BTF';

  it('accepts the canonical form', () => {
    expect(normalizeCertificateCode(CODE)).toBe(CODE);
  });

  it('accepts what someone actually types', () => {
    expect(normalizeCertificateCode('aps-4k7m-qw2x-9btf')).toBe(CODE);
    expect(normalizeCertificateCode('APS4K7MQW2X9BTF')).toBe(CODE);
    expect(normalizeCertificateCode('  4K7M QW2X 9BTF  ')).toBe(CODE);
  });

  it('rejects a code of the wrong length', () => {
    expect(normalizeCertificateCode('APS-4K7M-QW2X')).toBeNull();
    expect(normalizeCertificateCode('APS-4K7M-QW2X-9BTF-EXTRA')).toBeNull();
  });

  it('rejects characters outside the alphabet', () => {
    // 'I' is not in the alphabet, so this cannot be a real code.
    expect(normalizeCertificateCode('APS-4K7I-QW2X-9BTF')).toBeNull();
    expect(normalizeCertificateCode('APS-4K7!-QW2X-9BTF')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(normalizeCertificateCode('')).toBeNull();
    expect(normalizeCertificateCode('   ')).toBeNull();
  });

  it('round-trips whatever the generator produces', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCertificateCode();
      expect(normalizeCertificateCode(code)).toBe(code);
      expect(normalizeCertificateCode(code.replace(/-/g, ''))).toBe(code);
    }
  });

  it('exposes the prefix it brands codes with', () => {
    expect(generateCertificateCode().startsWith(CERTIFICATE_CODE_PREFIX)).toBe(
      true,
    );
  });
});
