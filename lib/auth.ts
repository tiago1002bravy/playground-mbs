// Utilitários de autenticação simples

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('playground_auth') === 'authenticated';
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('playground_auth');
  localStorage.removeItem('playground_user');
  window.location.href = '/login';
};

export const getCurrentUser = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('playground_user');
};

