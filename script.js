const form = document.getElementById("donation-form");

if (form) {
    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const donation = {
            name: document.getElementById("name").value,
            mobile: document.getElementById("mobile").value,
            amount: Number(document.getElementById("amount").value)
        };

        try {
            const response = await fetch("http://localhost:5000/api/donate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(donation)
            });

            const data = await response.json();
            alert(data.message);

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.setFontSize(20);
            doc.text("Jai Baba Dihbar Temple", 20, 20);

            doc.setFontSize(14);
            doc.text("Donation Receipt", 20, 35);
            doc.text("Name : " + donation.name, 20, 55);
            doc.text("Mobile : " + donation.mobile, 20, 70);
            doc.text("Amount : Rs." + donation.amount, 20, 85);
            doc.text("Date : " + new Date().toLocaleDateString(), 20, 100);
            doc.save("Temple-Donation-Receipt.pdf");

            const message = `🛕 Jai Baba Dihbar Temple

Name: ${donation.name}

Amount: Rs.${donation.amount}

I have donated successfully.

Jai Baba Dihbar 🙏`;

            window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank");
            form.reset();
        } catch (error) {
            alert("Server Error");
            console.log(error);
        }
    });
}

const translations = {
    hi: {
        navHome: "होम",
        navAbout: "हमारे बारे में",
        navEvents: "कार्यक्रम",
        navGallery: "गैलरी",
        navDonate: "दान करें",
        navContact: "संपर्क",
        navAdmin: "एडमिन लॉगिन",
        dashboard: "डैशबोर्ड",
        heroBadge: "पवित्र विरासत • वैशाली, बिहार",
        title: "भक्ति, सेवा और शांति का पवित्र घर।",
        welcome: "आधिकारिक मंदिर वेबसाइट पर आपका स्वागत है, जहाँ आस्था, सामुदायिक भावना और दान एक साथ मिलकर मंदिर सेवा और उत्सव को मजबूत बनाते हैं।",
        donateBtn: "दान करें",
        exploreEventsBtn: "कार्यक्रम देखें",
        heroHighlight1: "दैनिक आरती",
        heroHighlight2: "उत्सव उत्सव",
        heroHighlight3: "सामुदायिक सेवा",
        galleryTag: "मंदिर गैलरी",
        galleryHeading: "भक्ति और शांति के क्षण",
        communityTag: "स्थानीय योगदान",
        communityHeading: "स्थानीय लोग अपनी तस्वीरें साझा करें",
        uploadLabel: "अपनी मंदिर तस्वीर अपलोड करें",
        uploadButton: "तस्वीर अपलोड करें",
        upcomingEventsTag: "आगामी कार्यक्रम",
        upcomingEventsHeading: "मंदिर उत्सव में शामिल हों",
        volunteerTag: "हमसे जुड़ें",
        volunteerText: "मंदिर सेवा और उत्सव का हिस्सा बनें।",
        eventCalendarBtn: "पूरा कार्यक्रम देखें",
        supportTag: "मंदिर का सहयोग",
        donationHeading: "आपका दान आस्था, संस्कृति और सेवा को संजोता है।",
        donationText: "मंदिर रखरखाव, दैनिक पूजा, उत्सव आयोजन, सामुदायिक प्रसाद और पवित्र सेवाओं के लिए सहयोग करें।",
        donationFormTitle: "दान करें",
        visitTag: "मंदिर दर्शन",
        visitHeading: "मंदिर यात्रा की योजना बनाएं",
        whatsappBtn: "व्हाट्सऐप करें",
        callBtn: "अभी कॉल करें",
        eventHeroBadge: "मंदिर कैलेंडर",
        eventPageTitle: "आगामी कार्यक्रम और आध्यात्मिक उत्सव",
        eventPageText: "सामुदायिक प्रसाद, भक्ति सभा और पारंपरिक उत्सवों में शामिल हों, जो शांति, आस्था और एकता को बढ़ाते हैं।"
    },
    en: {
        navHome: "Home",
        navAbout: "About",
        navEvents: "Events",
        navGallery: "Gallery",
        navDonate: "Donate",
        navContact: "Contact",
        navAdmin: "Admin Login",
        dashboard: "Dashboard",
        heroBadge: "Sacred heritage • Vaishali, Bihar",
        title: "A spiritual home for devotion, service, and peace.",
        welcome: "Welcome to the official temple website where faith, community, and generosity come together for temple seva and celebration.",
        donateBtn: "Donate Now",
        exploreEventsBtn: "Explore Events",
        heroHighlight1: "Daily Aarti",
        heroHighlight2: "Festival Celebrations",
        heroHighlight3: "Community Seva",
        galleryTag: "Temple Gallery",
        galleryHeading: "Moments of faith and serenity",
        communityTag: "Local Contribution",
        communityHeading: "Local people share their temple memories",
        uploadLabel: "Upload your temple photo",
        uploadButton: "Upload Photo",
        upcomingEventsTag: "Upcoming Events",
        upcomingEventsHeading: "Join the temple celebrations",
        volunteerTag: "Volunteer with us",
        volunteerText: "Be a part of temple seva and celebrations.",
        eventCalendarBtn: "View Full Event Calendar",
        supportTag: "Support the Temple",
        donationHeading: "Your donation helps preserve faith, culture, and service.",
        donationText: "Contribute toward temple maintenance, daily rituals, festival preparations, community langar, and sacred initiatives.",
        donationFormTitle: "Make a donation",
        visitTag: "Visit Us",
        visitHeading: "Plan your temple visit",
        whatsappBtn: "WhatsApp Us",
        callBtn: "Call Now",
        eventHeroBadge: "Temple Calendar",
        eventPageTitle: "Upcoming events & spiritual celebrations",
        eventPageText: "Join us for sacred rituals, community meals, devotional gatherings, and traditional festivals that bring peace, faith, and unity."
    }
};

