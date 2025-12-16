# UNON Solutions Sales Website

Marketing and sales page for UNON Solutions USA transportation management SaaS platform.

## Deployment to Coolify

1. Create a new application in Coolify
2. Connect to this repository (or use the `/sales-website` folder)
3. Set the build command: `npm run build`
4. Set the start command: `npm start` (or use Docker)
5. Set the domain to: `unonsolutionsusa.com`

### Docker Deployment

The included Dockerfile creates an optimized production build:

```bash
docker build -t unon-sales .
docker run -p 5000:5000 unon-sales
```

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5001 to view the development version.

## Features

- Hero section with animated background
- Interactive module showcase
- Dynamic pricing calculator
- Comparison table for subscription tiers
- How It Works section
- Customer success stories
- FAQ with expandable accordions
- Contact form with demo booking

## Tech Stack

- Next.js 14 with App Router
- React 18
- Tailwind CSS
- Framer Motion for animations
- Lucide React icons
