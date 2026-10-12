const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>new Date(d).toLocaleString("en-US",{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
let apps=[],list=[],events=[],cur=new Date(2026,9,1);
const rounds=a=>a.interviews||[];
const upcoming=a=>rounds(a).filter(i=>new Date(i.at)>=NOW).sort((x,y)=>new Date(x.at)-new Date(y.at));

function board(){
  const act=apps.filter(a=>a.active&&STAGES.includes(a.stage));
  document.getElementById("board").innerHTML=STAGES.map(s=>{
    const l=act.filter(a=>a.stage===s);
    return `<div class="col"><h3>${s}<span class="count">${l.length}</span></h3>`+(l.length?l.map(a=>{
      const n=s==="Interview"?upcoming(a)[0]:null;
      return `<div class="card"><b>${esc(a.employer)}</b><span>${esc(a.role)}</span>`+(n?`<div class="next">Next: ${fmt(n.at)}<br>${esc(n.type)}, ${esc(n.format)}</div>`:"")+`</div>`}).join(""):'<p class="mute">Nothing here yet.</p>')+`</div>`}).join("");
  const up=act.flatMap(a=>upcoming(a).map(i=>({...i,e:a.employer}))).sort((x,y)=>new Date(x.at)-new Date(y.at));
  document.getElementById("upcoming").innerHTML=up.length?up.map(i=>`<div class="row"><span class="when">${fmt(i.at)}</span><span>${esc(i.e)}, ${esc(i.type)}</span></div>`).join(""):'<p class="mute">No interviews scheduled.</p>';
}
function checklist(){
  const done=list.filter(x=>x.d).length,p=list.length?Math.round(done/list.length*100):0;
  document.getElementById("pct").textContent=p+"%";
  document.getElementById("pctnote").textContent=`${done} of ${list.length} done`;
  document.getElementById("fill").style.width=p+"%";
  document.getElementById("checklist").innerHTML=list.map((x,i)=>`<label class="ck"><input type="checkbox" data-i="${i}" ${x.d?"checked":""}> ${esc(x.t)}</label>`).join("");
  document.querySelectorAll("#checklist input").forEach(c=>c.onchange=()=>{list[c.dataset.i].d=c.checked;checklist()});
}
function roundsView(){
  const act=apps.filter(a=>a.active&&rounds(a).length);
  document.getElementById("rounds").innerHTML=act.length?act.map(a=>`<h3>${esc(a.employer)} <span class="mute">${esc(a.role)}</span></h3>`+
    rounds(a).sort((x,y)=>new Date(x.at)-new Date(y.at)).map(i=>`<div class="row"><span class="when">${fmt(i.at)}</span><span>${esc(i.type)}, ${esc(i.format)}</span></div>`).join("")).join(""):'<p class="mute">No interview rounds yet.</p>';
}
function calendar(){
  const y=cur.getFullYear(),m=cur.getMonth(),items=[
    ...apps.filter(a=>a.active).flatMap(a=>rounds(a).map(i=>({k:"iv",t:`★ ${a.employer}`,at:i.at}))),
    ...events.map(e=>({k:"ev",t:`◆ ${e.title}`,at:e.at}))];
  document.getElementById("mtitle").textContent=cur.toLocaleString("en-US",{month:"long",year:"numeric"});
  const start=new Date(y,m,1-new Date(y,m,1).getDay());
  let h="<div class='grid'>"+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<div class="dow">${d}</div>`).join("");
  for(let c=0;c<42;c++){const d=new Date(start);d.setDate(start.getDate()+c);
    const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    h+=`<div class="day${d.getMonth()!==m?" out":""}"><span class="n">${d.getDate()}</span>`+items.filter(i=>i.at.slice(0,10)===k).map(i=>`<span class="chip ${i.k}">${esc(i.t)}</span>`).join("")+"</div>"}
  document.getElementById("grid").innerHTML=h+"</div>";
}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{
  document.querySelectorAll("nav button").forEach(x=>x.setAttribute("aria-pressed",x===b));
  ["dash","int","cal"].forEach(v=>document.getElementById(v).classList.toggle("hide",v!==b.dataset.v));});
document.getElementById("prev").onclick=()=>{cur=new Date(cur.getFullYear(),cur.getMonth()-1,1);calendar()};
document.getElementById("next").onclick=()=>{cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);calendar()};
Promise.all([getApplications(),getChecklist(),getEvents()]).then(([a,c,e])=>{apps=a;list=c;events=e;board();checklist();roundsView();calendar()})
 .catch(()=>{document.getElementById("dash").innerHTML='<div class="panel">Could not load your dashboard. Refresh to try again.</div>'});