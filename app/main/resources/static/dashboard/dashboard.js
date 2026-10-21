const ICON={"In Progress":"🌱","Applied":"📨","Interview":"🎤","Offer":"🎉"};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
let apps=[],list=[],events=[],cur=new Date(2026,9,1);
const rounds=a=>a.interviews||[];
const upcoming=a=>rounds(a).filter(i=>new Date(i.at)>=NOW).sort((x,y)=>new Date(x.at)-new Date(y.at));

function board(){
  const act=apps.filter(a=>a.active&&STAGES.includes(a.stage));
  document.getElementById("board").innerHTML=STAGES.map(s=>{
    const l=act.filter(a=>a.stage===s);
    return `<div class="col" data-stage="${s}"><h3><span>${ICON[s]} ${s}</span><span class="count">${l.length}</span></h3>`+(l.length?l.map(a=>{
      const n=s==="Interview"?upcoming(a)[0]:null;
      return `<div class="card" draggable="true" data-id="${a.id}"><b>${esc(a.employer)}</b><span>${esc(a.role)}</span>`+moveSel(a)+(n?`<div class="next">🗓️ Next: ${fmt(n.at)}<br>${esc(n.type)}, ${esc(n.format)}</div>`:"")+`</div>`}).join(""):'<p class="empty">🪴 Nothing here yet.<br>Drag a card in!</p>')+`</div>`}).join("");
  const up=act.flatMap(a=>upcoming(a).map(i=>({...i,e:a.employer}))).sort((x,y)=>new Date(x.at)-new Date(y.at));
  document.getElementById("upcoming").innerHTML=up.length?up.map(i=>`<div class="row"><span class="when">${fmt(i.at)}</span><span>${esc(i.e)}, ${esc(i.type)}</span></div>`).join(""):'<p class="mute">☕ No interviews coming up. Enjoy the quiet!</p>';wireDnD();
}
function checklist(){
  const done=list.filter(x=>x.d).length,p=list.length?Math.round(done/list.length*100):0;
  const pc=document.getElementById("pct");pc.textContent=p+"%";pc.classList.remove("pop");void pc.offsetWidth;pc.classList.add("pop");
  document.getElementById("pctnote").textContent=`${p===100?"🎉 All set, you are ready!":done+" of "+list.length+" done"}`;
  document.getElementById("fill").style.width=p+"%";
  document.getElementById("checklist").innerHTML=list.map((x,i)=>`<label class="ck"><input type="checkbox" data-i="${i}" ${x.d?"checked":""}> ${esc(x.t)}</label>`).join("");
  document.querySelectorAll("#checklist input").forEach(c=>c.onchange=()=>{list[c.dataset.i].d=c.checked;checklist()});
}
function roundsView(){
  const act=apps.filter(a=>a.active&&rounds(a).length);
  document.getElementById("rounds").innerHTML=act.length?act.map(a=>`<h3>${esc(a.employer)} <span class="mute">${esc(a.role)}</span></h3>`+
    rounds(a).sort((x,y)=>new Date(x.at)-new Date(y.at)).map(i=>`<div class="row"><span class="when">${fmt(i.at)}</span><span>${esc(i.type)}, ${esc(i.format)}</span></div>`).join("")).join(""):'<p class="mute">No interview rounds yet.</p>';
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  ["dash","int"].forEach(v=>document.getElementById(v).classList.toggle("hide",v!==b.dataset.v));});
Promise.all([getApplications(),getChecklist(),getEvents()]).then(([a,c,e])=>{apps=a;list=c;events=e;board();checklist();roundsView()})
 .catch(()=>{document.getElementById("dash").innerHTML='<div class="panel">Could not load your dashboard. Refresh to try again.</div>'});

function moveSel(a){
  return `<select class="mv" data-id="${a.id}" aria-label="Move ${esc(a.employer)} to a stage">`+
    STAGES.map(s=>`<option${s===a.stage?" selected":""}>${s}</option>`).join("")+"</select>";
}
function moveApp(id,stage){
  const a=apps.find(x=>String(x.id)===String(id));
  if(a&&STAGES.includes(stage)&&a.stage!==stage){a.stage=stage;board();roundsView();}  // TODO: save to backend
}
function wireDnD(){
  document.querySelectorAll(".card").forEach(c=>{
    c.ondragstart=e=>{e.dataTransfer.setData("text/plain",c.dataset.id);e.dataTransfer.effectAllowed="move";c.classList.add("dragging")};
    c.ondragend=()=>c.classList.remove("dragging");
  });
  document.querySelectorAll(".col").forEach(col=>{
    col.ondragover=e=>{e.preventDefault();col.classList.add("over")};
    col.ondragleave=()=>col.classList.remove("over");
    col.ondrop=e=>{e.preventDefault();col.classList.remove("over");moveApp(e.dataTransfer.getData("text/plain"),col.dataset.stage)};
  });
  document.querySelectorAll(".mv").forEach(s=>s.onchange=()=>moveApp(s.dataset.id,s.value));
}

(function(){const hr=new Date().getHours();
  const hi=hr<12?"Good morning ☀️":hr<18?"Good afternoon 🌤️":"Good evening 🌙";
  document.getElementById("greet").textContent=hi+" Here is where your job search stands.";})();