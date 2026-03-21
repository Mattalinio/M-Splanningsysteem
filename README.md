# Driver Planning System (Fresh V1 MVP)

A fresh planning MVP for one manager and drivers.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS (class-based dark mode)
- shadcn-style UI primitives + glass design
- Prisma + SQLite
- NextAuth (Credentials)
- zod validation
- lucide-react icons

## V1 Scope
Included:
- Real login
- Roles: MANAGER / DRIVER
- Driver availability (hours only)
  - per day
  - bulk via mini-calendar multi-select
- Manager planning
  - weekly view + Today button
  - click date -> slide-up add-shifts panel
  - create OPEN shifts only from predefined blocks
- Assignment flow
  - only eligible drivers shown
  - server-side availability coverage checks
  - server-side overlap prevention
- Manager controls
  - unassign shift (confirmation: Ja/Nee)
  - delete OPEN shift (confirmation: Ja/Nee)
- Driver schedule
  - weekly view
  - monthly view (4 weeks max, split by week sections)
  - shift detail bottom sheet on tap
- Account page
  - update name
  - change password
  - theme setting hint + top-right theme toggle
- Theme modes: light / dark / system
  - persisted in localStorage
  - no-flicker init script
- Color tokens centralized
  - `bg-dhl`
  - `bg-dragonfly`

Not included (V2):
- Emails/notifications
- Statistics
- Stops/packages logging
- Notes inbox
- Language switching
- Performance tracking

## Routes
Public:
- `/login`

Driver:
- `/driver`
- `/driver/availability`

Manager:
- `/manager`
- `/manager/open-shifts`

Shared:
- `/account`

## Shift Blocks (locked)
Configured in `src/lib/planning.ts`:
- DHL_OCHTEND (09:00-12:00)
- DHL_MIDDAG (12:00-17:00)
- DHL_AVOND (17:00-22:00)
- DHL_HELEDAG (09:00-18:00)
- DRAGONFLY (12:00-22:00)

Manager cannot create custom-time shifts.

## Color System
Centralized in `src/app/globals.css` tokens:
- DHL: `--dhl: #FFCC00` -> `bg-dhl`
- Dragonfly: `--dragonfly: #00AFA0` -> `bg-dragonfly`

`<ShiftBlock />` handles status + location visuals.

## Setup
```bash
cd "/Users/matsoenema/Project map VS/driver-planning"
npm install
npm run db:generate
npx prisma migrate reset --force
npm run db:seed
npm run dev -- -p 3001
```

Open: `http://localhost:3001`

## Seeded Users (dev)
These are seeded in `prisma/seed.ts` (not shown on login UI):
- Manager: `manager@example.com` / `Password123!`
- Driver: `driver1@example.com` / `Password123!`
- Driver: `driver2@example.com` / `Password123!`
- Driver: `driver3@example.com` / `Password123!`

## Manual Test Checklist
1. Login as manager.
2. Go to `/manager`.
3. Click a date and open add-shifts panel.
4. Select 1+ blocks and save.
5. Verify OPEN shifts appear.
6. Assign an OPEN shift to eligible driver.
7. Confirm assigned shift appears in weekly columns.
8. Unassign assigned shift and confirm dialog text/buttons (`Weet je het zeker?`, `Ja`, `Nee`).
9. Delete OPEN shift and confirm dialog.
10. Login as driver.
11. On `/driver`, verify weekly + monthly (4-week) views and Today button.
12. Tap a shift and verify details bottom sheet.
13. On `/driver/availability`, add per-day hour-only availability.
14. Add bulk availability via mini-calendar multi-select.
15. Verify locked availability cannot be edited/deleted when overlapping assigned shifts.
16. Open `/account`, change name and password.
17. Toggle Light/Dark/System in app shell and confirm persistence.

## Known Limitations
- Bulk mini-calendar is month-by-month (single month view with Prev/Next), not a full-range planner.
- Hour picker uses dropdown fallback (app-like, not native iOS wheel component).
- Error handling currently uses server-action errors; success uses toast query flow.
