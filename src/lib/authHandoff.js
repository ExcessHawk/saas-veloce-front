import { useAuthStore } from '@/stores/authStore';

/**
 * Cross-subdomain session handoff (Model B: login at apex → land on the school
 * subdomain). localStorage is per-origin, so the session can't carry over a
 * host change on its own — we pass it once in the URL *fragment* (never sent to
 * the server, not in Referer) and the destination consumes + strips it.
 *
 * SECURITY TRADEOFF: the refresh token rides in the fragment for one navigation.
 * It's removed from the address bar immediately via history.replaceState. For a
 * hardened prod setup, replace this with a single-use, short-TTL handoff code
 * exchanged server-side (no long-lived secret in any URL).
 */
const KEY = '__h';

function b64urlEncode(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(escape(atob(padded)));
}

/** Encode a login result into a fragment string (`__h=...`) for the redirect. */
export function buildHandoffHash({ accessToken, refreshToken, user, schoolId, memberId }) {
  const json = JSON.stringify({ a: accessToken, r: refreshToken, u: user, s: schoolId, m: memberId });
  return `${KEY}=${b64urlEncode(json)}`;
}

/**
 * On the destination subdomain: if the URL fragment carries a handoff, hydrate
 * the auth store and strip the fragment. Call once at startup, before render.
 */
export function consumeAuthHandoff() {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash.includes(`${KEY}=`)) return;

  const raw = new URLSearchParams(hash).get(KEY);
  if (raw) {
    try {
      const p = JSON.parse(b64urlDecode(raw));
      const store = useAuthStore.getState();
      store.setAuth({ accessToken: p.a, refreshToken: p.r, user: p.u });
      if (p.s) store.setSchoolId(p.s);
      if (p.m) store.setMemberId(p.m);
    } catch {
      /* malformed handoff — ignore, user just sees the login page */
    }
  }

  // Remove the fragment so the tokens don't linger in the address bar / history.
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}
