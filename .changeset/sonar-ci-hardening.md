---
---

CI hardening only — no package changes: unit tests + a guarded PG-parity step wired into build.yml (paths filter dropped so the check always reports), a distribution gate ported from bizapps-sales (frozen-seed semantics, both dialects), and a self-test for the CI validator scripts.
