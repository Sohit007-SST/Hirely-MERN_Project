import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY, getStoredToken } from '../api/axios';

// Session 7: auth state for the whole app - { user, token, loading, login, register, logout, setUser }
const AuthContext = createContext(null);

const storeToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage blocked: the session simply won't survive a refresh
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  // Only "loading" when there is a saved token to check
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  // On first load, turn a saved token back into a user with GET /auth/me
  useEffect(() => {
    const saved = getStoredToken();
    if (!saved) return undefined;
    let active = true;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (active) setUser(data.user);
      })
      .catch((err) => {
        // Expired, invalid or suspended: forget the token. Network errors keep it for the next try.
        if (active && [401, 403, 404].includes(err.status)) {
          storeToken(null);
          setToken(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const startSession = useCallback((data) => {
    storeToken(data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  // Both throw on failure; error.message is the server's message
  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      return startSession(data);
    },
    [startSession]
  );

  const register = useCallback(
    async (form) => {
      const { data } = await api.post('/auth/register', form);
      return startSession(data);
    },
    [startSession]
  );

  const logout = useCallback(() => {
    storeToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
