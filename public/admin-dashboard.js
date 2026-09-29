import { auth } from "./firebase.js";
import { apiUrl, isLocalPreview } from "./api-url.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const content = document.getElementById("adminContent");
const sidebar = document.getElementById("adminSidebar");
const overlay = document.getElementById("adminOverlay");
const dialog = document.getElementById("userDialog");
const dialogBody = document.getElementById("userDialogBody");
const toastElement = document.getElementById("adminToast");

const pageInfo = {
    overview: ["Dashboard", "Temple of Turki administration"],
    users: ["Users", "Registered accounts and associated records"],
    donations: ["Donations", "Review and manage donation records"],
    announcements: ["Announcements", "Publish updates for the community"],
    gallery: ["Gallery", "Review and manage community-submitted images"],
    payments: ["Payments", "Payment records available in the donation database"],
    settings: ["Settings", "Existing payment configuration"],
    profile: ["Admin Profile", "Authorized administrator account"]
};

let currentUser;
let currentAdmin;
let currentView = "overview";
let usersPage = 1;
let usersSearch = "";
let usersStatus = "all";
let usersSort = "newest";
let usersPagination = { page: 1, pages: 1, total: 0 };
let userSearchTimer;
let restoreUserSearchFocus = false;
let toastTimer;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatMoney(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
        ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount)
        : "—";
}

function badge(value, type) {
    const normalized = String(value || "unknown").toLowerCase();
    const style = type || (["paid", "approved", "active", "published"].includes(normalized)
        ? "success"
        : ["failed", "rejected", "blocked", "disabled"].includes(normalized)
            ? "error"
            : "neutral");
    return `<span class="admin-badge ${style}">${escapeHtml(value || "Unknown")}</span>`;
}

function icon(name) {
    return `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function showToast(message, isError = false) {
    toastElement.textContent = message;
    toastElement.style.background = isError ? "#8d2a20" : "";
    toastElement.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastElement.hidden = true; }, 3500);
}

async function apiRequest(url, options = {}) {
    if (!currentUser) throw new Error("Your session has ended. Please sign in again.");

    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${await currentUser.getIdToken(true)}`);
    const isFormData = options.body instanceof FormData;
    if (options.body && !isFormData && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(apiUrl(url), { ...options, headers });
    let payload;
    try {
        payload = await response.json();
    } catch {
        const requestUrl = new URL(response.url);
        const contentType = response.headers.get("content-type") || "unknown content type";
        const localPreviewHint = isLocalPreview
            ? " Confirm the Express API is running on http://127.0.0.1:5000."
            : "";
        console.error("Admin API returned a non-JSON response:", {
            method: options.method || "GET",
            url: response.url,
            status: response.status,
            contentType
        });
        throw new Error(
            `The ${options.method || "GET"} ${requestUrl.pathname} request returned ` +
            `HTTP ${response.status} with ${contentType}.${localPreviewHint}`
        );
    }

    if (response.status === 403) {
        window.location.replace("user-dashboard.html");
        throw new Error("Administrator access is required.");
    }
    if (response.status === 401) {
        await signOut(auth);
        window.location.replace("user-login.html");
        throw new Error("Please sign in again.");
    }
    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || `Request failed (${response.status}).`);
    }
    return payload;
}

