# Frontend — análisis de diseño y gaps

> Auditoría de diseño/UX del SaaS (React 19 + Vite + Tailwind + shadcn-style).
> Estado general: **~80% prod-ready**. 29 páginas, layouts sólidos, dark mode,
> command palette, validación Zod, refresh-on-401. Lo que falta es sobre todo
> **system-level** (primitivos, responsive de tablas, estados), no páginas nuevas.

Leyenda estado: ⬜ pendiente · 🟦 en progreso · ✅ hecho

---

## 🔴 Críticos (bloquean producción)

- ✅ **Tablas card-view en mobile** — mecanismo reusable: `<Table stack>` (primitivo) o `data-stack` (tablas crudas) + `data-label` por celda + CSS en `index.css` (<640px → cada fila = card con etiquetas). Aplicado a 7 tablas: Courses, Classrooms, AcademicYears, GradeLevels, Subjects, AdminSchools, Members. Grades (matriz/gradebook) y Dashboard (mini-lista) quedan en scroll **a propósito** (card-view no aplica a una matriz).
- ✅ **ProvisionPage: grid de planes responsive** — `grid-cols-1 sm:grid-cols-3` (apila en celular).
- 🟨 **Billing** — ✅ comparador de planes en **cards** (features/límites, toggle MXN/USD, resalta plan actual) reemplaza el radio list. CORRECCIÓN: facturas + método de pago + cancelar/pausar **ya están** vía el **Stripe Customer Portal** (botón "Gestionar pagos y facturas") — patrón estándar, no hace falta reconstruirlo (se aclaró en la UI). ⬜ Pendiente opcional: resumen inline de últimas facturas (requeriría endpoint backend Stripe).
- ⬜ **Billing Success/Cancel esqueléticos** — sin resumen de transacción/orden; Cancel sin botón "reintentar" ni link a soporte.
- ✅ **Tasks (alumno) nota/feedback** — CORRECCIÓN: ya estaba implementado (`MiEntregaModal` muestra score + feedback; `TabEntregadas` muestra nota/Aprobado). El audit se equivocó. Único bug real (arreglado): la tarjeta de la lista no contaba `status:'returned'` como calificada → mostraba "Por revisar" pese a tener nota.

## 🟠 Importantes

- ✅ **Página 404** — `NotFoundPage.jsx` creada y cableada en el catch-all (ya no redirige silencioso).
- ✅ **Guard de rol en `/admin`** — `AdminRoute.jsx` (solo `isGlobalAdmin`, si no → `/dashboard`), envuelve las rutas admin.
- ⬜ **Estados inconsistentes** — varias páginas sin skeleton (GradeLevels, Subjects), sin `EmptyState` unificado, sin error state. Estandarizar (hay buenos ejemplos: Grades, Dashboard).
- ⬜ **Campanita de notificaciones** en la nav: el hook existe pero no está cableado en la UI.

## 🎨 Design system — primitivos faltantes

Hoy hay 8 (`button, badge, dialog, input, select, skeleton, sonner, table`). Se usan `<input>`/`<label>`/divs crudos en muchos lados. Faltan (priorizado por uso):

- ✅ **Alto:** `Card`, `Label`, `Textarea`, `Checkbox`, `Form` (wrapper react-hook-form) — creados.
- ✅ **Medio:** `Avatar`, `Tabs`, `DropdownMenu`, `Switch` — creados. ⬜ `Tooltip` pendiente.
- ⬜ **Bajo:** `Popover`, `Breadcrumb`, `Sheet/Drawer` (mobile), `Pagination` genérico.
- ⬜ **Aplicarlos** (reemplazar `<input>`/`<label>`/divs crudos) — hacer página por página CON revisión visual (no blind, para no romper layouts que ya funcionan).

## 🟡 Consistencia / polish

- ⬜ **Tokens duplicados** — Landing usa `--n-*`, la app usa `p-*`/tokens shadcn → mantenimiento divergente. `AuthLayout` mezcla `oklch` hardcoded (panel izq) vs vars (der).
- ⬜ **Patrones CRUD mixtos** — inline form (GradeLevels) vs dialog (AcademicYears); Enrollments usa cards vs Courses usa tabla para entidades similares; `<select>` nativo vs componente `Select`. Definir regla (dialog >2 campos, inline ≤2).
- ⬜ **Layouts huérfanos** — VerifyEmail y Landing no usan layout compartido.
- ⬜ **A11y** — faltan `aria-label` en botones-ícono, focus-trap/return en diálogos, `aria-live` en auto-redirects.

## ✅ Bien resuelto (no tocar)

- GradesPage (libro completo), MyCourses, MyChildren, Chat (con empty states), Dashboard role-based, DashboardLayout + command palette (⌘K), validación Zod + strength meter, refresh-on-401, `showApiError` → toast (sonner).

---

## Nota de arquitectura de estado

- **Zustand**: solo estado global de cliente/sesión (auth, tenant, UI global). Ya está bien usado.
- **React Query**: todo lo que viene del API (no meter data de server en zustand).
- **useState**: estado local de componentes/primitivos.
Los primitivos nuevos no requieren zustand.

---

## Progreso

- ✅ Primitivos base: `Card`, `Label`, `Textarea`, `Checkbox`, `Switch` (2026-06-06)
- ✅ Página 404 (`NotFoundPage`) + catch-all (2026-06-06)
- ✅ Guard de rol en `/admin` (`AdminRoute`) (2026-06-06)
- ✅ ProvisionPage grid de planes responsive (2026-06-06)
- 🟨 Tablas mobile: ya scrollean (overflow-x-auto); card-view opcional pendiente
- ✅ Primitivos restantes: `Form`, `Avatar`, `Tabs`, `DropdownMenu` (2026-06-06) — smoke test verde
- ✅ Tasks alumno: bug `returned` en lista arreglado (la feature ya existía)
- ⬜ **Billing** (facturas + comparador de planes) — facturas requieren endpoint backend (Stripe); comparador es frontend.
- ✅ Billing: comparador de planes en cards + toggle moneda + plan actual (2026-06-06)
- ⬜ Aplicar primitivos a páginas (con revisión visual) · `Tooltip`/`Popover`/`Breadcrumb`/`Drawer`.
- ✅ Billing Success/Cancel enriquecidos: countdown, referencia de orden, botones (panel/facturación/reintentar), nota de email, link soporte, aria-live (2026-06-06)
- ✅ Card-view en 7 tablas (mecanismo `stack`/`data-stack` + CSS) (2026-06-06)
