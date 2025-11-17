import { Client, Account, ID, Models, OAuthProvider } from 'appwrite';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '691a6f970027876be2db');

export const account = new Account(client);

// Types
export interface UserProfile {
  $id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  prefs: UserPreferences;
  registration: string;
}

export interface UserPreferences {
  displayName?: string;
  avatarUrl?: string;
  plan?: 'free' | 'pro' | 'enterprise';
  storageUsed?: number;
  storageLimit?: number;
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  notifications?: boolean;
}

export interface Session {
  $id: string;
  userId: string;
  provider: string;
  providerUid: string;
  current: boolean;
  deviceName: string;
  deviceBrand: string;
  deviceModel: string;
  countryCode: string;
  countryName: string;
  ip: string;
  osName: string;
  osVersion: string;
  clientName: string;
  clientVersion: string;
  $createdAt: string;
}

// ============================================
// Email/Password Authentication
// ============================================

/**
 * Créer un nouveau compte utilisateur avec email et password
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  name: string
): Promise<Models.User<UserPreferences>> => {
  try {
    // 1. Créer le compte
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    );

    // 2. Créer une session automatiquement
    await account.createEmailPasswordSession(email, password);

    // 3. Initialiser les préférences
    await account.updatePrefs({
      displayName: name,
      plan: 'free',
      storageUsed: 0,
      storageLimit: 2 * 1024 * 1024 * 1024, // 2GB free plan
      theme: 'auto',
      language: 'en',
      notifications: true
    } as UserPreferences);

    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

/**
 * Se connecter avec email et password
 */
export const loginWithEmail = async (
  email: string,
  password: string
): Promise<Models.Session> => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Envoyer un email de vérification
 */
