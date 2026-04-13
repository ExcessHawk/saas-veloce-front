# Tareas Frontend SaaS Educativo — UPDATED con ejemplos detallados

> Este archivo complementa `TAREAS_NOTION.md` con ejemplos completos de implementación para cada tarea y subtarea. Copia el contenido de cada sección en la página correspondiente de Notion.

---

## 1. Scaffolding del proyecto React + Vite

### 1.1 Inicializar proyecto Vite + React

```bash
cd saas/
npm create vite@latest frontend_saas -- --template react
cd frontend_saas
```

Verificar que arranca:
```bash
npm install
npm run dev
# Debe abrir en http://localhost:5173
```

### 1.2 Instalar dependencias del stack

```bash
# Dependencias de producción
npm install react-router@7 @tanstack/react-query zustand react-hook-form @hookform/resolvers zod axios date-fns lucide-react

# Dependencias de desarrollo
npm install -D tailwindcss@4 @tailwindcss/vite
```

### 1.3 Configurar Tailwind CSS 4 + shadcn/ui

Tailwind 4 usa el plugin de Vite (no necesita `tailwind.config.js`):

```javascript
// vite.config.js
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

En `src/index.css`:
```css
@import "tailwindcss";
```

Inicializar shadcn/ui:
```bash
npx shadcn@latest init
# Seleccionar: JavaScript, Default style, CSS variables
```

Instalar componentes que vamos a usar:
```bash
npx shadcn@latest add button input label card dialog table skeleton select checkbox toast separator avatar badge
```

### 1.4 Crear estructura de carpetas y alias

```bash
mkdir -p src/{components/ui,hooks,layouts,lib,pages,routes,schemas,stores}
```

`vite.config.js` completo:
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

`jsconfig.json` (para que el editor entienda el alias):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

`.env.example`:
```
VITE_API_URL=http://localhost:3000
```

`.env` (local, no commitear):
```
VITE_API_URL=http://localhost:3000
```

---

## 2. Cliente HTTP (Axios) con interceptores

### 2.1 Crear instancia base de Axios

```javascript
// src/lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### 2.2 Implementar request interceptor

```javascript
// src/lib/axios.js (agregar después de crear la instancia)
import { useAuthStore } from '@/stores/authStore';

api.interceptors.request.use((config) => {
  const { accessToken, schoolId } = useAuthStore.getState();

  // Solo inyectar si existen
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (schoolId) {
    config.headers['X-School-ID'] = schoolId;
  }

  return config;
});
```

Ejemplo de lo que hace: si el store tiene `accessToken: "eyJhbG..."` y `schoolId: "550e8400-e29b-41d4-a716-446655440000"`, cada request saldrá con:
```
Authorization: Bearer eyJhbG...
X-School-ID: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json
```

### 2.3 Implementar response interceptor con refresh queue

Este es el más complejo. El patrón de "refresh queue" evita que si 3 peticiones reciben 401 al mismo tiempo, se hagan 3 refreshes. Solo se hace 1 y las otras 2 esperan.

```javascript
// src/lib/axios.js (agregar después del request interceptor)

let isRefreshing = false;
let failedQueue = [];

// Resuelve o rechaza todas las peticiones encoladas
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  // Respuestas exitosas pasan directo
  (response) => response,

  // Errores
  async (error) => {
    const originalRequest = error.config;

    // Solo manejar 401 y solo una vez por request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en curso, encolar esta petición
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    // Marcar que estamos refrescando
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // IMPORTANTE: usar axios.post directo, NO la instancia api
      // Si usamos api.post, el interceptor entraría en bucle infinito
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        { refreshToken }
      );

      // Guardar nuevos tokens
      useAuthStore.getState().updateTokens(data.accessToken, data.refreshToken);

      // Resolver todas las peticiones encoladas con el nuevo token
      processQueue(null, data.accessToken);

      // Reintentar la petición original
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);

    } catch (refreshError) {
      // El refresh falló — limpiar sesión y redirigir
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);
```

### 2.4 Crear función extractErrorMessage

```javascript
// src/lib/axios.js (exportar al final del archivo)

/**
 * Extrae un mensaje legible de un error de Axios.
 * La API retorna errores con formato: { error: string, statusCode: number, details?: any }
 *
 * Ejemplos:
 *   - API error 401: "Invalid credentials"
 *   - API error 409: "Email already exists"
 *   - API error 422: "Validation failed" (con details)
 *   - API error 429: "Too Many Requests"
 *   - Sin conexión: "Error de conexión. Verifica tu conexión a internet."
 */
export function extractErrorMessage(error) {
  // Error de la API con body
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Rate limit
  if (error.response?.status === 429) {
    return 'Demasiadas solicitudes. Intenta de nuevo en unos momentos.';
  }

  // Error de red (servidor no responde)
  if (error.request && !error.response) {
    return 'Error de conexión. Verifica tu conexión a internet.';
  }

  // Fallback
  return 'Ha ocurrido un error inesperado.';
}
```

