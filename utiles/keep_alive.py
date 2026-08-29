import os
import time
import random
import logging
import requests
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

HEALTH_URL = os.getenv('HEALTH_URL', 'https://inventarios-d4uj.onrender.com/health')
MIN_MINUTES = 4
MAX_MINUTES = 11

def ping_health():
    try:
        response = requests.get(HEALTH_URL, timeout=10)
        if response.status_code == 200:
            logger.info(f"Health check OK: {response.status_code}")
        else:
            logger.warning(f"Health check returned {response.status_code}")
    except requests.RequestException as e:
        logger.error(f"Health check failed: {e}")

def main():
    logger.info(f"Starting keep-alive for {HEALTH_URL}")
    logger.info(f"Interval: {MIN_MINUTES}-{MAX_MINUTES} minutes")
    
    while True:
        ping_health()
        
        wait_minutes = random.uniform(MIN_MINUTES, MAX_MINUTES)
        wait_seconds = wait_minutes * 60
        next_run = datetime.now().timestamp() + wait_seconds
        next_run_str = datetime.fromtimestamp(next_run).strftime('%H:%M:%S')
        
        logger.info(f"Next ping at ~{next_run_str} (in {wait_minutes:.1f} minutes)")
        time.sleep(wait_seconds)

if __name__ == '__main__':
    main()