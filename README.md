# Pool-Angel
A pool service application for managing pool routes and jobs



Tech Stack:
- Node.js 
- React.js 
- Supabase 
- Prisma 


### Server Folder Structure

    .server/
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── middleware/
    │   ├── services/
    │   ├── models/
    │   ├── types/
    │   └── server.ts
    ├── package.json
    └── tsconfig.json



### Client Folder Structure
    .src/
    ├── api/
    ├── components/
    ├── pages/
    ├── hooks/
    ├── services/
    ├── types/
    ├── layouts/
    ├── routes/
    └── App.tsx

    Ex.
    .src/
    ├── pages/
    │   ├── Login.tsx
    │   ├── Dashboard.tsx
    │   ├── Customers.tsx
    │   └── Pools.tsx
    │
    ├── components/
    │   ├── Navbar.tsx
    │   ├── Sidebar.tsx
    │   └── PoolCard.tsx
    │
    ├── api/
    │   └── axios.ts
    │
    ├── types/
    │   ├── Pool.ts
    │   └── Customer.ts




### API call flow
    Component
        ↓
    Service
        ↓
    Axios Instance
        ↓
    Express API
        ↓
    Database