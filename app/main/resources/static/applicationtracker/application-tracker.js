
const API = "/api/applications";
const $ = id => document.getElementById(id);

const form = $("applicationForm");
const formPanel = $("applicationFormPanel");
const saveBtn = $("saveApplicationBtn");
const cancelBtn = $("cancelApplicationBtn");
const addBtn = $("addApplicationBtn");

const detailsPanel = $("detailsPanel");
const detailsContent = $("detailsContent");
const editBtn = $("editApplicationBtn");
const deleteBtn = $("deleteApplicationBtn");
const closeDetailsBtn = $("closeDetailsBtn");

const interviewList = $("interviewList");
const interviewCount = $("interviewCount");
const interviewForm = $("interviewForm");
const interviewFormPanel = $("interviewFormPanel");
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
let deleting = false;
let messageTimer;

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

const typeLabels = {
  RECRUITER_SCREEN: "Recruiter screen",
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  CASE: "Case",
  PANEL: "Panel",
  FINAL_ROUND: "Final round",
  OTHER: "Other"
};

const formatLabels = {
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

const containers = {
  planned: "plannedApplications",
  applied: "appliedApplications",
  past: "pastApplications"
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

function notify(text, type = "success") {
  clearTimeout(messageTimer);

  message.textContent = text;
  message.className = `tracker-message ${type}`;
  message.hidden = false;

  messageTimer = setTimeout(() => {
    message.hidden = true;
  }, 5000);
}

function todayLocal() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDate(value) {
  if (!value) return "Not provided";

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return value;

  const date = new Date(+match[1], +match[2] - 1, +match[3]);

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

function isPlanning(status) {
  return status === "PLANNED" || status === "IN_PROGRESS";
}

function getGroup(status) {
  return Object.keys(groups).find(group =>
    groups[group].includes(status)
  );
}

async function requestJson(url, options) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Cannot connect to the server. Check that it is running."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || `Server request failed (${response.status}).`
    );
  }

  if (data === null) {
    throw new Error("The server returned an invalid response.");
  }

  return data;
}

