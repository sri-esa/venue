# Service: iot-simulator
# Layer: Perception Layer
# Implements: Req 8
# Publishes To: Pub/Sub topic: crowd-density-raw
# Consumes From: N/A
import time
import uuid
import math
import random
import argparse
import logging
from datetime import datetime, timezone
from mqtt_publisher import publisher_instance
from queue_sim import QueueSimulator

ZONES = [
  {"id": "zone-01", "name": "North Entry Gate",   "type": "ENTRY",     "capacity": 2000},
  {"id": "zone-02", "name": "South Entry Gate",   "type": "ENTRY",     "capacity": 2000},
  {"id": "zone-03", "name": "East Entry Gate",    "type": "ENTRY",     "capacity": 1500},
  {"id": "zone-04", "name": "West Entry Gate",    "type": "ENTRY",     "capacity": 1500},
  {"id": "zone-05", "name": "North Concourse",    "type": "CONCOURSE", "capacity": 5000},
  {"id": "zone-06", "name": "South Concourse",    "type": "CONCOURSE", "capacity": 5000},
  {"id": "zone-07", "name": "Main Seating Bowl",  "type": "SEATING",   "capacity": 35000},
  {"id": "zone-08", "name": "Food Court A",       "type": "FOOD",      "capacity": 800},
  {"id": "zone-09", "name": "Food Court B",       "type": "FOOD",      "capacity": 800},
  {"id": "zone-10", "name": "Merchandise Zone",   "type": "FOOD",      "capacity": 400}, # Merch zone uses FOOD capacity logically per spec
  {"id": "zone-11", "name": "North Exit",         "type": "EXIT",      "capacity": 3000},
  {"id": "zone-12", "name": "South Exit",         "type": "EXIT",      "capacity": 3000},
]

class SensorSimulator:
    def __init__(self, venue_id, phase, speed, chaos):
        self.venue_id = venue_id
        self.phase = phase
        self.speed = speed
        self.chaos = chaos
        self.tick_count = 0
        self.queue_sim = QueueSimulator(venue_id=self.venue_id)
        
        if chaos:
            publisher_instance.set_chaos(True)

    def calculate_occupancy(self, zone):
        # Base logic on phase
        target = 0.0
        
        if self.phase == "PRE_EVENT":
            # Real arrival curve (Gate 1, 49,201 total):
            # T-90: 5% arrived
            # T-60: 22% arrived
            # T-30: 61% arrived  ← steeper than simulated
            # T-15: 87% arrived
            # T-0:  98% arrived
            progress = (self.tick_count % 18) / 18.0
            curve_multiplier = 0.05 + (0.93 * progress)
            if zone['type'] == "ENTRY": target = 0.85 * curve_multiplier
            elif zone['type'] == "CONCOURSE": target = 0.60 * curve_multiplier
            elif zone['type'] == "FOOD": target = 0.70 * curve_multiplier
            elif zone['type'] == "SEATING": target = 0.95 * curve_multiplier
            elif zone['type'] == "EXIT": target = 0.05
            
            # Inject random density spike in one entry zone
            if "zone-01" in zone['id'] and self.chaos:
                target = 1.1  # Simulate bottleneck
                
        elif self.phase == "LIVE_EVENT":
            # LIVE_EVENT (T+0 to T+90min)
            if zone['type'] == "ENTRY": target = 0.05
            elif zone['type'] == "SEATING": target = 0.96
            elif zone['type'] == "FOOD": target = 0.40 # Periodic surges modeled below
            elif zone['type'] == "CONCOURSE": target = 0.15
            elif zone['type'] == "EXIT": target = 0.01

        elif self.phase == "HALF_TIME":
            # HALF_TIME (T+45 to T+60)
            if zone['type'] == "SEATING": target = 0.60
            elif zone['type'] == "CONCOURSE": target = 0.90
            elif zone['type'] == "FOOD": target = 1.15 # CRITICAL
            elif zone['type'] == "ENTRY": target = 0.01
            elif zone['type'] == "EXIT": target = 0.05

        elif self.phase == "POST_EVENT":
            # POST_EVENT (T+90 to T+120)
            if zone['type'] == "SEATING": target = 0.10
            elif zone['type'] == "CONCOURSE": target = 0.70
            elif zone['type'] == "FOOD": target = 0.20
            elif zone['type'] == "ENTRY": target = 0.01
            elif zone['type'] == "EXIT": target = 1.05 # Surges to CRITICAL
            
        else:
            # FULL_DAY mode - just mock variations
            target = 0.5 + 0.3 * math.sin(self.tick_count / 10.0)

        # Add some noise
        noise = random.uniform(-0.05, 0.05)
        raw_occupancy = max(0.0, target + noise)
        return raw_occupancy

    def step(self):
        zone_readings = []
        for zone in ZONES:
            occupancy = self.calculate_occupancy(zone)
            raw_count = int(occupancy * zone['capacity'])
            
            sensor_type = random.choice(["INFRARED", "WIFI_PROBE", "CAMERA_CV"])
            confidence = round(random.uniform(0.85, 0.99), 2)
            
            reading = {
                "sensorId": f"sensor-{zone['id']}-idx",
                "zoneId": zone["id"],
                "venueId": self.venue_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "rawCount": raw_count,
                "capacity": zone["capacity"],
                "occupancy": occupancy,
                "confidence": confidence,
                "sensorType": sensor_type,
                "batteryLevel": round(random.uniform(0.6, 1.0), 2),
                "signalStrength": random.randint(-80, -50)
            }
            zone_readings.append(reading)
            publisher_instance.publish_density(reading)

        # Update queue sim mapped densities
        self.queue_sim.update_zone_densities(zone_readings)
        
        # Publish queue updates every 2 ticks (10 simulated seconds if 1 tick = 5s)
        if self.tick_count % 2 == 0:
            self.queue_sim.simulate_tick()
            
        self.tick_count += 1

def main():
    parser = argparse.ArgumentParser(description="IoT Sensor Simulator")
    parser.add_argument("--venue", default="venue-001", help="Venue ID to simulate")
    parser.add_argument("--phase", default="PRE_EVENT", choices=["PRE_EVENT", "LIVE_EVENT", "HALF_TIME", "POST_EVENT", "FULL_DAY"], help="Simulation phase")
    parser.add_argument("--speed", default="1x", help="Simulation speed multiplier (e.g. 10x)")
    parser.add_argument("--chaos", action="store_true", help="Enable random failure injection")
    parser.add_argument("--seed", type=int, help="Random seed")
    
    args = parser.parse_args()
    
    if args.seed:
        random.seed(args.seed)
        
    speed_mult = 1.0
    if args.speed.endswith("x"):
        speed_mult = float(args.speed[:-1])

    sim = SensorSimulator(args.venue, args.phase, speed_mult, args.chaos)
    
    logging.info(f"Starting simulation. Venue={args.venue}, Phase={args.phase}, Speed={args.speed}")
    
    tick_delay_seconds = 5.0 / speed_mult
    
    try:
        while True:
            sim.step()
            time.sleep(tick_delay_seconds)
    except KeyboardInterrupt:
        logging.info("Simulation stopped by user.")

if __name__ == "__main__":
    main()
