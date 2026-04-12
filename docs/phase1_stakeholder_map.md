# Phase 1: Stakeholder Mapping Analysis – Smart Venue Management System

## PART A — STAKEHOLDER IDENTIFICATION

### 1. PRIMARY USERS (Direct System Interaction)
*   **Attendees (General Admission & Club):**
    *   *Device:* Personal smartphones (iOS/Android).
    *   *Technical Literacy:* Highly variable (low to high). Look for intuitive, zero-training interfaces.
    *   *Primary Goal:* Minimal friction reaching their seat, getting food, and returning without missing game action.
*   **Frontline Operations (Ushers & Security Guards):**
    *   *Device:* Venue-issued ruggedized tablets or smartphones.
    *   *Technical Literacy:* Moderate. High turnover requires easy onboarding.
    *   *Primary Goal:* Maintain order, answer attendee questions quickly, and report incidents instantly without breaking visual contact with the crowd.
*   **First Responders (EMTs & Local PD):**
    *   *Device:* Ruggedized mobile terminals and smartwatches.
    *   *Technical Literacy:* Moderate to High.
    *   *Primary Goal:* Arrive at an incident location as fast and safely as possible.

### 2. SECONDARY USERS (Affected by Output)
*   **Janitorial/Cleaning Staff:** Dispatched based on system density and incident reporting, though they may receive orders via radio rather than direct app use.
*   **Concession & Merchandise Vendors:** Experience fluctuating demand spikes driven by the system's wait-time routing algorithms.
*   **Public Transit Authorities / Rideshare Drivers:** External flow is heavily impacted by how the system orchestrates aggregate post-event egress.

### 3. DECISION MAKERS (Governance & Funding)
*   **Venue General Manager (GM):** Holds ultimate budgetary authority. Cares about overall attendee satisfaction (NPS scores) and total per-capita revenue.
*   **Chief Security Officer (CSO):** Governs deployment of surveillance, IoT, and security personnel. Cares strictly about incident response times, crowd crush metrics, and liability mitigation.
*   **Chief Financial Officer (CFO) / Facilities Owner:** Approves capital expenditure for IoT infrastructure. Focuses on ROI, installation costs, and maintenance OPEX.

### 4. SYSTEM INTEGRATORS (Infrastructure Integration)
*   **Venue IT Director:** Manages the existing fiber, WiFi access points, and server rooms. Must ensure the new system doesn't crash the network.
*   **Ticketing Partners (e.g., Ticketmaster/SeatGeek):** Own the ingress APIs and barcode scanning infrastructure.
*   **Point-of-Sale (POS) Vendors:** Own the transaction data required to calculate concession wait times.

---

## PART B — STAKEHOLDER NEEDS MATRIX

| Stakeholder | Pain Point (Current State) | Goal (Success) | Fear/Resistance | Success Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Attendees** | Missing the game due to unpredictable concession/restroom lines. | Frictionless venue navigation and fast service. | The AR app drains their phone battery or requires a massive download. | Wait times accurately match the app's prediction (+/- 2 mins). |
| **Ushers / Security** | Dealing with angry fans due to misinformation or lack of situational awareness. | Real-time answers to fan questions and fast backup for incidents. | The app adds "screen time" that distracts them from physical crowd monitoring. | Reduction in time spent resolving standard wayfinding queries. |
| **Medical / EMTs** | Getting blocked by dense crowds while trying to reach a medical emergency. | Unimpeded, intelligently routed path to the incident. | The system routes them into a dead-end or locked section. | Response time from dispatch to patient contact ("wheels to patient"). |
| **Venue GM** | Revenue left on the table because fans don't want to wait in long concession lines. | Maximize per-capita spending by balancing crowd load. | System causes a PR disaster (e.g., routing fans into a dangerous bottleneck). | Increase in total food/beverage/merch transactions per event. |
| **Venue IT Dir.** | Network saturation during halftime taking down critical venue operations. | Robust uptime with manageable bandwidth demands. | [ASSUMPTION] The AR feature will overwhelm the stadium's 5G/WiFi arrays. | Peak network capacity utilization remains under 85%. |

