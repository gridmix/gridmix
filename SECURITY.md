# Security Policy

Gridmix is an early-stage, solo-maintained continuation of [Gridsome](https://github.com/gridsome/gridsome). Security reports are welcome and appreciated — the response process below is shaped by the project's current scale.

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.8.x   | ✓         |
| < 0.8   | ✗ — these are upstream Gridsome releases and are no longer maintained |

Until 1.0, only the latest minor receives security fixes.

## Reporting a vulnerability

**Please do not open public issues or pull requests for security bugs.**

Preferred channel: [GitHub Security Advisories](https://github.com/gridmix/gridmix/security/advisories/new) — private, threaded, and supports CVE issuance.

Email fallback: `ping@fyodor.io`

Please include:
- Affected version(s) and environment
- Reproduction steps or a proof-of-concept
- Your assessment of impact

## What to expect

- Acknowledgement within **14 days**
- Initial triage within **28 days**
- Coordinated disclosure: fix and advisory published together; you'll be credited unless you'd rather not be

This is a one-person project, so timelines may slip — if you don't hear back, a polite nudge is fair.

## Out of scope

- Vulnerabilities in user-generated site code produced by Gridmix
- Issues already surfaced by `pnpm audit` against current dependencies
- Social engineering of the maintainer
