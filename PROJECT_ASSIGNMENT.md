# 🚀 Bulk Email Sender - SvelteKit Frontend Migration Project

## 📋 Project Overview

This is a **Bulk Email Sender** web application currently built with **Hono** (backend) and vanilla **HTML/CSS/JavaScript** (frontend). Your assignment is to **migrate the frontend to SvelteKit** while maintaining the existing Hono backend functionality.

### Current Tech Stack
- **Backend**: Hono (Bun runtime)
- **Frontend**: Vanilla HTML/CSS/JS with Bootstrap 5, Quill Editor
- **Database**: SQLite (via Bun:sqlite)
- **Authentication**: Argon2 password hashing with session tokens
- **Email**: Nodemailer with SMTP

### Target Tech Stack
- **Backend**: Hono (keep as-is, migrate to Node.js/Deno with npm/pnpm/yarn)
- **Frontend**: **SvelteKit** (modern, enhanced version)
- **Database**: SQLite (maintain existing schema)
- **State Management**: TanStack Query (optional but recommended)
- **Authentication**: Same logic, adapted for SvelteKit

---

## 🎯 Assignment Objectives

### 1. **Understand the Existing System**
Analyze and document:
- ✅ Backend API endpoints and routes
- ✅ Database schema and user management
- ✅ Authentication flow (login, register, sessions)
- ✅ Email sending logic (single, batch, scheduled)
- ✅ SMTP configuration management
- ✅ File upload handling (Excel contacts, HTML templates)
- ✅ Reporting and analytics features

### 2. **Migrate Backend Runtime**
- ⚠️ **Remove Bun dependency** (optional but recommended)
- ✅ Use **Node.js** or **Deno** with **npm**, **pnpm**, or **yarn**
- ✅ Keep all Hono routes and logic intact
- ✅ Replace `bun:sqlite` with a Node-compatible SQLite library (e.g., `better-sqlite3`)
- ✅ Update file serving and middleware for Node.js compatibility

### 3. **Implement SvelteKit Frontend**
- ✅ Create a **modern, clean UI** using SvelteKit
- ✅ Implement all existing features with enhanced UX
- ✅ Use **proper folder structure** (routes, components, stores, utils)
- ✅ Integrate **TanStack Query** for server state management (optional)
- ✅ Add client-side validation and error handling
- ✅ Implement responsive design (mobile-friendly)

### 4. **Remove Old Frontend**
- ✅ Delete `public/` folder (HTML, CSS, JS files)
- ✅ Remove static file serving routes from backend (except API endpoints)
- ✅ Ensure no dependencies on old frontend code

### 5. **Update Documentation**
- ✅ Update `README.md` with new architecture
- ✅ Document setup instructions for both backend and frontend
- ✅ Add API documentation
- ✅ Include screenshots/demos of new UI

---

## 📂 Current Project Structure

```
bulk-email-sender-main/
├── src/
│   ├── app.ts                    # Main Hono app setup
│   ├── types.ts                  # TypeScript interfaces
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts              # Login, register, logout
│   │   ├── config.ts            # SMTP configuration CRUD
│   │   ├── dashboard.ts         # Dashboard polling status
│   │   ├── index.ts             # Main routes
│   │   ├── report.ts            # Email logs and reports
│   │   └── send.ts              # Email sending (single, batch, scheduled)
│   └── services/
│       ├── batchService.ts      # Batch email processing
│       ├── emailService.ts      # Nodemailer integration
│       ├── fileService.ts       # Excel/HTML file parsing
│       ├── logService.ts        # Email log management
│       ├── notificationService.ts # Email notifications
│       ├── providerLimits.ts    # SMTP provider detection
│       ├── schedulerService.ts  # Job scheduling
│       └── userDatabase.ts      # SQLite user management
├── public/                       # ❌ TO BE REMOVED
│   ├── index.html               # Main dashboard
│   ├── login.html               # Login/register page
│   ├── css/style.css            # Styles
│   └── js/app.js                # Frontend logic (2500+ lines)
├── data/                         # SQLite databases
│   ├── users.db                 # Users, sessions, SMTP configs
│   └── scheduler.db             # Scheduled jobs
├── uploads/                      # Uploaded files (Excel, HTML)
├── logs/                         # Email logs (JSON/CSV)
├── package.json
└── tsconfig.json
```

---

## 🔑 Key Features to Implement

