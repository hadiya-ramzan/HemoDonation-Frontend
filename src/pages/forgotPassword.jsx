import { useState } from "react";
import API from "../services/api";
import { FiEye, FiEyeOff } from "react-icons/fi";

function ForgotPassword({ onBackToLogin }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [testingOtp, setTestingOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();

    if (!/^03[0-9]{9}$/.test(phone)) {
      setMessage("Enter a valid Pakistani phone number: 03XXXXXXXXX");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await API.post("/auth/forgot-password", { phone });

      setTestingOtp(res.data.data?.otp_code || "");
      setStep(2);
      setMessage("OTP sent successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    if (otpCode.length !== 6) {
      setMessage("Enter a valid 6-digit OTP.");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await API.post("/auth/reset-password", {
        phone,
        otp_code: otpCode,
        new_password: newPassword,
      });

      setMessage("Password reset successful. Please login again.");
      setTimeout(() => onBackToLogin?.(), 1200);
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full text-white">
      <div className="text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-600/15 text-3xl">🔐</div>
        <h2 className="mt-4 text-3xl font-black">Forgot Password</h2>
        <p className="mt-2 text-sm text-slate-400">
          {step === 1 ? "Enter your registered phone number." : "Enter OTP and create a new password."}
        </p>
      </div>

      {step === 1 ? (
        <form onSubmit={requestOtp} className="mt-7 space-y-4">
          <input
            type="text"
            placeholder="03XXXXXXXXX"
            value={phone}
            maxLength={11}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
          />

          <button disabled={loading} className="w-full rounded-2xl bg-red-600 py-3.5 font-black text-white transition hover:bg-red-500 disabled:opacity-60">
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="mt-7 space-y-4">
          {testingOtp && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-center">
              <p className="text-xs text-slate-400">Testing OTP</p>
              <p className="text-2xl font-black text-red-200">{testingOtp}</p>
            </div>
          )}

          <input
            type="text"
            placeholder="Enter OTP"
            value={otpCode}
            maxLength={6}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-center text-xl tracking-[0.45em] text-white outline-none placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 pr-12 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
            />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <button disabled={loading} className="w-full rounded-2xl bg-red-600 py-3.5 font-black text-white transition hover:bg-red-500 disabled:opacity-60">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      {message && (
        <p className={`mt-4 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${message.toLowerCase().includes("success") ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
          {message}
        </p>
      )}

      <button type="button" onClick={onBackToLogin} className="mt-5 w-full text-sm font-semibold text-slate-400 transition hover:text-white">
        Back to Login
      </button>
    </div>
  );
}

export default ForgotPassword;
