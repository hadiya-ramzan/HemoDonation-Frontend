import { Navigate } from "react-router-dom";

function LocationGuard({ children }) {
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const latitude = Number(user.latitude);
  const longitude = Number(user.longitude);

  const missingLocation = !Number.isFinite(latitude) || !Number.isFinite(longitude);

  if (missingLocation) {
    return <Navigate to="/update-location" replace />;
  }

  return children;
}

export default LocationGuard;
