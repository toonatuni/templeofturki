import { auth } from "./firebase.js";

window.templeApiFetch = async function (url, options = {}) {

    const user = auth.currentUser;

    if (!user) {
        throw new Error("User login required. Please login first.");
    }

    const token = await user.getIdToken(true);

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);

    if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(url, {
        ...options,
        headers
    });
};