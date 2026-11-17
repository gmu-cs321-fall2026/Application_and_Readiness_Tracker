
/* Application Tracker — usability polish; existing Java API unchanged. */

const API = "/api/applications";
const $ = id => document.getElementById(id);

const addBtn = $("addApplicationBtn");
const cancelBtn = $("cancelApplicationBtn");
const formPanel = $("applicationFormPanel");
const form = $("applicationForm");
const saveApplicationBtn = $("saveApplicationBtn");

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

const message = $("trackerMessage");

let applications = [];
let selectedApplicationId = null;
let editingApplicationId = null;
let applicationSaving = false;
let interviewSaving = false;
let messageTimeout;

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

/* Helpers */

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function notify(text, type = "success") {
  clearTimeout(messageTimeout);

  message.textContent = text;
  message.className = `tracker-message ${type}`;
  message.hidden = false;

  messageTimeout = setTimeout(() => {
    message.hidden = true;
  }, 5000);
}

function formatDate(value) {
  if (!value) return "Not provided";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;

  const date = new Date(
    +match[1],
    +match[2] - 1,
    +match[3]
  );

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
}

function formatInterviewDate(value) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });
}

function todayLocal() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getGroup(status) {
  return Object.keys(groups).find(group =>
    groups[group].includes(status)
  );
}

/* Application Cards */

function renderCard(app) {
  const group = getGroup(app.status);

  const badge = group === "planned"
    ? "planned"
    : group === "past"
      ? "past"
      : "";

  const dateLabel = group === "past"
    ? "Application date"
    : "Deadline";

  const dateValue = group === "past"
    ? app.applicationDate
    : app.deadline;

  return `
    <article class="card application-card">
      <div class="card-heading">
        <div>
          <b>${escapeHtml(app.employer)}</b>
          <span class="role">${escapeHtml(app.role)}</span>
        </div>
      </div>

      <div>
        <span class="status-badge ${badge}">
          ${escapeHtml(statusLabels[app.status] || app.status)}
        </span>
      </div>

      <div class="card-date">
        <span>${dateLabel}:</span>
        <strong>${escapeHtml(formatDate(dateValue))}</strong>
      </div>

      <div class="card-footer">
        <button
          type="button"
          class="details-link"
          data-id="${escapeHtml(app.id)}"
          aria-label="View application details for ${escapeHtml(app.employer)}">
          View Application Details →
        </button>
      </div>
    </article>
  `;
}

function renderApplications() {
  for (const group of Object.keys(groups)) {
    const filtered = applications.filter(app =>
      groups[group].includes(app.status)
    );

    $(sections[group].count).textContent = filtered.length;

    $(sections[group].container).innerHTML = filtered.length
      ? filtered.map(renderCard).join("")
      : '<p class="mute empty-state">No applications yet.</p>';
  }
}

/* Backend API */

async function requestJson(url, options) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that it is running and try again."
    );
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error || `Request failed (${response.status}).`
    );
  }

  if (result === null) {
    throw new Error("The server returned an unexpected response.");
  }

  return result;
}

async function loadApplications() {
  const result = await requestJson(API);

  if (!Array.isArray(result)) {
    throw new Error("The application list has an unexpected format.");
  }

  applications = result;
  renderApplications();
}

/* Application Details */

function detailField(label, value, extraClass = "") {
  return `
    <div class="detail-item ${extraClass}">
      <span class="detail-label">${escapeHtml(label)}</span>
      <div class="detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

async function showDetails(id) {
  const app = applications.find(item =>
    String(item.id) === String(id)
  );

  if (!app) return;

  selectedApplicationId = String(app.id);

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

  const canAdd = app.status === "INTERVIEW";

  addInterviewBtn.classList.toggle("hide", !canAdd);
  interviewStatusMessage.classList.toggle("hide", canAdd);

  interviewFormPanel.classList.add("hide");
  interviewForm.reset();
  clearErrors(interviewForm);

  detailsPanel.classList.remove("hide");

  detailsPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  await loadInterviews(String(app.id));
}

/* Interview Rounds */

async function loadInterviews(applicationId) {
  interviewList.innerHTML =
    '<p class="mute">Loading interviews...</p>';

  try {
    const result = await requestJson(
      `${API}/${encodeURIComponent(applicationId)}/interviews`
    );

    if (!Array.isArray(result)) {
      throw new Error("The interview list has an unexpected format.");
    }

    if (selectedApplicationId !== applicationId) return;

    renderInterviews(result);

  } catch (error) {
    if (selectedApplicationId !== applicationId) return;

    interviewCount.textContent = "—";

    interviewList.innerHTML = `
      <p class="interview-error" role="alert">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}