function applyLanguage(lang) {
    const dict = translations[lang] || translations.hi;

    const ids = [
        "navHome", "navAbout", "navEvents", "navGallery", "navDonate", "navContact", "navAdmin",
        "heroBadge", "title", "welcome", "donateBtn", "exploreEventsBtn",
        "heroHighlight1", "heroHighlight2", "heroHighlight3",
        "galleryTag", "galleryHeading", "communityTag", "communityHeading", "uploadLabel", "uploadButton",
        "upcomingEventsTag", "upcomingEventsHeading", "volunteerTag", "volunteerText", "eventCalendarBtn",
        "supportTag", "donationHeading", "donationText", "donationFormTitle",
        "visitTag", "visitHeading", "whatsappBtn", "callBtn",
        "eventHeroBadge", "eventPageTitle", "eventPageText"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el && dict[id]) {
            el.textContent = dict[id];
        }
    });

    const dashboardBtn = document.querySelector(".icon-button[onclick*='openDashboard']");
    if (dashboardBtn) dashboardBtn.textContent = dict.dashboard;

    const languageSelect = document.getElementById("language");
    if (languageSelect) languageSelect.value = lang;

    document.documentElement.lang = lang;
}

const language = document.getElementById("language");
if (language) {
    applyLanguage(language.value || "hi");
    language.addEventListener("change", function () {
        applyLanguage(this.value);
    });
}

function openDashboard() {
    window.location.href = "admin-dashboard.html";
}

const themeToggle = document.getElementById("themeToggle");
function applyTheme(mode) {
    const darkMode = mode === "dark";
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("temple-theme", mode);
    if (themeToggle) {
        themeToggle.textContent = darkMode ? "☀️" : "🌙";
        themeToggle.setAttribute("aria-label", darkMode ? "Switch to light mode" : "Switch to dark mode");
    }
}

if (themeToggle) {
    const storedTheme = localStorage.getItem("temple-theme");
    applyTheme(storedTheme || "light");
    themeToggle.addEventListener("click", () => {
        const nextMode = document.body.classList.contains("dark-mode") ? "light" : "dark";
        applyTheme(nextMode);
    });
}

