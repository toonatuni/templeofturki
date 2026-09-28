/* =====================================================
   TEMPLE OF TURKI
   MAIN FRONTEND SCRIPT
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const mainNav =
    document.getElementById("mainNav");

if (mobileMenuButton && mainNav) {

    mobileMenuButton.addEventListener(
        "click",
        function () {

            mainNav.classList.toggle(
                "mobile-menu-open"
            );

        }
    );

}


const navLinks =
    document.querySelectorAll(".nav-links a");

navLinks.forEach(function (link) {

    link.addEventListener(
        "click",
        function () {

            if (mainNav) {

                mainNav.classList.remove(
                    "mobile-menu-open"
                );

            }

        }
    );

});


/* =====================================================
   LANGUAGE
   DEFAULT = ENGLISH
===================================================== */

const translations = {

    en: {

        navHome: "Home",
        navAbout: "About",
        navEvents: "Events",
        navGallery: "Gallery",
        navNotice: "Notice",
        navDonate: "Donate",
        navContact: "Contact",
        navAdmin: "Admin Login",

        heroBadge:
            "Sacred Heritage • Vaishali, Bihar",

        title:
            "A spiritual home for devotion, service and peace.",

        welcome:
            "Welcome to the official Temple of Turki website. Discover our traditions, celebrations, community service and ways to support the temple.",

        donateBtn:
            "Donate Now",

        exploreEventsBtn:
            "Explore Events",

        heroHighlight1:
            "Daily Aarti",

        heroHighlight2:
            "Festival Celebrations",

        heroHighlight3:
            "Community Seva",

        aboutTag:
            "About The Temple",

        aboutHeading:
            "Serving faith, culture and community with devotion.",

        aboutText:
            "Temple of Turki is a place where devotees come together for prayer, worship, festivals and community service. The temple preserves spiritual traditions while bringing people together through seva and celebration.",

        noticeTag:
            "Temple Notice",

        noticeHeading:
            "Latest Information & Announcements",

        galleryTag:
            "Temple Gallery",

        galleryHeading:
            "Moments of Faith and Serenity",

        upcomingEventsTag:
            "Upcoming Events",

        upcomingEventsHeading:
            "Join Our Temple Celebrations",

        supportTag:
            "Support The Temple",

        donationHeading:
            "Your donation helps preserve faith, culture and service.",

        donationText:
            "Your contribution supports temple maintenance, daily worship, festival preparation, community service and other sacred initiatives.",

        donationFormTitle:
            "Make a Donation",

        visitTag:
            "Visit Us",

        visitHeading:
            "Plan Your Temple Visit",

        whatsappBtn:
            "WhatsApp Us",

        callBtn:
            "Call Now",

        eventCalendarBtn:
            "View Full Calendar"

    },


    hi: {

        navHome:
            "होम",

        navAbout:
            "हमारे बारे में",

        navEvents:
            "कार्यक्रम",

        navGallery:
            "गैलरी",

        navNotice:
            "सूचना",

        navDonate:
            "दान करें",

        navContact:
            "संपर्क",

        navAdmin:
            "एडमिन लॉगिन",

        heroBadge:
            "पवित्र विरासत • वैशाली, बिहार",

        title:
            "भक्ति, सेवा और शांति का पवित्र घर।",

        welcome:
            "टेंपल ऑफ तुर्की की आधिकारिक वेबसाइट पर आपका स्वागत है। यहां मंदिर की परंपराओं, उत्सवों, सामुदायिक सेवा और दान से जुड़ी जानकारी प्राप्त करें।",

        donateBtn:
            "दान करें",

        exploreEventsBtn:
            "कार्यक्रम देखें",

        heroHighlight1:
            "दैनिक आरती",

        heroHighlight2:
            "उत्सव",

        heroHighlight3:
            "सामुदायिक सेवा",

        aboutTag:
            "मंदिर के बारे में",

        aboutHeading:
            "आस्था, संस्कृति और समुदाय की सेवा में समर्पित।",

        aboutText:
            "टेंपल ऑफ तुर्की एक ऐसा पवित्र स्थान है जहां श्रद्धालु पूजा, आरती, त्योहार और सामुदायिक सेवा के लिए एकत्र होते हैं।",

        noticeTag:
            "मंदिर सूचना",

        noticeHeading:
            "नवीनतम सूचना और घोषणाएं",

        galleryTag:
            "मंदिर गैलरी",

        galleryHeading:
            "भक्ति और शांति के क्षण",

        upcomingEventsTag:
            "आगामी कार्यक्रम",

        upcomingEventsHeading:
            "मंदिर उत्सव में शामिल हों",

        supportTag:
            "मंदिर का सहयोग",

        donationHeading:
            "आपका दान आस्था, संस्कृति और सेवा को मजबूत करता है।",

        donationText:
            "आपका सहयोग मंदिर रखरखाव, दैनिक पूजा, उत्सव, सामुदायिक सेवा और अन्य धार्मिक गतिविधियों में सहायता करता है।",

        donationFormTitle:
            "दान करें",

        visitTag:
            "मंदिर दर्शन",

        visitHeading:
            "मंदिर यात्रा की योजना बनाएं",

        whatsappBtn:
            "व्हाट्सऐप करें",

        callBtn:
            "अभी कॉल करें",

        eventCalendarBtn:
            "पूरा कैलेंडर देखें"

    }

};


