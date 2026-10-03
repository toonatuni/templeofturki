import { auth } from "./firebase.js";
import { apiUrl } from "./api-url.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

let resolveAuth;
window.templeAuthReady = new Promise(resolve => { resolveAuth = resolve; });

onAuthStateChanged(auth, user => {
    window.templeCurrentUser = user;
    resolveAuth(user);
    window.dispatchEvent(new Event("temple-auth-ready"));
    const authLink = document.getElementById("authLink");
    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutButton = document.getElementById("profileLogout");
    const authStatus = document.getElementById("authStatus");
    if (authLink) {
        authLink.hidden = Boolean(user && profileButton);
        if (!user || !profileButton) {
            authLink.textContent = user ? "User Account" : "Sign In";
            authLink.href = user ? "user-dashboard.html" : "user-login.html";
        }
    }
    if (profileButton) {
        profileButton.hidden = !user;
        profileButton.textContent = user ? getUserInitials(user) : "";
        profileButton.setAttribute("aria-label", user ? `${getUserLabel(user)} profile menu` : "User profile menu");
        profileButton.setAttribute("aria-expanded", "false");
        if (profileDropdown) profileDropdown.hidden = true;
    }
    if (authStatus) authStatus.textContent = user ? `${user.displayName || user.email} logged in` : "Guest user";
});

function getUserLabel(user) {
    if (user.displayName?.trim()) return user.displayName.trim();
    return user.email?.split("@")[0] || "User";
}

function getUserInitials(user) {
    const label = getUserLabel(user);
    const words = label.trim().split(/[\s._-]+/).filter(Boolean);
    if (words.length > 1) {
        return `${Array.from(words[0])[0]}${Array.from(words[1])[0]}`.toLocaleUpperCase();
    }
    return Array.from(words[0] || "U").slice(0, 2).join("").toLocaleUpperCase();
}

const profileButton = document.getElementById("profileButton");
const profileDropdown = document.getElementById("profileDropdown");
const profileMenu = document.getElementById("profileMenu");
const profileLogout = document.getElementById("profileLogout");

if (profileButton && profileDropdown && profileMenu) {
    profileButton.addEventListener("click", () => {
        const open = profileDropdown.hidden;
        profileDropdown.hidden = !open;
        profileButton.setAttribute("aria-expanded", String(open));
    });

    document.addEventListener("click", (event) => {
        if (!profileMenu.contains(event.target)) {
            profileDropdown.hidden = true;
            profileButton.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            profileDropdown.hidden = true;
            profileButton.setAttribute("aria-expanded", "false");
        }
    });
}

if (profileLogout) {
    profileLogout.addEventListener("click", async () => {
        profileLogout.disabled = true;
        try {
            await signOut(auth);
            if (profileDropdown) profileDropdown.hidden = true;
        } catch (error) {
            console.error("Firebase logout failed:", error);
            const errorMessage = document.getElementById("profileMenuMessage");
            if (errorMessage) errorMessage.textContent = "Could not log out. Please try again.";
        } finally {
            profileLogout.disabled = false;
        }
    });
}

window.templeApiFetch = async function (url, options = {}) {
    const user = await window.templeAuthReady;
    if (!user) throw new Error("Please login first");

    const request = async function (forceRefresh) {
        const token = await user.getIdToken(forceRefresh);
        const headers = new Headers(options.headers || {});
        headers.set("Authorization", `Bearer ${token}`);

        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        return fetch(apiUrl(url), { ...options, headers });
    };

    const response = await request(false);
    if (response.status !== 401) {
        return response;
    }

    return request(true);
};

window.templePublicApiFetch = async function (url, options = {}) {
    const user = await window.templeAuthReady;
    const request = async function (forceRefresh) {
        const headers = new Headers(options.headers || {});
        if (user) {
            const token = await user.getIdToken(forceRefresh);
            headers.set("Authorization", `Bearer ${token}`);
        } else {
            headers.delete("Authorization");
        }
        if (options.body && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        return fetch(apiUrl(url), { ...options, headers });
    };

    const response = await request(false);
    return response.status === 401 && user ? request(true) : response;
};
