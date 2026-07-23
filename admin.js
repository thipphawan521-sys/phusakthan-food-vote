import { db, collection, onSnapshot } from "./firebase.js";

const SET_NAMES={set1:"ชุดที่ 1",set2:"ชุดที่ 2",set3:"ชุดที่ 3",set4:"ชุดที่ 4"};
const SET_IDS=Object.keys(SET_NAMES);

const el={
  total:document.querySelector("#adminTotal"),
  results:document.querySelector("#adminResults"),
  rows:document.querySelector("#voteRows"),
  exportCsv:document.querySelector("#exportCsv"),
  copySummary:document.querySelector("#copySummary"),
  toast:document.querySelector("#toast")
};

let votes=[];

function showToast(message){
  el.toast.textContent=message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>el.toast.classList.remove("show"),2600);
}

function voteDate(vote){
  const raw=vote.voteTime?.toDate?.() || vote.voteTimeClient || null;
  if(!raw) return "—";
  return new Intl.DateTimeFormat("th-TH",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"
  }).format(new Date(raw));
}

function render(){
  const counts=Object.fromEntries(SET_IDS.map(id=>[id,0]));
  votes.forEach(vote=>{if(counts[vote.foodSet]!==undefined) counts[vote.foodSet]++});
  const total=votes.length;
  el.total.textContent=total.toLocaleString("th-TH");

  el.results.innerHTML=SET_IDS.map(id=>{
    const count=counts[id];
    const percent=total?Math.round(count/total*100):0;
    return `<article class="admin-result-card">
      <div class="admin-result-top">
        <div><span>${SET_NAMES[id]}</span><br><small>${percent}% ของผู้โหวต</small></div>
        <strong>${count} เสียง</strong>
      </div>
      <div class="track"><div class="bar" style="width:${percent}%"></div></div>
    </article>`;
  }).join("");

  const sorted=[...votes].sort((a,b)=>{
    const ad=a.voteTime?.toMillis?.() || Date.parse(a.voteTimeClient||0);
    const bd=b.voteTime?.toMillis?.() || Date.parse(b.voteTimeClient||0);
    return bd-ad;
  });
  el.rows.innerHTML=sorted.map((vote,index)=>`
    <tr><td>${index+1}</td><td>${SET_NAMES[vote.foodSet]||vote.foodSet}</td><td>${voteDate(vote)}</td></tr>
  `).join("");
}

function csvEscape(value){
  return `"${String(value??"").replaceAll('"','""')}"`;
}

el.exportCsv.addEventListener("click",()=>{
  const rows=[["ลำดับ","ชุดอาหาร","Soup Type","เวลาโหวต"]];
  votes.forEach((vote,index)=>rows.push([
    index+1,SET_NAMES[vote.foodSet]||vote.foodSet,vote.soupType||"",voteDate(vote)
  ]));
  const csv="\uFEFF"+rows.map(row=>row.map(csvEscape).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const link=document.createElement("a");
  link.href=url;
  link.download="phusakthan-vote-results.csv";
  link.click();
  URL.revokeObjectURL(url);
});

el.copySummary.addEventListener("click",async()=>{
  const counts=Object.fromEntries(SET_IDS.map(id=>[id,0]));
  votes.forEach(vote=>{if(counts[vote.foodSet]!==undefined) counts[vote.foodSet]++});
  const text=[
    `สรุปผลโหวต โรงแรมภูสักธาร`,
    `ผู้โหวตทั้งหมด ${votes.length} คน`,
    ...SET_IDS.map(id=>`${SET_NAMES[id]}: ${counts[id]} เสียง`)
  ].join("\n");
  try{
    await navigator.clipboard.writeText(text);
    showToast("คัดลอกสรุปแล้ว");
  }catch{
    showToast("คัดลอกไม่สำเร็จ");
  }
});

onSnapshot(collection(db,"votes"),snapshot=>{
  votes=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  render();
},error=>{
  console.error(error);
  showToast("อ่านข้อมูลไม่สำเร็จ");
});
