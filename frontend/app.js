const API = "http://127.0.0.1:8000";

/* HOME PAGE */
document.addEventListener("DOMContentLoaded", () => {

    const usernameInput = document.getElementById("username");
    const industrySelect = document.getElementById("industry");
    const continueBtn = document.getElementById("continueBtn");

    if (!continueBtn) return;   

    function validateForm() {

        if (usernameInput.value.trim() !== "" && industrySelect.value !== "") {

            continueBtn.disabled = false;

            continueBtn.classList.remove("btn-disabled");
            continueBtn.classList.add("btn-enabled");

        } else {

            continueBtn.disabled = true;

            continueBtn.classList.remove("btn-enabled");
            continueBtn.classList.add("btn-disabled");
        }
    }

    usernameInput.addEventListener("input", validateForm);
    industrySelect.addEventListener("change", validateForm);

    continueBtn.onclick = () => {

        const username = usernameInput.value.trim();
        const industry = industrySelect.value;

        localStorage.setItem("username", username);
        localStorage.setItem("industry", industry);

        window.location.href = "jobs.html";
    };

});

/* JOBS PAGE */
if (document.getElementById("jobCards")) {

    const username = localStorage.getItem("username");
    const industry = localStorage.getItem("industry");
    
    document.getElementById("welcome").innerText =
        `Welcome to AI Impact Analyzer, ${username}!`;
    document.getElementById("selectedIndustry").innerText = industry;
    
    fetch(`${API}/jobs/${encodeURIComponent(industry)}`)
        .then(res => res.json())
        .then(data => {

            const container = document.getElementById("jobCards");
            container.innerHTML = "";   // prevents duplicate cards on refresh

            data.top_jobs.forEach(job => {

                const card = document.createElement("div");
                card.className = "card";
                card.innerText = job["Job Title"];

                card.onclick = () => {
                    localStorage.setItem("selectedJob", JSON.stringify(job));
                    window.location.href = "details.html";
                };

                container.appendChild(card);
            });

            localStorage.setItem("jobsData", JSON.stringify(data.top_jobs));
        });
}

/* DETAILS PAGE */
if (document.getElementById("details")) {

    const job = JSON.parse(localStorage.getItem("selectedJob"));

    const aiImpact = job["AI Impact %"] ?? 0;
    const risk = job["Automation Risk %"] ?? 0;

    const level = job["AI Impact Level"].toLowerCase();

    document.getElementById("details").innerHTML = `
     <div class="details-container">

        <div class="job-title">${job["Job Title"]}</div>

        <div class="metric">
            <div class="metric-title">AI Impact</div>
            <div class="bar-container">
                <div class="bar" style="width:${aiImpact}%">
                    ${aiImpact}%
                </div>
            </div>
        </div>

        <div class="metric">
            <div class="metric-title">Automation Risk</div>
            <div class="bar-container">
                <div class="bar" style="width:${risk}%">
                    ${risk}%
                </div>
            </div>
        </div>

        <div class="metric">
            <div class="metric-title">AI Impact Level</div>
            <div class="metric-value level-${level}">
                ${job["AI Impact Level"]}
            </div>
        </div>

        <div class="info-grid">

            <div class="info-card">
                <div class="metric-title">Required Education</div>
                <div class="info-value">${job["Required Education"]}</div>
            </div>

            <div class="info-card">
                <div class="metric-title">Median Salary</div>
                <div class="info-value">${job["Median Salary (USD)"]}</div>
            </div>

            <div class="info-card">
                <div class="metric-title">Expected Openings(2030)</div>
                <div class="info-value">${job["Expected Openings (2030)"]}</div>
            </div>

            <div class="info-card">
                <div class="metric-title">Experience Required</div>
                <div class="info-value">${job["Experience Required (Years)"]}</div>
            </div>

        </div>
     </div>
`   ;
}

/* COMPARISON PAGE */
if (document.getElementById("charts")) {

    const jobs = JSON.parse(localStorage.getItem("jobsData"));
    const tokens = ["A", "B", "C"];

    const legendHTML = jobs.map((j, i) =>
        `${tokens[i]} - ${j["Job Title"]}`
    ).join("<br>");

    document.querySelector(".overlay").innerHTML +=
        `<div class="legend">${legendHTML}</div>`;

    const metrics = [
        "AI Impact %",
        "Median Salary (USD)",
        "Automation Risk %",
        "Expected Openings (2030)",
        "Experience Required (Years)"
    ];

    metrics.forEach(metric => {

        const card = document.createElement("div");
        card.className = "chart-card";

        const title = document.createElement("div");
        title.className = "chart-title";
        title.innerText = metric;

        const canvas = document.createElement("canvas");

        card.appendChild(title);
        card.appendChild(canvas);
        document.getElementById("charts").appendChild(card);

        const gradient = createGradient(canvas);

        new Chart(canvas, {
            type: "bar",
            data: {
                labels: tokens,
                datasets: [{
                    data: jobs.map(j => j[metric] ?? 0),
                    backgroundColor: gradient
                }]
            },
            options: {
                plugins: { legend: { display: false } }
            }
        });
    });
}

function createGradient(canvas) {
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);

    gradient.addColorStop(0, "#66FFFF");  // top glow
    gradient.addColorStop(1, "#00AEEF");  // deep neon

    return gradient;
}

/* NAVIGATION */
function goBack() {
    window.history.back();
}

function goComparison() {
    window.location.href = "comparison.html";
}