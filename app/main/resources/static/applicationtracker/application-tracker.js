
const API = "/api/applications";
const READINESS_API = "/api/readiness";

const addBtn = document.getElementById("addApplicationBtn");
const cancelBtn = document.getElementById("cancelApplicationBtn");
const formPanel = document.getElementById("applicationFormPanel");
const form = document.getElementById("applicationForm");
const detailsPanel = document.getElementById("detailsPanel");
const detailsContent = document.getElementById("detailsContent");
const closeDetailsBtn = document.getElementById("closeDetailsBtn");
const editBtn = document.getElementById("editApplicationBtn");

// interview elements
const interviewList = document.getElementById("interviewList");
const interviewCount = document.getElementById("interviewCount");
const interviewFormPanel = document.getElementById("interviewFormPanel");
const interviewForm = document.getElementById("interviewForm");
const addInterviewBtn = document.getElementById("addInterviewBtn");
const cancelInterviewBtn = document.getElementById("cancelInterviewBtn");
const saveInterviewBtn = document.getElementById("saveInterviewBtn");
const interviewStatusMessage =
  document.getElementById("interviewStatusMessage");

// readiness elements
const readinessList = document.getElementById("readinessList");
const readinessAddForm = document.getElementById("readinessAddForm");

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
    "APPLIED", "ONLINE_ASSESSMENT", "PHONE_SCREEN",
    "INTERVIEW", "OFFER"
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

// escape text before inserting into HTML
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

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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

// render one application card
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

// display applications in their status columns
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

// display selected application and its interviews
async function showDetails(id) {
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

  const canAddInterview = app.status === "INTERVIEW";

  addInterviewBtn.classList.toggle("hide", !canAddInterview);
  interviewStatusMessage.classList.toggle("hide", canAddInterview);

  interviewFormPanel.classList.add("hide");
  interviewForm.reset();

  detailsPanel.classList.remove("hide");
  detailsPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  await loadInterviews(id);
}

// retrieve interview rounds from Java backend
async function loadInterviews(applicationId) {
  interviewList.innerHTML =
    '<p class="mute">Loading interviews...</p>';

  try {
    const response = await fetch(
      `${API}/${encodeURIComponent(applicationId)}/interviews`
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not load interviews.");
    }

    if (selectedApplicationId !== applicationId) return;

    renderInterviews(result);
  } catch (error) {
    if (selectedApplicationId !== applicationId) return;

    interviewList.innerHTML = `
      <p class="interview-error">${escapeHtml(error.message)}</p>
    `;
  }
}

// display interview rounds
function renderInterviews(rounds) {
  interviewCount.textContent =
    `${rounds.length} ${rounds.length === 1 ? "round" : "rounds"}`;

  if (rounds.length === 0) {
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
            ${escapeHtml(interviewTypeLabels[round.type] || round.type)}
          </h4>
          <p class="mute">
            ${escapeHtml(formatInterviewDate(round.scheduledAt))}
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
        <p>${escapeHtml(round.notes || "No notes added yet.")}</p>
      </div>

      <form class="interview-notes-form"
            data-round="${round.roundNumber}">
        <label>
          Add Notes
          <textarea name="notes" rows="2"
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

// show interview scheduling form
addInterviewBtn.addEventListener("click", () => {
  interviewForm.reset();
  interviewFormPanel.classList.remove("hide");
  addInterviewBtn.classList.add("hide");

  interviewFormPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });
});

// cancel interview scheduling
cancelInterviewBtn.addEventListener("click", () => {
  interviewForm.reset();
  interviewFormPanel.classList.add("hide");

  const app = applications.find(
    item => item.id === selectedApplicationId
  );

  if (app && app.status === "INTERVIEW") {
    addInterviewBtn.classList.remove("hide");
  }
});

// schedule a new interview round
interviewForm.addEventListener("submit", async event => {
  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const data = new URLSearchParams({
    scheduledAt: document.getElementById("interviewDateTime").value,
    type: document.getElementById("interviewType").value,
    format: document.getElementById("interviewFormat").value
  });

  saveInterviewBtn.disabled = true;

  try {
    const response = await fetch(
      `${API}/${encodeURIComponent(applicationId)}/interviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: data.toString()
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not add interview.");
    }

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

// save notes for an interview round
interviewList.addEventListener("submit", async event => {
  const notesForm = event.target.closest(".interview-notes-form");
  if (!notesForm) return;

  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const roundNumber = notesForm.dataset.round;
  const notes = notesForm.elements.notes.value.trim();

  if (!notes) return;

  const submitBtn = notesForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const response = await fetch(
      `${API}/${encodeURIComponent(applicationId)}/interviews/${roundNumber}/notes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({notes}).toString()
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || "Could not save interview notes."
      );
    }

    if (selectedApplicationId === applicationId) {
      await loadInterviews(applicationId);
    }
  } catch (error) {
    alert(error.message);
    submitBtn.disabled = false;
  }
});

// application form mode
function setFormMode(isEditing) {
  document.getElementById("formTitle").textContent =
    isEditing ? "Edit Application" : "Add New Application";

  document.getElementById("saveApplicationBtn").textContent =
    isEditing ? "Save Changes" : "Save Application";

  const status = document.getElementById("status");
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

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

document.querySelector(".tracker-board").addEventListener(
  "click", event => {
    const button = event.target.closest(".details-link");

    if (button) {
      showDetails(button.dataset.id);
    }
  }
);

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
  document.getElementById("applicationDate").value =
    app.applicationDate || "";
  document.getElementById("source").value = app.source;
  document.getElementById("deadline").value = app.deadline || "";
  document.getElementById("status").value = app.status;
  document.getElementById("notes").value = app.notes || "";

  formPanel.classList.remove("hide");

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

cancelBtn.addEventListener("click", () => {
  formPanel.classList.add("hide");
  form.reset();
  editingApplicationId = null;
});

// create or update an application
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
      await showDetails(savedId);
    }
  } catch (error) {
    alert(error.message);
  }
});

