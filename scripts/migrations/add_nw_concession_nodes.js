// Add 3 new stall documents to venue configuration
const newStalls = [
  {
    stallId: "stall-nw-01",
    stallName: "North West Grill",
    stallType: "FOOD",
    zoneId: "zone-05",
    coordinates: {lat: 0.0, lng: 0.0}, // venue survey required
    capacity: 150,
    isOpen: true,
    dietaryTags: ["VEGETARIAN", "HALAL"]
  },
  {
    stallId: "stall-nw-02",
    stallName: "North West Drinks",
    stallType: "BEVERAGE",
    zoneId: "zone-05",
    coordinates: {lat: 0.0, lng: 0.0}, // venue survey required
    capacity: 100,
    isOpen: true,
    dietaryTags: []
  },
  {
    stallId: "stall-nw-03",
    stallName: "North West Snacks",
    stallType: "FOOD",
    zoneId: "zone-05",
    coordinates: {lat: 0.0, lng: 0.0}, // venue survey required
    capacity: 100,
    isOpen: true,
    dietaryTags: ["VEGAN"]
  }
];

// Database migration execution script stub
console.log("Preparing to add the following Northwest stalls to Firestore:");
console.dir(newStalls);
// [MANUAL ACTION REQUIRED]: coordinates need venue survey before actual db.collection('venues').doc(venueId).collection('stalls').set()
