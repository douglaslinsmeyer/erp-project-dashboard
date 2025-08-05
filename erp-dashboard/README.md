# ERP Project Dashboard

A real-time dashboard application optimized for TV displays that monitors department project statuses.

## Features

- **TV-Optimized Display**: Designed for 55" TV screens with large, readable fonts and high contrast
- **Real-time Updates**: Auto-refreshes every 30 seconds
- **Responsive Design**: Works on TVs, laptops, and mobile devices
- **Status Tracking**: Visual indicators for On Track, At Risk, and Delayed projects
- **Summary Statistics**: Quick overview cards showing department status distribution

## Tech Stack

- React 18 with TypeScript
- Vite for fast development and building
- Google Apps Script as data source
- CSS3 with responsive design

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd erp-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The production files will be in the `dist` folder.

## Configuration

The dashboard fetches data from a Google Apps Script endpoint. The endpoint URL is configured in `src/App.tsx`.

## License

MIT