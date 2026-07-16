import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api.js';

const SessionContext = createContext(null);

function loadSession() {
  const token = sessionStorage.getItem('bsp_token') || null;
  const role = sessionStorage.getItem('bsp_role') || null;
  const name = sessionStorage.getItem('bsp_name') || null;
  const employeeId = sessionStorage.getItem('bsp_empid') || null;
  return token ? { token, role, name, employeeId } : null;
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  const persistSession = useCallback((role, token, name, employeeId) => {
    sessionStorage.setItem('bsp_token', token);
    sessionStorage.setItem('bsp_role', role);
    sessionStorage.setItem('bsp_name', name || '');
    sessionStorage.setItem('bsp_empid', employeeId || '');
    setSession({ token, role, name, employeeId });
  }, []);

  const logout = useCallback(() => {
    const token = session?.token;
    sessionStorage.clear();
    setSession(null);
    if (token) api.logout(token).catch(() => {}); // best-effort, ignore failures
  }, [session]);

  return (
    <SessionContext.Provider value={{ session, persistSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
