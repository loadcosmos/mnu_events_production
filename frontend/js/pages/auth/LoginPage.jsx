import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { cn } from '../../lib/utils';

import { useTranslation } from 'react-i18next'; // Added

export default function LoginPage() {
  const { t } = useTranslation(); // Added
  const [showSignup, setShowSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
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
      setError(t('auth.pleaseFillAllFields'));
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
      setError(err.message || t('auth.loginFailed'));
      // Toast для ошибок уже показывается в apiClient interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.firstName || !formData.lastName) {
      setError(t('auth.pleaseFillAllFields'));
      return;
    }

    if (!formData.email.endsWith('@kazguu.kz')) {
      setError(t('auth.useKazguuEmail'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      // После регистрации редиректим на страницу верификации email
      navigate('/verify-email', {
        replace: true,
        state: { email: formData.email }
      });
    } catch (err) {
      setError(err.message || t('auth.registrationFailed'));
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
            {showSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-[#a0a0a0] transition-colors duration-300">
            {showSignup
              ? t('auth.registerWithKazguu')
              : t('auth.enterDetailsToSignIn')}
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
                <Label htmlFor="email" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('auth.enterPassword')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <Button type="submit" className="w-full liquid-glass-red-button text-white rounded-2xl" disabled={loading}>
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.email')}</Label>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-firstName" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.firstName')}</Label>
                  <Input
                    id="signup-firstName"
                    name="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-lastName" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.lastName')}</Label>
                  <Input
                    id="signup-lastName"
                    name="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.password')}</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder={t('auth.createPassword')}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-900 dark:text-white transition-colors duration-300">{t('auth.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                  className="bg-gray-50 dark:bg-[#0a0a0a] border-gray-300 dark:border-[#2a2a2a] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-[#666666] focus:border-[#d62e1f] focus:ring-[#d62e1f] transition-colors duration-300"
                />
              </div>
              <Button type="submit" className="w-full liquid-glass-red-button text-white rounded-2xl" disabled={loading}>
                {loading ? t('auth.signingUp') : t('auth.signUp')}
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
              ? t('auth.alreadyHaveAccount')
              : t('auth.dontHaveAccount')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
