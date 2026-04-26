export const MATERIA_COLORS = {
  'Matemáticas':       { bg: 'oklch(91% 0.040 250)', color: 'oklch(32% 0.07 250)' },
  'Español':           { bg: 'oklch(93% 0.040 150)', color: 'oklch(32% 0.09 150)' },
  'Historia':          { bg: 'oklch(93% 0.050 75)',  color: 'oklch(38% 0.10 72)'  },
  'Ciencias Naturales':{ bg: 'oklch(92% 0.040 200)', color: 'oklch(32% 0.08 200)' },
  'Ciencias':          { bg: 'oklch(92% 0.040 200)', color: 'oklch(32% 0.08 200)' },
  'Inglés':            { bg: 'oklch(93% 0.035 300)', color: 'oklch(32% 0.07 300)' },
  'Educación Física':  { bg: 'oklch(93% 0.050 25)',  color: 'oklch(38% 0.12 25)'  },
  'Arte':              { bg: 'oklch(93% 0.040 330)', color: 'oklch(35% 0.09 330)' },
  'Artes Plásticas':   { bg: 'oklch(93% 0.040 330)', color: 'oklch(35% 0.09 330)' },
  'Música':            { bg: 'oklch(93% 0.045 50)',  color: 'oklch(36% 0.10 50)'  },
  'Tecnología':        { bg: 'oklch(92% 0.040 230)', color: 'oklch(32% 0.08 230)' },
  'Geografía':         { bg: 'oklch(93% 0.040 170)', color: 'oklch(35% 0.09 170)' },
};

const DEFAULT_COLOR = { bg: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)' };

export function getMateriaColor(name) {
  return MATERIA_COLORS[name] ?? DEFAULT_COLOR;
}

/** Genera un color de avatar consistente a partir de un nombre */
export function avatarColor(name = '') {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `oklch(68% 0.12 ${h})`;
}

export function getInitials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}
