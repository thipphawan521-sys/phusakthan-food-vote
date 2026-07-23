import { db } from "./firebase.js";
import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const style = document.createElement("style");
style.textContent = `
  .vote-closed-overlay{
    position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:22px;
    background:rgba(67,35,24,.72);backdrop-filter:blur(12px)
  }
  .vote-closed-card{
    width:min(100%,440px);padding:30px;text-align:center;border-radius:30px;
    color:#573124;background:linear-gradient(145deg,#fffdf5,#f8e8ca);
    box-shadow:0 30px 80px rgba(0,0,0,.28)
  }
  .vote-closed-card .icon{font-size:52px}
  .vote-closed-card h2{margin:8px 0;font-size:30px}
  .vote-closed-card p{margin:0;color:#8b6b5e}
`;
document.head.appendChild(style);

let overlay = null;

function showClosed(){
  if(overlay) return;
  overlay = document.createElement("div");
  overlay.className = "vote-closed-overlay";
  overlay.innerHTML = `<div class="vote-closed-card">
    <div class="icon">🔒</div>
    <h2>ปิดรับการโหวตแล้ว</h2>
    <p>ขอบคุณทุกท่านที่ร่วมโหวต สามารถติดตามผลคะแนนได้จากหน้าสรุปผล</p>
  </div>`;
  document.body.appendChild(overlay);
}

function hideClosed(){
  overlay?.remove();
  overlay = null;
}

onSnapshot(doc(db,"settings","vote"),snapshot=>{
  const isOpen = snapshot.exists() ? snapshot.data().isOpen !== false : true;
  if(isOpen) hideClosed();
  else showClosed();
},error=>console.error("Vote status error:",error));
