# WebTaxi

WebTaxi is a full-stack ride-booking web application with separate rider and captain experiences. Riders can search for locations, receive fare estimates, request a vehicle, track the assigned captain, complete the OTP ride flow, and confirm a manual cash or UPI payment. Captains can share their location, receive matching nearby requests, accept one ride, start it with the rider's OTP, complete it, and confirm payment.

This repository is intended for a small private demo or beta. Payments are manual confirmations and are not connected to a real payment gateway.

## Features

### Rider

- Register, log in, log out, and use protected routes
- Detect the browser's current location
- Search pickup and destination locations
- Calculate route distance, duration, and fares
- Choose Car, Bike, or Auto
- Request a ride and wait for matching nearby captains
- Receive captain acceptance and live location updates
- Share a six-digit OTP to begin the ride
- Follow ride status through completion
- Use the manual cash or UPI payment screen
- Return to a clean booking state after payment
- Restore only a valid active ride after refresh or login

### Captain

- Register a vehicle as Car, Bike, or Auto
- Log in, log out, and use protected routes
- Become active by sharing a valid location
- Receive matching nearby ride requests
- Ignore or accept a request
- Close expired and unavailable requests automatically
- Start only an assigned ride with the correct OTP
- End only an assigned ongoing ride
- Confirm manual cash or UPI payment
- Restore only an assigned active ride after refresh or login

### Dispatch and safety controls

- Socket.IO connections require a valid JWT
- Client-supplied account IDs and account types are not trusted
- Ride offers are sent to connected, active, nearby captains with the requested vehicle type
- Each eligible captain receives one offer
- Ride acceptance uses an atomic database update so only one captain wins
- Ride operations check rider or captain ownership
- Pending dispatch expires after 40 seconds
- Captain location updates are delivered only to the assigned rider

## Technology

| Area | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router, Tailwind CSS |
| Maps | React Leaflet, Leaflet, OpenStreetMap tiles |
| Geocoding | Public Nominatim/OpenStreetMap endpoint |
| Routing | Public OSRM endpoint |
| Animation | GSAP |
| API client | Axios |
| Realtime | Socket.IO and socket.io-client |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas with Mongoose 9 |
| Authentication | JWT, bcrypt, token blacklist |

## Repository structure

```text
WebTaxi/
├── Backend/
│   ├── controllers/
│   ├── DB/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   └── server.js
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/
│   └── vite.config.js
└── README.md
```

## Ride lifecycle

```text
pending → accepted → ongoing → completed → payment confirmed
    └──────────────→ cancelled
```

1. The rider selects valid pickup and destination coordinates.
2. The backend calculates fare from the route distance and duration.
3. The backend creates a pending ride and identifies eligible captains.
4. Every eligible captain receives the same `new-ride` offer once.
5. One captain accepts through an atomic update.
6. The rider receives `ride-accepted` and the other captains receive `ride-unavailable`.
7. The captain starts the ride with the rider's OTP.
8. The captain ends the ride and manually confirms cash or UPI payment.
9. The rider receives `payment-confirmed` and returns to a fresh home screen.

## Requirements

- Node.js `22.18.0` or another Vite-compatible Node 22 release
- npm
- A MongoDB Atlas cluster
- A modern browser with geolocation enabled

## Environment variables

Create local environment files from the included examples. Never commit real credentials.

### Backend

Copy `Backend/.env.example` to `Backend/.env`:

```env
PORT=4000
DB_CONNECT=mongodb+srv://<username>:<password>@<cluster-host>/WebTaxi?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
CLIENT_URL=http://localhost:5173
NOMINATIM_USER_AGENT=WebTaxiBeta/1.0 (<contact-email>)
```

### Frontend

Copy `Frontend/.env.example` to `Frontend/.env`:

```env
VITE_BASE_URL=http://localhost:4000
```

`VITE_BASE_URL` is embedded when Vite builds the frontend. Rebuild the frontend after changing it.

## Local development

Install and start the backend:

```powershell
cd Backend
npm ci
npm start
```

The local backend uses `http://localhost:4000`. Verify it in another terminal:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

Start the frontend:

```powershell
cd Frontend
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Validation commands

```powershell
cd Frontend
npm run lint
npm run build
```

```powershell
cd Backend
Get-ChildItem -Recurse -Filter *.js |
  Where-Object FullName -NotMatch 'node_modules' |
  ForEach-Object { node --check $_.FullName }
