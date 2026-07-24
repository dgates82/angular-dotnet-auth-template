import { ObfuscateEmailPipe } from './obfuscate-email.pipe';

describe('ObfuscateEmailPipe', () => {
  const pipe = new ObfuscateEmailPipe();

  it('keeps the first two characters of the username and masks the rest', () => {
    expect(pipe.transform('johndoe@example.com')).toBe('jo*****@example.com');
  });

  it('preserves the domain unchanged', () => {
    expect(pipe.transform('ab@example.com')).toBe('ab@example.com');
  });

  it('returns an empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
