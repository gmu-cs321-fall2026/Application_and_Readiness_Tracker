// ============================================================================
// Readiness Checklist — front-end view
//
// Mirrors the structure of application-tracker.js. Right now it runs on LOCAL
// MOCK DATA so the page works on its own. To use real data from the Java
// backend later, replace loadChecklist() with a fetch() call to an endpoint
// such as "/api/checklist" (the same way application-tracker.js uses
// "/api/applications"), and point the toggle/add/remove handlers at that API.
// ============================================================================

// ---- MOCK DATA: replace with a call to the Java backend (/api/checklist) ----
// Shape matches the Java ChecklistItem: title, category, done, link, custom.
// (The dashboard's simpler widget uses {t, d}; map title->t and done->d there.)
let items = [
  {id: 1, title: "Resume drafted",                     category: "Documents",       done: false, link: null, custom: false},
  {id: 2, title: "Resume reviewed by Career Services", category: "Documents",       done: false, link: null, custom: false},
  {id: 3, title: "References identified",               category: "Documents",       done: false, link: null, custom: false},
  {id: 4, title: "LinkedIn profile updated",           category: "Online presence", done: false, link: null, custom: false},
  {id: 5, title: "Portfolio / GitHub current",         category: "Online presence", done: false, link: null, custom: false},
  {id: 6, title: "Elevator pitch practiced",           category: "Interview prep",  done: false, link: null, custom: false},
  {id: 7, title: "Mock interview completed",           category: "Interview prep",  done: false, link: null, custom: false},
  {id: 8, title: "Target company list built",          category: "Research",        done: false, link: null, custom: false}
];
let nextId = 9;   // used to give new custom items a unique id
// ----------------------------------------------------------------------------

const listEl = document.getElementById("checklist");
const progressLabel = document.getElementById("progressLabel");
const progressPct = document.getElementById("progressPct");
const progressFill = document.getElementById("progressFill");
const newItemInput = document.getElementById("newItemTitle");
const addBtn = document.getElementById("addItemBtn");

// Escape user-entered text before putting it in HTML (same helper the other views use).
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function renderProgress() {
  const done = items.filter(i => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  progressLabel.textContent = `${done} of ${items.length} complete`;
  progressPct.textContent = `${pct}%`;
  progressFill.style.width = `${pct}%`;
}

function renderItemCard(item) {
  const linkHtml = item.link
    ? `<a class="item-link" href="${escapeHtml(item.link)}" target="_blank" rel="noopener">link</a>`
    : "";

  // Only custom items get a remove button (defaults are protected, same as the Java version).
  const removeHtml = item.custom
    ? `<button type="button" class="item-remove" data-id="${item.id}">remove</button>`
    : "";

  return `
    <label class="checklist-item ${item.done ? "is-done" : ""}">
      <input type="checkbox" data-id="${item.id}" ${item.done ? "checked" : ""}>
      <span class="item-body">
        <span class="item-title">${escapeHtml(item.title)}</span>
        <span class="item-meta">
          ${item.category ? `<span class="item-cat">${escapeHtml(item.category)}</span>` : ""}
          ${linkHtml}
        </span>
      </span>
      ${removeHtml}
    </label>
  `;
}

function render() {
  listEl.innerHTML = items.length
    ? items.map(renderItemCard).join("")
    : '<p class="mute">No checklist items.</p>';
  renderProgress();
}

// ---- interactions (update local data, then re-render) ----

// Toggle complete/incomplete when a checkbox changes.
listEl.addEventListener("change", event => {
  const box = event.target.closest('input[type="checkbox"]');
  if (!box) return;
  const item = items.find(i => i.id === Number(box.dataset.id));
  if (item) {
    item.done = box.checked;
    render();
  }
});

// Remove a custom item.
listEl.addEventListener("click", event => {
  const button = event.target.closest(".item-remove");
  if (!button) return;
  event.preventDefault();
  const id = Number(button.dataset.id);
  items = items.filter(i => i.id !== id);
  render();
});

// Add a custom item.
function addCustomItem() {
  const title = newItemInput.value.trim();
  if (!title) return;
  items.push({id: nextId++, title, category: "Custom", done: false, link: null, custom: true});
  newItemInput.value = "";
  render();
}

addBtn.addEventListener("click", addCustomItem);
newItemInput.addEventListener("keydown", event => {
  if (event.key === "Enter") addCustomItem();
});

// ---- startup ----
// Later: replace this with `items = await fetch("/api/checklist").then(r => r.json());`
function loadChecklist() {
  render();
}

loadChecklist();