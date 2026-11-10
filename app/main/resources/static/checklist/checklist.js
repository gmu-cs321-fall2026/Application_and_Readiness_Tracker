// ============================================================================
// Readiness Checklist — front-end view
//
// Mirrors the structure of application-tracker.js. Runs on LOCAL MOCK DATA so
// the page works on its own. To use real data from the Java backend later,
// replace loadChecklist() with a fetch() to an endpoint like "/api/checklist"
// (the same way application-tracker.js uses "/api/applications"), and point the
// handlers at that API.
//
// Feature parity with the Java Checklist: toggle complete, add custom item,
// remove custom item, rename custom item, add/edit link, mark all, reset all.
// (Rename and remove are restricted to custom items, exactly like the Java version.)
// ============================================================================

// ---- MOCK DATA: replace with a call to the Java backend (/api/checklist) ----

// Shape matches the Java ChecklistItem: title, category, done, link, custom.
// (The dashboard's simpler widget uses {t, d}; map title->t and done->d there.)
let items = loadChecklistItems();
let nextId = Math.max(0, ...items.map(i => i.id)) + 1;

// let items = [
//   {id: 1, title: "Resume drafted",                     category: "Documents",       done: false, link: null, custom: false},
//   {id: 2, title: "Resume reviewed by Career Services", category: "Documents",       done: false, link: null, custom: false},
//   {id: 3, title: "References identified",               category: "Documents",       done: false, link: null, custom: false},
//   {id: 4, title: "LinkedIn profile updated",           category: "Online presence", done: false, link: null, custom: false},
//   {id: 5, title: "Portfolio / GitHub current",         category: "Online presence", done: false, link: null, custom: false},
//   {id: 6, title: "Elevator pitch practiced",           category: "Interview prep",  done: false, link: null, custom: false},
//   {id: 7, title: "Mock interview completed",           category: "Interview prep",  done: false, link: null, custom: false},
//   {id: 8, title: "Target company list built",          category: "Research",        done: false, link: null, custom: false}
// ];
// let nextId = 9;



const listEl = document.getElementById("checklist");
const progressLabel = document.getElementById("progressLabel");
const progressPct = document.getElementById("progressPct");
const progressFill = document.getElementById("progressFill");
const newItemInput = document.getElementById("newItemTitle");
const addBtn = document.getElementById("addItemBtn");
const markAllBtn = document.getElementById("markAllBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

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

  // Every item can have a link added/edited (matches Java setItemLink).
  const linkBtn = `<button type="button" class="item-action item-setlink" data-id="${item.id}">${item.link ? "edit link" : "add link"}</button>`;

  // Only custom items can be renamed or removed (matches the Java rules).
  const editBtn = item.custom
    ? `<button type="button" class="item-action item-edit" data-id="${item.id}">rename</button>`
    : "";
  const removeBtn = item.custom
    ? `<button type="button" class="item-action item-remove" data-id="${item.id}">remove</button>`
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
      <span class="item-actions">${linkBtn}${editBtn}${removeBtn}</span>
    </label>
  `;
}

function render() {
  listEl.innerHTML = items.length
    ? items.map(renderItemCard).join("")
    : '<p class="mute">No checklist items.</p>';
  renderProgress();
  saveChecklistItems(items);   // keep the dashboard in sync
}

// ---- interactions ----

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

// Handle the per-item action buttons (link / rename / remove).
listEl.addEventListener("click", event => {
  const button = event.target.closest("button.item-action");
  if (!button) return;
  event.preventDefault();   // stop the click from also toggling the checkbox

  const id = Number(button.dataset.id);
  const item = items.find(i => i.id === id);
  if (!item) return;

  if (button.classList.contains("item-remove")) {
    items = items.filter(i => i.id !== id);
    render();

  } else if (button.classList.contains("item-edit")) {
    const newTitle = prompt("New title:", item.title);
    if (newTitle && newTitle.trim()) {
      item.title = newTitle.trim();
      render();
    }

  } else if (button.classList.contains("item-setlink")) {
    const newLink = prompt("Enter a link (leave blank to clear it):", item.link || "");
    if (newLink !== null) {                       // null means they hit Cancel
      item.link = newLink.trim() ? newLink.trim() : null;
      render();
    }
  }
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

// Mark all / reset all.
markAllBtn.addEventListener("click", () => {
  items.forEach(i => i.done = true);
  render();
});
resetAllBtn.addEventListener("click", () => {
  items.forEach(i => i.done = false);
  render();
});

// ---- startup ----
// Later: replace with `items = await fetch("/api/checklist").then(r => r.json());`
function loadChecklist() {
  render();
}
loadChecklist();