function renderInterviews(rounds) {
  const sorted = [...rounds].sort(
    (a, b) => Number(a.roundNumber) - Number(b.roundNumber)
  );

  interviewCount.textContent =
    `${sorted.length} ${sorted.length === 1 ? "round" : "rounds"}`;

  if (!sorted.length) {
    interviewList.innerHTML =
      '<p class="mute empty-state">No interview rounds recorded yet.</p>';
    return;
  }

  interviewList.innerHTML = sorted.map(round => `
    <article class="interview-card">
      <div class="interview-card-header">
        <div>
          <h4>
            Round ${escapeHtml(round.roundNumber)} —
            ${escapeHtml(
              interviewTypeLabels[round.type] || round.type
            )}
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
        <p>${escapeHtml(
          round.notes || "No notes added yet."
        )}</p>
      </div>

      <form
        class="interview-notes-form"
        data-round="${escapeHtml(round.roundNumber)}">

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

/* Form Validation */

function clearFieldError(field) {
  field.classList.remove("tracker-invalid");
  field.removeAttribute("aria-invalid");

  const error = field.closest("label")?.querySelector(".field-error");

  if (error) error.remove();
}

function clearErrors(targetForm) {
  targetForm.querySelectorAll(
    "input, select, textarea"
  ).forEach(clearFieldError);
}

function invalidField(field, text) {
  clearFieldError(field);

  field.classList.add("tracker-invalid");
  field.setAttribute("aria-invalid", "true");

  const error = document.createElement("span");
  error.className = "field-error";
  error.textContent = text;

  field.insertAdjacentElement("afterend", error);
}

function validate(targetForm) {
  clearErrors(targetForm);

  let firstInvalid = null;

  targetForm.querySelectorAll(
    "input, select, textarea"
  ).forEach(field => {
    if (field.disabled) return;

    let text = "";

    if (field.required && !field.value.trim()) {
      text = "This field is required.";
    } else if (!field.checkValidity()) {
      text = field.validationMessage || "Enter a valid value.";
    }

    if (text) {
      invalidField(field, text);
      if (!firstInvalid) firstInvalid = field;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    notify("Please correct the highlighted fields.", "error");
    return false;
  }

  return true;
}

for (const targetForm of [form, interviewForm]) {
  targetForm.noValidate = true;

  targetForm.addEventListener("input", event => {
    if (event.target.matches("input, textarea")) {
      clearFieldError(event.target);
    }
  });

  targetForm.addEventListener("change", event => {
    if (event.target.matches("input, select, textarea")) {
      clearFieldError(event.target);
    }
  });
}

/* Add/Edit Application */

function setFormMode(isEditing) {
  $("formTitle").textContent = isEditing
    ? "Edit Application"
    : "Add New Application";

  saveApplicationBtn.textContent = isEditing
    ? "Save Changes"
    : "Save Application";

  $("status").disabled = false;

  if (!isEditing) {
    $("status").value = "PLANNED";
  }
}

function openApplicationForm() {
  formPanel.classList.remove("hide");

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  $("employer").focus({preventScroll: true});
}

addBtn.addEventListener("click", () => {
  if (applicationSaving) return;

  editingApplicationId = null;
  form.reset();
  clearErrors(form);
  setFormMode(false);

  $("applicationDate").value = todayLocal();

  openApplicationForm();
});

cancelBtn.addEventListener("click", () => {
  if (applicationSaving) return;

  formPanel.classList.add("hide");
  form.reset();
  clearErrors(form);

  editingApplicationId = null;
});

document.querySelector(".tracker-board").addEventListener(
  "click",
  event => {
    const button = event.target.closest(".details-link");

    if (button) {
      showDetails(button.dataset.id);
    }
  }
);

closeDetailsBtn.addEventListener("click", () => {
  if (interviewSaving) return;

  detailsPanel.classList.add("hide");
  interviewFormPanel.classList.add("hide");

  selectedApplicationId = null;
});

editBtn.addEventListener("click", () => {
  if (applicationSaving) return;

  const app = applications.find(item =>
    String(item.id) === selectedApplicationId
  );

  if (!app) return;

  editingApplicationId = String(app.id);

  form.reset();
  clearErrors(form);
  setFormMode(true);

  $("employer").value = app.employer || "";
  $("role").value = app.role || "";
  $("applicationDate").value = app.applicationDate || "";
  $("source").value = app.source || "";
  $("deadline").value = app.deadline || "";
  $("status").value = app.status;
  $("notes").value = app.notes || "";

  openApplicationForm();
});

/* Save Application */

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (applicationSaving || !validate(form)) return;

  const isEditing = Boolean(editingApplicationId);

  const url = isEditing
    ? `${API}/${encodeURIComponent(editingApplicationId)}`
    : API;

  const data = new URLSearchParams({
    employer: $("employer").value.trim(),
    role: $("role").value.trim(),
    applicationDate: $("applicationDate").value,
    source: $("source").value.trim(),
    deadline: $("deadline").value,
    status: $("status").value,
    notes: $("notes").value.trim()
  });

  applicationSaving = true;

  saveApplicationBtn.disabled = true;
  cancelBtn.disabled = true;
  saveApplicationBtn.textContent = "Saving...";

  try {
    const result = await requestJson(url, {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data.toString()
    });

    notify(
      isEditing
        ? "Application updated successfully."
        : "Application added successfully."
    );

    form.reset();
    clearErrors(form);
    formPanel.classList.add("hide");

    editingApplicationId = null;

    try {
      await loadApplications();

      if (
        !detailsPanel.classList.contains("hide") &&
        result.id != null
      ) {
        await showDetails(String(result.id));
      }

    } catch (error) {
      notify(
        "Saved, but the application list could not refresh. Reload the page to see the update.",
        "error"
      );

      console.error(error);
    }

  } catch (error) {
    notify(
      `${error.message} Your entered information is still here.`,
      "error"
    );

  } finally {
    applicationSaving = false;

    saveApplicationBtn.disabled = false;
    cancelBtn.disabled = false;

    setFormMode(Boolean(editingApplicationId));
  }
});

/* Schedule Interview */

addInterviewBtn.addEventListener("click", () => {
  if (interviewSaving) return;

  interviewForm.reset();
  clearErrors(interviewForm);

  interviewFormPanel.classList.remove("hide");
  addInterviewBtn.classList.add("hide");

  interviewFormPanel.scrollIntoView({
    behavior: "smooth",
    block: "nearest"
  });

  $("interviewDateTime").focus({preventScroll: true});
});

cancelInterviewBtn.addEventListener("click", () => {
  if (interviewSaving) return;

  interviewForm.reset();
  clearErrors(interviewForm);

  interviewFormPanel.classList.add("hide");

  const app = applications.find(item =>
    String(item.id) === selectedApplicationId
  );

  if (app?.status === "INTERVIEW") {
    addInterviewBtn.classList.remove("hide");
  }
});

interviewForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (interviewSaving || !validate(interviewForm)) return;

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const data = new URLSearchParams({
    scheduledAt: $("interviewDateTime").value,
    type: $("interviewType").value,
    format: $("interviewFormat").value
  });

  interviewSaving = true;

  saveInterviewBtn.disabled = true;
  cancelInterviewBtn.disabled = true;
  closeDetailsBtn.disabled = true;
  saveInterviewBtn.textContent = "Saving...";

  try {
    await requestJson(
      `${API}/${encodeURIComponent(applicationId)}/interviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: data.toString()
      }
    );

    notify("Interview round saved successfully.");

    interviewForm.reset();
    clearErrors(interviewForm);
    interviewFormPanel.classList.add("hide");

    if (selectedApplicationId === applicationId) {
      addInterviewBtn.classList.remove("hide");
      await loadInterviews(applicationId);
    }

  } catch (error) {
    notify(
      `${error.message} Your interview details are still here.`,
      "error"
    );

  } finally {
    interviewSaving = false;

    saveInterviewBtn.disabled = false;
    cancelInterviewBtn.disabled = false;
    closeDetailsBtn.disabled = false;
    saveInterviewBtn.textContent = "Save Interview";
  }
});

