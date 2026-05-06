<!DOCTYPE html>
<html>
<head>
  <title>Y1CRM SaaS</title>

  <style>
    body {
      margin: 0;
      font-family: Arial;
      display: flex;
      background: #f4f6f9;
    }

    /* ================= SIDEBAR ================= */
    .sidebar {
      width: 220px;
      background: #111827;
      color: white;
      height: 100vh;
      padding: 15px;
    }

    .sidebar h2 {
      font-size: 18px;
      margin-bottom: 20px;
    }

    .menu {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .menu div {
      padding: 10px;
      background: #1f2937;
      border-radius: 6px;
      cursor: pointer;
    }

    /* ================= MAIN ================= */
    .main {
      flex: 1;
      padding: 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .stats {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .card {
      flex: 1;
      background: white;
      padding: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      text-align: center;
    }

    /* ================= PIPELINE ================= */
    .board {
      display: flex;
      gap: 10px;
      overflow-x: auto;
    }

    .col {
      min-width: 240px;
      background: white;
      border-radius: 10px;
      padding: 10px;
      height: 70vh;
      overflow-y: auto;
    }

    .lead {
      background: #f9fafb;
      padding: 10px;
      margin: 8px 0;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }

    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 6px 10px;
      border-radius: 6px;
      cursor: pointer;
    }

    input, select {
      width: 100%;
      padding: 6px;
      margin-top: 5px;
    }
  </style>
</head>

<body>

<!-- SIDEBAR -->
<div class="sidebar">
  <h2>🚀 Y1CRM</h2>

  <div class="menu">
    <div>📊 Dashboard</div>
    <div>📁 Leads</div>
    <div>📈 Analytics</div>
    <div>👥 Team</div>
    <div>⚙️ Settings</div>
  </div>
</div>

<!-- MAIN -->
<div class="main">

<header>
  <h2>Dashboard</h2>
  <button onclick="logout()">Logout</button>
</header>

<!-- STATS -->
<div class="stats">
  <div class="card">Total <div id="total">0</div></div>
  <div class="card">Interested <div id="hot">0</div></div>
  <div class="card">Closed <div id="closed">0</div></div>
</div>

<!-- PIPELINE -->
<div class="board">

  <div class="col">
    <h3>New</h3>
    <div id="New"></div>
  </div>

  <div class="col">
    <h3>Contacted</h3>
    <div id="Contacted"></div>
  </div>

  <div class="col">
    <h3>Interested</h3>
    <div id="Interested"></div>
  </div>

  <div class="col">
    <h3>Not Interested</h3>
    <div id="Not Interested"></div>
  </div>

  <div class="col">
    <h3>Closed Won</h3>
    <div id="Closed Won"></div>
  </div>

</div>

</div>

<script>

const API = "https://crm-backend-svnl.onrender.com";

let user = JSON.parse(localStorage.getItem("user"));
let token = localStorage.getItem("token");

if (!user || !token) location.href = "index.html";

function logout(){
  localStorage.clear();
  location.href = "index.html";
}

/* ================= LOAD ================= */
function loadLeads() {
  fetch(API + "/leads", {
    headers: { Authorization: token }
  })
  .then(r => r.json())
  .then(data => {

    ["New","Contacted","Interested","Not Interested","Closed Won"].forEach(s=>{
      document.getElementById(s).innerHTML = "";
    });

    document.getElementById("total").innerText = data.length;
    document.getElementById("hot").innerText = data.filter(l=>l.status==="Interested").length;
    document.getElementById("closed").innerText = data.filter(l=>l.status==="Closed Won").length;

    data.forEach(l => {
      const el = document.createElement("div");
      el.className = "lead";

      el.innerHTML = `
        <b>${l.name}</b><br>
        📞 ${l.phone}

        <select onchange="updateStatus('${l._id}',this.value)">
          <option ${l.status==="New"?"selected":""}>New</option>
          <option ${l.status==="Contacted"?"selected":""}>Contacted</option>
          <option ${l.status==="Interested"?"selected":""}>Interested</option>
          <option ${l.status==="Not Interested"?"selected":""}>Not Interested</option>
          <option ${l.status==="Closed Won"?"selected":""}>Closed Won</option>
        </select>

        <input id="note-${l._id}" placeholder="Add note">
        <button onclick="addNote('${l._id}')">Save</button>
      `;

      const col = document.getElementById(l.status);
      if(col) col.appendChild(el);
    });

  });
}

/* ================= STATUS ================= */
function updateStatus(id,status){
  fetch(API+"/leads/"+id,{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({status})
  }).then(loadLeads);
}

/* ================= NOTE ================= */
function addNote(id){
  fetch(API+"/leads/"+id+"/note",{
    method:"PUT",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({
      text:document.getElementById("note-"+id).value
    })
  }).then(loadLeads);
}

loadLeads();

</script>

</body>
</html>