// readiness API helper
async function readinessRequest(path = "", fields = null) {
  const options = fields === null ? {} : {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams(fields).toString()
  };

  const response = await fetch(`${READINESS_API}${path}`, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.error || "Could not update readiness checklist."
    );
  }

  return result;
}

// display readiness tasks and progress
function renderReadiness(data) {
  const percent = data.total === 0
    ? 0
    : Math.round(100 * data.completed / data.total);

  document.getElementById("readinessProgressLabel").textContent =
    `${data.completed} of ${data.total} complete (${percent}%)`;

  document.getElementById("readinessProgressFill").style.width =
    `${percent}%`;

  document.getElementById("readinessProgress")
    .setAttribute("aria-valuenow", percent);

  if (!data.items.length) {
    readinessList.innerHTML =
      '<p class="mute">No readiness tasks yet.</p>';
    return;
  }

  const categories = [
    ...new Set(data.items.map(item => item.category))
  ];

  readinessList.innerHTML = categories.map(category => {
    const tasks = data.items.filter(
      item => item.category === category
    );

    return `
      <div class="readiness-category">
        <h3>${escapeHtml(category)}</h3>

        ${tasks.map(item => {
          const link = item.externalLink
            && /^https?:\/\//i.test(item.externalLink)
            ? `
              <a href="${escapeHtml(item.externalLink)}"
                 target="_blank"
                 rel="noopener noreferrer">
                Open Link
              </a>
            `
            : "";

          const custom = item.category === "Custom";

          return `
            <div class="readiness-item ${item.done ? "is-done" : ""}"
                 data-number="${item.number}">

              <label class="readiness-task">
                <input type="checkbox"
                       class="readiness-toggle"
                       ${item.done ? "checked" : ""}>

                <span>${escapeHtml(item.title)}</span>
              </label>

              <div class="readiness-item-actions">
                ${link}

                <button type="button" data-action="link">
                  ${item.externalLink ? "Edit Link" : "Add Link"}
                </button>

                ${custom ? `
                  <button type="button" data-action="rename">
                    Rename
                  </button>

                  <button type="button"
                          data-action="remove"
                          class="readiness-remove">
                    Remove
                  </button>
                ` : ""}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }).join("");
}

// load readiness checklist
async function loadReadiness() {
  renderReadiness(await readinessRequest());
}

// add custom readiness task
readinessAddForm.addEventListener("submit", async event => {
  event.preventDefault();

  const input = document.getElementById("readinessNewTitle");
  const title = input.value.trim();

  if (!title) return;

  try {
    renderReadiness(
      await readinessRequest("/items", {title})
    );

    readinessAddForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

// toggle readiness completion
readinessList.addEventListener("change", async event => {
  if (!event.target.matches(".readiness-toggle")) return;

  const number = event.target.closest(".readiness-item")
    .dataset.number;

  event.target.disabled = true;

  try {
    renderReadiness(
      await readinessRequest("/toggle", {number})
    );
  } catch (error) {
    alert(error.message);
    await loadReadiness().catch(() => {});
  }
});

// manage custom tasks and external links
readinessList.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const number = button.closest(".readiness-item")
    .dataset.number;

  const action = button.dataset.action;
  let path;
  const fields = {number};

  if (action === "remove") {
    if (!confirm("Remove this custom task?")) return;
    path = "/items/remove";

  } else if (action === "rename") {
    const title = prompt("Enter a new task name:");
    if (title === null) return;

    if (!title.trim()) {
      alert("Task name cannot be empty.");
      return;
    }

    path = "/items/rename";
    fields.title = title.trim();

  } else if (action === "link") {
    const link = prompt(
      "Enter a full URL (https://...), or leave blank to remove:"
    );

    if (link === null) return;

    if (link.trim() && !/^https?:\/\//i.test(link.trim())) {
      alert("Use a link starting with https:// or http://.");
      return;
    }

    path = "/items/link";
    fields.link = link.trim();

  } else {
    return;
  }

  button.disabled = true;

  try {
    renderReadiness(
      await readinessRequest(path, fields)
    );
  } catch (error) {
    alert(error.message);
    button.disabled = false;
  }
});

// mark every task complete
document.getElementById("readinessCompleteAll")
  .addEventListener("click", async () => {
    try {
      renderReadiness(
        await readinessRequest("/complete-all", {})
      );
    } catch (error) {
      alert(error.message);
    }
  });

// reset checklist completion
document.getElementById("readinessReset")
  .addEventListener("click", async () => {
    if (!confirm("Mark every readiness task incomplete?")) {
      return;
    }

    try {
      renderReadiness(
        await readinessRequest("/reset", {})
      );
    } catch (error) {
      alert(error.message);
    }
  });

// load application and readiness data on startup
loadApplications().catch(error => {
  alert(error.message);
});

loadReadiness().catch(error => {
  readinessList.innerHTML = `
    <p class="interview-error">
      ${escapeHtml(error.message)}
    </p>
  `;
});
