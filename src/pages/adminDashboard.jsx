import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiAward,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiSlash,
  FiUsers,
} from "react-icons/fi";
import API from "../services/api";
import NotificationBell from "../components/notificationBell";

const statusStyles = {
  active: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  pending: "border-amber-400/20 bg-amber-500/10 text-amber-300",
  blocked: "border-red-400/20 bg-red-500/10 text-red-300",
  verified: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  unverified: "border-slate-400/20 bg-slate-500/10 text-slate-300",
  rejected: "border-red-400/20 bg-red-500/10 text-red-300",
  approved: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  open: "border-blue-400/20 bg-blue-500/10 text-blue-300",
  accepted: "border-violet-400/20 bg-violet-500/10 text-violet-300",
  completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-red-400/20 bg-red-500/10 text-red-300",
};

const roleOptions = ["all", "donor", "recipient", "both", "admin"];
const userStatusOptions = ["all", "active", "pending", "blocked"];
const verificationOptions = ["all", "verified", "unverified", "rejected"];
const requestStatusOptions = ["all", "open", "accepted", "completed", "cancelled"];
const donationStatusOptions = ["all", "pending", "approved", "rejected"];

function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getStoredUser();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const [userFilters, setUserFilters] = useState({ search: "", role: "all", status: "all", verification: "all" });
  const [requestStatus, setRequestStatus] = useState("all");
  const [donationStatus, setDonationStatus] = useState("all");

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setNotice("");

      const [statsRes, usersRes, requestsRes, donationsRes] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users", { params: userFilters }),
        API.get("/admin/requests", { params: { status: requestStatus } }),
        API.get("/admin/donations", { params: { status: donationStatus } }),
      ]);

      setStats(statsRes.data?.stats || null);
      setUsers(Array.isArray(usersRes.data?.users) ? usersRes.data.users : []);
      setRequests(Array.isArray(requestsRes.data?.requests) ? requestsRes.data.requests : []);
      setDonations(Array.isArray(donationsRes.data?.donations) ? donationsRes.data.donations : []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const refreshStatsOnly = async () => {
    const res = await API.get("/admin/stats");
    setStats(res.data?.stats || null);
  };

  const fetchUsers = async () => {
    try {
      setActionLoading("users-filter");
      const res = await API.get("/admin/users", { params: userFilters });
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to fetch users.");
    } finally {
      setActionLoading("");
    }
  };

  const fetchRequests = async (status = requestStatus) => {
    try {
      setActionLoading("requests-filter");
      const res = await API.get("/admin/requests", { params: { status } });
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to fetch requests.");
    } finally {
      setActionLoading("");
    }
  };

  const fetchDonations = async (status = donationStatus) => {
    try {
      setActionLoading("donations-filter");
      const res = await API.get("/admin/donations", { params: { status } });
      setDonations(Array.isArray(res.data?.donations) ? res.data.donations : []);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to fetch donation entries.");
    } finally {
      setActionLoading("");
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      setActionLoading(`user-${userId}-${status}`);
      await API.patch(`/admin/users/${userId}/status`, { status });
      setNotice(`User marked as ${status}.`);
      await Promise.all([fetchUsers(), refreshStatsOnly()]);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update user status.");
    } finally {
      setActionLoading("");
    }
  };

  const updateDonorVerification = async (userId, status) => {
    try {
      setActionLoading(`verify-${userId}-${status}`);
      const notes = status === "verified" ? "Verified by admin." : prompt("Optional note for donor:") || "";
      await API.patch(`/admin/users/${userId}/verification`, {
        verified: status === "verified",
        status,
        notes,
      });
      setNotice(`Donor verification marked as ${status}.`);
      await Promise.all([fetchUsers(), refreshStatsOnly()]);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update donor verification.");
    } finally {
      setActionLoading("");
    }
  };

  const updateRequestStatus = async (requestId, status) => {
    try {
      setActionLoading(`request-${requestId}-${status}`);
      await API.patch(`/admin/requests/${requestId}/status`, { status });
      setNotice(`Request marked as ${status}.`);
      await Promise.all([fetchRequests(), refreshStatsOnly()]);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update request status.");
    } finally {
      setActionLoading("");
    }
  };

  const updateDonationApproval = async (donationId, approvalStatus) => {
    try {
      setActionLoading(`donation-${donationId}-${approvalStatus}`);
      const notes = approvalStatus === "approved" ? "Approved by admin." : prompt("Optional approval note:") || "";
      await API.patch(`/admin/donations/${donationId}/approval`, {
        approval_status: approvalStatus,
        notes,
      });
      setNotice(`Donation entry marked as ${approvalStatus}.`);
      await Promise.all([fetchDonations(), refreshStatsOnly()]);
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update donation approval.");
    } finally {
      setActionLoading("");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeMode");
    navigate("/login", { replace: true });
  };

  const statCards = useMemo(() => buildStatCards(stats), [stats]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen overflow-hidden bg-[#050914] text-white">
      <div className="fixed inset-0 pointer-events-none soft-grid opacity-30" />
      <div className="fixed -top-32 -left-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
      <div className="fixed top-56 -right-32 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050914]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-[1450px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Hemo<span className="text-red-500">Donation</span>
            </h1>
            <p className="hidden text-xs text-slate-400 sm:block">Admin verification and approval console</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <button type="button" onClick={loadDashboard} className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 sm:px-4">
              <span className="inline-flex items-center gap-2"><FiRefreshCw /> Refresh</span>
            </button>
            <button type="button" onClick={handleLogout} className="rounded-2xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20 sm:px-4">
              <span className="inline-flex items-center gap-2"><FiLogOut /> Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1450px] px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#101827]/95 to-[#0b1220]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-red-200">
                  <FiShield /> Admin Panel
                </div>
                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                  Verify donors, approve donation entries and monitor emergency requests.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                  Verified donors are prioritized for donor search and emergency matching. Donation entries can be approved or rejected by admin for cleaner records.
                </p>
              </div>

              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.05] p-4 lg:min-w-[260px]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Logged in as</p>
                <p className="mt-2 text-xl font-black">{admin?.full_name || "Admin"}</p>
                <p className="mt-1 text-sm text-slate-400">{admin?.email || "admin@gmail.com"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 p-6 shadow-2xl shadow-red-950/20 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">Needs Attention</p>
                <p className="mt-3 text-5xl font-black">{(stats?.users?.unverified_donors || 0) + (stats?.donations?.pending || 0)}</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-red-500/20 text-3xl text-red-200"><FiAlertTriangle /></div>
            </div>
            <p className="mt-6 text-sm leading-6 text-red-100/80">
              {stats?.users?.unverified_donors || 0} unverified donor(s) · {stats?.donations?.pending || 0} pending donation approval(s).
            </p>
          </div>
        </section>

        {notice && (
          <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-bold ${notice.toLowerCase().includes("unable") || notice.toLowerCase().includes("failed") ? "border-red-400/20 bg-red-500/10 text-red-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"}`}>
            {notice}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <StatCard key={card.label} {...card} />)}</section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <UserManagement
            users={users}
            admin={admin}
            userFilters={userFilters}
            setUserFilters={setUserFilters}
            actionLoading={actionLoading}
            fetchUsers={fetchUsers}
            updateUserStatus={updateUserStatus}
            updateDonorVerification={updateDonorVerification}
          />

          <div className="space-y-6">
            <RequestsPanel requests={requests} requestStatus={requestStatus} setRequestStatus={setRequestStatus} fetchRequests={fetchRequests} actionLoading={actionLoading} updateRequestStatus={updateRequestStatus} />
            <DonationsPanel donations={donations} donationStatus={donationStatus} setDonationStatus={setDonationStatus} fetchDonations={fetchDonations} actionLoading={actionLoading} updateDonationApproval={updateDonationApproval} />
            <DistributionPanel stats={stats} />
          </div>
        </section>
      </main>
    </div>
  );
}

function UserManagement({ users, admin, userFilters, setUserFilters, actionLoading, fetchUsers, updateUserStatus, updateDonorVerification }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d1421]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-2xl font-black">User & Donor Verification</h3>
          <p className="mt-1 text-sm text-slate-400">Search, activate/block and verify donor accounts.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={userFilters.search} onChange={(e) => setUserFilters((prev) => ({ ...prev, search: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && fetchUsers()} placeholder="Search name, email, phone" className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-600 focus:border-red-400/50" />
          </div>
          <FilterSelect value={userFilters.role} options={roleOptions} onChange={(value) => setUserFilters((prev) => ({ ...prev, role: value }))} />
          <FilterSelect value={userFilters.status} options={userStatusOptions} onChange={(value) => setUserFilters((prev) => ({ ...prev, status: value }))} />
          <FilterSelect value={userFilters.verification} options={verificationOptions} onChange={(value) => setUserFilters((prev) => ({ ...prev, verification: value }))} />
          <button type="button" onClick={fetchUsers} disabled={actionLoading === "users-filter"} className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-60">Apply</button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
        <div className="hidden max-h-[640px] overflow-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[#111827] text-xs uppercase tracking-[0.18em] text-slate-500"><tr><th className="px-4 py-4">User</th><th className="px-4 py-4">Role</th><th className="px-4 py-4">Status</th><th className="px-4 py-4">Verification</th><th className="px-4 py-4 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-white/10">{users.map((user) => <UserRow key={user.id} user={user} adminId={admin?.id} loadingKey={actionLoading} onStatusChange={updateUserStatus} onVerify={updateDonorVerification} />)}</tbody>
          </table>
        </div>
        <div className="grid gap-3 p-3 lg:hidden">{users.map((user) => <UserCard key={user.id} user={user} adminId={admin?.id} loadingKey={actionLoading} onStatusChange={updateUserStatus} onVerify={updateDonorVerification} />)}</div>
        {users.length === 0 && <EmptyState message="No users found for selected filters." />}
      </div>
    </div>
  );
}

function RequestsPanel({ requests, requestStatus, setRequestStatus, fetchRequests, actionLoading, updateRequestStatus }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d1421]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-2xl font-black">Emergency Requests</h3><p className="mt-1 text-sm text-slate-400">View and manage request status.</p></div>
        <FilterSelect value={requestStatus} options={requestStatusOptions} onChange={(value) => { setRequestStatus(value); fetchRequests(value); }} />
      </div>
      <div className="mt-5 max-h-[430px] space-y-3 overflow-auto pr-1">{requests.map((request) => <RequestCard key={request.id} request={request} loadingKey={actionLoading} onStatusChange={updateRequestStatus} />)}{requests.length === 0 && <EmptyState message="No blood requests found." />}</div>
    </div>
  );
}

function DonationsPanel({ donations, donationStatus, setDonationStatus, fetchDonations, actionLoading, updateDonationApproval }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d1421]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="text-2xl font-black">Donation Approvals</h3><p className="mt-1 text-sm text-slate-400">Approve or reject completed donation records.</p></div>
        <FilterSelect value={donationStatus} options={donationStatusOptions} onChange={(value) => { setDonationStatus(value); fetchDonations(value); }} />
      </div>
      <div className="mt-5 max-h-[460px] space-y-3 overflow-auto pr-1">{donations.map((donation) => <DonationCard key={donation.id} donation={donation} loadingKey={actionLoading} onApprovalChange={updateDonationApproval} />)}{donations.length === 0 && <EmptyState message="No donation entries found." />}</div>
    </div>
  );
}

function DistributionPanel({ stats }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0d1421]/90 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
      <h3 className="text-2xl font-black">Verified Donor Distribution</h3>
      <p className="mt-1 text-sm text-slate-400">Active and verified donors by blood group and city.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{(stats?.blood_groups || []).map((item) => <div key={item.blood_group} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center"><p className="text-2xl font-black text-red-200">{item.blood_group}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.count} donors</p></div>)}</div>
      <div className="mt-5 space-y-3">{(stats?.cities || []).map((city) => <div key={city.city} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"><span className="font-bold text-slate-200">{city.city}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">{city.donors} donors</span></div>)}{(stats?.cities || []).length === 0 && <p className="text-sm text-slate-500">No donor city data available.</p>}</div>
    </div>
  );
}

function StatCard({ label, value, helper, icon: Icon, tone = "slate" }) {
  const toneClass = tone === "red" ? "bg-red-500/10 text-red-200 border-red-400/20" : "bg-white/[0.05] text-slate-200 border-white/10";
  return <div className="rounded-[1.6rem] border border-white/10 bg-[#0d1421]/90 p-5 shadow-xl backdrop-blur-xl"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{label}</p><p className="mt-3 text-4xl font-black">{value}</p></div><div className={`grid h-12 w-12 place-items-center rounded-2xl border ${toneClass}`}><Icon /></div></div><p className="mt-4 text-sm text-slate-400">{helper}</p></div>;
}

function UserRow({ user, adminId, loadingKey, onStatusChange, onVerify }) {
  const donorCapable = ["donor", "both"].includes(user.role);
  return <tr className="bg-white/[0.02] transition hover:bg-white/[0.05]"><td className="px-4 py-4"><p className="font-black text-white">{user.full_name}</p><p className="mt-1 text-xs text-slate-500">{user.email} · {user.phone}</p><p className="mt-1 text-xs text-slate-500">{user.city || "No city"} · {user.blood_group || "N/A"}</p></td><td className="px-4 py-4 capitalize text-slate-300">{user.role}</td><td className="px-4 py-4"><Badge value={user.account_status} /></td><td className="px-4 py-4">{donorCapable ? <Badge value={user.verification_status || (user.is_verified_donor ? "verified" : "unverified")} /> : <span className="text-xs text-slate-600">Not donor</span>}</td><td className="px-4 py-4"><div className="flex flex-wrap justify-end gap-2">{user.account_status !== "active" && <SmallButton disabled={loadingKey === `user-${user.id}-active`} onClick={() => onStatusChange(user.id, "active")} label="Activate" />}{user.account_status !== "blocked" && user.id !== adminId && <SmallButton danger disabled={loadingKey === `user-${user.id}-blocked`} onClick={() => onStatusChange(user.id, "blocked")} label="Block" />}{donorCapable && Number(user.is_verified_donor) !== 1 && <SmallButton disabled={loadingKey === `verify-${user.id}-verified`} onClick={() => onVerify(user.id, "verified")} label="Verify" />}{donorCapable && Number(user.is_verified_donor) === 1 && <SmallButton muted disabled={loadingKey === `verify-${user.id}-unverified`} onClick={() => onVerify(user.id, "unverified")} label="Unverify" />}{donorCapable && <SmallButton danger disabled={loadingKey === `verify-${user.id}-rejected`} onClick={() => onVerify(user.id, "rejected")} label="Reject" />}</div></td></tr>;
}

function UserCard({ user, adminId, loadingKey, onStatusChange, onVerify }) {
  const donorCapable = ["donor", "both"].includes(user.role);
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black">{user.full_name}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p><p className="mt-1 text-xs text-slate-500">{user.phone}</p></div><Badge value={user.account_status} /></div><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white/10 px-3 py-1 font-bold capitalize text-slate-300">{user.role}</span><span className="rounded-full bg-red-500/10 px-3 py-1 font-black text-red-200">{user.blood_group || "N/A"}</span>{donorCapable && <Badge value={user.verification_status || (user.is_verified_donor ? "verified" : "unverified")} />}</div><div className="mt-4 flex flex-wrap gap-2">{user.account_status !== "active" && <SmallButton disabled={loadingKey === `user-${user.id}-active`} onClick={() => onStatusChange(user.id, "active")} label="Activate" />}{user.account_status !== "blocked" && user.id !== adminId && <SmallButton danger disabled={loadingKey === `user-${user.id}-blocked`} onClick={() => onStatusChange(user.id, "blocked")} label="Block" />}{donorCapable && Number(user.is_verified_donor) !== 1 && <SmallButton disabled={loadingKey === `verify-${user.id}-verified`} onClick={() => onVerify(user.id, "verified")} label="Verify" />}{donorCapable && Number(user.is_verified_donor) === 1 && <SmallButton muted disabled={loadingKey === `verify-${user.id}-unverified`} onClick={() => onVerify(user.id, "unverified")} label="Unverify" />}</div></div>;
}

function RequestCard({ request, loadingKey, onStatusChange }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-200">{request.blood_group}</span><Badge value={request.status} /><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black capitalize text-slate-300">{request.urgency}</span>{request.donation_approval_status && <Badge value={request.donation_approval_status} />}</div><h4 className="mt-3 text-lg font-black">{request.patient_name}</h4><p className="mt-1 text-sm text-slate-400">{request.hospital_name} · {request.city}</p><p className="mt-1 text-xs text-slate-500">Recipient: {request.recipient_name} · {request.recipient_phone}</p>{request.donor_name && <p className="mt-1 text-xs text-slate-500">Donor: {request.donor_name} · {request.donor_phone}</p>}</div><div className="text-right"><p className="text-2xl font-black">{request.units_needed}</p><p className="text-xs uppercase tracking-[0.18em] text-slate-500">units</p></div></div><div className="mt-4 flex flex-wrap gap-2">{request.status !== "cancelled" && request.status !== "completed" && <SmallButton danger disabled={loadingKey === `request-${request.id}-cancelled`} onClick={() => onStatusChange(request.id, "cancelled")} label="Cancel" />}{request.status === "cancelled" && <SmallButton disabled={loadingKey === `request-${request.id}-open`} onClick={() => onStatusChange(request.id, "open")} label="Re-open" />}</div></div>;
}

function DonationCard({ donation, loadingKey, onApprovalChange }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><Badge value={donation.approval_status} /><span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-200">{donation.donor_blood_group || "Blood"}</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black capitalize text-slate-300">{donation.urgency || "normal"}</span></div><h4 className="mt-3 text-lg font-black">{donation.donor_name} → {donation.recipient_name}</h4><p className="mt-1 text-sm text-slate-400">{donation.hospital_name || "Hospital N/A"} · {donation.city || "City N/A"}</p><p className="mt-1 text-xs text-slate-500">Date: {formatDate(donation.donation_date)} · Units: {donation.units_donated}</p>{donation.approved_by_name && <p className="mt-1 text-xs text-slate-500">Reviewed by {donation.approved_by_name} on {formatDate(donation.approved_at)}</p>}</div></div><div className="mt-4 flex flex-wrap gap-2">{donation.approval_status !== "approved" && <SmallButton disabled={loadingKey === `donation-${donation.id}-approved`} onClick={() => onApprovalChange(donation.id, "approved")} label="Approve" />}{donation.approval_status !== "rejected" && <SmallButton danger disabled={loadingKey === `donation-${donation.id}-rejected`} onClick={() => onApprovalChange(donation.id, "rejected")} label="Reject" />}{donation.approval_status !== "pending" && <SmallButton muted disabled={loadingKey === `donation-${donation.id}-pending`} onClick={() => onApprovalChange(donation.id, "pending")} label="Reset" />}</div></div>;
}

function Badge({ value }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black capitalize ${statusStyles[value] || "border-white/10 bg-white/10 text-slate-300"}`}>{value || "N/A"}</span>;
}

function SmallButton({ label, onClick, disabled, danger = false, muted = false }) {
  const classes = danger ? "bg-red-500/10 text-red-200 hover:bg-red-500/20" : muted ? "bg-white/10 text-slate-200 hover:bg-white/15" : "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20";
  return <button type="button" onClick={onClick} disabled={disabled} className={`rounded-xl px-3 py-2 text-xs font-black transition disabled:opacity-50 ${classes}`}>{label}</button>;
}

function FilterSelect({ value, options, onChange }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm font-bold capitalize text-white outline-none focus:border-red-400/50">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}

function EmptyState({ message }) {
  return <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-sm font-bold text-slate-500">{message}</div>;
}

function LoadingScreen() {
  return <div className="flex min-h-screen items-center justify-center bg-[#050914] px-4 text-white soft-grid"><div className="rounded-[2rem] border border-white/10 bg-[#0d1421]/95 p-8 text-center shadow-2xl backdrop-blur-xl"><div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-red-600/15 text-3xl text-red-200"><FiActivity className="animate-pulse" /></div><h2 className="mt-5 text-2xl font-black">Loading admin dashboard...</h2><p className="mt-2 text-sm text-slate-400">Fetching system statistics and approval records.</p></div></div>;
}

function buildStatCards(stats) {
  return [
    { label: "Total Donors", value: stats?.users?.donors || 0, helper: `${stats?.users?.verified_donors || 0} verified · ${stats?.users?.unverified_donors || 0} unverified`, icon: FiUsers },
    { label: "Verified Donors", value: stats?.users?.verified_donors || 0, helper: `${stats?.users?.available_donors || 0} available and eligible`, icon: FiAward, tone: "red" },
    { label: "Requests", value: stats?.requests?.total || 0, helper: `${stats?.requests?.open || 0} open · ${stats?.requests?.critical_active || 0} critical active`, icon: FiClock },
    { label: "Donation Approvals", value: stats?.donations?.pending || 0, helper: `${stats?.donations?.approved || 0} approved · ${stats?.donations?.rejected || 0} rejected`, icon: FiFileText },
  ];
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString();
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

export default AdminDashboard;
