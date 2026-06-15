import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/landing";
import Signup from "./pages/signup";
import Login from "./pages/login";
import ProtectedRoute from "./components/protectedRoute";
import DonorDashboard from "./pages/donorDashboard";
import RecipientDashboard from "./pages/recipientDashboard";
import DonorSearch from "./pages/donorSearch";
import LocationGuard from "./routes/locationGuard";
import UpdateLocation from "./pages/updateLocation";
import AdminDashboard from "./pages/adminDashboard";
import Notifications from "./pages/notifications";
import PwaInstallPrompt from "./components/pwaInstallPrompt";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={["donor", "both"]}>
              <LocationGuard>
                <DonorDashboard />
              </LocationGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recipient"
          element={
            <ProtectedRoute allowedRoles={["recipient", "both"]}>
              <LocationGuard>
                <RecipientDashboard />
              </LocationGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/recipient/search-donors"
          element={
            <ProtectedRoute allowedRoles={["recipient", "both"]}>
              <LocationGuard>
                <DonorSearch />
              </LocationGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/update-location"
          element={
            <ProtectedRoute allowedRoles={["donor", "recipient", "both"]}>
              <UpdateLocation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={["donor", "recipient", "both", "admin"]}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <PwaInstallPrompt />
    </BrowserRouter>
  );
}

export default App;
