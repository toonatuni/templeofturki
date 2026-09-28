import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyDOKnaI0diI7ERgZD_RHmyYG8-TzPHPdH0",
    authDomain: "temple-donation-6d0b1.firebaseapp.com",
    projectId: "temple-donation-6d0b1",
    storageBucket: "temple-donation-6d0b1.firebasestorage.app",
    messagingSenderId: "992943768886",
    appId: "1:992943768886:web:d4a9d1c762d87717949f97",
    measurementId: "G-R91S72X7YZ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };