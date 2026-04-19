# Pensum — Prompts de diseño pendientes (9 al 16)

Continuar desde donde quedaste en Claude Design.
Referencia: el design system ya está definido en los prompts 1–8.

---

## Prompt 9 — Asignar docente a curso (Director)

```
Modal "Asignar Docente" en Pensum. Se abre desde la tabla/cards de Cursos.

Usando el mismo design system del archivo anterior.

Contenido del modal:
- Título "Asignar Docente — Matemáticas 1-A"
- Info del curso read-only: chips de materia (con color), aula, año académico
- Sección "Docente actual":
  - Si hay docente: avatar con gradiente, nombre, badge "Docente", botón ghost "Quitar asignación"
  - Si no hay: texto gris "Sin docente asignado"
- Divider
- Sección "Asignar nuevo docente":
  - Search input "Buscar docente por nombre..."
  - Lista de docentes disponibles: avatar + nombre + "X cursos activos" + botón "Asignar"
  - Hover en cada item: fondo sutil, botón "Asignar" se vuelve primario
- Footer: botón "Cancelar" (secondary) + botón "Guardar" (primary)
```

---

## Prompt 10 — Dashboard Docente

```
Vista Dashboard para rol Docente en Pensum.

Sidebar: Dashboard, Mis Cursos, Mi Perfil (igual que el diseño anterior para docente).

Contenido principal:
- Header "Bienvenido, [nombre]" + badge "Docente" + subtítulo con escuela y ciclo
- 3 stat cards: "Mis Cursos" (3), "Tareas Activas" (12), "Entregas Pendientes" (8)
- Sección "Esta semana": cards compactas de los cursos próximos
  - Cada card: chip de materia con color, nombre del grupo, aula, badge "X tareas activas"
  - Botón "Ver tareas" en cada card
- Sección "Últimas entregas recibidas": lista feed
  - Avatar + nombre alumno + materia + tarea + "hace X horas"
  - Badge si está pendiente de revisar
```

---

## Prompt 11 — Dashboard Estudiante

```
Vista Dashboard para rol Estudiante en Pensum.

Sidebar: Dashboard, Mis Cursos, Mi Perfil.

Contenido:
- Header "Hola, [nombre]" + badge "Estudiante"
- 3 stat cards: "Mis Cursos" (4), "Tareas Pendientes" (3), "Tareas Vencidas" (1)
  - La card de vencidas usa color danger (rojo)
- Sección "Tareas próximas a vencer" (ordenadas por urgencia):
  - Cada item: chip materia con color, título tarea, fecha límite
  - Badge de urgencia: "Hoy" (rojo), "Mañana" (naranja), "Esta semana" (amarillo)
  - Botón "Entregar" inline al hover
- Sección "Mis cursos": cards compactas
  - Materia con color, docente, aula, progress bar de tareas completadas
```

---

## Prompt 12 — Tareas por curso (Docente — crear y gestionar)

```
Vista "Tareas" dentro de un curso específico en Pensum, perspectiva Docente.

Header: breadcrumb "Mis Cursos > Matemáticas Grupo A > Tareas"
Botón "Nueva Tarea" (primary, arriba derecha)

Lista de tareas:
- Cada tarea: card con título, descripción corta (1 línea truncada), fecha límite,
  puntaje máximo, badge estado (Activa/Cerrada/Borrador)
- Contador "X/Y entregas recibidas" con mini progress bar
- Acciones: ícono editar + ícono eliminar (ghost)
- Estado vacío: ilustración + "Crea la primera tarea para este grupo"

Modal "Nueva/Editar Tarea":
- Campos: Título*, Descripción (textarea), Fecha límite (date), Puntaje máximo (number)
- Select tipo: Tarea, Examen, Proyecto, Lectura
- Toggle "Publicar ahora" vs guardar como borrador
```

---

## Prompt 13 — Tareas por curso (Estudiante — ver y entregar)