---

## 3. Auth Store (Zustand con persist)

### 3.1 Crear authStore con estado y acciones

```javascript
// src/stores/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─── Estado ───
      accessToken: null,
      refreshToken: null,
      user: null,       // { id, email, fullName, role, ... }
      schoolId: null,   // UUID string

      // ─── Acciones ───

      /**
       * Guardar sesión completa después de login/register/provision.
       * Ejemplo: setAuth({ accessToken: 'eyJ...', refreshToken: 'abc123', user: { id: '...', email: '...' } })
       */
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      /**
       * Establecer el tenant (escuela).
       * Se llama después de register (schoolId del body) o provision (school.id de la respuesta).
       * Ejemplo: setSchoolId('550e8400-e29b-41d4-a716-446655440000')
       */
      setSchoolId: (schoolId) => set({ schoolId }),

      /**
       * Limpiar toda la sesión. Se usa en:
       * - Logout exitoso
       * - Refresh token fallido (interceptor)
       */
      clearAuth: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          schoolId: null,
        }),

      /**
       * Actualizar solo los tokens (sin tocar user ni schoolId).
       * Lo usa el interceptor de Axios cuando refresca el token.
       */
      updateTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'auth-storage', // key en localStorage
    }
  )
);
```

### 3.2 Implementar getter isAuthenticated

Zustand no tiene getters nativos como Vue. Hay dos formas:

Opción A — función en el store:
```javascript
// Dentro del store, agregar:
isAuthenticated: () => get().accessToken !== null && get().user !== null,
```

Uso: `const isAuth = useAuthStore((s) => s.isAuthenticated());`

Opción B — selector fuera del store (más limpio):
```javascript
// En cualquier componente:
const isAuthenticated = useAuthStore(
  (s) => s.accessToken !== null && s.user !== null
);
```

Recomiendo la Opción B porque es más idiomático en Zustand.

Ejemplo completo en un componente:
```javascript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const isAuthenticated = useAuthStore(s => s.accessToken !== null && s.user !== null);
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  if (!isAuthenticated) return <p>No estás logueado</p>;

  return (
    <div>
      <p>Hola, {user.fullName}</p>
      <button onClick={clearAuth}>Cerrar sesión</button>
    </div>
  );
}
```

---

## 4. Schemas de validación Zod

### 4.1 Crear schemas de auth

```javascript
// src/schemas/auth.js
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
  path: ['confirmPassword'], // El error aparece en el campo confirmPassword
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
  planCode: z.string().optional(), // 'starter', 'pro', 'enterprise'
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
```

### 4.2 Crear schemas de negocio

```javascript
// src/schemas/classrooms.js
import { z } from 'zod';

export const createClassroomSchema = z.object({
  name: z.string().min(1, 'El nombre del aula es requerido'),
  gradeLevel: z.string().optional(),
});

// src/schemas/subjects.js
import { z } from 'zod';

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'El nombre de la materia es requerido'),
  code: z.string().optional(),   // ej: "MAT-101"
  color: z.string().optional(),  // ej: "#FF5733"
  icon: z.string().optional(),   // ej: "calculator"
});

// src/schemas/courses.js
import { z } from 'zod';

export const createCourseSchema = z.object({
  classroomId: z.string().uuid('Selecciona un aula válida'),
  subjectId: z.string().uuid('Selecciona una materia válida'),
  academicYearId: z.string().uuid('Selecciona un año académico válido'),
  gradingConfig: z.record(z.unknown()).optional(),
});

// src/schemas/academicYears.js
import { z } from 'zod';

export const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'), // ej: "2025-2026"
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
```

---

## 5. Páginas públicas (Login, Register, Provision)

### 5.1 Crear LoginPage — Ejemplo completo