function setPageHeader(view) {
    const [title, subtitle] = pageInfo[view] || pageInfo.overview;
    document.getElementById("topbarTitle").textContent = title;
    document.getElementById("topbarSubtitle").textContent = subtitle;
    document.querySelectorAll(".admin-nav [data-view]").forEach((button) => {
        if (button.dataset.view === view) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
    document.querySelectorAll(".admin-sidebar-footer [data-view]").forEach((button) => {
        if (button.dataset.view === view) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
    });
}

function setLoading(message = "Loading…") {
    content.innerHTML = `<div class="admin-loading">${escapeHtml(message)}</div>`;
}

function renderError(error) {
    content.innerHTML = `<div class="admin-panel"><div class="admin-error">${escapeHtml(error.message || "Unable to load this section.")}</div></div>`;
}

async function loadView(view = currentView) {
    currentView = view;
    setPageHeader(view);
    closeMobileMenu();
    setLoading();
    try {
        if (view === "overview") await renderOverview();
        else if (view === "users") await renderUsers();
        else if (view === "donations") await renderDonations(false);
        else if (view === "payments") await renderDonations(true);
        else if (view === "announcements") await renderAnnouncements();
        else if (view === "gallery") await renderGallery();
        else if (view === "settings") await renderSettings();
        else if (view === "profile") renderProfile();
    } catch (error) {
        renderError(error);
    }
}

function statCard(label, value, iconName) {
    return `<article class="admin-stat"><div><div class="admin-stat-label">${escapeHtml(label)}</div><div class="admin-stat-value">${escapeHtml(value)}</div></div><span class="admin-stat-icon">${icon(iconName)}</span></article>`;
}

function donationRows(donations, paymentView = false) {
    if (!donations.length) return `<tr><td colspan="9" class="admin-empty">No donation records found.</td></tr>`;
    return donations.map((donation) => {
        const id = escapeHtml(donation._id);
        const status = String(donation.status || "pending");
        return `<tr>
            <td><strong>${escapeHtml(donation.name)}</strong><span class="admin-subtext">${escapeHtml(donation.userId)}</span></td>
            <td>${escapeHtml(donation.email || "—")}</td>
            <td>${escapeHtml(donation.mobile || "—")}</td>
            <td>${formatMoney(donation.amount)}</td>
            <td><span class="admin-badge neutral">Not stored</span></td>
            <td><span class="admin-badge neutral">Not stored</span></td>
            <td>${escapeHtml(donation.purpose || "—")}</td>
            <td>${formatDate(donation.createdAt)}</td>
            <td>${badge(status)}</td>
            <td><div class="admin-actions">
                ${status === "pending" ? `<button class="admin-button accent" data-action="donation-status" data-id="${id}" data-status="paid">${icon("check")}Verify</button>` : ""}
                <button class="admin-button danger" data-action="donation-delete" data-id="${id}" aria-label="Delete donation">${icon("trash")}Delete</button>
            </div></td>
        </tr>`;
    }).join("");
}

async function renderOverview() {
    const payload = await apiRequest("/api/admin/overview");
    const data = payload.data;
    const recentDonations = data.recentDonations || [];
    const recentUsers = data.recentUsers || [];
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>Dashboard overview</h2><p>Live totals from the existing Firebase and MongoDB records.</p></div><button class="admin-button secondary" data-action="refresh">${icon("refresh")}Refresh</button></div>
        <section class="admin-stats">
            ${statCard("Total Users", data.totalUsers, "users")}
            ${statCard("Total Donations", data.totalDonations, "donation")}
            ${statCard("Donation Amount", formatMoney(data.totalDonationAmount), "card")}
            ${statCard("Pending Donations", data.pendingDonations, "clock")}
            ${statCard("Verified Donations", data.verifiedDonations, "check")}
            ${statCard("Announcements", data.totalAnnouncements, "megaphone")}
            ${statCard("Gallery Items", data.totalGalleryItems, "image")}
            ${statCard("Pending Gallery Review", data.pendingGalleryItems, "clock")}
        </section>
        <div class="admin-grid-two">
            <section class="admin-panel">
                <div class="admin-panel-head"><h3>Recent donations</h3><button class="admin-button secondary" data-navigate="donations">View all ${icon("chevron")}</button></div>
                <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Donor / User ID</th><th>Email</th><th>Phone</th><th>Amount</th><th>Payment Method</th><th>Transaction ID</th><th>Purpose</th><th>Date</th><th>Status / Actions</th></tr></thead><tbody>${donationRows(recentDonations)}</tbody></table></div>
            </section>
            <section class="admin-panel">
                <div class="admin-panel-head"><h3>Recently registered users</h3><button class="admin-button secondary" data-navigate="users">View all ${icon("chevron")}</button></div>
                <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Registered</th></tr></thead><tbody>
                    ${recentUsers.length ? recentUsers.map((user) => `<tr><td>${escapeHtml(user.displayName || "—")}</td><td>${escapeHtml(user.email || "—")}</td><td>${formatDate(user.creationTime)}</td></tr>`).join("") : `<tr><td colspan="3" class="admin-empty">No registered users found.</td></tr>`}
                </tbody></table></div>
                <div class="admin-panel-head"><h3>Pending actions</h3></div>
                <div class="admin-panel-body"><div class="admin-toolbar">
                    <button class="admin-button secondary" data-navigate="donations">${data.pendingDonations} pending donation(s)</button>
                    <button class="admin-button secondary" data-navigate="gallery">${data.pendingGalleryItems} gallery item(s) awaiting review</button>
                </div></div>
            </section>
        </div>`;
}

function userRows(users) {
    if (!users.length) return `<tr><td colspan="7" class="admin-empty">No users match these filters.</td></tr>`;
    return users.map((user) => {
        const uid = escapeHtml(user.uid);
        return `<tr>
            <td><strong>${escapeHtml(user.displayName || "—")}</strong><span class="admin-subtext">${uid}</span></td>
            <td>${escapeHtml(user.email || "—")}${user.emailVerified ? `<span class="admin-subtext">Email verified</span>` : ""}</td>
            <td>${escapeHtml(user.phoneNumber || "—")}</td>
            <td>${formatDate(user.creationTime)}</td>
            <td>${formatDate(user.lastSignInTime)}</td>
            <td>${badge(user.disabled ? "Blocked" : "Active")}</td>
            <td><div class="admin-actions">
                <button class="admin-button secondary" data-action="user-view" data-id="${uid}">${icon("eye")}View</button>
                <button class="admin-button secondary" data-action="user-edit" data-id="${uid}">${icon("edit")}Edit</button>
                <button class="admin-button ${user.disabled ? "accent" : "danger"}" data-action="user-toggle" data-id="${uid}" data-disabled="${!user.disabled}">${user.disabled ? "Unblock" : "Block"}</button>
                <button class="admin-button danger" data-action="user-delete" data-id="${uid}" aria-label="Delete user">${icon("trash")}</button>
            </div></td>
        </tr>`;
    }).join("");
}

async function renderUsers() {
    const query = new URLSearchParams({
        page: String(usersPage),
        limit: "25",
        search: usersSearch,
        status: usersStatus,
        sort: usersSort
    });
    const payload = await apiRequest(`/api/admin/users?${query}`);
    usersPagination = payload.pagination || usersPagination;
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>User management</h2><p>${usersPagination.total} registered account(s). Account and linked donation/booking records come from current services.</p></div><button class="admin-button secondary" data-action="refresh">${icon("refresh")}Refresh</button></div>
        <section class="admin-panel">
            <div class="admin-panel-head"><h3>Registered users</h3><div class="admin-toolbar">
                <input id="userSearch" class="admin-field" type="search" placeholder="Search name, email, phone or UID" value="${escapeHtml(usersSearch)}" aria-label="Search users">
                <select id="userStatus" class="admin-select" aria-label="Filter users by account status">
                    <option value="all" ${usersStatus === "all" ? "selected" : ""}>All accounts</option>
                    <option value="active" ${usersStatus === "active" ? "selected" : ""}>Active</option>
                    <option value="blocked" ${usersStatus === "blocked" ? "selected" : ""}>Blocked</option>
                </select>
                <select id="userSort" class="admin-select" aria-label="Sort users">
                    <option value="newest" ${usersSort === "newest" ? "selected" : ""}>Newest</option>
                    <option value="lastLogin" ${usersSort === "lastLogin" ? "selected" : ""}>Last login</option>
                    <option value="name" ${usersSort === "name" ? "selected" : ""}>Name</option>
                    <option value="email" ${usersSort === "email" ? "selected" : ""}>Email</option>
                </select>
            </div></div>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>User / UID</th><th>Email</th><th>Phone</th><th>Registered</th><th>Last Login</th><th>Status</th><th>Actions</th></tr></thead><tbody>${userRows(payload.data || [])}</tbody></table></div>
            <div class="admin-pagination"><span>Page ${usersPagination.page} of ${Math.max(usersPagination.pages, 1)} · ${usersPagination.total} users</span><div class="admin-pagination-controls">
                <button class="admin-button secondary" data-action="users-page" data-page="${Math.max(1, usersPage - 1)}" ${usersPage <= 1 ? "disabled" : ""}>Previous</button>
                <button class="admin-button secondary" data-action="users-page" data-page="${Math.min(usersPagination.pages || 1, usersPage + 1)}" ${usersPage >= usersPagination.pages ? "disabled" : ""}>Next</button>
            </div></div>
        </section>`;
    if (restoreUserSearchFocus) {
        const input = document.getElementById("userSearch");
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        restoreUserSearchFocus = false;
    }
}

async function renderDonations(paymentView) {
    const payload = await apiRequest("/api/admin/donations");
    const donations = payload.data || [];
    const title = paymentView ? "Payment records" : "Donation management";
    const intro = paymentView
        ? "The current backend stores payment records as donations; transaction IDs, payment methods, and external gateway history are not persisted."
        : "Only fields stored in the donation database are shown. Verify marks a pending record as paid.";
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>${title}</h2><p>${escapeHtml(intro)}</p></div><button class="admin-button secondary" data-action="refresh">${icon("refresh")}Refresh</button></div>
        <section class="admin-panel">
            <div class="admin-panel-head"><h3>${paymentView ? "Recorded payments / donation intents" : "All donation records"} (${donations.length})</h3>
                <div class="admin-toolbar"><input id="donationSearch" class="admin-field" type="search" placeholder="Search donor, phone or user ID" aria-label="Search donation records"></div>
            </div>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Donor / User ID</th><th>Email</th><th>Phone</th><th>Amount</th><th>Payment Method</th><th>Transaction ID</th><th>Purpose</th><th>Date</th><th>Status / Actions</th></tr></thead><tbody id="donationRows">${donationRows(donations, paymentView)}</tbody></table></div>
        </section>`;
    const search = document.getElementById("donationSearch");
    search.addEventListener("input", () => {
        const value = search.value.trim().toLowerCase();
        const filtered = donations.filter((donation) =>
            [donation.name, donation.mobile, donation.userId, donation.purpose, donation.status]
                .some((field) => String(field || "").toLowerCase().includes(value))
        );
        document.getElementById("donationRows").innerHTML = donationRows(filtered, paymentView);
    });
}

function announcementRows(items) {
    if (!items.length) return `<div class="admin-empty">No announcements have been added.</div>`;
    return items.map((item) => `<article class="admin-announcement">
        <div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.message)}</p><span>${badge(item.isPublished === false ? "Draft" : "Published")}</span><span class="admin-subtext">${formatDate(item.createdAt)}</span></div>
        <div class="admin-actions">
            <button class="admin-button secondary" data-action="announcement-edit" data-id="${escapeHtml(item._id)}" data-title="${escapeHtml(item.title)}" data-message="${escapeHtml(item.message)}">${icon("edit")}Edit</button>
            <button class="admin-button secondary" data-action="announcement-toggle" data-id="${escapeHtml(item._id)}" data-published="${item.isPublished !== false}">${item.isPublished === false ? "Publish" : "Unpublish"}</button>
            <button class="admin-button danger" data-action="announcement-delete" data-id="${escapeHtml(item._id)}">${icon("trash")}Delete</button>
        </div>
    </article>`).join("");
}

async function renderAnnouncements() {
    const payload = await apiRequest("/api/admin/announcements");
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>Announcements</h2><p>Create, edit, publish or remove community announcements.</p></div></div>
        <section class="admin-panel">
            <form id="announcementForm" class="admin-announcement-form">
                <input id="announcementTitle" name="title" class="admin-field" maxlength="160" placeholder="Announcement title" required>
                <textarea id="announcementMessage" name="message" class="admin-textarea" maxlength="10000" placeholder="Write the announcement" required></textarea>
                <input id="announcementId" type="hidden">
                <div class="admin-toolbar"><button class="admin-button accent" type="submit">${icon("plus")}<span id="announcementSubmitText">Add announcement</span></button><button id="announcementCancel" class="admin-button secondary" type="button" hidden>Cancel edit</button></div>
            </form>
            <div id="announcementList">${announcementRows(payload.data || [])}</div>
        </section>`;
    document.getElementById("announcementForm").addEventListener("submit", submitAnnouncement);
    document.getElementById("announcementCancel").addEventListener("click", resetAnnouncementForm);
}