### 1. **Authentication System**
- **Login/Register** pages with validation
- **Session management** (HTTP-only cookies)
- **Protected routes** (redirect to login if not authenticated)
- **User profile** display (name, email)
- **Logout** functionality

**API Endpoints:**
- `POST /auth/register` - Create new user
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - End session
- `GET /auth/me` - Get current user info

### 2. **SMTP Configuration Management**
- **List** all user SMTP configurations
- **Add** new SMTP config (Gmail, Outlook, custom)
- **Edit** existing configurations
- **Delete** configurations
- **Set default** configuration
- **Test connection** before saving

**Features:**
- Multiple SMTP accounts per user
- Secure password storage
- Provider-specific help text
- Connection validation

**API Endpoints:**
- `GET /config/smtp` - Get all user configs
- `POST /config/smtp` - Create new config
- `PUT /config/smtp/:id` - Update config
- `DELETE /config/smtp/:id` - Delete config
- `POST /config/smtp/:id/test` - Test connection
- `POST /config/smtp/:id/set-default` - Set as default

### 3. **Email Sending (Main Feature)**
- **Upload Excel** file with contacts (Email, FirstName, LastName, Company, etc.)
- **WYSIWYG HTML editor** (Quill or TipTap for Svelte)
- **HTML template upload** (alternative to editor)
- **Subject line** with variable placeholders
- **Variable replacement** ({{FirstName}}, {{Email}}, {{Company}}, etc.)
- **Preview** email before sending
- **Send immediately** or **schedule** for later
- **Batch processing** with configurable settings
- **Real-time progress tracking**

**Sending Modes:**
1. **Immediate Send** - Send all emails now
2. **Batch Send** - Send in groups with delays
3. **Scheduled Send** - Schedule for specific time

**Batch Settings:**
- Batch size (emails per batch)
- Email delay (seconds between emails)
- Batch delay (minutes between batches)

**API Endpoints:**
- `POST /send` - Send emails (all modes)
- `POST /send/preview` - Preview email
- `GET /send/status` - Get current batch status
- `POST /send/pause` - Pause batch job
- `POST /send/resume` - Resume batch job
- `POST /send/cancel` - Cancel batch job

### 4. **Dashboard & Monitoring**
- **Active batch status** (live updates)
- **Progress bars** (emails sent/failed)
- **Scheduled jobs list**
- **Recent activity timeline**
- **Statistics cards** (total sent, success rate, etc.)
- **Smart polling** (only poll when jobs are active)

**Real-time Features:**
- Countdown timer for next batch
- Current batch progress
- Email sending rate
- Error notifications

**API Endpoints:**
- `GET /dashboard/poll-status` - Check if polling needed
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/scheduled-jobs` - Get scheduled jobs list

### 5. **Reports & Analytics**
- **Email logs table** (searchable, filterable, sortable)
- **Statistics** (total sent, failed, success rate)
- **Export logs** (CSV, JSON)
- **Clear logs** functionality
- **Date range filtering**
- **Status filtering** (Sent, Failed, Error)

**API Endpoints:**
- `GET /report` - Get logs and stats
- `GET /report/export/csv` - Export as CSV
- `GET /report/export/json` - Export as JSON
- `DELETE /report/clear` - Clear all logs

### 6. **Scheduled Jobs Management**
- **List scheduled jobs** (upcoming, running, completed)
- **View job details** (contacts count, schedule time, settings)
- **Cancel scheduled jobs**
- **Email notifications** when job starts/completes
- **Browser notifications** (optional)

**API Endpoints:**
- `GET /schedule/jobs` - Get all scheduled jobs
- `GET /schedule/jobs/:id` - Get job details
- `DELETE /schedule/jobs/:id` - Cancel scheduled job
- `GET /schedule/status` - Get scheduler status

---

## 🗄️ Database Schema

### **users** table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login TEXT,
  is_active INTEGER DEFAULT 1
);
```

### **user_sessions** table
```sql
CREATE TABLE user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### **smtp_configs** table
```sql
CREATE TABLE smtp_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  secure INTEGER DEFAULT 0,
  user TEXT NOT NULL,
  pass TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

### **scheduled_jobs** table
```sql
CREATE TABLE scheduled_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email_job TEXT NOT NULL,  -- JSON string
  batch_config TEXT,         -- JSON string
  scheduled_time TEXT NOT NULL,
  notify_email TEXT,
  notify_browser INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  completed_at TEXT,
  contact_count INTEGER,
  subject TEXT,
  use_batch INTEGER DEFAULT 0,
  config_name TEXT
);
```

