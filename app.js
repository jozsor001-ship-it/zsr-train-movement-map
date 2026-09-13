/**
 * ŽSR Mapa pohybu vlakov - Frontend JavaScript
 * Real-time sledovanie vlakov s Leaflet mapou
 */

// ============ KONFIGURÁCIA ============

const API_BASE = 'http://localhost:5000/api';
const REFRESH_INTERVAL = 30000; // 30 sekúnd

let map;
let trains = [];
let stations = [];
let trainMarkers = {};
let stationMarkers = {};
let selectedTrain = null;

// ============ INICIALIZÁCIA ============

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadData();
    setupEventListeners();
    setInterval(loadData, REFRESH_INTERVAL);
});

// ============ LEAFLET MAPA ============

function initMap() {
    // Vytvor mapu na Slovensko
    map = L.map('map').setView([48.7, 19.0], 7);

    // Pridaj OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    console.log('✅ Mapa inicializovaná');
}

// ============ NAČÍTANIE DÁT ============

async function loadData() {
    try {
        const [trainsRes, stationsRes, statsRes] = await Promise.all([
            fetch(`${API_BASE}/trains`),
            fetch(`${API_BASE}/stations`),
            fetch(`${API_BASE}/stats`)
        ]);

        if (!trainsRes.ok || !stationsRes.ok || !statsRes.ok) {
            throw new Error('API chyba');
        }

        const trainsData = await trainsRes.json();
        const stationsData = await stationsRes.json();
        const statsData = await statsRes.json();

        trains = trainsData.data || [];
        stations = stationsData.data || [];

        updateStats(statsData.stats);
        updateMap();
        updateTrainsList();

        console.log(`✅ Načítaných vlakov: ${trains.length}`);
    } catch (error) {
        console.error('❌ Chyba pri načítaní dát:', error);
        showNotification('Chyba pri načítaní dát', 'error');
    }
}

// ============ MAPA UPDATES ============

function updateMap() {
    // Vyčisti staré markery
    Object.values(trainMarkers).forEach(marker => map.removeLayer(marker));
    trainMarkers = {};

    // Pridaj vlaky na mapu
    trains.forEach(train => {
        if (train.lat && train.lon) {
            const icon = createTrainIcon(train);
            const marker = L.marker([train.lat, train.lon], { icon })
                .bindPopup(createPopupContent(train))
                .addTo(map);

            marker.on('click', () => showTrainDetails(train));
            trainMarkers[train.id] = marker;
        }
    });
}

