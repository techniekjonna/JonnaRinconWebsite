import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/firebase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
}

function getDashboardForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return '/admin/dashboard';
    case 'artist': return '/artist/dashboard';
    case 'manager': return '/manager/dashboard';
    default: return '/customer/dashboard';
  }
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, requireAdmin }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to={getDashboardForRole(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
