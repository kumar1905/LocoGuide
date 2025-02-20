// Hamburger menu and dark mode toggling
document.getElementById("hamburgerBtn").addEventListener("click", function() {
  document.querySelector(".dropdown-menu").classList.toggle("show");
});

document.getElementById("modeToggle").addEventListener("click", function() {
  // document.body.classList.toggle("dark-mode");
  let icon = this.querySelector("i");
  icon.classList.toggle("fa-moon");
  icon.classList.toggle("fa-sun");
});

window.onclick = function(event) {
  if (!event.target.closest(".hamburger-menu")) {
      document.querySelector(".dropdown-menu").classList.remove("show");
  }
};

/* -----------------------------------
 1) Initialize Map & Routing
-------------------------------------*/
let map;
let routingControl;
let userMarker;
let currentStation = null; // holds current station data

function initMap() {
// Default location: Hyderabad, India
const defaultLatLng = [17.4495, 78.4672];

map = L.map('map').setView(defaultLatLng, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Leaflet &copy; OpenStreetMap contributors',
    maxZoom: 18
}).addTo(map);

userMarker = L.marker(defaultLatLng).addTo(map);

// Add Routing Control with default waypoints (will update later)
routingControl = L.Routing.control({
    routeWhileDragging: true,
    showAlternatives: true,
    addWaypoints: true,
    lineOptions: { styles: [{ color: '#007bff', opacity: 1, weight: 5 }] }
}).addTo(map);
}

/* -----------------------------------
 2) Station Search & Routing
-------------------------------------*/
function searchStation() {
let query = document.getElementById('stationSearch').value.trim();
if (!query) {
  alert("Please enter a station name.");
  return;
}
query = query + " railway station";
fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
  .then(response => response.json())
  .then(data => {
    if (data && data.length > 0) {
      const result = data[0];
      currentStation = result;
      document.getElementById('stationNameHeading').innerText = result.display_name;
      document.getElementById('stationDescription').innerText =
        `Latitude: ${result.lat}, Longitude: ${result.lon}`;
      document.getElementById('stationDetails').style.display = 'block';
      document.getElementById('nearbyFacilities').style.display = 'block';

      // Zoom to the searched station
      map.setView([result.lat, result.lon], 17);

      // Get the latest current location
      getCurrentLocation().then(position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        userMarker.setLatLng([userLat, userLng]);
        userMarker.bindPopup("You are here").openPopup();

        // Update routing control with current location and searched station
        routingControl.setWaypoints([
          L.latLng(userLat, userLng),
          L.latLng(result.lat, result.lon)
        ]);
      }).catch(error => {
        alert("Could not get your current location.");
      });

      // Optionally, fetch nearby facilities and station details
      fetchNearbyFacilities(result.lat, result.lon);
      fetchStationDetails(result.lat, result.lon);
    } else {
      alert('Station not found! Please try another search term.');
    }
  })
  .catch(error => {
    console.error('Error fetching station details:', error);
    alert('Error fetching station details. Please try again later.');
  });
}

/* -----------------------------------
 3) Nearby Facilities & Station Details
-------------------------------------*/
function fetchNearbyFacilities(lat, lon) {
const radius = 1000;
const overpassQuery = `[out:json];(node["amenity"="cafe"](around:${radius},${lat},${lon});node["amenity"="fast_food"](around:${radius},${lat},${lon}););out;`;
const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(overpassQuery);
fetch(url)
  .then(response => response.json())
  .then(data => {
    displayNearbyFacilities(data.elements);
  })
  .catch(error => {
    console.error("Error fetching nearby facilities:", error);
  });
}

function displayNearbyFacilities(facilities) {
const container = document.getElementById("nearbyFacilities");
container.innerHTML = "<h3>Nearby Coffee Shops & Food Courts:</h3>";
if (!facilities || facilities.length === 0) {
  container.innerHTML += "<p>No nearby facilities found.</p>";
  return;
}
facilities.forEach(facility => {
  const facilityDiv = document.createElement("div");
  facilityDiv.className = "facility-item";

  const facilityType = facility.tags.amenity === "cafe" ? "Coffee Shop" : "Food Court";
  const facilityName = facility.tags.name || "Unnamed";
  facilityDiv.innerHTML = `<span><i class="fas fa-${facility.tags.amenity === "cafe" ? "coffee" : "utensils"}"></i> ${facilityType} - ${facilityName}</span>`;

  const navBtn = document.createElement("button");
  navBtn.className = "navigate-btn";
  navBtn.innerText = "Navigate";
  navBtn.addEventListener("click", () => {
    navigateToFacility(facility.lat, facility.lon);
  });

  facilityDiv.appendChild(navBtn);
  container.appendChild(facilityDiv);
});
}

