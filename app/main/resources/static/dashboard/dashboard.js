const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = d => new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const fmtDay = d => new Date(d + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const TRACKER_URL = "../applicationtracker/application-tracker.html";

let apps = [], list = [];
const rounds = a => a.interviews || [];
const upcoming = a => rounds(a).filter(i => new Date(i.at) >= NOW).sort((x, y) => new Date(x.at) - new Date(y.at));
const notSubmitted = a => a.status === "PLANNED" || a.status === "IN_PROGRESS";

// ---- Board: one column per stage ----
function board() {
  const act = apps.filter(a => a.stage);
  document.getElementById("board").innerHTML = STAGES.map(s => {
    const l = act.filter(a => a.stage === s);
    const cards = l.length ? l.map(card).join("") : '<p class="mute">Nothing here yet.</p>';
    return `<div class="col"><h3>${s}<span class="count">${l.length}</span></h3>${cards}</div>`;
  }).join("");
}

function card(a) {
  const next = upcoming(a)[0];
  const due = a.deadline && notSubmitted(a) ? `<span class="due">Due ${fmtDay(a.deadline)}</span>` : "";
  return `<a class="card" href="${TRACKER_URL}"><b>${esc(a.employer)}</b><span>${esc(a.role)}</span>${due}` +
    (next ? `<div class="next">Next: ${fmt(next.at)}<br>${esc(next.type)}, ${esc(next.format)}</div>` : "") +
    `</a>`;
}

// ---- Upcoming interviews panel (all applications, soonest first) ----
function upcomingPanel() {
  const up = apps.filter(a => a.active)
    .flatMap(a => upcoming(a).map(i => ({ ...i, e: a.employer })))
    .sort((x, y) => new Date(x.at) - new Date(y.at));
  document.getElementById("upcoming").innerHTML = up.length
    ? up.map(i => `<div class="row"><span class="when">${fmt(i.at)}</span><span>${esc(i.e)}, ${esc(i.type)}</span></div>`).join("")
    : '<p class="mute">No interviews scheduled.</p>';
}

// ---- Interviews tab: every round for every active application ----
function roundsView() {
  const act = apps.filter(a => a.active && rounds(a).length);
  document.getElementById("rounds").innerHTML = act.length
    ? act.map(a => `<h3>${esc(a.employer)} <span class="mute">${esc(a.role)}</span></h3>` +
        rounds(a).slice().sort((x, y) => new Date(x.at) - new Date(y.at))
          .map(i => `<div class="row"><span class="when">${fmt(i.at)}</span><span>Round ${i.round}: ${esc(i.type)}, ${esc(i.format)}</span></div>`).join("")).join("")
    : '<p class="mute">No interview rounds yet.</p>';
}

// ---- Readiness checklist (shared with the Checklist page) ----
function checklist() {
  const done = list.filter(x => x.done).length, p = list.length ? Math.round(done / list.length * 100) : 0;
  document.getElementById("pct").textContent = p + "%";
  document.getElementById("pctnote").textContent = `${done} of ${list.length} done`;
  document.getElementById("fill").style.width = p + "%";
  document.getElementById("checklist").innerHTML =
    (list.length
      ? list.map(x => `<label class="ck"><input type="checkbox" data-id="${x.id}" ${x.done ? "checked" : ""}> ${esc(x.title)}</label>`).join("")
      : '<p class="mute">No checklist items yet.</p>')
    + '<a class="navlink" style="display:inline-block;margin-top:10px" href="../checklist/checklist.html">Open full checklist &rarr;</a>';
  document.querySelectorAll("#checklist input").forEach(c => c.onchange = () => {
    const item = list.find(x => String(x.id) === c.dataset.id);
    if (item) { item.done = c.checked; saveChecklistItems(list); checklist(); }
  });
}

// ---- Tabs ----
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
  document.querySelectorAll("nav button").forEach(x => x.setAttribute("aria-pressed", x === b));
  ["dash", "int"].forEach(v => document.getElementById(v).classList.toggle("hide", v !== b.dataset.v));
});

// ---- Load everything ----
// Applications and checklist load separately, so one failing doesn't blank the other.
function loadApps() {
  return getApplications().then(a => {
    apps = a;
    board(); upcomingPanel(); roundsView();
  }).catch(err => {
    console.error(err);
    const msg = '<p class="mute">Could not load applications. Make sure the Java server is running, then refresh.</p>';
    document.getElementById("board").innerHTML = `<div class="panel">${msg}</div>`;
    document.getElementById("upcoming").innerHTML = msg;
  });
}
function loadChecklist() {
  return getChecklist().then(c => { list = c; checklist(); });
}

loadApps();
loadChecklist();

// Coming back with the Back button (e.g. after editing on the tracker or checklist page): refresh.
window.addEventListener("pageshow", e => { if (e.persisted) { loadApps(); loadChecklist(); } });