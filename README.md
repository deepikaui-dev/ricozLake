# RicozLake - Enterprise Data Lake Platform 🌊

RicozLake is a modern, high-performance Data Lakehouse management web application built for seamless data ingestion, Medallion Architecture storage zone organization (Bronze, Silver, Gold), schema cataloging, interactive SQL analytics, lineage visualization, and enterprise security governance.

---

## 🚀 Key Features

- **Medallion Lake Architecture**:
  - **Bronze Zone**: Raw ingestion and unvalidated data landed directly from source streams.
  - **Silver Zone**: Cleaned, filtered, validated, and enriched structured data.
  - **Gold Zone**: High-performance, business-ready aggregated tables ready for BI & ML.
- **Dynamic Ingestion & Partitioning**:
  - Ingest Parquet, CSV, and JSON data formats.
  - Automatic partitioning strategies (`/region=*`, `/year=*`, `/category=*`).
- **Interactive SQL Query Workspace**:
  - Query datasets directly using safe, parameterized execution.
  - Export query results to CSV, download datasets, and share links.
- **Data Lineage & Traceability**:
  - Visual DAG pipeline tracking data flow across transformation stages.
- **Enterprise Governance & Security**:
  - Role-Based Access Control (RBAC) with JWT authentication.
  - Immutable security audit logs and system telemetry.
- **Expressive, Modern UI**:
  - Built with React, Vite, Lucide Icons, and Material Design principles.
  - High responsiveness across mobile, tablet, and widescreen displays.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS with centralized design tokens
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js & Express
- **ORM / Database**: Prisma ORM with Supabase PostgreSQL
- **Security**: JWT (`jsonwebtoken`), bcryptjs, Helmet, CORS
- **File Uploads**: Multer (with secure staging and path traversal protection)

---

## 📁 Project Architecture

```
Ricozlake/
├── client/                 # React frontend client
│   ├── public/             # Static public assets
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, Sidebar, etc.)
│   │   ├── context/        # Auth & theme contexts
│   │   ├── pages/          # Full page screens (Catalog, Ingestion, SQL, Lineage)
│   │   ├── services/       # Centralized API communication layer
│   │   └── index.css       # Core design system & CSS tokens
│   ├── .env.example        # Frontend environment template
│   └── package.json
├── server/                 # Express REST API backend
│   ├── config/             # Database and server config
│   ├── controllers/        # Request handling logic
│   ├── middlewares/        # Auth, error, and security middlewares
│   ├── prisma/             # Schema definitions and migrations
│   ├── routes/             # API routes (/api/datasets, /api/queries, etc.)
│   ├── .env.example        # Backend environment template
│   └── server.js           # Server initialization
├── .gitignore              # Environment secret protection & ignore rules
└── README.md
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database (or Supabase instance)

### 2. Backend Setup
1. Open a terminal in the `server` folder:
   ```bash
   cd server
   npm install
   ```
2. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
3. Configure your database connection string and JWT secret in `.env`:
   ```env
   PORT=5000
   DATABASE_URL=your_postgresql_connection_string
   DIRECT_URL=your_direct_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```
4. Run migrations and start the server:
   ```bash
   npx prisma generate
   npm run dev
   ```

### 3. Frontend Setup
1. In a new terminal, navigate to `client`:
   ```bash
   cd client
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 🔒 Security & Secrets Management
All sensitive credentials (`.env`, database connection strings, JWT secrets, and uploaded files) are strictly ignored by `.gitignore` and never committed to source control.

---

## 📄 License
MIT License. Built with ❤️ for enterprise data teams.
