import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'El nombre de la materia es requerido'),
  code: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});