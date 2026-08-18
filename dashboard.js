async function loadDonations() {
    try {
        const response = await fetch("http://localhost:5000/api/donations");
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
                    <td>${new Date(donation.date).toLocaleDateString()}</td>
                    <td>
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
        `http://localhost:5000/api/donations/${id}`,
        {
            method: "DELETE"
        }
    );

    const result = await response.json();

    alert(result.message);

    loadDonations();
}

loadDonations();

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
    doc.text("Jai Baba Dihbar Temple", 14, 15);

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