```
Vista "Tareas" de un curso, perspectiva Estudiante. Read-only, sin botón crear.

Header: breadcrumb "Mis Cursos > Matemáticas Grupo A > Tareas"

Tabs horizontales: "Pendientes" | "Entregadas" | "Vencidas"

Tab Pendientes — lista de tareas:
- Cada item: título, descripción corta, fecha límite con badge urgencia, puntaje posible
- Botón "Entregar" (primary pequeño)
- Al hacer click en "Entregar": modal simple con textarea "Comentarios" + botón confirmar

Tab Entregadas:
- Cada item: título + fecha de entrega + calificación (si ya fue revisada) o "Pendiente de revisión"
- Badge verde si aprobado, rojo si reprobado

Tab Vencidas:
- Tareas pasadas sin entregar, badge rojo "Vencida"
```

---

## Prompt 14 — Inscripciones (Director)

```
Página "Inscripciones" en Pensum, solo para Director.

Layout de dos paneles:

PANEL IZQUIERDO (40%) — Selector de curso:
- Dropdown "Año Académico" arriba
- Lista de cursos como cards compactas:
  - Chip materia con color, nombre del grupo, aula
  - Badge "X alumnos inscritos"
  - La card seleccionada tiene borde primario y fondo sutil
- Estado vacío: "No hay cursos en este año"

PANEL DERECHO (60%) — Gestión de alumnos del curso seleccionado:
- Header: nombre del curso, badge "X / 30 alumnos"
- Mini search: "Buscar alumno inscrito..."
- Lista de alumnos inscritos:
  - Avatar con gradiente + nombre + email
  - Botón ghost "Quitar" (ícono X) al hover, danger
- Divider
- Sección "Agregar alumno":
  - Search input "Buscar alumno de la escuela..."
  - Lista de resultados con avatar + nombre + botón "Inscribir"
- Estado si no hay curso seleccionado: ilustración centrada "Selecciona un curso"
```

---

## Prompt 15 — Perfil de usuario (editable)

```
Página "Mi Perfil" en Pensum, misma para todos los roles.

Layout dos columnas:

COLUMNA IZQUIERDA (⅓):
- Avatar grande (80px) con iniciales en gradiente
- Overlay al hover: ícono cámara + "Cambiar foto"
- Nombre completo bold
- Email (no editable, color muted)
- Badge de rol (Director/Docente/Estudiante/Padre con color correspondiente)
- Badge de estado (Activo = verde)
- Divider
- Stats:
  - "Miembro desde [fecha]"
  - "Último acceso [fecha y hora]"
  - "Total de accesos: X"

COLUMNA DERECHA (⅔) — Tabs:
Tab "Información":
  - Campo Nombre completo (editable)
  - Campo Teléfono (editable)
  - Botón "Guardar cambios" — con estado loading y toast de éxito

Tab "Seguridad":
  - Campo Contraseña actual
  - Campo Nueva contraseña + indicador de fuerza (débil/media/fuerte con color)
  - Campo Confirmar nueva contraseña
  - Botón "Actualizar contraseña"
```

---

## Prompt 16 — Mi Escuela (editable por Director)

```
Página "Mi Escuela" en Pensum.

HEADER de la página:
- Logo placeholder cuadrado (56px) con inicial de la escuela + botón "Cambiar logo" al hover
- Nombre de la escuela (grande, editable al hacer click si eres Director)
- Fila de badges: plan "Pro" (azul), estado "Activo" (verde), país "México"
- Botón "Editar" visible solo para Director (arriba derecha)

GRID 2 columnas — Secciones de info:

Card "Contacto":
- Email de contacto, Teléfono, Dominio
- Cada campo: label pequeño + valor (o "—" si vacío)

Card "Configuración regional":
- Zona horaria, Locale, País

Card "Plan actual":
- Badge plan + "Renovación [fecha]"
- Features incluidas como lista
- Botón "Ver planes disponibles"

Card "Estadísticas rápidas":
- X Miembros totales, X Cursos activos, X Aulas

Modo edición (cuando Director presiona "Editar"):
- Los campos se convierten en inputs inline
- Aparecen botones "Guardar" y "Cancelar" en el header
- Los campos no editables (slug, estado, plan) mantienen su apariencia read-only
```

