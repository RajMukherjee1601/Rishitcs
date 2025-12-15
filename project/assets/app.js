/**
 * PMS UI (vanilla) – pagewise UI from the backlog sheet.
 * Data is stored in localStorage only (no backend).
 */

const STORE = {
  USERS: "pms_users_v1",
  SESSION: "pms_session_v1",
  BOOKINGS: "pms_bookings_v1",
};

function $(sel){ return document.querySelector(sel); }
function $all(sel){ return Array.from(document.querySelectorAll(sel)); }

function load(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

function toast(msg, type="ok"){
  const host = $("#alertHost");
  if(!host) return alert(msg);
  host.innerHTML = `<div class="alert ${type==='danger'?'danger':'ok'}">${escapeHtml(msg)}</div>`;
  setTimeout(()=>{ if(host) host.innerHTML=""; }, 3800);
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[m]));
}

function passwordValid(pw){
  // Max 30 chars, at least 1 upper, 1 lower, 1 special.
  if(!pw || pw.length > 30) return false;
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const special = /[^A-Za-z0-9]/.test(pw);
  return upper && lower && special;
}

function userIdValid(id){
  return typeof id === "string" && id.trim().length >= 5 && id.trim().length <= 20;
}

function ensureSeed(){
  // Seed one officer + one customer if empty, so you can test quickly.
  const users = load(STORE.USERS, []);
  if(users.length) return;
  users.push({
    role:"officer",
    userId:"officer01",
    password:"Officer@123",
    name:"Default Officer",
    email:"officer@example.com",
    phone:"+91 9999999999",
    address:"Parcel Office HQ",
    preferences:""
  });
  users.push({
    role:"customer",
    userId:"customer01",
    password:"Customer@123",
    name:"Default Customer",
    email:"customer@example.com",
    phone:"+91 8888888888",
    address:"Customer Address, ZIP 110001",
    preferences:"SMS updates"
  });
  save(STORE.USERS, users);
}

function getSession(){
  return load(STORE.SESSION, null);
}

function setSession(session){
  save(STORE.SESSION, session);
}

function logout(){
  localStorage.removeItem(STORE.SESSION);
  location.href = "../pages/login.html";
}

function requireAuth(){
  const s = getSession();
  if(!s){
    location.href = "../pages/login.html";
    return null;
  }
  return s;
}

function setupNav(active){
  const s = getSession();
  const welcome = $("#welcomeUser");
  if(welcome && s){
    welcome.textContent = `Welcome ${s.name} (${s.role})`;
  }
  const logoutBtn = $("#logoutBtn");
  if(logoutBtn) logoutBtn.addEventListener("click", logout);

  // Highlight active link
  $all(".nav a[data-page]").forEach(a=>{
    if(a.dataset.page === active) a.classList.add("active");
  });

  // Show/hide role sections
  $all("[data-role-only]").forEach(el=>{
    if(!s) return;
    const role = el.dataset.roleOnly;
    el.style.display = (role === s.role) ? "" : "none";
  });
}

function findUser(userId){
  const users = load(STORE.USERS, []);
  return users.find(u => u.userId === userId);
}

function createUser(user){
  const users = load(STORE.USERS, []);
  if(users.some(u=>u.userId===user.userId)) return {ok:false, msg:"User ID already exists."};
  users.push(user);
  save(STORE.USERS, users);
  return {ok:true};
}

function loginUser(role, userId, password){
  const users = load(STORE.USERS, []);
  const u = users.find(x => x.role === role && x.userId === userId);
  if(!u) return {ok:false, msg:"Invalid User ID or role."};
  if(u.password !== password) return {ok:false, msg:"Invalid password."};
  setSession({role:u.role, userId:u.userId, name:u.name, email:u.email});
  return {ok:true, user:u};
}

function bookings(){
  return load(STORE.BOOKINGS, []);
}
function saveBookings(items){
  save(STORE.BOOKINGS, items);
}

function generateBookingId(){
  // 12-digit random
  const n = Math.floor(Math.random()*9e11) + 1e11;
  return String(n);
}

function calcCost(weightKg, speed, packaging, insurance){
  // simple formula (you can tweak)
  const base = 50;
  const w = Math.max(0.1, weightKg);
  const speedMul = speed==="express" ? 2.0 : 1.0;
  const packMul = packaging==="fragile" ? 1.35 : packaging==="eco" ? 1.10 : packaging==="custom" ? 1.20 : 1.0;
  const insFee = insurance ? 35 : 0;
  return Math.round((base + (w*60))*speedMul*packMul + insFee);
}

function formatDateTimeLocal(val){
  if(!val) return "";
  try{
    const d = new Date(val);
    return d.toLocaleString();
  }catch{ return val; }
}
