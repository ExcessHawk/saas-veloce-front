import { useState, useEffect } from 'react';
import { Link } from 'react-router';

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="oklch(72% 0.150 72)" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const COURSE_ROWS = [
  ['Matemáticas', '3A', 'A. Torres', 'oklch(93% 0.060 150)', 'oklch(40% 0.120 150)'],
  ['Español', '3A', 'C. Reyes', 'oklch(93% 0.060 150)', 'oklch(40% 0.120 150)'],
  ['Historia', '2B', 'M. Leal', 'oklch(95% 0.060 75)', 'oklch(52% 0.130 72)'],
];

const INSCR_CARDS = [
  ['Matemáticas', 'oklch(91% 0.040 250)', 'oklch(32% 0.07 250)', '24/30'],
  ['Español', 'oklch(93% 0.040 150)', 'oklch(32% 0.09 150)', '22/30'],
  ['Historia', 'oklch(93% 0.050 75)', 'oklch(38% 0.10 72)', '18/25'],
  ['Inglés', 'oklch(93% 0.035 300)', 'oklch(32% 0.07 300)', '12/20'],
  ['Ciencias', 'oklch(92% 0.040 200)', 'oklch(32% 0.08 200)', '30/30'],
  ['Ed. Física', 'oklch(93% 0.050 25)', 'oklch(38% 0.12 25)', '8/35'],
];

