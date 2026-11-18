# URY Restaurant Portal Suite — source code

> **⚠️ SUPERSEDED (2026-09-17):** This app has been migrated into the
> Frappe `ury` app, matching the `pos`/`mosaic` convention. The live,
> canonical source is now `apps/ury/portal` inside the
> `alkhan_restuaurant-backend` container, served at
> **http://194.60.87.92:8090/portal** with real Frappe session login and
> roles (no more hardcoded API token). This folder is kept only as
> historical reference for how the app looked before the migration.
> The old standalone deployment at http://194.60.87.92:8091 (nginx +
> `/opt/ury-suite`) is still running in parallel for now — see the team
> for the plan on when to retire it.

This was the source for the standalone React/Vite app that used to be
deployed at **http://194.60.87.92:8091** (title: "Restaurant Portal Suite").

It is a separate project from the Frappe custom app `ury` (which lives inside
the `alkhan_restuaurant-backend` container at `apps/ury` and serves `/pos`,
`/mosaic`, etc. on port 8090). This app talks to the same Frappe backend over
its REST/RPC API (see `src/api/client.js`), but is its own independent
frontend covering Admin, POS, Waiter, Kitchen (KDS), Rider, and Customer
views (`src/components/*`).

## Where this lives

A copy of this source is kept on the VPS at `/opt/ury-suite-source`, kept
deliberately **outside** `/opt/ury-suite` (the public nginx webroot served on
port 8091) — anything placed inside `/opt/ury-suite` is downloadable by
anyone who hits that port, so only the built `dist/` output (`index.html` +
`assets/`) belongs there.

## Layout (on the VPS, under /opt/ury-suite-source)

```
/opt/ury-suite-source/
├── src/                  # React source (components, context, api client)
├── dist/                 # last known-good build output (reference copy)
├── index.html            # dev template (Vite entry point)
├── package.json / package-lock.json
├── vite.config.js / postcss.config.js / tailwind.config.js
```

`node_modules/` is intentionally not copied there — regenerate it with
`npm install` before building.

## How to build & deploy a change

```bash
ssh root@194.60.87.92
cd /opt/ury-suite-source
npm install           # first time only, or after dependency changes
npm run build          # outputs to ./dist (hashed filenames change each build)

# Back up the live site first:
cp /opt/ury-suite/index.html /opt/ury-suite/index.html.backup-$(date +%Y%m%d-%H%M%S)

# Copy the new build's JS/CSS into the live webroot, then swap index.html
# to point at the new hashed filenames (or just copy dist's index.html too):
cp dist/assets/*.js dist/assets/*.css /opt/ury-suite/assets/
cp dist/index.html /opt/ury-suite/index.html
```

Consider periodically cleaning `/opt/ury-suite/assets/` of old, no-longer
referenced hashed bundles — many have accumulated from past ad-hoc deploys.

## History note (2026-09-17)

Before this source was located, `/opt/ury-suite/assets/` had files directly
hand-patched in production with no source control (e.g.
`index-ClnNzF--.css.backup-20260910-*`), which have since been deleted now
that real source control exists here. Always build-and-deploy through this
source folder from now on instead of editing files under `/opt/ury-suite`
directly.

## Recent change (2026-09-17)

Added a voice announcement on the Kitchen (KDS) screen
(`src/components/kitchen/KotDisplay.jsx`) — when a new KOT with
`status: 'NEW'` appears (detected by diffing against the previously-seen
ticket names, since this app polls the backend every 6s rather than using
sockets), the browser speaks "New order, Table X" (or Takeaway/Delivery)
via the Web Speech API. Respects the existing (previously unused)
`soundEnabled` toggle in the KDS header.
