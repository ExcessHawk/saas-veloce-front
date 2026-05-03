import { Link } from 'react-router';
import { Users, Globe, Shield } from 'lucide-react';

const Point = ({ icon: Icon, title, sub }) => (
  <div className="flex items-start gap-[14px]">
    <div className="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 shrink-0">
      <Icon size={16} />
    </div>
    <div>
      <div className="text-[14px] font-semibold text-white mb-[2px]">{title}</div>
      <div className="text-[13px] text-[oklch(55%_0.010_80)] leading-relaxed">{sub}</div>
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
    <div className="flex min-h-screen overflow-hidden bg-p-bg-subtle max-md:flex-col">

      {/* Panel izquierdo */}
      <div
        className="shrink-0 basis-1/2 flex flex-col justify-between px-[52px] py-12 overflow-hidden relative min-h-screen max-md:min-h-0 max-md:flex-none max-md:px-6 max-md:py-6"
        style={{ background: 'linear-gradient(160deg, oklch(10% 0.005 260) 0%, oklch(8.5% 0.005 80) 100%)' }}
      >
        {/* Dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, oklch(99% 0 0 / 0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-block mb-[52px] max-md:mb-3">
            <img src="/logo-pensum.png" alt="Pensum" className="h-10 brightness-0 invert object-contain" />
          </Link>

          <h2 className="text-[32px] font-extrabold text-white tracking-[-0.04em] leading-[1.15] mb-10 max-w-[380px] max-md:text-[18px] max-md:mb-0 max-md:mt-[10px]">
            Educación organizada,<br />simple y moderna
          </h2>

          <div className="flex flex-col gap-6 max-md:hidden">
            <Point icon={Users}  title="Multi-rol"          sub="Director, docentes, alumnos y padres en una misma plataforma" />
            <Point icon={Globe}  title="Sin instalaciones"  sub="Funciona en cualquier navegador, sin descargar nada" />
            <Point icon={Shield} title="Datos seguros"      sub="Tu información cifrada en todo momento con estándares bancarios" />
          </div>
        </div>

        {/* Trust badges */}
        <div className="relative z-10 max-md:hidden">
          <div className="flex items-center gap-[10px]">
            <div className="flex">
              {TRUST_AVATARS.map((a, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white/15 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: a.grad, marginLeft: i > 0 ? -8 : 0 }}>
                  {a.initials}
                </div>
              ))}
            </div>
            <p className="text-[13px] text-[oklch(55%_0.010_80)] m-0">
              <strong className="text-white">+200 escuelas</strong> confían en Pensum
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex-1 bg-p-bg-subtle flex items-center justify-center px-6 py-8 overflow-auto">
        <div
          className="w-full bg-p-bg-base border border-p-border rounded-[24px] px-9 py-9 shadow-[0_4px_24px_oklch(0%_0_0/0.06),0_1px_3px_oklch(0%_0_0/0.04)] max-md:rounded-none max-md:shadow-none max-md:border-none max-md:px-5 max-md:py-7"
          style={{ maxWidth }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
