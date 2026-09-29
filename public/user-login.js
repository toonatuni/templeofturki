import { auth } from "./firebase.js";
import { apiUrl, isLocalPreview } from "./api-url.js";


import {

    signInWithEmailAndPassword,

    createUserWithEmailAndPassword,

    GoogleAuthProvider,

    signInWithPopup,

    signInWithRedirect,

    getRedirectResult

}

from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



/* =========================================
   ELEMENTS
========================================= */

const authTitle =
    document.getElementById(
        "authTitle"
    );


const authDescription =
    document.getElementById(
        "authDescription"
    );


const signInTab =
    document.getElementById(
        "signInTab"
    );


const signUpTab =
    document.getElementById(
        "signUpTab"
    );


const authForm =
    document.getElementById(
        "authForm"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const passwordInput =
    document.getElementById(
        "password"
    );


const submitButton =
    document.getElementById(
        "submitButton"
    );


const googleLoginButton =
    document.getElementById(
        "googleLoginButton"
    );


const authMessage =
    document.getElementById(
        "authMessage"
    );


const closeButton =
    document.getElementById(
        "closeButton"
    );



/* =========================================
   CURRENT MODE
========================================= */

let currentMode =
    "signin";



/* =========================================
   GOOGLE PROVIDER
========================================= */

const provider =
    new GoogleAuthProvider();


async function redirectAfterAuthentication(
    user
) {
    authMessage.textContent =
        "Checking account access...";

    const token = await user.getIdToken(true);
    const profileUrl = apiUrl("/api/admin/profile");
    const response = await fetch(profileUrl, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (response.status === 403) {
        window.location.href = "user-dashboard.html";
        return;
    }

    if (response.status === 401) {
        throw new Error(
            "Your login could not be verified by the server. Please sign in again."
        );
    }

    if (response.status === 404) {
        const contentType = response.headers.get("content-type") || "unknown content type";
        throw new Error(
            `Account verification GET ${new URL(profileUrl).pathname} returned HTTP 404 ` +
            `(${contentType}). Open the app through Express (npm start) or its deployed URL.`
        );
    }

    if (!response.ok) {
        throw new Error(
            `Could not verify account access (HTTP ${response.status}). Please try again.`
        );
    }

    window.location.href = "admin-dashboard.html";
}

async function signInWithGoogle() {
    if (isLocalPreview) {
        authMessage.textContent =
            "Redirecting to Google sign-in...";
        await signInWithRedirect(auth, provider);
        return;
    }

    try {
        const result = await signInWithPopup(auth, provider);
        await redirectAfterAuthentication(result.user);
    } catch (error) {
        const canUseRedirect = [
            "auth/popup-blocked",
            "auth/operation-not-supported-in-this-environment",
            "auth/web-storage-unsupported"
        ].includes(error.code) ||
            (isLocalPreview && error.code === "auth/popup-closed-by-user");

        if (!canUseRedirect) {
            throw error;
        }

        authMessage.textContent =
            "Popup sign-in is unavailable here. Redirecting to Google...";
        await signInWithRedirect(auth, provider);
    }
}


/* =========================================
   CHANGE MODE
========================================= */

function setAuthMode(
    mode
) {

    currentMode =
        mode;


    authMessage.textContent =
        "";


    if (
        mode === "signin"
    ) {


        signInTab.classList.add(
            "active"
        );


        signUpTab.classList.remove(
            "active"
        );


        authTitle.textContent =
            "Welcome Back.";


        authDescription.textContent =
            "Sign in to your account to continue and manage your temple activities.";


        submitButton.textContent =
            "Sign In";


        passwordInput.autocomplete =
            "current-password";


    }

    else {


        signUpTab.classList.add(
            "active"
        );


        signInTab.classList.remove(
            "active"
        );


        authTitle.textContent =
            "Join Us.";


        authDescription.textContent =
            "Create an account to save your information and access temple services.";


        submitButton.textContent =
            "Create Account";


        passwordInput.autocomplete =
            "new-password";

    }

}



/* =========================================
   SIGN IN TAB
========================================= */

signInTab.addEventListener(
    "click",
    function () {

        setAuthMode(
            "signin"
        );

    }
);



/* =========================================
   SIGN UP TAB
========================================= */

signUpTab.addEventListener(
    "click",
    function () {

        setAuthMode(
            "signup"
        );

    }
);



/* =========================================
   EMAIL FORM SUBMIT
========================================= */

authForm.addEventListener(
    "submit",

    async function (
        event
    ) {


        event.preventDefault();


        const email =
            emailInput.value.trim();


        const password =
            passwordInput.value;



        /* VALIDATION */

        if (
            !email
        ) {


            authMessage.textContent =
                "Please enter your email address.";


            return;

        }



        if (
            !password
        ) {


            authMessage.textContent =
                "Please enter your password.";


            return;

        }



        if (
            password.length < 6
        ) {


            authMessage.textContent =
                "Password must contain at least 6 characters.";


            return;

        }



        /* DISABLE BUTTON */

        submitButton.disabled =
            true;



        if (
            currentMode === "signin"
        ) {


            authMessage.textContent =
                "Signing in...";


            try {


                const result = await signInWithEmailAndPassword(

                    auth,

                    email,

                    password

                );


                await redirectAfterAuthentication(result.user);


            }

            catch (
                error
            ) {


                console.error(
                    "Email Login Error:",
                    error
                );


                authMessage.textContent =
                    getFirebaseErrorMessage(
                        error
                    );


                submitButton.disabled =
                    false;

            }

        }


        else {


            authMessage.textContent =
                "Creating your account...";


            try {


                const result = await createUserWithEmailAndPassword(

                    auth,

                    email,

                    password

                );


                await redirectAfterAuthentication(result.user);


            }

            catch (
                error
            ) {


                console.error(
                    "Sign Up Error:",
                    error
                );


                authMessage.textContent =
                    getFirebaseErrorMessage(
                        error
                    );


                submitButton.disabled =
                    false;

            }

        }

    }
);



/* =========================================
   GOOGLE LOGIN
========================================= */

googleLoginButton.addEventListener(

    "click",

    async function () {


        authMessage.textContent =
            "Opening Google login...";


        googleLoginButton.disabled =
            true;


        try {


            await signInWithGoogle();


        }

        catch (
            error
        ) {


            console.error(
                "Google Login Error:",
                error
            );


            authMessage.textContent = getFirebaseErrorMessage(error);


            googleLoginButton.disabled =
                false;

        }

    }

);



/* =========================================
   HANDLE GOOGLE REDIRECT RESULT
========================================= */

try {


    const result =
        await getRedirectResult(
            auth
        );


    if (
        result
    ) {


        await redirectAfterAuthentication(result.user);

    }

}

catch (
    error
) {


    console.error(
        "Google Redirect Result Error:",
        error
    );


    authMessage.textContent =
        getFirebaseErrorMessage(
            error
        );

}



/* =========================================
   CLOSE BUTTON
========================================= */

if (
    closeButton
) {


    closeButton.addEventListener(

        "click",

        function () {


            window.location.href =
                "index.html";

        }

    );

}



/* =========================================
   FIREBASE ERROR MESSAGES
========================================= */

function getFirebaseErrorMessage(
    error
) {


    switch (
        error.code
    ) {


        case "auth/invalid-credential":

            return
                "Invalid email or password.";



        case "auth/user-not-found":

            return
                "User account not found.";



        case "auth/wrong-password":

            return
                "Incorrect password.";



        case "auth/email-already-in-use":

            return
                "This email is already registered. Please Sign In.";



        case "auth/invalid-email":

            return
                "Please enter a valid email address.";



        case "auth/weak-password":

            return
                "Password must contain at least 6 characters.";



        case "auth/too-many-requests":

            return
                "Too many attempts. Please try again later.";



        case "auth/popup-closed-by-user":

            return
                "Google login was cancelled.";



        case "auth/cancelled-popup-request":

            return
                "Google login request was cancelled.";



        case "auth/popup-blocked":

            return
                "Google login popup was blocked.";



        case "auth/unauthorized-domain":

            return
                `This website (${window.location.hostname}) is not authorized for Firebase sign-in. Add this host under Firebase Console > Authentication > Settings > Authorized domains.`;

        case "auth/operation-not-allowed":

            return
                "Google sign-in is not enabled for this Firebase project. Enable the Google provider in Firebase Console > Authentication > Sign-in method.";

        case "auth/operation-not-supported-in-this-environment":

            return
                "This browser does not support Google popup sign-in. Use a regular browser window and try again.";



        case "auth/network-request-failed":

            return
                "Network error. Please check your internet connection.";



        default:

            return (

                error.message ||

                "Something went wrong. Please try again."

            );

    }

}