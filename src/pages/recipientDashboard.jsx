import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import CityDropdown from "../components/cityDropdown";
import UpdateLocationButton from "../components/updateLocationButton";
import NotificationBell from "../components/notificationBell";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["male", "female", "other"];
const urgencyOptions = ["normal", "urgent", "critical"];

const inputClass =
  "w-full bg-[#0b1220] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-500";

function RecipientDashboard() {
  const navigate = useNavigate();

  const [recipient, setRecipient] = useState(null);
  const [completeness, setCompleteness] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [completeLoadingId, setCompleteLoadingId] = useState(null);

  const [editData, setEditData] = useState({
    full_name: "",
    blood_group: "",
    gender: "",
    city: "",
  });

  const [formData, setFormData] = useState({
    blood_group: "",
    city: "",
    hospital_name: "",
    patient_name: "",
    units_needed: "",
    urgency: "normal",
    notes: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setPageError("");
      await Promise.allSettled([fetchProfile(), fetchRequests()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/recipient/profile");
      const recipientData = res.data?.recipient;

      if (!recipientData) {
        setPageError("Recipient profile not found.");
        return;
      }

      setRecipient(recipientData);
      setCompleteness(Number(res.data?.completeness || 0));
      setEditData({
        full_name: recipientData.full_name || "",
        blood_group: recipientData.blood_group || "",
        gender: recipientData.gender || "",
        city: recipientData.city || "",
      });

      setFormData((prev) => ({
        ...prev,
        blood_group: prev.blood_group || recipientData.blood_group || "",
        city: prev.city || recipientData.city || "",
      }));
    } catch (error) {
      console.error("Recipient profile error:", error);
      setPageError(error.response?.data?.message || "Unable to load recipient profile.");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests/my-requests");
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (error) {
      console.error("Fetch requests error:", error);
      setRequests([]);
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const createRequest = async (e) => {
    e.preventDefault();

    try {
      if (
        !formData.blood_group ||
        !formData.city ||
        !formData.hospital_name ||
        !formData.patient_name ||
        !formData.units_needed ||
        !formData.urgency
      ) {
        setNotice("Please fill all required request fields.");
        return;
      }

      setSubmittingRequest(true);
      await API.post("/requests", {
        ...formData,
        units_needed: Number(formData.units_needed),
      });

      setNotice("Blood request created successfully.");
      setFormData((prev) => ({
        blood_group: prev.blood_group || recipient?.blood_group || "",
        city: prev.city || recipient?.city || "",
        hospital_name: "",
        patient_name: "",
        units_needed: "",
        urgency: "normal",
        notes: "",
      }));

      await fetchRequests();
    } catch (error) {
      console.error("Create request error:", error);
      setNotice(error.response?.data?.message || "Error creating request.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const completeRequest = async (id) => {
    try {
      setCompleteLoadingId(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)));
      await API.patch(`/requests/${id}/complete`);
      setNotice("Request marked completed. Donor eligibility has been updated.");
      await fetchRequests();
    } catch (error) {
      console.error("Complete request error:", error);
      setNotice(error.response?.data?.message || "Failed to complete request.");
      await fetchRequests();
    } finally {
      setCompleteLoadingId(null);
    }
  };

  const updateProfile = async () => {
    try {
      if (!editData.full_name || !editData.blood_group || !editData.gender || !editData.city) {
        setNotice("Please fill all profile fields.");
        return;
      }

      setSavingProfile(true);
      await API.put("/recipient/profile", editData);
      await fetchProfile();
      setShowEditProfile(false);
      setShowProfileMenu(false);
      setNotice("Profile updated successfully.");
    } catch (error) {
      console.error("Update profile error:", error);
      setNotice(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const switchToDonor = () => {
    if (recipient?.role !== "both") {
      setNotice("This account does not have donor access.");
      return;
    }

    localStorage.setItem("activeMode", "donor");
    navigate("/donor", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeMode");
    navigate("/login", { replace: true });
  };

  const requestStats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((r) => r.status?.toLowerCase() === "open").length;
    const accepted = requests.filter((r) => r.status?.toLowerCase() === "accepted").length;
    const completed = requests.filter((r) => r.status?.toLowerCase() === "completed").length;
    const urgent = requests.filter((r) => ["urgent", "critical"].includes(r.urgency)).length;

    return { total, open, accepted, completed, urgent };
  }, [requests]);

  const latestRequest = useMemo(() => {
    return requests[0] || null;
  }, [requests]);

  const recentRequests = useMemo(() => {
    return [...requests].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [requests]);

  if (loading) {
    return <LoadingScreen title="Loading recipient dashboard..." />;
  }

  if (!recipient) {
    return (
      <ErrorScreen
        message={pageError || "Recipient profile not found. Please login again."}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050914] text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none soft-grid opacity-30" />
      <div className="fixed -top-32 -left-32 h-80 w-80 rounded-full bg-red-600/20 blur-3xl" />
      <div className="fixed top-40 -right-24 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate("/")} className="text-left">
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Hemo<span className="text-red-500">Donation</span>
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">Recipient command center</p>
          </button>

          <div className="relative flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <Link
              to="/recipient/search-donors"
              className="hidden rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-100 transition hover:bg-red-500/20 sm:inline-flex"
            >
              Find Donors
            </Link>

            {recipient?.role === "both" && (
              <button
                onClick={switchToDonor}
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10 sm:inline-flex"
              >
                Switch to Donor
              </button>
            )}

            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-lg transition hover:bg-white/10"
              title="Profile"
            >
              👤
            </button>

            {showProfileMenu && (
              <ProfileMenu
                user={recipient}
                onEdit={() => {
                  setShowEditProfile(true);
                  setShowProfileMenu(false);
                }}
                onSwitch={recipient?.role === "both" ? switchToDonor : null}
              />
            )}

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {notice && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-3xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} className="text-red-100/70 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {pageError && (
          <div className="mb-5 rounded-3xl border border-red-500/30 bg-red-950/30 px-5 py-4 text-sm text-red-100">
            {pageError}
          </div>
        )}

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <HeroCard recipient={recipient} stats={requestStats} latestRequest={latestRequest} />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Requests" value={requestStats.total} detail="All created requests" icon="📋" />
              <StatCard label="Open" value={requestStats.open} detail="Waiting for donor" icon="🔎" />
              <StatCard label="Accepted" value={requestStats.accepted} detail="Donor selected" icon="🤝" />
              <StatCard label="Completed" value={requestStats.completed} detail="Donation done" icon="✅" />
            </div>

            <section className="grid gap-5 lg:grid-cols-[2fr]">
              <CreateRequestForm
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                submittingRequest={submittingRequest}
                onSubmit={createRequest}
              />

            </section>
          </div>

          <aside className="space-y-5">
            <SearchCard recipient={recipient} />
            <ProfileCard recipient={recipient} completeness={completeness} onEdit={() => setShowEditProfile(true)} />
            <RequestsPanel
              requests={recentRequests}
              completeLoadingId={completeLoadingId}
              onComplete={completeRequest}
              onRefresh={fetchRequests}
            />
            <UrgencyGuide />
          </aside>
        </section>
      </main>

      {showEditProfile && (
        <EditProfileModal
          editData={editData}
          setEditData={setEditData}
          savingProfile={savingProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={updateProfile}
        />
      )}

      {showLogoutConfirm && (
        <ConfirmModal
          title="Confirm Logout"
          message="Are you sure you want to logout from HemoDonation?"
          confirmText="Yes, Logout"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

function LoadingScreen({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 h-14 w-14 animate-pulse rounded-full bg-red-600/30 shadow-2xl shadow-red-600/30" />
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">Please wait</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message, onLogout }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] px-4 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/15 text-2xl">⚠️</div>
        <h2 className="text-xl font-black text-red-300">Dashboard Error</h2>
        <p className="mt-3 text-sm text-slate-300">{message}</p>
        <button onClick={onLogout} className="mt-6 rounded-2xl bg-red-600 px-5 py-3 text-sm font-black hover:bg-red-500">
          Go to Login
        </button>
      </div>
    </div>
  );
}

function HeroCard({ recipient, stats, latestRequest }) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-red-950/40 via-[#111827]/95 to-[#050914] p-6 shadow-2xl shadow-red-950/20 sm:p-8">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
      <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-red-500/10 blur-2xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_280px] lg:items-end">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Recipient Dashboard
          </div>

          <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Welcome, <span className="text-red-400">{recipient.full_name || "Recipient"}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Create emergency blood requests, search nearby donors and track every request from open to completed.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniInfo label="Blood Group" value={recipient.blood_group || "N/A"} />
            <MiniInfo label="City" value={recipient.city || "N/A"} />
            <MiniInfo label="Urgent Cases" value={stats.urgent} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Latest Request</p>
              <p className="mt-2 text-2xl font-black text-white">{latestRequest?.blood_group || "No Request"}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-2xl">🩸</div>
          </div>

          {latestRequest ? (
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              <p>Patient: <span className="font-bold text-white">{latestRequest.patient_name}</span></p>
              <p>Hospital: <span className="font-bold text-white">{latestRequest.hospital_name}</span></p>
              <StatusBadge status={latestRequest.status} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-slate-300">Create your first blood request using the form below.</p>
          )}

          <Link
            to="/recipient/search-donors"
            className="mt-5 flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
          >
            Search Nearby Donors
          </Link>
        </div>
      </div>
    </section>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 truncate text-xl font-black text-white">{value}</p>
    </div>
  );
}

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 ">{label}</p>
          <h3 className="mt-2 text-4xl font-black text-white">{value}</h3>
        </div>
        <div className="flex h-8 w-10 items-center justify-center rounded-2xl  text-2xl">{icon}</div>
      </div>
      <p className="mt-4 text-sm leading-5 text-slate-400">{detail}</p>
    </div>
  );
}

function CreateRequestForm({ formData, setFormData, handleChange, submittingRequest, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Create Request</p>
        <h2 className="mt-2 text-2xl font-black">Blood request form</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Fill accurate patient and hospital details so donors can respond quickly.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Blood Group">
          <select name="blood_group" value={formData.blood_group} onChange={handleChange} className={inputClass}>
            <option value="">Select blood group</option>
            {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </Field>

        <Field label="City">
          <CityDropdown value={formData.city} onChange={(city) => setFormData((prev) => ({ ...prev, city }))} variant="dark" />
        </Field>

        <Field label="Patient Name">
          <input name="patient_name" value={formData.patient_name} placeholder="Patient name" onChange={handleChange} className={inputClass} />
        </Field>

        <Field label="Hospital Name">
          <input name="hospital_name" value={formData.hospital_name} placeholder="Hospital name" onChange={handleChange} className={inputClass} />
        </Field>

        <Field label="Units Needed">
          <input name="units_needed" type="number" min="1" max="20" value={formData.units_needed} placeholder="e.g. 2" onChange={handleChange} className={inputClass} />
        </Field>

        <Field label="Urgency">
          <select name="urgency" value={formData.urgency} onChange={handleChange} className={inputClass}>
            {urgencyOptions.map((item) => <option key={item} value={item}>{capitalize(item)}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Notes" className="mt-4">
        <textarea
          name="notes"
          value={formData.notes}
          placeholder="Any extra details for donor..."
          onChange={handleChange}
          rows={4}
          className={`${inputClass} min-h-28 resize-none`}
        />
      </Field>

      <button
        type="submit"
        disabled={submittingRequest}
        className="mt-5 w-full rounded-2xl bg-red-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:opacity-60"
      >
        {submittingRequest ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}

function RequestsPanel({ requests, completeLoadingId, onComplete, onRefresh }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Tracking</p>
          <h2 className="mt-2 text-2xl font-black">My requests</h2>
        </div>
        <button onClick={onRefresh} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10">
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <EmptyState icon="📋" title="No requests yet" description="Create a blood request and it will appear here for tracking." />
      ) : (
        <div className="max-h-[660px] space-y-4 overflow-y-auto pr-2">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              completeLoadingId={completeLoadingId}
              onComplete={() => onComplete(request.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RequestCard({ request, completeLoadingId, onComplete }) {
  return (
    <article className="rounded-[1.6rem] border border-white/10 bg-[#0b1220]/80 p-5 transition hover:border-red-400/30 hover:bg-[#111827]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={request.status} />
          <h3 className="mt-3 text-xl font-black">{request.blood_group} for {request.patient_name || "Patient"}</h3>
          <p className="mt-1 text-sm text-slate-400">{request.hospital_name || "Hospital not added"}</p>
        </div>
        <UrgencyBadge urgency={request.urgency} />
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <InfoLine label="City" value={request.city || "N/A"} />
        <InfoLine label="Units" value={request.units_needed || "N/A"} />
        <InfoLine label="Created" value={formatDate(request.created_at)} />
        <InfoLine label="Completed" value={formatDate(request.completed_at)} />
      </div>

      {request.notes && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-slate-400">{request.notes}</p>}

      {(request.donor_name || request.donor_phone) && (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">Accepted Donor</p>
          <p className="mt-2 font-black text-white">{request.donor_name || "Donor"}</p>
          <p className="mt-1 text-sm text-emerald-100/80">{request.donor_phone || "Phone not available"}</p>
          {request.donor_city && <p className="mt-1 text-sm text-emerald-100/70">{request.donor_city}</p>}
        </div>
      )}

      {request.status?.toLowerCase() === "accepted" && (
        <button
          onClick={onComplete}
          disabled={completeLoadingId === request.id}
          className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {completeLoadingId === request.id ? "Completing..." : "Mark Donation Completed"}
        </button>
      )}
    </article>
  );
}

function SearchCard({ recipient }) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-red-400/20 bg-red-500/10 p-5 shadow-2xl shadow-red-950/10 backdrop-blur-xl">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
      <div className="relative z-10">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-red-200">Find Donors</p>
        <h3 className="mt-2 text-2xl font-black">Search nearby eligible donors</h3>
        <p className="mt-3 text-sm leading-6 text-red-50/75">
          Use blood group, city and your saved location to view the best matching donors on map.
        </p>
        <Link
          to="/recipient/search-donors"
          className="mt-5 flex w-full items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500"
        >
          Open Donor Search
        </Link>
        {(!recipient.latitude || !recipient.longitude) && (
          <p className="mt-3 text-xs leading-5 text-yellow-100/90">Update your location below for accurate distance sorting.</p>
        )}
        <div className="mt-4">
          <UpdateLocationButton onSuccess={() => { }} />
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ recipient, completeness, onEdit }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Profile</p>
          <h3 className="mt-2 text-2xl font-black">{recipient.full_name}</h3>
          <p className="mt-1 text-sm text-slate-400">{recipient.email}</p>
        </div>
        <button onClick={onEdit} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10">
          Edit
        </button>
      </div>

      {/* <div className="mt-5 space-y-3">
        <ProfileRow label="Phone" value={recipient.phone || "N/A"} />
        <ProfileRow label="Blood" value={recipient.blood_group || "N/A"} />
        <ProfileRow label="Gender" value={capitalize(recipient.gender) || "N/A"} />
        <ProfileRow label="City" value={recipient.city || "N/A"} />
      </div> */}

      <div className="mt-5 rounded-3xl border border-white/10 bg-[#0b1220] p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-slate-300">Profile completeness</span>
          <span className="font-black text-red-300">{completeness}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(completeness, 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

function UrgencyGuide() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] to-[#070b16] p-5 shadow-2xl shadow-black/20">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Guide</p>
      <h3 className="mt-2 text-2xl font-black">Request urgency</h3>
      <div className="mt-5 space-y-3">
        <GuideRow color="red" title="Critical" detail="Life-threatening emergency, immediate contact needed." />
        <GuideRow color="yellow" title="Urgent" detail="Blood needed soon, prioritize quick donor response." />
        <GuideRow color="blue" title="Normal" detail="Planned or less critical requirement." />
      </div>
    </section>
  );
}

function GuideRow({ color, title, detail }) {
  const colorClass = {
    red: "bg-red-500/15 text-red-200 border-red-400/20",
    yellow: "bg-yellow-500/15 text-yellow-200 border-yellow-400/20",
    blue: "bg-blue-500/15 text-blue-200 border-blue-400/20",
  }[color];

  return (
    <div className={`rounded-3xl border p-4 ${colorClass}`}>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{detail}</p>
    </div>
  );
}

function EditProfileModal({ editData, setEditData, savingProfile, onClose, onSave }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220] shadow-2xl">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <h3 className="text-2xl font-black text-white">Edit Recipient Profile</h3>
          <p className="mt-1 text-sm text-slate-400">Keep your profile details accurate for emergency requests.</p>
        </div>

        <div className="space-y-4 p-6">
          <Field label="Full Name">
            <input
              type="text"
              value={editData.full_name}
              onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Blood Group">
            <select
              value={editData.blood_group}
              onChange={(e) => setEditData({ ...editData, blood_group: e.target.value })}
              className={inputClass}
            >
              <option value="">Select blood group</option>
              {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
            </select>
          </Field>

          <Field label="Gender">
            <select
              value={editData.gender}
              onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
              className={inputClass}
            >
              <option value="">Select gender</option>
              {genders.map((gender) => <option key={gender} value={gender}>{capitalize(gender)}</option>)}
            </select>
          </Field>

          <Field label="City">
            <CityDropdown value={editData.city} onChange={(city) => setEditData({ ...editData, city })} variant="dark" />
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/20 px-6 py-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-200 hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onSave} disabled={savingProfile} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500 disabled:opacity-60">
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="truncate font-bold text-slate-100">{value}</span>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-200">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "open").toLowerCase();
  const className = {
    completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    accepted: "border-blue-400/20 bg-blue-500/10 text-blue-300",
    rejected: "border-slate-400/20 bg-slate-500/10 text-slate-300",
    open: "border-yellow-400/20 bg-yellow-500/10 text-yellow-300",
  }[normalized] || "border-slate-400/20 bg-slate-500/10 text-slate-300";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${className}`}>
      {normalized}
    </span>
  );
}

function UrgencyBadge({ urgency }) {
  const normalized = String(urgency || "normal").toLowerCase();
  const className = {
    critical: "border-red-400/30 bg-red-500/15 text-red-200",
    urgent: "border-yellow-400/30 bg-yellow-500/15 text-yellow-200",
    normal: "border-blue-400/30 bg-blue-500/15 text-blue-200",
  }[normalized] || "border-blue-400/30 bg-blue-500/15 text-blue-200";

  return (
    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${className}`}>
      {normalized}
    </span>
  );
}

function ProfileMenu({ user, onEdit, onSwitch }) {
  return (
    <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/40">
      <div className="border-b border-white/10 p-4">
        <p className="truncate font-black text-white">{user.full_name}</p>
        <p className="mt-1 truncate text-xs text-slate-400">{user.email}</p>
      </div>
      <button onClick={onEdit} className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/5">
        Edit Profile
      </button>
      <Link to="/recipient/search-donors" className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/5 sm:hidden">
        Find Donors
      </Link>
      {onSwitch && (
        <button onClick={onSwitch} className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/5 sm:hidden">
          Switch to Donor
        </button>
      )}
    </div>
  );
}

function ConfirmModal({ title, message, confirmText, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
        <h3 className="text-xl font-black text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onConfirm} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-500">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-2xl">{icon}</div>
      <h3 className="font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function capitalize(value) {
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export default RecipientDashboard;
