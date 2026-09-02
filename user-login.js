import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================================
// ELEMENTS
// =====================================================

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginButton =
    document.getElementById("loginButton");

const googleLoginButton =
    document.getElementById("googleLoginButton");

const loginMessage =
    document.getElementById("loginMessage");

if (!loginButton || !googleLoginButton || !loginMessage) {
    console.log("User login UI not present on this page.");
} else {

    // =====================================================
    // EMAIL + PASSWORD LOGIN
    // =====================================================

    loginButton.addEventListener(
        "click",
        async function () {

            const email =
                emailInput.value.trim();

            const password =
                passwordInput.value;


            if (!email || !password) {

                loginMessage.textContent =
                    "Please enter email and password.";

                return;
            }


            loginMessage.textContent =
                "Logging in...";


            loginButton.disabled = true;


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


                loginMessage.textContent =
                    "Login Successful!";


                // User login ke baad HOME PAGE
                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Email Login Error:",
                    error
                );


                loginMessage.textContent =
                    getFirebaseErrorMessage(error);


                loginButton.disabled = false;

            }

        }
    );


    // =====================================================
    // GOOGLE LOGIN
    // =====================================================

    const provider =
        new GoogleAuthProvider();


    googleLoginButton.addEventListener(
        "click",
        async function () {

            loginMessage.textContent =
                "Opening Google Login...";


            googleLoginButton.disabled = true;


            try {

                await signInWithPopup(
                    auth,
                    provider
                );


                loginMessage.textContent =
                    "Google Login Successful!";


                // Google login ke baad HOME PAGE
                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Google Login Error:",
                    error
                );


                loginMessage.textContent =
                    getFirebaseErrorMessage(error);


                googleLoginButton.disabled = false;

            }

        }
    );
}


// =====================================================
// FIREBASE ERROR MESSAGE
// =====================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-credential":
            return "Invalid email or password.";

        case "auth/user-not-found":
            return "User account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/invalid-email":
            return "Please enter a valid email.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        case "auth/popup-closed-by-user":
            return "Google login was cancelled.";

        case "auth/popup-blocked":
            return "Please allow popups for Google Login.";

        case "auth/unauthorized-domain":
            return "This website domain is not authorized in Firebase.";

        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";

        default:
            return error.message ||
                "Login failed. Please try again.";

    }

}