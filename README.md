# HackMe — HTML/CSS/JavaScript Prototype

A browser-only prototype of the HackMe student hackathon platform.

## Included flows

- Landing page
- Demo login using localStorage
- Dashboard
- Explore/search/sort hackathons
- Join by code
- Public hackathon page
- Create hackathon
- Generated join code
- Host dashboard
- Create/join teams
- Project submission
- Submission deadline validation
- Judging and scoring
- Leaderboard
- Winner announcement
- Responsive dark startup-style UI

## Run

No Node.js or backend is required.

Simply open `index.html` in a browser.

For the best local development experience, use VS Code Live Server or any static HTTP server.

## Important limitation

This is a frontend-only prototype. Data is stored in browser `localStorage`.

Therefore it does NOT provide:

- real multi-user synchronization
- real authentication
- server-side authorization
- PostgreSQL
- RLS
- secure server-side deadline enforcement
- production security

## Upgrade path

The original HackMe PRD specifies:

Next.js + React + TypeScript + Tailwind + Supabase Auth + PostgreSQL + RLS.

The UI/flow in this prototype can be migrated to that stack later by replacing the localStorage data layer with Supabase and implementing server-side authorization.

## Host → Participant Code Flow

1. Log in.
2. Open **Create** and fill the complete hackathon form.
3. Click **Create Hackathon**.
4. HackMe generates a unique 7-character code such as `HM7K2PX`.
5. The creation result shows **Your hackathon is live**, Copy Code, Copy Join Link, Open Hackathon, and Host Dashboard.
6. A participant opens **Participate**, enters the code, and views the exact hackathon created by the host.
7. The participant must explicitly click **Join Hackathon** to enroll.

This prototype stores data in browser `localStorage`, so host and participant testing should be performed in the same browser profile. A real multi-user deployment requires a backend/database.
