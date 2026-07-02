import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Local-only simplified auth state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('localUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  async function signup(email, password, displayName) {
    const user = { uid: 'local-user', email, displayName };
    setCurrentUser(user);
    localStorage.setItem('localUser', JSON.stringify(user));
    return { user };
  }

  function login(email, password) {
    const user = { uid: 'local-user', email, displayName: email.split('@')[0] };
    setCurrentUser(user);
    localStorage.setItem('localUser', JSON.stringify(user));
    return Promise.resolve({ user });
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem('localUser');
    return Promise.resolve();
  }

  function resetPassword(email) {
    return Promise.resolve();
  }

  function resendVerificationEmail() {
    return Promise.resolve();
  }

  function changePassword(newPassword) {
    return Promise.resolve();
  }

  function changeEmail(newEmail) {
    return Promise.resolve();
  }

  function updateDisplayName(name) {
    const updatedUser = { ...currentUser, displayName: name };
    setCurrentUser(updatedUser);
    localStorage.setItem('localUser', JSON.stringify(updatedUser));
    return Promise.resolve();
  }

  const value = {
    currentUser,
    loading,
    isAdmin,
    signup,
    login,
    logout,
    resetPassword,
    resendVerificationEmail,
    changePassword,
    changeEmail,
    updateDisplayName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
