# Project & Task Management System - Frontend

Modern React frontend built with TypeScript, TailwindCSS, and TanStack Query.

## Tech Stack

- **Framework:** React 18.2
- **Language:** TypeScript 5.3
- **Build Tool:** Vite 5.0
- **Styling:** TailwindCSS 3.4
- **State Management:** TanStack Query 5.17
- **Routing:** React Router 6.21
- **HTTP Client:** Fetch API

## Features

- ✅ Modern React with hooks and functional components
- ✅ TypeScript strict mode throughout
- ✅ Custom blue eclipse color theme
- ✅ Responsive design (desktop & tablet)
- ✅ Optimistic UI updates for instant feedback
- ✅ Smart caching with React Query
- ✅ JWT authentication with localStorage
- ✅ Inline editing for projects and tasks
- ✅ One-click export with auto-download
- ✅ Loading states and error handling

## Prerequisites

- Node.js 18+ installed
- Backend API running on port 5000

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

The default configuration connects to backend at `http://localhost:5000/api`

If your backend runs on a different URL, update `VITE_API_BASE_URL` in `.env`

### 3. Start Development Server

```bash
npm run dev
```

Frontend will start at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Production files will be in `dist/` directory

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── pages/               # Page components
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   └── ProjectDetailPage.tsx
│   ├── services/            # API client
│   │   └── api.ts
│   ├── App.tsx              # Router configuration
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles
├── public/
├── index.html
├── package.json
├── tailwind.config.js       # Custom theme
├── vite.config.ts           # Build optimization
└── tsconfig.json
```

## Key Features Explained

### Authentication
- JWT tokens stored in localStorage
- Automatic redirect to login if not authenticated
- Token included in all API requests via Authorization header

### Dashboard
- Grid layout of all user's projects
- Inline edit/delete functionality
- Create new projects with modal form
- Shows task count per project

### Project Detail Page
- Complete task management
- Status filter (All/To Do/In Progress/Done)
- Inline task editing
- Drag-and-drop status updates via dropdown
- Priority indicators (colored dots)
- One-click export with auto-download

### Optimistic Updates
- Instant UI updates on task status change
- Automatic rollback if API fails
- Reduces perceived latency

### Caching Strategy
- Projects list: 30s stale time, 5min cache
- Project details: 20s stale time, 3min cache
- Automatic cache invalidation on mutations

## UI/UX Features

### Color Theme
Custom "Blue Eclipse" theme:
- Primary: Shades of blue (#4da3ff to #004280)
- Background: Dark blue gradient
- Consistent color palette throughout

### Loading States
- Skeleton loaders for content
- Spinners for actions
- Disabled buttons during operations

### Error Handling
- User-friendly error messages
- Toast notifications
- Retry mechanisms

### Responsive Design
- Works on desktop (1920px+)
- Tablet support (768px+)
- Mobile-friendly layout

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run tsc

# Lint code
npm run lint
```

## Available Routes

- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Projects dashboard (protected)
- `/projects/:id` - Project detail page (protected)

## API Integration

The frontend communicates with backend API at `http://localhost:5000/api`

### API Endpoints Used
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /projects/:id` - Project details
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /projects/:id/export` - Trigger export
- `GET /exports/:id` - Check export status
- `GET /exports/:id/download` - Download file

## Performance Optimizations

1. **Code Splitting:** Vendor chunks for React and React Query
2. **Build Optimization:** ESBuild minification
3. **Smart Caching:** React Query with stale-while-revalidate
4. **Optimistic Updates:** Instant UI feedback
5. **Lazy Loading:** Route-based code splitting (if added)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Troubleshooting

### "Network Error" on Login
- Ensure backend is running on port 5000
- Check CORS configuration in backend
- Verify VITE_API_BASE_URL in .env

### White Screen on Load
- Check browser console for errors
- Clear localStorage and refresh
- Verify all dependencies installed

### Export Not Downloading
- Check browser download settings
- Verify popup blocker is disabled
- Ensure backend export worker is running

## Production Deployment

### Vite Build
```bash
npm run build
```

### Deploy to Static Hosting
- Upload `dist/` folder to:
  - Vercel
  - Netlify
  - GitHub Pages
  - AWS S3 + CloudFront
  - Any static host

### Environment Variables
Set `VITE_API_BASE_URL` to production backend URL

### Nginx Configuration Example
```nginx
server {
  listen 80;
  server_name your-domain.com;
  root /path/to/dist;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Testing Locally

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open browser: `http://localhost:5173`
4. Register account and test features

## Known Limitations

- No real-time updates (refresh to see changes from other users)
- Basic validation (client-side only)
- No image upload support
- Export format limited to JSON

## Future Enhancements

- WebSocket support for real-time updates
- Drag-and-drop task reordering
- File attachments for tasks
- Comments/activity feed
- Email notifications
- Calendar view for tasks
- Multiple export formats (CSV, PDF)

## License

MIT

## Contact

For questions or issues, contact the development team.