/* Save Interview Notes */

interviewList.addEventListener("submit", async event => {
  const notesForm = event.target.closest(".interview-notes-form");
  if (!notesForm) return;

  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const notes = notesForm.elements.notes.value.trim();

  if (!notes) {
    invalidField(
      notesForm.elements.notes,
      "Enter a note before saving."
    );

    notesForm.elements.notes.focus();
    return;
  }

  const button = notesForm.querySelector(
    'button[type="submit"]'
  );

  if (button.disabled) return;

  const roundNumber = notesForm.dataset.round;

  button.disabled = true;
  button.textContent = "Saving...";

  try {
    await requestJson(
      `${API}/${encodeURIComponent(applicationId)}/interviews/${encodeURIComponent(roundNumber)}/notes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({notes}).toString()
      }
    );

    notify("Interview notes saved successfully.");

    if (selectedApplicationId === applicationId) {
      await loadInterviews(applicationId);
    }

  } catch (error) {
    notify(
      `${error.message} Your notes are still here.`,
      "error"
    );

  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = "Save Notes";
    }
  }
});

interviewList.addEventListener("input", event => {
  if (event.target.matches(".interview-notes-form textarea")) {
    clearFieldError(event.target);
  }
});

/* Initialize Application Tracker */

loadApplications().catch(error => {
  console.error("Could not load applications:", error);
  notify(error.message, "error");
});
