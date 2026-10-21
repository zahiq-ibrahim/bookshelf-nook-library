# The Book Cabinet — frontend

Frontend for the Book Library API: email-OTP signup, login, password reset, and a personal library drawn as a wooden book cabinet.

## Setup
1. `bun install`
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` (default `https://d-r4va.onrender.com`, no trailing slash).
3. `bun run dev`, then open the printed URL.

## Notes
- Two HTTP clients (`src/lib/api.ts`): `/api/v1/*` (sends the Bearer token) and the root client for the public `/library/:userId`.
- The backend must allow CORS for this frontend's origin. If it doesn't, the app shows "Cannot reach server".
- Share links: set the backend `APP_URL` to this frontend's origin, otherwise visitors open the API and see raw JSON.
- The token lives in `localStorage`; logout just deletes it.
