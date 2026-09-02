# auth-cookies

Practice app for cookie-based auth: signup/signin, an httpOnly `Authorization` cookie, `/me`, logout, and protected notes.

The Next client (`client/`) talks to Express on port `3001` with `credentials: "include"`. Both backends expose the same routes — only how the cookie is verified changes.

## Two server files (pick one)

**Run only one of these at a time.** They both bind to `3001`.

| Approach | File | What the cookie stores |
| --- | --- | --- |
| JWT (stateless) | `server/src/jwtApproach.ts` | signed JWT (`user id`); verified with `SECRET` |
| Session (stateful) | `server/src/sessionApproach.ts` | session UUID; looked up in Postgres on each request |

```bash
# client
cd client && npm install && npm run dev   # http://localhost:3000

# server — JWT
cd server && npx tsx src/jwtApproach.ts

# server — sessions
cd server && npx tsx src/sessionApproach.ts
```

Needs Postgres. In `server/.env`: `DATABASE_URL` and `SECRET`. In `client/.env`: `NEXT_PUBLIC_API_URL=http://localhost:3001` (optional; that is the default).
