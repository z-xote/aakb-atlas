# Deploy

Production runs on the AAKB EC2 host in Sydney (`ssh aakb`, user
`ubuntu`). There is no CI deploy. A release is a tag checked out and built
on the server.

## Layout

| What | Where |
|---|---|
| Public URL | `https://atlas-aakb.nicourt.com` |
| Route | Cloudflare tunnel (`cloudflared.service`) to nginx on `127.0.0.1:80`, site `atlas-aakb.nicourt.com`, to Next on port 3000 |
| App folder | `/home/ubuntu/documents/web-service/aakb-atlas`, a git checkout of `origin` |
| Service | `aakb-atlas.service` runs `bun x next start -H localhost -p 3000` |
| Unit override | `/etc/systemd/system/aakb-atlas.service.d/override.conf` |
| Database | `data/atlas.sqlite` in the app folder |
| Settings | `.env` in the app folder, mode 600, never in git |
| Backups | `/home/ubuntu/backups/aakb-atlas/` |
| Logs | `sudo journalctl -u aakb-atlas` |

Next must start with `-H localhost`, not `-H 127.0.0.1`. Clerk's middleware
rewrites to `http://localhost:3000`. When Next is bound by IP it treats
that rewrite as an outside host and proxies the request to itself until it
times out with a 500. `localhost` still resolves to `127.0.0.1` on the
host, so nothing listens publicly.

The other Next server on port 3001 is the AAKB website, not Atlas.

## nginx

cloudflared reaches nginx over plain http, so nginx's `$scheme` is always
`http`. Cloudflare's own `X-Forwarded-Proto` header carries the visitor's
real scheme. The site config uses it to:

- answer `301` to `https://` when that header is `http`. Atlas must run on
  https: `crypto.randomUUID()` only exists on secure pages, and Clerk
  sends users back to the scheme it was given;
- forward `X-Forwarded-Proto https` to Next;
- allow 180 s for `proxy_read_timeout` and `proxy_send_timeout`, because
  image generation runs inside the request. Cloudflare still cuts a
  request at about 100 s.

Requests made on the host without that header, such as `curl` to
`127.0.0.1`, are not redirected. Test a config change with
`sudo nginx -t` before `sudo systemctl reload nginx`.

## Release

Replace `vX.Y.Z` with the tag.

```bash
ssh aakb
cd ~/documents/web-service/aakb-atlas
export PATH=$HOME/.bun/bin:$PATH
B=~/backups/aakb-atlas/pre-vX.Y.Z-$(date -u +%Y%m%dT%H%M%SZ)
mkdir -p "$B" && chmod 700 "$B"
cp -p .env "$B/env" && git rev-parse HEAD > "$B/previous-commit.txt"
git diff > "$B/server-edits.patch"
sudo systemctl stop aakb-atlas
sqlite3 data/atlas.sqlite ".backup $B/atlas.sqlite"
git fetch origin --tags && git checkout vX.Y.Z
bun install --frozen-lockfile
bun run build
sudo systemctl start aakb-atlas
```

Compare `.env` with `.env.example` before starting and add any new names.
`ATLAS_DEV_AUTH_BYPASS` must not be set in production.

The site is down from the stop until the start, about three minutes.
Build after stopping because the build replaces `.next` under the running
server.

## Checks

```bash
curl -sI https://atlas-aakb.nicourt.com/files        # 307 to /sign-in
curl -s -o /dev/null -w '%{http_code}\n' \
  https://atlas-aakb.nicourt.com/api/references      # 401
sudo journalctl -u aakb-atlas -n 50 --no-pager       # no errors
```

Run the CLI against production from the app folder with the server's
admin token:

```bash
set -a; . ./.env; set +a
ATLAS_BASE_URL=https://atlas-aakb.nicourt.com bun src/cli/atlas.ts references list
```

`ensureDatabase()` migrates the schema in memory on first use and writes
it to `data/atlas.sqlite` on the next write. Until someone saves
something, the file on disk can still show the old tables and values.

## Rollback

Use the backup folder from the release.

```bash
ssh aakb
cd ~/documents/web-service/aakb-atlas
export PATH=$HOME/.bun/bin:$PATH
B=~/backups/aakb-atlas/pre-vX.Y.Z-<timestamp>
sudo systemctl stop aakb-atlas
git checkout "$(cat "$B/previous-commit.txt")"
git apply "$B/server-edits.patch"   # only if the patch is not empty
cp -p "$B/env" .env
cp -p "$B/atlas.sqlite" data/atlas.sqlite
bun install --frozen-lockfile
bun run build
sudo systemctl start aakb-atlas
```

Restoring the database loses anything written since the release. Skip
that step only when the release made no schema change the old version
cannot read.

Releases before v0.8.0 started with `-H 127.0.0.1`. Either works for them,
so the unit override can stay during a rollback.
