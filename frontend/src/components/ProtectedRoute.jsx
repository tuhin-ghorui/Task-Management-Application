import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";

const ProtectedRoute = () => {
  const { isAuthenticated, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-50 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
