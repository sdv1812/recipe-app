import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_STORAGE_KEY = "@auth";

interface AuthData {
  user: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

// Callback for handling auth errors (401 unauthorized)
let authErrorCallback: (() => void) | null = null;

export const authStorage = {
  /**
   * Save authentication data
   */
  async saveAuth(authData: AuthData): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  },

  /**
   * Get authentication data
   */
  async getAuth(): Promise<AuthData | null> {
    try {
      const authJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (!authJson) return null;
      return JSON.parse(authJson);
    } catch (error) {
      console.error("Error loading auth data:", error);
      return null;
    }
  },

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    try {
      const auth = await this.getAuth();
      return auth?.token || null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  },

  /**
   * Clear authentication data (logout)
   */
  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing auth data:", error);
      throw error;
    }
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const auth = await this.getAuth();
      return auth !== null && !!auth.token;
    } catch (error) {
      console.error("Error checking auth status:", error);
      return false;
    }
  },

  /**
   * Set callback for auth errors (401 unauthorized)
   */
  setAuthErrorCallback(callback: () => void): void {
    authErrorCallback = callback;
  },

  /**
   * Trigger auth error callback (called when 401 error occurs)
   */
  triggerAuthError(): void {
    if (authErrorCallback) {
      authErrorCallback();
    }
  },
};
