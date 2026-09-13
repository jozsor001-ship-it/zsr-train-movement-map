// Údaje o vlakoch - simulované dáta
const trainData = [
    // Osobné vlaky
    {
        id: 'R670',
        type: 'personal',
        name: 'RegionálExpress',
        from: 'Bratislava',
        to: 'Banská Bystrica',
        status: 'on-time',
        delay: 0,
        currentStation: 'Zvolen',
        lat: 48.7397,
        lon: 19.1348,
        schedule: [
            { station: 'Bratislava', arrival: '08:00', departure: '08:05', time: 8.083 },
            { station: 'Trnava', arrival: '08:45', departure: '08:50', time: 8.750 },
            { station: 'Nitra', arrival: '09:30', departure: '09:35', time: 9.583 },
            { station: 'Zvolen', arrival: '10:45', departure: '10:50', time: 10.750 },
            { station: 'Banská Bystrica', arrival: '11:30', departure: '-', time: 11.500 }
        ]
    },
    {
        id: 'R801',
        type: 'personal',
        name: 'Express',
        from: 'Košice',
        to: 'Bratislava',
        status: 'delayed',
        delay: 12,
        currentStation: 'Prešov',
        lat: 48.7412,
        lon: 21.2397,
        schedule: [
            { station: 'Košice', arrival: '07:00', departure: '07:05', time: 7.083 },
            { station: 'Prešov', arrival: '08:15', departure: '08:20', time: 8.250 },
            { station: 'Poprad', arrival: '09:45', departure: '09:50', time: 9.750 },
            { station: 'Banská Bystrica', arrival: '11:30', departure: '11:35', time: 11.500 },
            { station: 'Bratislava', arrival: '13:45', departure: '-', time: 13.750 }
        ]
    },
    {
        id: 'R505',
        type: 'personal',
        name: 'Rýchlik',
        from: 'Dunajská Streda',
        to: 'Liptovský Mikuláš',
        status: 'on-time',
        delay: 0,
        currentStation: 'Nitra',
        lat: 48.3153,
        lon: 18.0852,
        schedule: [
            { station: 'Dunajská Streda', arrival: '09:00', departure: '09:05', time: 9.083 },
            { station: 'Komárno', arrival: '09:45', departure: '09:50', time: 9.750 },
            { station: 'Nitra', arrival: '10:30', departure: '10:35', time: 10.500 },
            { station: 'Zvolen', arrival: '11:45', departure: '11:50', time: 11.750 },
            { station: 'Liptovský Mikuláš', arrival: '12:45', departure: '-', time: 12.750 }
        ]
    },

    // Nákladné vlaky
    {
        id: 'M201',
        type: 'freight',
        name: 'Nákladný vlak',
        from: 'Košice',
        to: 'Komárno',
        status: 'on-time',
        delay: 0,
        currentStation: 'Zvolen',
        lat: 48.7397,
        lon: 19.1348,
        schedule: [
            { station: 'Košice', arrival: '06:00', departure: '06:15', time: 6.250 },
            { station: 'Prešov', arrival: '07:30', departure: '07:45', time: 7.750 },
            { station: 'Zvolen', arrival: '10:00', departure: '10:30', time: 10.500 },
            { station: 'Banská Bystrica', arrival: '11:00', departure: '11:30', time: 11.500 },
            { station: 'Nitra', arrival: '13:30', departure: '14:00', time: 13.500 },
            { station: 'Komárno', arrival: '15:30', departure: '-', time: 15.500 }
        ]
    },
    {
        id: 'M305',
        type: 'freight',
        name: 'Tovarový vlak',
        from: 'Bratislava',
        to: 'Košice',
        status: 'on-time',
        delay: 0,
        currentStation: 'Banská Bystrica',
        lat: 48.7393,
        lon: 19.1567,
        schedule: [
            { station: 'Bratislava', arrival: '08:00', departure: '08:30', time: 8.500 },
            { station: 'Trnava', arrival: '09:15', departure: '09:30', time: 9.250 },
            { station: 'Nitra', arrival: '10:30', departure: '11:00', time: 10.500 },
            { station: 'Zvolen', arrival: '12:30', departure: '13:00', time: 12.500 },
            { station: 'Banská Bystrica', arrival: '13:45', departure: '14:15', time: 13.750 },
            { station: 'Poprad', arrival: '16:30', departure: '17:00', time: 16.500 },
            { station: 'Košice', arrival: '18:45', departure: '-', time: 18.750 }
        ]
    }
];

