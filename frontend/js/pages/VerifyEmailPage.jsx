import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import authService from '../services/authService';

export default function VerifyEmailPage() {
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
      setError('Email is required');
      return;
    }

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
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
      setError(err.response?.data?.message || err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (!email) {
      setError('Email is required');
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
      alert('Verification code sent! Check your email and console.');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to resend code. Please try again.';
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
          <CardTitle className="text-3xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a 6-digit verification code to your email address.
            <br />
            <span className="text-xs">Code expires in 24 hours</span>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="code">Verification Code</Label>
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
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center">
            {!canResend ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Code sent! You can request a new code in:
                </p>
                <p className="text-lg font-mono font-bold text-primary">
                  {formatTime(timeLeft)}
                </p>
                <p className="text-xs text-muted-foreground">
                  (Protection against spam)
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
                {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
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
            Back to Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

