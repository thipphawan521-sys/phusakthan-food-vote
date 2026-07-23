import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const SETS = [
  {id:"set1",name:"ชุดที่ 1"},
  {id:"set2",name:"ชุดที่ 2"},
  {id:"set3",name:"ชุดที่ 3"},
  {id:"set4",name:"ชุดที่ 4"}
];

const el = {
  loginView:document.querySelector("#loginView"),
  dashboardView:document.querySelector("#dashboardView"),
  loginForm:document.querySelector("#loginForm"),
  email:document.querySelector("#email"),
  password:document.querySelector("#password"),
  loginButton:document.querySelector("#loginButton"),
  loginError:document.querySelector("#loginError"),
  logoutButton:document.querySelector("#logoutButton"),
  voteStatusText:document.querySelector("#voteStatusText"),
  toggleVoteButton:document.querySelector("#toggleVoteButton"),
  totalVotes:document.querySelector("#totalVotes"),
  winnerCard:document.querySelector("#winnerCard"),
  winnerName:document.querySelector("#winnerName"),
  resultCards:document.querySelector("#resultCards"),
  voteRows:document.querySelector("#voteRows"),
  lastUpdated:document.querySelector("#lastUpdated"),
  exportCsvButton:document.querySelector("#exportCsvButton"),
  copySummaryButton:document.querySelector("#copySummaryButton"),
  printButton:document.querySelector("#printButton"),
  resetButton:document.querySelector("#resetButton"),
  confirmDialog:document.querySelector("#confirmDialog"),
  confirmText:document.querySelector("#confirmText"),
  confirmResetButton:document.querySelector("#confirmResetButton"),
  toast:document.querySelector("#toast")
};

let votes = [];
let votingOpen = true;
let unsubscribeVotes = null;
let unsubscribeSettings = null;

function toast(message){
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>el.toast.classList.remove("show"),2600);
}

function formatDate(vote){
  const value = vote.voteTime?.toDate?.() || vote.voteTimeClient || null;
  if(!value) return "—";
  return new Intl.DateTimeFormat("th-TH",{
    dateStyle:"medium",
    timeStyle:"short",
    timeZone:"Asia/Bangkok"
  }).format(new Date(value));
}

function millis(vote){
  return vote.voteTime?.toMillis?.() || Date.parse(vote.voteTimeClient || 0) || 0;
}

function counts(){
  const result = Object.fromEntries(SETS.map(set=>[set.id,0]));
  votes.forEach(vote=>{
    if(Object.hasOwn(result,vote.foodSet)) result[vote.foodSet] += 1;
  });
  return result;
}