```

The backend currently has no automated test suite. Its `npm test` script intentionally reports that no tests are configured.

## HTTP API summary

### Users

- `POST /users/register`
- `POST /users/login`
- `GET /users/profile`
- `GET /users/logout`

### Captains

- `POST /captains/register`
- `POST /captains/login`
- `GET /captains/profile`
- `GET /captains/logout`

### Maps

- `GET /maps/get-coordinates`
- `GET /maps/get-suggestions`
- `GET /maps/get-distance-time`
- `GET /maps/get-address`

### Rides

- `GET /rides/get-fare`
- `POST /rides/create`
- `GET /rides/nearby-captains`
- `POST /rides/accept`
- `POST /rides/reject`
- `POST /rides/cancel`
- `POST /rides/start`
- `POST /rides/end`
- `POST /rides/confirm-payment`
- `GET /rides/current`
- `GET /rides/current-captain`

Protected requests use:

```http
Authorization: Bearer <jwt-token>
```

## Important Socket.IO events

| Event | Direction | Purpose |
| --- | --- | --- |
| `join` | Client → server | Refresh authenticated socket registration |
| `update-location-captain` | Captain → server | Save the authenticated captain's location |
| `new-ride` | Server → captain | Deliver an eligible ride offer |
| `ride-unavailable` | Server → captain | Close an expired or already accepted offer |
| `ride-accepted` | Server → rider | Notify rider of the assigned captain |
| `captain-location` | Server → rider | Send assigned captain location updates |
| `ride-started` | Server → rider | Notify rider that OTP verification succeeded |
| `ride-ended` | Server → rider | Open the rider payment flow |
| `payment-confirmed` | Server → rider | Finish payment and reset the rider UI |

The socket client sends the JWT in the Socket.IO `auth.token` handshake field.

## Deploying on Render

The repository contains a Vite frontend and an Express/Socket.IO backend. Create two Render services from the same GitHub repository:

1. A **Web Service** rooted at `Backend`
2. A **Static Site** rooted at `Frontend`

### 1. Prepare MongoDB Atlas

1. Create or select an Atlas cluster.
2. Create a dedicated database user with access to the `WebTaxi` database.
3. Copy the application connection string and replace its password placeholder.
4. After the Render backend exists, copy its outbound IP ranges from **Connect → Outbound** and add them to the Atlas IP access list.
5. Keep Atlas backups enabled where the selected plan supports them.

### 2. Create the backend Web Service

Use these Render settings:

| Setting | Value |
| --- | --- |
| Repository | `ashwarya-maurya/WebTaxi` |
| Branch | `main` |
| Root Directory | `Backend` |
| Runtime | Node |
| Build Command | `npm ci --omit=dev` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Add these backend environment variables:

```env
NODE_VERSION=22.18.0
DB_CONNECT=mongodb+srv://<username>:<password>@<cluster-host>/WebTaxi?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://<frontend-service>.onrender.com
NOMINATIM_USER_AGENT=WebTaxiBeta/1.0 (<contact-email>)
```

Do not set `PORT` on Render. Render supplies it automatically and the backend already reads `process.env.PORT`.

After deployment, verify:

```text
https://<backend-service>.onrender.com/health
```

Expected response:

```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 3. Create the frontend Static Site

Use these Render settings:

| Setting | Value |
| --- | --- |
| Repository | `ashwarya-maurya/WebTaxi` |
| Branch | `main` |
| Root Directory | `Frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |

Add these frontend environment variables before building:

```env
NODE_VERSION=22.18.0
VITE_BASE_URL=https://<backend-service>.onrender.com
```

Add this Render rewrite so React Router routes work after refresh:

| Source | Destination | Action |
| --- | --- | --- |
| `/*` | `/index.html` | Rewrite |

When the frontend URL is known, set the backend `CLIENT_URL` to that exact HTTPS origin without a trailing slash and redeploy the backend.

## Production verification

Test with one rider and at least two captains in separate browser profiles:

1. Open `/health` and confirm MongoDB is connected.
2. Register or log in as a rider and both captains.
3. Confirm WebSocket connections succeed without CORS errors.
4. Set both captains online near the pickup location.
5. Request a matching vehicle and verify both eligible captains receive it once.
6. Accept simultaneously and verify exactly one captain wins.
7. Verify the losing captain's offer closes.
8. Complete OTP start, captain tracking, ride completion, and payment confirmation.
9. Verify the rider returns to a clean home screen.
10. Refresh and log in again to verify stale completed rides do not return.
11. Test the 40-second no-response timeout and the all-captains-ignore path.
12. Test direct loading of protected frontend routes.
13. Check browser and Render logs for CORS, WebSocket, map-provider, and MongoDB errors.

## Private-beta limitations

- Public Nominatim and OSRM endpoints can be slow, unavailable, or rate-limited.
- Public Nominatim is not intended as a production autocomplete service.
- OpenStreetMap tile usage remains subject to the tile provider's usage policy.
- Cash and UPI payment confirmation is manual; no money is processed by the backend.
- JWTs are stored in browser local storage.
- The backend does not yet include API rate limiting, advanced monitoring, or a global error handler.
- Keep one backend instance because Socket.IO state is process-local.
- Render Free web services spin down after inactivity, which causes cold starts and disconnects active sockets. Use a paid always-on instance for a dependable beta.

## Troubleshooting

### `EADDRINUSE: address already in use :::4000`

Another backend process is already using port 4000. Stop the old process before starting another server.

### CORS or Socket.IO connection failure

- Confirm `CLIENT_URL` exactly matches the deployed frontend origin.
- Confirm `VITE_BASE_URL` exactly matches the deployed backend origin.
- Use HTTPS for both URLs.
- Redeploy the frontend after changing `VITE_BASE_URL`.

### MongoDB connection failure

- Confirm the Atlas database user and password.
- URL-encode special characters in the password.
- Confirm the Render outbound IP ranges are in the Atlas IP access list.
- Confirm the URI selects the `WebTaxi` database.

## License

ISC
