import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  // Local-only simplified auth state
  const [currentUser, setCurrentUser] = useState({
    uid: 'local-user',
    email: 'local@localhost',
    displayName: 'Local Developer'
  });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);

  async function signup(email, password, displayName) {
    return { user: { uid: 'local-user' } };
  }

  function login(email, password) {
    return Promise.resolve({ user: { uid: 'local-user' } });
  }

  function logout() {
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
    setCurrentUser(prev => ({ ...prev, displayName: name }));
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
