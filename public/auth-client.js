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
    const authStatus = document.getElementById("authStatus");
    if (authLink) {
        authLink.textContent = user ? "Logout" : "Sign In";
        authLink.href = user ? "#" : "user-login.html";
        if (user) authLink.onclick = async event => { event.preventDefault(); await signOut(auth); window.location.reload(); };
    }
    if (authStatus) authStatus.textContent = user ? `${user.displayName || user.email} logged in` : "Guest user";
});

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
