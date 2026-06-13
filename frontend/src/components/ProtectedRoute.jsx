import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute — Localhost Only version.
 * Since this is an offline/local application, it always allows access.
 */
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return children; // For local dev, we just allow through
  }

  return children;
};

export default ProtectedRoute;
