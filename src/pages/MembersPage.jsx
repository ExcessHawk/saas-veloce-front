import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Trash2, Users } from 'lucide-react';
import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { showApiError } from '@/lib/errors';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { RoleGate } from '@/components/RoleGate';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SearchInput } from '@/components/SearchInput';
import { DataTablePagination } from '@/components/DataTablePagination';
import { SortableHead } from '@/components/SortableHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

const ROLES = ['director', 'teacher', 'student', 'parent'];
const ROLE_LABELS = { director: 'Director', teacher: 'Docente', student: 'Estudiante', parent: 'Padre/Madre' };
const ROLE_VARIANTS = { director: 'default', teacher: 'secondary', student: 'outline', parent: 'outline' };

const inviteSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['director', 'teacher', 'student', 'parent']),
});

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function MembersPage() {
  const [open, setOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const members = useMembers();
  const inviteMember = useInviteMember();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const form = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'student' },
  });

  useEffect(() => {
    if (members.error) showApiError(members.error);
  }, [members.error]);

  const sorting = useSorting('fullName');

  const filtered = useMemo(() => {
    const data = members.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (m) =>
        (m.fullName || '').toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members.data, query]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const onSubmitInvite = async (data) => {
    try {
      await inviteMember.mutateAsync(data);
      form.reset();
      setOpen(false);
    } catch { /* handled by hook */ }
  };

  const onConfirmDelete = async () => {
    try {
      await removeMember.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Miembros</h1>
        </div>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) form.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" />Agregar Miembro</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar Miembro</DialogTitle></DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmitInvite)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="usuario@email.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">El usuario debe estar registrado en Pensum.</p>
                </div>
                <div>
                  <Label>Rol</Label>
                  <Select
                    defaultValue="student"
                    onValueChange={(v) => form.setValue('role', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={inviteMember.isPending}>
                  {inviteMember.isPending ? 'Agregando...' : 'Agregar Miembro'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, email o rol..." />

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="fullName" label="Nombre" sorting={sorting} />
            <SortableHead field="email" label="Email" sorting={sorting} />
            <SortableHead field="role" label="Rol" sorting={sorting} />
            <SortableHead field="joinedAt" label="Miembro desde" sorting={sorting} />
            <RoleGate roles={['director']}>
              <TableHead className="w-28">Acciones</TableHead>
            </RoleGate>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay miembros registrados'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">{getInitials(member.fullName)}</AvatarFallback>
                    </Avatar>
                    <span>{member.fullName || '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[member.role] ?? 'outline'}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {member.joinedAt ? format(new Date(member.joinedAt), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    {member.userId !== currentUser?.id && (
                      <div className="flex items-center gap-1">
                        <Select
                          value={member.role}
                          onValueChange={(role) => updateRole.mutate({ id: member.id, role })}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setDeletingItem(member)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!members.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar Miembro"
        description={`¿Estás seguro de que deseas eliminar a "${deletingItem?.fullName || deletingItem?.email}" de la escuela?`}
        isPending={removeMember.isPending}
      />
    </div>
  );
}
