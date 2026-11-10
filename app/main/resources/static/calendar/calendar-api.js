/* Backend calls for the calendar page. Interviews and the readiness checklist are read from the
   endpoints the Interview Stage Tracker and Readiness Checklist already provide; only notes are new.
   Subsystem 3 (career events) is deliberately not handled here; the calendar page does that itself. */
const CalendarApi = (() => {
  async function request(url, options) {
    const response = await fetch(url, options);
    let body = null;
    try { body = await response.json(); } catch (e) { /* no JSON body */ }
    if (!response.ok) throw new Error((body && body.error) || "Request failed: " + response.status);
    return body;
  }

  const form = fields => ({
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields).toString()
  });

  // "PHONE_SCREEN" -> "phone-screen" (the keys the calendar's stage filter uses)
  const statusKey = status => String(status || "").toLowerCase().replaceAll("_", "-");

  const getApplications = () => request("/api/applications");

  // Rounds are kept per application, so ask for each application's rounds and attach the application.
  async function getInterviews(applications) {
    const results = await Promise.allSettled(applications.map(app =>
      request("/api/applications/" + encodeURIComponent(app.id) + "/interviews")
        .then(rounds => rounds.map(round => ({ ...round, application: app })))));
    return results.filter(r => r.status === "fulfilled").flatMap(r => r.value);
  }

  // { items: [{ number, title, category, done, externalLink }], completed, total }
  const getReadiness = () => request("/api/readiness");
  // The server flips one task and returns the whole checklist, so every page sees the same state.
  const toggleReadiness = number => request("/api/readiness/toggle", { method: "POST", ...form({ number }) });

  // Calendar notes: one object of { "d:2026-11-10": text, "e:<eventId>": text }. Empty text clears a note.
  const getNotes = () => request("/api/calendar/notes");
  const saveNote = (key, text) => request("/api/calendar/notes", { method: "PUT", ...form({ key, text }) });

  return { statusKey, getApplications, getInterviews, getReadiness, toggleReadiness, getNotes, saveNote };
})();
