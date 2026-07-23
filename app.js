import {
  db, ensureUser, collection, doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "./firebase.js";

const CLOSES_AT = "2026-07-24T14:00:00+07:00";

const SETS = [
  {
    id:"set1", name:"ชุดที่ 1", soupType:"แกงส้มปลาช่อนผักรวม",
    foods:[
      "หลนเต้าเจี้ยวกุ้งสด + ผักสด + ผักลวก","ลาบหมู","ยำรวมมิตรทะเล",
      "ปลาทับทิมทอดสามรส","ผัดผักรวมมิตรหมูกรอบ","ปีกบนไก่ทอดเกลือ",
      "แกงส้มปลาช่อนผักรวม","ข้าวสวย","ผลไม้","ซุ้มแถม ก๋วยเตี๋ยวไก่ตุ๋น"
    ]
  },
  {
    id:"set2", name:"ชุดที่ 2", soupType:"แกงเลียงนพเก้า",
    foods:[
      "น้ำพริกอ่อง + ผักสด + ผักลวก","ยำสามกรอบ","ลาบปลาหมึก",
      "ฉู่ฉี่ปลาทับทิมทอดกรอบ","บรอกโคลีผัดกุ้ง","ปีกบนไก่ทอดสมุนไพร",
      "แกงเลียงนพเก้า","ข้าวสวย","รวมมิตรหวานเย็น","ซุ้มแถม สุกี้ไก่"
    ]
  },
  {
    id:"set3", name:"ชุดที่ 3", soupType:"แกงเผ็ดหมูย่าง",
    foods:[
      "น้ำพริกภูสักธาร + ผักสด + ผักลวก","น้ำตกหมู","ลาบไก่ + เครื่องใน",
      "ปลาหมึกผัดผงกะหรี่","กะหล่ำปลีทอดน้ำปลา","ปีกไก่บนทอดขมิ้น",
      "แกงเผ็ดหมูย่าง","ข้าวสวย","ลอดช่อง + แตงไทยน้ำกะทิ",
      "ซุ้มแถม ข้าวเหนียว + ส้มตำไทย/ปู"
    ]
  },
  {
    id:"set4", name:"ชุดที่ 4", soupType:"ต้มแซ่บซี่โครงหมูอ่อน",
    foods:[
      "น้ำพริกปลาทู + ผักสด + ผักลวก","ยำหมูย่างคะน้ากรอบ","ลาบวุ้นเส้นหมูยอ",
      "ปลาหมึกผัดพริกไทยดำ","มะระผัดไข่","ทอดมันปลากราย",
      "ต้มแซ่บซี่โครงหมูอ่อน","ข้าวสวย","บัวลอยเผือกมะพร้าวอ่อน",
      "ซุ้มแถม ผัดไทยกุ้งสด"
    ]
  }
];

const el = {
  loading:document.querySelector("#loading"),
  toast:document.querySelector("#toast"),
  countdown:document.querySelector("#countdown"),
  totalVotes:document.querySelector("#totalVotes"),
  results:document.querySelector("#results"),
  menuCards:document.querySelector("#menuCards"),
  form:document.querySelector("#voteForm"),
  submit:document.querySelector("#submitVote"),
  voteSection:document.querySelector("#voteSection"),
  thankYou:document.querySelector("#thankYou"),
  chosenSet:document.querySelector("#chosenSet"),
  chosenTime:document.querySelector("#chosenTime"),
  winnerCard:document.querySelector("#winnerCard"),
  winnerName:document.querySelector("#winnerName"),
  shareButton:document.querySelector("#shareButton"),
  copyButton:document.querySelector("#copyButton"),
  qrButton:document.querySelector("#qrButton"),
  qrModal:document.querySelector("#qrModal"),
  qrCode:document.querySelector("#qrCode"),
  closeQr:document.querySelector("#closeQr")
};

const state = { user:null, selected:null, votes:[], closed:false };

function showToast(message){
  el.toast.textContent=message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>el.toast.classList.remove("show"),2800);
}

function setupTelegram(){
  const tg=window.Telegram?.WebApp;
  if(!tg) return;
  tg.ready(); tg.expand();
  tg.setHeaderColor("#ef8a2f");
  tg.setBackgroundColor("#ef704a");
}

function renderMenus(){
  el.menuCards.innerHTML=SETS.map(set=>`
    <label class="menu-card" data-id="${set.id}">
      <input type="radio" name="foodSet" value="${set.id}">
      <span class="badge">DINNER SET</span>
      <h3>${set.name}</h3>
      <p class="people">สำหรับโต๊ะงานเลี้ยง 8–10 ท่าน</p>
      <ol class="food-list">${set.foods.map(food=>`<li>${food}</li>`).join("")}</ol>
    </label>
  `).join("");

  el.menuCards.querySelectorAll('input[name="foodSet"]').forEach(input=>{
    input.addEventListener("change",()=>{
      state.selected=input.value;
      el.menuCards.querySelectorAll(".menu-card").forEach(card=>{
        card.classList.toggle("selected",card.dataset.id===input.value);
      });
      el.submit.classList.remove("hidden");
      window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    });
  });
}

function renderResults(){
  const counts=Object.fromEntries(SETS.map(set=>[set.id,0]));
  state.votes.forEach(vote=>{
    if(counts[vote.foodSet]!==undefined) counts[vote.foodSet]++;
  });
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  el.totalVotes.textContent=total.toLocaleString("th-TH");
  el.results.innerHTML=SETS.map(set=>{
    const count=counts[set.id];
    const percent=total?Math.round(count/total*100):0;
    return `<div>
      <div class="result-head"><span>${set.name}</span><strong>${percent}% · ${count} เสียง</strong></div>
      <div class="track"><div class="bar" style="width:${percent}%"></div></div>
    </div>`;
  }).join("");

  if(total>0){
    const maxVotes=Math.max(...Object.values(counts));
    const leaders=SETS.filter(set=>counts[set.id]===maxVotes).map(set=>set.name);
    el.winnerName.textContent=leaders.length===1?leaders[0]:`คะแนนเสมอ ${leaders.join(" / ")}`;
    el.winnerCard.classList.remove("hidden");
  }else{
    el.winnerCard.classList.add("hidden");
  }
}

