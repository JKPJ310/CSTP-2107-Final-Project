# Equilibria

A calm, AI-integrated web app for people dealing with burnout (CSTP 2107).
Write in a diary, talk to an AI that knows your context, set small recovery goals,
and keep a comfort kit for bad days.

Built with React, Vite, Tailwind CSS and Supabase.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```sh
git clone https://github.com/JKPJ310/CSTP-2107-Final-Project
cd CSTP-2107-Final-Project
cp .env.example .env.local
npm install
npm run dev
```

Then open **http://localhost:5173**. Use exactly this address: Supabase only sends
sign-ins back to the addresses it has been told about.

`.env.local` holds the Supabase settings and is never committed. `.env.example` has the
values to copy; both are public by design (the database's row rules protect the data).
Never put a secret key, service_role key or AI key in either file.

## Signing in with Google

While Google sign-in is in testing mode, only approved Gmail accounts can use it.
Ask the project owner to add your Gmail under **Google Cloud Console → APIs & Services →
OAuth consent screen → Audience → Test users**.

## Project layout

- `src/Page/`: one file per screen
- `src/components/`: reusable pieces
- `src/lib/`: everything that talks to Supabase or the AI
- `src/data/`: wording you can edit without touching code
- `supabase/migrations/`: database setup, run in order in the Supabase SQL Editor
- `supabase/functions/`: server code (`ai-chat`, `login`); secrets live in Supabase, not here
