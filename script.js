let map;
let waypoints = [];
let markers = [];
let waypointPath = null;
let isAddingWaypoints = true;
let pendingCoords = null;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat: 10, lng: 79 },
    mapTypeId: "hybrid",
  });

  map.addListener("click", handleMapClick);

  document.addEventListener("keydown", handleKeyDown);

  document
    .getElementById("exportBtn")
    .addEventListener("click", exportWaypoints);

  document
    .getElementById("confirmAltitude")
    .addEventListener("click", confirmAltitude);
  document
    .getElementById("cancelAltitude")
    .addEventListener("click", cancelAltitude);

  document
    .getElementById("altitudeInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        confirmAltitude();
      }
    });
}

function handleMapClick(event) {
  if (!isAddingWaypoints) return;

  const lat = event.latLng.lat();
  const lng = event.latLng.lng();

  pendingCoords = { lat, lng };
  showAltitudeModal(lat, lng);
}

function showAltitudeModal(lat, lng) {
  const modal = document.getElementById("altitudeModal");
  const coordsDisplay = document.getElementById("coordsDisplay");
  const altitudeInput = document.getElementById("altitudeInput");

  coordsDisplay.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  altitudeInput.value = "";
  modal.style.display = "block";
  altitudeInput.focus();
}

function confirmAltitude() {
  const altitudeInput = document.getElementById("altitudeInput");
  const altitude = parseFloat(altitudeInput.value) || 0;

  if (pendingCoords) {
    addWaypoint(pendingCoords.lat, pendingCoords.lng, altitude);
    pendingCoords = null;
  }

  hideAltitudeModal();
}

function cancelAltitude() {
  pendingCoords = null;
  hideAltitudeModal();
}

function hideAltitudeModal() {
  document.getElementById("altitudeModal").style.display = "none";
}

function addWaypoint(lat, lng, altitude) {
  const waypoint = {
    id: waypoints.length + 1,
    latitude: lat,
    longitude: lng,
    altitude: altitude,
  };

  const marker = new google.maps.Marker({
    position: { lat, lng },
    map: map,
    title: `Waypoint ${waypoint.id}\nAlt: ${altitude}m`,
    icon: {
      url:
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
          <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
            <circle cx="14" cy="14" r="14" fill="#2196F3"/>
            <circle cx="14" cy="14" r="12" fill="#1976D2"/>
            <text x="14" y="18" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold">${waypoint.id}</text>
          </svg>
        `),
      scaledSize: new google.maps.Size(28, 28),
      anchor: new google.maps.Point(14, 14),
    },
  });

  waypoint.marker = marker;
  waypoints.push(waypoint);

  updateWaypointPath();
  updateStatus();
}

function updateWaypointPath() {
  const pathCoords = waypoints.map((wp) => ({
    lat: wp.latitude,
    lng: wp.longitude,
  }));

  if (pathCoords.length >= 2) {
    if (!waypointPath) {
      waypointPath = new google.maps.Polyline({
        path: pathCoords,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
      });
      waypointPath.setMap(map);
    } else {
      waypointPath.setPath(pathCoords);
    }
  }
}

function handleKeyDown(event) {
  if (event.key === "Escape") {
    if (document.getElementById("altitudeModal").style.display === "block") {
      cancelAltitude();
    } else if (isAddingWaypoints) {
      finishAddingWaypoints();
    }
  }
}

function finishAddingWaypoints() {
  isAddingWaypoints = false;
  document.getElementById("exportBtn").disabled = waypoints.length === 0;
  updateStatus();
}

function updateStatus() {
  const statusElement = document.getElementById("status");

  if (isAddingWaypoints) {
    statusElement.textContent = `${waypoints.length} waypoint(s) added. Click on the map to add more. Press ESC to finish.`;
  } else {
    statusElement.textContent = `Finished adding waypoints. Total: ${waypoints.length}`;
  }
}

function exportWaypoints() {
  if (waypoints.length === 0) {
    alert("No waypoints to export!");
    return;
  }

  const exportData = {
    waypoints: waypoints,
    totalCount: waypoints.length,
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `waypoints_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

document
  .getElementById("altitudeModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      cancelAltitude();
    }
  });

function resetWaypoints() {
  waypoints.forEach((waypoint) => {
    waypoint.marker.setMap(null);
  });
  waypoints = [];

  if (waypointPath) {
    waypointPath.setMap(null);
    waypointPath = null;
  }
}
