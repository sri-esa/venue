# Concession Expansion Brief: North West Sector

## Why This Change is Happening
AI analysis of the first production event (`event_001`) data identified the North West sector (specifically the North Concourse) as the highest-density half-time chokepoint. To safely disperse crowding, we need to balance the throughput of this physical space.

## What is Changing
We are adding three (3) new Food & Beverage stalls to the North Concourse (`zone-05`). 
1. **North West Grill** (Food, Cap: 150)
2. **North West Drinks** (Beverage, Cap: 100)
3. **North West Snacks** (Food/Snack, Cap: 100)

## When is This Happening
This layout and staffing change must be complete before the setup for the next major event.

## Expected Outcome
Based on our recalibrated AI simulation and queue management algorithms:
- Adding these 3 nodes reduces Food Court A/B wait times by approximately 40% (dropping from 25 minutes to ~15 minutes).
- North Concourse CRITICAL density alerts should see fewer total triggers.

## What's Required from Operations
1. **Physical Setup:** Carts, staffing, equipment. (Budget non-app concern).
2. **Coordinate Survey:** A physical layout survey is required to note the precise GPS `{lat, lng}` of these elements so they map correctly into the mobile app's 2D and AR wayfinding.
3. **System Changes:** The development team only requires the structural config update; the rest of the systems natively consume these new data points, routing users via dynamic Nearest-Node logic.