function startCountdown(){
  const closeTime=new Date(CLOSES_AT).getTime();
  const update=()=>{
    const diff=closeTime-Date.now();
    state.closed=diff<=0;
    if(state.closed){
      el.countdown.textContent="ปิดรับโหวตแล้ว";
      el.submit.disabled=true;
      return;
    }
    const d=Math.floor(diff/86400000);
    const h=Math.floor((diff%86400000)/3600000);
    const m=Math.floor((diff%3600000)/60000);
    const s=Math.floor((diff%60000)/1000);
    el.countdown.textContent=`${d} วัน ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  };
  update();
  setInterval(update,1000);
}

function listenVotes(){
  onSnapshot(collection(db,"votes"),snapshot=>{
    state.votes=snapshot.docs.map(d=>({id:d.id,...d.data()}));
    renderResults();
  },error=>{
    console.error(error);
    showToast("อ่านผลโหวตไม่ได้ กรุณาตรวจสอบ Firestore Rules");
  });
}

async function existingVote(){
  const snap=await getDoc(doc(db,"votes",state.user.uid));
  return snap.exists()?{id:snap.id,...snap.data()}:null;
}

function formatTime(vote){
  const raw=vote.voteTime?.toDate?.() || vote.voteTimeClient || new Date();
  return new Intl.DateTimeFormat("th-TH",{
    dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Bangkok"
  }).format(new Date(raw));
}

function showThankYou(vote){
  const set=SETS.find(s=>s.id===vote.foodSet);
  el.chosenSet.textContent=set?.name || vote.foodSet || "—";
  el.chosenTime.textContent=formatTime(vote);
  el.voteSection.classList.add("hidden");
  el.thankYou.classList.remove("hidden");
}

el.form.addEventListener("submit",async e=>{
  e.preventDefault();
  if(state.closed) return showToast("หมดเวลารับโหวตแล้ว");
  if(!state.selected) return showToast("กรุณาเลือกชุดอาหารก่อน");

  el.submit.disabled=true;
  el.submit.textContent="กำลังบันทึก...";

  try{
    const ref=doc(db,"votes",state.user.uid);
    const old=await getDoc(ref);
    if(old.exists()){
      showThankYou({id:old.id,...old.data()});
      return showToast("บัญชีนี้เคยโหวตแล้ว");
    }

    const set=SETS.find(s=>s.id===state.selected);
    const voteTimeClient=new Date().toISOString();

    await setDoc(ref,{
      userId:state.user.uid,
      foodSet:set.id,
      soupType:set.soupType,
      voteTime:serverTimestamp(),
      voteTimeClient
    });

    showThankYou({foodSet:set.id,voteTimeClient});
    showToast("บันทึกคะแนนเรียบร้อยแล้ว");
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("success");
  }catch(error){
    console.error(error);
    const old=await existingVote().catch(()=>null);
    if(old) showThankYou(old);
    showToast(old?"บัญชีนี้เคยโหวตแล้ว":"บันทึกไม่สำเร็จ กรุณาตรวจสอบ Rules");
  }finally{
    el.submit.disabled=false;
    el.submit.textContent="ยืนยันการโหวต";
  }
});


async function shareVoteLink(){
  const shareData={
    title:"โหวตชุดอาหาร โรงแรมภูสักธาร",
    text:"ร่วมโหวตเลือกชุดอาหารสำหรับงานเลี้ยง",
    url:window.location.origin
  };
  try{
    if(navigator.share){
      await navigator.share(shareData);
    }else{
      await navigator.clipboard.writeText(shareData.url);
      showToast("คัดลอกลิงก์แล้ว");
    }
  }catch(error){
    if(error?.name!=="AbortError") console.error(error);
  }
}

async function copyVoteLink(){
  try{
    await navigator.clipboard.writeText(window.location.origin);
    showToast("คัดลอกลิงก์แล้ว");
  }catch(error){
    showToast("คัดลอกไม่ได้ กรุณาคัดลอกจากแถบที่อยู่");
  }
}

function showQrCode(){
  el.qrCode.innerHTML="";
  new QRCode(el.qrCode,{
    text:window.location.origin,
    width:210,
    height:210,
    colorDark:"#432d24",
    colorLight:"#fffaf0",
    correctLevel:QRCode.CorrectLevel.H
  });
  el.qrModal.classList.remove("hidden");
}

el.shareButton?.addEventListener("click",shareVoteLink);
el.copyButton?.addEventListener("click",copyVoteLink);
el.qrButton?.addEventListener("click",showQrCode);
el.closeQr?.addEventListener("click",()=>el.qrModal.classList.add("hidden"));
el.qrModal?.addEventListener("click",event=>{
  if(event.target===el.qrModal) el.qrModal.classList.add("hidden");
});

async function init(){
  try{
    setupTelegram();
    renderMenus();
    renderResults();
    startCountdown();
    state.user=await ensureUser();
    const old=await existingVote();
    listenVotes();
    if(old) showThankYou(old);
  }catch(error){
    console.error(error);
    showToast("เชื่อมต่อ Firebase ไม่สำเร็จ");
  }finally{
    setTimeout(()=>el.loading.classList.add("hide"),350);
  }
}
init();
