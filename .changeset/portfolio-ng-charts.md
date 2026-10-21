---
"@mj-biz-apps/sonar-ng": patch
---

Portfolio: the Overview, Distribution and History lenses now use MJ's `@memberjunction/ng-charts` (d3-based) instead of ApexCharts, and `apexcharts` / `ng-apexcharts` are no longer dependencies, so hosts no longer need to install them. Chart colors follow the light and dark themes through Sonar's band tokens, and the charts work with the keyboard and screen readers. Hosts need `@memberjunction/ng-charts` (MJ 6.2.0 and later).
