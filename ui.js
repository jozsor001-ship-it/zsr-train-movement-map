// UI - Tabuľky, filtry a interakcie

// Filtrovanie vlakov
let filterPersonal = true;
let filterFreight = true;
let filterDisruptions = true;

// Event listenery pre filtry
document.getElementById('togglePersonal').addEventListener('click', function() {
    filterPersonal = !filterPersonal;
    this.classList.toggle('active');
    refreshUI();
});

document.getElementById('toggleFreight').addEventListener('click', function() {
    filterFreight = !filterFreight;
    this.classList.toggle('active');
    refreshUI();
});

document.getElementById('toggleDisruptions').addEventListener('click', function() {
    filterDisruptions = !filterDisruptions;
    this.classList.toggle('active');
    refreshUI();
});

document.getElementById('refreshBtn').addEventListener('click', function() {
    updateTrainPositions();
    updateTrainMarkers();
    refreshUI();
    this.style.transform = 'rotate(360deg)';
    setTimeout(() => { this.style.transform = 'rotate(0deg)'; }, 1000);
});

// Tlačidlá záložiek
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        
        // Deaktivovať všetky záložky
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        
        // Aktivovať vybranú záložku
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Aktualizovať obsah
        if (tabName === 'arrivals') {
            populateArrivals();
        } else if (tabName === 'departures') {
            populateDepartures();
        } else if (tabName === 'disruptions') {
            populateDisruptions();
        }
    });
});

// Zatváranie modálu
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('trainModal').classList.remove('active');
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('trainModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
});

// Funkcia na úpravu viditeľnosti vlakov na mape
function refreshUI() {
    Object.keys(trainMarkers).forEach(trainId => {
        const trainObj = trainMarkers[trainId];
        const train = trainObj.train;
        const marker = trainObj.marker;

        let visible = true;

        if (train.type === 'personal' && !filterPersonal) visible = false;
        if (train.type === 'freight' && !filterFreight) visible = false;
        if ((train.status === 'delayed' || train.status === 'cancelled') && !filterDisruptions) visible = false;

        if (visible) {
            map.addLayer(marker);
        } else {
            map.removeLayer(marker);
        }
    });

    // Obnovenie tabuľky
    populateArrivals();
}

// Naplnenie tabuľky príchodov
function populateArrivals() {
    const tbody = document.getElementById('arrivals-table');
    tbody.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    const allArrivals = [];

    trainData.forEach(train => {
        train.schedule.forEach((scheduleItem, index) => {
            if (scheduleItem.arrival !== '-') {
                const [hours, minutes] = scheduleItem.arrival.split(':');
                const scheduleTime = parseInt(hours) + parseInt(minutes) / 60;

                allArrivals.push({
                    time: scheduleItem.arrival,
                    scheduleTime: scheduleTime,
                    trainId: train.id,
                    trainName: train.name,
                    from: train.from,
                    to: train.to,
                    station: scheduleItem.station,
                    type: train.type,
                    status: train.status,
                    delay: train.delay,
                    train: train
                });
            }
        });
    });

    // Triedenie podľa času
    allArrivals.sort((a, b) => a.scheduleTime - b.scheduleTime);

    // Filtrovanie a zobrazenie
    allArrivals.filter(arrival => {
        if (arrival.type === 'personal' && !filterPersonal) return false;
        if (arrival.type === 'freight' && !filterFreight) return false;
        return true;
    }).slice(0, 15).forEach(arrival => {
        const row = document.createElement('tr');
        
        const arrivalTime = arrival.time;
        const delayText = arrival.delay > 0 ? ` (+${arrival.delay}m)` : '';
        
        row.innerHTML = `
            <td>${arrivalTime}${delayText}</td>
            <td><strong>${arrival.trainId}</strong></td>
            <td>${arrival.from.substring(0, 3)}</td>
            <td>${arrival.station}</td>
            <td>${arrival.type === 'personal' ? '👥 Os.' : '📦 Nákl.'}</td>
            <td>
                <span class="status-${arrival.status}">
                    ${arrival.status === 'on-time' ? '✅' : arrival.status === 'delayed' ? '⚠️' : '❌'}
                </span>
            </td>
        `;
        
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => showTrainDetails(arrival.train));
        
        tbody.appendChild(row);
    });
}