```javascript
// src/pages/LoginPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { loginSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      const result = await login.mutateAsync(data);
      // result = { accessToken, refreshToken, user }
      setAuth(result);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm space-y-1">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                Regístrate
              </Link>
            </p>
            <p>
              ¿Nueva escuela?{' '}
              <Link to="/provision" className="text-blue-600 hover:underline">
                Registra tu escuela
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.2 Crear RegisterPage — Ejemplo completo

```javascript
// src/pages/RegisterPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { registerSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useRegister } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const registerMutation = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', schoolId: '' },
  });

  const onSubmit = async (data) => {
    try {
      // IMPORTANTE: NO enviar confirmPassword a la API
      const { confirmPassword, ...apiData } = data;
      const result = await registerMutation.mutateAsync(apiData);
      setAuth(result);
      setSchoolId(data.schoolId);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registro</CardTitle>
          <CardDescription>Crea tu cuenta para acceder a la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...formRegister('email')} />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...formRegister('password')} />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input id="confirmPassword" type="password" {...formRegister('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <Label htmlFor="schoolId">ID de Escuela (UUID)</Label>
              <Input id="schoolId" placeholder="550e8400-e29b-41d4-a716-446655440000" {...formRegister('schoolId')} />
              {errors.schoolId && <p className="text-sm text-red-500 mt-1">{errors.schoolId.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.3 Crear ProvisionPage — Ejemplo completo

```javascript
// src/pages/ProvisionPage.jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { provisionSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useProvision } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ProvisionPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const provision = useProvision();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      schoolName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      planCode: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      // NO enviar confirmPassword a la API
      const { confirmPassword, ...apiData } = data;
      // Si planCode está vacío, no enviarlo
      if (!apiData.planCode) delete apiData.planCode;

      const result = await provision.mutateAsync(apiData);
      // result = { school, admin, subscription, accessToken, refreshToken }
      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.admin,
      });
      setSchoolId(result.school.id);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Registrar Escuela</CardTitle>
          <CardDescription>Crea tu escuela y obtén acceso como director</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nombre de la Escuela</Label>
              <Input placeholder="Escuela Primaria San José" {...register('schoolName')} />
              {errors.schoolName && <p className="text-sm text-red-500 mt-1">{errors.schoolName.message}</p>}
            </div>
            <div>
              <Label>Email del Administrador</Label>
              <Input type="email" {...register('adminEmail')} />
              {errors.adminEmail && <p className="text-sm text-red-500 mt-1">{errors.adminEmail.message}</p>}
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input type="password" {...register('adminPassword')} />
              {errors.adminPassword && <p className="text-sm text-red-500 mt-1">{errors.adminPassword.message}</p>}
            </div>
            <div>
              <Label>Confirmar Contraseña</Label>
              <Input type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <div>
              <Label>Plan (opcional)</Label>
              <Input placeholder="starter" {...register('planCode')} />
              <p className="text-xs text-gray-500 mt-1">Opciones: starter, pro, enterprise. Por defecto: starter</p>
            </div>
            <Button type="submit" className="w-full" disabled={provision.isPending}>
              {provision.isPending ? 'Creando escuela...' : 'Registrar Escuela'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```


---

## 6. Enrutamiento y protección de rutas

### 6.1 ProtectedRoute — Ejemplo completo

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
```

### 6.2 PublicRoute — Ejemplo completo

```javascript
// src/components/PublicRoute.jsx
import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function PublicRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // Si ya está logueado, mandarlo al dashboard
  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
```

### 6.3 RoleGate — Ejemplo completo

```javascript
// src/components/RoleGate.jsx
import { useAuthStore } from '@/stores/authStore';

/**
 * Renderiza children solo si el usuario tiene uno de los roles permitidos.
 *
 * Uso:
 *   <RoleGate roles={['director']}>
 *     <Button>Crear Aula</Button>
 *   </RoleGate>
 *
 *   <RoleGate roles={['director', 'teacher']}>
 *     <Button>Crear Curso</Button>
 *   </RoleGate>
 */
export function RoleGate({ roles, children, fallback = null }) {
  const user = useAuthStore((s) => s.user);

  if (!user || !roles.includes(user.role)) {
    return fallback;
  }

  return children;
}
```

### 6.4 Router completo — Ejemplo

```javascript
// src/routes/index.jsx
import { createBrowserRouter, Navigate } from 'react-router';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProvisionPage from '@/pages/ProvisionPage';
import DashboardPage from '@/pages/DashboardPage';
import ClassroomsPage from '@/pages/ClassroomsPage';
import SubjectsPage from '@/pages/SubjectsPage';
import CoursesPage from '@/pages/CoursesPage';
import AcademicYearsPage from '@/pages/AcademicYearsPage';
import SchoolPage from '@/pages/SchoolPage';
import ProfilePage from '@/pages/ProfilePage';

export const router = createBrowserRouter([
  // Raíz → dashboard
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Rutas públicas (redirigen a dashboard si ya logueado)
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: '/register',
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path: '/provision',
    element: <PublicRoute><ProvisionPage /></PublicRoute>,
  },

  // Rutas protegidas (requieren auth)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'classrooms', element: <ClassroomsPage /> },
          { path: 'subjects', element: <SubjectsPage /> },
          { path: 'courses', element: <CoursesPage /> },
          { path: 'academic-years', element: <AcademicYearsPage /> },
          { path: 'school', element: <SchoolPage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },

  // Catch-all
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
```

### App.jsx con providers

```javascript
// src/App.jsx
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import { Toaster } from '@/components/ui/toaster';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  );
}
```

---

## 7. Dashboard Layout — Ejemplo completo

### 7.1 + 7.2 + 7.3 DashboardLayout

```javascript
// src/layouts/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/dashboard/classrooms', label: 'Aulas', icon: DoorOpen, roles: null },
  { path: '/dashboard/subjects', label: 'Materias', icon: BookOpen, roles: null },
  { path: '/dashboard/courses', label: 'Cursos', icon: GraduationCap, roles: null },
  { path: '/dashboard/academic-years', label: 'Años Académicos', icon: Calendar, roles: ['director', 'teacher'] },
  { path: '/dashboard/school', label: 'Mi Escuela', icon: School, roles: null },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: UserCircle, roles: null },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  // Filtrar nav items por rol
  const navItems = allNavItems.filter(
    (item) => item.roles === null || item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      // Incluso si falla la API, limpiar sesión local
    }
    clearAuth();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">SaaS Educativo</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold">SaaS Educativo</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-600">
              {user?.fullName || user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## 8. Hooks TanStack Query — Ejemplos completos

### 8.1 QueryClient

```javascript
// src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — no refetch si los datos tienen menos de 5 min
      retry: 1,                  // 1 reintento en caso de error
      refetchOnWindowFocus: false, // No refetch al volver a la pestaña
    },
  },
});
```

### 8.2 Hooks de recursos académicos

```javascript
// src/hooks/useClassrooms.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { showApiError, showSuccess } from '@/lib/errors';

export function useClassrooms() {
  return useQuery({
    queryKey: ['classrooms'],
    queryFn: () => api.get('/api/classrooms').then((r) => r.data),
  });
}

export function useCreateClassroom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/api/classrooms', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classrooms'] });
      showSuccess('Aula creada exitosamente');
    },
    onError: (error) => showApiError(error),
  });
}
```

Mismo patrón para `useSubjects.js`, `useCourses.js`, `useAcademicYears.js` — solo cambia el endpoint y el queryKey.

### 8.3 Hooks de escuela y perfil

```javascript
// src/hooks/useSchool.js
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useSchool() {
  return useQuery({
    queryKey: ['school'],
    queryFn: () => api.get('/api/schools/me').then((r) => r.data),
  });
}

// src/hooks/useProfile.js
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/auth/me').then((r) => r.data),
  });
}
```

### 8.4 Hook useAuth

```javascript
// src/hooks/useAuth.js
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useLogin() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/login', data).then((r) => r.data),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data) => api.post('/api/auth/register', data).then((r) => r.data),
  });
}

export function useProvision() {
  return useMutation({
    mutationFn: (data) => api.post('/api/provision', data).then((r) => r.data),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => api.post('/api/auth/logout'),
  });
}
```

---

## 9. Páginas de Dashboard — Ejemplo de página CRUD

### 9.2 ClassroomsPage — Ejemplo completo con modal de creación

```javascript
// src/pages/ClassroomsPage.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useClassrooms, useCreateClassroom } from '@/hooks/useClassrooms';
import { createClassroomSchema } from '@/schemas/classrooms';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

export default function ClassroomsPage() {
  const { data: classrooms, isLoading } = useClassrooms();
  const createClassroom = useCreateClassroom();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(createClassroomSchema),
    defaultValues: { name: '', gradeLevel: '' },
  });

  const onSubmit = async (data) => {
    await createClassroom.mutateAsync(data);
    reset();
    setOpen(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Aulas</h1>
        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> Crear Aula</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Aula</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input placeholder="Ej: 3ro A" {...register('name')} />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <Label>Nivel de Grado (opcional)</Label>
                  <Input placeholder="Ej: Primaria" {...register('gradeLevel')} />
                </div>
                <Button type="submit" className="w-full" disabled={createClassroom.isPending}>
                  {createClassroom.isPending ? 'Creando...' : 'Crear Aula'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : classrooms?.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay aulas registradas</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classrooms?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.gradeLevel || '—'}</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

Este mismo patrón aplica para SubjectsPage, CoursesPage y AcademicYearsPage — solo cambian los campos del formulario, el hook y las columnas de la tabla.

---

## 10. Manejo de errores — Ejemplo completo

### 10.1 + 10.2 Archivo de errores

```javascript
// src/lib/errors.js
import { toast } from '@/hooks/use-toast';
import { extractErrorMessage } from '@/lib/axios';

/**
 * Muestra un toast de error con el mensaje extraído de un error de Axios.
 * Uso: showApiError(error) en el onError de mutaciones o catch de async.
 */
export function showApiError(error) {
  const message = extractErrorMessage(error);
  toast({
    title: 'Error',
    description: message,
    variant: 'destructive',
  });
}

/**
 * Muestra un toast de éxito.
 * Uso: showSuccess('Aula creada exitosamente') en el onSuccess de mutaciones.
 */
export function showSuccess(message) {
  toast({
    title: 'Éxito',
    description: message,
  });
}
```
