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
