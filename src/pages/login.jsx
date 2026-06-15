import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FiEye, FiEyeOff, FiLock, FiPhone } from "react-icons/fi";
import ForgotPassword from "./forgotPassword";

function Login({ embedded = false }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ login: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const redirectUserByRole = (user) => {
    localStorage.removeItem("activeMode");

    if (user.role === "both") {
      const preferredMode = user.preferred_mode || "donor";
      localStorage.setItem("activeMode", preferredMode);
      navigate(preferredMode === "recipient" ? "/recipient" : "/donor", { replace: true });
      return;
    }

    if (user.role === "recipient") {
      localStorage.setItem("activeMode", "recipient");
      navigate("/recipient", { replace: true });
      return;
    }

    if (user.role === "donor") {
      localStorage.setItem("activeMode", "donor");
      navigate("/donor", { replace: true });
      return;
    }

    if (user.role === "admin") {
      localStorage.setItem("activeMode", "admin");
      navigate("/admin", { replace: true });
      return;
    }

    navigate("/", { replace: true });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.login || !formData.password) {
      setMessage("Email/phone and password are required.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await API.post("/auth/login", formData);
      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Login successful. Redirecting...");

      setTimeout(() => redirectUserByRole(user), 350);
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1421]/95 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-7">
      {showForgotPassword ? (
        <ForgotPassword
          onBackToLogin={() => {
            setShowForgotPassword(false);
            setMessage("");
          }}
        />
      ) : (
        <>
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-600/15 text-3xl shadow-lg shadow-red-600/10">🩸</div>
            <h1 className="mt-4 text-3xl font-black tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Login to continue your HemoDonation account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Email or phone</span>
              <div className="relative">
                <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  name="login"
                  placeholder="example@gmail.com or 03XXXXXXXXX"
                  value={formData.login}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-12 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Password</span>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-12 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="w-full text-right text-sm font-bold text-red-300 transition hover:text-red-200"
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-2xl bg-red-600 py-3.5 font-black text-white shadow-xl shadow-red-700/25 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && (
            <p className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${message.toLowerCase().includes("success") ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
              {message}
            </p>
          )}

          {!embedded && (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="mt-5 w-full text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              Back to Home
            </button>
          )}
        </>
      )}
    </div>
  );

  if (embedded) return card;

  return (
    <div className="min-h-screen bg-[#050914] px-4 py-10 text-white soft-grid">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        {card}
      </div>
    </div>
  );
}

export default Login;
