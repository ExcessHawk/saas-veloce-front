import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleGate } from './RoleGate';
import { useAuthStore } from '@/stores/authStore';

function setUser(role) {
  useAuthStore.setState({
    user: { role, email: 'x@y.z', fullName: 'X' },
  });
}

function clearUser() {
  useAuthStore.setState({ user: null });
}

describe('RoleGate', () => {
  beforeEach(() => clearUser());

  it('renders children when user role is allowed', () => {
    setUser('director');
    render(
      <RoleGate roles={['director', 'teacher']}>
        <span>secret</span>
      </RoleGate>,
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('renders fallback when role is not allowed', () => {
    setUser('student');
    render(
      <RoleGate roles={['director']} fallback={<span>denied</span>}>
        <span>secret</span>
      </RoleGate>,
    );
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
    expect(screen.getByText('denied')).toBeInTheDocument();
  });

  it('renders fallback when there is no user', () => {
    clearUser();
    render(
      <RoleGate roles={['director']} fallback={<span>guest</span>}>
        <span>secret</span>
      </RoleGate>,
    );
    expect(screen.getByText('guest')).toBeInTheDocument();
  });
});
