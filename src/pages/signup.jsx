import { useEffect, useState } from "react";
import API from "../services/api";
import { FiCheckCircle, FiEye, FiEyeOff, FiMapPin, FiUserPlus } from "react-icons/fi";
import VerifyOTP from "./verifyOTP";
import CityDropdown from "../components/cityDropdown";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

function Signup({ initialRole = "donor" }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: initialRole,
    blood_group: "",
    gender: "",
    city: "",
  });

  const [location, setLocation] = useState({ latitude: null, longitude: null, loading: false });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [testingOtp, setTestingOtp] = useState("");

  useEffect(() => {
    setFormData((prev) => ({ ...prev, role: initialRole }));
  }, [initialRole]);

  const getLocation = () => {
    setLocation((prev) => ({ ...prev, loading: true }));

    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported in your browser.");
      setLocation((prev) => ({ ...prev, loading: false }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
        });
        setMessage("");
      },
      () => {
        setUseCurrentLocation(false);
        setLocation({ latitude: null, longitude: null, loading: false });
        setMessage("Location permission is required for signup.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleLocationToggle = () => {
    const nextValue = !useCurrentLocation;
    setUseCurrentLocation(nextValue);

    if (nextValue) {
      getLocation();
    } else {
      setLocation({ latitude: null, longitude: null, loading: false });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const validate = () => {
    if (
      !formData.full_name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.role ||
      !formData.blood_group ||
      !formData.gender ||
      !formData.city
    ) {
      return "All fields are required.";
    }

    if (!formData.email.toLowerCase().endsWith("@gmail.com")) {
      return "Only Gmail addresses are allowed.";
    }

    if (!/^03[0-9]{9}$/.test(formData.phone)) {
      return "Enter a valid Pakistani phone number: 03XXXXXXXXX.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (!useCurrentLocation) {
      return "Please enable 'Use My Current Location'.";
    }

    if (!location.latitude || !location.longitude) {
      return "Location not detected yet.";
    }

    return "";
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const validationMessage = validate();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const signupPayload = {
        ...formData,
        preferred_mode: formData.role,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const response = await API.post("/auth/signup", signupPayload);

      setTestingOtp(response.data.user?.otp_code || "");
      setShowSuccessCard(true);

      setTimeout(() => {
        setShowSuccessCard(false);
        setShowOTP(true);
      }, 900);
    } catch (error) {
      setMessage(error.response?.data?.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10";
  const selectClass = "w-full rounded-2xl border border-white/10 bg-[#151b27] px-4 py-3 text-sm text-white outline-none transition focus:border-red-400/60 focus:ring-4 focus:ring-red-500/10";

  return (
    <div className="flex items-center justify-center text-white">
      <div className="grid max-h-[94vh] w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0d1421]/95 shadow-2xl backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-red-950 via-slate-950 to-blue-950 p-7 lg:flex">
          <div>
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-white/10 text-3xl">🩸</div>
            <h1 className="mt-7 text-4xl font-black leading-tight">Create a verified HemoDonation account.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Verified profile, location based search and controlled donor-recipient access for emergency blood donation.
            </p>
          </div>

          <div className="space-y-3">
            {["OTP verification", "Location-based matching", "Eligibility tracking"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm font-bold text-slate-100">
                <FiCheckCircle className="text-emerald-300" /> {item}
              </div>
            ))}
          </div>
        </aside>

        <section className="max-h-[94vh] overflow-y-auto p-5 sm:p-7">
          {showOTP ? (
            <VerifyOTP phone={formData.phone} testingOtp={testingOtp} onOtpUpdate={setTestingOtp} />
          ) : (
            <>
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-200">
                    <FiUserPlus /> Registration
                  </div>
                  <h2 className="mt-3 text-3xl font-black">Create Account</h2>
                  <p className="mt-1 text-sm text-slate-400">Join as donor or recipient.</p>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.06] p-1.5">
                  {[
                    ["donor", "Donor"],
                    ["recipient", "Recipient"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleRoleChange(value)}
                      className={`rounded-xl py-3 text-sm font-black transition ${formData.role === value ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input name="full_name" placeholder="Full name" value={formData.full_name} onChange={handleChange} className={inputClass} />
                  <input name="email" placeholder="Gmail address" value={formData.email} onChange={handleChange} className={inputClass} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    name="phone"
                    placeholder="03XXXXXXXXX"
                    value={formData.phone}
                    maxLength={11}
                    inputMode="numeric"
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                    className={inputClass}
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputClass} pr-12`}
                    />
                    <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select name="blood_group" value={formData.blood_group} onChange={handleChange} className={selectClass}>
                    <option value="">Blood Group</option>
                    {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>

                  <select name="gender" value={formData.gender} onChange={handleChange} className={selectClass}>
                    <option value="">Gender</option>
                    {genders.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </div>

                <CityDropdown value={formData.city} onChange={(city) => setFormData({ ...formData, city })} variant="dark" placeholder="Search city / area" />

                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-600/15 text-red-200"><FiMapPin /></span>
                      <div>
                        <p className="font-black">Use My Current Location</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">Required for nearby donor search and emergency matching.</p>
                      </div>
                    </div>

                    <button type="button" onClick={handleLocationToggle} className={`relative h-8 w-14 shrink-0 rounded-full transition ${useCurrentLocation ? "bg-emerald-500" : "bg-slate-700"}`}>
                      <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${useCurrentLocation ? "left-7" : "left-1"}`} />
                    </button>
                  </div>

                  {location.loading && <p className="mt-3 text-xs font-bold text-blue-300">Detecting location...</p>}
                  {location.latitude && <p className="mt-3 text-xs font-bold text-emerald-300">Location captured successfully.</p>}
                </div>

                <button type="submit" disabled={loading} className="w-full rounded-2xl bg-red-600 py-3.5 font-black text-white shadow-xl shadow-red-700/25 transition hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-60">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              {message && <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-center text-sm font-bold text-red-200">{message}</p>}

              {showSuccessCard && (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center">
                  <p className="font-black text-emerald-300">Signup successful</p>
                  <p className="text-xs text-emerald-200/80">Opening OTP verification...</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default Signup;
