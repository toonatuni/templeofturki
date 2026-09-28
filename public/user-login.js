import { auth } from "./firebase.js";


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


                await signInWithEmailAndPassword(

                    auth,

                    email,

                    password

                );


                authMessage.textContent =
                    "Login successful. Redirecting...";


                setTimeout(
                    function () {

                        window.location.href =
                            "index.html";

                    },
                    500
                );


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


                await createUserWithEmailAndPassword(

                    auth,

                    email,

                    password

                );


                authMessage.textContent =
                    "Account created successfully. Redirecting...";


                setTimeout(
                    function () {

                        window.location.href =
                            "index.html";

                    },
                    700
                );


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


            await signInWithPopup(

                auth,

                provider

            );


            authMessage.textContent =
                "Google login successful. Redirecting...";


            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                500
            );


        }

        catch (
            error
        ) {


            console.error(
                "Google Login Error:",
                error
            );


            /* POPUP BLOCKED */

            if (
                error.code ===
                "auth/popup-blocked"
            ) {


                authMessage.textContent =
                    "Popup was blocked. Opening Google login page...";


                try {


                    await signInWithRedirect(

                        auth,

                        provider

                    );


                    return;


                }

                catch (
                    redirectError
                ) {


                    console.error(
                        "Google Redirect Error:",
                        redirectError
                    );


                    authMessage.textContent =
                        getFirebaseErrorMessage(
                            redirectError
                        );

                }

            }


            else {


                authMessage.textContent =
                    getFirebaseErrorMessage(
                        error
                    );

            }


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


        authMessage.textContent =
            "Google login successful. Redirecting...";


        setTimeout(
            function () {

                window.location.href =
                    "index.html";

            },
            500
        );

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
                "This website domain is not authorized in Firebase.";



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