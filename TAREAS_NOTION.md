# Tareas Frontend SaaS Educativo — Para Notion

## Estructura de la tabla

| Columna | Tipo | Opciones |
|---------|------|----------|
| Tarea | Título | — |
| Status | Select | Pendiente, En Progreso, Completada, Bloqueada |
| Módulo | Select | Scaffolding, Auth, HTTP Client, Routing, Layout, Dashboard, Classrooms, Subjects, Courses, Academic Years, School, Profile, Errors, Validación |
| Etiquetas | Multi-select | setup, auth, ui, api, forms, rbac, state, routing, validation, error-handling |
| Prioridad | Select | Alta, Media, Baja |
| Tipo | Select | Tarea Principal, Subtarea |
| Tarea Padre | Relación (a la misma tabla) | — |
| Responsable | Persona | — |

---

## 1. Scaffolding del proyecto React + Vite

| Campo | Valor |
|-------|-------|
| Módulo | Scaffolding |
| Etiquetas | setup |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear el proyecto React 19 con Vite en `saas/frontend_saas/`. Instalar todas las dependencias y configurar la estructura base.

### Qué hacer

1. Ejecutar `npm create vite@latest frontend_saas -- --template react`
2. Instalar dependencias:
   ```bash
   npm install react-router@7 @tanstack/react-query zustand react-hook-form @hookform/resolvers zod axios date-fns lucide-react
   npm install -D tailwindcss@4 @tailwindcss/vite
   ```
3. Configurar shadcn/ui (seguir docs oficiales para Vite + JS)
4. Crear `.env.example` con `VITE_API_URL=http://localhost:3000`
5. Configurar alias `@/` → `src/` en `vite.config.js`
6. Crear estructura de carpetas

### Estructura de carpetas

```
src/
├── components/
│   └── ui/          ← componentes shadcn/ui
├── hooks/
├── layouts/
├── lib/
├── pages/
├── routes/
├── schemas/
└── stores/
```

### Ejemplo de vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Subtareas


#### 1.1 Inicializar proyecto Vite + React

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 1. Scaffolding del proyecto React + Vite |

Ejecutar `npm create vite@latest` con template react. Verificar que `npm run dev` arranca sin errores.

#### 1.2 Instalar dependencias del stack

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 1. Scaffolding del proyecto React + Vite |

Instalar: react-router@7, @tanstack/react-query, zustand, react-hook-form, @hookform/resolvers, zod, axios, date-fns, lucide-react, tailwindcss@4, shadcn/ui.

#### 1.3 Configurar Tailwind CSS 4 + shadcn/ui

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 1. Scaffolding del proyecto React + Vite |

Configurar Tailwind con el plugin de Vite. Inicializar shadcn/ui con `npx shadcn@latest init`. Instalar componentes base: Button, Input, Label, Card, Dialog, Table, Toast, Skeleton, Select, Checkbox.

#### 1.4 Crear estructura de carpetas y alias

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 1. Scaffolding del proyecto React + Vite |

Crear los directorios: components/, hooks/, layouts/, lib/, pages/, routes/, schemas/, stores/. Configurar alias `@/` en vite.config.js y jsconfig.json.

---

## 2. Cliente HTTP (Axios) con interceptores

| Campo | Valor |
|-------|-------|
| Módulo | HTTP Client |
| Etiquetas | api, auth |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear `src/lib/axios.js` con una instancia de Axios que inyecte automáticamente los headers de autenticación y tenant en cada petición, y maneje el refresh automático de tokens cuando recibe un 401.

### Qué hacer

1. Crear instancia Axios con `baseURL: import.meta.env.VITE_API_URL`
2. Interceptor de request: leer `accessToken` y `schoolId` del authStore e inyectar headers
3. Interceptor de response: manejar 401 con cola de refresh

### Ejemplo completo

