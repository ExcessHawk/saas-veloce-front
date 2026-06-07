import { describe, it, expect } from 'vitest';

import { getSchoolSlug, schoolOrigin } from './tenant';

describe('getSchoolSlug', () => {
  it('returns null for bare localhost, IPs and apex domains', () => {
    expect(getSchoolSlug('localhost')).toBeNull();
    expect(getSchoolSlug('127.0.0.1')).toBeNull();
    expect(getSchoolSlug('tudominio.com')).toBeNull();
  });

  it('returns null for reserved infrastructure subdomains', () => {
    expect(getSchoolSlug('www.tudominio.com')).toBeNull();
    expect(getSchoolSlug('app.tudominio.com')).toBeNull();
    expect(getSchoolSlug('api.tudominio.com')).toBeNull();
    expect(getSchoolSlug('app.localhost')).toBeNull();
  });

  it('extracts the school slug from a subdomain (local + prod)', () => {
    expect(getSchoolSlug('acme.localhost')).toBe('acme');
    expect(getSchoolSlug('acme.tudominio.com')).toBe('acme');
    expect(getSchoolSlug('ACME.tudominio.com')).toBe('acme');
    expect(getSchoolSlug('colegio-sur.tudominio.com')).toBe('colegio-sur');
  });

  it('ignores the port', () => {
    expect(getSchoolSlug('acme.localhost:5173')).toBe('acme');
  });
});

describe('schoolOrigin', () => {
  it('builds the subdomain URL from the apex (local dev)', () => {
    expect(schoolOrigin('its-huetamo', { hostname: 'localhost', port: '5173', protocol: 'http:' }))
      .toBe('http://its-huetamo.localhost:5173');
  });

  it('builds from another school subdomain (swaps the label)', () => {
    expect(schoolOrigin('otra', { hostname: 'its-huetamo.localhost', port: '5173', protocol: 'http:' }))
      .toBe('http://otra.localhost:5173');
  });

  it('builds from a reserved subdomain (app → apex)', () => {
    expect(schoolOrigin('acme', { hostname: 'app.tudominio.com', port: '', protocol: 'https:' }))
      .toBe('https://acme.tudominio.com');
  });

  it('builds from the bare apex domain', () => {
    expect(schoolOrigin('acme', { hostname: 'tudominio.com', port: '', protocol: 'https:' }))
      .toBe('https://acme.tudominio.com');
  });
});
