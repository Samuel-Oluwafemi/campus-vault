# GitHub and Netlify deployment

## GitHub checks

The `Campus Vault CI` workflow runs on pull requests and pushes to `main`.
It builds the frontend and runs the Cloudflare Worker tests and typecheck.
The workflow requires no project secrets.

## Netlify frontend

Connect the GitHub repository to Netlify and use the repository's `netlify.toml`.
Netlify builds the `campus-vault` Vite application and publishes its `dist`
directory. The SPA redirect in the configuration supports routes such as
`/dashboard` and `/library` on direct page loads.

Set these frontend environment variables in the Netlify site settings before
expecting authentication and API-backed pages to work:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_API_BASE_URL`

Use the Firebase web app's public client configuration for the `VITE_FIREBASE_*`
values. Set `VITE_API_BASE_URL` to the deployed HTTPS Worker API base URL,
including `/api/v1`. The local development value points to localhost and must
not be used for a production deployment.

## Cloudflare Worker

The API is a separate Cloudflare Worker deployment, not part of Netlify's
frontend build. Deploy it from `campus-vault/functions` after configuring the
production `APP_ORIGIN` to the Netlify site origin and setting backend
credentials as Cloudflare Worker secrets. Never put service-account private
keys in Netlify frontend variables, GitHub repository files, or this repository.

For production, deploy with the production Wrangler environment:

```powershell
cd campus-vault/functions
npx wrangler login
npx wrangler secret put FIREBASE_PROJECT_ID --env production
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_EMAIL --env production
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY --env production
npx wrangler deploy --env production
```

Use the values already configured locally in `functions/.dev.vars`, but enter
them directly into Wrangler when prompted. Do not paste the private key into
Netlify or commit it. The resulting Worker URL should be used as
`VITE_API_BASE_URL` with `/api/v1` appended.

The Worker currently provides health, profile, and provisional course-index
routes. Approved resource metadata, file storage, previews, and downloads are
not deployed. The Geology PDFs and past questions in the local reference folder
are filename references only; they are not included in the frontend or Worker
deployment.
