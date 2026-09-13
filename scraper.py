"""
ŽSR Train Data Scraper
Sťahovanie reálnych dát o vlakoch z mapa.zsr.sk
"""

import requests
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
import logging

# Konfigurácia logovacieho
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ZSRScraper:
    """Scraper pre dáta z mapa.zsr.sk"""
    
    def __init__(self):
        self.base_url = "https://mapa.zsr.sk"
        self.api_endpoints = {
            'trains': '/api/v1/trains/positions',
            'stations': '/api/v1/stations',
            'schedule': '/api/v1/schedule'
        }
        # Slovensko bounding box: (minLon, minLat, maxLon, maxLat)
        self.bbox_slovakia = "16.7269,48.0511,22.5583,49.6116"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_trains_positions(self, bbox: Optional[str] = None) -> List[Dict]:
        """
        Získaj pozície všetkých vlakov
        
        Args:
            bbox: Bounding box v tvare "minLon,minLat,maxLon,maxLat"
        
        Returns:
            Zoznam vlakov s pozíciami
        """
        if bbox is None:
            bbox = self.bbox_slovakia
        
        url = f"{self.base_url}{self.api_endpoints['trains']}"
        params = {'bbox': bbox}
        
        try:
            logger.info(f"Sťahujem dáta vlakov z {url}")
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            trains = response.json()
            logger.info(f"✅ Načítaných vlakov: {len(trains)}")
            return trains
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Chyba pri sťahovaní vlakov: {e}")
            return []
    
    def get_stations(self) -> List[Dict]:
        """
        Získaj zoznam všetkých staníc
        
        Returns:
            Zoznam staníc so súradnicami
        """
        url = f"{self.base_url}{self.api_endpoints['stations']}"
        
        try:
            logger.info(f"Sťahujem dáta staníc z {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            stations = response.json()
            logger.info(f"✅ Načítaných staníc: {len(stations)}")
            return stations
            
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Chyba pri sťahovaní staníc: {e}")
            return []
    
    def get_train_schedule(self, train_number: str) -> Optional[Dict]:
        """
        Získaj detailný cestovný poriadok vlaku
        
        Args:
            train_number: Číslo vlaku (napr. 'R603')
        
        Returns:
            Detaily cestovného poriadku
        """
        url = f"{self.base_url}{self.api_endpoints['schedule']}"
        params = {'train': train_number}
        
        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Chyba pri sťahovaní poriadku pre {train_number}: {e}")
            return None
    
    def transform_train_data(self, raw_trains: List[Dict]) -> List[Dict]:
        """
        Transformuj dáta z API na formát pre našu aplikáciu
        
        Args:
            raw_trains: Surové dáta z API
        
        Returns:
            Transformované dáta
        """
        transformed = []
        
        for train in raw_trains:
            transformed_train = {
                'id': train.get('number', 'N/A'),
                'type': 'personal' if train.get('category') in ['R', 'Rx', 'EC', 'IC'] else 'freight',
                'name': train.get('name', train.get('number', 'Vlak')),
                'lat': train.get('lat'),
                'lon': train.get('lon'),
                'status': 'delayed' if train.get('delay', 0) > 0 else 'on-time',
                'delay': train.get('delay', 0),
                'from': train.get('from', 'N/A'),
                'to': train.get('to', 'N/A'),
                'currentStation': train.get('current_station', 'N/A'),
                'speed': train.get('speed', 0),
                'category': train.get('category', 'R'),
                'timestamp': datetime.now().isoformat()
            }
            transformed.append(transformed_train)
        
        return transformed
    
    def save_to_json(self, data: Dict, filename: str = 'zsr_train_data.json'):
        """
        Ulož dáta do JSON súboru
        
        Args:
            data: Dáta na uloženie
            filename: Názov súboru
        """
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ Dáta uložené do {filename}")
        except Exception as e:
            logger.error(f"❌ Chyba pri ukladaní: {e}")
    
    def scrape_all(self) -> Dict:
        """
        Sťahni všetky dáta naraz
        
        Returns:
            Kompletný zoznam všetkých dát
        """
        logger.info("=" * 50)
        logger.info("🚂 ZAČÍNA SCRAPING ŽSR DÁT")
        logger.info("=" * 50)
        
        # Sťahni vlaky
        raw_trains = self.get_trains_positions()
        trains = self.transform_train_data(raw_trains)
        
        # Sťahni stanice
        stations = self.get_stations()
        
        result = {
            'timestamp': datetime.now().isoformat(),
            'trains': trains,
            'stations': stations,
            'total_trains': len(trains),
            'total_stations': len(stations)
        }
        
        logger.info(f"Spolu sťahnutých vlakov: {len(trains)}")
        logger.info(f"Spolu sťahnutých staníc: {len(stations)}")
        
        return result


def main():
    """Hlavná funkcia na testovanie"""
    scraper = ZSRScraper()
    
    # Sťahni všetky dáta
    data = scraper.scrape_all()
    
    # Ulož do súboru
    scraper.save_to_json(data)
    
    # Zobraz vzorku
    if data['trains']:
        print("\n📊 VZORKA VLAKOV:")
        print("=" * 80)
        for train in data['trains'][:5]:
            print(f"Vlak {train['id']:10} | {train['name']:20} | "
                  f"Stav: {train['status']:10} | Oneskorenie: {train['delay']:3} min | "
                  f"Pozícia: ({train['lat']:.4f}, {train['lon']:.4f})")
    
    # Príklady staníc
    if data['stations']:
        print("\n🏢 VZORKA STANÍC:")
        print("=" * 80)
        for station in data['stations'][:5]:
            print(f"Stanica: {station.get('name', 'N/A'):25} | "
                  f"Poloha: ({station.get('lat', 'N/A')}, {station.get('lon', 'N/A')})")


if __name__ == '__main__':
    main()
