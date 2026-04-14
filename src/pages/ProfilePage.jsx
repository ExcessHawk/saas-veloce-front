import { useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { showApiError } from '@/lib/errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { format } from 'date-fns';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(date) {
  if (!date) return '—';
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm');
  } catch {
    return '—';
  }
}

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  // CRITICAL: strip passwordHash before rendering (Req 15.4)
  const { passwordHash, ...safeProfile } = profile || {};

  const fields = [
    { label: 'Email', value: safeProfile.email },
    { label: 'Nombre Completo', value: safeProfile.fullName },
    { label: 'Teléfono', value: safeProfile.phone },
    { label: 'Estado', value: safeProfile.status, isBadge: true },
    { label: 'Último Login', value: formatDate(safeProfile.lastLoginAt) },
    { label: 'Total de Logins', value: safeProfile.loginCount },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={safeProfile.avatarUrl} alt={safeProfile.fullName ?? 'Avatar'} />
                  <AvatarFallback className="text-lg">{getInitials(safeProfile.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{safeProfile.fullName ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">{safeProfile.email ?? '—'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ label, value, isBadge }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {isBadge ? (
                      <div>
                        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                          {value ?? '—'}
                        </Badge>
                      </div>
                    ) : (
                      <p className="font-medium">{value ?? '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