function createTrainIcon(train) {
    let color = train.type === 'freight' ? '#6c757d' : '#0066cc';
    if (train.status === 'delayed') {
        color = '#ffc107';
    }

    return L.divIcon({
        html: `<div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">🚂</div>`,
        className: 'train-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
}

function createPopupContent(train) {
    return `
        <div style="font-size: 12px; width: 200px;">
            <strong>${train.name}</strong><br>
            <strong>${train.from}</strong> → <strong>${train.to}</strong><br>
            Oneskorenie: <strong>${train.delay} min</strong><br>
            Rýchlosť: <strong>${train.speed} km/h</strong><br>
            Kategória: <strong>${train.category}</strong>
        </div>
    `;
}

// ============ ZOZNAM VLAKOV ============

function updateTrainsList() {
    const container = document.getElementById('trains-container');
    const personalFilter = document.getElementById('filter-personal').checked;
    const freightFilter = document.getElementById('filter-freight').checked;
    const delayedFilter = document.getElementById('filter-delayed').checked;

    let filtered = trains.filter(train => {
        const typeMatch = (train.type === 'personal' && personalFilter) ||
                         (train.type === 'freight' && freightFilter);
        const delayMatch = !delayedFilter || train.status === 'delayed';
        return typeMatch && delayMatch;
    });

    // Sort: oneskorené prvé
    filtered.sort((a, b) => {
        if (a.delay !== b.delay) return b.delay - a.delay;
        return a.id.localeCompare(b.id);
    });

    container.innerHTML = filtered.map(train => `
        <div class="train-item ${train.type} ${train.status}" onclick="handleTrainClick('${train.id}')">
            <div class="train-item-header">
                <span class="train-number">${train.name}</span>
                <span class="train-status ${train.status}">
                    ${train.status === 'delayed' ? `+${train.delay} min` : 'V poriadku'}
                </span>
            </div>
            <div class="train-route">${train.from} → ${train.to}</div>
            <div class="train-meta">
                <span>⚡ ${train.speed} km/h</span>
                <span>📍 ${train.currentStation}</span>
            </div>
        </div>
    `).join('');

    if (filtered.length === 0) {
        container.innerHTML = '<p class="loading">Žiadne vlaky</p>';
    }
}

// ============ DETAILY VLAKU ============

function showTrainDetails(train) {
    selectedTrain = train;
    const modal = document.getElementById('train-modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <h2>${train.name}</h2>
        
        <div class="modal-section">
            <h3>Trasa</h3>
            <div class="modal-row">
                <span class="modal-label">Odkiaľ:</span>
                <span class="modal-value">${train.from}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Kam:</span>
                <span class="modal-value">${train.to}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Aktuálna stanica:</span>
                <span class="modal-value">${train.currentStation}</span>
            </div>
        </div>

        <div class="modal-section">
            <h3>Stav</h3>
            <div class="modal-row">
                <span class="modal-label">Stav:</span>
                <span class="modal-value">${train.status === 'delayed' ? '⚠️ Oneskorený' : '✅ V poriadku'}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Oneskorenie:</span>
                <span class="modal-value">${train.delay} minút</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Rýchlosť:</span>
                <span class="modal-value">${train.speed} km/h</span>
            </div>
        </div>

        <div class="modal-section">
            <h3>Informácie</h3>
            <div class="modal-row">
                <span class="modal-label">Typ:</span>
                <span class="modal-value">${train.type === 'personal' ? 'Osobný' : 'Nákladný'}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Kategória:</span>
                <span class="modal-value">${train.category}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Poloha:</span>
                <span class="modal-value">${train.lat?.toFixed(4)}, ${train.lon?.toFixed(4)}</span>
            </div>
            <div class="modal-row">
                <span class="modal-label">Čas aktualizácie:</span>
                <span class="modal-value">${new Date(train.timestamp).toLocaleTimeString('sk-SK')}</span>
            </div>
        </div>
    `;

    modal.classList.add('show');

    // Center na mape
    if (train.lat && train.lon) {
        map.setView([train.lat, train.lon], 10);
    }
}

function handleTrainClick(trainId) {
    const train = trains.find(t => t.id === trainId);
    if (train) {
        showTrainDetails(train);
    }
}

// ============ ŠTATISTIKY ============

function updateStats(stats) {
    document.getElementById('train-count').textContent = stats.total_trains;
    document.getElementById('station-count').textContent = stats.total_stations;
    document.getElementById('delayed-count').textContent = stats.delayed_trains;
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
    // Filtres
    document.getElementById('filter-personal').addEventListener('change', updateTrainsList);
    document.getElementById('filter-freight').addEventListener('change', updateTrainsList);
    document.getElementById('filter-delayed').addEventListener('change', updateTrainsList);

    // Hľadávanie
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Tlačidlá
    document.getElementById('refresh-btn').addEventListener('click', () => {
        console.log('🔄 Ručné obnovenie dát');
        loadData();
    });

    document.getElementById('center-map-btn').addEventListener('click', () => {
        map.setView([48.7, 19.0], 7);
    });

    // Modal
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('train-modal').classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('train-modal');
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

function handleSearch() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const results = trains.filter(train =>
        train.id.toLowerCase().includes(query.toLowerCase()) ||
        train.name.toLowerCase().includes(query.toLowerCase())
    );

    if (results.length === 0) {
        showNotification('Žiadne vlaky nenájdené', 'info');
        return;
    }

    showTrainDetails(results[0]);
    document.getElementById('search-input').value = '';
}

// ============ NOTIFIKÁCIE ============

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        background-color: ${type === 'error' ? '#dc3545' : '#0066cc'};
        color: white;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============ ANIMÁCIE ============

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🚂 ŽSR Train Map App inicialized!');
