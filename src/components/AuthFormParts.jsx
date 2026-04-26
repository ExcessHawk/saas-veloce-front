import { forwardRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

/* ═════════════ Tabs ═════════════ */
export function AuthHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 22, fontWeight: 800,
        color: 'oklch(8.5% 0.005 80)',
        letterSpacing: '-0.03em', marginBottom: 6,
      }}>
        {title}
      </h1>
      <p style={{ fontSize: 13.5, color: 'oklch(55% 0.010 80)', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

export function AuthTabs({ active }) {
  const navigate = useNavigate();
  const tabs = [
    { id: 'login',    label: 'Iniciar sesión', path: '/login' },
    { id: 'register', label: 'Crear cuenta',   path: '/register' },
  ];
  return (
    <div style={{
      display: 'flex',
      background: 'oklch(94.5% 0.006 80)',
      borderRadius: 10, padding: 3, gap: 3, marginBottom: 28,
    }}>
      {tabs.map(({ id, label, path }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => !isActive && navigate(path)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
              background: isActive ? 'white' : 'transparent',
              color: isActive ? 'oklch(8.5% 0.005 80)' : 'oklch(55% 0.010 80)',
              fontSize: 13.5, fontFamily: 'inherit',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: isActive ? '0 1px 4px oklch(0% 0 0 / 0.08)' : 'none',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/* ═════════════ Input ═════════════ */
export const AuthInput = forwardRef(function AuthInput(
  { label, type = 'text', icon: Icon, suffix, error, mono, ...rest }, ref,
) {
  const [focus, setFocus] = useState(false);
  const borderColor = error
    ? 'oklch(58% 0.200 25)'
    : focus
      ? 'oklch(30% 0.009 80)'
      : 'oklch(89% 0.007 80)';

  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 12.5, fontWeight: 600,
          color: 'oklch(30% 0.009 80)', marginBottom: 6,
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <span style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'oklch(68% 0.010 80)', pointerEvents: 'none', display: 'flex',
          }}>
            <Icon size={15} />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%', padding: '10px 12px',
            paddingLeft: Icon ? 36 : 12,
            paddingRight: suffix ? 40 : 12,
            fontSize: 14, fontFamily: mono ? "'Geist Mono', monospace" : 'inherit',
            border: `1.5px solid ${borderColor}`,
            borderRadius: 10,
            background: 'oklch(99.2% 0.003 80)',
            color: 'oklch(8.5% 0.005 80)',
            outline: 'none', transition: 'border-color 0.12s',
            boxShadow: focus
              ? `0 0 0 3px ${error ? 'oklch(58% 0.200 25 / 0.10)' : 'oklch(8.5% 0.005 80 / 0.07)'}`
              : 'none',
            letterSpacing: mono ? '0.04em' : 'normal',
          }}
          {...rest}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <div style={{
          fontSize: 11.5, color: 'oklch(58% 0.200 25)',
          marginTop: 5,
        }}>
          {error}
        </div>
      )}
    </div>
  );
});

/* ═════════════ Botón principal ═════════════ */
export function AuthButton({ children, loading, type = 'button', onClick, disabled, icon: Icon }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%', padding: '11px',
        borderRadius: 10, border: 'none',
        background: loading || disabled ? 'oklch(30% 0.009 80)' : 'oklch(8.5% 0.005 80)',
        color: 'white', fontSize: 14.5, fontFamily: 'inherit', fontWeight: 600,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s',
      }}
    >
      {loading
        ? <><Spinner /> {children}</>
        : <>{children} {Icon && <Icon size={15} />}</>}
    </button>
  );
}

/* ═════════════ Spinner ═════════════ */
export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/* ═════════════ Divider con texto ═════════════ */
export function Divider({ children = 'o continúa con' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'oklch(89% 0.007 80)' }} />
      <span style={{ fontSize: 12.5, color: 'oklch(68% 0.010 80)', fontWeight: 500, whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: 'oklch(89% 0.007 80)' }} />
    </div>
  );
}

/* ═════════════ Botón Google ═════════════ */
export function GoogleBtn({ label = 'Continuar con Google' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="button"
      onClick={() => toast.info('Inicio con Google estará disponible pronto')}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', padding: '10px',
        borderRadius: 10,
        border: `1.5px solid ${hov ? 'oklch(68% 0.010 80)' : 'oklch(89% 0.007 80)'}`,
        background: hov ? 'oklch(97.5% 0.004 80)' : 'white',
        color: 'oklch(20% 0.008 80)',
        fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 0.1s',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      {label}
    </button>
  );
}

/* ═════════════ Tooltip ═════════════ */
export function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{ color: 'oklch(68% 0.010 80)', cursor: 'help', display: 'flex' }}>
        <HelpCircle size={14} />
      </span>
      {show && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 7px)', left: '50%', transform: 'translateX(-50%)',
          background: 'oklch(8.5% 0.005 80)', color: 'white',
          fontSize: 12, padding: '7px 11px', borderRadius: 10,
          maxWidth: 240, width: 'max-content',
          boxShadow: '0 4px 12px oklch(0% 0 0 / 0.2)',
          pointerEvents: 'none', zIndex: 100, lineHeight: 1.4, fontWeight: 400,
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderTop: '5px solid oklch(8.5% 0.005 80)',
          }} />
        </div>
      )}
    </span>
  );
}

/* ═════════════ Password strength ═════════════ */
function getPwStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const PW_STRENGTH_META = [
  { label: '',           color: 'transparent' },
  { label: 'Muy débil',  color: 'oklch(58% 0.200 25)' },
  { label: 'Débil',      color: 'oklch(72% 0.150 72)' },
  { label: 'Aceptable',  color: 'oklch(72% 0.150 72)' },
  { label: 'Segura',     color: 'oklch(55% 0.140 150)' },
];

export function PwStrengthMeter({ password }) {
  const s = getPwStrength(password);
  const meta = PW_STRENGTH_META[s];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i <= s ? meta.color : 'oklch(89% 0.007 80)',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: meta.color, fontWeight: 500 }}>{meta.label}</div>
    </div>
  );
}

/* ═════════════ Checkbox personalizado ═════════════ */
export function AuthCheckbox({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 16, height: 16, borderRadius: 4,
          border: `1.5px solid ${checked ? 'oklch(8.5% 0.005 80)' : 'oklch(80% 0.009 80)'}`,
          background: checked ? 'oklch(8.5% 0.005 80)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.1s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 13, color: 'oklch(42% 0.010 80)' }}>{label}</span>
    </label>
  );
}
