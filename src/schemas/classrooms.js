import {z} from 'zod'


export const createClassroomSchema = z.object({
  name: z.string().min(1, 'El nombre del aula es requerido'),
  gradeLevel: z.string().optional(),
});

export const updateClassroomSchema = z.object({
  name: z.string().min(1, 'El nombre del aula es requerido'),
  gradeLevel: z.string().optional(),
});