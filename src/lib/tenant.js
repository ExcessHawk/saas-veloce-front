import axios from 'axios';

/**
 * Per-school subdomain helpers (Model A — subdomain-first tenancy).
 *
 * The school is identified by the first label of the hostname:
 *   acme.localhost           → "acme"
 *   acme.tudominio.com       → "acme"
 * and there is NO school subdomain (single-URL / apex mode) for:
 *   localhost · 127.0.0.1 · tudominio.com · www|app|admin|api.tudominio.com
 */

// Labels that are infrastructure, not schools.
const RESERVED = new Set(['www', 'app', 'admin', 'api', 'dashboard', 'static', 'cdn']);

/**
 * Derive the school slug from a hostname, or null when there's no school
 * subdomain. Pure — pass a hostname in tests.
 */
export function getSchoolSlug(hostname = window.location.hostname) {
  const host = hostname.split(':')[0].toLowerCase();
  if (host === 'localhost') return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // bare IPv4

  const labels = host.split('.');
  const isLocalhost = labels[labels.length - 1] === 'localhost';
  // Need sub.localhost (2 labels) or sub.domain.tld (3+ labels).
  const minLabels = isLocalhost ? 2 : 3;
  if (labels.length < minLabels) return null;

  const slug = labels[0];
  if (RESERVED.has(slug)) return null;
  return slug;
}

/**
 * Build the absolute origin for a school's subdomain, based on the current
 * location. Works from the apex (localhost → its-huetamo.localhost:5173) and
 * from another subdomain (swaps the first label). Keeps the current port +
 * protocol so it's correct in dev and prod.
 */
export function schoolOrigin(
  slug,
  { hostname = window.location.hostname, port = window.location.port, protocol = window.location.protocol } = {},
) {
  const host = hostname.split(':')[0].toLowerCase();
  const labels = host.split('.');
  // Drop the first label when it's a school subdomain or a reserved infra label
  // (www/app/admin/api), so the base is the real apex; otherwise keep the whole
  // host (it already is the apex).
  const first = labels[0];
  const strip = labels.length > 1 && (getSchoolSlug(host) !== null || RESERVED.has(first));
  const baseLabels = strip ? labels.slice(1) : labels;
  const base = baseLabels.join('.');
  const portPart = port ? `:${port}` : '';
  return `${protocol}//${slug}.${base}${portPart}`;
}

/**
 * Resolve a slug to its school via the public endpoint. Returns the school
 * object `{ id, name, slug, logoUrl, locale }`, or null when it doesn't exist
 * (404/400). Re-throws on network / 5xx so the caller can show a retry state.
 */
export async function resolveSchoolBySlug(slug) {
  const base = import.meta.env.VITE_API_URL ?? '';
  try {
    const { data } = await axios.get(
      `${base}/api/public/schools/by-slug/${encodeURIComponent(slug)}`,
    );
    return data;
  } catch (err) {
    if (err.response && (err.response.status === 404 || err.response.status === 400)) {
      return null;
    }
    throw err;
  }
}