```javascript
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor — inyecta headers
api.interceptors.request.use((config) => {
  const { accessToken, schoolId } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (schoolId) config.headers['X-School-ID'] = schoolId;
  return config;
});

// Response interceptor — refresh queue para 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { refreshToken } = useAuthStore.getState();
        // IMPORTANTE: usar axios directo, NO api, para evitar bucle infinito
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken }
        );
        useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Subtareas

#### 2.1 Crear instancia base de Axios

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 2. Cliente HTTP (Axios) con interceptores |

Crear `src/lib/axios.js` con `axios.create({ baseURL: import.meta.env.VITE_API_URL })`.

#### 2.2 Implementar request interceptor

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 2. Cliente HTTP (Axios) con interceptores |

Inyectar `Authorization: Bearer <token>` y `X-School-ID: <uuid>` leyendo del authStore.

#### 2.3 Implementar response interceptor con refresh queue

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 2. Cliente HTTP (Axios) con interceptores |

Manejar 401: intentar refresh, encolar peticiones concurrentes, redirigir a /login si falla. Usar `axios.post` directo (no `api`) para el refresh.

#### 2.4 Crear función extractErrorMessage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 2. Cliente HTTP (Axios) con interceptores |

```javascript
export function extractErrorMessage(error) {
  if (error.response?.data?.error) return error.response.data.error;
  if (error.request && !error.response) return 'Error de conexión. Verifica tu conexión a internet.';
  return 'Ha ocurrido un error inesperado.';
}
```

---

## 3. Auth Store (Zustand con persist)

| Campo | Valor |
|-------|-------|
| Módulo | Auth |
| Etiquetas | auth, state |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear `src/stores/authStore.js` con Zustand y middleware `persist` para guardar la sesión en localStorage.

### Ejemplo completo

```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      schoolId: null,

      get isAuthenticated() {
        return get().accessToken !== null && get().user !== null;
      },

      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      setSchoolId: (schoolId) => set({ schoolId }),

      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, schoolId: null }),

      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    { name: 'auth-storage' }
  )
);
```

### Estado

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| accessToken | string/null | JWT de acceso (TTL 1h) |
| refreshToken | string/null | Token de refresco (TTL 7d) |
| user | object/null | Datos del usuario (id, email, fullName, role...) |
| schoolId | string/null | UUID de la escuela (tenant) |

### Acciones

| Acción | Cuándo usarla |
|--------|---------------|
| setAuth() | Después de login, register o provision exitoso |
| setSchoolId() | Después de provision (school.id) o register (schoolId del body) |
| clearAuth() | Al hacer logout o cuando falla el refresh |
| updateTokens() | Cuando el interceptor refresca el token |

### Subtareas

#### 3.1 Crear authStore con estado y acciones

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 3. Auth Store (Zustand con persist) |

Implementar el store con las 4 propiedades y 4 acciones. Usar `persist` con key `auth-storage`.

#### 3.2 Implementar getter isAuthenticated

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 3. Auth Store (Zustand con persist) |

Retorna `true` solo si `accessToken` Y `user` son no-nulos.


---

## 4. Schemas de validación Zod

| Campo | Valor |
|-------|-------|
| Módulo | Validación |
| Etiquetas | validation, forms |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear schemas Zod en `src/schemas/` que repliquen la validación del backend. Todos los mensajes de error en español. Se integran con React Hook Form via `@hookform/resolvers/zod`.

### Subtareas

#### 4.1 Crear schemas de auth (login, register, provision)

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 4. Schemas de validación Zod |

Archivo: `src/schemas/auth.js`

```javascript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  schoolId: z.string().uuid('Debe ser un UUID válido'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const provisionSchema = z.object({
  schoolName: z.string().min(1, 'Nombre de escuela requerido'),
  adminEmail: z.string().email('Email inválido'),
  adminPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  planCode: z.string().optional(),
}).refine((d) => d.adminPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
```

#### 4.2 Crear schemas de negocio (classrooms, subjects, courses, academic years)

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 4. Schemas de validación Zod |

Archivos: `src/schemas/classrooms.js`, `subjects.js`, `courses.js`, `academicYears.js`

```javascript
// classrooms.js
export const createClassroomSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  gradeLevel: z.string().optional(),
});

// subjects.js
export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  code: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// courses.js
export const createCourseSchema = z.object({
  classroomId: z.string().uuid('Selecciona un aula'),
  subjectId: z.string().uuid('Selecciona una materia'),
  academicYearId: z.string().uuid('Selecciona un año académico'),
  gradingConfig: z.record(z.unknown()).optional(),
});

