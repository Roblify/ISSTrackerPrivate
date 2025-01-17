let mapStyle;

mapboxgl.accessToken = 'pk.eyJ1Ijoicm9ibGlmeSIsImEiOiJjbHU0aXoyb3IxZTk3MmlueTQ4NzJvZjIyIn0.aQWpENes8Dl0k8j6dHs00A';
var map = new mapboxgl.Map({
    container: 'map',
    style: mapStyle || 'mapbox://styles/mapbox/streets-v11',
    center: [0, 0],
    zoom: 2
});

let isLocked = false;
let updateInterval;
let updateFrequency = 1000;

document.getElementById('lockButton').addEventListener('click', function () {
    isLocked = !isLocked;
    map.dragPan.disable();
    map.scrollZoom.disable();

    clearInterval(updateInterval);

    if (isLocked) {
        map.flyTo({ center: [15, 17], zoom: 1.7 });
    } else {
        map.dragPan.enable();
        map.scrollZoom.enable();
    }
});

var issIcon = new mapboxgl.Marker({
    element: document.createElement('img'),
    anchor: 'bottom'
});

issIcon.getElement().src = 'ISS.png';
issIcon.getElement().style.width = '50px';
issIcon.getElement().style.height = '50px';

function getCurrentTime() {
    const now = new Date();
    return now.toLocaleString() + ' ' + now.toString().match(/\(([A-Za-z\s].*)\)/)[1].split(' ')[0];
}

function updateClockTime() {
    document.getElementById("time").textContent = getCurrentTime();
}

setInterval(updateClockTime, 1000);

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateISSLocation() {
    $.getJSON('https://api.wheretheiss.at/v1/satellites/25544', function (data) {
        var lat = data['latitude'];
        var lon = data['longitude'];
        var altitude = data['altitude'];
        var velocity = data['velocity'];
        var visibility = data['visibility'];
        var footprint = data['footprint'];

        var distance = calculateDistance(lat, lon);

        if (visibility === 'eclipsed') {
            mapStyle = map.setStyle('mapbox://styles/mapbox/dark-v10');
        } else {
            mapStyle = map.setStyle('mapbox://styles/mapbox/streets-v11');
        }

        issIcon.setLngLat([lon, lat]).addTo(map);
        if (!isLocked) {
            map.flyTo({ center: [lon, lat], zoom: 4 });
        }

        document.getElementById('latitude').textContent = lat;
        document.getElementById('longitude').textContent = lon;
        document.getElementById('altitude').textContent = numberWithCommas(altitude.toFixed(2)) + ' km (' + numberWithCommas((altitude * 0.621371).toFixed(2)) + ' mi)';
        document.getElementById('velocity').textContent = numberWithCommas((Math.round(velocity * 100) / 100).toFixed(2)) + ' km/h (' + numberWithCommas((Math.round((velocity * 0.621371) * 100) / 100).toFixed(2)) + ' mph)';
        document.getElementById('visibility').textContent = visibility;
        document.getElementById('footprint').textContent = numberWithCommas(footprint.toFixed(2)) + ' km² (' + numberWithCommas((footprint * 0.386102).toFixed(2)) + ' mi²)';
        document.getElementById('distance').textContent = numberWithCommas(distance.toFixed(2)) + ' km (' + numberWithCommas((distance * 0.621371).toFixed(2)) + ' mi)';

        if (!disableDistance) {
            document.getElementById('footprint').textContent = numberWithCommas(footprint.toFixed(2)) + ' km² (' + numberWithCommas((footprint * 0.386102).toFixed(2)) + ' mi²)';
        } else {
            document.getElementById('distance').textContent = 'DISABLED';
        }
    });
    updateInterval = setTimeout(updateISSLocation, updateFrequency);
}

var disableDistance = true;

function calculateDistance(lat, lon) {
    var R = 6371;
    var dLat = deg2rad(lat - userLat);
    var dLon = deg2rad(lon - userLon);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(userLat)) * Math.cos(deg2rad(lat)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

var userLat, userLon;

function getLocationByIP() {
    fetch('https://ipinfo.io/json?token=59483e0ab3d78e')
        .then(response => response.json())
        .then(data => {
            userLat = data.loc.split(',')[0];
            userLon = data.loc.split(',')[1];
            var distance = calculateDistance(userLat, userLon);
            document.getElementById('distance').textContent = distance.toFixed(2) + ' km (' + (distance * 0.621371).toFixed(2) + ' mi)';
        })
        .catch(error => console.error('Error fetching location:', error));
}

document.getElementById('distanceButton').addEventListener('click', function () {
    if (confirm("Would you like to enable distance tracking?")) {
        disableDistance = false;
    }
});

document.getElementById('disableDistance').addEventListener('click', function () {
    if (confirm("Would you like to disable distance tracking?")) {
        disableDistance = true;
        document.getElementById('distance').textContent = 'DISABLED';
    }
});

getLocationByIP();
updateISSLocation();

function changeUpdateFrequency(newFrequency) {
    clearTimeout(updateInterval);
    updateFrequency = newFrequency;
    updateISSLocation();
}

document.getElementById('interval1').addEventListener('click', function() {
    changeUpdateFrequency(1000);
    document.getElementById('bottomText').textContent = 'Tracker updates every 1 second';
});

document.getElementById('interval5').addEventListener('click', function() {
    changeUpdateFrequency(5000);
    document.getElementById('bottomText').textContent = 'Tracker updates every 5 seconds';
});

document.getElementById('interval10').addEventListener('click', function() {
    changeUpdateFrequency(10000);
    document.getElementById('bottomText').textContent = 'Tracker updates every 10 seconds';
});
