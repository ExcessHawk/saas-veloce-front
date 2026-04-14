import { z } from 'zod';

export const createCourseSchema = z.object({
  classroomId: z.string().uuid('Selecciona un aula válida'),
  subjectId: z.string().uuid('Selecciona una materia válida'),
  academicYearId: z.string().uuid('Selecciona un año académico válido'),
  gradingConfig: z.record(z.unknown()).optional(),
});
