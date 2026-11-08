// Shared checklist storage, used by BOTH the checklist page and the dashboard.
// Saves in the browser for now. When the backend has /api/checklist, only this file changes.

const CHECKLIST_KEY = "readinessChecklist";

const DEFAULT_CHECKLIST = [
  {id: 1, title: "Resume drafted",                     category: "Documents",       done: false, link: null, custom: false},
  {id: 2, title: "Resume reviewed by Career Services", category: "Documents",       done: false, link: null, custom: false},
  {id: 3, title: "References identified",               category: "Documents",       done: false, link: null, custom: false},
  {id: 4, title: "LinkedIn profile updated",           category: "Online presence", done: false, link: null, custom: false},
  {id: 5, title: "Portfolio / GitHub current",         category: "Online presence", done: false, link: null, custom: false},
  {id: 6, title: "Elevator pitch practiced",           category: "Interview prep",  done: false, link: null, custom: false},
  {id: 7, title: "Mock interview completed",           category: "Interview prep",  done: false, link: null, custom: false},
  {id: 8, title: "Target company list built",          category: "Research",        done: false, link: null, custom: false}
];

function loadChecklistItems() {
  try {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn("Could not read saved checklist, using defaults.", e);
  }
  return DEFAULT_CHECKLIST.map(item => ({...item}));
}

function saveChecklistItems(items) {
  try {
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Could not save checklist.", e);
  }
}