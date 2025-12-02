import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      // Role-based routing - redirect based on user role
      const userRole = response?.user?.role;

      switch (userRole) {
        case 'ADMIN':
          navigate('/admin', { replace: true });
          toast.success('Welcome back!', {
            description: `Logged in as Admin: ${response?.user?.firstName || response?.user?.email}`,
          });
          break;
        case 'ORGANIZER':
          navigate('/organizer', { replace: true });
          toast.success('Welcome back!', {
            description: `Logged in as Organizer: ${response?.user?.firstName || response?.user?.email}`,
          });
          break;
        case 'MODERATOR':
          navigate('/moderator', { replace: true });
          toast.success('Welcome back!', {
            description: `Logged in as Moderator: ${response?.user?.firstName || response?.user?.email}`,
          });
          break;
        case 'STUDENT':
        default:
          navigate('/', { replace: true });
          toast.success('Welcome back!', {
            description: `Logged in as ${response?.user?.firstName || response?.user?.email}`,
          });
          break;
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      // Toast для ошибок уже показывается в apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!formData.email.endsWith('@kazguu.kz')) {
      setError('Please use your @kazguu.kz email');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
      // После регистрации редиректим на страницу верификации email
      navigate('/verify-email', {
        replace: true,
        state: { email: formData.email }
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-300"
      style={{
        backgroundImage: 'url(/images/glassback.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Removed Student/Admin toggle - unified login for all users */}

      <Card className="w-full max-w-md shadow-2xl liquid-glass-strong border-gray-200 dark:border-[#2a2a2a] transition-colors duration-300">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            {showSignup ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            {showSignup
              ? 'Register with your @kazguu.kz account'
              : 'Please enter your details to sign in'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm text-center border border-red-200 dark:border-red-900/50 transition-colors duration-300">
              {error}
            </div>
          )}

          {!showSignup ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 dark:text-white transition-colors duration-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-white transition-colors duration-300">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <Button type="submit" className="w-full liquid-glass-red-button text-white rounded-2xl" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-900 dark:text-white transition-colors duration-300">Email</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="user@kazguu.kz"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-gray-900 dark:text-white transition-colors duration-300">Full Name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-900 dark:text-white transition-colors duration-300">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-900 dark:text-white transition-colors duration-300">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <Button type="submit" className="w-full liquid-glass-red-button text-white rounded-2xl" disabled={loading}>
                {loading ? 'Signing Up...' : 'Sign Up'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="link"
            className="w-full text-gray-600 dark:text-[#a0a0a0] hover:text-[#d62e1f] dark:hover:text-[#d62e1f] transition-colors duration-300"
            onClick={(e) => {
              e.preventDefault();
              setShowSignup(!showSignup);
              setError('');
            }}
          >
            {showSignup
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
