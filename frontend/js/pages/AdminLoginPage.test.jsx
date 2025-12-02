import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLoginPage from './AdminLoginPage.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Mock AuthContext
vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLoginPage', () => {
  const mockLogin = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      logout: mockLogout,
    });
  });

  it('should render admin login form', () => {
    render(
      <BrowserRouter>
        <AdminLoginPage />
      </BrowserRouter>,
    );

    expect(screen.getByText('Admin Login')).toBeInTheDocument();
    expect(screen.getByText('Enter your admin credentials')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@kazguu.kz')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByText('Sign In as Admin')).toBeInTheDocument();
  });

  it('should call logout when user is not admin', async () => {
    mockLogin.mockResolvedValue({
      user: { role: 'student' },
    });

    render(
      <BrowserRouter>
        <AdminLoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByPlaceholderText('admin@kazguu.kz');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByText('Sign In as Admin');

    // Fill form
    emailInput.value = 'student@kazguu.kz';
    passwordInput.value = 'Password123!';

    // Submit form
    submitButton.click();

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should navigate to /admin when login is successful for admin', async () => {
    mockLogin.mockResolvedValue({
      user: { role: 'admin' },
    });

    render(
      <BrowserRouter>
        <AdminLoginPage />
      </BrowserRouter>,
    );

    const emailInput = screen.getByPlaceholderText('admin@kazguu.kz');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByText('Sign In as Admin');

    // Fill form
    emailInput.value = 'admin@kazguu.kz';
    passwordInput.value = 'Password123!';

    // Submit form
    submitButton.click();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true });
    });
  });
});

