// ============================================================================
// Dashboard data: loads REAL data from the Java backend (Application Tracker).
// Replaces the old mock-data.js.
//
//   Applications:     GET /api/applications
//   Interview rounds: GET /api/applications/{id}/interviews
//   Readiness:        checklist-store.js (shared with the Checklist page)
// ============================================================================

// Board columns: one per application status, using the same labels as the
// Application Tracker page. Top row = still in progress, bottom row = outcomes.
const STAGES = [
  "Planned", "Preparing Application", "Applied", "Online Assessment", "Phone Screen",
  "Interview", "Offer Received", "Accepted", "Rejected", "Withdrawn"
];

// Backend status -> board column (same as statusLabels in application-tracker.js).
const STAGE_OF = {
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

// Finished applications (no upcoming interviews shown for these).
const CLOSED = ["ACCEPTED", "REJECTED", "WITHDRAWN"];

// Backend enum names -> readable labels (same labels as the Java enums).
const FORMAT_LABEL = {
  PHONE: "Phone", VIDEO_CALL: "Video call", ON_CAMPUS: "On campus",
  ON_SITE: "On-site at employer", OTHER: "Other"
};
const TYPE_LABEL = {
  RECRUITER_SCREEN: "Recruiter screen", BEHAVIORAL: "Behavioral", TECHNICAL: "Technical",
  CASE: "Case", PANEL: "Panel", FINAL_ROUND: "Final round", OTHER: "Other"
};

const NOW = new Date();

// Interview rounds for one application. A failure here just means "no rounds",
// so one bad request doesn't break the whole dashboard.
async function getInterviews(appId) {
  try {
    const res = await fetch(`/api/applications/${encodeURIComponent(appId)}/interviews`);
    if (!res.ok) return [];
    const rounds = await res.json();
    return rounds.map(r => ({
      round: r.roundNumber,
      at: r.scheduledAt,
      format: FORMAT_LABEL[r.format] || r.format,
      type: TYPE_LABEL[r.type] || r.type,
      notes: r.notes
    }));
  } catch (e) {
    return [];
  }
}

async function getApplications() {
  const res = await fetch("/api/applications");
  if (!res.ok) throw new Error("Applications API returned " + res.status);
  const data = await res.json();

  // Load interview rounds for all applications at the same time.
  const rounds = await Promise.all(data.map(a => getInterviews(a.id)));

  return data.map((a, i) => ({
    ...a,
    stage: STAGE_OF[a.status] || null,
    active: !CLOSED.includes(a.status),
    interviews: rounds[i]
  }));
}

// Readiness checklist: shared with the Checklist page (see checklist/checklist-store.js).
async function getChecklist() {
  return loadChecklistItems();
}