# Hammershark

Hammershark is an Expo app for Ratner-specific workouts. V1 is intentionally manual and trainer-driven: trainers create reusable workout templates, users can start from those recommendations or build a workout manually, and exercise swaps are powered by the mapped relationship between exercises, muscles, and Ratner equipment.

## Stack

- Expo + React Native + Expo Router
- Clerk for auth
- Supabase Postgres for product data and RLS
- Local demo data for development before Clerk/Supabase keys are configured

## Local Setup

```bash
npm install
cp .env.example .env
npm run start
```

If `.env` does not contain a real Clerk publishable key, the app runs in local demo mode. Use the auth screen buttons to continue as a student or trainer.

## Environment

```bash
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
EXPO_PUBLIC_SUPABASE_URL=https://replace-me.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=replace_me
EXPO_PUBLIC_SUPABASE_JWT_TEMPLATE=supabase
```

Configure Clerk's Supabase JWT template so `auth.jwt() ->> 'sub'` maps to `profiles.clerk_user_id` and the JWT role is `authenticated`.

## Database

The first schema lives in:

```text
supabase/migrations/20260430190000_initial_schema.sql
```

It creates:

- user profile/preferences tables
- Ratner catalog tables
- exercise-to-muscle and equipment-to-exercise join tables
- trainer workout templates
- user-owned workout copies
- trainer-curated exercise substitutions
- workout sessions and set logs

`supabase/seed.sql` contains a tiny starter catalog for local Supabase projects.

## Useful Commands

```bash
npm run start
npm run web
npm run typecheck
```
