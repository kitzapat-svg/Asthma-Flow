# AGENTS.md

This file contains essential information for AI coding agents working on this project.

## Project Overview

**my-app2** is a modern web application built with Next.js 16, React 19, and TypeScript. It uses the App Router architecture and is styled with Tailwind CSS v4. The project is configured with shadcn/ui components system for building reusable UI components.

### Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Components | shadcn/ui | - |
| Icons | Lucide React | - |
| Package Manager | Bun | - |

### Key Features

- **Next.js App Router**: Modern file-based routing with React Server Components
- **TypeScript**: Full type safety throughout the codebase
- **Tailwind CSS v4**: Utility-first CSS with CSS-based configuration (no tailwind.config.js)
- **shadcn/ui**: Reusable component system with customizable UI primitives
- **Geist Font**: Vercel's modern font family via `next/font`
- **Dark Mode Support**: Built-in CSS variables for light/dark themes

## Project Structure

```
my-app2/
├── app/                    # Next.js App Router (main application code)
│   ├── favicon.ico        # App favicon
│   ├── globals.css        # Global styles with Tailwind CSS v4
│   ├── layout.tsx         # Root layout with font configuration
│   └── page.tsx           # Home page component
├── lib/                   # Utility functions
│   └── utils.ts           # `cn()` utility for Tailwind class merging
├── public/                # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── components.json        # shadcn/ui configuration
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
├── eslint.config.mjs      # ESLint configuration
├── postcss.config.mjs     # PostCSS configuration for Tailwind
├── package.json           # Dependencies and scripts
└── .mcp.json              # MCP (Model Context Protocol) configuration
```

### Directory Conventions

- **`app/`** - Contains all application pages, layouts, and global styles using Next.js App Router
- **`lib/`** - Shared utility functions (e.g., `cn()` for class name merging)
- **`public/`** - Static files served from root URL path
- **No `components/` directory yet** - Create at root when adding shadcn/ui components

## Build and Development Commands

```bash
# Development server
bun dev          # Starts dev server on http://localhost:3000

# Production build
bun build        # Creates optimized production build

# Start production server
bun start        # Starts production server

# Linting
bun lint         # Runs ESLint
```

### Package Manager

This project uses **Bun** (evident from `bun.lock`). Use `bun` instead of `npm`/`yarn`/`pnpm`.

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2017
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Module resolution: `bundler`

### ESLint

Uses Next.js built-in ESLint config with:
- `eslint-config-next/core-web-vitals` - Web Vitals rules
- `eslint-config-next/typescript` - TypeScript-specific rules

### Import Conventions

- Use `@/` path alias for imports from project root
- Example: `import { cn } from "@/lib/utils"`

### Tailwind CSS v4

This project uses Tailwind CSS v4 with CSS-based configuration:

- Configuration is in `app/globals.css` using `@theme inline` block
- No separate `tailwind.config.ts` file
- CSS variables for theming (light/dark modes)
- Custom variants with `@custom-variant`

Example of adding new theme values:
```css
@theme inline {
  --color-custom: var(--custom);
}
```

## shadcn/ui Components

The project is configured for shadcn/ui with:

- **Style**: New York (modern, minimal design)
- **Base Color**: Neutral
- **CSS Variables**: Enabled
- **Icon Library**: Lucide

### Adding Components

```bash
bunx shadcn@latest add button
```

### Registry

Custom registry configured for React Bits:
```json
"registries": {
  "@react-bits": "https://reactbits.dev/r/{name}.json"
}
```

### Aliases (from components.json)

| Alias | Path |
|-------|------|
| `@/components` | `components` |
| `@/components/ui` | `components/ui` |
| `@/lib` | `lib` |
| `@/lib/utils` | `lib/utils` |
| `@/hooks` | `hooks` |

## Testing

**No test framework is currently configured.**

To add testing (when needed):
- **Jest** or **Vitest** for unit testing
- **Playwright** or **Cypress** for E2E testing
- **React Testing Library** for component testing

## Environment Variables

- Environment files (`.env*`) are gitignored by default
- Add environment variables to `.env.local` for local development
- Next.js automatically loads `.env.local` in development

## Deployment

### Vercel (Recommended)

1. Push code to Git repository
2. Import project in Vercel dashboard
3. Deploy automatically on pushes to main branch

### Manual Build

```bash
bun build
# Output is in .next/ directory
```

### Static Export (if configured)

Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
};
```

## Security Considerations

- Keep dependencies updated (especially Next.js and React)
- Never commit `.env` files with secrets
- Use environment variables for sensitive configuration
- Enable CSP headers in production via Next.js headers config
- Validate all user inputs on server-side (API routes)

## MCP Integration

The project has MCP (Model Context Protocol) configured:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

This allows AI agents to interact with shadcn/ui registry directly.

## Common Tasks

### Adding a New Page

Create a file in `app/` directory:
```typescript
// app/about/page.tsx
export default function AboutPage() {
  return <h1>About</h1>;
}
```

### Adding a Layout

Create/update `layout.tsx` in route segment:
```typescript
// app/blog/layout.tsx
export default function BlogLayout({ children }) {
  return <div className="blog-layout">{children}</div>;
}
```

### Adding API Routes

Create route handlers in `app/api/`:
```typescript
// app/api/hello/route.ts
export async function GET() {
  return Response.json({ message: 'Hello' });
}
```

### Customizing Theme

Edit CSS variables in `app/globals.css`:
```css
:root {
  --primary: oklch(0.5 0.2 250);  /* Custom primary color */
}
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [React Documentation](https://react.dev)
