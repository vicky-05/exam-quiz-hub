import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Still checking authentication/profile
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F9FC",
          color: "#10233F",
          fontSize: "16px",
          fontWeight: "600",
        }}
      >
        Loading...
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  // Profile doesn't exist
  if (!profile) {
    return <Navigate to="/access-pending" replace />;
  }

  // Account is not approved
  if (profile.status !== "approved") {
    return <Navigate to="/access-pending" replace />;
  }

  // Logged-in approved user, but not an admin
  if (profile.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Approved admin
  return children;
}

export default AdminRoute;