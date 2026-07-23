import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const DEFAULT_THEME = {
  name: "Sunset",
  primary: "#ff8a3d",
  secondary: "#ff6756",
  accent: "#ffe57e",
  background: "#fff8e9",
  text: "#573124",
  card: "#fffdf6"
};

const PRESETS = {
  sunset: DEFAULT_THEME,
  nature: {
    name: "Nature",
    primary: "#4f8a57",
    secondary: "#7aaa61",
    accent: "#f3d889",
    background: "#f4f7e9",
    text: "#2f4934",
    card: "#fffdf5"
  },
  ocean: {
    name: "Ocean",
    primary: "#2486b9",
    secondary: "#45b7c9",
    accent: "#ffd56b",
    background: "#eaf8fb",
    text: "#173f52",
    card: "#ffffff"
  },
  royal: {
    name: "Royal",
    primary: "#7450a8",
    secondary: "#a166b3",
    accent: "#f2c66d",
    background: "#f6effa",
    text: "#402d55",
    card: "#fffaff"
  },
  rose: {
    name: "Rose",
    primary: "#d95e7d",
    secondary: "#f08a9e",
    accent: "#ffd2a6",
    background: "#fff1f4",
    text: "#673345",
    card: "#fffafd"
  },
  luxury: {
    name: "Luxury",
    primary: "#8f6b32",
    secondary: "#c59b49",
    accent: "#f3dd9b",
    background: "#f7f1e4",
    text: "#44351f",
    card: "#fffdf6"
  }
};

function hexToRgb(hex) {
  const clean = String(hex || "").replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return { r: 255, g: 138, b: 61 };
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function mix(hex1, hex2, weight = 0.5) {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  const w = Math.max(0, Math.min(1, weight));
  const toHex = value => Math.round(value).toString(16).padStart(2, "0");
  return `#${toHex(a.r * (1 - w) + b.r * w)}${toHex(a.g * (1 - w) + b.g * w)}${toHex(a.b * (1 - w) + b.b * w)}`;
}

function applyTheme(theme = DEFAULT_THEME) {
  const finalTheme = { ...DEFAULT_THEME, ...theme };
  const root = document.documentElement;

  root.style.setProperty("--theme-primary", finalTheme.primary);
  root.style.setProperty("--theme-secondary", finalTheme.secondary);
  root.style.setProperty("--theme-accent", finalTheme.accent);
  root.style.setProperty("--theme-background", finalTheme.background);
  root.style.setProperty("--theme-text", finalTheme.text);
  root.style.setProperty("--theme-card", finalTheme.card);

  // รองรับชื่อตัวแปรเดิมที่มักใช้ใน style.css
  root.style.setProperty("--orange", finalTheme.primary);
  root.style.setProperty("--coral", finalTheme.secondary);
  root.style.setProperty("--yellow", finalTheme.accent);
  root.style.setProperty("--cream", finalTheme.background);
  root.style.setProperty("--brown", finalTheme.text);

  document.body.style.background = `
    radial-gradient(circle at 15% 8%, ${mix(finalTheme.accent, "#ffffff", 0.15)} 0%, transparent 31%),
    linear-gradient(145deg, ${mix(finalTheme.primary, "#ffffff", 0.18)} 0%, ${finalTheme.primary} 48%, ${finalTheme.secondary} 100%)
  `;
  document.body.style.color = finalTheme.text;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", finalTheme.primary);

  document.dispatchEvent(new CustomEvent("phusakthan-theme-applied", { detail: finalTheme }));
}

window.PHUSAKTHAN_THEMES = PRESETS;
window.applyPhusakthanTheme = applyTheme;

onSnapshot(
  doc(db, "settings", "theme"),
  snapshot => applyTheme(snapshot.exists() ? snapshot.data() : DEFAULT_THEME),
  error => {
    console.error("Theme load error:", error);
    applyTheme(DEFAULT_THEME);
  }
);
