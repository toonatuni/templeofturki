import { auth } from "./firebase.js";
import { apiUrl } from "./api-url.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const userEmail =
    document.getElementById("userEmail");

const logoutButton =
    document.getElementById("logoutButton");

const donationHistoryStatus =
    document.getElementById("donationHistoryStatus");

const donationHistory =
    document.getElementById("donationHistory");

function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function renderDonationHistory(donations) {
    donationHistory.replaceChildren();
    if (!donations.length) {
        donationHistoryStatus.textContent = "You have no donation records yet.";
        return;
    }

    donationHistoryStatus.textContent = "";
    for (const donation of donations) {
        const entry = document.createElement("article");
        entry.className = "donation-history-entry";

        const details = document.createElement("div");
        const amount = document.createElement("strong");
        amount.textContent = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(donation.amount));
        const description = document.createElement("p");
        description.textContent = `${donation.purpose || "TOT Donation"} · ${formatDate(donation.createdAt)}`;
        details.append(amount, description);

        const status = document.createElement("span");
        const donationStatus = ["pending", "paid", "failed"].includes(donation.status)
            ? donation.status
            : "unknown";
        status.className = `donation-history-status status-${donationStatus}`;
        status.textContent = donationStatus;
        entry.append(details, status);
        donationHistory.append(entry);
    }
}

async function loadDonationHistory(user) {
    donationHistoryStatus.textContent = "Loading donation history...";
    try {
        const request = async (forceRefresh) => {
            const token = await user.getIdToken(forceRefresh);
            return fetch(apiUrl("/api/my-donations"), {
                headers: { Authorization: `Bearer ${token}` }
            });
        };

        let response = await request(false);
        if (response.status === 401) {
            response = await request(true);
        }
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error("Your session expired. Please sign in again.");
            }
            throw new Error(`Donation history could not be loaded (HTTP ${response.status}).`);
        }

        const payload = await response.json();
        if (!payload.success || !Array.isArray(payload.data)) {
            throw new Error("The server returned an invalid donation history response.");
        }
        renderDonationHistory(payload.data);
    } catch (error) {
        console.error("Donation history load failed:", error);
        donationHistoryStatus.textContent = error.message || "Donation history could not be loaded.";
    }
}


// ==============================
// CHECK LOGIN
// ==============================

onAuthStateChanged(auth, (user) => {

    if (user) {

        userEmail.textContent =
            user.displayName ||
            (user.email ? user.email.split("@")[0] : "Signed-in user");
        loadDonationHistory(user);

    } else {

        // User logged out
        window.location.replace(
            "user-login.html"
        );
    }

});


// ==============================
// LOGOUT
// ==============================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "user-login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);