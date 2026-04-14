import { useEffect } from 'react';
import { useSchool } from '@/hooks/useSchool';
import { showApiError } from '@/lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { School } from 'lucide-react';

const fields = [
  { label: 'Nombre', key: 'name' },
  { label: 'Slug', key: 'slug' },
  { label: 'Dominio', key: 'domain' },
  { label: 'Email de Contacto', key: 'contactEmail' },
  { label: 'Teléfono', key: 'contactPhone' },
  { label: 'Zona Horaria', key: 'timezone' },
  { label: 'Locale', key: 'locale' },
  { label: 'País', key: 'country' },
];

export default function SchoolPage() {
  const { data: school, isLoading, error } = useSchool();

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <School className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Mi Escuela</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Escuela</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium">{school?.[key] ?? '—'}</p>
                </div>
              ))}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estado</p>
                <div>
                  <Badge variant={school?.status === 'active' ? 'default' : 'secondary'}>
                    {school?.status ?? '—'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