// academicYears.js
export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
  isCurrent: z.boolean().optional(),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), {
  message: 'La fecha de fin debe ser posterior al inicio',
  path: ['endDate'],
});
```

---

## 5. Páginas públicas (Login, Register, Provision)

| Campo | Valor |
|-------|-------|
| Módulo | Auth |
| Etiquetas | auth, forms, ui |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear las 3 páginas públicas que no requieren autenticación. Cada una tiene un formulario con validación Zod + React Hook Form, llama a la API, guarda tokens en el authStore y redirige a `/dashboard`.

### Subtareas

#### 5.1 Crear LoginPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 5. Páginas públicas |

Ruta: `/login`. Campos: email, password. API: `POST /api/auth/login`. On success: `setAuth()` + navigate `/dashboard`. On error: toast con mensaje. Links a Register y Provision.

Ejemplo de integración con React Hook Form:
```javascript
const form = useForm({ resolver: zodResolver(loginSchema) });
const onSubmit = async (data) => {
  const res = await api.post('/api/auth/login', data);
  useAuthStore.getState().setAuth(res.data);
  navigate('/dashboard');
};
```

#### 5.2 Crear RegisterPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 5. Páginas públicas |

Ruta: `/register`. Campos: email, password, confirmPassword, schoolId (UUID). API: `POST /api/auth/register` (enviar solo email, password, schoolId — NO confirmPassword). On success: `setAuth()` + `setSchoolId(data.schoolId)` + navigate `/dashboard`.

#### 5.3 Crear ProvisionPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 5. Páginas públicas |

Ruta: `/provision`. Campos: schoolName, adminEmail, adminPassword, confirmPassword, planCode (opcional). API: `POST /api/provision` (enviar schoolName, adminEmail, adminPassword, planCode — NO confirmPassword). On success: `setAuth({ accessToken, refreshToken, user: admin })` + `setSchoolId(school.id)` + navigate `/dashboard`.

---

## 6. Enrutamiento y protección de rutas

| Campo | Valor |
|-------|-------|
| Módulo | Routing |
| Etiquetas | routing, rbac |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Configurar React Router v7 con rutas públicas y protegidas. Implementar componentes guard: `ProtectedRoute` (requiere auth), `PublicRoute` (redirige si ya autenticado), `RoleGate` (filtra por rol).

### Mapa de rutas

| Ruta | Página | Tipo | Roles |
|------|--------|------|-------|
| `/` | Redirect → `/dashboard` | — | — |
| `/login` | LoginPage | Pública | — |
| `/register` | RegisterPage | Pública | — |
| `/provision` | ProvisionPage | Pública | — |
| `/dashboard` | DashboardPage | Protegida | todos |
| `/dashboard/classrooms` | ClassroomsPage | Protegida | todos |
| `/dashboard/subjects` | SubjectsPage | Protegida | todos |
| `/dashboard/courses` | CoursesPage | Protegida | todos |
| `/dashboard/academic-years` | AcademicYearsPage | Protegida | director, teacher |
| `/dashboard/school` | SchoolPage | Protegida | todos |
| `/dashboard/profile` | ProfilePage | Protegida | todos |

### Subtareas

#### 6.1 Crear ProtectedRoute

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 6. Enrutamiento y protección de rutas |

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const { accessToken, user } = useAuthStore();
  if (!accessToken || !user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
```

#### 6.2 Crear PublicRoute

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 6. Enrutamiento y protección de rutas |

Si el usuario ya está autenticado, redirige a `/dashboard`. Si no, renderiza children.

#### 6.3 Crear RoleGate

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 6. Enrutamiento y protección de rutas |

```javascript
// src/components/RoleGate.jsx
export function RoleGate({ roles, children, fallback = null }) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return fallback;
  return children;
}
```

Uso: `<RoleGate roles={['director']}><Button>Crear Aula</Button></RoleGate>`

#### 6.4 Configurar router en src/routes/index.jsx

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 6. Enrutamiento y protección de rutas |

Definir todas las rutas con `createBrowserRouter`. Las rutas de dashboard son children de `ProtectedRoute` + `DashboardLayout`.

---

## 7. Dashboard Layout (Sidebar + Header)

| Campo | Valor |
|-------|-------|
| Módulo | Layout |
| Etiquetas | ui, rbac |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear `src/layouts/DashboardLayout.jsx` con sidebar de navegación, header con nombre de usuario y botón logout, y área de contenido con `<Outlet />`.

### Navegación del sidebar

| Ruta | Label | Icono (Lucide) | Visible para |
|------|-------|----------------|--------------|
| /dashboard | Dashboard | LayoutDashboard | todos |
| /dashboard/classrooms | Aulas | DoorOpen | todos |
| /dashboard/subjects | Materias | BookOpen | todos |
| /dashboard/courses | Cursos | GraduationCap | todos |
| /dashboard/academic-years | Años Académicos | Calendar | director, teacher |
| /dashboard/school | Mi Escuela | School | todos |
| /dashboard/profile | Mi Perfil | UserCircle | todos |

### Subtareas

