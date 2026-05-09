import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useGrades(courseId) {
  return useQuery({
    queryKey: ['grades', courseId],
    queryFn: () => api.get(`/api/courses/${courseId}/grades`).then((r) => r.data),
    enabled: !!courseId,
  });
}

export async function downloadGradesCSV(courseId, filename = 'calificaciones') {
  const { data } = await api.get(`/api/courses/${courseId}/grades/export`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