function renderCard(app) {
  const group = getGroup(app.status);
  const badge = group === "planned" ? "planned"
    : group === "past" ? "past" : "";

  const dateLabel = isPlanning(app.status)
    ? "Deadline"
    : "Applied";

  const dateValue = isPlanning(app.status)
    ? app.deadline
    : app.applicationDate;

  return `
    <article class="card application-card">
      <div class="card-heading">
        <b>${escapeHtml(app.employer)}</b>
        <span class="role">${escapeHtml(app.role)}</span>
      </div>

      <div>
        <span class="status-badge ${badge}">
          ${escapeHtml(statusLabels[app.status] || app.status)}
        </span>
      </div>

      <div class="card-date">
        ${dateLabel}:
        <strong>${escapeHtml(formatDate(dateValue))}</strong>
      </div>

      <div class="card-footer">
        <button type="button"
                class="details-link"
                data-id="${escapeHtml(app.id)}">
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

    $(group + "Count").textContent = filtered.length;

    $(containers[group]).innerHTML = filtered.length
      ? filtered.map(renderCard).join("")
      : '<p class="mute empty-state">No applications yet.</p>';
  }
}

async function loadApplications() {
  const data = await requestJson(API);

  if (!Array.isArray(data)) {
    throw new Error("Invalid application list.");
  }

  applications = data;
  renderApplications();
}

function detailField(label, value, extra = "") {
  return `
    <div class="detail-item ${extra}">
      <span class="detail-label">${escapeHtml(label)}</span>
      <div class="detail-value">${escapeHtml(value)}</div>
    </div>
  `;
}

function clearFieldError(field) {
  field.classList.remove("tracker-invalid");
  field.removeAttribute("aria-invalid");

  const existing = field.parentElement.querySelector(
    `.field-error[data-for="${field.id}"]`
  );

  if (existing) existing.remove();
}

function showFieldError(field, text) {
  clearFieldError(field);

  field.classList.add("tracker-invalid");
  field.setAttribute("aria-invalid", "true");

  const error = document.createElement("span");
  error.className = "field-error";
  error.dataset.for = field.id;
  error.textContent = text;

  field.insertAdjacentElement("afterend", error);
}

function clearErrors(targetForm) {
  targetForm.querySelectorAll(
    "input, select, textarea"
  ).forEach(clearFieldError);
}

function validateRequired(targetForm) {
  clearErrors(targetForm);

  let firstInvalid = null;

  targetForm.querySelectorAll(
    "input, select, textarea"
  ).forEach(field => {
    if (field.disabled) return;

    let error = "";

    if (field.required && !field.value.trim()) {
      error = "This field is required.";
    } else if (!field.checkValidity()) {
      error = field.validationMessage || "Invalid value.";
    }

    if (error) {
      showFieldError(field, error);
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

/* Application date and status validation */

function updateDateRules() {
  const status = $("status").value;
  const date = $("applicationDate");
  const planning = isPlanning(status);

  date.disabled = planning;
  date.required = !planning;
  date.max = todayLocal();

  if (planning) {
    date.value = "";
  }

  $("applicationDateHelp").textContent = planning
    ? "Application date is not applicable until you apply."
    : "Required. Enter the date you actually applied (not a future date).";

  clearFieldError(date);
}

$("status").addEventListener("change", updateDateRules);

function validateApplication() {
  if (!validateRequired(form)) return false;

  const date = $("applicationDate");
  const status = $("status").value;

  if (!isPlanning(status)) {
    if (!date.value) {
      showFieldError(date, "Application date is required.");
      date.focus();
      return false;
    }

    if (date.value > todayLocal()) {
      showFieldError(
        date,
        "Application date cannot be in the future."
      );
      date.focus();
      return false;
    }
  }

  return true;
}

/* Application form */

function setFormMode(editing) {
  $("formTitle").textContent = editing
    ? "Edit Application"
    : "Add New Application";

  saveBtn.textContent = editing
    ? "Save Changes"
    : "Save Application";
}

function openForm() {
  formPanel.classList.remove("hide");

  formPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  $("employer").focus({preventScroll: true});
}

addBtn.addEventListener("click", () => {
  if (applicationSaving || deleting) return;

  editingApplicationId = null;
  form.reset();
  clearErrors(form);
  setFormMode(false);
  updateDateRules();
  openForm();
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

function findSelected() {
  return applications.find(app =>
    String(app.id) === String(selectedApplicationId)
  );
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
        "Status", statusLabels[app.status] || app.status
      )}
      ${detailField(
        "Application Date", formatDate(app.applicationDate)
      )}
      ${detailField("Source", app.source)}
      ${detailField("Deadline", formatDate(app.deadline))}
      ${detailField(
        "Notes", app.notes || "No notes added.", "detail-notes"
      )}
    </div>
  `;

  const canSchedule = app.status === "INTERVIEW";

  addInterviewBtn.classList.toggle("hide", !canSchedule);
  interviewStatusMessage.classList.toggle("hide", canSchedule);
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

closeDetailsBtn.addEventListener("click", () => {
  if (interviewSaving || deleting) return;

  detailsPanel.classList.add("hide");
  interviewFormPanel.classList.add("hide");
  selectedApplicationId = null;
});

editBtn.addEventListener("click", () => {
  if (applicationSaving || deleting) return;

  const app = findSelected();
  if (!app) return;

  editingApplicationId = String(app.id);

  form.reset();
  clearErrors(form);
  setFormMode(true);

  $("employer").value = app.employer || "";
  $("role").value = app.role || "";
  $("source").value = app.source || "";
  $("deadline").value = app.deadline || "";
  $("status").value = app.status;
  $("notes").value = app.notes || "";

  updateDateRules();

  // Legacy planned records might contain a historical date.
  // The new rule intentionally clears it when saving as planned.
  if (!isPlanning(app.status)) {
    $("applicationDate").value = app.applicationDate || "";
  }

  openForm();
});

/* Save application */

form.addEventListener("submit", async event => {
  event.preventDefault();

  if (applicationSaving || !validateApplication()) return;

  const editing = Boolean(editingApplicationId);
  const savedId = editingApplicationId;

  const url = editing
    ? `${API}/${encodeURIComponent(savedId)}`
    : API;

  const payload = new URLSearchParams({
    employer: $("employer").value.trim(),
    role: $("role").value.trim(),
    applicationDate: $("applicationDate").disabled
      ? "" : $("applicationDate").value,
    source: $("source").value.trim(),
    deadline: $("deadline").value,
    status: $("status").value,
    notes: $("notes").value.trim()
  });

  applicationSaving = true;
  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const result = await requestJson(url, {
      method: editing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString()
    });

    formPanel.classList.add("hide");
    form.reset();
    clearErrors(form);
    editingApplicationId = null;

    notify(editing
      ? "Application updated successfully."
      : "Application added successfully.");

    try {
      await loadApplications();

      if (editing && selectedApplicationId === savedId) {
        await showDetails(savedId);
      }
    } catch (error) {
      console.error(error);
      notify(
        "Saved, but the page could not refresh. Reload to see the changes.",
        "error"
      );
    }

  } catch (error) {
    notify(
      error.message + " Your form information is still here.",
      "error"
    );

  } finally {
    applicationSaving = false;
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    setFormMode(Boolean(editingApplicationId));
  }
});