#### 7.1 Crear Sidebar con navegación

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 7. Dashboard Layout |

Sidebar fijo en desktop (w-64), overlay en mobile (<768px). Usar `useLocation()` para resaltar el enlace activo. Filtrar enlaces por rol del usuario.

#### 7.2 Crear Header con usuario y logout

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 7. Dashboard Layout |

Mostrar nombre del usuario. Botón logout: `POST /api/auth/logout` → `clearAuth()` → navigate `/login`. Botón hamburguesa en mobile.

#### 7.3 Hacer layout responsive

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 7. Dashboard Layout |

En pantallas < 768px: sidebar oculto, botón hamburguesa lo abre como overlay con backdrop.


---

## 8. Hooks TanStack Query + QueryClient

| Campo | Valor |
|-------|-------|
| Módulo | Dashboard |
| Etiquetas | api, state |
| Prioridad | Alta |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Configurar QueryClient y crear custom hooks para cada recurso. Cada hook encapsula la llamada a la API y maneja cache, loading y errores.

### QueryClient (`src/lib/queryClient.js`)

```javascript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      retry: 1,
    },
  },
});
```

### Patrón de hooks

Cada recurso tiene un hook de query (GET) y uno de mutación (POST):

```javascript
// src/hooks/useClassrooms.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/api/classrooms').then(r => r.data),
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/classrooms', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classrooms'] }),
  });
}
```

### Query Keys

| Recurso | Key | Endpoint |
|---------|-----|----------|
| Aulas | `['classrooms']` | GET /api/classrooms |
| Materias | `['subjects']` | GET /api/subjects |
| Cursos | `['courses']` | GET /api/courses |
| Años Académicos | `['academic-years']` | GET /api/academic-years |
| Escuela | `['school']` | GET /api/schools/me |
| Perfil | `['profile']` | GET /api/auth/me |

### Subtareas

#### 8.1 Configurar QueryClient y QueryClientProvider

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 8. Hooks TanStack Query + QueryClient |

Crear `src/lib/queryClient.js`. Envolver la app con `<QueryClientProvider>` en `App.jsx`.

#### 8.2 Crear hooks de recursos académicos

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 8. Hooks TanStack Query + QueryClient |

Crear: `useClassrooms.js`, `useSubjects.js`, `useCourses.js`, `useAcademicYears.js`. Cada uno con hook de query + hook de mutación.

#### 8.3 Crear hooks de escuela y perfil

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 8. Hooks TanStack Query + QueryClient |

Crear: `useSchool.js` (GET /api/schools/me), `useProfile.js` (GET /api/auth/me). Solo query, sin mutación.

#### 8.4 Crear hook useAuth para login/register/provision/logout

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 8. Hooks TanStack Query + QueryClient |

```javascript
// src/hooks/useAuth.js
export function useLogin() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/login', data).then(r => r.data),
  });
}
export function useRegister() { /* similar */ }
export function useProvision() { /* similar */ }
export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
  });
}
```

---

## 9. Páginas de Dashboard (Inicio + CRUD)

| Campo | Valor |
|-------|-------|
| Módulo | Dashboard |
| Etiquetas | ui, api, forms, rbac |
| Prioridad | Media |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Crear todas las páginas del dashboard. Cada página de CRUD sigue el mismo patrón: tabla con datos + botón crear (visible solo para roles autorizados) + formulario en modal.

### Patrón de página CRUD

```javascript
// Ejemplo: ClassroomsPage.jsx
export default function ClassroomsPage() {
  const { data, isLoading } = useClassrooms();
  const { user } = useAuthStore();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Aulas</h1>
        <RoleGate roles={['director']}>
          <CreateClassroomDialog />
        </RoleGate>
      </div>
      <DataTable
        columns={[
          { header: 'Nombre', accessorKey: 'name' },
          { header: 'Nivel', accessorKey: 'gradeLevel' },
        ]}
        data={data ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Subtareas

#### 9.1 Crear DashboardPage (inicio)

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard`. Mostrar bienvenida con nombre del usuario. 3 tarjetas resumen: total aulas, total materias, total cursos. Usar skeletons mientras cargan.

#### 9.2 Crear ClassroomsPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/classrooms`. Tabla con aulas. Botón "Crear Aula" solo para director. Modal con form: name (requerido), gradeLevel (opcional). On success: toast + invalidar query.

#### 9.3 Crear SubjectsPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/subjects`. Tabla con materias. Botón "Crear Materia" solo para director. Modal con form: name, code, color, icon. On success: toast + invalidar query.

