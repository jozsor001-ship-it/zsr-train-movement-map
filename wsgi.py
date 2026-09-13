"""
Jednoduchý development server na testovanie
Slúži ako alternatíva k priamému spusteniu app.py
"""

if __name__ == '__main__':
    import os
    from app import app
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    app.run(host='0.0.0.0', port=port, debug=debug)
