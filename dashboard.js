async function loadDonations() {
    try {
        const response = await window.templeApiFetch("/api/admin/donations");
        const result = await response.json();

        if (!result.success) {
            alert("Data Load Failed");
            return;
        }

        const donations = result.data;

        const table = document.getElementById("donationTable");
        table.innerHTML = "";

        let totalAmount = 0;

        donations.forEach((donation) => {

            totalAmount += donation.amount;

            table.innerHTML += `
                <tr>
                    <td>${donation.name}</td>
                    <td>${donation.mobile}</td>
                    <td>₹${donation.amount}</td>
                    <td>${new Date(donation.createdAt).toLocaleDateString()}</td>
                    <td>${donation.status}${donation.utr ? ` (${donation.utr})` : ""}</td>
                    <td>
                        ${donation.status === "pending" ? `<button onclick="markDonationPaid('${donation._id}')">Mark paid</button>` : ""}
                        <button onclick="deleteDonation('${donation._id}')">
                            Delete
                        </button>
                    </td>
                </tr>
            `;
        });

        document.getElementById("totalDonation").innerText = "₹" + totalAmount;
        document.getElementById("totalDonor").innerText = donations.length;

    } catch (error) {
        console.error(error);
        alert("Server Error");
    }
}

async function deleteDonation(id) {

    if (!confirm("Delete this donation?")) return;

    const response = await fetch(
        `/api/admin/donations/${id}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    alert(result.message);

    loadDonations();
}

async function markDonationPaid(id) {
    const response = await window.templeApiFetch(`/api/admin/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" })
    });
    const result = await response.json();
    alert(result.success ? "Donation marked as paid" : result.message);
    loadDonations();
}

window.templeAuthReady.then(loadDonations);

//search donor
document.getElementById("search").addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll("#donationTable tr");

    rows.forEach((row) => {

        const text = row.innerText.toLowerCase();

        row.style.display = text.includes(value) ? "" : "none";

    });

});
function filterByDate() {

    const selectedDate = document.getElementById("filterDate").value;

    const rows = document.querySelectorAll("#donationTable tr");

    rows.forEach((row) => {

        const dateText = row.cells[3].innerText;

        const rowDate = new Date(dateText).toISOString().split("T")[0];

        if (selectedDate === rowDate) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    });

}
//convert to pdf
function exportPDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("TOT - Temple of Turki", 14, 15);

    doc.setFontSize(13);
    doc.text("Donation Report", 14, 23);

    const rows = [];
    let totalAmount = 0;

    document.querySelectorAll("#donationTable tr").forEach(row => {

        const cols = row.querySelectorAll("td");

        if (cols.length >= 4) {

            const name = cols[0].innerText;
            const mobile = cols[1].innerText;
            const amount = cols[2].innerText;
            const date = cols[3].innerText;

            totalAmount += Number(amount.replace("₹", "").replace("Rs.", "").trim());

            rows.push([
                name,
                mobile,
                "Rs. " + Number(amount.replace("₹", "").replace("Rs.", "").trim()),
                date
        ]);
        }
    });

    doc.autoTable({
        head: [["Name","Mobile","Amount","Date"]],
        body: rows,
        startY: 30,
        theme: "grid"
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.text("Total Donations : Rs. " + totalAmount, 14, finalY);

    doc.save("Temple_Donation_Report.pdf");
}
// ===============================
// ANNOUNCEMENT SYSTEM
// ===============================

async function loadAnnouncements() {

    try {

        const response = await fetch("/api/announcements");

        const result = await response.json();

        const list = document.getElementById("announcementList");

        if (!result.success) {
            list.innerHTML = "Announcements load failed";
            return;
        }

        if (result.data.length === 0) {
            list.innerHTML = "No announcements available";
            return;
        }

        list.innerHTML = "";

        result.data.forEach((announcement) => {

            const date = new Date(
                announcement.createdAt
            ).toLocaleDateString();

            list.innerHTML += `
                <div class="announcement-item">

                    <h3>${announcement.title}</h3>

                    <p>${announcement.message}</p>

                    <small>${date}</small>

                    <br><br>

                    <button
                        onclick="deleteAnnouncement('${announcement._id}')">
                        Delete
                    </button>

                </div>
            `;
        });

    } catch (error) {

        console.error(error);

        document.getElementById("announcementList").innerHTML =
            "Server Error";

    }
}


async function addAnnouncement() {

    const title =
        document.getElementById("announcementTitle").value.trim();

    const message =
        document.getElementById("announcementMessage").value.trim();


    if (!title || !message) {

        alert("Title and message are required");

        return;
    }


    try {

        const response = await window.templeApiFetch(
            "/api/announcements",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: title,
                    message: message
                })
            }
        );


        const result = await response.json();


        if (!result.success) {

            alert(result.message);

            return;
        }


        alert("Announcement Added Successfully");


        document.getElementById(
            "announcementTitle"
        ).value = "";


        document.getElementById(
            "announcementMessage"
        ).value = "";


        loadAnnouncements();


    } catch (error) {

        console.error(error);

        alert("Server Error");

    }

}


async function deleteAnnouncement(id) {

    if (!confirm("Delete this announcement?")) {
        return;
    }


    try {

        const response = await window.templeApiFetch(
            `/api/announcements/${id}`,
            {
                method: "DELETE"
            }
        );


        const result = await response.json();


        alert(result.message);


        if (result.success) {
            loadAnnouncements();
        }


    } catch (error) {

        console.error(error);

        alert("Server Error");

    }

}


// Load announcements after authentication
window.templeAuthReady.then(() => {
    loadAnnouncements();
});