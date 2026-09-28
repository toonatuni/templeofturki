let allDonations = [];


function formatDate(date) {

    if (!date) {

        return "-";

    }


    return new Date(
        date
    ).toLocaleString();

}


function getStatusClass(status) {

    return `status-${status}`;

}


async function loadDonations() {

    try {

        const response =
            await window.templeApiFetch(
                "/api/admin/donations"
            );


        const result =
            await response.json();


        if (!result.success) {

            alert(
                result.message ||
                "Data load failed"
            );

            return;

        }


        allDonations =
            result.data;


        renderDonations(
            allDonations
        );


        updateDashboardStats(
            allDonations
        );


        renderRecentDonations(
            allDonations
        );


        renderPayments(
            allDonations
        );


    } catch (error) {

        console.error(
            error
        );


        alert(
            "Server error or admin access denied"
        );

    }

}


function renderDonations(donations) {

    const table =
        document.getElementById(
            "donationTable"
        );


    table.innerHTML =
        "";


    donations.forEach(
        donation => {

            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.date =
                new Date(
                    donation.createdAt
                )
                .toISOString()
                .split("T")[0];


            row.innerHTML = `

                <td>
                    ${donation._id}
                </td>

                <td>
                    ${donation.name}
                </td>

                <td>
                    ${donation.mobile}
                </td>

                <td>
                    ₹${donation.amount}
                </td>

                <td>

                    <span
                        class="status ${getStatusClass(donation.status)}">

                        ${donation.status}

                    </span>

                </td>

                <td>
                    ${formatDate(donation.createdAt)}
                </td>

                <td>

                    ${
                        donation.status === "pending"

                        ?

                        `
                        <button
                            class="primary-btn"
                            onclick="markDonationPaid('${donation._id}')">

                            Mark Paid

                        </button>
                        `

                        :

                        ""
                    }


                    <button
                        class="delete-btn"
                        onclick="deleteDonation('${donation._id}')">

                        Delete

                    </button>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


function updateDashboardStats(donations) {

    const totalAmount =
        donations
            .filter(
                donation =>
                    donation.status === "paid"
            )
            .reduce(
                (sum, donation) =>
                    sum + donation.amount,
                0
            );


    const paidCount =
        donations.filter(
            donation =>
                donation.status === "paid"
        ).length;


    const pendingCount =
        donations.filter(
            donation =>
                donation.status === "pending"
        ).length;


    document
        .getElementById(
            "totalDonation"
        )
        .innerText =
            "₹" + totalAmount;


    document
        .getElementById(
            "totalDonor"
        )
        .innerText =
            donations.length;


    document
        .getElementById(
            "totalPaid"
        )
        .innerText =
            paidCount;


    document
        .getElementById(
            "totalPending"
        )
        .innerText =
            pendingCount;

}


function renderRecentDonations(donations) {

    const table =
        document.getElementById(
            "recentDonationTable"
        );


    table.innerHTML =
        "";


    donations
        .slice(0, 5)
        .forEach(
            donation => {

                table.innerHTML += `

                    <tr>

                        <td>
                            ${donation.name}
                        </td>

                        <td>
                            ₹${donation.amount}
                        </td>

                        <td>

                            <span
                                class="status ${getStatusClass(donation.status)}">

                                ${donation.status}

                            </span>

                        </td>

                        <td>
                            ${formatDate(donation.createdAt)}
                        </td>

                    </tr>

                `;

            }
        );

}


function renderPayments(donations) {

    const table =
        document.getElementById(
            "paymentTable"
        );


    table.innerHTML =
        donations.map(
            donation => `

                <tr>

                    <td>
                        ${donation._id}
                    </td>

                    <td>

                        ${donation.name}

                        <br>

                        <small>
                            ${donation.mobile}
                        </small>

                    </td>

                    <td>
                        ₹${donation.amount}
                    </td>

                    <td>
                        UPI
                    </td>

                    <td>

                        <span
                            class="status ${getStatusClass(donation.status)}">

                            ${donation.status}

                        </span>

                    </td>

                    <td>
                        ${formatDate(donation.createdAt)}
                    </td>

                </tr>

            `
        )
        .join("");

}


async function markDonationPaid(id) {

    try {

        const response =
            await window.templeApiFetch(

                `/api/admin/donations/${id}`,

                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            status:
                                "paid"

                        })

                }

            );


        const result =
            await response.json();


        alert(
            result.success
                ? "Donation marked as paid"
                : result.message
        );


        if (result.success) {

            loadDonations();

        }

    } catch (error) {

        alert(
            error.message
        );

    }

}


async function deleteDonation(id) {

    if (
        !confirm(
            "Delete this donation?"
        )
    ) {

        return;

    }


    try {

        const response =
            await window.templeApiFetch(

                `/api/admin/donations/${id}`,

                {

                    method:
                        "DELETE"

                }

            );


        const result =
            await response.json();


        alert(
            result.message
        );


        if (result.success) {

            loadDonations();

        }

    } catch (error) {

        alert(
            error.message
        );

    }

}


// ======================================
// SEARCH
// ======================================

document
    .getElementById(
        "search"
    )
    .addEventListener(

        "input",

        function () {

            const value =
                this.value
                    .toLowerCase()
                    .trim();


            const filtered =
                allDonations.filter(
                    donation =>

                        donation.name
                            .toLowerCase()
                            .includes(value)

                        ||

                        donation.mobile
                            .toLowerCase()
                            .includes(value)

                );


            renderDonations(
                filtered
            );

        }

    );


// ======================================
// DATE FILTER
// ======================================

function filterByDate() {

    const selectedDate =
        document.getElementById(
            "filterDate"
        ).value;


    if (!selectedDate) {

        renderDonations(
            allDonations
        );

        return;

    }


    const filtered =
        allDonations.filter(
            donation => {

                const date =
                    new Date(
                        donation.createdAt
                    )
                    .toISOString()
                    .split("T")[0];


                return date ===
                    selectedDate;

            }
        );


    renderDonations(
        filtered
    );

}


// ======================================
// PDF EXPORT
// ======================================

function exportPDF() {

    const {
        jsPDF
    } =
        window.jspdf;


    const doc =
        new jsPDF();


    doc.setFontSize(
        18
    );


    doc.text(
        "TOT - Temple of Turki",
        14,
        15
    );


    doc.setFontSize(
        13
    );


    doc.text(
        "Donation Report",
        14,
        23
    );


    const rows =
        allDonations.map(
            donation => [

                donation._id,

                donation.name,

                donation.mobile,

                `Rs. ${donation.amount}`,

                donation.status,

                formatDate(
                    donation.createdAt
                )

            ]
        );


    doc.autoTable({

        head: [[

            "Donation ID",

            "Name",

            "Mobile",

            "Amount",

            "Status",

            "Date"

        ]],

        body:
            rows,

        startY:
            30,

        theme:
            "grid"

    });


    doc.save(
        "TOT_Donation_Report.pdf"
    );

}


// ======================================
// START
// ======================================

function startDashboard() {

    if (
        window.templeAuthReady
    ) {

        window
            .templeAuthReady
            .then(
                user => {

                    if (!user) {

                        window.location.href =
                            "admin-login.html";

                        return;

                    }


                    const adminName =
                        document.getElementById(
                            "adminName"
                        );


                    if (adminName) {

                        adminName.innerText =
                            user.email ||
                            "Admin";

                    }


                    loadDonations();

                }
            );

    }

}


startDashboard();