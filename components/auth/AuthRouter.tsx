import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import ResetPassword from './ResetPassword';

type AuthView = 'login' | 'register' | 'reset';

interface AuthRouterProps {
  onAuthSuccess?: () => void;
}

/**
 * AuthRouter - Gère la navigation entre les différentes vues d'authentification
 */
export const AuthRouter: React.FC<AuthRouterProps> = ({ onAuthSuccess }) => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const handleAuthSuccess = () => {
    // Rafraîchir la page pour recharger l'utilisateur
    window.location.reload();
    onAuthSuccess?.();
  };

  return (
    <>
      {currentView === 'login' && (
        <Login
          onSuccess={handleAuthSuccess}
          onSwitchToRegister={() => setCurrentView('register')}
          onSwitchToReset={() => setCurrentView('reset')}
        />
      )}

      {currentView === 'register' && (
        <Register
          onSuccess={handleAuthSuccess}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}

      {currentView === 'reset' && (
        <ResetPassword
          onSuccess={() => setCurrentView('login')}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      )}
    </>
  );
};

export default AuthRouter;