function render(){
  const total = votes.length;
  const data = counts();
  el.totalVotes.textContent = total.toLocaleString("th-TH");

  el.resultCards.innerHTML = SETS.map(set=>{
    const count = data[set.id];
    const percent = total ? Math.round(count / total * 100) : 0;
    return `<article class="result-card">
      <div class="result-head">
        <div><strong>${set.name}</strong><br><small>${percent}% ของผู้โหวต</small></div>
        <strong>${count} เสียง</strong>
      </div>
      <div class="track"><div class="bar" style="width:${percent}%"></div></div>
    </article>`;
  }).join("");

  if(total){
    const top = Math.max(...Object.values(data));
    const leaders = SETS.filter(set=>data[set.id]===top).map(set=>set.name);
    el.winnerName.textContent = leaders.length === 1 ? leaders[0] : `คะแนนเสมอ ${leaders.join(" / ")}`;
    el.winnerCard.classList.remove("hidden");
  }else{
    el.winnerCard.classList.add("hidden");
  }

  const sorted = [...votes].sort((a,b)=>millis(b)-millis(a));
  el.voteRows.innerHTML = sorted.length
    ? sorted.map((vote,index)=>`<tr>
        <td>${index+1}</td>
        <td>${SETS.find(set=>set.id===vote.foodSet)?.name || vote.foodSet || "—"}</td>
        <td>${formatDate(vote)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3">ยังไม่มีผลโหวต</td></tr>`;

  el.lastUpdated.textContent = `อัปเดต ${new Intl.DateTimeFormat("th-TH",{timeStyle:"medium",timeZone:"Asia/Bangkok"}).format(new Date())}`;
}

function renderStatus(){
  el.voteStatusText.textContent = votingOpen ? "เปิดรับโหวตอยู่" : "ปิดรับโหวตแล้ว";
  el.toggleVoteButton.textContent = votingOpen ? "ปิดการโหวต" : "เปิดการโหวต";
}

function startRealtime(){
  unsubscribeVotes?.();
  unsubscribeSettings?.();

  unsubscribeVotes = onSnapshot(collection(db,"votes"),snapshot=>{
    votes = snapshot.docs.map(item=>({id:item.id,...item.data()}));
    render();
  },error=>{
    console.error(error);
    toast("ไม่สามารถอ่านผลโหวตได้");
  });

  unsubscribeSettings = onSnapshot(doc(db,"settings","vote"),snapshot=>{
    votingOpen = snapshot.exists() ? snapshot.data().isOpen !== false : true;
    renderStatus();
  },error=>{
    console.error(error);
    toast("ไม่สามารถอ่านสถานะการโหวตได้");
  });
}

el.loginForm.addEventListener("submit",async event=>{
  event.preventDefault();
  el.loginError.textContent = "";
  el.loginButton.disabled = true;
  el.loginButton.textContent = "กำลังเข้าสู่ระบบ…";
  try{
    await signInWithEmailAndPassword(auth,el.email.value.trim(),el.password.value);
  }catch(error){
    console.error(error);
    el.loginError.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่ได้เปิด Email/Password";
  }finally{
    el.loginButton.disabled = false;
    el.loginButton.textContent = "เข้าสู่ระบบ";
  }
});

el.logoutButton.addEventListener("click",()=>signOut(auth));

el.toggleVoteButton.addEventListener("click",async()=>{
  el.toggleVoteButton.disabled = true;
  try{
    await setDoc(doc(db,"settings","vote"),{
      isOpen:!votingOpen,
      updatedAt:serverTimestamp(),
      updatedBy:auth.currentUser.uid
    },{merge:true});
    toast(!votingOpen ? "เปิดรับโหวตแล้ว" : "ปิดรับโหวตแล้ว");
  }catch(error){
    console.error(error);
    toast("เปลี่ยนสถานะไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules");
  }finally{
    el.toggleVoteButton.disabled = false;
  }
});

el.resetButton.addEventListener("click",()=>{
  el.confirmText.value = "";
  el.confirmResetButton.disabled = true;
  el.confirmDialog.showModal();
});

el.confirmText.addEventListener("input",()=>{
  el.confirmResetButton.disabled = el.confirmText.value.trim() !== "ล้างผลโหวต";
});

async function deleteAllVotes(){
  const snapshot = await getDocs(collection(db,"votes"));
  const refs = snapshot.docs.map(item=>item.ref);
  const chunkSize = 400;

  for(let i=0;i<refs.length;i+=chunkSize){
    const batch = writeBatch(db);
    refs.slice(i,i+chunkSize).forEach(ref=>batch.delete(ref));
    await batch.commit();
  }
  return refs.length;
}

el.confirmResetButton.addEventListener("click",async()=>{
  el.confirmResetButton.disabled = true;
  el.confirmResetButton.textContent = "กำลังลบ…";
  try{
    const deleted = await deleteAllVotes();
    el.confirmDialog.close();
    toast(`ล้างผลโหวตแล้ว ${deleted} รายการ`);
  }catch(error){
    console.error(error);
    toast("ล้างข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์ Admin");
  }finally{
    el.confirmResetButton.textContent = "ยืนยันลบทั้งหมด";
    el.confirmText.value = "";
  }
});

function csvEscape(value){
  return `"${String(value ?? "").replaceAll('"','""')}"`;
}

el.exportCsvButton.addEventListener("click",()=>{
  const rows = [["ลำดับ","ชุดอาหาร","ประเภทซุป","เวลาที่โหวต"]];
  [...votes].sort((a,b)=>millis(a)-millis(b)).forEach((vote,index)=>{
    rows.push([
      index+1,
      SETS.find(set=>set.id===vote.foodSet)?.name || vote.foodSet || "",
      vote.soupType || "",
      formatDate(vote)
    ]);
  });
  const csv = "\uFEFF" + rows.map(row=>row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `phusakthan-vote-${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

el.copySummaryButton.addEventListener("click",async()=>{
  const data = counts();
  const text = [
    "สรุปผลโหวต โรงแรมภูสักธาร",
    `ผู้โหวตทั้งหมด ${votes.length} คน`,
    ...SETS.map(set=>`${set.name}: ${data[set.id]} เสียง`)
  ].join("\n");
  try{
    await navigator.clipboard.writeText(text);
    toast("คัดลอกสรุปแล้ว");
  }catch{
    toast("คัดลอกไม่สำเร็จ");
  }
});

el.printButton.addEventListener("click",()=>window.print());

onAuthStateChanged(auth,user=>{
  if(user && !user.isAnonymous){
    el.loginView.classList.add("hidden");
    el.dashboardView.classList.remove("hidden");
    startRealtime();
  }else{
    unsubscribeVotes?.();
    unsubscribeSettings?.();
    el.dashboardView.classList.add("hidden");
    el.loginView.classList.remove("hidden");
  }
});
