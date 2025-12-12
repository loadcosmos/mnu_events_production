import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

import { useTranslation } from 'react-i18next';

export default function AdminLoginPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await login(formData);

      // Проверяем роль и редиректим соответственно
      const userRole = response.user?.role;

      if (userRole === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'ORGANIZER') {
        // Организаторы тоже могут войти через админ страницу, но их редиректим на их панель
        navigate('/organizer', { replace: true });
      } else {
        setError('Access denied. Admin or Organizer privileges required.');
        await logout();
      }
    } catch (err) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/images/glassback.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">{t('admin.loginTitle')}</CardTitle>
          <CardDescription>{t('admin.loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">{t('common.email')}</Label>
              <Input
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@kazguu.kz"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">{t('common.password')}</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                placeholder={t('auth.enterPassword')}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
        <CardContent>
          <Button variant="link" className="w-full" asChild>
            <Link to="/login">{t('admin.backToUserLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div >
  );
}
