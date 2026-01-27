# Timesheet Application - Setup Guide

Follow these steps to set up the Timesheet application after cloning the repository.

## Prerequisites

Ensure you have the following installed:

| Software | Version | Download |
|----------|---------|----------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org/) |
| PostgreSQL | v14+ | [postgresql.org](https://www.postgresql.org/download/) |
| Docker (optional) | Latest | [docker.com](https://www.docker.com/get-started/) |

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/amogh-goyal/timesheet.git
cd timesheet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/timesheet_db"

# NextAuth Configuration
NEXTAUTH_SECRET="generate-a-random-secret-key-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"
```

> **Tip:** Generate a secure secret with: `openssl rand -base64 32`

### 4. Set Up the Database

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

This starts a PostgreSQL container with:
- **Database:** `timesheet_db`
- **User:** `postgres`
- **Password:** `password`
- **Port:** `5432`

#### Option B: Using Local PostgreSQL

1. Open PostgreSQL and create a new database:
   ```sql
   CREATE DATABASE timesheet_db;
   ```

2. Update the `DATABASE_URL` in your `.env` file with your credentials:
   ```
   DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/timesheet_db"
   ```

### 5. Run Database Migrations

Apply the database schema:

```bash
npx prisma db push
```

### 6. Seed Sample Data

Populate the database with test users and charge codes:

```bash
npm run db:seed
```

### 7. Start the Development Server

```bash
npm run dev
```

### 8. Access the Application

Open your browser and navigate to:

**http://localhost:3000**

---

## Test Credentials

After seeding, you can log in with these accounts:

| Email | Password | Roles |
|-------|----------|-------|
| `admin@company.com` | `password123` | EMPLOYEE, ADMIN |
| `john@company.com` | `password123` | EMPLOYEE |
| `jane@company.com` | `password123` | EMPLOYEE |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run db:seed` | Seed database with sample data |
| `npx prisma studio` | Open Prisma database GUI |
| `npx prisma db push` | Apply schema changes to database |

---

## Project Structure

```
timesheet/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data script
├── src/
│   ├── app/
│   │   ├── admin/         # Admin dashboard pages
│   │   ├── api/           # API routes
│   │   ├── login/         # Authentication page
│   │   └── timesheet/     # Employee timesheet pages
│   ├── components/
│   │   ├── admin/         # Admin-specific components
│   │   ├── timesheet/     # Timesheet components
│   │   └── ui/            # Shadcn UI components
│   ├── hooks/             # TanStack Query hooks
│   ├── lib/               # Utilities and configurations
│   ├── providers/         # React context providers
│   └── types/             # TypeScript type definitions
├── docker-compose.yml     # Docker configuration
└── package.json
```

---

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify the `DATABASE_URL` is correct
3. Check that the database exists

### Prisma Client Issues

If you see Prisma-related errors, regenerate the client:

```bash
npx prisma generate
```

### Port Already in Use

If port 3000 is busy, specify a different port:

```bash
npm run dev -- -p 3001
```

---

## Production Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Environment Variables for Production

Ensure these are set in your production environment:

```env
DATABASE_URL="your-production-database-url"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

---

## Need Help?

- Check the [walkthrough.md](./walkthrough.md) for detailed feature documentation
- Review the Prisma schema in `prisma/schema.prisma`
- Inspect API routes in `src/app/api/`
