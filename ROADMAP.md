# Pool Service App V2

A modern full-stack pool service management application built with React, JavaScript, Node.js, Express, Prisma, and PostgreSQL.

---

## Tech Stack

### Frontend

* React
* JavaScript
* Vite
* React Router
* Axios
* TanStack Query (future)

### Backend

* Node.js
* Express
* JavaScript
* Prisma ORM

### Database

* PostgreSQL
* Supabase

### Authentication

* Supabase Auth (planned)

---

# Project Goals

The goal of this project is to provide a platform for pool service companies to:

* Manage customers
* Manage properties
* Manage pools
* Track service visits
* Schedule jobs
* Manage technicians
* Track business operations

The initial MVP focuses on customer and pool management before expanding into scheduling and operations.

---

# Development Roadmap

## Phase 1: Foundation

### Backend Setup

* [x] Node.js
* [x] Express
* [x] JavaScript
* [x] Environment variables
* [x] CORS configuration

### Frontend Setup

* [x] React
* [x] JavaScript
* [x] Vite
* [x] React Router

### API Setup

* [x] Axios instance
* [x] Backend connection test

---

## Phase 2: Database

### Create Supabase Database

* [x] Create new Supabase project
* [x] Configure DATABASE_URL
* [x] Install Prisma

```bash
npm install prisma @prisma/client
```

Initialize Prisma:

```bash
npx prisma init
```

### Initial Schema

* [x] User
* [x] Company
* [x] Customer
* [x] Property
* [x] Pool

Generate migration:

```bash
npx prisma migrate dev --name init
```

---

## Phase 3: Authentication

### Supabase Auth

* [x] Register
* [x] Login
* [x] Logout
* [x] Current User Endpoint
* [x] Session Validation

### Protected Routes

* [x] Dashboard Route
* [x] Customer Routes
* [x] Pool Routes

---

## Phase 4: Core Features

### Customer Management

CRUD Operations:

* [x] Create Customer
* [x] View Customers
* [x] View Customer Details
* [x] Update Customer
* [x] Delete Customer

Fields:

* First Name
* Last Name
* Phone
* Email

---

### Property Management

CRUD Operations:

* [x] Create Property
* [x] View Properties
* [x] Update Property
* [x] Delete Property

Fields:

* Address
* City
* State
* Zip Code

---

### Pool Management

CRUD Operations:

* [x] Create Pool
* [x] View Pools
* [x] Update Pool
* [x] Delete Pool

Fields:

* Pool Type
* Pool Size
* Notes

---

## Phase 5: Dashboard

Dashboard Metrics:

* [x] Total Customers
* [x] Total Properties
* [x] Total Pools

Dashboard Widgets:

* [x] Recent Customers
* [x] Recent Pools

---

## Phase 6: Validation & Error Handling

### Backend

* [x] Zod Validation
* [x] Global Error Handler
* [x] API Error Responses

Install:

```bash
npm install zod
```

### Frontend

* [x] Loading States
* [x] Error States
* [x] Success Messages

---

## Phase 7: Testing

### Backend Testing

Install:

```bash
npm install -D jest supertest
```

Test Coverage:

* [x] Authentication
* [x] Customers
* [x] Properties
* [x] Pools

---

## Phase 8: Deployment

### Frontend

Deploy to Vercel.

### Backend

Deploy to Railway.

### Database

Host on Supabase.

---

# Folder Structure

## Frontend

```text
client/
└── src/
    ├── api/
    │   └── axios.ts
    ├── components/
    ├── hooks/
    ├── layouts/
    ├── pages/
    ├── routes/
    ├── services/
    ├── types/
    ├── App.tsx
    └── main.tsx
```

---

## Backend

```text
server/
└── src/
    ├── controllers/
    ├── middleware/
    ├── routes/
    ├── services/
    ├── types/
    ├── utils/
    ├── prisma/
    └── index.ts
```

---

# MVP Completion Criteria

The first release is considered complete when the following features are finished:

* [x] Authentication
* [x] Customer CRUD
* [x] Property CRUD
* [x] Pool CRUD
* [x] Dashboard
* [x] PostgreSQL Database
* [x] Prisma Integration
* [x] Production Deployment

---

# Future Features

After MVP release:

### Technician Management

* Create Technician
* Assign Technician

### Job Scheduling

* Create Job
* Assign Job
* Track Job Status

### Service Visits

* Visit History
* Water Chemistry Readings
* Service Notes

### Route Planning

* Daily Route Management
* Technician Scheduling

### Revenue Tracking

* Revenue Dashboard
* Service Revenue
* Monthly Reports

### Invoicing

* Generate Invoices
* Customer Billing
* Payment Tracking

```
```
