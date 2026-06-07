import { create } from 'zustand';

/**
 * Tenant resolved from the URL subdomain (Model A). This is the authoritative
 * school context for the current browser tab: `schoolId` here drives the
 * `X-School-ID` header (see lib/axios.js), taking precedence over whatever the
 * login response stored. Not persisted — it's re-derived from the hostname on
 * every load.
 *
 * status: 'idle'     — not resolved yet
 *         'loading'  — fetching by-slug
 *         'ready'    — school found (schoolId set)
 *         'notfound' — subdomain has no matching school
 *         'none'     — no school subdomain (apex / bare localhost): single-URL mode
 *         'error'    — network/server error resolving
 */
export const useTenantStore = create((set) => ({
  status: 'idle',
  slug: null,
  schoolId: null,
  name: null,
  logoUrl: null,
  set: (patch) => set(patch),
}));
