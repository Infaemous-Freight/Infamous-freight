# Infamous Freight Web

Next.js 14 frontend application for the Infamous Freight platform.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.15.0

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
pnpm dev
```

Development server runs at: <http://localhost:3000>

### Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm typecheck

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Analyze bundle size
pnpm build:analyze
```

## 📁 Project Structure

```
web/
├── pages/              # Next.js pages (routes)
├── components/         # Shared React components
├── src/
│   ├── components/     # Feature-specific components
│   │   └── ui/        # Reusable UI components
│   └── lib/           # Client-side utilities
├── public/            # Static assets
├── styles/            # Global styles
├── utils/             # Helper functions
├── proxy.ts           # Next.js edge proxy
└── package.json
```

## 🛠️ Key Features

- **Next.js 14**: App Router with React Server Components
- **TypeScript**: Full type safety
- **Shared Types**: Import types from `@infamous-freight/shared`
- **Analytics**: Vercel Analytics and Speed Insights
- **Monitoring**: Datadog RUM integration
- **Payments**: Stripe integration
- **Performance**: Automatic code splitting and optimization

## 🧪 Testing

Tests are managed through the E2E suite in `/e2e` directory.

### Adding Component Tests

To add React Testing Library tests:

```bash
# Install testing dependencies (if not already installed)
pnpm add -D @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Create test file
# components/Button.test.tsx
```

Example test:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## 🎨 Styling

- CSS Modules for component-specific styles
- Global styles in `styles/globals.css`
- Responsive design with mobile-first approach

## 🔧 Environment Variables

See `.env.example` for required environment variables:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`: Stripe publishable key
- `DATADOG_CLIENT_TOKEN`: Datadog RUM token
- `DATADOG_APPLICATION_ID`: Datadog application ID

**Important**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## 📊 Performance

### Bundle Analysis

```bash
pnpm build:analyze
```

Opens bundle analyzer to identify large dependencies.

### Key Optimizations

- Automatic code splitting by route
- Image optimization with Next.js Image
- Font optimization with next/font
- CSS optimization and minification

## 🌐 Routing

Next.js 14 uses file-based routing:

- `pages/index.tsx` → `/`
- `pages/about.tsx` → `/about`
- `pages/shipments/[id].tsx` → `/shipments/:id`

### Dynamic Routes

```typescript
// pages/shipments/[id].tsx
import { useRouter } from 'next/router';

export default function Shipment() {
  const router = useRouter();
  const { id } = router.query;
  // ...
}
```

## 🔄 Data Fetching

### Server-Side Rendering (SSR)

```typescript
export async function getServerSideProps() {
  const res = await fetch(`${process.env.API_BASE_URL}/api/shipments`);
  const data = await res.json();
  return { props: { data } };
}
```

### Client-Side Fetching

```typescript
import { useEffect, useState } from 'react';

function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);
}
```

## 🎯 Type Safety with Shared Package

```typescript
import type { Shipment, ApiResponse } from '@infamous-freight/shared';
import { SHIPMENT_STATUSES } from '@infamous-freight/shared';

interface Props {
  shipment: Shipment;
}

export function ShipmentCard({ shipment }: Props) {
  const isDelivered = shipment.status === SHIPMENT_STATUSES.DELIVERED;
  // ...
}
```

## 📦 Build & Deploy

### Production Build

```bash
pnpm build
```

Outputs to `.next/` directory.

### Deployment

- **Vercel**: Automatic deployment on push (recommended)
- **Docker**: Use provided Dockerfile
- **Static Export**: Not supported (uses SSR features)

### Docker Deployment

```bash
docker build -t infamous-freight-web .
docker run -p 3000:3000 infamous-freight-web
```

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes with proper types
3. Ensure no type errors: `pnpm typecheck`
4. Ensure linting passes: `pnpm lint`
5. Test locally: `pnpm dev`
6. Create a PR with conventional commit messages

## 🔍 Common Issues

### "Cannot find module '@infamous-freight/shared'"

Build the shared package first:

```bash
cd ../packages/shared && pnpm build
```

### Port 3000 already in use

Change port in package.json or set PORT environment variable:

```bash
PORT=3001 pnpm dev
```

### Type errors after shared package update

Restart TypeScript server in your IDE or run:

```bash
pnpm typecheck
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 📄 License

Proprietary - Copyright © 2025 Infæmous Freight. All Rights Reserved.