/* =====================================================
   APPLY LANGUAGE
===================================================== */

function applyLanguage(lang) {

    const dict =
        translations[lang] ||
        translations.en;


    const ids = [

        "navHome",
        "navAbout",
        "navEvents",
        "navGallery",
        "navNotice",
        "navDonate",
        "navContact",
        "navAdmin",

        "heroBadge",
        "title",
        "welcome",

        "donateBtn",
        "exploreEventsBtn",

        "heroHighlight1",
        "heroHighlight2",
        "heroHighlight3",

        "aboutTag",
        "aboutHeading",
        "aboutText",

        "noticeTag",
        "noticeHeading",

        "galleryTag",
        "galleryHeading",

        "upcomingEventsTag",
        "upcomingEventsHeading",

        "supportTag",
        "donationHeading",
        "donationText",
        "donationFormTitle",

        "visitTag",
        "visitHeading",

        "whatsappBtn",
        "callBtn",

        "eventCalendarBtn"

    ];


    ids.forEach(function (id) {

        const element =
            document.getElementById(id);


        if (
            element &&
            dict[id]
        ) {

            element.textContent =
                dict[id];

        }

    });


    document.documentElement.lang =
        lang;


    const languageSelect =
        document.getElementById("language");


    if (languageSelect) {

        languageSelect.value =
            lang;

    }


    localStorage.setItem(
        "temple-language",
        lang
    );

}


/* =====================================================
   LANGUAGE SELECT
===================================================== */

const languageSelect =
    document.getElementById("language");


if (languageSelect) {

    const savedLanguage =
        localStorage.getItem(
            "temple-language"
        ) || "en";


    applyLanguage(
        savedLanguage
    );


    languageSelect.addEventListener(
        "change",
        function () {

            applyLanguage(
                this.value
            );

        }
    );

}


/* =====================================================
   DARK MODE
===================================================== */

const themeToggle =
    document.getElementById("themeToggle");


function applyTheme(mode) {

    const darkMode =
        mode === "dark";


    document.body.classList.toggle(
        "dark-mode",
        darkMode
    );


    localStorage.setItem(
        "temple-theme",
        mode
    );


    if (themeToggle) {

        themeToggle.textContent =
            darkMode
                ? "Light Mode"
                : "Dark Mode";

    }

}


if (themeToggle) {

    const savedTheme =
        localStorage.getItem(
            "temple-theme"
        ) || "light";


    applyTheme(
        savedTheme
    );


    themeToggle.addEventListener(
        "click",
        function () {

            const nextMode =
                document.body.classList.contains(
                    "dark-mode"
                )
                    ? "light"
                    : "dark";


            applyTheme(
                nextMode
            );

        }
    );

}


/* =====================================================
   DONATION / UPI PAYMENT
===================================================== */

const donationForm =
    document.getElementById(
        "donation-form"
    );

let latestReceiptData = null;

const downloadReceiptButton =
    document.getElementById(
        "downloadReceiptButton"
    );

if (downloadReceiptButton) {
    downloadReceiptButton.addEventListener(
        "click",
        function () {
            if (!latestReceiptData) {
                alert("Receipt details are not available yet.");
                return;
            }

            const receipt = [
                "TOT - TEMPLE OF TURKI",
                "Donation Receipt",
                "------------------------------",
                `Payment ID: ${latestReceiptData.donationId}`,
                `Donor Name: ${latestReceiptData.name}`,
                `Mobile: ${latestReceiptData.mobile}`,
                `Amount: Rs. ${latestReceiptData.amount}`,
                `Payment Mode: UPI`,
                `UPI ID: ${latestReceiptData.upiId}`,
                `Status: ${latestReceiptData.status}`,
                `Date: ${latestReceiptData.date}`,
                "",
                "This receipt confirms that the donation payment was initiated.",
                "UPI payments may require bank confirmation."
            ].join("\n");

            const file = new Blob([receipt], { type: "text/plain;charset=utf-8" });
            const downloadUrl = URL.createObjectURL(file);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `temple-donation-${latestReceiptData.donationId}.txt`;
            link.click();
            URL.revokeObjectURL(downloadUrl);
        }
    );
}


