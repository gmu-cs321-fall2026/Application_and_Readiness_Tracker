
const API = "/api/applications";

const $ = id => document.getElementById(id);

const addBtn = $("addApplicationBtn");
const cancelBtn = $("cancelApplicationBtn");
const formPanel = $("applicationFormPanel");
const form = $("applicationForm");
const detailsPanel = $("detailsPanel");
const detailsContent = $("detailsContent");
const closeDetailsBtn = $("closeDetailsBtn");
const editBtn = $("editApplicationBtn");

const interviewList = $("interviewList");
const interviewCount = $("interviewCount");
const interviewFormPanel = $("interviewFormPanel");
const interviewForm = $("interviewForm");
const addInterviewBtn = $("addInterviewBtn");
const cancelInterviewBtn = $("cancelInterviewBtn");
const saveInterviewBtn = $("saveInterviewBtn");
const interviewStatusMessage = $("interviewStatusMessage");

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

const interviewTypeLabels = {
  RECRUITER_SCREEN: "Recruiter screen",
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  CASE: "Case",
  PANEL: "Panel",
  FINAL_ROUND: "Final round",
  OTHER: "Other"
};

const interviewFormatLabels = {
  PHONE: "Phone",
  VIDEO_CALL: "Video call",
  ON_CAMPUS: "On campus",
  ON_SITE: "On-site at employer",
  OTHER: "Other"
};

const groups = {
  planned: ["PLANNED", "IN_PROGRESS"],
  applied: [
    "APPLIED",
    "ONLINE_ASSESSMENT",
    "PHONE_SCREEN",
    "INTERVIEW",
    "OFFER"
  ],
  past: ["ACCEPTED", "REJECTED", "WITHDRAWN"]
};

const sections = {
  planned: {
    container: "plannedApplications",
    count: "plannedCount"
  },
  applied: {
    container: "appliedApplications",
    count: "appliedCount"
  },
  past: {
    container: "pastApplications",
    count: "pastCount"
  }
};

// Utilities

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
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatInterviewDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
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

async function readResponse(response, fallback) {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || fallback);
  }

  return result;
}

function postForm(url, fields) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(fields).toString()
  });
}

// Application cards

function renderCard(application) {
  const group = getGroup(application.status);

  const badgeClass =
    group === "planned" ? "planned" :
    group === "past" ? "past" : "";

  const dateLabel =
    group === "past" ? "Application date" : "Deadline";

  const dateValue =
    group === "past"
      ? application.applicationDate
      : application.deadline;

  return `
    <div class="card application-card">
      <div class="card-heading">
        <div>
          <b>${escapeHtml(application.employer)}</b>
          <span class="role">
            ${escapeHtml(application.role)}
          </span>
        </div>
      </div>

      <div>
        <span class="status-badge ${badgeClass}">
          ${escapeHtml(
            statusLabels[application.status] || application.status
          )}
        </span>
      </div>

      <div class="card-date">
        ${dateLabel}: ${escapeHtml(formatDate(dateValue))}
      </div>

      <div class="card-footer">
        <button
          type="button"
          class="details-link"
          data-id="${escapeHtml(application.id)}">
          View Details &rarr;
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

    $(sections[group].count).textContent = filtered.length;

    $(sections[group].container).innerHTML =
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

// Application details

function detailField(label, value, extraClass = "") {
  return `
    <div class="detail-item ${extraClass}">
      <span class="detail-label">
        ${escapeHtml(label)}
      </span>
      <div class="detail-value">
        ${escapeHtml(value)}
      </div>
    </div>
  `;
}

async function showDetails(id) {
  const app = applications.find(
    item => String(item.id) === String(id)
  );

  if (!app) return;

  selectedApplicationId = app.id;

  $("detailsTitle").textContent = app.employer;
  $("detailsSubtitle").textContent = app.role;

  detailsContent.innerHTML = `
    <div class="details-grid">
      ${detailField(
        "Status",
        statusLabels[app.status] || app.status
      )}
      ${detailField(
        "Application Date",
        formatDate(app.applicationDate)
      )}
      ${detailField("Source", app.source)}
      ${detailField("Deadline", formatDate(app.deadline))}
      ${detailField(
        "Notes",
        app.notes || "No notes added.",
        "detail-notes"
      )}
    </div>
  `;

  const canAddInterview = app.status === "INTERVIEW";

  addInterviewBtn.classList.toggle(
    "hide",
    !canAddInterview
  );

  interviewStatusMessage.classList.toggle(
    "hide",
    canAddInterview
  );

  interviewFormPanel.classList.add("hide");
  interviewForm.reset();

  detailsPanel.classList.remove("hide");

  detailsPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  await loadInterviews(app.id);
}

// Interview Tracker

async function loadInterviews(applicationId) {
  interviewList.innerHTML =
    '<p class="mute">Loading interviews...</p>';

  try {
    const response = await fetch(
      `${API}/${encodeURIComponent(applicationId)}/interviews`
    );

    const rounds = await readResponse(
      response,
      "Could not load interviews."
    );

    if (selectedApplicationId !== applicationId) return;

    renderInterviews(rounds);
  } catch (error) {
    if (selectedApplicationId !== applicationId) return;

    interviewList.innerHTML = `
      <p class="interview-error">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}

