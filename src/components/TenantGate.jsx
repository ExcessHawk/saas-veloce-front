
import { useEffect } from 'react';

import { getSchoolSlug, resolveSchoolBySlug } from '@/lib/tenant';
import { useTenantStore } from '@/stores/tenantStore';

/**
 * Resolves the per-school subdomain (Model A) before rendering the app.
 *
 * - No school subdomain (apex / bare localhost) → status 'none' → render the app
 *   in single-URL mode (X-School-ID then comes from the login response).
 * - A school subdomain → resolve slug→school once, store it, and only then
 *   render the app so the very first API call already carries the right tenant.
 * - Unknown subdomain → a friendly "school not found" screen instead of a broken
 *   app hitting the API with no tenant.
 */
function StatusScreen({ title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-lg font-semibold">{title}</p>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function TenantGate({ children }) {
  const status = useTenantStore((s) => s.status);
  const set = useTenantStore((s) => s.set);

  useEffect(() => {
    const slug = getSchoolSlug();
    if (!slug) {
      set({ status: 'none' });
      return;
    }

    let alive = true;
    set({ status: 'loading', slug });

    resolveSchoolBySlug(slug)
      .then((school) => {
        if (!alive) return;
        if (!school) {
          set({ status: 'notfound', slug });
          return;
        }
        set({
          status: 'ready',
          slug: school.slug,
          schoolId: school.id,
          name: school.name,
          logoUrl: school.logoUrl ?? null,
        });
      })
      .catch(() => {
        if (alive) set({ status: 'error', slug });
      });

    return () => {
      alive = false;
    };
  }, [set]);

  if (status === 'idle' || status === 'loading') {
    return <StatusScreen title="Cargando…" />;
  }
  if (status === 'notfound') {
    return (
      <StatusScreen
        title="Escuela no encontrada"
        subtitle="Revisa la dirección. El subdominio no corresponde a ninguna escuela activa."
      />
    );
  }
  if (status === 'error') {
    return (
      <StatusScreen
        title="No se pudo cargar la escuela"
        subtitle="Error de conexión. Vuelve a intentar en unos momentos."
      />
    );
  }

  // 'none' (single-URL mode) or 'ready' (tenant resolved) → render the app.
  return children;
}
