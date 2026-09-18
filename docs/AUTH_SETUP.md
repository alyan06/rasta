# Accounts, cloud saving, and feedback

The app contains a real Supabase Google OAuth integration. Device saving, backup export, and feedback draft downloads work without those services. No account, message delivery, or email is simulated.

## Current state (18 September 2026)

- Supabase project **`rasta`** (ref `kwlfhxegnyvmzekxexto`, region `ap-south-1` Mumbai) exists and the migration below has been applied: `user_workspaces`, `feedback`, the RLS policies and both RPCs are live.
- `.env.local` (git-ignored) points the app at that project with its public publishable key, so local builds are "connected".
- **Still to do by the project owner:** create the Google OAuth client and enable the Google provider in Supabase (steps 1–5 under *Enable Google sign-in*), and add the production site URL + redirect URLs. Until the provider is enabled, pressing *Sign in with Google* redirects to Supabase, which answers "Unsupported provider: provider is not enabled" — nothing is stored.
- For deployment (e.g. Vercel), set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting project; both are public client values.

## Connect Supabase

1. Create or choose the Rasta Supabase project. Decide its region and data retention arrangements before collecting student information.
2. Apply `supabase/migrations/202609150001_rasta_accounts.sql` using the project SQL editor or the Supabase CLI migration workflow. This creates the workspace table, private feedback table, ownership policies, and restricted RPC functions. Run the migration once on a clean project; it creates named policies.
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to the project URL and `VITE_SUPABASE_ANON_KEY` to its public publishable/anon key. Restart Vite. For deployment, set these environment variables in the hosting project before rebuilding the app.
4. Keep `.env.local` out of version control. Vite embeds `VITE_` values into the browser bundle; **never use a Supabase service-role key, Google client secret, or database password** there.

## Enable Google sign-in

1. In Google Cloud / Google Auth Platform, create a Web application OAuth client and configure the consent screen for Rasta. Request only the basic identity scopes used by Supabase Google login. Configure test users while the Google app is in testing.
2. In the Google client's authorized JavaScript origins, add the development origin (for example `http://127.0.0.1:5173`) and the exact production HTTPS origin when available.
3. In Google authorized redirect URIs, add the callback shown on the Supabase Google provider page (normally `https://<project-ref>.supabase.co/auth/v1/callback`). This is different from the Rasta frontend redirect below.
4. In Supabase Authentication → Providers → Google, enable Google and enter the OAuth client ID and client secret there. These values do not belong in the app source.
5. In Supabase Authentication → URL Configuration, set the production Site URL when available and add each exact Rasta return URL to Redirect URLs. Development uses `http://127.0.0.1:5173/`. Add `http://localhost:5173/` only if used. The app returns to `window.location.origin + window.location.pathname`, so subpath deployments need the matching subpath in the allowlist. Keep production allowlists narrow.
6. Start Rasta, choose Continue with Google, finish Google consent, and choose which progress to use in the account panel. The browser client uses PKCE and automatic session detection.

Official setup references: [Supabase Google authentication](https://supabase.com/docs/guides/auth/social-login/auth-google), [OAuth sign-in API](https://supabase.com/docs/reference/javascript/auth-signinwithoauth), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), and [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## How sync protects existing work

- The app waits for the initial authenticated account load before allowing a cloud save.
- First sign-in and later sign-ins show an explicit choice before cloud data is uploaded or replaces local data. Both versions can be backed up using the account panel.
- Browser workspace storage is separate for the guest and each account. Logging out restores the guest workspace; a different account never inherits the previous account's data.
- Changes save after a short delay once the account copy has been chosen. Offline/network errors pause cloud saving and retain the device copy.
- Each write carries the authenticated account ID and the revision loaded by that tab. The server checks both; stale revisions cannot silently overwrite newer work. A conflict requires choosing the latest account copy or the current device copy. There is no automatic field merge.
- A user cannot access another user's workspace through row-level security. Authenticated clients can read their own row but cannot directly mutate the table; writes go through the revision-checked RPC. The RPC also checks the signed-in ID, guarding account changes during an in-flight request.
- Cloud payloads are checked against the same application schema as imports before use. Corrupt or incompatible remote data does not overwrite local work.
- Account workspace payloads are capped at approximately 1 MB. Keep backups if lengthy essays approach this limit. Signing out during an unsynced error leaves that account's separate browser copy available for recovery on the same device.

## Feedback and future mailbox delivery

With Supabase connected, the form requires a signed-in user, a message of 10–5,000 characters, and consent. Name and reply email are optional. Pressing Send calls `submit_feedback`; profile information and essays are not attached. The RPC trims and validates fields and applies limits of five messages per hour and twenty per rolling day per account, including concurrent submissions. There is no client read policy for feedback and direct client writes are denied.

The project operator can review messages in the Supabase dashboard's `feedback` table. **Email delivery is not connected.** Later, add an authenticated server-side worker or Supabase Edge Function to forward new messages to the operator's chosen mailbox. Keep mail-service credentials on the server, use idempotency to prevent duplicate emails, and sanitize content before placing it in an HTML email. Do not expose the operator's mailbox in the public frontend.

Without Supabase configuration, the form labels delivery as disconnected and offers a local `.txt` draft download. It does not claim to send a message. Drafts are held in the page's memory until downloaded or discarded by leaving the page.

## Required verification with the real service

Local automated tests check payload validation, conflict handling at the client boundary, explicit account guards in outgoing writes, and feedback validation. Actual Google consent, deployed RPC behavior, and row-level security require the configured project. Before launch, test:

- Guest progress → new Google account → explicit upload → reload → second device.
- Existing cloud progress plus different device progress; choose each version and verify backups.
- Sign out; sign in as another account; verify both device storage and cloud isolation.
- Open two tabs, make competing edits, and confirm that the second tab gets a conflict choice.
- Turn the network off while saving, then reconnect and recover without losing work.
- Attempt another user's row through the API, direct table writes, anonymous feedback, and a sixth feedback message within an hour. Each must be denied.
- Invalid/oversized workspace data and malformed feedback must be rejected.

## Production gates

Publish the responsible operator's identity, a working privacy/data-request contact form, hosting region, retention periods, and the process for account deletion and student/guardian requests. Update the beta privacy/terms pages to match the actual deployment and have them reviewed for the intended jurisdictions and student ages. Deleting an auth user from the operator's backend cascades to their workspace and feedback; deleting a browser copy alone does not delete cloud data. Set up a user-facing account deletion workflow before production.

Complete the Pakistan + USA university catalogue coverage gate, verify programme data and official sources, and connect support delivery before public launch. Do not describe the beta as a production service until these gates are resolved.
