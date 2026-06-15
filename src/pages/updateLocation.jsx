import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMapPin } from "react-icons/fi";
import API from "../services/api";

function UpdateLocation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setMessage("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          await API.put("/user/update-location", { latitude, longitude });

          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const updatedUser = { ...user, latitude, longitude };

          localStorage.setItem("user", JSON.stringify(updatedUser));
          setMessage("Location updated successfully. Redirecting...");

          setTimeout(() => {
            const activeMode = localStorage.getItem("activeMode") || user.preferred_mode || "donor";
            navigate(activeMode === "recipient" ? "/recipient" : "/donor", { replace: true });
          }, 800);
        } catch (err) {
          setMessage(err.response?.data?.message || "Failed to update location.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setMessage("Location permission denied. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] px-4 py-10 text-white soft-grid">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0d1421]/95 p-7 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-600/15 text-3xl text-red-200">
          <FiMapPin />
        </div>

        <h2 className="mt-5 text-3xl font-black">Update Your Location</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Your location is required for nearby donor search and emergency matching.
        </p>

        <button
          type="button"
          onClick={handleUpdateLocation}
          disabled={loading}
          className="mt-7 w-full rounded-2xl bg-red-600 py-3.5 font-black text-white shadow-xl shadow-red-700/25 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Detecting Location..." : "Use My Current Location"}
        </button>

        {message && (
          <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${message.toLowerCase().includes("success") ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default UpdateLocation;
