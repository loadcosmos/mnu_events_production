import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import authService from '../../services/authService';

import { useTranslation } from 'react-i18next'; // Added

export default function VerifyEmailPage() {
  const { t } = useTranslation(); // Added
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // Получаем email из location state или localStorage
  const emailFromState = location.state?.email;
  const [email, setEmail] = useState(emailFromState || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 минут в секундах (cooldown для resend)
  const [canResend, setCanResend] = useState(false); // Нельзя отправить сразу (код уже отправлен при регистрации)

  // При первой загрузке страницы (после регистрации) запускаем таймер
  useEffect(() => {
    // Если пришли с state (после регистрации), запускаем таймер
    if (emailFromState) {
      setCanResend(false);
      setTimeLeft(300);
    }
  }, []); // Только при монтировании

  // Таймер обратного отсчета
  useEffect(() => {
    if (timeLeft > 0 && !canResend) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft, canResend]);

  // Форматирование времени для отображения
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Обработка изменения кода
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6); // Только цифры, максимум 6
    setCode(value);
    setError('');
  };

  // Обработка верификации
  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    if (!code || code.length !== 6) {
      setError(t('auth.invalidCode'));
      return;
    }

    try {
      setLoading(true);
      const response = await authService.verifyEmail({ email, code });

      // Обновляем пользователя в контексте
      await refreshUser();

      // Редирект на главную страницу
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('auth.verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (!email) {
      setError(t('auth.emailRequired'));
      return;
    }

    try {
      setResendLoading(true);
      setError('');
      await authService.resendVerificationCode(email);

      // Запускаем таймер на 5 минут (защита от спама)
      setTimeLeft(300);
      setCanResend(false);
      setCode('');

      // Показываем успешное сообщение
      alert(t('auth.codeResentSuccess'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || t('auth.resendFailed');
      setError(errorMessage);

      // Если ошибка содержит информацию о времени ожидания, не даём повторно отправлять
      if (errorMessage.includes('wait')) {
        setCanResend(false);
        // Попытка извлечь оставшееся время из сообщения (например "Please wait 4:32 before...")
        const timeMatch = errorMessage.match(/(\d+):(\d+)/);
        if (timeMatch) {
          const mins = parseInt(timeMatch[1]);
          const secs = parseInt(timeMatch[2]);
          setTimeLeft(mins * 60 + secs);
        }
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold">{t('auth.verifyEmailTitle')}</CardTitle>
          <CardDescription>
            {t('auth.codeSentDescription')}
            <br />
            <span className="text-xs">{t('auth.codeExpires')}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@kazguu.kz"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading || !!emailFromState}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">{t('auth.verificationCode')}</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                disabled={loading}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                {t('auth.enter6DigitCode')}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? t('auth.verifying') : t('auth.verifyEmail')}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {!canResend ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t('auth.codeSentTimer')}
                </p>
                <p className="text-lg font-mono font-bold text-primary">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('auth.spamProtection')}
                </p>
              </div>
            ) : (
              <Button
                type="button"
                variant="link"
                onClick={handleResendCode}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? t('auth.sending') : t('auth.resendCode')}
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button
            variant="link"
            className="w-full"
            onClick={() => navigate('/login')}
          >
            {t('auth.backToLogin')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