---

## 🎨 UI/UX Requirements

### Design Principles
- **Clean and modern** design (avoid cluttered UI)
- **Intuitive navigation** (clear tabs/sections)
- **Responsive layout** (mobile, tablet, desktop)
- **Accessible** (ARIA labels, keyboard navigation)
- **Fast and performant** (lazy loading, optimistic updates)

### Color Scheme (Suggested)
- Primary: `#667eea` (purple-blue gradient)
- Success: `#28a745` (green)
- Danger: `#dc3545` (red)
- Warning: `#ffc107` (yellow)
- Info: `#17a2b8` (cyan)

### UI Components Needed
1. **Navigation** - Sidebar or top nav with active state
2. **Cards** - For statistics, forms, content sections
3. **Tables** - For logs, configs, scheduled jobs
4. **Forms** - Input validation, error messages, loading states
5. **Modals** - For confirmations, previews, details
6. **Toasts/Alerts** - Success/error notifications
7. **Progress Bars** - Batch job progress
8. **Badges** - Status indicators (Running, Paused, Completed)
9. **Buttons** - Primary, secondary, danger actions
10. **Rich Text Editor** - Quill alternative for Svelte (TipTap, ProseMirror)

---

## 🛠️ Suggested SvelteKit Folder Structure

```
frontend/                          # SvelteKit app
├── src/
│   ├── routes/
│   │   ├── (auth)/               # Auth layout group
│   │   │   ├── login/
│   │   │   │   └── +page.svelte
│   │   │   └── register/
│   │   │       └── +page.svelte
│   │   ├── (app)/                # Protected app layout
│   │   │   ├── +layout.svelte   # App shell with nav
│   │   │   ├── +layout.server.ts # Auth check
│   │   │   ├── dashboard/
│   │   │   │   └── +page.svelte
│   │   │   ├── send/
│   │   │   │   └── +page.svelte
│   │   │   ├── reports/
│   │   │   │   └── +page.svelte
│   │   │   ├── config/
│   │   │   │   └── +page.svelte
│   │   │   └── scheduled/
│   │   │       └── +page.svelte
│   │   └── +layout.svelte        # Root layout
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI components
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Card.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Modal.svelte
│   │   │   │   ├── Table.svelte
│   │   │   │   └── Toast.svelte
│   │   │   ├── email/            # Email-specific components
│   │   │   │   ├── EmailEditor.svelte
│   │   │   │   ├── ContactUploader.svelte
│   │   │   │   ├── BatchSettings.svelte
│   │   │   │   └── EmailPreview.svelte
│   │   │   ├── dashboard/
│   │   │   │   ├── StatsCard.svelte
│   │   │   │   ├── ActivityTimeline.svelte
│   │   │   │   └── BatchMonitor.svelte
│   │   │   ├── config/
│   │   │   │   ├── SMTPConfigList.svelte
│   │   │   │   ├── SMTPConfigForm.svelte
│   │   │   │   └── SMTPTestButton.svelte
│   │   │   └── shared/
│   │   │       ├── Navbar.svelte
│   │   │       ├── Sidebar.svelte
│   │   │       └── Footer.svelte
│   │   ├── stores/
│   │   │   ├── auth.ts           # Auth store (user, session)
│   │   │   ├── toast.ts          # Toast notifications
│   │   │   └── theme.ts          # Dark mode (optional)
│   │   ├── api/
│   │   │   ├── client.ts         # API client setup
│   │   │   ├── auth.ts           # Auth API calls
│   │   │   ├── config.ts         # Config API calls
│   │   │   ├── email.ts          # Email API calls
│   │   │   └── reports.ts        # Reports API calls
│   │   ├── utils/
│   │   │   ├── validation.ts     # Form validation
│   │   │   ├── formatters.ts     # Date, number formatters
│   │   │   └── helpers.ts        # Misc helpers
│   │   └── types/
│   │       └── index.ts          # TypeScript types
│   ├── app.html
│   └── app.css                   # Global styles
├── static/
│   ├── favicon.png
│   └── robots.txt
├── package.json
├── svelte.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🔧 Backend Migration Guide

### Current Backend (Bun)
```typescript
import { Hono } from "hono";
import Database from "bun:sqlite"; // ❌ Bun-specific

