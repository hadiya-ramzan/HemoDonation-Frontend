import { Navigate } from "react-router-dom";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length === 0) {
    return children;
  }

  if (allowedRoles.includes(user.role)) {
    return children;
  }

  if (user.role === "both") {
    const activeMode = localStorage.getItem("activeMode") || user.preferred_mode || "donor";

    if (allowedRoles.includes(activeMode) || allowedRoles.includes("both")) {
      return children;
    }

    return <Navigate to={activeMode === "recipient" ? "/recipient" : "/donor"} replace />;
  }

  if (user.role === "donor") {
    return <Navigate to="/donor" replace />;
  }

  if (user.role === "recipient") {
    return <Navigate to="/recipient" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default ProtectedRoute;
