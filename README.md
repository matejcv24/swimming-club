# Swimming Club Hydra

A Laravel + React application for managing a swimming club.

It covers the day-to-day admin and coach workflows for:

- members
- parents
- trainings and attendance
- membership fee payments
- unpaid fees
- coach staff and salaries
- invoices
- profit tracking
- in-app notifications

## Tech Stack

- PHP 8.4
- Laravel 13
- Laravel Fortify
- Inertia.js
- React 19
- TypeScript
- Vite
- Tailwind CSS
- MUI

## Roles

The app currently uses two roles:

- `admin`
- `coach`

Route access is enforced through the custom `role` middleware in [app/Http/Middleware/CheckRole.php](app/Http/Middleware/CheckRole.php).

## Main Features

### Dashboard

- Admin dashboard shows:
  - profit
  - invoices
  - unpaid fees
  - members
  - trainings
  - membership fees
  - attendance
  - staff
- Coach dashboard shows:
  - salary
  - unpaid fees
  - members
  - trainings
  - membership fees
  - attendance

### Members

- create and update swimmers
- attach parent information
- track member status (`active` / `inactive`)
- open direct member details from notifications

### Trainings and Attendance

- record attendance by date and pool
- view present swimmers in modal flows
- open attendance directly from notifications

### Membership Fees

- record payments per member
- track payment method (`cash` / `card`)
- open payment history directly from notifications

### Staff and Salaries

- admins can add coach accounts
- coaches can claim their account through a signed link
- admins can record salaries per coach
- coaches can view their own salary history from the dashboard

### Invoices and Profit

- admins can manage invoices
- admins can review monthly and yearly profit history

### Notifications

- unread badge in the header
- notifications page with history
- mark-as-read / mark-all-as-read flow
- deep links to the relevant modal/page for members, membership fees, salaries, and trainings

## Domain Models

Main Eloquent models:

- `User`
- `Member`
- `ClubParent`
- `Training`
- `Attendance`
- `MembershipFee`
- `Salary`
- `Invoice`

## Important Routes

Authenticated app routes live in [routes/web.php](routes/web.php).

High-level areas:

- `/dashboard`
- `/members`
- `/trainings`
- `/attendance`
- `/membership-fees`
- `/unpaid-fees`
- `/staff`
- `/invoices`
- `/profit`
- `/notifications`

## Database

The project includes migrations for:

- users, jobs, cache
- role support on users
- two-factor auth columns
- members and parents
- trainings and attendance
- membership fees
- salaries
- invoices
- notifications

See [database/migrations](database/migrations).

## Local Setup

### 1. Install backend dependencies

```bash
composer install
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Create environment file

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 4. Generate app key

```bash
php artisan key:generate
```

### 5. Configure database

Update `.env` with your database credentials, then run:

```bash
php artisan migrate
```

### 6. Start the app

Backend:

```bash
php artisan serve
```

Frontend:

```bash
npm run dev
```

Or use the Composer dev command to run the app, queue listener, and Vite together:

```bash
composer run dev
```

## Useful Commands

### Run tests

```bash
php artisan test
```

### PHP formatting

```bash
composer run lint
```

### PHP formatting check

```bash
composer run lint:check
```

### Frontend lint

```bash
npm run lint
```

### Frontend lint check

```bash
npm run lint:check
```

### Prettier format

```bash
npm run format
```

### Prettier check

```bash
npm run format:check
```

### TypeScript check

```bash
npm run types:check
```

## Known Note

At the moment, `npm run types:check` may fail because of generated route typing/export issues unrelated to the core business logic. If that happens, check:

- `resources/js/actions/App/Http/Controllers/index.ts`
- route exports from `@/routes`

## Project Structure

```text
app/
  Http/Controllers/     Laravel controllers
  Http/Middleware/      middleware, including role checks
  Models/               domain models
  Notifications/        database notification payloads

resources/js/
  components/           shared React UI
  layouts/              app layouts
  pages/                Inertia pages

routes/
  web.php               application routes

database/migrations/    schema changes
```

## Authentication

Authentication is powered by Laravel Fortify and includes:

- login
- password reset
- email verification
- two-factor setup/challenge
- coach account claim flow

## License

This repository still carries the original Laravel starter-kit package metadata (`MIT`), but you should adjust the license and package information if this project is being distributed as a club-specific product.
