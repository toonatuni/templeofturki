import { auth } from "./firebase.js";
import { apiUrl } from "./api-url.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==========================================
// AUTH READY
// ==========================================

window.templeAuthReady = new Promise((resolve) => {

    onAuthStateChanged(auth, (user) => {

        resolve(user);

    });

});


// ==========================================
// TEMPLE API FETCH
// ==========================================

window.templeApiFetch = async function (url, options = {}) {

    const user = await window.templeAuthReady;

    if (!user) {
        throw new Error("User login required");
    }

    try {

        const token = await user.getIdToken(true);

        const headers = new Headers(
            options.headers || {}
        );

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );

        if (
            options.body &&
            !headers.has("Content-Type")
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }

        return fetch(apiUrl(url), {
            ...options,
            headers: headers
        });

    } catch (error) {

        console.error(
            "templeApiFetch Error:",
            error
        );

        throw error;
    }
};