// Naplnenie tabuľky odchodov
function populateDepartures() {
    const tbody = document.getElementById('departures-table');
    tbody.innerHTML = '';

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    const allDepartures = [];

    trainData.forEach(train => {
        train.schedule.forEach((scheduleItem, index) => {
            if (scheduleItem.departure !== '-') {
                const [hours, minutes] = scheduleItem.departure.split(':');
                const scheduleTime = parseInt(hours) + parseInt(minutes) / 60;

                allDepartures.push({
                    time: scheduleItem.departure,
                    scheduleTime: scheduleTime,
                    trainId: train.id,
                    trainName: train.name,
                    from: train.from,
                    to: train.to,
                    station: scheduleItem.station,
                    type: train.type,
                    status: train.status,
                    delay: train.delay,
                    train: train
                });
            }
        });
    });

    // Triedenie podľa času
    allDepartures.sort((a, b) => a.scheduleTime - b.scheduleTime);

    // Filtrovanie a zobrazenie
    allDepartures.filter(departure => {
        if (departure.type === 'personal' && !filterPersonal) return false;
        if (departure.type === 'freight' && !filterFreight) return false;
        return true;
    }).slice(0, 15).forEach(departure => {
        const row = document.createElement('tr');
        
        const departureTime = departure.time;
        const delayText = departure.delay > 0 ? ` (+${departure.delay}m)` : '';
        
        row.innerHTML = `
            <td>${departureTime}${delayText}</td>
            <td><strong>${departure.trainId}</strong></td>
            <td>${departure.to.substring(0, 3)}</td>
            <td>${departure.station}</td>
            <td>${departure.type === 'personal' ? '👥 Os.' : '📦 Nákl.'}</td>
            <td>
                <span class="status-${departure.status}">
                    ${departure.status === 'on-time' ? '✅' : departure.status === 'delayed' ? '⚠️' : '❌'}
                </span>
            </td>
        `;
        
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => showTrainDetails(departure.train));
        
        tbody.appendChild(row);
    });
}

// Naplnenie zoznamu mimoriadností
function populateDisruptions() {
    const disruptionsList = document.getElementById('disruptions-list');
    disruptionsList.innerHTML = '';

    if (!filterDisruptions) {
        disruptionsList.innerHTML = '<p style="text-align: center; color: #999;">Mimoriadnosti sú skryté</p>';
        return;
    }

    if (disruptionData.length === 0) {
        disruptionsList.innerHTML = '<p style="text-align: center; color: #27ae60; font-weight: 600;">✅ Žiadne mimoriadnosti</p>';
        return;
    }

    disruptionData.forEach(disruption => {
        const disruptionItem = document.createElement('div');
        disruptionItem.className = `disruption-item ${disruption.severity === 'high' ? 'critical' : ''}`;
        
        disruptionItem.innerHTML = `
            <div style="font-weight: 600; font-size: 14px;">
                ${disruption.icon} ${disruption.title}
            </div>
            <div style="font-size: 12px; margin-top: 5px;">
                ${disruption.description}
            </div>
            <div style="font-size: 11px; margin-top: 8px; opacity: 0.9;">
                <strong>Trať:</strong> ${disruption.affectedLine}<br>
                <strong>Čas:</strong> ${disruption.startTime} - ${disruption.estimatedEndTime}<br>
                <strong>Dotknuté vlaky:</strong> ${disruption.affectedTrains.join(', ')}
            </div>
        `;
        
        disruptionItem.addEventListener('click', () => {
            showDisruptionDetails(disruption);
        });
        
        disruptionsList.appendChild(disruptionItem);
    });
}