if (donationForm) {

    donationForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const nameInput =
                document.getElementById("name");

            const mobileInput =
                document.getElementById("mobile");

            const amountInput =
                document.getElementById("amount");


            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";


            const mobile =
                mobileInput
                    ? mobileInput.value.trim()
                    : "";


            const amount =
                amountInput
                    ? Number(amountInput.value)
                    : 0;


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!name) {

                alert(
                    "Please enter your name."
                );

                if (nameInput) {
                    nameInput.focus();
                }

                return;
            }


            if (!mobile) {

                alert(
                    "Please enter your mobile number."
                );

                if (mobileInput) {
                    mobileInput.focus();
                }

                return;
            }


            /* Minimum donation ₹1 */

            if (
                !Number.isFinite(amount) ||
                amount < 1
            ) {

                alert(
                    "Minimum donation amount is ₹1."
                );

                if (amountInput) {
                    amountInput.focus();
                }

                return;
            }


            /* -----------------------------------------
               DONATION DATA
            ----------------------------------------- */

            const donation = {

                name: name,

                mobile: mobile,

                amount: amount

            };


            try {

                /* -------------------------------------
                   AUTHENTICATED FETCH
                ------------------------------------- */

                const fetchFunction =
                    window.templeApiFetch;


                if (!fetchFunction) {

                    throw new Error(
                        "Payment authentication system load nahi hua. Page refresh karein."
                    );

                }


                /* -------------------------------------
                   CREATE UPI PAYMENT
                ------------------------------------- */

                const response =
                    await fetchFunction(

                        "/api/payments/upi-intent",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    donation
                                )

                        }

                    );


                /* -------------------------------------
                   SAFE JSON RESPONSE
                ------------------------------------- */

                const responseText =
                    await response.text();


                let data = {};


                try {

                    data =
                        responseText
                            ? JSON.parse(responseText)
                            : {};

                } catch (jsonError) {

                    console.error(
                        "Invalid server response:",
                        responseText
                    );

                    throw new Error(
                        "Server ne valid response nahi diya."
                    );

                }


                console.log(
                    "UPI Intent Response:",
                    data
                );


                /* -------------------------------------
                   ERROR CHECK
                ------------------------------------- */

                if (
                    !response.ok ||
                    !data.success
                ) {

                    if (response.status === 405) {
                        throw new Error(
                            "Payment API is unavailable at this address. Start the Node server with 'node server.js' and open http://localhost:5000."
                        );
                    }

                    throw new Error(

                        data.message ||
                        `UPI payment could not be created (HTTP ${response.status}).`

                    );

                }


                /* -------------------------------------
                   GET UPI PANEL ELEMENTS
                ------------------------------------- */

                const upiPanel =
                    document.getElementById(
                        "upiPaymentPanel"
                    );


                const upiDetails =
                    document.getElementById(
                        "upiDetails"
                    );


                const upiQr =
                    document.getElementById(
                        "upiQrCode"
                    );


                const upiOpenLink =
                    document.getElementById(
                        "upiOpenLink"
                    );


                /* -------------------------------------
                   SHOW UPI PANEL
                ------------------------------------- */

                if (upiPanel) {

                    upiPanel.hidden =
                        false;

                }


                /* -------------------------------------
                   SHOW UPI DETAILS
                ------------------------------------- */

                if (upiDetails) {

                    upiDetails.textContent =

                        "UPI ID: " +
                        data.data.upiId +
                        " | Amount: ₹" +
                        data.data.amount;

                }


                /* -------------------------------------
                   SHOW QR CODE
                ------------------------------------- */

                if (
                    upiQr &&
                    data.data.qrCode
                ) {

                    upiQr.src =
                        data.data.qrCode;

                }


                /* -------------------------------------
                   OPEN UPI APP
                ------------------------------------- */

                if (
                    upiOpenLink &&
                    data.data.upiLink
                ) {

                    upiOpenLink.href =
                        data.data.upiLink;

                    if (downloadReceiptButton) {
                        upiOpenLink.onclick = function () {
                            window.setTimeout(function () {
                                const completed = window.confirm(
                                    "Kya aapne UPI app mein payment complete kar diya hai?"
                                );

                                if (completed) {
                                    downloadReceiptButton.hidden = false;
                                }
                            }, 500);
                        };
                    }

                }

                latestReceiptData = {
                    donationId: data.data.donationId,
                    name: name,
                    mobile: mobile,
                    amount: data.data.amount,
                    upiId: data.data.upiId,
                    status: data.data.status,
                    date: new Date().toLocaleString()
                };


                /* -------------------------------------
                   RESET FORM
                ------------------------------------- */

                donationForm.reset();


                /* -------------------------------------
                   SCROLL TO UPI PANEL
                ------------------------------------- */

                if (upiPanel) {

                    upiPanel.scrollIntoView({

                        behavior: "smooth",

                        block: "center"

                    });

                }


            } catch (error) {

                console.error(
                    "Donation Error:",
                    error
                );


                alert(

                    error.message ||
                    "Something went wrong while creating UPI payment."

                );

            }

        }
    );

}


/* =====================================================
   PRESET DONATION AMOUNTS
===================================================== */

const presetButtons =
    document.querySelectorAll(
        ".amount-pill"
    );


presetButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                const amountInput =
                    document.getElementById(
                        "amount"
                    );


                if (amountInput) {

                    amountInput.value =
                        this.dataset.amount;


                    amountInput.focus();

                }

            }
        );

    }
);


/* =====================================================
   INITIAL UPI PANEL STATE
===================================================== */

const initialUpiPanel =
    document.getElementById(
        "upiPaymentPanel"
    );


if (initialUpiPanel) {

    initialUpiPanel.hidden =
        true;

}


/* =====================================================
   END OF SCRIPT
===================================================== */