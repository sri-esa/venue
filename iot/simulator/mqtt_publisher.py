# Service: iot-simulator
# Layer: Perception Layer
# Implements: Req 8
# Publishes To: Pub/Sub topic: crowd-density-raw, queue-events-raw
# Consumes From: N/A
import os
import json
import time
import random
import logging
from datetime import datetime
from google.cloud import pubsub_v1

# Setup logging
os.makedirs('iot/simulator/logs', exist_ok=True)
log_filename = f"iot/simulator/logs/sim_{datetime.now().strftime('%Y%m%d')}.log"
logging.basicConfig(
    filename=log_filename,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

# Add console handler
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger('').addHandler(console)

class MQTTPublisher:
    def __init__(self, project_id="smart-venue-dev"):
        self.project_id = os.environ.get("PROJECT_ID", project_id)
        if "PUBSUB_EMULATOR_HOST" in os.environ:
            logging.info(f"Using Pub/Sub emulator at {os.environ['PUBSUB_EMULATOR_HOST']}")
        
        # In Python SDK,PublisherClient automatically uses PUBSUB_EMULATOR_HOST if set
        self.publisher = pubsub_v1.PublisherClient()
        self.chaos_enabled = False

    def set_chaos(self, enabled):
        self.chaos_enabled = enabled
        if enabled:
            logging.info("Chaos engineering enabled (drops, corruption, latency injected).")

    def publish_density(self, payload):
        self._publish("crowd-density-raw", payload)
        
    def publish_queue(self, payload):
        self._publish("queue-events-raw", payload)

    def _publish(self, topic_name, payload):
        if self.chaos_enabled:
            # Drop 2% of readings
            if random.random() < 0.02:
                logging.warning(f"CHAOS: Dropped reading for topic {topic_name}")
                return
            
            # Corrupt 1% of readings
            if random.random() < 0.01:
                logging.warning(f"CHAOS: Corrupted reading for topic {topic_name}")
                if isinstance(payload, dict) and len(payload.keys()) > 0:
                    keys = list(payload.keys())
                    keys_to_remove = random.sample(keys, min(1, len(keys)))
                    for k in keys_to_remove:
                        payload[k] = None
                    
            # Network delay 0-500ms
            delay = random.uniform(0, 0.5)
            time.sleep(delay)
            
        # Add simulated FCM acknowledgment delay
        FCM_BROADCAST_DELAY_MS = 850  # measured from production logs
        if "alert" in topic_name or "notification" in topic_name:
            time.sleep(FCM_BROADCAST_DELAY_MS / 1000.0)

        topic_path = self.publisher.topic_path(self.project_id, topic_name)
        data = json.dumps(payload).encode("utf-8")
        
        try:
            future = self.publisher.publish(topic_path, data)
            msg_id = future.result()
            logging_id = payload.get('sensorId', payload.get('queueId', 'unknown_id'))
            logging.info(f"Published to {topic_name}: {logging_id} (Msg: {msg_id})")
        except Exception as e:
            logging.error(f"Failed to publish to {topic_name}: {str(e)}")

# Singleton instance
publisher_instance = MQTTPublisher()
