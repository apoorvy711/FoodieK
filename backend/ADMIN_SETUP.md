# Admin Setup & Verification Notes

## Environment Variables

Set these values in your backend environment configuration before startup:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Example:

```env
ADMIN_NAME=Platform Admin
ADMIN_EMAIL=admin@foodiek.com
ADMIN_PASSWORD=admin123
```

## Automatic Seeding on Startup

When the backend starts and DB connection is established, it runs the admin seeder:

- If no admin exists, it creates one from the env vars.
- If a user exists with `ADMIN_EMAIL`, that user is promoted to role `admin`.
- If env vars are missing, seeding is skipped safely.

## Manual Admin Seeder

Run this command from the backend folder:

```bash
npm run seed:admin
```

This command uses the same env vars and logic as startup seeding.