/* Delete application */

deleteBtn.addEventListener("click", async () => {
  if (deleting || applicationSaving || interviewSaving) return;

  const app = findSelected();
  if (!app) return;

  const confirmed = window.confirm(
    `Permanently delete "${app.role}" at "${app.employer}"?\n\n` +
    "This also deletes its interview rounds and notes. " +
    "This action cannot be undone."
  );

  if (!confirmed) return;

  deleting = true;
  deleteBtn.disabled = true;
  editBtn.disabled = true;
  closeDetailsBtn.disabled = true;
  addInterviewBtn.disabled = true;
  deleteBtn.textContent = "Deleting...";

  try {
    await requestJson(
      `${API}/${encodeURIComponent(app.id)}`,
      {method: "DELETE"}
    );

    selectedApplicationId = null;
    editingApplicationId = null;

    detailsPanel.classList.add("hide");
    formPanel.classList.add("hide");

    // Remove from the current display immediately after API success.
    applications = applications.filter(item =>
      String(item.id) !== String(app.id)
    );

    renderApplications();
    notify("Application deleted successfully.");

    try {
      await loadApplications();
    } catch (error) {
      console.error("Could not refresh applications:", error);
      notify(
        "Deleted successfully, but the list could not refresh.",
        "error"
      );
    }

  } catch (error) {
    notify(error.message, "error");

  } finally {
    deleting = false;
    deleteBtn.disabled = false;
    editBtn.disabled = false;
    closeDetailsBtn.disabled = false;
    addInterviewBtn.disabled = false;
    deleteBtn.textContent = "Delete Application";
  }
});

/* Interview integration */

