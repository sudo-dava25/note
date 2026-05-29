# note

A personal note-taking web application built with Next.js 15, Supabase, and deployed on Vercel. Designed for single-user or small-team use with a focus on simplicity, data ownership, and typographic clarity.

---

## Overview

note provides a clean, distraction-free interface for capturing and organizing personal notes. All data is stored in a PostgreSQL database managed by Supabase, with full Row Level Security ensuring strict per-user data isolation at the database layer.

---

## Features

- Create, edit, and delete notes with automatic debounced saving
- Pin notes to keep critical entries at the top of the list
- Assign color labels to notes for visual categorization
- Tag system with per-tag filtering and sidebar navigation
- Full-text search powered by PostgreSQL GIN index and `tsvector`
- Soft delete with a recoverable trash bin
- Permanent deletion with confirmation
- Google OAuth and email/password authentication via Supabase Auth
- Export notes as a JSON backup file
- Responsive layout with sticky sidebar navigation

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth (email + Google OAuth) |
| Hosting | Vercel |
| Icons | Lucide React |
| Styling | CSS custom properties, inline styles |

---

## Project Structure

```
note/
├── actions/
│   └── notes.ts              Server Actions for all CRUD operations
├── app/
│   ├── (app)/
│   │   └── page.tsx          Protected main application page
│   ├── (auth)/
│   │   ├── layout.tsx        Auth group layout
│   │   ├── login/page.tsx    Login page
│   │   └── register/page.tsx Registration page
│   ├── auth/callback/
│   │   └── route.ts          OAuth PKCE callback handler
│   ├── globals.css           Global design tokens and base styles
│   └── layout.tsx            Root layout
├── components/
│   ├── NoteCard.tsx          Individual note card with trash actions
│   ├── NoteEditor.tsx        Full-screen note editing modal
│   ├── NoteGrid.tsx          Grid layout with search, filtering, and context
│   └── Sidebar.tsx           Navigation sidebar with tag filtering
├── lib/
│   ├── supabase/
│   │   ├── client.ts         Browser-side Supabase client
│   │   └── server.ts         Server-side Supabase client (cookie-based)
│   └── types.ts              Shared TypeScript type definitions
├── middleware.ts              Route protection and session refresh
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- Node.js 18 or higher
- A Supabase account and project
- A Vercel account (for deployment)
- A GitHub account (for Vercel integration)

---

## Local Development

**1. Clone the repository**

```bash
git clone https://github.com/<username>/note.git
cd note
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Both values are available under **Project Settings > API** in the Supabase dashboard.

**4. Apply the database migration**

Open the Supabase SQL Editor, paste the contents of `supabase/migrations/001_initial.sql`, and execute. This creates all tables, indexes, triggers, and Row Level Security policies.

**5. Start the development server**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Database Schema

The schema consists of three tables with full Row Level Security enabled.

```
notes
  id          uuid  PRIMARY KEY
  user_id     uuid  REFERENCES auth.users
  title       text  CHECK length <= 200
  content     text  CHECK length <= 50000
  color       text  DEFAULT 'none'
  is_pinned   bool  DEFAULT false
  is_deleted  bool  DEFAULT false
  fts_vector  tsvector  GENERATED (GIN indexed)
  created_at  timestamptz
  updated_at  timestamptz  (auto-updated via trigger)

tags
  id       uuid  PRIMARY KEY
  user_id  uuid  REFERENCES auth.users
  name     text  CHECK length <= 30
  UNIQUE (user_id, name)

note_tags
  note_id  uuid  REFERENCES notes
  tag_id   uuid  REFERENCES tags
  PRIMARY KEY (note_id, tag_id)
```

Row Level Security policies ensure all queries are automatically scoped to the authenticated user. No application-level filtering is relied upon as the sole security control.

---

## Architecture Notes

**Server Actions over API Routes**
All data mutations use Next.js Server Actions. This eliminates the need for a separate `/api` layer for standard CRUD operations and provides end-to-end type safety without additional tooling. A dedicated API route layer should be introduced if a mobile client is added in the future.

**Debounced Autosave**
The note editor accumulates pending field changes in a ref-based patch object and flushes to the database 800ms after the last keystroke. This prevents excessive write operations to Supabase while ensuring data is persisted on modal close regardless of the debounce timer state.

**Full-Text Search**
Search is delegated entirely to PostgreSQL via a `GENERATED ALWAYS AS` `tsvector` column indexed with GIN. Query complexity is O(log n) compared to O(n) for `ILIKE`-based approaches, and remains performant as the notes collection grows.

**Session Verification**
The middleware uses `supabase.auth.getUser()` rather than `getSession()`. The latter only reads the JWT from the cookie without server-side verification, making it vulnerable to token replay for revoked users. `getUser()` performs a network call to the Supabase Auth server on every request, adding approximately 50ms of latency in exchange for cryptographic validity.