const TRUST_AVATARS = [
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 260),oklch(58% 0.16 300))', initials: 'RC' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 150),oklch(58% 0.16 180))', initials: 'AT' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 50),oklch(58% 0.16 80))', initials: 'ML' },
  { grad: 'linear-gradient(135deg,oklch(65% 0.14 300),oklch(58% 0.16 330))', initials: 'JV' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [currency, setCurrency] = useState('mxn');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const PRICES = {
    mxn: { starter: { mo: '499', yr: '399' }, pro: { mo: '1,499', yr: '1,199' }, symbol: '$', label: 'MXN' },
    usd: { starter: { mo: '29', yr: '23' }, pro: { mo: '79', yr: '63' }, symbol: '$', label: 'USD' },
  };
  const p = PRICES[currency];
  const starterPrice = annual ? p.starter.yr : p.starter.mo;
  const proPrice = annual ? p.pro.yr : p.pro.mo;

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        body{font-family:'Geist',system-ui,sans-serif;background:#fafaf9;color:#0d0d0c;}
        :root{
          --n-0:oklch(99.2% 0.003 80);--n-50:oklch(97.5% 0.004 80);--n-100:oklch(94.5% 0.006 80);
          --n-200:oklch(89% 0.007 80);--n-300:oklch(80% 0.009 80);--n-400:oklch(68% 0.010 80);
          --n-500:oklch(55% 0.010 80);--n-600:oklch(42% 0.010 80);--n-700:oklch(30% 0.009 80);
          --n-800:oklch(20% 0.008 80);--n-900:oklch(13% 0.006 80);--n-950:oklch(8.5% 0.005 80);
          --s-500:oklch(55% 0.140 150);
        }
        .lp-container{max-width:1160px;margin:0 auto;padding:0 24px;}
        .lp-section{padding:96px 0;}
        .lp-section-sm{padding:64px 0;}
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:background .2s,box-shadow .2s,border-color .2s;border-bottom:1px solid transparent;}
        .lp-nav.scrolled{background:rgba(250,250,249,0.92);backdrop-filter:blur(12px);border-color:var(--n-200);box-shadow:0 1px 3px oklch(0% 0 0/0.04);}
        .lp-nav-inner{max-width:1160px;margin:0 auto;padding:0 24px;height:60px;display:flex;align-items:center;}
        .lp-nav-links{display:flex;align-items:center;gap:2px;margin:0 auto;}
        .lp-nav-link{padding:6px 14px;border-radius:10px;font-size:14px;font-weight:500;color:var(--n-600);text-decoration:none;transition:all .1s;}
        .lp-nav-link:hover{color:var(--n-950);background:var(--n-100);}
        .lp-btn-ghost{padding:7px 16px;border-radius:10px;font-size:13.5px;font-weight:500;color:var(--n-700);background:transparent;border:1px solid transparent;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .1s;display:inline-flex;align-items:center;}
        .lp-btn-ghost:hover{background:var(--n-100);color:var(--n-950);}
        .lp-btn-primary{padding:7px 18px;border-radius:10px;font-size:13.5px;font-weight:600;color:var(--n-0);background:var(--n-950);border:none;cursor:pointer;font-family:inherit;text-decoration:none;transition:all .12s;display:inline-flex;align-items:center;gap:6px;}
        .lp-btn-primary:hover{background:var(--n-800);transform:translateY(-0.5px);}
        .lp-btn-primary-lg{padding:12px 28px;font-size:15px;border-radius:12px;}
        .lp-btn-secondary-lg{padding:12px 24px;font-size:15px;border-radius:12px;background:transparent;border:1.5px solid var(--n-300);color:var(--n-950);font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .12s;}
        .lp-btn-secondary-lg:hover{background:var(--n-100);border-color:var(--n-400);}
        .lp-mockup-wrap{border-radius:18px;overflow:hidden;border:1.5px solid var(--n-200);box-shadow:0 24px 60px oklch(0% 0 0/0.12),0 8px 20px oklch(0% 0 0/0.07);background:var(--n-50);}
        .lp-mockup-bar{height:36px;background:var(--n-950);display:flex;align-items:center;padding:0 14px;gap:7px;}
        .lp-feature-card{padding:28px;background:white;border:1px solid var(--n-200);border-radius:24px;transition:box-shadow .15s,transform .15s;}
        .lp-feature-card:hover{box-shadow:0 8px 24px oklch(0% 0 0/0.07);transform:translateY(-2px);}
        .lp-testi-card{padding:28px;background:white;border:1px solid var(--n-200);border-radius:24px;}
        .lp-section-label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--n-500);margin-bottom:14px;}
        .lp-section-title{font-size:clamp(28px,3.5vw,42px);font-weight:800;color:var(--n-950);letter-spacing:-.035em;line-height:1.12;margin-bottom:16px;text-wrap:balance;}
        .lp-section-sub{font-size:17px;color:var(--n-600);line-height:1.65;max-width:560px;}
        .lp-hero{padding:140px 0 80px;overflow:hidden;}
        .lp-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
        .lp-features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;}
        .lp-screenshot-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;}
        .lp-testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .lp-footer-grid{display:grid;grid-template-columns:1.8fr 1fr 1fr 1fr;gap:48px;margin-bottom:48px;}
        .lp-pricing-outer{margin-top:52px;display:grid;grid-template-columns:1fr 1.55fr 1fr;gap:12px;align-items:center;}
        .lp-pc-side{background:oklch(99% 0 0/0.05);border:1px solid oklch(99% 0 0/0.10);border-radius:22px;padding:28px;display:flex;flex-direction:column;}
        .lp-pc-side-btn{display:flex;justify-content:center;align-items:center;padding:10px 0;border-radius:12px;border:1px solid oklch(99% 0 0/0.15);background:transparent;color:oklch(72% 0.010 80);font-size:13.5px;font-weight:600;font-family:inherit;cursor:pointer;text-decoration:none;transition:all .12s;}
        .lp-pc-side-btn:hover{background:oklch(99% 0 0/0.08);color:white;border-color:oklch(99% 0 0/0.25);}
        .lp-pc-pro{border-radius:26px;overflow:hidden;box-shadow:0 32px 64px oklch(0% 0 0/0.5),0 0 0 1px oklch(99% 0 0/0.12);display:flex;flex-direction:column;}
        .lp-billing-seg{display:flex;background:oklch(99% 0 0/0.07);border:1px solid oklch(99% 0 0/0.12);border-radius:9999px;padding:3px;gap:2px;}
        .lp-seg-btn{padding:7px 20px;border-radius:9999px;border:none;font-size:13.5px;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;}
        .lp-seg-btn.active{background:white;color:var(--n-950);box-shadow:0 1px 4px oklch(0% 0 0/0.15);}
        .lp-seg-btn:not(.active){background:transparent;color:oklch(55% 0.010 80);}
        .lp-logos-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:32px 48px;opacity:.45;filter:grayscale(1);}
        .lp-check-item{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;color:var(--n-700);line-height:1.5;}
        .lp-check-icon{width:20px;height:20px;border-radius:99px;background:var(--n-950);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        footer a{color:oklch(68% 0.010 80);text-decoration:none;font-size:13.5px;display:block;margin-bottom:10px;transition:color .1s;}
        footer a:hover{color:white;}
        @media(max-width:900px){
          .lp-hero-grid,.lp-features-grid,.lp-screenshot-grid,.lp-testi-grid,.lp-pricing-outer{grid-template-columns:1fr;}
          .lp-footer-grid{grid-template-columns:1fr 1fr;}
          .lp-hero{padding:120px 0 60px;}
          .lp-nav-links{display:none;}
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo-pensum.png" alt="Pensum" style={{ height: '28px', width: 'auto', objectFit: 'contain', display: 'block' }} />
          </a>
          <div className="lp-nav-links">
            <a href="#features" className="lp-nav-link">Producto</a>
            <a href="#pricing" className="lp-nav-link">Precios</a>
            <a href="#screenshot" className="lp-nav-link">Para escuelas</a>
            <a href="#cta" className="lp-nav-link">Contacto</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link to="/login" className="lp-btn-ghost">Iniciar sesión</Link>
            <Link to="/provision" className="lp-btn-primary">Probar gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero" id="hero">
        <div className="lp-container">
          <div className="lp-hero-grid">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 14px', borderRadius: 9999, background: 'var(--n-100)', border: '1px solid var(--n-200)', fontSize: 13, fontWeight: 500, color: 'var(--n-700)', marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--s-500)', display: 'inline-block' }} />
                Usado por más de 200 escuelas en Latinoamérica
              </div>
              <h1 style={{ fontSize: 'clamp(38px,5vw,58px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', color: 'var(--n-950)', marginBottom: 22, textWrap: 'balance' }}>
                La plataforma educativa que tu escuela <em style={{ fontStyle: 'normal', background: 'linear-gradient(135deg,var(--n-950),oklch(42% 0.010 80))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>merece</em>
              </h1>
              <p style={{ fontSize: 18, color: 'var(--n-600)', lineHeight: 1.65, maxWidth: 520, marginBottom: 40, fontWeight: 400 }}>
                Gestiona aulas, cursos, docentes y alumnos desde un solo lugar. Sin complicaciones, sin curva de aprendizaje.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link to="/provision" className="lp-btn-primary lp-btn-primary-lg">Empieza gratis <ArrowIcon /></Link>
                <Link to="/login" className="lp-btn-secondary-lg">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polygon fill="currentColor" stroke="none" points="10,8 16,12 10,16" /></svg>
                  Ver demo
                </Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28 }}>
                <div style={{ display: 'flex' }}>
                  {TRUST_AVATARS.map((a, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 99, background: a.grad, border: '2px solid white', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{a.initials}</div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--n-500)', margin: 0 }}><strong style={{ color: 'var(--n-700)' }}>+850 directores</strong> ya usan Pensum</p>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div>
              <div className="lp-mockup-wrap">
                <div className="lp-mockup-bar">
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: '#ff5f57' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: '#ffbd2e' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 99, background: '#28c840' }} />
                </div>
                <div style={{ display: 'flex', height: 340 }}>
                  {/* Sidebar */}
                  <div style={{ width: 160, background: 'oklch(9% 0.005 80)', padding: '12px 8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ padding: '8px 10px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <img src="/logo-pensum.png" alt="Pensum" height="20" style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain' }} />
                    </div>
                    {[
                      ['Dashboard', true],
                      ['Aulas', false],
                      ['Materias', false],
                      ['Miembros', false],
                    ].map(([label, active]) => (
                      <div key={label} style={{ background: active ? 'oklch(99% 0 0/0.10)' : 'transparent', borderRadius: 6, padding: '6px 8px', display: 'flex', alignItems: 'center', gap: 6, opacity: active ? 1 : 0.6 }}>
                        <span style={{ fontSize: 10, color: active ? 'white' : 'oklch(68% 0.010 80)', fontWeight: active ? 500 : 400 }}>{label}</span>
                      </div>
                    ))}
                    <div style={{ margin: '8px 0', height: 1, background: 'oklch(99% 0 0/0.07)' }} />
                    <div style={{ marginTop: 'auto', background: 'oklch(99% 0 0/0.06)', borderRadius: 6, padding: '7px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 99, background: 'linear-gradient(135deg,oklch(65% 0.14 260),oklch(58% 0.16 300))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'white', flexShrink: 0 }}>RC</div>
                      <div>
                        <div style={{ fontSize: 9.5, fontWeight: 500, color: 'oklch(90% 0.006 80)' }}>R. Castellanos</div>
                        <div style={{ fontSize: 8.5, color: 'oklch(55% 0.010 80)' }}>Director</div>
                      </div>
                    </div>
                  </div>
                  {/* Main */}
                  <div style={{ flex: 1, background: 'oklch(97.5% 0.004 80)', padding: 14, overflow: 'hidden' }}>
                    <div style={{ background: 'oklch(99.2% 0.003 80)', border: '1px solid oklch(89% 0.007 80)', borderRadius: 8, padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ flex: 1, fontSize: 10.5, fontWeight: 600, color: 'oklch(8.5% 0.005 80)' }}>Dashboard</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
                      {[['Aulas', '6'], ['Cursos', '10'], ['Alumnos', '284'], ['Docentes', '12']].map(([l, v]) => (
                        <div key={l} style={{ background: 'white', border: '1px solid oklch(89% 0.007 80)', borderRadius: 8, padding: 10 }}>
                          <div style={{ fontSize: 7.5, color: 'oklch(42% 0.010 80)', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: 'oklch(8.5% 0.005 80)', letterSpacing: '-0.04em', lineHeight: 1 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: 'white', border: '1px solid oklch(89% 0.007 80)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '9px 12px', borderBottom: '1px solid oklch(89% 0.007 80)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 600, color: 'oklch(8.5% 0.005 80)' }}>Últimos cursos</span>
                        <div style={{ fontSize: 8, padding: '2px 8px', background: 'oklch(8.5% 0.005 80)', color: 'white', borderRadius: 4 }}>+ Nuevo</div>
                      </div>
                      <div style={{ background: 'oklch(94.5% 0.006 80)', padding: '5px 12px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 8 }}>
                        {['Materia', 'Aula', 'Docente', 'Estado'].map(h => (
                          <div key={h} style={{ fontSize: 7, fontWeight: 700, color: 'oklch(55% 0.010 80)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                        ))}
                      </div>
                      {COURSE_ROWS.map(([m, a, d, bg, col]) => (
                        <div key={m} style={{ padding: '6px 12px', borderTop: '1px solid oklch(89% 0.007 80)', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
                          <div style={{ fontSize: 9, fontWeight: 500, color: 'oklch(8.5% 0.005 80)' }}>{m}</div>
                          <div style={{ fontSize: 9, color: 'oklch(42% 0.010 80)' }}>Aula {a}</div>
                          <div style={{ fontSize: 9, color: 'oklch(42% 0.010 80)' }}>Prof. {d}</div>
                          <div style={{ fontSize: 8, padding: '1px 6px', background: bg, color: col, borderRadius: 99, fontWeight: 600 }}>Activo</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="lp-section-sm" style={{ background: 'white', borderTop: '1px solid var(--n-200)', borderBottom: '1px solid var(--n-200)' }}>
        <div className="lp-container">
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--n-400)', fontWeight: 500, marginBottom: 28, letterSpacing: '0.02em' }}>CONFÍAN EN NOSOTROS INSTITUCIONES DE TODA LATINOAMÉRICA</p>
          <div className="lp-logos-row">
            {['Colegio Iberoamericano', 'Escuela Montessori MX', 'Instituto Bilingüe del Norte', 'Colegio San Patricio', 'Academia Siglo XXI', 'Colegio Americano Guadalajara', 'Instituto Moderno', 'Escuela Valle Verde'].map(name => (
              <span key={name} style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--n-800)' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="lp-section-label">Características</div>
            <h2 className="lp-section-title">Todo lo que tu escuela necesita,<br />en un solo lugar</h2>
            <p className="lp-section-sub" style={{ margin: '0 auto' }}>Diseñado para directores que quieren resultados, no complicaciones.</p>
          </div>
          <div className="lp-features-grid">
            {[
              {
                bg: 'oklch(91% 0.040 250)', stroke: 'oklch(32% 0.07 250)', title: 'Gestión de aulas', desc: 'Crea aulas, asigna alumnos y docentes en segundos. Controla capacidades y organiza por grados y niveles.',
                icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              },
              {
                bg: 'oklch(93% 0.040 150)', stroke: 'oklch(32% 0.09 150)', title: 'Tareas y calificaciones', desc: 'Los docentes publican tareas con fechas límite. Los alumnos entregan en línea y reciben calificaciones al instante.',
                icon: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>
              },
              {
                bg: 'oklch(93% 0.035 300)', stroke: 'oklch(32% 0.07 300)', title: 'Multi-rol', desc: 'Director, docentes, estudiantes y padres en una misma plataforma. Cada rol ve solo lo que necesita.',
                icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>
              },
              {
                bg: 'oklch(93% 0.050 75)', stroke: 'oklch(38% 0.10 72)', title: 'Analíticas en tiempo real', desc: 'Visualiza el desempeño de alumnos, tasas de entrega y calificaciones promedio con dashboards claros.',
                icon: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>
              },
              {
                bg: 'oklch(93% 0.040 330)', stroke: 'oklch(35% 0.09 330)', title: 'Años académicos', desc: 'Gestiona múltiples ciclos escolares. Cierra el año anterior y abre el nuevo con un solo clic.',
                icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>
              },
              {
                bg: 'oklch(92% 0.040 200)', stroke: 'oklch(32% 0.08 200)', title: 'Multi-tenant seguro', desc: 'Cada institución tiene su propio espacio aislado. Datos seguros, acceso controlado, 99.9% uptime garantizado.',
                icon: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>
              },
            ].map(({ bg, stroke, title, desc, icon }) => (
              <div key={title} className="lp-feature-card">
                <div style={{ width: 48, height: 48, borderRadius: 14, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round">{icon}</svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--n-950)', marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</div>
                <p style={{ fontSize: 14, color: 'var(--n-600)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCREENSHOT */}
      <section className="lp-section" style={{ background: 'white', borderTop: '1px solid var(--n-200)', borderBottom: '1px solid var(--n-200)' }} id="screenshot">
        <div className="lp-container">
          <div className="lp-screenshot-grid">
            <div>
              <div className="lp-mockup-wrap">
                <div className="lp-mockup-bar" />
                <div style={{ padding: 18, background: 'oklch(97.5% 0.004 80)' }}>
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'oklch(8.5% 0.005 80)', letterSpacing: '-0.03em' }}>Inscripciones</div>
                      <div style={{ fontSize: 10, color: 'oklch(42% 0.010 80)', marginTop: 2 }}>Selecciona un curso para gestionar alumnos</div>
                    </div>
                    <div style={{ fontSize: 10, padding: '4px 10px', border: '1px solid oklch(89% 0.007 80)', borderRadius: 6, color: 'oklch(42% 0.010 80)' }}>2025–2026 ▾</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {INSCR_CARDS.map(([m, bg, col, cnt]) => {
                      const [filled, total] = cnt.split('/').map(Number);
                      return (
                        <div key={m} style={{ background: 'white', border: '1.5px solid oklch(89% 0.007 80)', borderRadius: 8, padding: 10, position: 'relative', overflow: 'hidden' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: col, opacity: .7 }} />
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: 'oklch(8.5% 0.005 80)' }}>{m}</div>
                          <div style={{ fontSize: 8, color: 'oklch(42% 0.010 80)', margin: '3px 0 7px' }}>Aula 3A</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ height: 3, flex: 1, borderRadius: 99, background: bg, marginRight: 6 }}>
                              <div style={{ height: 3, borderRadius: 99, background: col, width: `${filled / total * 100}%` }} />
                            </div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: col }}>{cnt}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="lp-section-label">Para escuelas que crecen</div>
              <h2 className="lp-section-title">Diseñado para cómo realmente trabajan las escuelas</h2>
              <p style={{ fontSize: 16, color: 'var(--n-600)', lineHeight: 1.7, marginBottom: 10 }}>Pensum no es un ERP complicado. Es una plataforma simple y poderosa, construida con directores reales.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
                {['Inscripciones en segundos — arrastra alumnos a cualquier curso', 'Control de capacidades y alertas de cupo lleno automáticas', 'Asigna docentes a cursos con búsqueda inteligente', 'Los padres monitorean el progreso de sus hijos en tiempo real', 'Implementación en menos de un día laboral'].map(item => (
                  <div key={item} className="lp-check-item">
                    <div className="lp-check-icon"><CheckIcon /></div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="lp-section" style={{ background: 'var(--n-950)' }} id="pricing">
        <div className="lp-container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'oklch(42% 0.010 80)', marginBottom: 14 }}>Precios</div>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,42px)', fontWeight: 800, color: 'white', letterSpacing: '-.035em', lineHeight: 1.12, marginBottom: 16, textWrap: 'balance' }}>Elige el plan ideal para tu institución</h2>
            <p style={{ fontSize: 17, color: 'oklch(55% 0.010 80)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 28px' }}>Sin contratos a largo plazo. Cancela cuando quieras.</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="lp-billing-seg">
                <button className={`lp-seg-btn${!annual ? ' active' : ''}`} onClick={() => setAnnual(false)}>Mensual</button>
                <button className={`lp-seg-btn${annual ? ' active' : ''}`} onClick={() => setAnnual(true)}>Anual</button>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 11.5, fontWeight: 700, background: 'var(--s-500)', color: 'white', opacity: annual ? 1 : 0, transition: 'opacity .2s' }}>Ahorra 20%</span>
              <div className="lp-billing-seg">
                <button className={`lp-seg-btn${currency === 'mxn' ? ' active' : ''}`} onClick={() => setCurrency('mxn')}>MXN</button>
                <button className={`lp-seg-btn${currency === 'usd' ? ' active' : ''}`} onClick={() => setCurrency('usd')}>USD</button>
              </div>
            </div>
          </div>

          <div className="lp-pricing-outer">
            {/* Starter */}
            <div className="lp-pc-side">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(55% 0.010 80)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 18 }}>Starter</div>
              <div style={{ fontSize: 38, fontWeight: 800, color: 'white', letterSpacing: '-0.05em', lineHeight: 1 }}><sup style={{ fontSize: 17, verticalAlign: 'top', marginTop: 8, fontWeight: 600 }}>$</sup>{starterPrice}<sub style={{ fontSize: 13, fontWeight: 500, color: 'oklch(42% 0.010 80)' }}>{p.label}   /mes</sub></div>
              <div style={{ fontSize: 12.5, color: 'oklch(42% 0.010 80)', margin: '8px 0 22px' }}>Hasta 150 alumnos · 5 docentes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, marginBottom: 24 }}>
                {['1 institución', 'Aulas y cursos', 'Director y docentes', 'Soporte por email'].map(f => (
                  <div key={f} style={{ fontSize: 13, color: 'oklch(62% 0.010 80)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </div>
                ))}
              </div>
              <Link to="/provision" className="lp-pc-side-btn">Empezar gratis</Link>
            </div>

            {/* Pro */}
            <div className="lp-pc-pro">
              <div style={{ background: 'white', padding: '32px 32px 28px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'var(--n-950)', color: 'white', fontSize: 11.5, fontWeight: 700, marginBottom: 18 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--s-500)', display: 'inline-block' }} /> Más popular entre directores
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Pro</div>
                <div style={{ fontSize: 56, fontWeight: 900, color: 'var(--n-950)', letterSpacing: '-0.06em', lineHeight: 1 }}><sup style={{ fontSize: 22, verticalAlign: 'top', marginTop: 12, fontWeight: 700 }}>$</sup>{proPrice}<sub style={{ fontSize: 14, fontWeight: 500, color: 'var(--n-500)' }}> {p.label}/mes</sub></div>
                <div style={{ fontSize: 13, color: 'var(--n-500)', marginTop: 10 }}>Hasta 600 alumnos · 25 docentes</div>
              </div>
              <div style={{ background: 'var(--n-100)', padding: '20px 32px', borderTop: '1px solid var(--n-200)', borderBottom: '1px solid var(--n-200)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--n-500)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Capacidad de alumnos</span><span style={{ fontWeight: 700, color: 'var(--n-950)' }}>600 alumnos</span>
                </div>
                <div style={{ height: 6, background: 'var(--n-200)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--n-950)', width: '60%' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--n-400)', marginTop: 4 }}>
                  <span>Starter · 150</span><span>Pro · 600</span><span>Enterprise · ∞</span>
                </div>
              </div>
              <div style={{ background: 'var(--n-950)', padding: '24px 32px 32px', flex: 1 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
                  {['Todo de Starter', 'Analíticas avanzadas', 'Portal para padres', 'Tareas digitales', 'Soporte prioritario', 'API de integraciones'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'oklch(75% 0.010 80)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="oklch(55% 0.140 150)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/provision" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 14, background: 'white', color: 'var(--n-950)', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', textDecoration: 'none', transition: 'all .12s', border: 'none', width: '100%' }}>
                  Empezar con Pro <ArrowIcon />
                </Link>
              </div>
            </div>

            {/* Enterprise */}
            <div className="lp-pc-side">
              <div style={{ fontSize: 13, fontWeight: 600, color: 'oklch(55% 0.010 80)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 18 }}>Enterprise</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.2 }}>A la<br />medida</div>
              <div style={{ fontSize: 12.5, color: 'oklch(42% 0.010 80)', margin: '8px 0 22px' }}>Ilimitado · Red de escuelas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, marginBottom: 24 }}>
                {['Todo de Pro', 'Multi-institución', 'SLA 99.99%', 'Gerente dedicado'].map(f => (
                  <div key={f} style={{ fontSize: 13, color: 'oklch(62% 0.010 80)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {f}
                  </div>
                ))}
              </div>
              <a href="mailto:hola@pensum.app" className="lp-pc-side-btn">Hablar con ventas</a>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'oklch(42% 0.010 80)', marginTop: 32 }}>Todos los planes incluyen 14 días de prueba gratuita · Sin tarjeta de crédito</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-section" style={{ background: 'white', borderTop: '1px solid var(--n-200)' }}>
        <div className="lp-container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div className="lp-section-label">Testimonios</div>
            <h2 className="lp-section-title">Lo que dicen los directores</h2>
          </div>
          <div className="lp-testi-grid">
            {[
              { initials: 'RC', grad: 'linear-gradient(135deg,oklch(65% 0.14 260),oklch(58% 0.16 300))', name: 'Roberto Castellanos', school: 'Director · Colegio Iberoamericano, CDMX', quote: 'Antes usábamos hojas de cálculo para todo. Pensum transformó la forma en que gestionamos nuestra escuela. En dos semanas ya teníamos todo migrado.' },
              { initials: 'ML', grad: 'linear-gradient(135deg,oklch(65% 0.14 150),oklch(58% 0.16 180))', name: 'María Luisa Garza', school: 'Directora · Instituto Bilingüe del Norte, Monterrey', quote: 'Los padres de familia ahora pueden ver las tareas pendientes de sus hijos desde el celular. El nivel de involucramiento subió notablemente desde que implementamos Pensum.' },
              { initials: 'JV', grad: 'linear-gradient(135deg,oklch(65% 0.14 50),oklch(58% 0.16 80))', name: 'Jorge Vidal', school: 'Director · Academia Siglo XXI, Guadalajara', quote: 'La facilidad para crear cursos, asignar docentes y gestionar inscripciones es impresionante. Mis docentes lo aprendieron solos en menos de una hora.' },
            ].map(({ initials, grad, name, school, quote }) => (
              <div key={name} className="lp-testi-card">
                <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>{Array(5).fill(0).map((_, i) => <StarIcon key={i} />)}</div>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--n-800)', marginBottom: 24, fontStyle: 'italic' }}>"{quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 99, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--n-950)' }}>{name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--n-500)', marginTop: 2 }}>{school}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DARK CTA */}
      <section style={{ background: 'var(--n-950)', padding: '96px 0' }} id="cta">
        <div className="lp-container" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'oklch(68% 0.010 80)', marginBottom: 20 }}>Para directores con visión</p>
          <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: 16, textWrap: 'balance' }}>¿Listo para modernizar<br />tu escuela?</h2>
          <p style={{ fontSize: 17, color: 'oklch(68% 0.010 80)', marginBottom: 36 }}>Empieza gratis. Sin tarjeta de crédito.<br />Configuración en menos de 15 minutos.</p>
          <Link to="/provision" style={{ padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, color: 'var(--n-950)', background: 'white', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all .12s' }}>
            Crear cuenta gratis <ArrowIcon />
          </Link>
          <div style={{ fontSize: 13, color: 'oklch(55% 0.010 80)', marginTop: 14 }}>Ya son más de 200 instituciones en Latinoamérica · Sin contrato</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: 'var(--n-950)', borderTop: '1px solid oklch(99% 0 0/0.07)', padding: '60px 0 32px' }}>
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <img src="/logo-pensum.png" alt="Pensum" height="22" style={{ filter: 'brightness(0) invert(1)', marginBottom: 12, display: 'block' }} />
              <p style={{ fontSize: 13.5, color: 'oklch(55% 0.010 80)', lineHeight: 1.65, marginBottom: 20, maxWidth: 240 }}>La plataforma educativa multi-tenant para escuelas que quieren crecer sin complicaciones.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  <path key="tw" d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />,
                  <><path key="li1" d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect key="li2" x="2" y="9" width="4" height="12" /><circle key="li3" cx="4" cy="4" r="2" /></>,
                  <><rect key="ig1" x="2" y="2" width="20" height="20" rx="5" /><path key="ig2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line key="ig3" x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></>,
                ].map((icon, i) => (
                  <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: 'oklch(99% 0 0/0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(55% 0.010 80)', cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{icon}</svg>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'oklch(55% 0.010 80)', marginBottom: 16 }}>Producto</h4>
              {['Características', 'Precios', 'Integraciones', 'Novedades', 'Roadmap'].map(l => <a key={l} href="#">{l}</a>)}
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'oklch(55% 0.010 80)', marginBottom: 16 }}>Compañía</h4>
              {['Nosotros', 'Blog', 'Clientes', 'Prensa', 'Contacto'].map(l => <a key={l} href="#">{l}</a>)}
            </div>
            <div>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'oklch(55% 0.010 80)', marginBottom: 16 }}>Legal</h4>
              {['Privacidad', 'Términos de uso', 'Seguridad', 'RGPD / LFPDPPP', 'Cookies'].map(l => <a key={l} href="#">{l}</a>)}
            </div>
          </div>
          <div style={{ borderTop: '1px solid oklch(99% 0 0/0.07)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'oklch(42% 0.010 80)' }}>© 2026 Pensum Technologies S.A. de C.V. — Todos los derechos reservados.</p>
            <div style={{ fontSize: 13, color: 'oklch(42% 0.010 80)' }}>Hecho con ♥ en México 🇲🇽</div>
          </div>
        </div>
      </footer>
    </>
  );
}
