import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  isCurrent: z.boolean().optional().default(false),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  }
);

export const updateAcademicYearSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  startDate: z.string().min(1, 'La fecha de inicio es requerida'),
  endDate: z.string().min(1, 'La fecha de fin es requerida'),
  isCurrent: z.boolean().optional(),
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  }
);