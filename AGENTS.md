# AGENTS.md

This file contains essential information for AI coding agents working on this project.

## Project Overview

**Asthma-Flow** is a modern web application designed for managing asthma clinics. It is built with Next.js 16, React 19, and TypeScript. The project uses the App Router architecture and is styled with Tailwind CSS v4. It leverages shadcn/ui for reusable components and integrates with Google APIs for authentication and data management.

### Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | - |
| Icons | Lucide React | - |
| Package Manager | npm (primary), bun (compatible) | - |
| Testing | Vitest, React Testing Library | - |

### Key Features

- **Next.js App Router**: Modern file-based routing with React Server Components.
- **TypeScript**: Full type safety throughout the codebase.
- **Tailwind CSS v4**: Utility-first CSS with CSS-based configuration.
- **shadcn/ui**: Reusable component system with customizable UI primitives.
- **Google Authentication**: Secure sign-in for staff and patients.
- **Patient Management**: Comprehensive dashboard for tracking patient data.
- **Asthma Action Plans**: Interactive tools for managing patient care plans.
- **Staff Dashboard**: Efficient workflow management for clinic staff.

## Project Structure

```
Asthma-Flow/
├── app/                    # Next.js App Router (main application code)
│   ├── api/               # API routes (e.g., auth, data)
│   ├── staff/             # Staff-specific pages (dashboard, stats)
│   ├── globals.css        # Global styles with Tailwind CSS v4
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # shadcn/ui primitives (e.g., button, modal)
│   └── ...                # Other reusable components
├── lib/                   # Utility functions
│   ├── utils.ts           # `cn()` utility
│   └── ...                # Other helpers (auth, api clients)
├── public/                # Static assets (images, icons)
├── hooks/                 # Custom React hooks
├── tests/                 # Test files (if separate from co-located tests)
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts (npm)
└── .env.local             # Local environment variables (not committed)
```

### Directory Conventions

- **`app/`**: Contains all application pages, layouts, and global styles using Next.js App Router.
- **`components/ui/`**: Contains shadcn/ui primitive components.
- **`lib/`**: Shared utility functions.
- **`public/`**: Static files served from the root URL path.

## Build and Development Commands

```bash
# Development server
npm run dev          # Starts dev server on http://localhost:3000

# Production build
npm run build        # Creates optimized production build

# Start production server
npm start            # Starts production server

# Linting
npm run lint         # Runs ESLint

# Testing
npm test             # Runs Vitest
```

### Package Manager

This project primarily uses **npm** (controlled by `package-lock.json`). You can also use `bun` if preferred, as a `bun.lock` file is present.

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Module resolution: `bundler`

### ESLint

Uses Next.js built-in ESLint config with:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

### Import Conventions

- Use `@/` path alias for imports from project root.
- Example: `import { Button } from "@/components/ui/button"`

### Tailwind CSS v4

- Configuration is in `app/globals.css` using `@theme inline` block.
- No separate `tailwind.config.ts` file.
- CSS variables for theming (light/dark modes).

## shadcn/ui Components

- **Style**: New York (modern, minimal design)
- **Base Color**: Neutral
- **Icon Library**: Lucide

### Adding Components

```bash
npx shadcn@latest add [component-name]
# OR
bunx shadcn@latest add [component-name]
```

## Testing

The project is configured with **Vitest** and **React Testing Library**.

- **Unit Tests**: Run with `npm test`.
- **Configuration**: See `vitest.config.ts`.

## Environment Variables

- Environment files (`.env*`) are gitignored.
- Required variables (example):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

## Deployment

### Vercel (Recommended)

1. Push code to Git repository.
2. Import project in Vercel dashboard.
3. Configure environment variables.
4. Deploy automatically on pushes to main branch.

## Security Considerations

- **Secrets**: Never commit `.env` files.
- **Authentication**: Use NextAuth.js (or similar) for secure sessions.
- **Validation**: Validate all user inputs on server-side (API routes) using Zod.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [React Documentation](https://react.dev)
- [Vitest Documentation](https://vitest.dev/guide/)
