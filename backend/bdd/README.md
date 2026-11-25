# Cucumber BDD setup

Run from the repository root after starting the backend and configuring a non-production MongoDB database.

1. `cd backend`
2. `npm install --save-dev @cucumber/cucumber`
3. Copy this BDD folder into `backend/bdd/` (or adjust `--require`).
4. Set `AL_LMS_API_URL=http://localhost:5000` and `AL_LMS_PENDING_TEACHER_COOKIE` to the cookie value for a dedicated pending-teacher test account. Set `AL_LMS_TEST_COURSE_ID` if needed. Do not use a production user/token.
5. Run: `npx cucumber-js bdd/features --require bdd/step-definitions/steps.js`

The unauthenticated scenario requires only a running API. The pending-teacher scenario requires a valid test account token. Capture the Cucumber summary as evidence.