// Zobrazenie detailov vlaku v modálu
function showTrainDetails(train) {
    const modal = document.getElementById('trainModal');
    const modalBody = document.getElementById('modal-body');

    const statusText = train.status === 'on-time' ? '✅ V poriadku' : 
                      train.status === 'delayed' ? `⚠️ Oneskorený o ${train.delay} minút` : 
                      '❌ Zrušený';

    const typeText = train.type === 'personal' ? '👥 Osobná doprava' : '📦 Nákladná doprava';

    let scheduleHTML = '<table style="width: 100%; font-size: 12px; margin-top: 10px; border-collapse: collapse;">';
    scheduleHTML += '<tr style="background: #f0f0f0; font-weight: 600;"><td style="padding: 5px; border-bottom: 1px solid #ddd;">Stanica</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">Príchod</td><td style="padding: 5px; border-bottom: 1px solid #ddd;">Odchod</td></tr>';
    
    train.schedule.forEach(stop => {
        scheduleHTML += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 5px;">${stop.station}</td>
                <td style="padding: 5px;">${stop.arrival}</td>
                <td style="padding: 5px;">${stop.departure}</td>
            </tr>
        `;
    });
    scheduleHTML += '</table>';

    modalBody.innerHTML = `
        <h3>${train.id} - ${train.name}</h3>
        <div class="detail-row">
            <span class="detail-label">Trasa:</span>
            <span class="detail-value"><strong>${train.from}</strong> → <strong>${train.to}</strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Typ dopravy:</span>
            <span class="detail-value">${typeText}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Aktuálna stanica:</span>
            <span class="detail-value"><strong>${train.currentStation}</strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Stav:</span>
            <span class="detail-value"><strong>${statusText}</strong></span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Poloha:</span>
            <span class="detail-value">${train.lat.toFixed(4)}°, ${train.lon.toFixed(4)}°</span>
        </div>
        <div style="margin-top: 15px; border-top: 2px solid #eee; padding-top: 15px;">
            <strong>🚂 Cestovný poriadok:</strong>
            ${scheduleHTML}
        </div>
    `;

    modal.classList.add('active');
}

// Zobrazenie detailov mimoriadnosti
function showDisruptionDetails(disruption) {
    const modal = document.getElementById('trainModal');
    const modalBody = document.getElementById('modal-body');

    const severityText = disruption.severity === 'high' ? '🚨 KRITICKÉ' : 
                        disruption.severity === 'medium' ? '⚠️ STREDNÚ VÁŽNOSŤ' : 
                        '📋 NÍZKA VÁŽNOSŤ';

    modalBody.innerHTML = `
        <h3>${disruption.icon} ${disruption.title}</h3>
        <div class="detail-row">
            <span class="detail-label">Vážnosť:</span>
            <span class="detail-value"><strong>${severityText}</strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Typ:</span>
            <span class="detail-value">${disruption.type === 'delay' ? 'Oneskorenie' : disruption.type === 'disruption' ? 'Mimoriadnosť' : 'Údržba'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Dotknutá trať:</span>
            <span class="detail-value">${disruption.affectedLine}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Čas začiatku:</span>
            <span class="detail-value">${disruption.startTime}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Odhadovaný koniec:</span>
            <span class="detail-value">${disruption.estimatedEndTime}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
            <span class="detail-label">Dotknuté vlaky:</span>
            <span class="detail-value"><strong>${disruption.affectedTrains.join(', ')}</strong></span>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee; background: #f9f9f9; padding: 10px; border-radius: 5px;">
            <strong>📝 Opis:</strong><br>
            ${disruption.description}
        </div>
    `;

    modal.classList.add('active');
}

// Inicializácia - naplnenie tabuľky pri načítaní
document.addEventListener('DOMContentLoaded', function() {
    populateArrivals();
    populateDisruptions();
});

console.log('✅ UI.js načítaný - všetky funkcie sú aktívne');
