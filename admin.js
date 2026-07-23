import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

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

// Theme controls
const THEME_PRESETS = {
  sunset:{name:"Sunset",primary:"#ff8a3d",secondary:"#ff6756",accent:"#ffe57e",background:"#fff8e9",text:"#573124",card:"#fffdf6"},
  nature:{name:"Nature",primary:"#4f8a57",secondary:"#7aaa61",accent:"#f3d889",background:"#f4f7e9",text:"#2f4934",card:"#fffdf5"},
  ocean:{name:"Ocean",primary:"#2486b9",secondary:"#45b7c9",accent:"#ffd56b",background:"#eaf8fb",text:"#173f52",card:"#ffffff"},
  royal:{name:"Royal",primary:"#7450a8",secondary:"#a166b3",accent:"#f2c66d",background:"#f6effa",text:"#402d55",card:"#fffaff"},
  rose:{name:"Rose",primary:"#d95e7d",secondary:"#f08a9e",accent:"#ffd2a6",background:"#fff1f4",text:"#673345",card:"#fffafd"},
  luxury:{name:"Luxury",primary:"#8f6b32",secondary:"#c59b49",accent:"#f3dd9b",background:"#f7f1e4",text:"#44351f",card:"#fffdf6"}
};

const themeEls = {
  presets:document.querySelector("#themePresets"),
  primary:document.querySelector("#themePrimary"),
  secondary:document.querySelector("#themeSecondary"),
  accent:document.querySelector("#themeAccent"),
  background:document.querySelector("#themeBackground"),
  text:document.querySelector("#themeText"),
  card:document.querySelector("#themeCard"),
  preview:document.querySelector("#themePreview"),
  save:document.querySelector("#saveThemeButton"),
  badge:document.querySelector("#themeSavedBadge")
};

function getThemeForm(){
  return {
    name:document.querySelector(".theme-preset.active strong")?.textContent || "Custom",
    primary:themeEls.primary.value,
    secondary:themeEls.secondary.value,
    accent:themeEls.accent.value,
    background:themeEls.background.value,
    text:themeEls.text.value,
    card:themeEls.card.value
  };
}

function updateThemePreview(){
  const theme=getThemeForm();
  themeEls.preview.style.setProperty("--preview-primary",theme.primary);
  themeEls.preview.style.setProperty("--preview-secondary",theme.secondary);
  themeEls.preview.style.setProperty("--preview-accent",theme.accent);
  themeEls.preview.style.setProperty("--preview-text",theme.text);
  themeEls.preview.style.setProperty("--preview-card",theme.card);
}

function fillThemeForm(theme){
  themeEls.primary.value=theme.primary;
  themeEls.secondary.value=theme.secondary;
  themeEls.accent.value=theme.accent;
  themeEls.background.value=theme.background;
  themeEls.text.value=theme.text;
  themeEls.card.value=theme.card;
  updateThemePreview();
}

themeEls.presets?.addEventListener("click",event=>{
  const button=event.target.closest("[data-theme]");
  if(!button)return;
  document.querySelectorAll(".theme-preset").forEach(item=>item.classList.remove("active"));
  button.classList.add("active");
  fillThemeForm(THEME_PRESETS[button.dataset.theme]);
});

[themeEls.primary,themeEls.secondary,themeEls.accent,themeEls.background,themeEls.text,themeEls.card]
  .forEach(input=>input?.addEventListener("input",()=>{
    document.querySelectorAll(".theme-preset").forEach(item=>item.classList.remove("active"));
    updateThemePreview();
  }));

themeEls.save?.addEventListener("click",async()=>{
  themeEls.save.disabled=true;
  themeEls.save.textContent="กำลังบันทึก…";
  try{
    await setDoc(doc(db,"settings","theme"),{
      ...getThemeForm(),
      updatedAt:serverTimestamp(),
      updatedBy:auth.currentUser.uid
    },{merge:true});
    themeEls.badge.classList.remove("hidden");
    setTimeout(()=>themeEls.badge.classList.add("hidden"),2200);
    toast("เปลี่ยนสีเว็บไซต์แล้ว");
  }catch(error){
    console.error(error);
    toast("บันทึกสีไม่สำเร็จ กรุณาตรวจสอบ Firestore Rules");
  }finally{
    themeEls.save.disabled=false;
    themeEls.save.textContent="บันทึกสีเว็บไซต์";
  }
});

onSnapshot(doc(db,"settings","theme"),snapshot=>{
  if(!snapshot.exists()){
    fillThemeForm(THEME_PRESETS.sunset);
    return;
  }
  const theme={...THEME_PRESETS.sunset,...snapshot.data()};
  fillThemeForm(theme);
  document.querySelectorAll(".theme-preset").forEach(button=>{
    button.classList.toggle("active",button.querySelector("strong")?.textContent===theme.name);
  });
});
