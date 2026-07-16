# Blue Star Teacher Payroll Management System (Node.js + React)

This is a Node.js/Express + React (JSX) rewrite of the original Google Apps
Script app. Same features, same design, same two portals — just running on
a normal web stack instead of a bound Google Sheet:

- **Backend** (`/backend`): Express REST API. Replaces `Code.gs`. Uses a
  JSON file (`backend/src/data/db.json`) as the database instead of a
  Google Sheet — same three collections (`admin`, `teachers`, `payroll`),
  same password hashing scheme, same session-token pattern (now an
  in-memory `Map` instead of `CacheService`, since Node is a long-lived
  process rather than stateless-per-request).
- **Frontend** (`/frontend`): React + Vite. Replaces `Index.html` /
  `Admin.html` / `Teacher.html` / `Styles.html` / `Scripts.html`. Same CSS
  design system (Poppins font, blue theme, cards/tables/modals), same
  screens (login, admin dashboard/teachers/payroll, teacher payslip view),
  now as componentized JSX instead of string-built DOM updates.

## Project layout

```
blue-star-payroll/
├── backend/
│   ├── server.js                # Express app entry point
│   └── src/
│       ├── data/db.json         # "database" (admin/teachers/payroll)
│       ├── lib/
│       │   ├── auth.js          # password hashing + session store
│       │   ├── db.js            # JSON file read/write helper
│       │   ├── payroll.js       # gross/deductions/net math, ID generation
│       │   └── pdf.js           # payslip PDF generation (pdfkit)
│       ├── middleware/requireRole.js
│       └── routes/
│           ├── auth.routes.js
│           ├── admin.routes.js
│           ├── teacher.routes.js
│           └── payslip.routes.js
└── frontend/
    └── src/
        ├── api.js               # fetch() wrapper for the backend API
        ├── App.jsx
        ├── context/
        │   ├── SessionContext.jsx
        │   └── ToastContext.jsx
        ├── components/
        │   ├── TeacherModal.jsx
        │   └── PayrollModal.jsx
        ├── pages/
        │   ├── Login.jsx
        │   ├── AdminPortal.jsx
        │   └── TeacherPortal.jsx
        ├── styles.css
        └── utils.js
```

## Running it locally

You need Node.js 18+ installed.

**1. Backend**

```bash
cd backend
npm install
npm start
```

This starts the API on `http://localhost:4000`. On first run it seeds one
admin account: **username `admin`, password `admin123`** — change this
after your first login (edit `backend/src/data/db.json` and clear the
password field, or add a "change password" endpoint).

**2. Frontend**

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

This starts the React app on `http://localhost:5173` and proxies all
`/api/*` requests to the backend (see `vite.config.js`), so there's no CORS
setup needed in dev.

Open `http://localhost:5173` in your browser — you'll land on the login
page.

**3. Production build**

```bash
cd frontend
npm run build
```

This produces `frontend/dist/`, a static bundle you can serve with any
static file host (or have the Express app serve it directly via
`express.static`, if you prefer a single deployed service).

## Using the app

1. Log in as Admin (`admin` / `admin123`).
2. Go to **Teachers → Add Teacher**, assign an Employee ID and password.
3. Go to **Payroll Records → Create Payroll**, pick the teacher, fill in
   the period/attendance/class tally, earnings, and deductions. Gross
   salary, total deductions, and net pay are calculated automatically.
4. New records start as **Draft** and are invisible to the teacher.
5. Select one or more records and click **Publish Selected** to release
   them — only then can the teacher view or download that payslip.
6. Teachers log in with their Employee ID + password and see only their
   own published payslips, with **Download PDF** / **Print** buttons.

## Security notes

- Passwords are stored as salted SHA-256 hashes (`hashPassword` in
  `backend/src/lib/auth.js`). Any password typed directly into
  `db.json` is auto-upgraded to a hash the first time that account logs
  in successfully.
- Login issues a random session token held server-side in an in-memory
  `Map` (6-hour expiry) and client-side in `sessionStorage` (cleared on
  logout or tab close). Every protected API route re-validates the token
  and role before touching data, and teacher endpoints filter to that
  teacher's own Employee ID server-side — the client never receives
  another teacher's records.
- For a real production deployment: put this behind HTTPS, move the
  session store to Redis (or similar) if you need multiple server
  instances, and swap `db.json` for a real database.

## Customization

- Brand color, radius, and shadows are all CSS variables at the top of
  `frontend/src/styles.css` — change `--primary` to re-theme the whole
  app.
- `backend/src/data/db.json` is the single source of truth; the shape is
  intentionally simple (arrays of plain objects) so it's easy to swap for
  a real database later without touching the route logic — routes only
  ever go through `readDb()` / `writeDb()` in `backend/src/lib/db.js`.
