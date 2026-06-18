import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import CityDropdown from "../components/cityDropdown";
import UpdateLocationButton from "../components/updateLocationButton";
import NotificationBell from "../components/notificationBell";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["male", "female", "other"];


const inputClass =
  "w-full bg-[#0b1220] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-500";

function DonorDashboard() {
  const navigate = useNavigate();

  const [donor, setDonor] = useState(null);
  const [completeness, setCompleteness] = useState(0);
  const [requests, setRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [rejectedIds, setRejectedIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [submittingHealth, setSubmittingHealth] = useState(false);
  const [showHealthForm, setShowHealthForm] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [showPreDonationCheck, setShowPreDonationCheck] = useState(false);
  const [healthForm, setHealthForm] = useState({
    feeling_healthy: true,
    has_fever: false,
    taking_antibiotics: false,
    recent_surgery: false,
    chronic_disease: false,
  });

  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [showPostDonationCheck, setShowPostDonationCheck] = useState(false);

  const [postDonationData, setPostDonationData] = useState({
    feeling_weak: false,
    dizziness: false,
    infection: false,
  });

  const [selectedDonationId, setSelectedDonationId] = useState(null);

  useEffect(() => {
    if (
      donor?.post_donation_pending === 1 &&
      !sessionStorage.getItem("postDonationShown")
    ) {
      setShowPostDonationCheck(true);
      sessionStorage.setItem("postDonationShown", "true");
    }
  }, [donor]);

  const [editData, setEditData] = useState({
    full_name: "",
    blood_group: "",
    gender: "",
    city: "",
    profile_photo_data_url: "",
    profile_photo_preview: "",
    address: "",
    whatsapp: "",
    emergency_contact: "",
    preferred_area: "",
    preferred_time: "anytime",
    can_travel: false,
    bio: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (donor && Number(donor.post_donation_pending) === 1) {
      setShowPostDonationCheck(true);
    }
  }, [donor]);


  const loadDashboard = async () => {
    try {
      setLoading(true);
      setPageError("");

      await Promise.allSettled([
        fetchProfile(),
        fetchMatchingRequests(),
        fetchHistory(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await API.get("/donor/profile");
      const donorData = res.data?.donor;
      console.log("PROFILE RESPONSE:", res.data);
      console.log("DONOR:", res.data?.donor);
      console.log(
        "health_check_completed:",
        res.data?.donor?.health_check_completed
      );
      console.log("POST DONATION FLAG:", donorData.post_donation_check_required);
      if (!donorData) {
        setPageError("Donor profile not found.");
        return;
      }

      setDonor(donorData);
      console.log(
        "post_donation_pending:",
        donorData.post_donation_pending
      );
      setCompleteness(Number(res.data?.completeness || 0));
      setEditData({
        full_name: donorData.full_name || "",
        blood_group: donorData.blood_group || "",
        gender: donorData.gender || "",
        city: donorData.city || "",
        profile_photo_data_url: "",
        profile_photo_preview: donorData.profile_photo_url || "",
        address: donorData.address || "",
        whatsapp: donorData.whatsapp || "",
        emergency_contact: donorData.emergency_contact || "",
        preferred_area: donorData.preferred_area || "",
        preferred_time: donorData.preferred_time || "anytime",
        can_travel: Boolean(donorData.can_travel),
        bio: donorData.bio || "",
      });
    } catch (error) {
      console.error("Profile API error:", error);
      setPageError(error.response?.data?.message || "Unable to load donor profile.");
    }
  };

  const fetchMatchingRequests = async () => {
  try {
    const res = await API.get("/requests/matching");

    console.log("MATCHING RESPONSE:", res.data);

    setRequests(
      Array.isArray(res.data?.requests)
        ? res.data.requests
        : []
    );
  } catch (error) {
    console.warn("Matching requests API failed:", error);
    setRequests([]);
  }
};

  const fetchHistory = async () => {
    try {
      const res = await API.get("/requests/donor/history");
      setHistory(Array.isArray(res.data?.history) ? res.data.history : []);
    } catch (error) {
      console.warn("History API failed:", error);
      setHistory([]);
    }
  };

  const updateProfile = async () => {
    try {
      if (!editData.full_name || !editData.blood_group || !editData.gender || !editData.city) {
        setNotice("Please fill all profile fields.");
        return;
      }

      setSavingProfile(true);
      const payload = { ...editData };
      delete payload.profile_photo_preview;
      if (!payload.profile_photo_data_url) {
        delete payload.profile_photo_data_url;
      }
      await API.put("/donor/profile", payload);
      await fetchProfile();
      setShowEditProfile(false);
      setShowProfileMenu(false);
      setNotice("Profile updated successfully.");
    } catch (error) {
      console.error("Update profile error:", error);
      const status = error.response?.status;
      if (status === 413) {
        setNotice("Profile photo is too large. Please upload an image under 2MB.");
      } else {
        setNotice(error.response?.data?.message || "Failed to update profile.");
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      setAvailabilityLoading(true);
      await API.patch("/donor/toggle-availability");
      await fetchProfile();
      setNotice("Availability updated successfully.");
    } catch (error) {
      console.error("Toggle availability error:", error);
      setNotice(error.response?.data?.message || "Unable to update availability.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const refreshEligibility = async () => {
    try {
      setEligibilityLoading(true);
      const res = await API.post("/donor/eligibility-refresh");
      await fetchProfile();
      setNotice(res.data?.message || "Eligibility refreshed successfully.");
    } catch (error) {
      console.error("Refresh eligibility error:", error);
      setNotice(error.response?.data?.message || "Failed to refresh eligibility.");
    } finally {
      setEligibilityLoading(false);
    }
  };

  const submitHealthCheck = async () => {
    try {
      setSubmittingHealth(true);

      const res = await API.post("/donor/health-check", healthForm);

      await fetchProfile();

      setShowHealthForm(false);

      setNotice(res.data?.message || "Health check submitted successfully.");
    } catch (error) {
      setNotice(error.response?.data?.message || "Failed to submit health check.");
    } finally {
      setSubmittingHealth(false);
    }
  };

  const submitPreHealthCheck = async () => {
    try {
      setSubmittingHealth(true);

      const res = await API.post("/donor/pre-health-check", healthForm);

      if (res.data?.passed) {
        await API.patch(`/requests/${selectedRequestId}/respond`, {
          action: "accept",
        });

        setNotice("Request accepted successfully.");

        setRequests(prev =>
          prev.filter(r => r.id !== selectedRequestId)
        );
      } else {
        setNotice("You are not eligible for donation right now.");
      }

      setShowPreDonationCheck(false);
      setSelectedRequestId(null);

    } catch (err) {
      setNotice("Pre health check failed.");
    } finally {
      setSubmittingHealth(false);
    }
  };

  const submitPostDonationCheck = async () => {
    try {
      setSubmittingHealth(true);

      const res = await API.post("/donor/post-health-check", {
        donation_id: selectedDonationId,
        ...postDonationData,
      });

      setNotice(res.data?.message || "Post donation check submitted");

      setShowPostDonationCheck(false);
      sessionStorage.removeItem("postDonationShown");

      setDonor(prev => ({
        ...prev,
        post_donation_pending: 0,
      }));

      await fetchProfile();

    } catch (error) {
      console.error(error);
      setNotice(
        error.response?.data?.message ||
        "Post donation check failed"
      );
    } finally {
      setSubmittingHealth(false);
    }
  };

  const openPostDonationCheck = (donationId) => {
    setSelectedDonationId(donationId);
    setShowPostDonationCheck(true);
  };

  const respondToRequest = async (requestId, action) => {
    try {
      setActionLoadingId(`${action}-${requestId}`);
      await API.patch(`/requests/${requestId}/respond`, { action });

      if (action === "reject") {
        setRejectedIds((prev) => [...new Set([...prev, requestId])]);
        setRequests((prev) => prev.filter((request) => request.id !== requestId));
        setNotice("Request skipped from your dashboard.");
      } else {
        setNotice("Request accepted. Recipient can now complete the donation after successful contact.");
        setSelectedRequestId(requestId);
        setShowPreDonationCheck(true);
      }
    } catch (error) {
      console.error("Respond request error:", error);
      setNotice(error.response?.data?.message || "Failed to respond to request.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const switchToRecipient = () => {
    if (donor?.role !== "both") {
      setNotice("This account does not have recipient access.");
      return;
    }

    localStorage.setItem("activeMode", "recipient");
    navigate("/recipient", { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeMode");
    navigate("/login", { replace: true });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const eligibility = useMemo(() => getEligibilityInfo(donor), [donor]);

  const visibleRequests = useMemo(() => {
    return requests.filter((request) => !rejectedIds.includes(request.id));
  }, [requests, rejectedIds]);

  const dashboardStats = useMemo(() => {
    const completed = history.filter((item) => item.status === "completed").length;
    const urgent = visibleRequests.filter((item) => ["urgent", "critical"].includes(item.urgency)).length;

    return {
      completed,
      activeRequests: visibleRequests.length,
      urgent,
      profile: completeness,
    };
  }, [history, visibleRequests, completeness]);


  const isAvailable = donor?.donor_availability === "available";
  const canBecomeAvailable = eligibility.status === "eligible";
  const disableAvailabilityButton = availabilityLoading || (!isAvailable && !canBecomeAvailable);

  if (loading) {
    return <LoadingScreen title="Loading donor dashboard..." />;
  }

  if (!donor) {
    return (
      <ErrorScreen
        message={pageError || "Donor profile not found. Please login again."}
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
            <p className="hidden text-xs text-slate-400 sm:block">Donor control room</p>
          </button>

          <div className="relative flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            {donor?.role === "both" && (
              <button
                onClick={switchToRecipient}
                className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10 sm:inline-flex"
              >
                Switch to Recipient
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
                user={donor}
                onEdit={() => {
                  setShowEditProfile(true);
                  setShowProfileMenu(false);
                }}
                onSwitch={donor?.role === "both" ? switchToRecipient : null}
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

        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <HeroCard
              donor={donor}
              eligibility={eligibility}
              isAvailable={isAvailable}
              availabilityLoading={availabilityLoading}
              disableAvailabilityButton={disableAvailabilityButton}
              onToggle={toggleAvailability}
              onEdit={() => setShowEditProfile(true)}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Open Matches" value={dashboardStats.activeRequests} detail="Requests matching your blood group" icon="🩸" />
              <StatCard label="Urgent Cases" value={dashboardStats.urgent} detail="Need quicker response" icon="🚨" />
              <StatCard label="Completed" value={dashboardStats.completed} detail="Confirmed donations" icon="✅" />
              <StatCard label="Trust Profile" value={`${dashboardStats.profile}%`} detail="Profile strength" icon="🛡️" />
            </div>

            <HealthCheckCard
              donor={donor}
              healthForm={healthForm}
              setHealthForm={setHealthForm}
              submittingHealth={submittingHealth}
              onSubmit={submitHealthCheck}
              showForm={showHealthForm}
              setShowForm={setShowHealthForm}
            />
            <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Live Requests</p>
                  <h2 className="mt-1 text-2xl font-black">Matching blood requests</h2>
                </div>
                <button
                  onClick={fetchMatchingRequests}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:bg-white/10"
                >
                  Refresh
                </button>
              </div>

              {visibleRequests.length === 0 ? (
                <EmptyState
                  icon="🫶"
                  title="No matching requests right now"
                  description="Compatible blood requests appear here automatically based on blood group compatibility and urgency."
                />
              ) : (

                <div className="grid gap-4 lg:grid-cols-2">
                  {visibleRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      formatDate={formatDate}
                      actionLoadingId={actionLoadingId}
                      onAccept={() => {
                        setSelectedRequestId(request.id);
                        setShowPreDonationCheck(true);
                      }} onReject={() => respondToRequest(request.id, "reject")}
                    />
                  ))}
                </div>
              )}
            </section>
            <HistoryCard history={history} formatDate={formatDate} />
          </div>

          <aside className="space-y-5">
            <ProfileCard donor={donor} completeness={completeness} eligibility={eligibility} onEdit={() => setShowEditProfile(true)} />


            <EligibilityCard donor={donor} eligibility={eligibility} onRefresh={refreshEligibility} refreshing={eligibilityLoading} />
            <DonorTipsCard />
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

      {showPreDonationCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[90%] max-w-md rounded-2xl bg-[#0b1220] p-5 text-white">

            <h2 className="text-lg font-bold">Pre Donation Health Check</h2>

            <div className="mt-4 space-y-3">

              <HealthToggle
                label="I am feeling healthy today"
                checked={healthForm.feeling_healthy}
                onChange={() =>
                  setHealthForm(prev => ({
                    ...prev,
                    feeling_healthy: !prev.feeling_healthy
                  }))
                }
              />

              <HealthToggle
                label="I have fever or flu symptoms"
                checked={healthForm.has_fever}
                onChange={() =>
                  setHealthForm(prev => ({
                    ...prev,
                    has_fever: !prev.has_fever
                  }))
                }
              />

              <HealthToggle
                label="I am taking antibiotics"
                checked={healthForm.taking_antibiotics}
                onChange={() =>
                  setHealthForm(prev => ({
                    ...prev,
                    taking_antibiotics: !prev.taking_antibiotics
                  }))
                }
              />

              <HealthToggle
                label="I had recent surgery"
                checked={healthForm.recent_surgery}
                onChange={() =>
                  setHealthForm(prev => ({
                    ...prev,
                    recent_surgery: !prev.recent_surgery
                  }))
                }
              />

            </div>

            <button
              onClick={submitPreHealthCheck}
              className="mt-5 w-full rounded-xl bg-red-600 py-2 font-bold"
            >
              Continue Donation
            </button>

            <button
              onClick={() => setShowPreDonationCheck(false)}
              className="mt-2 w-full text-sm text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPostDonationCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#0b1220] p-6 shadow-2xl">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
                  Post Donation
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Recovery Check
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-2xl">
                ❤️‍🩹
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Help us monitor your recovery after donation.
            </p>

            <div className="mt-6 space-y-3">

              <HealthToggle
                label="I feel weak after donation"
                checked={postDonationData.feeling_weak}
                onChange={() =>
                  setPostDonationData((prev) => ({
                    ...prev,
                    feeling_weak: !prev.feeling_weak,
                  }))
                }
              />

              <HealthToggle
                label="I experienced dizziness"
                checked={postDonationData.dizziness}
                onChange={() =>
                  setPostDonationData((prev) => ({
                    ...prev,
                    dizziness: !prev.dizziness,
                  }))
                }
              />

              <HealthToggle
                label="I noticed infection or unusual symptoms"
                checked={postDonationData.infection}
                onChange={() =>
                  setPostDonationData((prev) => ({
                    ...prev,
                    infection: !prev.infection,
                  }))
                }
              />
            </div>

            <button
              onClick={submitPostDonationCheck}
              className="mt-6 w-full rounded-2xl bg-red-600 py-3 font-black text-white transition hover:bg-red-500"
            >
              Submit Recovery Check
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function getEligibilityInfo(donor) {
  if (!donor?.last_donation_date) {
    return {
      status: "eligible",
      message: "You are eligible to donate now.",
      remainingDays: 0,
      cooldownDays: String(donor?.gender || "").toLowerCase() === "female" ? 120 : 90,
      nextDate: "Eligible now",
      lastDonationText: "No previous donation",
      progress: 100,
    };
  }

  const gender = String(donor?.gender || "").toLowerCase();
  const cooldownDays = gender === "female" ? 120 : 90;
  const lastDonationDate = new Date(donor.last_donation_date);

  if (Number.isNaN(lastDonationDate.getTime())) {
    return {
      status: "unknown",
      message: "Last donation date is not valid.",
      remainingDays: cooldownDays,
      cooldownDays,
      nextDate: "N/A",
      lastDonationText: "Invalid date",
      progress: 0,
    };
  }

  const today = new Date();
  const diffDays = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));
  const remainingDays = Math.max(cooldownDays - diffDays, 0);
  const nextDonationDate = new Date(lastDonationDate);
  nextDonationDate.setDate(nextDonationDate.getDate() + cooldownDays);

  return {
    status: remainingDays === 0 ? "eligible" : "waiting",
    message:
      remainingDays === 0
        ? "You are eligible to donate now."
        : `You can donate again after ${remainingDays} day(s).`,
    remainingDays,
    cooldownDays,
    nextDate: remainingDays === 0 ? "Eligible now" : nextDonationDate.toLocaleDateString("en-GB"),
    lastDonationText: lastDonationDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    progress: Math.min(Math.round((Math.max(diffDays, 0) / cooldownDays) * 100), 100),
  };
}

function LoadingScreen({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050914] px-3 text-white">
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
    <div className="flex min-h-screen items-center justify-center bg-[#050914] px-3 text-white">
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


function HeroCard({
  donor,
  eligibility,
  isAvailable,
  availabilityLoading,
  disableAvailabilityButton,
  onToggle,
  onEdit,
}) {
  return (
    <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-gradient-to-br from-red-950/40 via-[#111827]/95 to-[#050914] p-6 shadow-2xl shadow-red-950/20 sm:p-8">

      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
      <div className="absolute bottom-0 right-10 h-28 w-28 rounded-full bg-red-500/10 blur-3xl" />

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_260px] lg:items-start">


        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-red-200">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Donor Dashboard
          </div>

          <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Welcome back,{" "}
            <span className="text-red-400">{donor.full_name || "Donor"}</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-5 text-slate-300 sm:text-base">
            Manage your availability, respond to emergency requests and keep your donation profile ready.
          </p>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 mt-6">
            <MiniInfo label="Blood Group" value={donor.blood_group || "N/A"} />
            <MiniInfo label="City" value={donor.city || "N/A"} />
            <MiniInfo label="Badge" value={donor.reliability_badge || "Bronze"} />
            <MiniInfo label="Next Donation" value={eligibility.nextDate} />
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="mt-auto rounded-[1.8rem] border border-white/10 bg-black/25 p-5 backdrop-blur-xl">

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Current Status
              </p>

              <p
                className={`mt-2 text-xl font-black ${isAvailable ? "text-emerald-300" : "text-red-300"
                  }`}
              >
                {isAvailable ? "Available" : "Not Available"}
              </p>
            </div>

            <div
              className={`h-11 w-11 rounded-2xl flex items-center justify-center text-xl ${isAvailable ? "bg-emerald-500/15" : "bg-red-500/15"
                }`}
            >
              {isAvailable ? "🟢" : "🔴"}
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-300 leading-6">
            {eligibility.message}
          </p>

          <button
            onClick={onToggle}
            disabled={disableAvailabilityButton}
            className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black transition ${isAvailable
                ? "bg-slate-700 text-white hover:bg-slate-600"
                : "bg-red-600 text-white shadow-lg shadow-red-950/30 hover:bg-red-500"
              } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {availabilityLoading
              ? "Updating..."
              : isAvailable
                ? "Set Not Available"
                : "Set Available"}
          </button>
        </div>
      </div>

    </section>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-4 flex flex-col justify-center">
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-white break-words leading-tight">
        {value}
      </p>
    </div>
  );
}

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <h3 className="mt-2 text-3xl font-black text-white">{value}</h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">{icon}</div>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}

function RequestCard({ request, formatDate, actionLoadingId, onAccept, onReject }) {
  const urgencyClass = getUrgencyClass(request.urgency);

  return (
    <article className="group rounded-[1.6rem] border border-white/10 bg-[#0b1220]/80 p-5 transition hover:-translate-y-0.5 hover:border-red-400/30 hover:bg-[#111827]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${urgencyClass}`}>
            {request.urgency || "normal"}
          </span>
          <h3 className="mt-3 text-xl font-black">{request.blood_group} required</h3>
          <p className="mt-1 text-sm text-slate-400">For {request.patient_name || "Patient"}</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-red-500/10 text-2xl font-black text-red-200">
          {request.blood_group || "🩸"}
        </div>
      </div>

      <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <InfoLine label="Hospital" value={request.hospital_name || "N/A"} />
        <InfoLine label="City" value={request.city || "N/A"} />
        <InfoLine label="Units" value={request.units_needed || "N/A"} />
        <InfoLine label="Posted" value={formatDate(request.created_at)} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Recipient Contact</p>
        <p className="mt-2 font-bold text-white">{request.recipient_name || "Recipient"}</p>
        <p className="mt-1 text-sm text-slate-300">{request.recipient_phone || "Phone not available"}</p>
        {request.notes && <p className="mt-3 text-sm leading-6 text-slate-400">Notes: {request.notes}</p>}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          onClick={onReject}
          disabled={actionLoadingId === `reject-${request.id}`}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
        >
          {actionLoadingId === `reject-${request.id}` ? "Skipping..." : "Skip"}
        </button>
        <button
          onClick={onAccept}
          disabled={actionLoadingId === `accept-${request.id}`}
          className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:opacity-60"
        >
          {actionLoadingId === `accept-${request.id}` ? "Accepting..." : "Accept"}
        </button>
      </div>
    </article>
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

function ProfileCard({ donor, completeness, eligibility, onEdit }) {
  const avatarUrl = donor.profile_photo_url;
  const initials = getInitials(donor.full_name);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-red-500/10 text-xl font-black text-red-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt={donor.full_name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Donor Trust Profile</p>
            <h3 className="mt-2 text-2xl font-black">{donor.full_name}</h3>
            <p className="mt-1 text-sm text-slate-400">{donor.email}</p>
          </div>
        </div>
        <button onClick={onEdit} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10">
          Edit
        </button>
      </div>

      <div className="mt-5 space-y-3">
        <ProfileRow label="Phone" value={donor.phone || "N/A"} />
        <ProfileRow label="Gender" value={capitalize(donor.gender) || "N/A"} />
        <ProfileRow label="Last Donation" value={eligibility.lastDonationText} />
        <ProfileRow label="Reliability Badge" value={donor.reliability_badge || "Bronze"} />
        <ProfileRow label="Reliability Score" value={`${donor.reliability_score_calculated ?? donor.reliability_score ?? 0}%`} />
      </div>

      {donor.bio && (
        <div className="mt-4 rounded-3xl border border-white/10 bg-[#0b1220] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Donor Note</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{donor.bio}</p>
        </div>
      )}

      <div className="mt-5 rounded-3xl border border-white/10 bg-[#0b1220] p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold text-slate-300">Profile strength</span>
          <span className="font-black text-red-300">{completeness}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(completeness, 100)}%` }} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          Add photo, WhatsApp, emergency contact, preferred area/time and short note to build recipient trust.
        </p>
      </div>
    </section>
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


function HealthCheckCard({ donor, healthForm, setHealthForm, submittingHealth, onSubmit, showForm, setShowForm }) {
  const isPassed = Number(donor.health_check_completed) === 1;
  const isUnchecked = donor.health_check_completed === null || donor.health_check_completed === undefined;

  useEffect(() => {
    console.log("useEffect fired", isPassed);

    if (isPassed) {
      setShowForm(false);
    }
  }, [isPassed]);

  const toggle = (field) => {
    setHealthForm((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Health Check</p>
          <h3 className="mt-2 text-2xl font-black">Safety screening</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Donor safety status helps recipients trust active donors during emergencies.
          </p>
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-3xl text-2xl ${isPassed ? "bg-emerald-500/10" : "bg-yellow-500/10"}`}>
          {isPassed ? "✅" : "🩺"}
        </div>
      </div>

      {!showForm ? (
        isPassed ? (
          //  PASSED STATE
          <div className="mt-5 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-bold text-emerald-200">
              Health check passed
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-100"
            >
              Reconfirm Health Check
            </button>
          </div>
        ) : donor?.health_check_completed === null ||
          donor?.health_check_completed === undefined ? (
          // NEW USER STATE 
          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold text-slate-200">
              Health check not completed yet
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Please complete your first health screening to become an active donor.
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-2xl bg-red-600 px-4 py-2 text-sm font-black text-white"
            >
              Start Health Check
            </button>
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-red-400/20 bg-red-500/10 p-4">
            <p className="text-sm font-bold text-red-200">
              Health check failed
            </p>

            <button
              onClick={() => setShowForm(true)}
              className="mt-4 rounded-2xl bg-red-500/20 px-4 py-2 text-sm font-black text-red-100"
            >
              Reconfirm Health Check
            </button>
          </div>
        )
      ) : (
        <div className="mt-5 space-y-3">
          <HealthToggle
            label="I am feeling healthy today"
            checked={healthForm.feeling_healthy}
            onChange={() => toggle("feeling_healthy")}
          />
          <HealthToggle
            label="I have fever or flu symptoms"
            checked={healthForm.has_fever}
            onChange={() => toggle("has_fever")}
          />
          <HealthToggle
            label="I am taking antibiotics"
            checked={healthForm.taking_antibiotics}
            onChange={() => toggle("taking_antibiotics")}
          />
          <HealthToggle
            label="I had recent surgery"
            checked={healthForm.recent_surgery}
            onChange={() => toggle("recent_surgery")}
          />
          <HealthToggle
            label="I have a chronic disease risk"
            checked={healthForm.chronic_disease}
            onChange={() => toggle("chronic_disease")}
          />

          <button
            onClick={onSubmit}
            disabled={submittingHealth}
            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:opacity-60"
          >
            {submittingHealth ? "Submitting..." : "Submit Health Check"}
          </button>
        </div>
      )}
    </section>
  );
}

function HealthToggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-left text-sm transition hover:bg-[#111827]"
    >
      <span className="font-semibold text-slate-200">{label}</span>
      <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${checked ? "bg-red-500" : "bg-white/10"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </span>
    </button>
  );
}

function EligibilityCard({ donor, eligibility, onRefresh, refreshing }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] to-[#070b16] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">Eligibility</p>
          <h3 className="mt-2 text-2xl font-black">{eligibility.status === "eligible" ? "Ready to donate" : "Cooldown active"}</h3>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-2xl">
          {eligibility.status === "eligible" ? "❤️" : "⏳"}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{eligibility.message}</p>

      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
      >
        {refreshing ? "Refreshing..." : "Refresh Eligibility"}
      </button>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/25 p-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
          <span>Recovery progress</span>
          <span>{eligibility.progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-red-500" style={{ width: `${eligibility.progress}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <InfoLine label="Cooldown" value={`${eligibility.cooldownDays} days`} />
          <InfoLine label="Next Date" value={eligibility.nextDate} />
        </div>
      </div>

      <div className="mt-4">
        <UpdateLocationButton onSuccess={() => { }} />
      </div>

      {!donor.latitude || !donor.longitude ? (
        <p className="mt-3 text-xs leading-5 text-yellow-200/80">Update your location to improve nearby matching.</p>
      ) : (
        <p className="mt-3 text-xs leading-5 text-emerald-200/80">Location is available for nearby donor matching.</p>
      )}
    </section>

  );
}

function DonorTipsCard() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] to-[#070b16] p-5 shadow-2xl shadow-black/20">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-2xl">
          ❤️
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
            Donor Tips
          </p>
          <h3 className="text-xl font-black text-white">
            Stay donation ready
          </h3>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-4">
          <p className="font-bold text-emerald-200">💧 Stay Hydrated</p>
          <p className="mt-1 text-sm text-slate-400">
            Drink plenty of water before and after donation.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-400/10 bg-blue-500/5 p-4">
          <p className="font-bold text-blue-200">🥗 Eat Healthy</p>
          <p className="mt-1 text-sm text-slate-400">
            Iron-rich foods help maintain healthy blood levels.
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-400/10 bg-yellow-500/5 p-4">
          <p className="font-bold text-yellow-200">😴 Get Enough Rest</p>
          <p className="mt-1 text-sm text-slate-400">
            Proper sleep improves recovery and donor safety.
          </p>
        </div>
      </div>
    </section>
  );
}
function HistoryCard({ history, formatDate }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-red-300">History</p>
          <h3 className="mt-2 text-2xl font-black">Donation timeline</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">{history.length}</span>
      </div>

      {history.length === 0 ? (
        <EmptyState icon="📋" title="No completed donations" description="Completed donations will appear here after a recipient confirms the request." compact />
      ) : (
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          {history.map((item) => (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-[#0b1220] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-white">{item.blood_group} donation</h4>
                  <p className="mt-1 text-sm text-slate-400">Recipient: {item.recipient_name || "N/A"}</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-300">Completed</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.hospital_name || "N/A"}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDate(item.donation_date || item.completed_at || item.created_at)} • {item.units_donated || item.units_needed || 1} unit(s)</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function EditProfileModal({ editData, setEditData, savingProfile, onClose, onSave }) {
  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile photo must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setEditData({
        ...editData,
        profile_photo_data_url: result,
        profile_photo_preview: result,
      });
    };
    reader.readAsDataURL(file);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220] shadow-2xl">
        <div className="border-b border-white/10 bg-white/[0.03] px-6 py-5">
          <h3 className="text-2xl font-black text-white">Edit Donor Trust Profile</h3>
          <p className="mt-1 text-sm text-slate-400">Basic fields stay required; optional trust fields help recipients choose reliable donors.</p>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
          <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-red-500/10 text-xl font-black text-red-100">
              {editData.profile_photo_preview ? (
                <img src={editData.profile_photo_preview} alt="Profile preview" className="h-full w-full object-cover" />
              ) : (
                getInitials(editData.full_name)
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-200">Profile Photo</p>
              <p className="mt-1 text-xs text-slate-500">PNG/JPG/WEBP, max 2MB.</p>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhotoChange} className="mt-3 text-sm text-slate-300 file:mr-3 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-sm file:font-bold file:text-white" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                {bloodGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </Field>

            <Field label="Gender">
              <select
                value={editData.gender}
                onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                className={inputClass}
              >
                <option value="">Select gender</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>{capitalize(gender)}</option>
                ))}
              </select>
            </Field>

            <Field label="City">
              <CityDropdown
                value={editData.city}
                onChange={(city) => setEditData({ ...editData, city })}
                variant="dark"
              />
            </Field>

            <Field label="WhatsApp Number">
              <input
                type="tel"
                value={editData.whatsapp}
                onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                className={inputClass}
              />
            </Field>

            <Field label="Emergency Contact">
              <input
                type="tel"
                value={editData.emergency_contact}
                onChange={(e) => setEditData({ ...editData, emergency_contact: e.target.value })}
                placeholder="03XXXXXXXXX"
                maxLength={11}
                className={inputClass}
              />
            </Field>

            <Field label="Preferred Area">
              <input
                type="text"
                value={editData.preferred_area}
                onChange={(e) => setEditData({ ...editData, preferred_area: e.target.value })}
                placeholder="Kasur city, near DHQ, etc."
                className={inputClass}
              />
            </Field>

            <Field label="Preferred Time">
              <select
                value={editData.preferred_time}
                onChange={(e) => setEditData({ ...editData, preferred_time: e.target.value })}
                className={inputClass}
              >
                <option value="anytime">Anytime</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </Field>
          </div>

          <Field label="Full Address / Nearby Area">
            <input
              type="text"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Street, area, nearby landmark"
              className={inputClass}
            />
          </Field>

          <button
            type="button"
            onClick={() => setEditData({ ...editData, can_travel: !editData.can_travel })}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-left text-sm transition hover:bg-[#172033]"
          >
            <span>
              <span className="block font-bold text-slate-200">I can travel to recipient/hospital</span>
              <span className="mt-1 block text-xs text-slate-500">This improves your donor trust profile.</span>
            </span>
            <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${editData.can_travel ? "bg-red-500" : "bg-white/10"}`}>
              <span className={`h-4 w-4 rounded-full bg-white transition ${editData.can_travel ? "translate-x-5" : "translate-x-0"}`} />
            </span>
          </button>

          <Field label="Short Bio / Note">
            <textarea
              rows={3}
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Example: Available mostly in evening, can reach DHQ Kasur quickly."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 bg-black/20 px-6 py-5 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-slate-200 hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onSave} disabled={savingProfile} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-500 disabled:opacity-60">
            {savingProfile ? "Saving..." : "Save Trust Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HD";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function formatPreferredTime(value) {
  if (!value || value === "anytime") return "Anytime";
  return capitalize(value);
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
      {onSwitch && (
        <button onClick={onSwitch} className="block w-full px-4 py-3 text-left text-sm font-bold text-slate-200 hover:bg-white/5 sm:hidden">
          Switch to Recipient
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

function EmptyState({ icon, title, description, compact = false }) {
  return (
    <div className={`rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.025] text-center ${compact ? "p-5" : "p-10"}`}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-3xl bg-red-500/10 text-2xl">{icon}</div>
      <h3 className="font-black text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function getUrgencyClass(urgency) {
  const normalized = String(urgency || "normal").toLowerCase();

  if (normalized === "critical") {
    return "border-red-400/30 bg-red-500/15 text-red-200";
  }

  if (normalized === "urgent") {
    return "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";
  }

  return "border-blue-400/30 bg-blue-500/15 text-blue-200";
}

function capitalize(value) {
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
}

export default DonorDashboard;