function renderInterviews(rounds) {
  interviewCount.textContent =
    `${rounds.length} ${rounds.length === 1 ? "round" : "rounds"}`;

  if (!rounds.length) {
    interviewList.innerHTML =
      '<p class="mute">No interview rounds recorded yet.</p>';
    return;
  }

  interviewList.innerHTML = rounds.map(round => `
    <article class="interview-card">
      <div class="interview-card-header">
        <div>
          <h4>
            Round ${round.roundNumber} —
            ${escapeHtml(
              interviewTypeLabels[round.type] || round.type
            )}
          </h4>

          <p class="mute">
            ${escapeHtml(
              formatInterviewDate(round.scheduledAt)
            )}
          </p>
        </div>

        <span class="interview-format">
          ${escapeHtml(
            interviewFormatLabels[round.format] || round.format
          )}
        </span>
      </div>

      <div class="interview-notes">
        <span class="detail-label">Interview Notes</span>
        <p>${escapeHtml(
          round.notes || "No notes added yet."
        )}</p>
      </div>

      <form
        class="interview-notes-form"
        data-round="${round.roundNumber}">

        <label>
          Add Notes
          <textarea
            name="notes"
            rows="2"
            placeholder="Record interview details or feedback..."
            required></textarea>
        </label>

        <div class="form-actions">
          <button type="submit" class="interview-note-btn">
            Save Notes
          </button>
        </div>
      </form>
    </article>
  `).join("");
}

// Open interview form

addInterviewBtn.addEventListener("click", () => {
  interviewForm.reset();
  interviewFormPanel.classList.remove("hide");
  addInterviewBtn.classList.add("hide");

  interviewFormPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
});

// Cancel interview form

cancelInterviewBtn.addEventListener("click", () => {
  interviewForm.reset();
  interviewFormPanel.classList.add("hide");

  const app = applications.find(
    item => item.id === selectedApplicationId
  );

  if (app?.status === "INTERVIEW") {
    addInterviewBtn.classList.remove("hide");
  }
});

// Schedule interview

interviewForm.addEventListener("submit", async event => {
  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const fields = {
    scheduledAt: $("interviewDateTime").value,
    type: $("interviewType").value,
    format: $("interviewFormat").value
  };

  saveInterviewBtn.disabled = true;

  try {
    const response = await postForm(
      `${API}/${encodeURIComponent(applicationId)}/interviews`,
      fields
    );

    await readResponse(response, "Could not add interview.");

    interviewForm.reset();
    interviewFormPanel.classList.add("hide");

    if (selectedApplicationId === applicationId) {
      addInterviewBtn.classList.remove("hide");
      await loadInterviews(applicationId);
    }
  } catch (error) {
    alert(error.message);
  } finally {
    saveInterviewBtn.disabled = false;
  }
});

