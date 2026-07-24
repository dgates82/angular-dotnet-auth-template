import { ObfuscatePhonePipe } from './obfuscate-phone.pipe';

describe('ObfuscatePhonePipe', () => {
  const pipe = new ObfuscatePhonePipe();

  it('keeps only the last four digits visible', () => {
    expect(pipe.transform('5551234567')).toBe('***-***-4567');
  });

  it('returns an empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