---

## Prompt 17 — Gestión de Miembros completa (Director)

```
Página "Miembros" en Pensum, vista completa para Director.

HEADER:
- Título "Miembros" + contador total "(12)"
- Botón "Agregar Miembro" (primary)

TABS de filtro por rol:
Todos (12) | Directores (1) | Docentes (3) | Estudiantes (5) | Padres (3)

TABLA:
Columnas: Avatar+Nombre | Email | Rol | Miembro desde | Acciones

- Columna Rol: badge con color por rol
  - Director: negro/oscuro
  - Docente: azul
  - Estudiante: verde  
  - Padre: naranja
- Al hacer click en el badge de rol: se convierte en un Select inline
- Columna Acciones: ícono "..." dropdown con "Cambiar rol" y "Eliminar"
- La fila del usuario actual tiene un badge "Tú" junto al nombre

MODAL "Agregar Miembro":
- Input email con validación en tiempo real
- Select rol: Director / Docente / Estudiante / Padre
- Nota informativa: "El usuario debe estar registrado en Pensum con este email"
- Si email no existe: error inline "Este email no está registrado"

Empty state con ícono de personas y botón CTA
```

---

## Prompt 18 — Estados vacíos y onboarding (Director nuevo)

```
Diseña los estados vacíos y el onboarding de Pensum.

EMPTY STATES — una por sección (diseña 4 en la misma pantalla como galería):

1. Aulas vacías: SVG de pizarrón, "Aún no hay aulas", "Crea la primera aula para organizar tu institución", botón CTA
2. Cursos vacíos: SVG de monitor/pantalla, "Aún no hay cursos", subtítulo, botón CTA  
3. Miembros vacíos: SVG de personas, "Tu equipo está vacío", "Agrega a tu primer docente o alumno", botón CTA
4. Tareas vacías (estudiante): SVG de check grande con color verde, "¡Al día! 🎉", "No tienes tareas pendientes por ahora"

ONBOARDING — checklist flotante para Director nuevo:
- Aparece como card fija en esquina inferior derecha
- Título "Configura tu escuela" + progress "2 / 4 completados"
- Progress bar horizontal (50%)
- Lista de pasos:
  ✅ Escuela creada
  ✅ Primer miembro invitado  
  ⬜ Crear primera aula → botón "Ir"
  ⬜ Crear primer curso → botón "Ir"
- Botón "X" para cerrar / "Completar más tarde"
- Al completar todos: confetti + mensaje "¡Pensum está listo! 🎓"
```

---

## Prompt 19 — Login / Register / Provision

```
Páginas de autenticación para Pensum. Diseña las 3 en la misma pantalla como tabs.

Fondo compartido: gradiente sutil gris muy claro, pattern de puntos o grid tenue.

LOGIN:
- Logo Pensum (ícono rayo + texto) centrado arriba
- Card centrada con shadow-lg
- Título "Bienvenido de vuelta"
- Subtítulo "Ingresa a tu plataforma educativa"
- Email input con ícono
- Password input con toggle show/hide
- Botón "Iniciar Sesión" full-width (primary grande)
- Divider
- Links: "¿No tienes cuenta? Regístrate" | "¿Nueva escuela? Regístrala"

REGISTER:
- Mismo layout
- Título "Crea tu cuenta"
- Email, Password, Confirmar password
- Campo "ID de Escuela" con ícono info (?) + tooltip "Solicita este ID a tu director"
- Botón "Crear cuenta"

PROVISION (nueva escuela) — stepper de 2 pasos:
- Paso 1: Nombre de la escuela, Email del director, Contraseña
- Paso 2: Selección de plan — 3 cards (Starter/Pro/Enterprise) con features y precio
  - La card Pro tiene badge "Más popular" y borde primario
- Botón "Crear mi escuela →"
- Progress steps arriba: ① Datos básicos → ② Elige tu plan
```

---

_Cuando termines todos los prompts, comparte los HTMLs y arrancamos la implementación completa._