const db = new Database("./data/users.db");
```

### Migrated Backend (Node.js)
```typescript
import { Hono } from "hono";
import Database from "better-sqlite3"; // ✅ Node-compatible

const db = new Database("./data/users.db");
```

### Key Changes Needed:
1. **Replace `bun:sqlite`** with `better-sqlite3` or `sqlite3`
2. **Update file handling** (use Node.js `fs` instead of Bun APIs)
3. **Change package manager** scripts in `package.json`
4. **Update `multer` middleware** for file uploads (already using it)
5. **Configure CORS** for SvelteKit dev server

### New package.json (Backend)
```json
{
  "name": "bulk-email-sender-backend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "hono": "^3.12.0",
    "@hono/node-server": "^1.12.0",
    "better-sqlite3": "^9.4.0",
    "nodemailer": "^6.9.8",
    "xlsx": "^0.18.5",
    "multer": "^1.4.5-lts.1",
    "csv-stringify": "^6.4.4",
    "dotenv": "^16.3.1",
    "argon2": "^0.31.2"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/nodemailer": "^6.4.14",
    "@types/multer": "^1.4.11",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

---

## 📦 Frontend Setup Guide

### 1. Initialize SvelteKit
```bash
# Using npm
npm create svelte@latest frontend
cd frontend
npm install

# Add dependencies
npm install @tanstack/svelte-query axios
npm install -D tailwindcss postcss autoprefixer
```

### 2. Configure TailwindCSS (or use Bootstrap)
```bash
npx tailwindcss init -p
```

### 3. Install Rich Text Editor
```bash
# Option 1: Svelte-Quill
npm install svelte-quill

# Option 2: TipTap (recommended for Svelte)
npm install @tiptap/core @tiptap/starter-kit @tiptap/extension-placeholder
```

### 4. Configure API Client
```typescript
// src/lib/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = {
  async fetch(endpoint: string, options?: RequestInit) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },
};
```

---

## ✅ Implementation Checklist

### Phase 1: Backend Migration (Week 1)
- [ ] Set up Node.js project with Hono
- [ ] Replace `bun:sqlite` with `better-sqlite3`
- [ ] Update file upload handling
- [ ] Test all API endpoints
- [ ] Configure CORS for frontend dev server
- [ ] Update environment variables

### Phase 2: SvelteKit Setup (Week 1)
- [ ] Initialize SvelteKit project
- [ ] Set up folder structure
- [ ] Configure TailwindCSS/styling
- [ ] Create base layout components
- [ ] Set up API client

### Phase 3: Authentication (Week 2)
- [ ] Login page UI
- [ ] Register page UI
- [ ] Auth store (Svelte store)
- [ ] Protected routes middleware
- [ ] Session handling
- [ ] Logout functionality

### Phase 4: SMTP Configuration (Week 2)
- [ ] Config list page
- [ ] Config form (add/edit)
- [ ] Delete confirmation modal
- [ ] Test connection feature
- [ ] Set default config
- [ ] Provider-specific help UI

### Phase 5: Email Sending (Week 3)
- [ ] Contact uploader component
- [ ] Excel file parsing
- [ ] Rich text editor integration
- [ ] HTML template upload
- [ ] Variable placeholder system
- [ ] Email preview modal
- [ ] Batch settings UI
- [ ] Schedule datetime picker
- [ ] Send form submission
- [ ] Progress tracking UI

### Phase 6: Dashboard (Week 3)
- [ ] Stats cards
- [ ] Active batch monitor
- [ ] Scheduled jobs list
- [ ] Activity timeline
- [ ] Smart polling implementation
- [ ] Real-time updates

### Phase 7: Reports (Week 4)
- [ ] Logs table with sorting/filtering
- [ ] Statistics display
- [ ] Export functionality (CSV, JSON)
- [ ] Clear logs confirmation
- [ ] Date range picker

### Phase 8: Polish & Testing (Week 4)
- [ ] Responsive design fixes
- [ ] Loading states
- [ ] Error handling
- [ ] Form validation
- [ ] Toast notifications
- [ ] Accessibility improvements
- [ ] Performance optimization
- [ ] E2E testing (optional)

### Phase 9: Documentation (Week 4)
- [ ] Update README.md
- [ ] API documentation
- [ ] Setup instructions
- [ ] Environment variables guide
- [ ] Screenshots/GIFs
- [ ] Deployment guide

---

## 🧪 Testing Requirements

### Backend Tests
- [ ] User registration/login
- [ ] SMTP config CRUD
- [ ] Email sending (immediate, batch, scheduled)
- [ ] File upload handling
- [ ] Report generation
- [ ] Session validation

### Frontend Tests
- [ ] Component rendering
- [ ] Form validation
- [ ] API integration
- [ ] Navigation
- [ ] State management
- [ ] Responsive design

---

## 🚀 Deployment Considerations

### Backend Deployment
- **Node.js hosting**: Heroku, Railway, Render, DigitalOcean
- **Environment variables**: Set all `.env` values
- **Database**: SQLite files in persistent storage
- **File uploads**: Ensure `uploads/` directory persists

### Frontend Deployment
- **Static hosting**: Vercel, Netlify, Cloudflare Pages
- **SvelteKit adapter**: Install appropriate adapter
- **API proxy**: Configure backend API URL
- **Environment variables**: `VITE_API_URL`

---

## 📚 Resources

### SvelteKit
- [Official Docs](https://kit.svelte.dev/)
- [SvelteKit Tutorial](https://learn.svelte.dev/)

### TanStack Query
- [Svelte Query Docs](https://tanstack.com/query/latest/docs/svelte/overview)

### Rich Text Editors
- [TipTap](https://tiptap.dev/)
- [ProseMirror](https://prosemirror.net/)

### UI Libraries (Optional)
- [Skeleton UI](https://www.skeleton.dev/)
- [Flowbite Svelte](https://flowbite-svelte.com/)
- [Carbon Components Svelte](https://carbon-components-svelte.onrender.com/)

---

## 🎓 Evaluation Criteria

### Code Quality (30%)
- Clean, readable code
- Proper TypeScript usage
- Component reusability
- Error handling
- Comments and documentation

### Functionality (40%)
- All features working correctly
- Backend API integration
- State management
- Real-time updates
- File uploads

### UI/UX (20%)
- Modern, clean design
- Responsive layout
- Intuitive navigation
- Loading states
- Error messages

### Documentation (10%)
- README updates
- Code comments
- Setup instructions
- API documentation

---

## 📝 Deliverables

1. **SvelteKit Frontend** - Fully functional app
2. **Migrated Backend** - Node.js/Deno with Hono
3. **Updated README.md** - Setup and usage guide
4. **API Documentation** - Endpoint reference
5. **Screenshots/Demo** - Visual proof of work

---

## 💡 Pro Tips

1. **Use TypeScript strictly** - Helps catch errors early
2. **Component first** - Build reusable components
3. **API client abstraction** - Centralize API calls
4. **Form validation** - Use Zod or similar library
5. **Loading states everywhere** - Better UX
6. **Error boundaries** - Graceful error handling
7. **Optimistic updates** - Instant feedback
8. **Debounce searches** - Reduce API calls
9. **Lazy load routes** - Faster initial load
10. **Test on mobile** - Responsive design matters

---

## 🆘 Common Issues & Solutions

### Issue: CORS errors
**Solution**: Configure Hono CORS middleware to allow SvelteKit dev server origin

### Issue: Session cookies not working
**Solution**: Ensure `credentials: 'include'` in fetch calls and `sameSite: 'lax'` in cookies

### Issue: SQLite database locked
**Solution**: Use `better-sqlite3` with proper connection handling

### Issue: File uploads failing
**Solution**: Check `multer` configuration and ensure upload directory exists

### Issue: Real-time updates not working
**Solution**: Implement smart polling with proper intervals (see dashboard example)

---

## 🎯 Success Indicators

✅ **All authentication flows work** (login, register, logout, session)
✅ **SMTP configs can be managed** (add, edit, delete, test)
✅ **Emails send successfully** (immediate, batch, scheduled)
✅ **Progress tracking works** in real-time
✅ **Reports display correctly** with export functionality
✅ **UI is responsive** on mobile, tablet, desktop
✅ **No old frontend code** remains (public/ folder deleted)
✅ **README is updated** with clear instructions
✅ **Backend runs on Node.js** (not Bun)

---

## 📞 Questions?

If you have questions during implementation:
1. Check existing backend code for API behavior
2. Review types.ts for data structures
3. Test API endpoints with Postman/Thunder Client
4. Read SvelteKit docs for routing/forms
5. Use browser DevTools for debugging

---

**Good luck! 🚀 Build something amazing!**
