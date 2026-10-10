// ---- MOCK DATA: replace each function with a call to the Java backend later ----
const STAGES=["In Progress","Applied","Interview","Offer"];
const NOW=new Date("2026-10-10T09:00");
async function getApplications(){return [
  {id:1,employer:"Riot Games",role:"Data Engineering Intern",stage:"In Progress",active:true},
  {id:2,employer:"Google",role:"Software Engineering Intern",stage:"Applied",active:true},
  {id:3,employer:"Capital One",role:"Data Analyst Intern",stage:"Applied",active:true},
  {id:4,employer:"Apple",role:"Technical Specialist",stage:"Interview",active:true,interviews:[
    {at:"2026-10-02T10:00",format:"Phone",type:"Screening"},{at:"2026-10-12T14:00",format:"Video call",type:"Technical"}]},
  {id:5,employer:"Northrop Grumman",role:"Embedded Intern",stage:"Offer",active:true},
  {id:6,employer:"Acme Corp",role:"Backend Intern",stage:"Rejected",active:false}]}
async function getChecklist(){return [
  {t:"Updated links",d:true},{t:"References",d:true},{t:"Resume draft",d:true},{t:"Target company list",d:false},{t:"Cover letter template",d:false}]}
async function getEvents(){return [
  {title:"Fall Career Fair",at:"2026-10-14T11:00",detail:"In person"},
  {title:"Resume Workshop",at:"2026-10-20T16:00",detail:"Virtual"}]}
// ---------------------------------------------------------------------------------