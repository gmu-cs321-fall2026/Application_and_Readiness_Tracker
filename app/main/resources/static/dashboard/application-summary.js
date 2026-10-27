async function loadApplicationSummary() {
  try {
    const response = await fetch("/api/applications/summary");
    if (!response.ok) throw new Error("API unavailable");

    const data = await response.json();

    const section = document.createElement("section");
    section.className = "panel";
    section.style.marginTop = "16px";

    section.innerHTML = `
      <h2>Application Tracker — Live Summary</h2>
      <p class="mute">Application data from the Java backend.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin:16px 0">
        <div class="card"><b>${data.total}</b><p class="mute">Total</p></div>
        <div class="card"><b>${data.planned}</b><p class="mute">Plan to Apply</p></div>
        <div class="card"><b>${data.applied}</b><p class="mute">Applied</p></div>
        <div class="card"><b>${data.past}</b><p class="mute">Past Applications</p></div>
      </div>
      <a class="navlink" href="../applicationtracker/application-tracker.html">
        Open Application Tracker →
      </a>
    `;

    const main = document.querySelector("main") || document.body;
    main.appendChild(section);
  } catch (error) {
    console.error("Could not load application summary:", error);
  }
}

loadApplicationSummary();