---

## PART C — CONFLICT & TENSION MAPPING

1.  **CONFLICT: Attendees vs. Security Checkpoints**
    *   **Tension:** Security mandates slow, thorough bag checks to ensure safety. Attendees want unimpeded, immediate entry to the venue.
    *   **Resolution Strategy:** Use Gemini AI to preemptively notify attendees of queue lengths and route them to underutilized gates. Incorporate optical scanners to handle clear bags faster.
2.  **CONFLICT: Venue GM (Revenue) vs. CSO (Security & Flow)**
    *   **Tension:** The GM wants merchandise and F&B kiosks highly visible in the main concourse to drive impulse buys. The CSO wants these removed to widen the walkway and prevent choke points.
    *   **Resolution Strategy:** Push promotions through the AI assistant app based on current user location and low-density areas, removing the need for physical "barkers" or intrusive displays in primary walkways.
3.  **CONFLICT: Attendees vs. Concession Operators**
    *   **Tension:** Attendees want to know the absolute fastest line to get a beer via the app. Concessionaires fear that broadcasting "zero wait time" at a specific stand will cause an uncontrolled stampede to one location, overwhelming their localized staff.
    *   **Resolution Strategy:** Implement algorithmic load-balancing. The system should NOT broadcast globally "Stand 114 is empty!" but rather subtly route small cohorts of users to different short-line stands based on their current zones.
4.  **CONFLICT: System Architects (AR/AI) vs. Venue IT Director**
    *   **Tension:** The system requires high-bandwidth API calls for ARCore mapping and LLM responses. IT wants to severely throttle public WiFi to preserve operational bandwidth.
    *   **Resolution Strategy:** Use edge-caching for stadium 3D maps within the app pre-event. AR computations must run entirely on-device, only requesting tiny JSON payloads for dynamic wait-time data.
5.  **CONFLICT: EMTs/First Responders vs. Attendees in Transit**
    *   **Tension:** At halftime, attendees occupy 100% of the concourse width. EMTs need 20% of that width dedicated to emergency transit carts.
    *   **Resolution Strategy:** When an EMT cart is dispatched, push an urgent, localized push notification/AR overlay to devices in that specific sector instructing them to "Clear the Right Lane for Medical Transit."

---

## PART D — POWER-INTEREST GRID

**High Power / High Interest (Manage Closely)**
*   Venue General Manager
*   Chief Security Officer (CSO)
*   Director of Venue Operations
*   *Strategy: Weekly progress reviews. Require sign-off on all major UI/routing logic and data integration.*

**High Power / Low Interest (Keep Satisfied)**
*   CFO / Facility Owner
*   Ticketing & POS Vendor Account Execs
*   Local Fire Marshal / Regulatory Bodies
*   *Strategy: Provide high-level ROI summaries, API requirement specs, and compliance/safety validation reports. Disturbance should be minimal.*

**Low Power / High Interest (Keep Informed)**
*   Attendees (Fans)
*   EMTs and Medical Staff
*   Ushers and Frontline Guards
*   Concession Managers
*   *Strategy: Conduct deep UXR (User Experience Research) interviews, beta testing, and training sessions. Their adoption is critical to system success.*

**Low Power / Low Interest (Monitor)**
*   Janitorial Staff
*   Third-party Transit Authorities
*   General public near the stadium
*   *Strategy: Send operational bulletins prior to major event days regarding expected egress changes.*

---

## PART E — SYSTEM FEATURE IMPLICATIONS

**1. Non-Negotiable (Demanded by High-Power Stakeholders)**
*   **Real-Time Dashboard:** A unified Operations Command Center map with < 2-second latency.
*   **Offline Fallback:** IoT sensors and staff tablets must cache data and function locally if external internet drops.
*   **Escalation Automations:** Unanswered incident reports escalate to supervisors after 60 seconds.
*   **POS & Ticketing API Integration:** Real-world transaction data must feed the wait-time model (no synthetic guessing).
*   **First-Responder Live Routing:** Dynamic EMT routing paths based on IoT crowd density algorithms.

