import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
  schoolId: z.string()
    .min(1, 'El ID de escuela es requerido')
    .uuid('El ID de escuela debe ser un UUID válido (ej: 550e8400-e29b-41d4-a716-446655440000)'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const provisionSchema = z.object({
  schoolName: z.string()
    .min(1, 'El nombre de la escuela es requerido')
    .max(100, 'Máximo 100 caracteres'),
  adminEmail: z.string()
    .min(1, 'El email es requerido')
    .email('Ingresa un email válido'),
  adminPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string()
    .min(1, 'Confirma tu contraseña'),
  planCode: z.string().optional(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});