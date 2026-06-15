import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import DonorMap from "../components/donorMap";
import CityDropdown from "../components/cityDropdown";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function DonorSearch() {
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);

  const defaultCenter = [31.5204, 74.3587];

  const handleCityChange = (valueOrEvent) => {
    const value = valueOrEvent?.target?.value ?? valueOrEvent ?? "";
    setCity(value);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!bloodGroup || !city) {
      setMessage("Please select blood group and city.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

      const response = await API.get("/donor/search", {
        params: {
          blood_group: bloodGroup,
          city,
          lat: currentUser.latitude,
          lng: currentUser.longitude,
        },
      });

      const result = response.data.donors || [];
      setDonors(result);
      setSelectedDonor(null);
      if (result.length === 0) {
        setMessage(response.data.message || "No available donors found for this blood group and city.");
      }
    } catch (error) {
      console.error("Search error:", error);
      setMessage(error.response?.data?.message || "Search failed.");
      setDonors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      <div className="fixed inset-0 pointer-events-none soft-grid opacity-30" />
      <div className="fixed -top-32 -left-32 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
      <div className="fixed top-40 -right-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <header className="relative z-10 border-b border-white/10 bg-[#050914]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1380px] items-center justify-between px-4 sm:px-6">
          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Hemo<span className="text-red-500">Donation</span>
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">Smart donor matching with trust profile strength</p>
          </div>

          <Link
            to="/recipient"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1380px] px-4 py-6 sm:px-6">
        <section className="mb-5 rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Find Donors</p>
              <h2 className="mt-2 text-3xl font-black">Search available blood donors</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Results are ranked by availability, distance, reliability score and donor trust profile strength.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <CityDropdown value={city} onChange={handleCityChange} variant="dark" />

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-red-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search Donors"}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
              {message}
            </div>
          )}

        </section>

        {donors.length > 0 && (
          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-black">Best matches</h3>
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-200">
                    {donors.length} donor(s)
                  </span>
                </div>

                <div className="space-y-3">
                  {donors.map((donor) => (
                    <DonorResultCard
                      key={donor.id}
                      donor={donor}
                      selected={selectedDonor?.id === donor.id}
                      onClick={() => setSelectedDonor(donor)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">Map View</p>
                  <h3 className="mt-1 text-xl font-black">Nearby donor locations</h3>
                </div>
                {selectedDonor && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-200">
                    Selected: {selectedDonor.full_name}
                  </span>
                )}
              </div>

              <DonorMap
                donors={donors || []}
                center={defaultCenter}
                selectedDonor={selectedDonor || null}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function DonorResultCard({ donor, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-3xl border p-4 text-left transition ${
        selected
          ? "border-red-400/50 bg-red-500/15"
          : "border-white/10 bg-[#0b1220] hover:border-red-400/30 hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-red-500/10 text-lg font-black text-red-100">
          {donor.profile_photo_url ? (
            <img src={donor.profile_photo_url} alt={donor.full_name} className="h-full w-full object-cover" />
          ) : (
            getInitials(donor.full_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-lg font-black text-white">{donor.full_name}</h4>
            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-black text-red-200">{donor.blood_group}</span>
            <span className={badgeClass(donor.reliability_badge)}>{donor.reliability_badge || "Bronze"}</span>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {donor.city || "N/A"} • {donor.distance_km !== null && donor.distance_km !== undefined ? `${donor.distance_km} km away` : "Distance unavailable"}
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <ScorePill label="Match" value={`${donor.matching_score ?? 0}%`} />
            <ScorePill label="Reliability" value={`${donor.reliability_score ?? 0}%`} />
            <ScorePill label="Trust" value={`${donor.profile_strength ?? 0}%`} />
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
            <span>📞 {donor.phone || "Not available"}</span>
            <span>💬 {donor.whatsapp || "WhatsApp not added"}</span>
            <span>📍 {donor.preferred_area || donor.address || "Area not added"}</span>
            <span>🕒 {formatPreferredTime(donor.preferred_time)}</span>
            <span>🚗 Can travel: {donor.can_travel ? "Yes" : "No"}</span>
            <span>🩺 Health: {Number(donor.health_check_completed) === 1 ? "Checked" : "Pending"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function ScorePill({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

function badgeClass(badge = "Bronze") {
  const base = "rounded-full px-2.5 py-1 text-xs font-black";
  if (badge === "Gold") return `${base} bg-yellow-500/15 text-yellow-200`;
  if (badge === "Silver") return `${base} bg-slate-300/15 text-slate-200`;
  return `${base} bg-orange-500/15 text-orange-200`;
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HD";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatPreferredTime(value) {
  if (!value || value === "anytime") return "Anytime";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export default DonorSearch;
