# Holidaze

A modern venue booking platform built with React, TypeScript, and Vite. Users can discover and book venues, while venue managers can list their properties, manage bookings, and track occupancy.

## Features

- **Venue Discovery**: Browse and search venues with filtering by amenities and price
- **Booking Management**: Book venues and manage your reservations
- **Venue Management**: Managers can create, edit, and delete venues from their dashboard
- **Booking Tracking**: View all booked times for managed venues (excluding self-bookings)
- **Responsive Design**: Fully responsive UI optimized for desktop and mobile
- **Accessibility**: WCAG 2.1 compliant with semantic HTML, ARIA labels, and keyboard navigation
- **Performance**: Lazy-loaded routes and images, optimized component rendering

## Tech Stack

- **Frontend Framework**: React 19 with React Router v7
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Date Handling**: date-fns
- **Validation**: ESLint, HTML-validate, Lighthouse

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file (or set env vars in your hosting provider) with:

```bash
VITE_BASE_API_URL=https://v2.api.noroff.dev
VITE_API_KEY=your_noroff_api_key
```

Note: `VITE_API_BASE_URL` is also supported as a backward-compatible alias.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Deployment

### Netlify

1. Push your code to GitHub
2. Connect your repository to [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables:
   - `VITE_BASE_API_URL=https://v2.api.noroff.dev`
   - `VITE_API_KEY=your_noroff_api_key`
6. Deploy automatically on push

### GitHub Pages

1. Add to `vite.config.ts`:

   ```ts
   export default defineConfig({
     base: "/Holidaze-PE/",
   });
   ```

2. Run:

   ```bash
   npm run build
   git add dist -f
   git commit -m ""
   git push
   ```

3. Enable GitHub Pages in repository Settings → Pages → Source: Deploy from branch → `main/dist`

## QA & Performance

- Lighthouse Performance: 73
- Accessibility: 100
- Best Practices: 79
- SEO: 100
- Axe Accessibility: 0 violations
