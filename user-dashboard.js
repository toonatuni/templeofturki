import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const userEmail =
    document.getElementById("userEmail");

const logoutButton =
    document.getElementById("logoutButton");


// ==============================
// CHECK LOGIN
// ==============================

onAuthStateChanged(auth, (user) => {

    if (user) {

        userEmail.textContent =
            user.email;

    } else {

        // User logged out
        window.location.href =
            "user-login.html";
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