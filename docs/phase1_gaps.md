# Phase 1: Needs vs. Requirements Gap Analysis

## Overview
This document cross-references the 10 System Requirements from the *Step 1 Problem Space Analysis* against the Stakeholder Needs Matrix from the *Step 2 Stakeholder Mapping Analysis*. 

The objective is to identify **Orphaned Requirements** (requirements lacking a clear stakeholder champion in the Needs matrix) and **Unmet Needs** (stakeholder goals lacking a corresponding system requirement).

---

## 1. Orphaned Requirements (No Clear Champion)

These are system requirements that do not align with any stakeholder's currently stated #1 Goal from the Needs Matrix. They risk being deprioritized or defunded unless a stakeholder explicitly champions them.

*   **Requirement 5: Dynamic AR-based Wayfinding for Vomitory Traffic Segregation**
    *   *System Requirement:* "The system SHALL push dynamic, AR-based wayfinding overlays... to enforce segregated, bi-directional traffic states in dense vomitories."
    *   *The Gap:* While the CSO cares about crowd crush, no stakeholder explicitly championed AR overlays for *in-the-moment concourse traffic control*. Attendees want frictionless service, and IT fears AR bandwidth demands. This may cause friction because attendees are unlikely to look at their phones while clustered in a tight, physically compressed moving vomitory.
*   **Requirement 9: Post-Event Analytics Logging**
    *   *System Requirement:* "The system SHALL log and retain all timestamped location and density data for post-event playback..."
    *   *The Gap:* All major stakeholder goals in the matrix are currently focused on *real-time* resolution (EMTs want fast live routes, GM wants live revenue, Attendees want live line lengths). There is no "Data Analyst" or "Operations Strategy" stakeholder defined in the core matrix to champion historical log retention and predictive model training.

---

## 2. Unmet Stakeholder Needs (No Matching Requirement)

These are pressing stakeholder goals or fears identified in the mapping matrix that are not currently addressed by the 10 core system requirements.

*   **Unmet Need A: Empowering Frontline Staff with Answers**
    *   *Stakeholder:* Ushers / Security Guards
    *   *Goal:* "Real-time answers to fan questions and fast backup for incidents."
    *   *The Gap:* Requirement 8 covers emergency incident escalation, but there is NO requirement for a staff-facing knowledge base, staff-facing AI interface, or live directory to help ushers answer fan questions. The Gemini AI assistant is only specified for the *attendee* app (Requirement 7).
*   **Unmet Need B: Load-Balancing Concessions for Revenue Optimization**
    *   *Stakeholder:* Venue General Manager (GM)
    *   *Goal:* "Maximize per-capita spending by balancing crowd load."
    *   *The Gap:* Requirement 3 alerts Ops to long concession lines, and Requirement 6 calculates wait times. However, no requirement states the system must actively re-route attendees away from long concession lines to underutilized ones. Active re-routing via the AI assistant (Requirement 7) currently *only* applies to restrooms.
*   **Unmet Need C: Preserving Network Bandwidth from AR/AI Demands**
    *   *Stakeholder:* Venue IT Director
    *   *Fear/Resistance:* "The AR feature will overwhelm the stadium's 5G/WiFi arrays."
    *   *The Gap:* While Requirement 10 handles localized IoT sensor caching during an outage, there are ZERO system requirements addressing the IT Director's primary fear: bandwidth throttling, edge-caching of ARCore 3D maps, or compressing LLM payloads to prevent the consumer app from crashing the network operations.

---

## 3. Recommended Actions for Phase 2 Architecture

1.  **Add a Bandwidth/Caching Requirement:** Require edge-caching of all static 3D venue maps to attendee devices prior to stadium entry so the AR app only streams lightweight, dynamic coordinate data.
2.  **Expand Re-Routing Logic (AI):** Update Requirement 7 so the Gemini Assistant intelligently re-routes attendees to *both* restrooms and under-capacity concessions to directly satisfy the GM's revenue maximization goal.
3.  **Implement a Staff "Answer" Feature:** Specify a lightweight, text-only portal or AI Slack/Teams integration for Ushers to query the Gemini Assistant on behalf of attendees whose phones are dead or who prefer human interaction.
4.  **Define a Post-Event Champion:** Formally assign Ownership of Data & Analytics (Requirement 9) to the Venue Director of Operations, ensuring it isn't dropped during iterative budget cuts. 
