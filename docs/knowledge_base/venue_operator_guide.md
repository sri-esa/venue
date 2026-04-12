# Venue Operator Guide
**For the 20+ Operations Control Room Staff**

## Understanding The Interface
The Staff Dashboard provides a live map of the physical venue split into 12 managed "Zones".
- **Density Indicators:** Green (Safe), Yellow (Caution/High), Red (CRITICAL).
- **What RED Means:** The physical zone has exceeded safe capacity. It is mathematically impossible for attendees to safely evacuate that zone in under 3 minutes.
- **Queue Boards:** Sidebar lists all Concession/Merch stalls and their live AI-measured wait times based on physical clustering in their zone.

## Operations Workflows

### How to Assign Staff
1. If an alert pops up (e.g., "Zone-05 CRITICAL Density"), click **Assign Staff** on the modal.
2. Select closest available staff members. The system automatically pushes a dispatch notification to their mobile app.

### Manual Overrides
If a stall runs out of stock or needs to close:
1. Navigate to the `Concessions` tab.
2. Click the `Open/Closed` toggle. 
3. *System Action:* This immediately removes the stall from the Gemini AI routing pipeline, preventing the mobile app from sending attendees to a closed food stand.

### "Limited Service Mode" Alerts
If your dashboard shows a banner reading `Limited Service Mode Enabled`, it means our cloud platform is falling back to safe defaults due to extreme scaling delays. 
- *Your Action:* Rely completely on radio communication. The maps won't update faster than 30s instead of the normal 5s.

### Escalation Tree
If the Dashboard fails to load or goes blank:
1. **Tier 1 (Within 5 mins):** Check local WiFi / LAN connection in the control room.
2. **Tier 2:** Refresh browser (Dashboard uses local caching to reload safely).
3. **Tier 3:** Contact On-Call IT via Slack `##venue-tech-ops`. Provide the `Event_ID`.
