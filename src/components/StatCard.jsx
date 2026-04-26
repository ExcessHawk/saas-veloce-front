export function StatCard({ label, value, sub, icon: Icon, warn = false, isLoading = false }) {
  return (
    <div style={{
      background: 'var(--p-bg-base)',
      border: `1px solid ${warn ? 'var(--p-w-500)' : 'var(--p-border)'}`,
      borderRadius: 16,
      boxShadow: 'var(--p-shadow-sm)',
      padding: 20,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: warn ? 'var(--p-w-100)' : 'var(--p-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: warn ? 'var(--p-w-700)' : 'var(--p-text-secondary)',
        }}>
          {Icon && <Icon size={17} />}
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: 36, width: 64, background: 'var(--p-bg-subtle)', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
      ) : (
        <div style={{ fontSize: 30, fontWeight: 700, color: warn ? 'var(--p-w-700)' : 'var(--p-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>
          {value}
        </div>
      )}

      <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', marginTop: 6, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--p-s-700)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
