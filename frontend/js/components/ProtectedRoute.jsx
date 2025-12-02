import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * ProtectedRoute - компонент для защиты маршрутов
 * Проверяет авторизацию и опционально роли/права пользователя
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - дочерние элементы для рендера
 * @param {string|string[]} props.roles - требуемые роли (опционально)
 * @param {string|string[]} props.permissions - требуемые права (опционально)
 * @param {string} props.redirectTo - путь для редиректа (по умолчанию /login)
 * @param {React.ReactNode} props.fallback - компонент для показа во время загрузки
 */
const ProtectedRoute = ({
  children,
  roles = null,
  permissions = null,
  redirectTo = '/login',
  fallback = <LoadingSpinner />,
}) => {
  const { user, loading, isAuthenticated, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяем авторизацию
  if (loading) {
    return fallback;
  }

  // Проверка авторизации
  if (!isAuthenticated()) {
    // Сохраняем путь, на который пользователь пытался попасть
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Проверка ролей (если указаны)
  if (roles) {
    // Нормализуем роли для сравнения (приводим к верхнему регистру)
    const normalizedRoles = Array.isArray(roles) 
      ? roles.map(r => r.toUpperCase())
      : [roles.toUpperCase()];
    const userRole = user?.role?.toUpperCase();
    
    if (!normalizedRoles.includes(userRole)) {
      return (
        <AccessDenied
          message="You don't have the required role to access this page."
          requiredRoles={roles}
          userRole={user?.role}
        />
      );
    }
  }

  // Проверка прав доступа (если указаны)
  if (permissions && !hasPermission(permissions)) {
    return (
      <AccessDenied
        message="You don't have the required permissions to access this page."
        requiredPermissions={permissions}
        userPermissions={user?.permissions}
      />
    );
  }

  // Все проверки пройдены, рендерим защищенный контент
  return <>{children}</>;
};

/**
 * LoadingSpinner - компонент загрузки
 */
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #d62e1f',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem',
        }}></div>
        <p style={{ color: '#666', fontSize: '16px' }}>Loading...</p>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * AccessDenied - компонент для отображения ошибки доступа
 */
function AccessDenied({ message, requiredRoles, userRole, requiredPermissions, userPermissions }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '3rem 2rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
      }}>
        {/* Иконка ошибки */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: '#fee',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d62e1f"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>

        {/* Заголовок */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1a1a1a',
          marginBottom: '1rem',
        }}>
          Access Denied
        </h1>

        {/* Сообщение */}
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          {message}
        </p>

        {/* Детали (только в dev режиме) */}
        {import.meta.env.DEV && (
          <div style={{
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'left',
            fontSize: '14px',
          }}>
            {requiredRoles && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Required roles:</strong> {Array.isArray(requiredRoles) ? requiredRoles.join(', ') : requiredRoles}
              </div>
            )}
            {userRole && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Your role:</strong> {userRole}
              </div>
            )}
            {requiredPermissions && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Required permissions:</strong> {Array.isArray(requiredPermissions) ? requiredPermissions.join(', ') : requiredPermissions}
              </div>
            )}
            {userPermissions && (
              <div>
                <strong>Your permissions:</strong> {Array.isArray(userPermissions) ? userPermissions.join(', ') : 'none'}
              </div>
            )}
          </div>
        )}

        {/* Кнопка возврата */}
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: '#d62e1f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#b82419'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#d62e1f'}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}

export default ProtectedRoute;
