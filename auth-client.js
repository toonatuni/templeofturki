import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

let resolveAuth;
window.templeAuthReady = new Promise(resolve => { resolveAuth = resolve; });

onAuthStateChanged(auth, user => {
    window.templeCurrentUser = user;
    resolveAuth(user);
    const authLink = document.getElementById("authLink");
    const authStatus = document.getElementById("authStatus");
    if (authLink) {
        authLink.textContent = user ? "Logout" : "User Login";
        authLink.href = user ? "#" : "user-login.html";
        if (user) authLink.onclick = async event => { event.preventDefault(); await signOut(auth); window.location.reload(); };
    }
    if (authStatus) authStatus.textContent = user ? `${user.displayName || user.email} logged in` : "Guest user";
});

window.templeApiFetch = async function (url, options = {}) {
    const user = await window.templeAuthReady;
    if (!user) throw new Error("Please login first");
    const token = await user.getIdToken();
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
};
