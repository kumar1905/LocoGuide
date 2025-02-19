

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
       (Default view set to match OpenStationMap link)
    -------------------------------------*/
    let map;
    let routingControl;
    let userMarker;
    let routePanel;
    let currentStation = null; // holds current station data

    function initMap() {
      // Default location from the provided link: lat=17.4495, lon=78.4672 and zoom level ~12
      const defaultLatLng = [17.4495, 78.4672];
      map = L.map('map').setView(defaultLatLng, 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Leaflet &copy; OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(map);

      userMarker = L.marker(defaultLatLng).addTo(map);

      routingControl = L.Routing.control({
        routeWhileDragging: false,
        showAlternatives: false,
        addWaypoints: false,
        lineOptions: { styles: [{ color: '#007bff', opacity: 1, weight: 5 }] },
        createMarker: function() { return null; }
      }).on('routesfound', function(e) {
        const summary = e.routes[0].summary;
        document.getElementById('distance').innerHTML = (summary.totalDistance / 1000).toFixed(2) + ' km';
        document.getElementById('time').innerHTML = (summary.totalTime / 60).toFixed(2) + ' minutes';
      }).addTo(map);

      routePanel = document.getElementsByClassName('leaflet-routing-container')[0];
    }

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
      
              // Zoom in when the search button is clicked
              map.setView([result.lat, result.lon], 17); // Adjust zoom level as needed
      
              L.marker([result.lat, result.lon]).addTo(map)
                .bindPopup("Searched Station")
                .openPopup();
      
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

    /* -----------------------------------
       3) Additional API Integration: Station Details
       (Simulating integration with an OpenStationMap or similar API)
    -------------------------------------*/
    function fetchStationDetails(lat, lon) {
      // NOTE: Replace the URL below with the actual API endpoint and parameters.
      const apiUrl = `https://api.openstationmap.org/v1/station-details?lat=${lat}&lon=${lon}`;
      // For demo purposes, we simulate an API call with dummy data:
      // Uncomment and adjust the fetch below if you have an actual API.
      /*
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          displayTrainInfo(data);
        })
        .catch(error => {
          console.error("Error fetching station extra details:", error);
        });
      */
      // Simulated data:
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
       4) Navigation & Routing
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
    // document.getElementById('setAlarm').addEventListener('click', function() {
    //   document.getElementById('alarmModal').style.display = 'flex';
    // });
    // document.getElementById('confirmAlarm').addEventListener('click', function() {
    //   document.getElementById('alarmModal').style.display = 'none';
    //   alert('Alarm set for your destination!');
    // });

    document.getElementById('startNavigation').addEventListener('click', function() {
      window.location.href = "gptmpa.html";
    });


    document.getElementById('searchBtn').addEventListener('click', searchStation);
    document.getElementById('stationSearch').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchStation();
      }
    });

    // Refresh train info on button click
    document.getElementById('refreshTrainInfo').addEventListener('click', function() {
      if (currentStation) {
        fetchStationDetails(currentStation.lat, currentStation.lon);
      } else {
        alert("Please search for a station first.");
      }
    });

    window.onload = function() {
      initMap();
    };
    