// Save interview notes

interviewList.addEventListener("submit", async event => {
  const notesForm = event.target.closest(
    ".interview-notes-form"
  );

  if (!notesForm) return;
  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const roundNumber = notesForm.dataset.round;
  const notes = notesForm.elements.notes.value.trim();

  if (!notes) return;

  const submitBtn = notesForm.querySelector(
    'button[type="submit"]'
  );

  submitBtn.disabled = true;

  try {
    const response = await postForm(
      `${API}/${encodeURIComponent(applicationId)}` +
      `/interviews/${roundNumber}/notes`,
      { notes }
    );

    await readResponse(
      response,
      "Could not save interview notes."
    );

    if (selectedApplicationId === applicationId) {
      await loadInterviews(applicationId);
    }
  } catch (error) {
    alert(error.message);
    submitBtn.disabled = false;
  }
});

// Application form

function setFormMode(isEditing) {
  $("formTitle").textContent = isEditing
    ? "Edit Application"
    : "Add New Application";

  $("saveApplicationBtn").textContent = isEditing
    ? "Save Changes"
    : "Save Application";

  $("status").disabled = false;

  if (!isEditing) {
    $("status").value = "PLANNED";
  }
}

// Add application

addBtn.addEventListener("click", () => {
  editingApplicationId = null;
  form.reset();
  setFormMode(false);

  $("applicationDate").value = todayLocal();

  formPanel.classList.remove("hide");

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

// Open application details

document.querySelector(".tracker-board").addEventListener(
  "click",
  event => {
    const button = event.target.closest(".details-link");

    if (button) {
      showDetails(button.dataset.id);
    }
  }
);

// Close details

closeDetailsBtn.addEventListener("click", () => {
  detailsPanel.classList.add("hide");
  selectedApplicationId = null;
});

// Edit application

editBtn.addEventListener("click", () => {
  const app = applications.find(
    item => item.id === selectedApplicationId
  );

  if (!app) return;

  editingApplicationId = app.id;

  form.reset();
  setFormMode(true);

  $("employer").value = app.employer;
  $("role").value = app.role;
  $("applicationDate").value = app.applicationDate || "";
  $("source").value = app.source;
  $("deadline").value = app.deadline || "";
  $("status").value = app.status;
  $("notes").value = app.notes || "";

  formPanel.classList.remove("hide");

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

// Cancel application form

cancelBtn.addEventListener("click", () => {
  formPanel.classList.add("hide");
  form.reset();
  editingApplicationId = null;
});

// Create or update application

form.addEventListener("submit", async event => {
  event.preventDefault();

  const fields = {
    employer: $("employer").value.trim(),
    role: $("role").value.trim(),
    applicationDate: $("applicationDate").value,
    source: $("source").value.trim(),
    deadline: $("deadline").value,
    status: $("status").value,
    notes: $("notes").value.trim()
  };

  const isEditing = editingApplicationId !== null;

  const url = isEditing
    ? `${API}/${encodeURIComponent(editingApplicationId)}`
    : API;

  const saveBtn = $("saveApplicationBtn");
  saveBtn.disabled = true;

  try {
    const response = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams(fields).toString()
    });

    const result = await readResponse(
      response,
      "Could not save application."
    );

    const savedId = result.id ?? editingApplicationId;

    await loadApplications();

    form.reset();
    formPanel.classList.add("hide");
    editingApplicationId = null;

    if (!detailsPanel.classList.contains("hide") && savedId != null) {
      await showDetails(savedId);
    }
  } catch (error) {
    alert(error.message);
  } finally {
    saveBtn.disabled = false;
  }
});

// Startup

loadApplications().catch(error => {
  alert(error.message);
});
