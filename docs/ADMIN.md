# Admin access — local reference

## Admin key location
- **Source of truth:** Vercel project env `MCP_ADMIN_KEY`
- **Project:** `naumandevs-projects/docket`
- **Where it is used:** `apps/web/app/admin/page.tsx` gates the admin back-office
- **How to read it locally:** `vercel env ls` in `/Users/naumanmehdi/Hermes/apprank/app`
- **How to pull it locally:** `vercel env pull` → `.env.local`

## How to access admin
- Go to `/admin` on the live site
- Or open the local dev server and visit `http://localhost:3000/admin`
- If prompted for an admin key, use the value from Vercel env `MCP_ADMIN_KEY`

## Notes
- Do not commit this key anywhere.
- If you need to rotate it, update the Vercel env and redeploy.