function fetchStationDetails(lat, lon) {
// Simulated API call with dummy data:
const dummyData = {
  trains: [
    { name: "Train A", status: "On Time", arrival: "12:30" },
    { name: "Train B", status: "Delayed", arrival: "12:45" }
  ]
};
displayTrainInfo(dummyData);
}

function displayTrainInfo(data) {
const trainInfoPanel = document.getElementById("trainInfo");
const trainInfoContent = document.getElementById("trainInfoContent");
trainInfoPanel.style.display = 'block';
trainInfoContent.innerHTML = "";
if (data && data.trains && data.trains.length > 0) {
  data.trains.forEach(train => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${train.name}</strong>: ${train.status} (ETA: ${train.arrival})`;
    trainInfoContent.appendChild(div);
  });
} else {
  trainInfoContent.innerHTML = "No train information available.";
}
}

/* -----------------------------------
 4) Navigation & Routing to Facilities
-------------------------------------*/
async function navigateToFacility(destLat, destLng) {
try {
  const position = await getCurrentLocation();
  const userLat = position.coords.latitude;
  const userLng = position.coords.longitude;

  userMarker.setLatLng([userLat, userLng]);
  userMarker.bindPopup("You are here").openPopup();

  routingControl.setWaypoints([
    L.latLng(userLat, userLng),
    L.latLng(destLat, destLng)
  ]);
} catch (error) {
  alert("Could not get your current location.");
}
}

function getCurrentLocation() {
return new Promise((resolve, reject) => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
  } else {
    reject("Geolocation not supported");
  }
});
}

/* -----------------------------------
 5) Additional Dashboard Features & Event Listeners
-------------------------------------*/
document.getElementById('startNavigation').addEventListener('click', function() {
window.location.href = "gptmpa.html";
});

document.getElementById('searchBtn').addEventListener('click', searchStation);
document.getElementById('stationSearch').addEventListener('keypress', function(e) {
if (e.key === 'Enter') {
  searchStation();
}
});

document.getElementById('refreshTrainInfo').addEventListener('click', function() {
if (currentStation) {
  fetchStationDetails(currentStation.lat, currentStation.lon);
} else {
  alert("Please search for a station first.");
}
});

window.onload = function() {
initMap();
// Update user location immediately
getCurrentLocation().then(position => {
  const userLat = position.coords.latitude;
  const userLng = position.coords.longitude;
  userMarker.setLatLng([userLat, userLng]);
  userMarker.bindPopup("You are here").openPopup();
}).catch(error => {
  console.error("Could not fetch current location:", error);
});

// --- Chat Module Setup ---
const chatModule = document.getElementById("chatModule");
const chatToggle = document.getElementById("chatToggle");
const chatClose = document.getElementById("chatClose");
const chatSend = document.getElementById("chatSend");
const chatInput = document.getElementById("chatInput");
const chatBody = document.getElementById("chatBody");

// Toggle chat window
chatToggle.addEventListener("click", () => {
  chatModule.style.display = chatModule.style.display === "flex" ? "none" : "flex";
});
chatClose.addEventListener("click", () => {
  chatModule.style.display = "none";
});

// Send chat message on button click or Enter key
function sendMessage() {
  const text = chatInput.value.trim();
  if (text === "") return;
  addChatMessage("user", text);
  chatInput.value = "";
  // Process message (simulate response or use voice assistant)
  processChatMessage(text);
}
chatSend.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// Basic function to display chat messages
function addChatMessage(sender, text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${sender}`;
  messageDiv.innerText = text;
  chatBody.appendChild(messageDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Process chat message (this example includes a basic voice assistant integration)
function processChatMessage(message) {
  // For demonstration, we simply respond based on keywords.
  // In a real app, you might query a backend or use a more advanced NLP engine.
  let response = "";
  if (message.toLowerCase().includes("station details")) {
    response = currentStation 
      ? `Station: ${currentStation.display_name}. Coordinates: ${currentStation.lat}, ${currentStation.lon}` 
      : "Please search for a station first.";
  } else if (message.toLowerCase().includes("platform")) {
    response = "Platform information is currently unavailable. Please check the station display screens.";
  } else if (message.toLowerCase().includes("food")) {
    response = "Nearby food courts and coffee shops are listed in the dashboard.";
  } else if (message.toLowerCase().includes("ticket")) {
    response = "Ticket counters are located near the main entrance of the station.";
  } else if (message.toLowerCase().includes("restroom")) {
    response = "Restrooms are available near the waiting area.";
  } else {
    response = "I'm here to help! Ask me about station details, platforms, food courts, ticket counters, or restrooms.";
  }
  // Simulate a delay and then show the response
  setTimeout(() => {
    addChatMessage("assistant", response);
    // Optionally, use the Web Speech API to speak the response
    speakResponse(response);
  }, 500);
}

// Basic voice response using Web Speech API
function speakResponse(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  }
}
};