#### 9.4 Crear CoursesPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/courses`. Tabla con cursos. Botón "Crear Curso" para director y teacher. Modal con form: classroomId (select), subjectId (select), academicYearId (select), gradingConfig (opcional). Los selects cargan datos de las APIs respectivas.

#### 9.5 Crear AcademicYearsPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/academic-years`. Tabla con años académicos. Botón "Crear Año" solo para director. Modal con form: name, startDate (date picker), endDate (date picker), isCurrent (checkbox). Validar que endDate > startDate.

#### 9.6 Crear SchoolPage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/school`. Mostrar datos de `GET /api/schools/me`: nombre, slug, dominio, email contacto, teléfono, timezone, locale, país, estado. Solo lectura.

#### 9.7 Crear ProfilePage

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 9. Páginas de Dashboard |

Ruta: `/dashboard/profile`. Mostrar datos de `GET /api/auth/me`: email, nombre completo, avatar, teléfono, estado, último login, conteo de logins. Verificar que NO se muestre passwordHash.

---

## 10. Manejo global de errores y Toasts

| Campo | Valor |
|-------|-------|
| Módulo | Errors |
| Etiquetas | error-handling, ui |
| Prioridad | Media |
| Tipo | Tarea Principal |
| Status | Pendiente |

### Descripción

Implementar sistema de notificaciones Toast con shadcn/ui. Manejar errores de la API de forma consistente en toda la app.

### Tipos de error y mensajes

| Código HTTP | Mensaje |
|-------------|---------|
| 401 | (manejado por interceptor — refresh o redirect) |
| 409 | Mostrar `error` del body (ej: "Email already exists") |
| 422 | Mostrar `error` + `details` como errores inline o toast |
| 429 | "Demasiadas solicitudes. Intenta de nuevo en unos momentos." |
| Error de red | "Error de conexión. Verifica tu conexión a internet." |
| Otros | Mostrar `error` del body o mensaje genérico |

### Subtareas

#### 10.1 Configurar Toaster de shadcn/ui

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 10. Manejo global de errores y Toasts |

Instalar componente Toast de shadcn: `npx shadcn@latest add toast`. Agregar `<Toaster />` en App.jsx. Posición: esquina superior derecha.

#### 10.2 Crear helper showApiError

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 10. Manejo global de errores y Toasts |

```javascript
import { toast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/axios';

export function showApiError(error) {
  const message = extractErrorMessage(error);
  toast({ title: 'Error', description: message, variant: 'destructive' });
}

export function showSuccess(message) {
  toast({ title: 'Éxito', description: message });
}
```

#### 10.3 Integrar manejo de errores en mutaciones

| Campo | Valor |
|-------|-------|
| Tipo | Subtarea |
| Tarea Padre | 10. Manejo global de errores y Toasts |

En cada hook de mutación, agregar `onError: (error) => showApiError(error)`. En cada `onSuccess`, agregar `showSuccess('Recurso creado exitosamente')`.

---

## Resumen de tareas

| # | Tarea | Módulo | Prioridad | Subtareas |
|---|-------|--------|-----------|-----------|
| 1 | Scaffolding del proyecto | Scaffolding | Alta | 4 |
| 2 | Cliente HTTP con interceptores | HTTP Client | Alta | 4 |
| 3 | Auth Store (Zustand) | Auth | Alta | 2 |
| 4 | Schemas de validación Zod | Validación | Alta | 2 |
| 5 | Páginas públicas | Auth | Alta | 3 |
| 6 | Enrutamiento y protección | Routing | Alta | 4 |
| 7 | Dashboard Layout | Layout | Alta | 3 |
| 8 | Hooks TanStack Query | Dashboard | Alta | 4 |
| 9 | Páginas de Dashboard | Dashboard | Media | 7 |
| 10 | Manejo de errores y Toasts | Errors | Media | 3 |
| **Total** | | | | **36 subtareas** |

### Orden de implementación recomendado

1. **Scaffolding** (1) → base del proyecto
2. **Auth Store** (3) → necesario para todo lo demás
3. **Cliente HTTP** (2) → depende del auth store
4. **Schemas Zod** (4) → necesarios para formularios
5. **Enrutamiento** (6) → estructura de navegación
6. **Dashboard Layout** (7) → shell visual
7. **Hooks TanStack Query** (8) → capa de datos
8. **Páginas públicas** (5) → login/register/provision
9. **Páginas de Dashboard** (9) → CRUD completo
10. **Manejo de errores** (10) → polish final
