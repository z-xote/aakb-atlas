[DOCS]: Write down how Atlas reaches production and how to roll back

# v0.8.1 | Focus: Repository

-------------------------------- ✦ DETAILS ✦ --------------------------------

## TASKS
-----------------------------------------------------------------------------
1. Add docs/deploy.md with the production layout, release steps, checks
   and rollback.

2. Record why the service starts Next with -H localhost.



## DESCRIPTION
-----------------------------------------------------------------------------
Atlas had no deploy docs. Each release meant finding the host, service
and app folder again. v0.8.0 was deployed this way on 26 October 2026.

The page lists the EC2 host, the systemd unit, the nginx and Cloudflare
route, the database and backup folders, and the commands for a release
and a rollback. It holds no secrets.

It also records a v0.8.0 deploy finding. With Next bound to 127.0.0.1,
Clerk's middleware rewrite to localhost made Next proxy each request to
itself until it timed out with a 500. The server now starts Next with
-H localhost through a unit override.



## TECHNICAL NOTES
-----------------------------------------------------------------------------
- New file: docs/deploy.md. No code changes.

- Server override, outside git:
  /etc/systemd/system/aakb-atlas.service.d/override.conf.

- The public URL is https://atlas-aakb.nicourt.com.
  atlas.allaboutkitchens.nz does not resolve in DNS.

- The rollback steps were not run. UNVERIFIED.


-----------------------------------------------------------------------------

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
