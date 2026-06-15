import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function VerifyOTP({ phone, testingOtp, onOtpUpdate }) {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(120);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (timer <= 0) return undefined;

    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formattedTimer = useMemo(() => {
    const minutes = Math.floor(timer / 60).toString().padStart(2, "0");
    const seconds = (timer % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [timer]);

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

    navigate("/", { replace: true });
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await API.post("/auth/verify-otp", {
        phone,
        otp_code: otp,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        setMessage("Invalid verification response from server.");
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("activeMode");

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setMessage("Phone number verified successfully. Redirecting...");
      setTimeout(() => redirectUserByRole(user), 600);
    } catch (error) {
      setMessage(error.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setMessage("");

      const response = await API.post("/auth/resend-otp", { phone });

      setTimer(120);
      setOtp("");

      if (response.data?.data?.otp_code && onOtpUpdate) {
        onOtpUpdate(response.data.data.otp_code);
      }

      setMessage("New OTP generated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to resend OTP.");
    }
  };

  return (
    <div className="flex min-h-[560px] items-center justify-center text-white">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-600/15 text-4xl shadow-lg shadow-red-600/10">🔐</div>

          <h2 className="mt-5 text-3xl font-black">Verify OTP</h2>
          <p className="mt-2 text-sm text-slate-400">Enter the 6-digit OTP sent to</p>
          <p className="text-sm font-black text-white">{phone}</p>
        </div>

        {testingOtp && (
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Testing OTP</p>
            <p className="mt-1 text-3xl font-black tracking-widest text-red-200">{testingOtp}</p>
          </div>
        )}

        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="mt-5 w-full rounded-3xl border border-white/10 bg-white/[0.06] px-4 py-4 text-center text-2xl font-black tracking-[0.55em] text-white outline-none placeholder:text-slate-700 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10"
        />

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="mt-5 w-full rounded-3xl bg-red-600 py-4 font-black text-white shadow-xl shadow-red-700/25 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div className="mt-5 text-center">
          {timer > 0 ? (
            <p className="text-sm text-slate-400">
              Resend OTP in <span className="font-black text-white">{formattedTimer}</span>
            </p>
          ) : (
            <button type="button" onClick={handleResend} className="text-sm font-black text-red-300 hover:text-red-200">
              Resend OTP
            </button>
          )}
        </div>

        {message && (
          <p className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm font-bold ${message.toLowerCase().includes("success") ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300" : "border-red-400/20 bg-red-500/10 text-red-200"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyOTP;
