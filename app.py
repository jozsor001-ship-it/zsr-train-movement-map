"""
Flask Backend Server pre ŽSR Mapu
Prepojenie scrapera s frontendovou aplikáciou
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from scraper import ZSRScraper
import threading
import json
import time
from datetime import datetime, timedelta
import logging

# Konfigurácia
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Globálne premenné
train_data = []
station_data = []
last_update = None
scraper = ZSRScraper()
update_interval = 60  # Aktualizuj každých 60 sekúnd

class DataUpdater(threading.Thread):
    """Thread na automatické aktualizovanie dát"""
    
    def __init__(self):
        super().__init__(daemon=True)
        self.running = True
    
    def run(self):
        """Kontinuálne aktualizovanie dát"""
        global train_data, station_data, last_update
        
        while self.running:
            try:
                logger.info("🔄 Aktualizujem ŽSR dáta...")
                data = scraper.scrape_all()
                
                train_data = data.get('trains', [])
                station_data = data.get('stations', [])
                last_update = datetime.now()
                
                logger.info(f"✅ Dáta aktualizované: {len(train_data)} vlakov")
                
            except Exception as e:
                logger.error(f"❌ Chyba pri aktualizácii: {e}")
            
            time.sleep(update_interval)

# Spustenie updatera
updater = DataUpdater()
updater.start()

# ============ API ENDPOINTS ============

@app.route('/')
def index():
    """Zdravotnícka kontrola"""
    return jsonify({
        'status': 'ok',
        'message': 'ŽSR Train Movement Map API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/trains', methods=['GET'])
def get_trains():
    """
    Návrat všetkých vlakov
    Query parametre:
        - type: 'personal' alebo 'freight'
        - limit: maximálny počet výsledkov
    """
    try:
        trains = train_data.copy()
        
        # Filtrovanie podľa typu
        train_type = request.args.get('type', None)
        if train_type in ['personal', 'freight']:
            trains = [t for t in trains if t.get('type') == train_type]
        
        # Limit výsledkov
        limit = request.args.get('limit', None)
        if limit:
            try:
                trains = trains[:int(limit)]
            except ValueError:
                pass
        
        return jsonify({
            'status': 'success',
            'count': len(trains),
            'data': trains,
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/trains: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/trains/<train_id>', methods=['GET'])
def get_train(train_id):
    """Návrat detailov konkrétneho vlaku"""
    try:
        train = next((t for t in train_data if t.get('id') == train_id), None)
        
        if not train:
            return jsonify({'status': 'error', 'message': 'Vlak nenájdený'}), 404
        
        return jsonify({
            'status': 'success',
            'data': train,
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/trains/{train_id}: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stations', methods=['GET'])
def get_stations():
    """
    Návrat všetkých staníc
    Query parametre:
        - limit: maximálny počet výsledkov
    """
    try:
        stations = station_data.copy()
        
        # Limit výsledkov
        limit = request.args.get('limit', None)
        if limit:
            try:
                stations = stations[:int(limit)]
            except ValueError:
                pass
        
        return jsonify({
            'status': 'success',
            'count': len(stations),
            'data': stations,
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/stations: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stations/<station_name>', methods=['GET'])
def get_station(station_name):
    """Návrat detailov konkrétnej stanice"""
    try:
        station = next(
            (s for s in station_data if station_name.lower() in s.get('name', '').lower()),
            None
        )
        
        if not station:
            return jsonify({'status': 'error', 'message': 'Stanica nenájdená'}), 404
        
        # Vlaky v tejto stanici
        trains_at_station = [
            t for t in train_data 
            if station.get('name') in [t.get('from'), t.get('to'), t.get('currentStation')]
        ]
        
        return jsonify({
            'status': 'success',
            'data': {
                'station': station,
                'trains': trains_at_station,
                'train_count': len(trains_at_station)
            },
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/stations/{station_name}: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/search', methods=['GET'])
def search():
    """
    Vyhľadávanie vlakov a staníc
    Query parametre:
        - q: vyhľadávací dotaz
        - type: 'trains' alebo 'stations'
    """
    try:
        query = request.args.get('q', '').lower()
        search_type = request.args.get('type', 'all')
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Dotaz je povinný'}), 400
        
        results = {'trains': [], 'stations': []}
        
        # Hľadaj vlaky
        if search_type in ['all', 'trains']:
            results['trains'] = [
                t for t in train_data 
                if query in t.get('id', '').lower() or 
                   query in t.get('name', '').lower()
            ][:10]
        
        # Hľadaj stanice
        if search_type in ['all', 'stations']:
            results['stations'] = [
                s for s in station_data 
                if query in s.get('name', '').lower()
            ][:10]
        
        return jsonify({
            'status': 'success',
            'query': query,
            'results': results,
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/search: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Štatistiky o aktuálnom stave"""
    try:
        personal_trains = len([t for t in train_data if t.get('type') == 'personal'])
        freight_trains = len([t for t in train_data if t.get('type') == 'freight'])
        delayed_trains = len([t for t in train_data if t.get('status') == 'delayed'])
        on_time_trains = len([t for t in train_data if t.get('status') == 'on-time'])
        
        return jsonify({
            'status': 'success',
            'stats': {
                'total_trains': len(train_data),
                'personal_trains': personal_trains,
                'freight_trains': freight_trains,
                'delayed_trains': delayed_trains,
                'on_time_trains': on_time_trains,
                'total_stations': len(station_data),
                'average_delay': round(sum(t.get('delay', 0) for t in train_data) / max(len(train_data), 1), 2)
            },
            'timestamp': last_update.isoformat() if last_update else None
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/stats: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/refresh', methods=['POST'])
def refresh_data():
    """Manuálna obnova dát (POST)"""
    try:
        global train_data, station_data, last_update
        
        logger.info("📢 Manuálna obnova dát požiadaná...")
        data = scraper.scrape_all()
        
        train_data = data.get('trains', [])
        station_data = data.get('stations', [])
        last_update = datetime.now()
        
        return jsonify({
            'status': 'success',
            'message': 'Dáta obnovené',
            'trains_loaded': len(train_data),
            'stations_loaded': len(station_data),
            'timestamp': last_update.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Chyba v /api/refresh: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# ============ ERROR HANDLERS ============

@app.errorhandler(404)
def not_found(error):
    """Handler pre 404 chyby"""
    return jsonify({'status': 'error', 'message': 'Endpoint nenájdený'}), 404

@app.errorhandler(500)
def server_error(error):
    """Handler pre 500 chyby"""
    return jsonify({'status': 'error', 'message': 'Interná chyba servera'}), 500

# ============ MAIN ============

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("🚀 SPÚŠŤAM ŽSR TRAIN MAP BACKEND")
    logger.info("=" * 50)
    logger.info("API dostupné na: http://localhost:5000")
    logger.info("Endpoints:")
    logger.info("  GET  /api/trains            - Všetky vlaky")
    logger.info("  GET  /api/trains/<id>       - Detaily vlaku")
    logger.info("  GET  /api/stations          - Všetky stanice")
    logger.info("  GET  /api/stations/<name>   - Detaily stanice")
    logger.info("  GET  /api/search?q=<query>  - Vyhľadávanie")
    logger.info("  GET  /api/stats             - Štatistiky")
    logger.info("  POST /api/refresh           - Obnova dát")
    logger.info("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
