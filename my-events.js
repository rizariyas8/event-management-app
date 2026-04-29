console.log("My Events Page Loaded");

async function loadMyEvents() {

  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  try {

    // 1️⃣ Get registrations
    const res1 = await fetch(
      `https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getUserRegistrations?userId=${user.userId}`
    );

    const registrations = await res1.json();

    if (!registrations.length) {
      document.getElementById("myEvents").innerHTML =
        "<h2 style='text-align:center;'>No registrations yet</h2>";
      return;
    }

    const eventIds = registrations.map(r => r.eventId);

    // 2️⃣ Get all events
    const res2 = await fetch(
      "https://event-api-riza-gsfsabc5cjc4g2am.eastasia-01.azurewebsites.net/api/getEvents"
    );

    const events = await res2.json();

    // 3️⃣ Filter only registered events
    const myEvents = events.filter(e => eventIds.includes(e.id));

    displayMyEvents(myEvents);

  } catch (err) {
    console.error(err);
  }
}

/* ================= DISPLAY ================= */
function displayMyEvents(list) {

  const container = document.getElementById("myEvents");

  if (!list.length) {
    container.innerHTML = "<h2>No events found</h2>";
    return;
  }

  let html = "";

  list.forEach(event => {

    html += `
      <div class="event-card">

        <img src="${event.image || 'https://source.unsplash.com/800x600/?event'}">

        <h3>${event.title}</h3>
        <p>📅 ${new Date(event.date).toDateString()}</p>
        <p>📂 ${event.category}</p>
        <p>📝 ${event.description}</p>

        <button disabled>Registered</button>

      </div>
    `;
  });

  container.innerHTML = html;
}

loadMyEvents();
