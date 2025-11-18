import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ProtectedRoute component - Protège les routes qui nécessitent une authentification
 * Affiche un loader pendant la vérification de l'auth, puis le contenu ou le fallback
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, loading } = useAuth();

  // Afficher le loader pendant la vérification
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-xl font-semibold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, afficher le fallback (page de login)
  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  // Si authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
