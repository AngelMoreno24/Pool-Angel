# Pool Service App V2

A modern full-stack pool service management application built with React, TypeScript, Node.js, Express, Prisma, and PostgreSQL.

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* React Router
* Axios
* TanStack Query (future)

### Backend

* Node.js
* Express
* TypeScript
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
* [x] TypeScript
* [x] Environment variables
* [x] CORS configuration

### Frontend Setup

* [x] React
* [x] TypeScript
* [x] Vite
* [x] React Router

### API Setup

* [x] Axios instance
* [x] Backend connection test

---

## Phase 2: Database

### Create Supabase Database

* [ ] Create new Supabase project
* [ ] Configure DATABASE_URL
* [ ] Install Prisma

```bash
npm install prisma @prisma/client
```

Initialize Prisma:

```bash
npx prisma init
```

### Initial Schema

* [ ] User
* [ ] Company
* [ ] Customer
* [ ] Property
* [ ] Pool

Generate migration:

```bash
npx prisma migrate dev --name init
```

---

## Phase 3: Authentication

### Supabase Auth

* [ ] Register
* [ ] Login
* [ ] Logout
* [ ] Current User Endpoint
* [ ] Session Validation

### Protected Routes

* [ ] Dashboard Route
* [ ] Customer Routes
* [ ] Pool Routes

---

## Phase 4: Core Features

### Customer Management

CRUD Operations:

* [ ] Create Customer
* [ ] View Customers
* [ ] View Customer Details
* [ ] Update Customer
* [ ] Delete Customer

Fields:

* First Name
* Last Name
* Phone
* Email

---

### Property Management

CRUD Operations:

* [ ] Create Property
* [ ] View Properties
* [ ] Update Property
* [ ] Delete Property

Fields:

* Address
* City
* State
* Zip Code

---

### Pool Management

CRUD Operations:

* [ ] Create Pool
* [ ] View Pools
* [ ] Update Pool
* [ ] Delete Pool

Fields:

* Pool Type
* Pool Size
* Notes

---

## Phase 5: Dashboard

Dashboard Metrics:

* [ ] Total Customers
* [ ] Total Properties
* [ ] Total Pools

Dashboard Widgets:

* [ ] Recent Customers
* [ ] Recent Pools

---

## Phase 6: Validation & Error Handling

### Backend

* [ ] Zod Validation
* [ ] Global Error Handler
* [ ] API Error Responses

Install:

```bash
npm install zod
```

### Frontend

* [ ] Loading States
* [ ] Error States
* [ ] Success Messages

---

## Phase 7: Testing

### Backend Testing

Install:

```bash
npm install -D jest supertest
```

Test Coverage:

* [ ] Authentication
* [ ] Customers
* [ ] Properties
* [ ] Pools

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

* [ ] Authentication
* [ ] Customer CRUD
* [ ] Property CRUD
* [ ] Pool CRUD
* [ ] Dashboard
* [ ] PostgreSQL Database
* [ ] Prisma Integration
* [ ] Production Deployment

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
