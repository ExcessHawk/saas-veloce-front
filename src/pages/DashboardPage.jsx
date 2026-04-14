import { useAuthStore } from '@/stores/authStore';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useCourses } from '@/hooks/useCourses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DoorOpen, BookOpen, GraduationCap } from 'lucide-react';

const summaryCards = [
  { key: 'classrooms', label: 'Aulas', icon: DoorOpen },
  { key: 'subjects', label: 'Materias', icon: BookOpen },
  { key: 'courses', label: 'Cursos', icon: GraduationCap },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const courses = useCourses();

  const counts = {
    classrooms,
    subjects,
    courses,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Bienvenido, {user?.fullName || user?.email || 'Usuario'}
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map(({ key, label, icon: Icon }) => {
          const { data, isLoading } = counts[key];

          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-3xl font-bold">{data?.length ?? 0}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
