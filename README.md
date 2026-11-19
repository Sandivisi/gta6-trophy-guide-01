# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/sandivisi/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/sandivisi/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide is an offline, open-source guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: one platinum, two gold, six silver and forty-six bronze, each shown with its official name, description and grade, a guide in our own words with its sources, and steps for what to do, where, and when it can be missed. The checklist saves your progress in the browser (localStorage), exports it to a file and imports it back, filters by grade and kind, and has a spoiler setting that hides story trophies until you earn them. A five-stage roadmap leads to the platinum, and the nine trophies that need a specific setup in a single attempt are flagged as missable up front. Everything runs from static files with no network requests, so it works offline and can be hosted anywhere.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser. Or serve `app/` with any static file server. To build the submission output, run `MAKEFUN_OUTPUT_DIR=out node main.ts`, which copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=gnkp9jxa&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