**2. High-Value (Desired by Primary Users)**
*   **Gemini AI Concierge:** NLP-based chat for attendees ("Where is the nearest gluten-free food with under a 5-minute wait?").
*   **AR Wayfinding:** "Follow the blue line" through the camera to the correct seat or bathroom.
*   **Predictive Ingress Alerts:** Push notifications to fans 2 hours before the game advising them on the fastest gate based on current transit loads.
*   **Location-Sharing:** Ability for fans to drop an AR pin to find their friends in the concourse.
*   **One-Tap Incident Reporting:** Attendees can quietly report spills or unruly behavior with an exact geo-tag.

**3. Stakeholder Conflict Features (Needs Careful UX)**
*   **Global Wait-Time Broadcast:** Needs cohort-segmentation to avoid causing secondary crowd surges (Attendees vs. Concessionaires).
*   **Automated Medical Lane Clearing:** Using loud device alarms or intrusive push notifications to clear concourses might panic the crowd (CSO vs. EMTs).
*   **AR Marketing Pop-ups:** Sponsors will want AR ads; operations will want clean interfaces to ensure fans keep walking (Sponsors vs. Venue GM).

**4. Deprioritized for v1 (Reduce Friction)**
*   In-seat food delivery orchestration (Logistically too complex for v1 launch).
*   AR-based merchandise try-ons (High bandwidth, low correlation to crowd flow).

---

## PART F — OPEN QUESTIONS FOR STAKEHOLDER INTERVIEWS

**Venue Operations & Security (CSO, GM, IT Dir.)**
1.  *To IT Director:* What is our peak measured bandwidth utilization during a sold-out event halftime, and what hard caps exist on the public-facing SSIDs?
2.  *To CSO:* If the system detects a severe density anomaly forming at an exit, what is your mandated chain of command for triggering a physical gate hold?
3.  *To GM:* [ASSUMPTION: You utilize dynamic pricing.] Will you allow the system to offer dynamic discount coupons via the AI app to incentivize fans to move into lower-density concession zones?
4.  *To Ops Director:* What percentage of the venue currently operates as a "radio dead zone," and do you have a sub-network (e.g., CBRS or private 5G) we can piggyback on for IoT sensors?
5.  *To CSO:* How do we handle liability and data privacy regarding the retention of localized crowd-density heatmaps and attendee trajectories post-event?

**Attendees & Fans**
6.  *To General Attendee:* When weighing decisions at halftime, is "knowing exactly what food is available" or "knowing the exact line length" more critical to you?
7.  *To General Attendee:* Would you be willing to download a 50MB app prior to arriving if it guaranteed a sub-5-minute entry process?
8.  *To VIP/Club Attendee:* What is the most frustrating interaction you have when navigating from the exclusive club areas to general concourse areas?
9.  *To General Attendee:* How comfortable are you holding your smartphone camera in front of you (AR mapping) while walking through a dense, crowded concourse?
10. *To General Attendee:* If an AI assistant told you to walk a completely different route to your seat than usual, what proof would you need to actually follow its advice?

**Technology / First Responders (EMTs, Point of Sale, Integrators)**
11. *To EMT Supervisor:* In your current CAD (Computer-Aided Dispatch) workflow, what is the exact trigger point where a call moves from "routine" to "life safety priority"?
12. *To POS Vendor Rep:* What is the polling rate limit on your transaction APIs? Can we pull data every 5 seconds without throttling?
13. *To Ticketing Integrator:* Do your turnstile APIs push drop-counts via Webhook, or do we need to continually poll your endpoints for ingress data?
14. *To EMT Responder:* If you are dispatched, would you prefer the routing instructions as a top-down 2D map, or audio cues in an earpiece so you keep your eyes up?
15. *To Usher/Frontline Staff:* If a fan asks you a question and you have to look it up on a tablet, how many seconds do you have before the fan gets frustrated and walks away?
