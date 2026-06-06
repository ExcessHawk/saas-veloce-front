import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';

function setAuth(partial) {
  useAuthStore.setState(partial);
}

function clearAuth() {
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, schoolId: null });
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>protected</div>} />
        </Route>
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => clearAuth());

  it('redirects to /login when no access token', () => {
    renderAt('/dashboard');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects to /login when authenticated but no schoolId and not global admin', () => {
    setAuth({
      accessToken: 'tok',
      user: { role: 'student', email: 'a@b.c', isGlobalAdmin: false },
      schoolId: null,
    });
    renderAt('/dashboard');
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders outlet when authenticated with a schoolId', () => {
    setAuth({
      accessToken: 'tok',
      user: { role: 'student', email: 'a@b.c', isGlobalAdmin: false },
      schoolId: 'school-uuid',
    });
    renderAt('/dashboard');
    expect(screen.getByText('protected')).toBeInTheDocument();
  });

  it('renders outlet for global admin without schoolId', () => {
    setAuth({
      accessToken: 'tok',
      user: { role: 'director', email: 'a@b.c', isGlobalAdmin: true },
      schoolId: null,
    });
    renderAt('/dashboard');
    expect(screen.getByText('protected')).toBeInTheDocument();
  });
});