export const sendVerificationEmail = async (
  redirectUrl: string = `${window.location.origin}/verify-email`
): Promise<Models.Token> => {
  try {
    return await account.createVerification(redirectUrl);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Confirmer l'email avec le token reçu
 */
export const verifyEmail = async (
  userId: string,
  secret: string
): Promise<Models.Token> => {
  try {
    return await account.updateVerification(userId, secret);
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de récupération de mot de passe
 */
export const sendPasswordRecovery = async (
  email: string,
  redirectUrl: string = `${window.location.origin}/reset-password`
): Promise<Models.Token> => {
  try {
    return await account.createRecovery(email, redirectUrl);
  } catch (error) {
    console.error('Error sending password recovery:', error);
    throw error;
  }
};

/**
 * Réinitialiser le mot de passe avec le token
 */
export const resetPassword = async (
  userId: string,
  secret: string,
  password: string,
  passwordConfirm: string
): Promise<Models.Token> => {
  try {
    return await account.updateRecovery(userId, secret, password, passwordConfirm);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// ============================================
// OAuth Authentication
// ============================================

/**
 * Se connecter avec Google OAuth
 */
export const loginWithGoogle = async (
  successUrl: string = `${window.location.origin}/auth/callback`,
  failureUrl: string = `${window.location.origin}/auth/error`
): Promise<void> => {
  try {
    account.createOAuth2Session(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );
  } catch (error) {
    console.error('Error with Google OAuth:', error);
    throw error;
  }
};

/**
 * Se connecter avec GitHub OAuth
 */
export const loginWithGithub = async (
  successUrl: string = `${window.location.origin}/auth/callback`,
  failureUrl: string = `${window.location.origin}/auth/error`
): Promise<void> => {
  try {
    account.createOAuth2Session(
      OAuthProvider.Github,
      successUrl,
      failureUrl
    );
  } catch (error) {
    console.error('Error with GitHub OAuth:', error);
    throw error;
  }
};

/**
 * Se connecter avec Apple OAuth
 */
export const loginWithApple = async (
  successUrl: string = `${window.location.origin}/auth/callback`,
  failureUrl: string = `${window.location.origin}/auth/error`
): Promise<void> => {
  try {
    account.createOAuth2Session(
      OAuthProvider.Apple,
      successUrl,
      failureUrl
    );
  } catch (error) {
    console.error('Error with Apple OAuth:', error);
    throw error;
  }
};

// ============================================
// Magic URL (Passwordless) Authentication
// ============================================

/**
 * Envoyer un Magic URL pour connexion sans mot de passe
 */
export const sendMagicURL = async (
  email: string,
  redirectUrl: string = `${window.location.origin}/auth/magic-url`
): Promise<Models.Token> => {
  try {
    return await account.createMagicURLToken(ID.unique(), email, redirectUrl);
  } catch (error) {
    console.error('Error sending magic URL:', error);
    throw error;
  }
};

/**
 * Créer une session avec le Magic URL token
 */
export const loginWithMagicURL = async (
  userId: string,
  secret: string
): Promise<Models.Session> => {
  try {
    return await account.createSession(userId, secret);
  } catch (error) {
    console.error('Error logging in with magic URL:', error);
    throw error;
  }
};

// ============================================
// User Management
// ============================================

/**
 * Récupérer l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (): Promise<Models.User<UserPreferences> | null> => {
  try {
    return await account.get();
  } catch (error) {
    console.error('No active session:', error);
    return null;
  }
};

/**
 * Mettre à jour le nom de l'utilisateur
 */
export const updateUserName = async (name: string): Promise<Models.User<UserPreferences>> => {
  try {
    return await account.updateName(name);
  } catch (error) {
    console.error('Error updating name:', error);
    throw error;
  }
};

/**
 * Mettre à jour l'email de l'utilisateur
 */
export const updateUserEmail = async (
  email: string,
  password: string
): Promise<Models.User<UserPreferences>> => {
  try {
    return await account.updateEmail(email, password);
  } catch (error) {
    console.error('Error updating email:', error);
    throw error;
  }
};

/**
 * Mettre à jour le mot de passe
 */
export const updatePassword = async (
  newPassword: string,
  oldPassword: string
): Promise<Models.User<UserPreferences>> => {
  try {
    return await account.updatePassword(newPassword, oldPassword);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

/**
 * Mettre à jour les préférences utilisateur
 */
export const updateUserPreferences = async (
  prefs: Partial<UserPreferences>
): Promise<Models.User<UserPreferences>> => {
  try {
    const currentPrefs = (await account.getPrefs()) as UserPreferences;
    return await account.updatePrefs({
      ...currentPrefs,
      ...prefs
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw error;
  }
};

/**
 * Récupérer les préférences utilisateur
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    return (await account.getPrefs()) as UserPreferences;
  } catch (error) {
    console.error('Error getting preferences:', error);
    throw error;
  }
};

// ============================================
// Session Management
// ============================================

/**
 * Récupérer la session actuelle
 */
export const getCurrentSession = async (): Promise<Models.Session | null> => {
  try {
    return await account.getSession('current');
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Récupérer toutes les sessions de l'utilisateur
 */
export const getAllSessions = async (): Promise<Models.Session[]> => {
  try {
    const sessions = await account.listSessions();
    return sessions.sessions;
  } catch (error) {
    console.error('Error getting sessions:', error);
    return [];
  }
};

/**
 * Supprimer une session spécifique
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await account.deleteSession(sessionId);
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Se déconnecter (supprimer la session actuelle)
 */
export const logout = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

/**
 * Se déconnecter de tous les appareils (supprimer toutes les sessions)
 */
export const logoutFromAllDevices = async (): Promise<void> => {
  try {
    await account.deleteSessions();
  } catch (error) {
    console.error('Error logging out from all devices:', error);
    throw error;
  }
};

// ============================================
// Account Deletion
// ============================================

/**
 * Supprimer le compte utilisateur (anonyme → email conversion)
 */
export const deleteAccount = async (): Promise<void> => {
  try {
    // Note: This requires the user to be logged in
    await account.delete();
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// ============================================
// Anonymous to Email Account Conversion
// ============================================

/**
 * Convertir un compte anonyme en compte avec email
 */
export const convertAnonymousToEmail = async (
  email: string,
  password: string
): Promise<Models.User<UserPreferences>> => {
  try {
    // Update email and password
    return await account.updateEmail(email, password);
  } catch (error) {
    console.error('Error converting anonymous account:', error);
    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

/**
 * Vérifier si l'utilisateur est connecté
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Vérifier si l'email est vérifié
 */
export const isEmailVerified = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user?.emailVerification || false;
  } catch (error) {
    return false;
  }
};

/**
 * Obtenir le plan de l'utilisateur
 */
export const getUserPlan = async (): Promise<'free' | 'pro' | 'enterprise'> => {
  try {
    const prefs = await getUserPreferences();
    return prefs.plan || 'free';
  } catch (error) {
    return 'free';
  }
};

/**
 * Formater les informations de session pour l'affichage
 */
export const formatSessionInfo = (session: Models.Session): string => {
  const parts = [];

  if (session.deviceBrand && session.deviceModel) {
    parts.push(`${session.deviceBrand} ${session.deviceModel}`);
  } else if (session.deviceName) {
    parts.push(session.deviceName);
  }

  if (session.osName) {
    parts.push(session.osName);
  }

  if (session.clientName) {
    parts.push(session.clientName);
  }

  if (session.countryName) {
    parts.push(session.countryName);
  }

  return parts.length > 0 ? parts.join(' • ') : 'Unknown Device';
};

export default {
  // Auth
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  loginWithGithub,
  loginWithApple,
  sendMagicURL,
  loginWithMagicURL,
  logout,
  logoutFromAllDevices,

  // Email verification
  sendVerificationEmail,
  verifyEmail,

  // Password recovery
  sendPasswordRecovery,
  resetPassword,

  // User management
  getCurrentUser,
  updateUserName,
  updateUserEmail,
  updatePassword,
  updateUserPreferences,
  getUserPreferences,

  // Session management
  getCurrentSession,
  getAllSessions,
  deleteSession,

  // Account
  deleteAccount,
  convertAnonymousToEmail,

  // Utils
  isAuthenticated,
  isEmailVerified,
  getUserPlan,
  formatSessionInfo
};