function safeImageUrl(value) {
    if (typeof value !== "string") return "";
    if (value.startsWith("/uploads/gallery/")) return value;
    try {
        const url = new URL(value, window.location.origin);
        return url.protocol === "https:" && url.hostname === "firebasestorage.googleapis.com" ? url.href : "";
    } catch {
        return "";
    }
}

async function renderGallery() {
    const payload = await apiRequest("/api/admin/gallery");
    const items = payload.data || [];
    const categories = [...new Set(items.map((item) => item.category || "General"))].sort();
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>Gallery moderation</h2><p>Review image submissions, organize categories and remove unwanted content.</p></div></div>
        <section class="admin-panel">
            <form id="galleryUploadForm" class="admin-announcement-form">
                <strong>Upload an image</strong>
                <div class="admin-toolbar"><input class="admin-field" type="file" name="image" accept="image/jpeg,image/png,image/webp" required><input class="admin-field" name="category" maxlength="80" placeholder="Category" value="General"><button class="admin-button accent" type="submit">${icon("plus")}Upload</button></div>
                <span class="admin-subtext">JPG, PNG or WebP, up to 5 MB. New submissions are pending review.</span>
            </form>
            <div class="admin-panel-body"><div class="admin-gallery-grid">
                ${items.length ? items.map((item) => {
                    const id = escapeHtml(item._id);
                    const imageUrl = safeImageUrl(item.filePath);
                    const categoryOptions = [...new Set(["General", item.category || "General", ...categories])];
                    return `<article class="admin-gallery-card">
                        ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.originalName || "Gallery image")}" loading="lazy">` : `<div class="admin-empty">Image preview unavailable</div>`}
                        <div class="admin-gallery-info">
                            <strong title="${escapeHtml(item.originalName)}">${escapeHtml(item.originalName || "Untitled image")}</strong>
                            <span>${badge(item.status)}</span><span class="admin-subtext">By ${escapeHtml(item.uploaderName || item.uploaderId || "Unknown")} · ${formatDate(item.createdAt)}</span>
                            <div class="admin-gallery-controls">
                                <select class="admin-select" data-action="gallery-category" data-id="${id}" aria-label="Image category">
                                    ${categoryOptions.map((category) => `<option value="${escapeHtml(category)}" ${category === (item.category || "General") ? "selected" : ""}>${escapeHtml(category)}</option>`).join("")}
                                </select>
                                <select class="admin-select" data-action="gallery-status" data-id="${id}" aria-label="Image moderation status">
                                    ${["pending","approved","rejected"].map((status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`).join("")}
                                </select>
                            </div>
                            <button class="admin-button danger" data-action="gallery-delete" data-id="${id}">${icon("trash")}Delete</button>
                        </div>
                    </article>`;
                }).join("") : `<div class="admin-empty">No gallery images found.</div>`}
            </div></div>
        </section>`;
    document.getElementById("galleryUploadForm").addEventListener("submit", uploadGalleryImage);
}

async function renderSettings() {
    let configMessage;
    let configContent;
    try {
        const payload = await apiRequest("/api/payments/upi-config");
        configContent = `<div class="admin-details-grid">
            <div class="admin-detail"><span>UPI ID</span><strong>${escapeHtml(payload.data.id || "Not configured")}</strong></div>
            <div class="admin-detail"><span>Payee name</span><strong>${escapeHtml(payload.data.name || "Not configured")}</strong></div>
        </div>`;
    } catch (error) {
        configMessage = error.message;
        configContent = `<div class="admin-settings-note">${escapeHtml(configMessage)}</div>`;
    }
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>Settings</h2><p>Configuration that is already available through the current backend.</p></div></div>
        <section class="admin-panel">
            <div class="admin-panel-head"><h3>Payment settings</h3></div>
            <div class="admin-panel-body">
                ${configContent}
                <p class="admin-settings-note" style="margin-bottom:0">These payment values are read from server environment configuration and are displayed read-only. No general settings or social/email settings API currently exists, so this dashboard does not create frontend-only settings.</p>
            </div>
        </section>`;
}

function renderProfile() {
    const admin = currentAdmin || {};
    content.innerHTML = `
        <div class="admin-page-heading"><div><h2>Admin profile</h2><p>Signed in through the existing Firebase authentication system.</p></div></div>
        <section class="admin-panel">
            <div class="admin-panel-head"><h3>Authorized account</h3>${badge("Authorized","success")}</div>
            <div class="admin-panel-body"><div class="admin-details-grid">
                <div class="admin-detail"><span>Name</span><strong>${escapeHtml(admin.name || currentUser.displayName || "—")}</strong></div>
                <div class="admin-detail"><span>Email</span><strong>${escapeHtml(admin.email || currentUser.email || "—")}</strong></div>
                <div class="admin-detail"><span>Firebase UID</span><strong>${escapeHtml(admin.uid || currentUser.uid)}</strong></div>
                <div class="admin-detail"><span>Authorization</span><strong>Verified by protected backend endpoint</strong></div>
            </div><div style="margin-top:16px"><button class="admin-button danger" data-action="logout">${icon("logout")}Logout</button></div></div>
        </section>`;
}

function renderDetails(user) {
    const profileFields = [
        ["Full name", user.displayName], ["Email", user.email], ["Phone", user.phoneNumber],
        ["Firebase UID", user.uid], ["Email verified", user.emailVerified ? "Yes" : "No"],
        ["Account status", user.disabled ? "Blocked" : "Active"], ["Registered", formatDate(user.creationTime)],
        ["Last login", formatDate(user.lastSignInTime)], ["Photo URL", user.photoURL]
    ];
    const donationHistory = user.donations || [];
    const bookings = user.bookings || [];
    const claims = JSON.stringify(user.customClaims || {}, null, 2);
    const providers = JSON.stringify(user.providerData || [], null, 2);
    dialogBody.innerHTML = `
        <section class="admin-dialog-section"><h3>Profile and account information</h3><div class="admin-details-grid">
            ${profileFields.map(([label, value]) => `<div class="admin-detail"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "—")}</strong></div>`).join("")}
        </div></section>
        <section class="admin-dialog-section"><h3>Donation history (${donationHistory.length})</h3>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Date</th><th>Amount</th><th>Purpose</th><th>Status</th><th>Phone</th></tr></thead><tbody>
                ${donationHistory.length ? donationHistory.map((entry) => `<tr><td>${formatDate(entry.createdAt)}</td><td>${formatMoney(entry.amount)}</td><td>${escapeHtml(entry.purpose || "—")}</td><td>${badge(entry.status)}</td><td>${escapeHtml(entry.mobile || "—")}</td></tr>`).join("") : `<tr><td colspan="5" class="admin-empty">No donations found.</td></tr>`}
            </tbody></table></div>
        </section>
        <section class="admin-dialog-section"><h3>Booking history (${bookings.length})</h3>
            <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Record</th><th>Date</th><th>Details</th></tr></thead><tbody>
                ${bookings.length ? bookings.map((entry) => `<tr><td>${escapeHtml(entry._id)}</td><td>${formatDate(entry.createdAt)}</td><td>${escapeHtml(Object.entries(entry).filter(([key]) => !["_id","__v","userId","createdAt","updatedAt"].includes(key)).map(([key,value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : value}`).join(" · "))}</td></tr>`).join("") : `<tr><td colspan="3" class="admin-empty">No bookings found.</td></tr>`}
            </tbody></table></div>
        </section>
        <section class="admin-dialog-section"><h3>Authentication providers and custom claims</h3><div class="admin-details-grid">
            <div class="admin-detail"><span>Provider data</span><strong><pre style="white-space:pre-wrap;margin:0;font:inherit">${escapeHtml(providers)}</pre></strong></div>
            <div class="admin-detail"><span>Custom claims</span><strong><pre style="white-space:pre-wrap;margin:0;font:inherit">${escapeHtml(claims)}</pre></strong></div>
        </div></section>
        <div class="admin-toolbar"><button class="admin-button" data-action="user-edit" data-id="${escapeHtml(user.uid)}">${icon("edit")}Edit user</button><button class="admin-button ${user.disabled ? "accent" : "danger"}" data-action="user-toggle" data-id="${escapeHtml(user.uid)}" data-disabled="${!user.disabled}">${user.disabled ? "Unblock" : "Block"} account</button></div>`;
    dialog.showModal();
}

async function showUserDetails(uid) {
    const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(uid)}`);
    renderDetails(payload.data);
}

async function editUser(uid) {
    const payload = await apiRequest(`/api/admin/users/${encodeURIComponent(uid)}`);
    const user = payload.data;
    dialogBody.innerHTML = `
        <form id="userEditForm" class="admin-edit-form">
            <label>Display name<input class="admin-field" name="displayName" maxlength="120" required value="${escapeHtml(user.displayName)}"></label>
            <label>Email<input class="admin-field" name="email" type="email" required value="${escapeHtml(user.email)}"></label>
            <label>Phone<input class="admin-field" name="phoneNumber" type="tel" value="${escapeHtml(user.phoneNumber)}"></label>
            <div class="admin-toolbar" style="align-self:end"><button class="admin-button accent" type="submit">${icon("check")}Save user</button><button class="admin-button secondary" type="button" data-close-dialog>Cancel</button></div>
        </form>
        <p class="admin-settings-note">Firebase permits editing these profile fields. Passwords, provider credentials, and admin authorization are not exposed here.</p>`;
    if (!dialog.open) dialog.showModal();
    document.getElementById("userEditForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const updates = Object.fromEntries(
            [...form.entries()].filter(([key, value]) => key !== "phoneNumber" || String(value).trim())
        );
        try {
            await apiRequest(`/api/admin/users/${encodeURIComponent(uid)}`, {
                method: "PATCH",
                body: JSON.stringify(updates)
            });
            dialog.close();
            showToast("User profile updated.");
            if (currentView === "users") await loadView("users");
            else await loadView(currentView);
        } catch (error) {
            showToast(error.message, true);
        }
    });
}

