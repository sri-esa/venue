# Service: iot-simulator
# Layer: Perception Layer
# Implements: Req 8
# Publishes To: Pub/Sub topic: queue-events-raw
# Consumes From: N/A
import time
import random
from datetime import datetime, timezone
from mqtt_publisher import publisher_instance

# 15 F&B stalls linked to specific zones
STALLS = [
    {"id": "stall-01", "name": "Food Court A - Burgers", "type": "FOOD", "zoneId": "zone-08", "base_q": 2},
    {"id": "stall-02", "name": "Food Court A - Drinks", "type": "DRINKS", "zoneId": "zone-08", "base_q": 1},
    {"id": "stall-03", "name": "Food Court A - Vegan", "type": "FOOD", "zoneId": "zone-08", "base_q": 1},
    {"id": "stall-04", "name": "Food Court A - Pizza", "type": "FOOD", "zoneId": "zone-08", "base_q": 3},
    {"id": "stall-05", "name": "Food Court A - Restrooms", "type": "RESTROOM", "zoneId": "zone-08", "base_q": 5},
    {"id": "stall-06", "name": "Food Court B - Hot Dogs", "type": "FOOD", "zoneId": "zone-09", "base_q": 2},
    {"id": "stall-07", "name": "Food Court B - Beer", "type": "DRINKS", "zoneId": "zone-09", "base_q": 4},
    {"id": "stall-08", "name": "Food Court B - Tacos", "type": "FOOD", "zoneId": "zone-09", "base_q": 2},
    {"id": "stall-09", "name": "Food Court B - Pretzels", "type": "FOOD", "zoneId": "zone-09", "base_q": 1},
    {"id": "stall-10", "name": "Food Court B - Restrooms", "type": "RESTROOM", "zoneId": "zone-09", "base_q": 3},
    {"id": "stall-11", "name": "Merch Stand North", "type": "MERCHANDISE", "zoneId": "zone-10", "base_q": 2},
    {"id": "stall-12", "name": "Merch Stand South", "type": "MERCHANDISE", "zoneId": "zone-10", "base_q": 2},
    {"id": "stall-13", "name": "Concourse Carts - Popcorn", "type": "FOOD", "zoneId": "zone-05", "base_q": 1},
    {"id": "stall-14", "name": "Concourse Carts - Drinks", "type": "DRINKS", "zoneId": "zone-06", "base_q": 1},
    {"id": "stall-15", "name": "Main Seating VIP Bar", "type": "DRINKS", "zoneId": "zone-07", "base_q": 0},
    {"id": "stall-nw-01", "name": "North West Grill", "type": "FOOD", "zoneId": "zone-05", "base_q": 2},
    {"id": "stall-nw-02", "name": "North West Drinks", "type": "DRINKS", "zoneId": "zone-05", "base_q": 1},
    {"id": "stall-nw-03", "name": "North West Snacks", "type": "FOOD", "zoneId": "zone-05", "base_q": 1},
]

class QueueSimulator:
    def __init__(self, venue_id="venue-001"):
        self.venue_id = venue_id
        # State: current length per stall
        self.state = {s['id']: {"length": s['base_q'], "open": True} for s in STALLS}
        # Last zone densities mapped to queue processing
        self.zone_densities = {}

    def update_zone_densities(self, zones_data):
        for z in zones_data:
            self.zone_densities[z['zoneId']] = z['occupancy']

    def simulate_tick(self):
        events = []
        for stall in STALLS:
            stall_state = self.state[stall['id']]
            
            # Base logic
            occupancy = self.zone_densities.get(stall['zoneId'], 0.0)
            
            if stall_state["open"]:
                # People arrive based on occupancy. People leave based on fixed service rate.
                arrival_prob = occupancy * 0.8  # Higher occupancy = higher arrival chance
                service_prob = 0.5  # Constant service rate
                
                # Surge logic
                if occupancy >= 0.90:  # CRITICAL density
                    arrival_prob = 1.0  # Massive queue build-up
                    # Randomly close some stalls due to overflow/stock out if strictly critical
                    if stall['type'] != "RESTROOM" and random.random() < 0.05:
                        stall_state["open"] = False
                elif occupancy >= 0.75:  # HIGH density
                    arrival_prob = 0.85
                
                # Update queue length
                if random.random() < arrival_prob:
                    stall_state["length"] += random.randint(1, 3) 
                if stall_state["length"] > 0 and random.random() < service_prob:
                    stall_state["length"] -= random.randint(1, 2)
                    
                stall_state["length"] = max(0, stall_state["length"])
            else:
                # If closed, people leave gradually
                if stall_state["length"] > 0:
                     stall_state["length"] -= 1

            # Compile event
            event = {
                "eventId": f"evt-{datetime.now().strftime('%Y%m%d')}",
                "venueId": self.venue_id,
                "queueId": f"queue-{stall['id']}",
                "stallId": stall['id'],
                "stallName": stall['name'],
                "stallType": stall['type'],
                "queueLength": stall_state["length"],
                "isOpen": stall_state["open"],
                "source": "SIMULATOR",
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            events.append(event)
            # Publish
            publisher_instance.publish_queue(event)

        return events
