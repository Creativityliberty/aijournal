import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Models } from 'appwrite';
import {
  getCurrentUser,
  getCurrentSession,
  logout as authLogout,
  UserPreferences,
  updateUserPreferences as updatePrefs,
  getUserPreferences
} from '../services/authService';

// Types
interface AuthContextType {
  user: Models.User<UserPreferences> | null;
  session: Models.Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Helper functions
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  userPlan: 'free' | 'pro' | 'enterprise';
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Models.User<UserPreferences> | null>(null);
  const [session, setSession] = useState<Models.Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur et la session en parallèle
      const [currentUser, currentSession] = await Promise.all([
        getCurrentUser(),
        getCurrentSession()
      ]);

      setUser(currentUser);
      setSession(currentSession);
    } catch (err) {
      console.error('Error loading user:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user');
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authLogout();
      setUser(null);
      setSession(null);
    } catch (err) {
      console.error('Error logging out:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      const updatedUser = await updatePrefs(prefs);
      setUser(updatedUser);
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err;
    }
  };

  // Computed values
  const isAuthenticated = user !== null;
  const isEmailVerified = user?.emailVerification || false;
  const userPlan = (user?.prefs as UserPreferences)?.plan || 'free';

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    refreshUser,
    logout,
    updatePreferences,
    isAuthenticated,
    isEmailVerified,
    userPlan
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
