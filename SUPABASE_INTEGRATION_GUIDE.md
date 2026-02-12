# Supabase Authentication Integration Guide

## Overview

This guide covers the complete Supabase authentication integration for the
Infamous Freight application. Supabase handles user authentication with support
for email/password sign-up, social OAuth (GitHub, Google), and password reset
flows.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web App                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Pages                                               │   │
│  │   ├── /auth/sign-in      (email/password login)       │   │
│  │   ├── /auth/sign-up      (create account)            │   │
│  │   ├── /auth/reset-password (password recovery)       │   │
│  │   ├── /auth/callback     (OAuth redirect handler)    │   │
│  │   └── /protected/*       (require authentication)     │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                  │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Hooks & Context                                    │   │
│  │   ├── useAuth()          (access auth state)         │   │
│  │   ├── useAuthContext()   (use with AuthProvider)     │   │
│  │   └── ProtectedRoute()   (wrap protected components) │   │
│  └──────────────────────────────────────────────────────┘   │
│                            ▲                                  │
│                            │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   Supabase Clients                                   │   │
│  │   ├── supabaseBrowser() (client-side)               │   │
│  │   ├── supabaseServer()  (server-side, SSR)           │   │
│  │   └── middleware        (edge middleware)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                  │
└────────────────────────────┼──────────────────────────────────┘
                             │ HTTPS requests
                             ▼
                    Supabase Auth Service
                    (https://supabase.com)
```

## Setup Instructions

### 1. Create a Supabase Project

1. Go to <https://supabase.com/dashboard>
2. Click "New Project"
3. Fill in project details:
   - **Name**: infamous-freight
   - **Database Password**: (generate strong password)
   - **Region**: Select closest to your users
4. Wait for project initialization (~2 minutes)

### 2. Get API Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Update Environment Variables

In `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Configure OAuth Providers (Optional)

#### GitHub OAuth

1. Go to <https://github.com/settings/developers>
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Infamous Freight
   - **Homepage URL**: <https://your-app.com>
   - **Authorization callback URL**: <https://your-app.com/auth/callback>
4. Copy **Client ID** and **Client Secret**
5. In Supabase dashboard, go to **Authentication → OAuth Providers → GitHub**
6. Paste Client ID and Secret, save

#### Google OAuth

1. Go to <https://console.cloud.google.com>
2. Create new project or select existing
3. Enable Google+ API
4. Go to **Credentials → Create OAuth 2.0 Client ID**
5. Select **Web application**
6. Add authorized redirect URI: `https://your-app.com/auth/callback`
7. Copy **Client ID** and **Client Secret**
8. In Supabase dashboard, go to **Authentication → OAuth Providers → Google**
9. Paste credentials, save

## Usage Guide

### Basic Authentication Hook

```tsx
import { useAuth } from "@/hooks/useAuth";

export function UserProfile() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <div>You are not logged in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Protected Components

```tsx
import { ProtectedRoute } from "@/hooks/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Using Auth Context

```tsx
import { AuthProvider, useAuthContext } from "@/context/AuthContext";

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default MyApp;

// In any component:
function Header() {
  const { user, isAuthenticated, signOut } = useAuthContext();
  // ...
}
```

### Server-Side Authentication (SSR)

```tsx
import { supabaseServer } from "@/lib/supabase/server";

export async function getServerSideProps(context) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirect: { destination: "/auth/sign-in" } };
  }

  return { props: { user } };
}
```

## Auth Pages

### Sign In (`/auth/sign-in`)

Features:

- Email/password login
- GitHub OAuth
- Google OAuth
- Password reset link
- Sign up redirect

### Sign Up (`/auth/sign-up`)

Features:

- User registration with email/password
- Full name & company fields
- Email confirmation required
- GitHub OAuth
- Google OAuth
- Sign in redirect

### Password Reset (`/auth/reset-password`)

Features:

- Email-based password reset
- Reset link sent via email
- New password confirmation
- Back to sign in

### OAuth Callback (`/auth/callback`)

- Handles OAuth redirects
- Establishes user session
- Redirects to dashboard

## Middleware

The Next.js middleware (`middleware.ts`) protects routes:

- Protected prefixes: `/dashboard`, `/loads`, `/threads`
- Redirects unauthenticated users to `/auth/sign-in`
- Preserves redirect target in `next` query param

Protected routes automatically redirect to sign-in if not authenticated.

## Database Schema Integration

Supabase provides built-in auth tables:

```sql
-- auth.users (manages user accounts)
-- auth.identities (OAuth provider mappings)
-- public.profiles (optional: extend user data)

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP,
  CONSTRAINT id_type CHECK (id != '')
);
```

Enable Row-Level Security (RLS):

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Troubleshooting

### "Missing environment variables" Error

**Solution**: Ensure `.env.local` has valid Supabase credentials:

```bash
echo $NEXT_PUBLIC_SUPABASE_URL  # Should print URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY  # Should print key
```

### "Invalid redirect URI" Error (OAuth)

**Solution**: Verify callback URL matches exactly:

- Local dev: `http://localhost:3000/auth/callback`
- Production: `https://your-domain.com/auth/callback`

Add to Supabase → Settings → Auth → Redirect URLs

### "Email not confirmed" Error

**Solution**: Check inbox for confirmation email. For development:

1. Go to Supabase dashboard
2. Auth → Users
3. Click user → Edit → Confirm account

### OAuth Shows Blank Page

**Solution**: Clear cookies and browser cache:

```bash
# Chrome: Cmd+Shift+Delete (or Ctrl+Shift+Delete on Windows)
# Then clear cookies for localhost:3000
```

## Security Best Practices

✅ **DO:**

- Store `SUPABASE_SERVICE_ROLE_KEY` securely (never expose in browser)
- Use HTTPS in production
- Keep Supabase credentials in `.env.local` (not in git)
- Enable 2FA for Supabase dashboard
- Use Row-Level Security on database tables
- Validate user input server-side

❌ **DON'T:**

- Expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Commit `.env.local` file
- Use weak JWT secrets
- Disable RLS on sensitive tables
- Store passwords anywhere (Supabase handles this)

## API Integration

### Calling Supabase from the API

If using the API for additional auth logic:

```javascript
// apps/api/src/services/supabaseAuth.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function getUserById(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId);

  return data;
}
```

## Cost Estimation

Supabase free tier includes:

- Up to 50,000 monthly active users
- 500 MB database storage
- Basic auth

For production:

- Usage-based pricing ($0.32 per additional 1M users)
- Storage $0.024 per GB
- See <https://supabase.com/pricing>

## Learn More

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase SSR (Next.js)](https://supabase.com/docs/guides/auth/server-side-rendering)
- [Row-Level Security Guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [OAuth Providers](https://supabase.com/docs/guides/auth/social-login)
