// Inicializácia mapy s Leaflet
let map;
let trainMarkers = {};
let stationMarkers = {};
let railways = [];

function initMap() {
    // Vytvorenie mapy s centrom na Slovensko
    map = L.map('map').setView([48.7, 19.5], 7);

    // OpenStreetMap vrstva
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // Nakreslenie železničnej siete
    drawRailways();

    // Pridanie staníc
    addStationMarkers();

    // Pridanie vlakov
    addTrainMarkers();

    // Aktualizácia pozícií vlakov každých 5 sekúnd
    setInterval(updateTrainMarkers, 5000);

    console.log('✅ Mapa inicializovaná');
}

function drawRailways() {
    const railwayLines = [
        // Hlavné trate
        {
            stations: ['Bratislava', 'Trnava', 'Nitra', 'Zvolen', 'Banská Bystrica'],
            color: '#2c3e50',
            weight: 3,
            name: 'Hlavná trať Bratislava - Košice'
        },
        {
            stations: ['Banská Bystrica', 'Zvolen', 'Prešov', 'Košice'],
            color: '#2c3e50',
            weight: 3,
            name: 'Trať Zvolen - Košice'
        },
        {
            stations: ['Zvolen', 'Poprad', 'Prešov'],
            color: '#34495e',
            weight: 2,
            name: 'Trať Zvolen - Poprad'
        },
        {
            stations: ['Bratislava', 'Dunajská Streda', 'Komárno'],
            color: '#34495e',
            weight: 2,
            name: 'Trať Bratislava - Komárno'
        },
        {
            stations: ['Nitra', 'Liptovský Mikuláš'],
            color: '#7f8c8d',
            weight: 2,
            name: 'Trať Nitra - Liptovský Mikuláš'
        }
    ];

    railwayLines.forEach(line => {
        const coordinates = line.stations
            .map(station => [stationData[station].lat, stationData[station].lon]);

        const polyline = L.polyline(coordinates, {
            color: line.color,
            weight: line.weight,
            opacity: 0.7,
            dashArray: '5, 5'
        }).addTo(map);

        polyline.bindPopup(line.name);
        railways.push(polyline);
    });

    console.log('✅ Železničná sieť nakreslená');
}

function addStationMarkers() {
    Object.keys(stationData).forEach(stationName => {
        const station = stationData[stationName];

        const marker = L.marker([station.lat, station.lon], {
            icon: L.divIcon({
                html: '🏢',
                className: 'station-marker',
                iconSize: [25, 25],
                iconAnchor: [12, 12]
            })
        }).addTo(map);

        marker.bindPopup(`
            <div style="min-width: 200px; font-family: Arial, sans-serif;">
                <strong>${station.name}</strong><br>
                Typ: ${station.passengers ? '👥 Osobná' : ''} ${station.freight ? '📦 Nákladná' : ''}<br>
                <small>Lat: ${station.lat.toFixed(4)}<br>
                Lon: ${station.lon.toFixed(4)}</small>
            </div>
        `);

        marker.on('click', () => {
            showStationDetails(stationName);
            map.setView([station.lat, station.lon], 10);
        });

        stationMarkers[stationName] = marker;
    });

    console.log('✅ Stanice pridané na mapu');
}

function addTrainMarkers() {
    trainData.forEach(train => {
        const icon = train.type === 'personal' ? '🚄' : '🚂';
        const statusClass = train.status === 'delayed' ? 'disrupted' : 
                          train.status === 'cancelled' ? 'cancelled' : 
                          train.type;

        const marker = L.marker([train.lat, train.lon], {
            icon: L.divIcon({
                html: icon,
                className: `train-marker ${statusClass}`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(map);

        marker.bindPopup(`
            <div style="min-width: 220px; font-family: Arial, sans-serif;">
                <strong>${train.id} - ${train.name}</strong><br>
                <strong>${train.from} → ${train.to}</strong><br>
                Typ: ${train.type === 'personal' ? '👥 Osobná doprava' : '📦 Nákladná doprava'}<br>
                Aktuálna stanica: <strong>${train.currentStation}</strong><br>
                Stav: <strong class="${train.status === 'on-time' ? 'status-on-time' : 'status-delayed'}">
                    ${train.status === 'on-time' ? '✅ V poriadku' : '⚠️ Oneskorený o ' + train.delay + ' min'}
                </strong>
            </div>
        `);

        marker.on('click', () => {
            showTrainDetails(train);
            map.setView([train.lat, train.lon], 11);
        });

        trainMarkers[train.id] = {
            marker: marker,
            train: train
        };
    });

    console.log('✅ Vlaky pridané na mapu');
}

function updateTrainMarkers() {
    updateTrainPositions();

    Object.keys(trainMarkers).forEach(trainId => {
        const train = trainMarkers[trainId].train;
        const marker = trainMarkers[trainId].marker;

        // Aktualizácia polohy
        marker.setLatLng([train.lat, train.lon]);

        // Aktualizácia ikony
        const icon = train.type === 'personal' ? '🚄' : '🚂';
        const statusClass = train.status === 'delayed' ? 'disrupted' : 
                          train.status === 'cancelled' ? 'cancelled' : 
                          train.type;

        marker.setIcon(L.divIcon({
            html: icon,
            className: `train-marker ${statusClass}`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        }));
    });
}

function showStationDetails(stationName) {
    const station = stationData[stationName];
    const detailsDiv = document.getElementById('station-details');

    const incomingTrains = trainData.filter(t => 
        t.schedule.some(s => s.station === stationName)
    );

    let html = `
        <div class="station-details-title">${station.name}</div>
        <div class="station-info-item">
            <span class="station-info-label">📍 Poloha:</span> ${station.lat.toFixed(4)}°, ${station.lon.toFixed(4)}°
        </div>
        <div class="station-info-item">
            <span class="station-info-label">🚗 Typ dopravy:</span> 
            ${station.passengers ? '👥 Osobná' : ''} ${station.freight ? '📦 Nákladná' : ''}
        </div>
        <div class="station-info-item">
            <span class="station-info-label">🚂 Vlaky na stanici:</span> ${incomingTrains.length}
        </div>
    `;

    if (incomingTrains.length > 0) {
        html += '<div style="margin-top: 10px; font-size: 12px;">';
        incomingTrains.forEach(train => {
            const schedule = train.schedule.find(s => s.station === stationName);
            html += `<div style="padding: 5px 0; border-bottom: 1px solid #eee;">
                <strong>${train.id}</strong> (${schedule.arrival} - ${schedule.departure})
            </div>`;
        });
        html += '</div>';
    }

    detailsDiv.innerHTML = html;
}

// Inicializácia mapy pri načítaní stránky
document.addEventListener('DOMContentLoaded', function() {
    initMap();
});

console.log('✅ map.js načítaný a pripravený');
