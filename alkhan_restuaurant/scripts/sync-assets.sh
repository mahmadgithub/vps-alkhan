#!/usr/bin/env bash
#
# sync-assets.sh — build Frappe/ERPNext/URY static assets in ONE authoritative
# container (backend) and propagate the compiled output to every sibling
# container in the alkhan_restuaurant stack (frontend, queue-*, scheduler,
# websocket), so they never drift out of sync again.
#
# Root cause this fixes: each container in this compose stack carries its
# OWN local copy of /home/frappe/frappe-bench/assets and apps/*/public/*
# (baked at image-build time, not on the shared "sites" volume). If `bench
# build` is ever run inside a single running container (instead of
# rebuilding the image and recreating the whole stack), that container's
# copy diverges from the rest — which is exactly what broke the CSS on
# 2026-09-17. This script re-establishes consistency without requiring a
# full image rebuild.
#
# Usage:
#   ./sync-assets.sh              # runs `bench build` in backend, then syncs
#   ./sync-assets.sh --no-build   # skip the build, just re-sync backend's
#                                 # current assets (useful right after you
#                                 # already ran bench build manually)
#   ./sync-assets.sh --app ury    # only build/sync one app (frappe|erpnext|
#                                 # hrms|ury). Default: all of them.
#
# Safe to re-run. Keeps exactly ONE rolling backup per synced folder per
# container (*.prev), which is overwritten each run — it will not
# accumulate and fill the disk over repeated runs.

set -euo pipefail

SOURCE="alkhan_restuaurant-backend"
TARGETS=(
  alkhan_restuaurant-frontend
  alkhan_restuaurant-queue-short
  alkhan_restuaurant-queue-long
  alkhan_restuaurant-scheduler
  alkhan_restuaurant-websocket
)
BENCH_DIR=/home/frappe/frappe-bench

# Standard Frappe-style apps: build output lives at apps/<app>/<app>/public/dist
STANDARD_APPS=(frappe erpnext hrms)
# The custom "ury" app instead builds several independent Vite sub-apps,
# each into its own apps/ury/ury/public/<subapp> folder (no single "dist").
URY_SUBAPPS=(order ury portal)

ONLY_APP="${URY_ONLY_APP:-}"  # placeholder, overridden by --app below
BUILD=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build) BUILD=0; shift ;;
    --app) ONLY_APP="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

TMP_ROOT=$(mktemp -d)
trap 'rm -rf "$TMP_ROOT"' EXIT

log() { echo "[sync-assets] $*"; }

want_app() {
  [[ -z "$ONLY_APP" || "$ONLY_APP" == "$1" ]]
}

if [[ "$BUILD" == "1" ]]; then
  if [[ -n "$ONLY_APP" ]]; then
    log "Building assets for app '$ONLY_APP' in $SOURCE ..."
    docker exec "$SOURCE" bash -c "cd $BENCH_DIR && bench build --app $ONLY_APP"
  else
    log "Building assets (all apps) in $SOURCE ..."
    docker exec "$SOURCE" bash -c "cd $BENCH_DIR && bench build"
  fi
else
  log "Skipping build (--no-build); using $SOURCE's current assets as-is"
fi

log "Pulling built assets out of $SOURCE ..."
docker cp "$SOURCE:$BENCH_DIR/assets/assets.json" "$TMP_ROOT/assets.json"
docker cp "$SOURCE:$BENCH_DIR/assets/assets-rtl.json" "$TMP_ROOT/assets-rtl.json" 2>/dev/null || true

for app in "${STANDARD_APPS[@]}"; do
  want_app "$app" || continue
  src_dist="$BENCH_DIR/apps/$app/$app/public/dist"
  if docker exec "$SOURCE" test -d "$src_dist"; then
    docker cp "$SOURCE:$src_dist" "$TMP_ROOT/dist-$app"
  else
    log "  (skip $app — no public/dist in $SOURCE)"
  fi
done

if want_app "ury"; then
  for sub in "${URY_SUBAPPS[@]}"; do
    src_dir="$BENCH_DIR/apps/ury/ury/public/$sub"
    if docker exec "$SOURCE" test -d "$src_dir"; then
      docker cp "$SOURCE:$src_dir" "$TMP_ROOT/ury-$sub"
    else
      log "  (skip ury/$sub — not present in $SOURCE)"
    fi
  done
fi

for target in "${TARGETS[@]}"; do
  log "Syncing into $target ..."

  docker cp "$TMP_ROOT/assets.json" "$target:$BENCH_DIR/assets/assets.json"
  if [[ -f "$TMP_ROOT/assets-rtl.json" ]]; then
    docker cp "$TMP_ROOT/assets-rtl.json" "$target:$BENCH_DIR/assets/assets-rtl.json"
  fi

  swap_dir() {
    local host_src="$1" container_dest_dir="$2"
    [[ -d "$host_src" ]] || return 0
    # -u root: some of these containers run as a non-root user by default
    # and can't rm/mv files owned by root inside their own image layer.
    docker exec -u root "$target" bash -c "
      set -e
      rm -rf '$container_dest_dir.new'
      mkdir -p '$container_dest_dir.new'
    "
    docker cp "$host_src/." "$target:$container_dest_dir.new"
    docker exec -u root "$target" bash -c "
      set -e
      if [ -d '$container_dest_dir.prev' ]; then rm -rf '$container_dest_dir.prev'; fi
      if [ -d '$container_dest_dir' ]; then mv '$container_dest_dir' '$container_dest_dir.prev'; fi
      mv '$container_dest_dir.new' '$container_dest_dir'
    "
  }

  for app in "${STANDARD_APPS[@]}"; do
    want_app "$app" || continue
    swap_dir "$TMP_ROOT/dist-$app" "$BENCH_DIR/apps/$app/$app/public/dist"
  done

  if want_app "ury"; then
    for sub in "${URY_SUBAPPS[@]}"; do
      swap_dir "$TMP_ROOT/ury-$sub" "$BENCH_DIR/apps/ury/ury/public/$sub"
    done
  fi
done

log "Done. Sanity check a couple of URLs, e.g.:"
log "  curl -sI http://127.0.0.1:8090/login | head -1"
log "  curl -sI http://127.0.0.1:8090/mosaic | head -1"