// Údaje o staniciach
const stationData = {
    'Bratislava': { lat: 48.1486, lon: 17.1077, name: 'Bratislava hlavná stanica', passengers: true, freight: true },
    'Trnava': { lat: 48.3747, lon: 17.5961, name: 'Trnava', passengers: true, freight: false },
    'Nitra': { lat: 48.3153, lon: 18.0852, name: 'Nitra', passengers: true, freight: true },
    'Zvolen': { lat: 48.7397, lon: 19.1348, name: 'Zvolen', passengers: true, freight: true },
    'Banská Bystrica': { lat: 48.7393, lon: 19.1567, name: 'Banská Bystrica', passengers: true, freight: true },
    'Košice': { lat: 48.7164, lon: 21.2611, name: 'Košice hlavná stanica', passengers: true, freight: true },
    'Prešov': { lat: 48.7412, lon: 21.2397, name: 'Prešov', passengers: true, freight: false },
    'Poprad': { lat: 49.0539, lon: 20.3089, name: 'Poprad - Tatry', passengers: true, freight: false },
    'Dunajská Streda': { lat: 47.9756, lon: 18.9281, name: 'Dunajská Streda', passengers: true, freight: false },
    'Komárno': { lat: 47.7690, lon: 18.1244, name: 'Komárno', passengers: true, freight: true },
    'Liptovský Mikuláš': { lat: 49.0897, lon: 19.6259, name: 'Liptovský Mikuláš', passengers: true, freight: false }
};

// Mimoriadnosti a výluky
const disruptionData = [
    {
        id: 1,
        type: 'delay',
        severity: 'medium',
        title: 'Oneskorenie na trati Košice - Prešov',
        description: 'Technická porucha na trati spôsobuje oneskorenie vlakov.',
        affectedTrains: ['R801', 'M201'],
        affectedLine: 'Košice - Prešov',
        startTime: '08:00',
        estimatedEndTime: '12:00',
        icon: '⚠️'
    },
    {
        id: 2,
        type: 'disruption',
        severity: 'low',
        title: 'Plánovaná údržba trate Zvolen - Banská Bystrica',
        description: 'Plánovaná údržba železničnej trate. Vlaky jazdia podľa zmenného poriadku.',
        affectedTrains: ['R670', 'M305'],
        affectedLine: 'Zvolen - Banská Bystrica',
        startTime: '14:00',
        estimatedEndTime: '18:00',
        icon: '🔧'
    },
    {
        id: 3,
        type: 'maintenance',
        severity: 'high',
        title: 'Úplná výluka trate Trnava - Nitra',
        description: 'Rekonštrukcia trate. Vlaky jazdia obchádzkou cez Bratislavu.',
        affectedTrains: ['R505', 'R670'],
        affectedLine: 'Trnava - Nitra',
        startTime: '10:00',
        estimatedEndTime: '16:00',
        icon: '🚨'
    }
];

// Export dát
window.trainData = trainData;
window.stationData = stationData;
window.disruptionData = disruptionData;

// Funkcia na simuláciu pohybu vlakov
function updateTrainPositions() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHour + currentMinutes / 60;

    trainData.forEach(train => {
        // Simulácia pohybu medzi stanicami
        let position = 0;
        for (let i = 0; i < train.schedule.length - 1; i++) {
            const currentScheduleTime = train.schedule[i].time;
            const nextScheduleTime = train.schedule[i + 1].time;

            if (currentTime >= currentScheduleTime && currentTime < nextScheduleTime) {
                const progress = (currentTime - currentScheduleTime) / (nextScheduleTime - currentScheduleTime);
                const currentStation = stationData[train.schedule[i].station];
                const nextStation = stationData[train.schedule[i + 1].station];

                train.lat = currentStation.lat + (nextStation.lat - currentStation.lat) * progress;
                train.lon = currentStation.lon + (nextStation.lon - currentStation.lon) * progress;
                break;
            }
        }
    });
}

// Aktualizovanie pozícií každých 30 sekúnd
setInterval(updateTrainPositions, 30000);
updateTrainPositions();

console.log('✅ Dáta vlakov načítané');