async function submitAnnouncement(event) {
    event.preventDefault();
    const id = document.getElementById("announcementId").value;
    const body = JSON.stringify({
        title: document.getElementById("announcementTitle").value,
        message: document.getElementById("announcementMessage").value
    });
    try {
        await apiRequest(id ? `/api/${encodeURIComponent(id)}` : "/api", {
            method: id ? "PATCH" : "POST",
            body
        });
        showToast(id ? "Announcement updated." : "Announcement added.");
        await loadView("announcements");
    } catch (error) {
        showToast(error.message, true);
    }
}

function resetAnnouncementForm() {
    document.getElementById("announcementForm").reset();
    document.getElementById("announcementId").value = "";
    document.getElementById("announcementSubmitText").textContent = "Add announcement";
    document.getElementById("announcementCancel").hidden = true;
}

async function uploadGalleryImage(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
        await apiRequest("/api/gallery", { method: "POST", body: form });
        showToast("Image uploaded and is pending review.");
        await loadView("gallery");
    } catch (error) {
        showToast(error.message, true);
    }
}

async function handleAction(button) {
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === "refresh") return loadView();
    if (action === "users-page") {
        usersPage = Number(button.dataset.page) || 1;
        return loadView("users");
    }
    if (action === "user-view") {
        try { await showUserDetails(id); } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "user-edit") {
        try { await editUser(id); } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "user-toggle") {
        const disabled = button.dataset.disabled === "true";
        if (!window.confirm(`${disabled ? "Block" : "Unblock"} this account?`)) return;
        try {
            await apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify({ disabled })
            });
            showToast(disabled ? "Account blocked; refresh tokens revoked." : "Account unblocked.");
            await loadView(currentView);
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "user-delete") {
        if (!window.confirm("Permanently delete this Firebase account? Existing donation and booking records will be retained.")) return;
        try {
            await apiRequest(`/api/admin/users/${encodeURIComponent(id)}`, { method: "DELETE" });
            showToast("Firebase account deleted. Existing records were retained.");
            await loadView("users");
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "donation-status" || action === "donation-delete") {
        if (action === "donation-delete" && !window.confirm("Permanently delete this donation record?")) return;
        try {
            await apiRequest(`/api/admin/donations/${encodeURIComponent(id)}`, action === "donation-status"
                ? { method: "PATCH", body: JSON.stringify({ status: button.dataset.status }) }
                : { method: "DELETE" });
            showToast(action === "donation-status" ? "Donation status updated." : "Donation deleted.");
            await loadView(currentView);
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "announcement-edit") {
        document.getElementById("announcementId").value = id;
        document.getElementById("announcementTitle").value = button.dataset.title || "";
        document.getElementById("announcementMessage").value = button.dataset.message || "";
        document.getElementById("announcementSubmitText").textContent = "Save changes";
        document.getElementById("announcementCancel").hidden = false;
        document.getElementById("announcementTitle").focus();
        return;
    }
    if (action === "announcement-toggle") {
        try {
            await apiRequest(`/api/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify({ isPublished: button.dataset.published !== "true" })
            });
            showToast("Announcement visibility updated.");
            await loadView("announcements");
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "announcement-delete") {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await apiRequest(`/api/${encodeURIComponent(id)}`, { method: "DELETE" });
            showToast("Announcement deleted.");
            await loadView("announcements");
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "gallery-delete") {
        if (!window.confirm("Delete this gallery image and its stored file?")) return;
        try {
            await apiRequest(`/api/admin/gallery/${encodeURIComponent(id)}`, { method: "DELETE" });
            showToast("Gallery image deleted.");
            await loadView("gallery");
        } catch (error) { showToast(error.message, true); }
        return;
    }
    if (action === "logout") await logout();
}

async function handleGallerySelect(select) {
    const field = select.dataset.action === "gallery-status" ? "status" : "category";
    try {
        await apiRequest(`/api/admin/gallery/${encodeURIComponent(select.dataset.id)}`, {
            method: "PATCH",
            body: JSON.stringify({ [field]: select.value })
        });
        showToast(field === "status" ? "Gallery moderation status updated." : "Gallery category updated.");
        await loadView("gallery");
    } catch (error) {
        showToast(error.message, true);
        await loadView("gallery");
    }
}

async function logout() {
    await signOut(auth);
    window.location.replace("user-login.html");
}

function openMobileMenu() {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "true");
}

function closeMobileMenu() {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "false");
}

document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => loadView(button.dataset.view));
});

document.getElementById("mobileMenuButton").addEventListener("click", () => {
    if (sidebar.classList.contains("open")) closeMobileMenu();
    else openMobileMenu();
});
overlay.addEventListener("click", closeMobileMenu);
document.getElementById("sidebarLogout").addEventListener("click", logout);

content.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.dataset.navigate) {
        loadView(button.dataset.navigate);
        return;
    }
    handleAction(button);
});

content.addEventListener("change", (event) => {
    const target = event.target;
    if (target.matches("#userStatus")) {
        usersStatus = target.value;
        usersPage = 1;
        loadView("users");
    } else if (target.matches("#userSort")) {
        usersSort = target.value;
        usersPage = 1;
        loadView("users");
    } else if (target.matches("[data-action='gallery-status'], [data-action='gallery-category']")) {
        handleGallerySelect(target);
    }
});

content.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.matches("#userSearch")) return;
    usersSearch = target.value;
    usersPage = 1;
    clearTimeout(userSearchTimer);
    userSearchTimer = setTimeout(() => {
        restoreUserSearchFocus = true;
        loadView("users");
    }, 250);
});

document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-dialog]")) dialog.close();
    const actionButton = event.target.closest("dialog [data-action]");
    if (actionButton) handleAction(actionButton);
});

dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
});

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("user-login.html");
        return;
    }
    currentUser = user;
    try {
        const payload = await apiRequest("/api/admin/profile");
        currentAdmin = payload.admin || {};
        const label = currentAdmin.name || currentAdmin.email || user.email || "Administrator";
        document.getElementById("sidebarAdminName").textContent = label;
        document.getElementById("topbarAdminEmail").textContent = currentAdmin.email || user.email || "Administrator";
        document.getElementById("adminAvatar").textContent = (label.trim()[0] || "A").toUpperCase();
        await loadView("overview");
    } catch (error) {
        if (!window.location.pathname.endsWith("user-dashboard.html") && !window.location.pathname.endsWith("user-login.html")) {
            content.innerHTML = `<div class="admin-panel"><div class="admin-error">${escapeHtml(error.message || "Unable to verify administrator access.")}</div><div class="admin-panel-body"><a class="admin-button secondary" href="user-login.html">Return to Sign In</a></div></div>`;
        }
    }
});
