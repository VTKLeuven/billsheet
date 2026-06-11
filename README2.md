# Billsheet - Full Local Setup with Supabase

This guide explains how to set up and run the Billsheet project locally with a Supabase database.

---

## Prerequisites

- **Node.js** (LTS version, e.g., 22.x)
- **npm** (comes with Node.js)
- **Docker Desktop** (for local Supabase)
- **Git**
- **VS Code** or another code editor (optional)

Check installations:

node --version
npm --version
git --version
docker --version

## Clone the project
git clone <your-repo-url>
cd billsheet

npm run dev

## Initialize Supabase locally
npx supabase init
This creates the /supabase folder with local configuration.

## Start Supabase
For Windows: Make sure docker is running in the background
npx supabase start
Example output:

API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Publishable key: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
Studio URL: http://127.0.0.1:54323
Mailpit URL: http://127.0.0.1:54324


Keep this terminal open — Supabase will run as long as this terminal is open.

To mirgate database:
npx supabase login
npx supabase link
npx supabase db push

## Set Environment Variables

Create .env.local in the project root with:

NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=postgres


Notes:

File must be in project root

No spaces around =

No quotes around values
## Install Project Dependencies
npm install
## Run the Project
npm run dev
Open your browser at http://localhost:3000
The app should now be connected to your local Supabase database.


Temporal Account
xander.depauw@vtk.be
temp

