# Verification Economics

| claim | risk | error cost | verification cost/time | chosen verification path | defer/verify decision | outcome | residual risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 official flow | high | wrong deployment path wastes contest time | moderate | official docs + repo SOT + counter-search | verify | pending | docs may lag console |
| C2 repo readiness | high | deployment fails after time spent | low | inspect package/Docker/runbook and scripts | verify | pending | Docker daemon may still be local blocker |
| C4 secret strategy | high | key leakage | moderate | official/user organizer notice + runbook policy | verify/flag | pending | console may have changed since notice |
