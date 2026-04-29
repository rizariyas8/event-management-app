console.log("JS Loaded");

let events = [];
let registeredEvents = [];
let notifications = [];
window.imageData = "";

/* ================= GET USER ================= */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

/* ================= SAFE USER ID ================= */
function getUserId(user) {
  return user?.userId || user?.id || user?._id || null;
}

/* ================= UI ================= */
function setupUI() {
  const user = getUser();
  if (!user) return;

  const createBtn = document.getElementById("createBtn");
  const myEventsBtn = document.getElementById("myEventsBtn");

  if (user.role === "organizer") {
    if (createBtn) createBtn.style.display = "inline-block";
    if (myEventsBtn) myEventsBtn.style.display = "none";
  } else {
    if (createBtn) createBtn.style.display = "none";
    if (myEventsBtn) myEventsBtn.style.display = "inline-block";
  }
}

/* ================= LOAD EVENTS ================= */
async function loadEvents() {
  const user = getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  setupUI();

  try {
    const res = await fetch("https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getEvents");

    let data = [];
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    events = Array.isArray(data) ? data : [];

    await loadRegisteredEvents();
    displayEvents(events);
    setupSearch();

  } catch (err) {
    console.error("Load Events Error:", err);
  }
  
}
/* ================= search ================= */
function setupSearch() {
  const searchInput = document.getElementById("search");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase().trim();

    if (!value) {
      displayEvents(events);
      return;
    }

    const filtered = events.filter(event =>
      (event.title || "").toLowerCase().includes(value) ||
      (event.category || "").toLowerCase().includes(value) ||
      (event.description || "").toLowerCase().includes(value)
    );

    displayEvents(filtered);
  });
}



/* ================= REGISTERED ================= */
async function loadRegisteredEvents() {
  const user = getUser();
  const userId = getUserId(user);

  if (!userId) return;

  try {
    const res = await fetch(
      `https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getUserRegistrations?userId=${userId}`
    );

    let data = [];
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    registeredEvents = (Array.isArray(data) ? data : []).map(r => r.eventId);

  } catch (err) {
    console.error("Load Registered Error:", err);
  }
}

/* ================= LOGIN ================= */
function login() {
  let name = document.getElementById("name")?.value.trim();
  let email = document.getElementById("email")?.value.trim();
  let role = document.getElementById("role")?.value;

  if (!name) {
    alert("Enter name");
    return;
  }

  if (!email) {
    alert("Enter email");
    return;
  }

  const userId = name.toLowerCase().replace(/\s+/g, "") + "_" + Date.now();

  const user = {
    userId: userId,
    name: name,
    email: email,
    role: role
  };

  localStorage.setItem("user", JSON.stringify(user));

  alert("Logged in as " + role);

  window.location.href = "index.html";
}

/* ================= MICROSOFT LOGIN ================= */
  function handleMicrosoftLogin() {
  window.location.href = "auth-coming-soon.html";
}

/* OPTIONAL: make sure functions are global */
window.login = login;
window.handleMicrosoftLogin = handleMicrosoftLogin;

/* ================= DISPLAY ================= */
function displayEvents(list) {
  const user = getUser();
  const isOrganizer = user?.role === "organizer";

  const container = document.getElementById("events");
  if (!container) return;

  container.innerHTML = "";

  list.forEach((event, index) => {
    const isRegistered = registeredEvents.includes(event.id);

    container.innerHTML += `
      <div class="event-card">

        <img src="${event.image || 'https://source.unsplash.com/800x600/?event'}">

        <h3>${event.title}</h3>
        <p>${event.date}</p>
        <p>${event.category}</p>
        <p>${event.description}</p>

        <div class="btn-group">

          ${!isOrganizer ? `
            <button onclick="registerEvent('${event.id}')" ${isRegistered ? "disabled" : ""}>
              ${isRegistered ? "Registered" : "Register"}
            </button>
          ` : ""}

          ${isOrganizer ? `<button onclick="editEvent(${index})">Edit</button>` : ""}
          ${isOrganizer ? `<button onclick="deleteEvent('${event.id}')">Delete</button>` : ""}
          ${isOrganizer ? `<button onclick="viewParticipants('${event.id}')">Participants</button>` : ""}

        </div>

      </div>
    `;
  });
}

/* ================= REGISTER ================= */
async function registerEvent(eventId) {
  const user = getUser();

  const userId = getUserId(user);
  const email = user?.email;

  if (!userId || !email || !eventId) {
    alert("Missing user data. Please login again.");
    return;
  }

  try {
    const res = await fetch(
      "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/registerEvent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, eventId, email })
      }
    );

    let result = {};
    try {
      result = await res.json();
    } catch {
      console.warn("No JSON response from server");
    }

    if (!res.ok) {
      alert(result.message || "Registration failed");
      return;
    }

    alert("Registered successfully!");

    await loadEvents();
    loadNotifications();

  } catch (err) {
    console.error("Register Error:", err);
  }
}

