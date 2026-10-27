
const API = "/api/applications";

const addBtn = document.getElementById("addApplicationBtn");
const cancelBtn = document.getElementById("cancelApplicationBtn");
const formPanel = document.getElementById("applicationFormPanel");
const form = document.getElementById("applicationForm");
const detailsPanel = document.getElementById("detailsPanel");
const detailsContent = document.getElementById("detailsContent");
const closeDetailsBtn = document.getElementById("closeDetailsBtn");
const editBtn = document.getElementById("editApplicationBtn");

let applications = [];
let selectedApplicationId = null;
let editingApplicationId = null;

const statusLabels = {
  PLANNED: "Planned",
  IN_PROGRESS: "Preparing Application",
  APPLIED: "Applied",
  ONLINE_ASSESSMENT: "Online Assessment",
  PHONE_SCREEN: "Phone Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer Received",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn"
};

const groups = {
  planned: ["PLANNED", "IN_PROGRESS"],
  applied: [
    "APPLIED", "ONLINE_ASSESSMENT", "PHONE_SCREEN",
    "INTERVIEW", "OFFER"
  ],
  past: ["ACCEPTED", "REJECTED", "WITHDRAWN"]
};

const sections = {
  planned: {container: "plannedApplications", count: "plannedCount"},
  applied: {container: "appliedApplications", count: "appliedCount"},
  past: {container: "pastApplications", count: "pastCount"}
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "Not provided";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });
}

function todayLocal() {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
}

function getGroup(status) {
  return Object.keys(groups).find(group =>
    groups[group].includes(status)
  );
}

function renderCard(application) {
  const group = getGroup(application.status);
  const badgeClass = group === "planned" ? "planned"
    : group === "past" ? "past" : "";

  const dateLabel = group === "past" ? "Application date" : "Deadline";
  const dateValue = group === "past"
    ? application.applicationDate : application.deadline;

  return `
    <div class="card application-card">
      <div class="card-heading">
        <div>
          <b>${escapeHtml(application.employer)}</b>
          <span class="role">${escapeHtml(application.role)}</span>
        </div>
      </div>

      <div>
        <span class="status-badge ${badgeClass}">
          ${escapeHtml(statusLabels[application.status])}
        </span>
      </div>

      <div class="card-date">
        ${dateLabel}: ${escapeHtml(formatDate(dateValue))}
      </div>

      <div class="card-footer">
        <button type="button" class="details-link"
                data-id="${escapeHtml(application.id)}">
          View Details →
        </button>
      </div>
    </div>
  `;
}

function renderApplications() {
  for (const group of Object.keys(groups)) {
    const filtered = applications.filter(app =>
      groups[group].includes(app.status)
    );

    document.getElementById(sections[group].count).textContent =
      filtered.length;

    document.getElementById(sections[group].container).innerHTML =
      filtered.length
        ? filtered.map(renderCard).join("")
        : '<p class="mute">No applications yet.</p>';
  }
}

async function loadApplications() {
  const response = await fetch(API);

  if (!response.ok) {
    throw new Error("Could not load applications.");
  }

  applications = await response.json();
  renderApplications();
}

function detailField(label, value, extraClass = "") {
  return `
    <div class="detail-item ${extraClass}">
      <span class="detail-label">${escapeHtml(label)}</span>
      <div class="detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function showDetails(id) {
  const app = applications.find(item => item.id === id);
  if (!app) return;

  selectedApplicationId = id;

  document.getElementById("detailsTitle").textContent = app.employer;
  document.getElementById("detailsSubtitle").textContent = app.role;

  detailsContent.innerHTML = `
    <div class="details-grid">
      ${detailField("Status", statusLabels[app.status])}
      ${detailField("Application Date", formatDate(app.applicationDate))}
      ${detailField("Source", app.source)}
      ${detailField("Deadline", formatDate(app.deadline))}
      ${detailField("Notes", app.notes || "No notes added.", "detail-notes")}
    </div>
  `;

  detailsPanel.classList.remove("hide");
  detailsPanel.scrollIntoView({behavior: "smooth", block: "start"});
}

function setFormMode(isEditing) {
  document.getElementById("formTitle").textContent =
    isEditing ? "Edit Application" : "Add New Application";

  document.getElementById("saveApplicationBtn").textContent =
    isEditing ? "Save Changes" : "Save Application";

  const status = document.getElementById("status");

  // Java creates new applications in the PLANNED stage.
  status.disabled = false;

  if (!isEditing) {
    status.value = "PLANNED";
  }
}

addBtn.addEventListener("click", () => {
  editingApplicationId = null;
  form.reset();
  setFormMode(false);

  document.getElementById("applicationDate").value = todayLocal();
  formPanel.classList.remove("hide");
  formPanel.scrollIntoView({behavior: "smooth", block: "start"});
});

document.querySelector(".tracker-board").addEventListener("click", event => {
  const button = event.target.closest(".details-link");
  if (button) showDetails(button.dataset.id);
});

closeDetailsBtn.addEventListener("click", () => {
  detailsPanel.classList.add("hide");
  selectedApplicationId = null;
});

editBtn.addEventListener("click", () => {
  const app = applications.find(
    item => item.id === selectedApplicationId
  );

  if (!app) return;

  editingApplicationId = app.id;
  form.reset();
  setFormMode(true);

  document.getElementById("employer").value = app.employer;
  document.getElementById("role").value = app.role;
  document.getElementById("applicationDate").value = app.applicationDate;
  document.getElementById("source").value = app.source;
  document.getElementById("deadline").value = app.deadline || "";
  document.getElementById("status").value = app.status;
  document.getElementById("notes").value = app.notes || "";

  formPanel.classList.remove("hide");
  formPanel.scrollIntoView({behavior: "smooth", block: "start"});
});

cancelBtn.addEventListener("click", () => {
  formPanel.classList.add("hide");
  form.reset();
  editingApplicationId = null;
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  const data = new URLSearchParams({
    employer: document.getElementById("employer").value.trim(),
    role: document.getElementById("role").value.trim(),
    applicationDate: document.getElementById("applicationDate").value,
    source: document.getElementById("source").value.trim(),
    deadline: document.getElementById("deadline").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value.trim()
  });

  const isEditing = Boolean(editingApplicationId);
  const url = isEditing
    ? `${API}/${editingApplicationId}` : API;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data.toString()
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not save application.");
    }

    const savedId = result.id;

    await loadApplications();

    form.reset();
    formPanel.classList.add("hide");
    editingApplicationId = null;

    if (!detailsPanel.classList.contains("hide")) {
      showDetails(savedId);
    }

  } catch (error) {
    alert(error.message);
  }
});

loadApplications().catch(error => {
  alert(error.message);
});
