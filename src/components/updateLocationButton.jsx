import { useState } from "react";
import API from "../services/api";

function UpdateLocationButton({ onSuccess }) {
  const [loading, setLoading] = useState(false);

  const updateLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latitude = pos.coords.latitude;
          const longitude = pos.coords.longitude;

          await API.put("/user/update-location", {
            latitude,
            longitude,
          });

          // update localStorage user
          const user = JSON.parse(localStorage.getItem("user"));

          const updatedUser = {
            ...user,
            latitude,
            longitude,
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));

          alert("Location updated successfully");

          if (onSuccess) onSuccess(updatedUser);
        } catch (err) {
          alert(err.response?.data?.message || "Update failed");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        alert("Location permission denied");
      }
    );
  };

  return (
    <button
      onClick={updateLocation}
      disabled={loading}
      className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold transition"
    >
      {loading ? "Updating Location..." : "📍 Update My Location"}
    </button>
  );
}

export default UpdateLocationButton;