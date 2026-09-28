# Temple of Turki

The project is organized as a static frontend and an Express API:

- `public/` contains the HTML pages, browser scripts, stylesheets, and images.
- `backend/` contains the Express app, API routes, database models, and middleware.
- `api/` exposes the Express API through Vercel serverless functions.

## Run locally

1. Install Node.js 20.19 or newer and run `npm install`.
2. Copy `.env.example` to `.env` and set the values described below.
3. Run `npm start` and open `http://localhost:5000`.

## Deploy to Vercel

Import this repository into Vercel with the repository root as the project root. No frontend build command is needed: Vercel serves `public/` as static files and deploys the handlers in `api/` as Node.js functions.

Set the following project environment variables in Vercel:

- `MONGO_URI`: a MongoDB connection string accessible from Vercel.
- `FIREBASE_SERVICE_ACCOUNT_JSON`: the Firebase Admin service-account JSON as a single-line JSON value. Do not commit this credential.
- `FIREBASE_STORAGE_BUCKET`: the Firebase Storage bucket name. Enable Firebase Storage and grant the service account permission to write objects.
- `ADMIN_UIDS`: comma-separated Firebase user IDs allowed to use admin APIs.
- `UPI_ID` and `UPI_PAYEE_NAME`: payment details used by the UPI API.

Deployments that use gallery uploads must configure Firebase Storage; Vercel's filesystem is not persistent. Local development without `FIREBASE_STORAGE_BUCKET` continues to store gallery uploads under `backend/uploads/`.

## Deploy as a Node.js service

For a host that runs a persistent Node.js process, configure the same environment variables and use `npm start`. The Express app serves both `public/` and the API, so a separate frontend service is not required.

## Environment variables

`.env.example` lists the supported local settings. Keep `.env`, Firebase service-account files, and other credentials out of version control.