/* ================= PARTICIPANTS ================= */
async function viewParticipants(eventId) {
  const box = document.getElementById("participantsBox");
  const list = document.getElementById("participantsList");

  if (!box || !list) return;

  box.style.display = "block";

  try {
    const res = await fetch(
      `https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getEventRegistrations?eventId=${eventId}`
    );

    let data = [];
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    list.innerHTML = (Array.isArray(data) ? data : []).map((p, i) => `
      <div style="padding:8px;border-bottom:1px solid #ddd;">
        ${i + 1}. ${p.userId}
      </div>
    `).join("");

  } catch (err) {
    console.error("Participants Error:", err);
  }
}

/* ================= IMAGE ================= */
document.addEventListener("change", function (e) {
  if (e.target.id === "image") {
    const reader = new FileReader();

    reader.onload = function (event) {
      window.imageData = event.target.result;

      const img = document.getElementById("previewImg");
      if (img) {
        img.src = event.target.result;
        img.style.display = "block";
      }
    };

    reader.readAsDataURL(e.target.files[0]);
  }
});

/* ================= UPLOAD IMAGE ================= */
async function uploadImageIfNeeded(customEventId) {
  if (!window.imageData) return null;

  const eventId = customEventId || Date.now().toString();

  try {
    const res = await fetch(
      "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/uploadImage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          image: window.imageData.split(",")[1]
        })
      }
    );

    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) return null;

    return { imageUrl: data?.imageUrl, eventId };

  } catch (err) {
    console.error("Upload Error:", err);
    return null;
  }
}

/* ================= SUBMIT ================= */
async function handleSubmit(e) {
  e.preventDefault();

  const editData = JSON.parse(localStorage.getItem("editEvent"));

  const uploadResult = await uploadImageIfNeeded(editData?.id);
  const newId = Date.now().toString();

  const data = {
    id: editData ? String(editData.id).trim() : (uploadResult?.eventId || newId),
    title: document.getElementById("title").value,
    date: document.getElementById("date").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    image: uploadResult?.imageUrl || editData?.image || window.imageData || ""
  };

  const url = editData
    ? "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/updateEvent"
    : "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/addEvent";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      alert("Error");
      return;
    }

    localStorage.removeItem("editEvent");
    alert(editData ? "Event Updated!" : "Event Added!");
    window.location.href = "index.html";

  } catch (err) {
    console.error("Submit Error:", err);
  }
}

/* ================= DELETE ================= */
async function deleteEvent(id) {
  if (!confirm("Are you sure?")) return;

  try {
    await fetch(
      "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/deleteEvent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      }
    );

    loadEvents();

  } catch (err) {
    console.error(err);
  }
}

/* ================= EDIT ================= */
function editEvent(index) {
  const event = events[index];
  localStorage.setItem("editEvent", JSON.stringify(event));
  window.location.href = "create.html";
}

/* ================= GLOBAL ================= */
window.deleteEvent = deleteEvent;
window.editEvent = editEvent;
window.registerEvent = registerEvent;
window.viewParticipants = viewParticipants;

/* ================= NOTIFICATIONS ================= */
function setupNotificationsUI() {
  const user = getUser();
  const container = document.getElementById("notifContainer");

  if (!user || !container) return;

  if (user.role === "user") {
    container.style.display = "block";
    loadNotifications();
  } else {
    container.style.display = "none";
  }

  const icon = document.getElementById("notifIcon");
  if (icon) {
    icon.addEventListener("click", toggleNotifications);
  }
}

async function loadNotifications() {
  const user = getUser();
  const userId = getUserId(user);

  if (!userId) return;

  try {
    const res = await fetch(
      `https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getNotifications?userId=${userId}`
    );

    let data = [];
    try {
      data = await res.json();
    } catch {
      data = [];
    }

    notifications = Array.isArray(data) ? data : [];

    displayNotifications();

  } catch (err) {
    console.error("Notification error:", err);
  }
}

function displayNotifications() {
  const box = document.getElementById("notifBox");
  const count = document.getElementById("notifCount");

  if (!box || !count) return;

  const unread = notifications.filter(n => !n.isRead).length;
  count.innerText = unread;

  box.innerHTML = "";

  if (!notifications.length) {
    box.innerText = "No notifications";
    return;
  }

  notifications.forEach(n => {
    const div = document.createElement("div");
    div.style.padding = "10px";
    div.style.borderBottom = "1px solid #ddd";

    if (n.message.includes("Reminder")) {
      div.textContent = "📅 " + n.message;
    } else {
      div.textContent = "🔔 " + n.message;
    }

    box.appendChild(div);
  });
}


function toggleNotifications() {
  const box = document.getElementById("notifBox");

  const isOpening = box.style.display !== "block";
  box.style.display = isOpening ? "block" : "none";

  if (isOpening) setTimeout(markAllAsRead, 2000);
}

async function markAllAsRead() {
  const user = getUser();
  const userId = getUserId(user);

  if (!userId) return;

  await fetch(
    `https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/markNotificationsRead?userId=${userId}`,
    { method: "POST" }
  );

  loadNotifications();
}


/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eventForm");
  if (form) form.addEventListener("submit", handleSubmit);

  // ✅ Only run on pages that have events
  if (document.getElementById("events")) {
    loadEvents();
    setupNotificationsUI();
  }
});


/* ================= LOGOUT ================= */
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
} 

