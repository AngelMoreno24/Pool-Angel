# Pool Angel

Pool Angel is a full-stack pool service operations platform for managing customers, properties, pools, recurring jobs, technician routes, service visits, and business reporting.

> **Live demo:**  [https://am-pool-angel.netlify.app/]

<img width="1159" height="1056" alt="image" src="https://github.com/user-attachments/assets/13c73816-637c-4933-bf29-1eb0746ac3de" />


## Why This Project

Pool service companies need more than a customer list. They need to plan routes, assign technicians, track individual service visits, record pool readings, and understand how the business is performing.

Pool Angel models that workflow with separate recurring jobs and dated visits. Owners manage the business and routes, while technicians see only their assigned work and can check in, record readings, complete, or skip a visit.

## Features

### Owner workflow

- Manage customers, properties, pools, jobs, and technicians
- Assign jobs to technicians and organize daily route order
- View route maps with geocoded property locations
- Reschedule skipped or cancelled visits
- Generate recurring visit occurrences for a bounded date range
- Review visit history for jobs and properties
- View Operations reporting for completed visits, estimated revenue, technician workload, job status, and route completion rate

### Technician workflow

- View an assigned route by day
- Open directions to each property
- Check in to a visit
- Record chlorine, pH, alkalinity, and water temperature readings
- Add service notes
- Complete or skip visits with a required reason
- View completed visit history

### Platform capabilities

- Supabase authentication
- Owner and technician roles
- Company-scoped data access
- Prisma migrations with PostgreSQL
- Zod request validation
- Responsive React interface
- Backend integration tests and frontend workflow tests

## Screenshots

Replace these placeholders with screenshots or short GIFs from the deployed app:

| Dashboard | Route planning |
| --- | --- |
| <img width="1159" height="1056" alt="image" src="https://github.com/user-attachments/assets/ffb03990-7908-4547-9d9b-7679c768f6ae" /> | <img width="1142" height="1021" alt="image" src="https://github.com/user-attachments/assets/d3f48f1d-049d-4e8c-9ca7-2bb777f0f043" /> |

| Technician workflow | Operations reporting |
| --- | --- |
| <img width="1138" height="935" alt="image" src="https://github.com/user-attachments/assets/93291708-5b19-4a97-8fe1-c3fc86303c30" /> | <img width="1153" height="900" alt="image" src="https://github.com/user-attachments/assets/0318c411-c87c-420b-b255-1e2b152e55de" /> |

## Tech Stack

### Frontend

- React, Vite, React Router, and Tailwind CSS
- Axios and Supabase Auth
- React Leaflet and OpenStreetMap tiles
- Vitest and Testing Library

### Backend

- Node.js and Express
- Prisma ORM with PostgreSQL through Supabase
- Zod request validation
- Supabase Auth
- Vitest and Supertest

## Architecture

```text
React page or component
    |
    v
Client service layer
    |
    v
Axios authentication client
    |
    v
Express route
    |
    v
Auth and validation middleware
    |
    v
Controller
    |
    v
Prisma ORM
    |
    v
PostgreSQL / Supabase
```

The most important domain distinction is:

- **Job:** the recurring or one-time work agreement
- **Visit:** one dated occurrence of that work, with status, timestamps, notes, readings, and route order

## Project Structure

```text
Pool-Angel/
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── test/
│   └── package.json
├── server/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schema/
│   │   └── app.js
│   ├── test/
│   └── package.json
└── README.md
```

## Local Development

### Prerequisites

- Node.js 20 or newer
- A Supabase project
- A PostgreSQL connection string

### Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### Configure environment variables

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Create `server/.env`:

```env
PORT=5000
ORIGIN=http://localhost:5173
DATABASE_URL=your-postgresql-connection-string
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
```

Never expose `DATABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in the client or commit them to git.

### Apply database migrations

```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### Optional demo data

The seed script creates a demo company, owner, technician, customers, properties, jobs, and route data. Review the script before using it against a shared database.

```bash
cd server
npm run seed:demo
```

### Start the application

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

The Vite development server normally runs at `http://localhost:5173`.

## Testing

Backend integration tests:

```bash
cd server
npm test
```

The backend suite covers company and technician authorization, visit lifecycle timestamps, readings, skip validation, rescheduling, and duplicate visits. It uses mocked Prisma and Supabase boundaries and does not modify the live database.

Frontend workflow tests:

```bash
cd client
npm test
```

The frontend suite covers job type/frequency filtering and the technician check-in/completion workflow.

Build the frontend:

```bash
cd client
npm run build
```

## API Highlights

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/jobs/getAll` | List company or technician-visible jobs |
| `GET` | `/visits/getAll` | List company or assigned visits |
| `POST` | `/visits/:visitId/check-in` | Start a visit |
| `POST` | `/visits/:visitId/complete` | Complete a visit with readings |
| `POST` | `/visits/:visitId/skip` | Skip a visit with a reason |
| `POST` | `/visits/:visitId/reschedule` | Owner rescheduling for skipped/cancelled work |
| `POST` | `/visits/job/:jobId/generate` | Generate recurring occurrences for a date range |

## Deployment Checklist

Before sharing the live demo, replace the placeholders below:

- [ ] Add the production frontend URL above
- [ ] Add a safe demo login or temporary demo accounts
- [ ] Add four screenshots under `docs/`
- [ ] Deploy the frontend with `VITE_API_URL` pointing to the production API
- [ ] Deploy the server with production `ORIGIN` and Supabase variables
- [ ] Run `npx prisma migrate deploy` against the production database
- [ ] Run the backend and frontend test commands in CI
- [ ] Confirm demo accounts cannot access another company’s records
- [ ] Confirm service-role secrets are not present in frontend bundles

## Known Tradeoffs

- Recurring visits are generated explicitly for a requested date range rather than creating an unbounded number of rows.
- Service readings are stored as structured JSON for flexibility while the workflow is evolving.
- The client currently loads several collections directly through service modules; a future TanStack Query migration can centralize caching and mutation invalidation.
- Revenue reporting is currently an estimate based on completed visit/job prices. Confirm the intended billing model before treating it as accounting data.

## Future Improvements

- Add audit history for status changes and reschedules
- Add pagination and server-side date filtering to large collections
- Add photo uploads and richer service checklists
- Add CI for lint, tests, and production builds
- Migrate shared server state to TanStack Query

## License

This project is a portfolio application. Add your preferred license here before distributing it publicly.
