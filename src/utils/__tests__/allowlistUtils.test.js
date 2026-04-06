import { normalizeHost, isHostAllowed } from '../allowlistUtils';

describe('normalizeHost', () => {
  test('lowercases input', () => {
    expect(normalizeHost('LocalHost')).toBe('localhost');
  });
  test('strips port', () => {
    expect(normalizeHost('localhost:3000')).toBe('localhost');
  });
  test('strips protocol prefix', () => {
    expect(normalizeHost('https://example.com')).toBe('example.com');
  });
  test('strips trailing slash', () => {
    expect(normalizeHost('example.com/')).toBe('example.com');
  });
  test('returns empty string for falsy input', () => {
    expect(normalizeHost('')).toBe('');
    expect(normalizeHost(null)).toBe('');
  });
});

describe('isHostAllowed', () => {
  test('global wildcard allows everything', () => {
    expect(isHostAllowed('https://anything.com', ['*'])).toBe(true);
  });
  test('exact match works', () => {
    expect(isHostAllowed('http://localhost/dvwa', ['localhost'])).toBe(true);
  });
  test('subdomain wildcard matches sub', () => {
    expect(isHostAllowed('https://app.example.com', ['*.example.com'])).toBe(true);
  });
  test('subdomain wildcard does not match unrelated host', () => {
    expect(isHostAllowed('https://evil.com', ['*.example.com'])).toBe(false);
  });
  test('returns false when allowlist is empty', () => {
    expect(isHostAllowed('https://localhost', [])).toBe(false);
  });
  test('invalid URL returns false gracefully', () => {
    expect(isHostAllowed('not-a-url', ['localhost'])).toBe(false);
  });
});
