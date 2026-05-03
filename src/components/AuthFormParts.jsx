import { forwardRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AuthHeader({ title, subtitle }) {
  return (
    <div className="mb-7">
      <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] mb-[6px]">
        {title}
      </h1>
      <p className="text-[13.5px] text-p-text-secondary m-0">{subtitle}</p>
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
    <div className="flex bg-p-bg-subtle rounded-[10px] p-[3px] gap-[3px] mb-7">
      {tabs.map(({ id, label, path }) => {
        const isActive = active === id;
        return (
          <button key={id} type="button" onClick={() => !isActive && navigate(path)}
            className={cn(
              'flex-1 py-2 rounded-lg border-0 text-[13.5px] font-sans cursor-pointer transition-all duration-150',
              isActive
                ? 'bg-p-bg-base text-p-text-primary font-semibold shadow-[0_1px_4px_oklch(0%_0_0/0.08)]'
                : 'bg-transparent text-p-text-tertiary font-medium'
            )}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export const AuthInput = forwardRef(function AuthInput(
  { label, type = 'text', icon: Icon, suffix, error, mono, ...rest }, ref,
) {
  return (
    <div className="mb-[14px]">
      {label && (
        <label className="flex items-center gap-[6px] text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none flex">
            <Icon size={15} />
          </span>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full py-[10px] px-3 text-[14px] border-[1.5px] rounded-[10px]',
            'bg-p-bg-base text-p-text-primary outline-none',
            'transition-[border-color,box-shadow] duration-[120ms]',
            'focus:border-p-border-strong focus:ring-[3px] focus:ring-black/7',
            error
              ? 'border-p-d-500 focus:ring-p-d-500/10'
              : 'border-p-border',
            Icon ? 'pl-9' : 'pl-3',
            suffix ? 'pr-10' : 'pr-3',
            mono ? 'font-mono tracking-[0.04em]' : 'font-sans'
          )}
          {...rest}
        />
        {suffix && (
          <span className="absolute right-[10px] top-1/2 -translate-y-1/2">{suffix}</span>
        )}
      </div>
      {error && <div className="text-[11.5px] text-p-d-500 mt-[5px]">{error}</div>}
    </div>
  );
});

export function AuthButton({ children, loading, type = 'button', onClick, disabled, icon: Icon }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={cn(
        'w-full py-[11px] rounded-[10px] border-0 text-p-accent-text text-[14.5px] font-sans font-semibold',
        'flex items-center justify-center gap-2 transition-all duration-150',
        loading || disabled
          ? 'bg-p-bg-muted text-p-text-tertiary cursor-not-allowed'
          : 'bg-p-accent cursor-pointer hover:bg-p-accent-hover'
      )}>
      {loading
        ? <><Spinner /> {children}</>
        : <>{children} {Icon && <Icon size={15} />}</>}
    </button>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

export function Divider({ children = 'o continúa con' }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-p-border" />
      <span className="text-[12.5px] text-p-text-tertiary font-medium whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-p-border" />
    </div>
  );
}

export function GoogleBtn({ label = 'Continuar con Google' }) {
  return (
    <button type="button" onClick={() => toast.info('Inicio con Google estará disponible pronto')}
      className="w-full py-[10px] rounded-[10px] border-[1.5px] border-p-border bg-p-bg-base text-p-text-primary text-[14px] font-sans font-medium cursor-pointer flex items-center justify-center gap-[10px] transition-all duration-100 hover:border-p-text-tertiary hover:bg-p-bg-subtle">
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

export function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-p-text-tertiary cursor-help flex"><HelpCircle size={14} /></span>
      {show && (
        <div className="absolute bottom-[calc(100%+7px)] left-1/2 -translate-x-1/2 bg-[oklch(8.5%_0.005_80)] text-white text-[12px] px-[11px] py-[7px] rounded-[10px] max-w-[240px] w-max shadow-[0_4px_12px_oklch(0%_0_0/0.2)] pointer-events-none z-[100] leading-[1.4] font-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent border-t-[oklch(8.5%_0.005_80)]" />
        </div>
      )}
    </span>
  );
}

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
    <div className="mt-2">
      <div className="flex gap-1 mb-[5px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 h-[3px] rounded-full transition-[background] duration-200"
            style={{ background: i <= s ? meta.color : 'oklch(89% 0.007 80)' }} />
        ))}
      </div>
      <div className="text-[11.5px] font-medium" style={{ color: meta.color }}>{meta.label}</div>
    </div>
  );
}

export function AuthCheckbox({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-[7px] cursor-pointer select-none">
      <div onClick={() => onChange(!checked)}
        className={cn(
          'w-4 h-4 rounded shrink-0 flex items-center justify-center transition-all duration-100 cursor-pointer border-[1.5px]',
          checked
            ? 'bg-p-accent border-p-accent'
            : 'bg-transparent border-p-border-strong'
        )}>
        {checked && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-[13px] text-p-text-secondary">{label}</span>
    </label>
  );
}
