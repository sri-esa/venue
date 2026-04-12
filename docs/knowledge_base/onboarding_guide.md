# Onboarding Guide for New Engineers

Welcome to the Smart Venue Management team! 

## Day 1: Read and Absorb
Start by familiarizing yourself with the platform constraints and goals.
- [System Overview](./system_overview.md) (What we do)
- [Architecture Decisions Log](./architecture_decisions_log.md) (Why we did it this way)
- [docs/phase2_tech_stack.md](../phase2_tech_stack.md) (The exact tools we use)

## Day 2: Environment Bootstrapping
You will be running the entire microservice ecosystem locally.
1. Run `npm install` from the root layer.
2. Build the shared libraries: `cd packages/shared && npm run build`
3. Set up your local `.env`. See `.env.example` for details around GCP API keys.
4. Run `script/start_services.sh`. Ensure all 4 microservices report ready.

## Day 3: Simulation Validation
Run your first live simulated event safely tucked inside local execution space.
1. `python iot/simulator/sensor_sim.py --phase HALF_TIME --speed 5x`
2. Open `localhost:3000` (Staff Dashboard) and watch the maps react to the mock data.

## Day 4: Make a Contribution
1. Check out a new Git branch.
2. Implement a change (e.g., adding a new mock endpoint in Fastify).
3. Ensure you follow our strict testing requirement: `scripts/run_regression.sh` must return `7/7 PASSED`.
4. Open your first PR.

## Day 5: Study the Past
1. Open the CI pipeline outputs located in `docs/retrospective/event_001_retrospective.md`.
2. Analyze the real-world scale variances compared to simulation numbers. Notice how reality diverges from testbeds.

## Week 2: Shadow Deployment
You will shadow the senior engineer executing Step 13 (Blue-Green Deployment).
See `docs/deployment/pre_deploy_checklist.md` for our deployment rigor.