async function loadInterviews(applicationId) {
  interviewList.innerHTML =
    '<p class="mute">Loading interviews...</p>';

  try {
    const rounds = await requestJson(
      `${API}/${encodeURIComponent(applicationId)}/interviews`
    );

    if (!Array.isArray(rounds)) {
      throw new Error("Invalid interview data.");
    }

    if (selectedApplicationId !== applicationId) return;

    renderInterviews(rounds);

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
            ${escapeHtml(typeLabels[round.type] || round.type)}
          </h4>
          <p class="mute">
            ${escapeHtml(formatInterviewDate(round.scheduledAt))}
          </p>
        </div>

        <span class="interview-format">
          ${escapeHtml(formatLabels[round.format] || round.format)}
        </span>
      </div>

      <div class="interview-notes">
        <span class="detail-label">Interview Notes</span>
        <p>${escapeHtml(round.notes || "No notes added yet.")}</p>
      </div>

      <form class="interview-notes-form"
            data-round="${escapeHtml(round.roundNumber)}">
        <label>
          Add Notes
          <textarea name="notes" rows="2" required
            placeholder="Record interview details or feedback..."></textarea>
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

addInterviewBtn.addEventListener("click", () => {
  if (interviewSaving || deleting) return;

  interviewForm.reset();
  clearErrors(interviewForm);

  interviewFormPanel.classList.remove("hide");
  addInterviewBtn.classList.add("hide");

  $("interviewDateTime").focus();
});

cancelInterviewBtn.addEventListener("click", () => {
  if (interviewSaving) return;

  interviewForm.reset();
  clearErrors(interviewForm);
  interviewFormPanel.classList.add("hide");

  if (findSelected()?.status === "INTERVIEW") {
    addInterviewBtn.classList.remove("hide");
  }
});

interviewForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (interviewSaving || !validateRequired(interviewForm)) return;

  const applicationId = selectedApplicationId;
  if (!applicationId) return;

  const payload = new URLSearchParams({
    scheduledAt: $("interviewDateTime").value,
    type: $("interviewType").value,
    format: $("interviewFormat").value
  });

  interviewSaving = true;
  saveInterviewBtn.disabled = true;
  cancelInterviewBtn.disabled = true;
  closeDetailsBtn.disabled = true;
  deleteBtn.disabled = true;
  saveInterviewBtn.textContent = "Saving...";

  try {
    await requestJson(
      `${API}/${encodeURIComponent(applicationId)}/interviews`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: payload.toString()
      }
    );

    notify("Interview round saved successfully.");

    interviewForm.reset();
    interviewFormPanel.classList.add("hide");

    if (selectedApplicationId === applicationId) {
      addInterviewBtn.classList.remove("hide");
      await loadInterviews(applicationId);
    }

  } catch (error) {
    notify(
      error.message + " Your interview details are still here.",
      "error"
    );

  } finally {
    interviewSaving = false;
    saveInterviewBtn.disabled = false;
    cancelInterviewBtn.disabled = false;
    closeDetailsBtn.disabled = false;
    deleteBtn.disabled = false;
    saveInterviewBtn.textContent = "Save Interview";
  }
});

/* Interview notes */

interviewList.addEventListener("submit", async event => {
  const notesForm = event.target.closest(".interview-notes-form");
  if (!notesForm) return;

  event.preventDefault();

  const applicationId = selectedApplicationId;
  if (!applicationId || deleting) return;

  const textarea = notesForm.elements.notes;
  const notes = textarea.value.trim();

  if (!notes) {
    showFieldError(textarea, "Enter a note before saving.");
    textarea.focus();
    return;
  }

  const button = notesForm.querySelector(
    'button[type="submit"]'
  );

  if (button.disabled) return;

  button.disabled = true;
  button.textContent = "Saving...";
  deleteBtn.disabled = true;

  try {
    await requestJson(
      `${API}/${encodeURIComponent(applicationId)}` +
      `/interviews/${encodeURIComponent(notesForm.dataset.round)}/notes`,
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
      error.message + " Your notes are still here.",
      "error"
    );

  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.textContent = "Save Notes";
    }

    deleteBtn.disabled = false;
  }
});

interviewList.addEventListener("input", event => {
  if (event.target.matches("textarea")) {
    clearFieldError(event.target);
  }
});

/* Initial page load */

updateDateRules();

loadApplications().catch(error => {
  console.error(error);
  notify(error.message, "error");
});
