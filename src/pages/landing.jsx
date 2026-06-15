import { useState } from "react";
import Signup from "./signup";
import Login from "./login";
import { FiActivity, FiMapPin, FiShield, FiUsers, FiX } from "react-icons/fi";

const stats = [
  { label: "Verified network", value: "100%", icon: FiShield },
  { label: "District focus", value: "Kasur", icon: FiMapPin },
  { label: "Role based access", value: "3 Roles", icon: FiUsers },
];

const features = [
  "Nearby donor search with map view",
  "OTP based verified registration",
  "Donor eligibility and availability tracking",
  "Emergency blood request management",
];

function Modal({ children, onClose, size = "max-w-5xl" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-5 backdrop-blur-sm">
      <div className={`relative w-full ${size} animate-[popup_0.28s_ease-out]`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 z-50 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white text-slate-950 shadow-xl transition hover:scale-105"
          aria-label="Close"
        >
          <FiX />
        </button>
        {children}
      </div>
    </div>
  );
}

function Landing() {
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedRole, setSelectedRole] = useState("donor");

  const openSignup = (role) => {
    setSelectedRole(role);
    setShowSignup(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050914] text-white soft-grid">
      <div className="absolute left-[-8rem] top-[-8rem] h-96 w-96 rounded-full bg-red-600/25 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-blue-600/10 blur-3xl" />

      <div className={`relative z-10 transition duration-300 ${showSignup || showLogin ? "scale-[1.01] blur-sm" : ""}`}>
        <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-600 shadow-lg shadow-red-600/30">🩸</span>
            <span className="text-2xl font-black tracking-tight">
              Hemo<span className="text-red-500">Donation</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 md:flex">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#process" className="hover:text-white">Process</a>
            <a href="#impact" className="hover:text-white">Impact</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-white/10"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => openSignup("donor")}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-black shadow-lg shadow-red-600/25 transition hover:-translate-y-0.5 hover:bg-red-500"
            >
              Join Now
            </button>
          </div>
        </header>

        <main>
          <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-200">
                <FiActivity /> Real-time blood donation network
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Find verified blood donors when every minute matters.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                HemoDonation connects recipients with nearby eligible donors through secure registration, map-based search, availability status and donation history.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => openSignup("recipient")}
                  className="rounded-2xl bg-red-600 px-7 py-4 text-center font-black shadow-2xl shadow-red-700/30 transition hover:-translate-y-1 hover:bg-red-500"
                >
                  Need Blood
                </button>
                <button
                  type="button"
                  onClick={() => openSignup("donor")}
                  className="rounded-2xl border border-white/10 bg-white/5 px-7 py-4 text-center font-black transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Become a Donor
                </button>
              </div>

              <div id="impact" className="mt-10 grid gap-3 sm:grid-cols-3">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="glass-panel rounded-3xl p-4">
                    <Icon className="text-red-300" />
                    <p className="mt-3 text-2xl font-black">{value}</p>
                    <p className="text-sm text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute inset-0 rounded-full bg-red-600/30 blur-3xl animate-[emergencyPulse_3s_ease-in-out_infinite]" />

              <div className="relative glass-panel overflow-hidden rounded-[2rem] p-5 sm:p-7">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />

                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-red-200">Emergency request</p>
                      <h2 className="mt-2 text-3xl font-black">O+ Blood Needed</h2>
                      <p className="mt-2 text-sm text-slate-400">Kasur DHQ Hospital • Critical</p>
                    </div>
                    <span className="rounded-2xl bg-red-500/15 px-4 py-2 text-sm font-black text-red-200">LIVE</span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {[
                      ["Nearest", "2.4 km"],
                      ["Donors", "12"],
                      ["Response", "Fast"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-slate-950/40 p-3 text-center">
                        <p className="text-lg font-black">{value}</p>
                        <p className="text-xs text-slate-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="features" className="mt-5 space-y-3">
                  {features.map((feature, index) => (
                    <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-600/15 font-black text-red-200">{index + 1}</span>
                      <p className="text-sm font-semibold text-slate-200">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="process" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["01", "Register", "Create a donor or recipient account with OTP verification."],
                ["02", "Search", "Filter nearby donors by blood group and city with map support."],
                ["03", "Connect", "Send requests and manage donation completion safely."],
              ].map(([step, title, text]) => (
                <div key={step} className="glass-panel rounded-3xl p-6">
                  <p className="text-sm font-black text-red-300">{step}</p>
                  <h3 className="mt-3 text-2xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {showSignup && (
        <Modal onClose={() => setShowSignup(false)}>
          <Signup initialRole={selectedRole} />
        </Modal>
      )}

      {showLogin && (
        <Modal onClose={() => setShowLogin(false)} size="max-w-md">
          <Login embedded />
        </Modal>
      )}
    </div>
  );
}

export default Landing;
