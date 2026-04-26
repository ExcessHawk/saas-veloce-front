import { Link } from 'react-router';
import { Users, Globe, Shield } from 'lucide-react';

const Point = (props) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'oklch(99% 0 0 / 0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'oklch(85% 0 0)', flexShrink: 0,
    }}>
      <props.icon size={16} />
    </div>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'white', marginBottom: 2 }}>{props.title}</div>
      <div style={{ fontSize: 13, color: 'oklch(55% 0.010 80)', lineHeight: 1.5 }}>{props.sub}</div>
    </div>
  </div>
);

const TRUST_AVATARS = [
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 260),oklch(58% 0.16 300))', initials: 'RC' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 150),oklch(58% 0.16 180))', initials: 'AT' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 50),oklch(58% 0.16 80))',   initials: 'ML' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 300),oklch(58% 0.16 330))', initials: 'JV' },
];

export default function AuthLayout({ children, maxWidth = 420 }) {
  return (
    <div className="auth-split" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', background: 'oklch(97.5% 0.004 80)' }}>

      {/* ── Panel Izquierdo (oscuro) ── */}
      <div className="auth-left" style={{
        flex: '0 0 50%',
        background: 'linear-gradient(160deg, oklch(10% 0.005 260) 0%, oklch(8.5% 0.005 80) 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px', overflow: 'hidden', position: 'relative', minHeight: '100vh',
      }}>
        {/* Pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, oklch(99% 0 0 / 0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'inline-block', marginBottom: 52, textDecoration: 'none' }}>
            <img src="/logo-pensum.png" alt="Pensum" style={{ height: 48, filter: 'brightness(0) invert(1)' }} />
          </Link>

          <h2 className="left-title" style={{
            fontSize: 32, fontWeight: 800, color: 'white',
            letterSpacing: '-0.04em', lineHeight: 1.15,
            marginBottom: 40, maxWidth: 380,
          }}>
            Educación organizada,<br />simple y moderna
          </h2>

          <div className="left-points" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Point icon={Users}  title="Multi-rol"          sub="Director, docentes, alumnos y padres en una misma plataforma" />
            <Point icon={Globe}  title="Sin instalaciones"  sub="Funciona en cualquier navegador, sin descargar nada" />
            <Point icon={Shield} title="Datos seguros"      sub="Tu información cifrada en todo momento con estándares bancarios" />
          </div>
        </div>

        {/* Trust */}
        <div className="left-trust" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex' }}>
              {TRUST_AVATARS.map((a, i) => (
                <div key={i} style={{
                  width: 28, height: 28, borderRadius: '99px',
                  background: a.grad,
                  border: '2px solid oklch(99% 0 0 / 0.15)',
                  marginLeft: i > 0 ? -8 : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'white',
                }}>
                  {a.initials}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'oklch(55% 0.010 80)', margin: 0 }}>
              <strong style={{ color: 'white' }}>+200 escuelas</strong> confían en Pensum
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel Derecho ── */}
      <div className="auth-right" style={{
        flex: 1, background: 'oklch(97.5% 0.004 80)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', overflow: 'auto',
      }}>
        <div className="form-card" style={{
          width: '100%', maxWidth,
          background: 'white',
          border: '1px solid oklch(89% 0.007 80)',
          borderRadius: 24,
          padding: '36px 36px 32px',
          boxShadow: '0 4px 24px oklch(0% 0 0 / 0.06), 0 1px 3px oklch(0% 0 0 / 0.04)',
        }}>
          {children}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-split { flex-direction: column !important; }
          .auth-left  { min-height: 0 !important; flex: none !important; padding: 24px !important; }
          .left-points { display: none !important; }
          .left-title  { font-size: 18px !important; margin: 10px 0 0 !important; }
          .left-trust  { display: none !important; }
          .auth-right  { flex: 1 !important; }
          .form-card   { max-width: 100% !important; padding: 28px 20px !important; border-radius: 0 !important; box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