const festivals = [
    { name: "🪔 Diwali", date: "2026-11-08" },
    { name: "🙏 Chhath Puja", date: "2026-11-15" },
    { name: "🕉️ Mahashivratri", date: "2027-02-06" },
    { name: "🌸 Holi", date: "2027-03-22" },
    { name: "🚩 Ram Navami", date: "2027-04-15" },
    { name: "🛕 Janmashtami", date: "2027-08-25" }
];

function showFestivals() {
    const festivalList = document.getElementById("festival-list");
    if (!festivalList) return;

    const today = new Date();
    const upcomingFestivals = festivals
        .filter(festival => new Date(festival.date) >= today)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (upcomingFestivals.length === 0) {
        festivalList.innerHTML = "<p>अभी कोई आगामी त्योहार नहीं है।</p>";
        return;
    }

    festivalList.innerHTML = "";

    upcomingFestivals.forEach(festival => {
        const date = new Date(festival.date);
        const formattedDate = date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        const card = document.createElement("div");
        card.className = "festival-card";
        card.innerHTML = `
            <h3>${festival.name}</h3>
            <p>📅 ${formattedDate}</p>
        `;
        festivalList.appendChild(card);
    });
}

if (document.getElementById("festival-list")) {
    showFestivals();
}

const presetButtons = document.querySelectorAll(".amount-pill");
if (presetButtons.length) {
    presetButtons.forEach(button => {
        button.addEventListener("click", () => {
            const amountInput = document.getElementById("amount");
            if (amountInput) {
                amountInput.value = button.dataset.amount;
            }
        });
    });
}

const communityGallery = document.getElementById("communityGallery");
const communityImageInput = document.getElementById("communityImageInput");
const uploadImageBtn = document.getElementById("uploadImageBtn");

function renderCommunityImages() {
    if (!communityGallery) return;

    const savedImages = JSON.parse(localStorage.getItem("templeCommunityImages") || "[]");
    if (!savedImages.length) {
        communityGallery.innerHTML = '<div class="empty-state">अभी तक कोई फोटो अपलोड नहीं हुई है।</div>';
        return;
    }

    communityGallery.innerHTML = savedImages.map((image, index) => `
        <div class="community-photo-card">
            <img src="${image.src}" alt="Community uploaded image ${index + 1}" />
            <button type="button" class="remove-photo" data-index="${index}">Remove</button>
        </div>
    `).join("");

    document.querySelectorAll(".remove-photo").forEach(button => {
        button.addEventListener("click", () => {
            const savedImages = JSON.parse(localStorage.getItem("templeCommunityImages") || "[]");
            savedImages.splice(Number(button.dataset.index), 1);
            localStorage.setItem("templeCommunityImages", JSON.stringify(savedImages));
            renderCommunityImages();
        });
    });
}

if (uploadImageBtn && communityImageInput) {
    uploadImageBtn.addEventListener("click", () => {
        const file = communityImageInput.files[0];
        if (!file) {
            alert("Please choose an image first.");
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const savedImages = JSON.parse(localStorage.getItem("templeCommunityImages") || "[]");
            savedImages.unshift({ src: reader.result, name: file.name });
            localStorage.setItem("templeCommunityImages", JSON.stringify(savedImages));
            communityImageInput.value = "";
            renderCommunityImages();
        };

        reader.readAsDataURL(file);
    });
}

renderCommunityImages();

function payUPI() {
    const name = document.getElementById("name").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const amount = document.getElementById("amount").value.trim();

    if (!name) {
        alert("Please enter your name");
        return;
    }

    if (!mobile) {
        alert("Please enter your mobile number");
        return;
    }

    if (!amount || Number(amount) <= 0) {
        alert("Please enter a valid donation amount");
        return;
    }

    const upiId = "templeturki@upi";
    const upiLink = "upi://pay" +
        "?pa=" + encodeURIComponent(upiId) +
        "&pn=" + encodeURIComponent("Jai Baba Dihbar Temple") +
        "&am=" + encodeURIComponent(amount) +
        "&cu=INR" +
        "&tn=" + encodeURIComponent("Temple Donation - " + name);

    window.location.href = upiLink;
}

