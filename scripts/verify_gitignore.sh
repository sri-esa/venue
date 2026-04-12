#!/bin/bash
echo "CHECK 1:"
git ls-files | grep -E "\.(env|json|pem|key|p12)$" | grep -v "\.env\.example\|package\.json\|tsconfig\.json\|firebase\.json\|pubspec\.yaml\|firestore\.indexes\.json\|firestore\.rules\|database\.rules\.json\|contract\.json\|prod_dashboard\.json\|crowd_density_schema\.json\|jest\.config\.json" || echo "EMPTY"

echo "CHECK 2:"
git check-ignore -v apps/attendee-app/lib/main.dart apps/staff-dashboard/src/App.tsx services/crowd-density/src/index.ts shared/types/crowd.types.ts shared/contracts/crowd-density.contract.json docs/phase1_problem_analysis.md .env.example firebase.json README.md || echo "NONE_IGNORED"

echo "CHECK 3:"
git status --short --ignored=matching | grep "^!" | wc -l || echo "0"
