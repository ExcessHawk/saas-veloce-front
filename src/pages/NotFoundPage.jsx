import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * 404 — shown by the router catch-all instead of silently redirecting, so a
 * mistyped/stale URL is explained rather than bouncing the user to /dashboard.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-6 text-center">
      <p className="text-6xl font-bold tracking-tight text-muted-foreground">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          La dirección que buscas no existe o fue movida.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard"><ArrowLeft className="size-4" /> Ir al panel</Link>
        </Button>
        <Button asChild>
          <Link to="/"><Home className="size-4" /> Inicio</Link>
        </Button>
      </div>
    </div>
  );
}
