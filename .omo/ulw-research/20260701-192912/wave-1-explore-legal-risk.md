# Wave 1 Explore: Legal, Data, Eligibility, Submission Risk

## Worker
- Agent: `019f1d3c-45b1-7cc3-9b01-aebd023a5df6`
- Axis: legal/data/submission-risk constraints

## Key Findings
- All local legal/submission-risk language is in `HTML.txt`; `Agentic-Play.txt` is empty.
- Operational risk:
  - Provided contest server may only be used for the contest and can be reclaimed for other use.
  - Final servers must move from temporary registration to review request.
  - Visibility must be changed to public.
  - Submission is one-shot.
- Quality/security risk:
  - Stability includes accurate data and no security issues.
- Legal/IP/data risk:
  - Submitter must be rights holder or have lawful authority.
  - Data and service must not infringe third-party rights.
  - Submitter indemnifies Kakao and bears responsibility if violated.
  - False information cancels registration/winning.
  - 22% tax is winner-borne and required information must be supplied.
  - Event can change or end early.

## Cited Local Evidence
- `HTML.txt:208`: contest-only server use and reclaim risk.
- `HTML.txt:224-228`: temporary registration vs final review request.
- `HTML.txt:242-243`: public visibility required.
- `HTML.txt:254-257`: Player prelim button and one-shot submission.
- `HTML.txt:320`: stability includes accurate data and no security issues.
- `HTML.txt:395`: rights-holder or authorized submission requirement.
- `HTML.txt:396`: data/service third-party rights, indemnity, responsibility.
- `HTML.txt:397`: false-information cancellation.
- `HTML.txt:398`: cash reward, 22% tax, information condition.
- `HTML.txt:399`: event change or early end.

## Pre-submit Risk Checklist
- Rights holder or explicit authorization confirmed.
- All datasets, prompts, assets, and outputs have clear rights.
- No false or misleading submission information.
- Contest server is used only for contest scope.
- Service is `전체 공개` before entry.
- Submission is made exactly once and only after final checks.
- Service is stable, accurate, and has no obvious security problem.
- Winner/tax-processing information can be supplied.
- 22% tax burden is accepted.
- Event change/early termination risk is accepted.
- Temporary registration and final review flow followed correctly.

## EXPAND Verbatim
- LEAD: contest-only server use and reclaim clause — WHY: this is the clearest operational constraint and can invalidate usage if the server is repurposed — ANGLE: inspect `HTML.txt:208`
- LEAD: one-time submission limit — WHY: accidental duplicate submission is irreversible per the page text — ANGLE: inspect `HTML.txt:254-257`
- LEAD: rights-holder authorization requirement — WHY: this is the primary eligibility gate for legal submission — ANGLE: inspect `HTML.txt:395`
- LEAD: third-party rights/data infringement indemnity — WHY: this creates direct liability and is the strongest legal risk statement — ANGLE: inspect `HTML.txt:396`
- LEAD: false-information auto-cancel rule — WHY: any mismatch between the form and reality can invalidate the entry — ANGLE: inspect `HTML.txt:397`
- LEAD: tax and reward-processing condition — WHY: prize eligibility depends on providing requested information and accepting 22% tax burden — ANGLE: inspect `HTML.txt:398`
- LEAD: event change/early 종료 clause — WHY: contest timeline and benefits are not guaranteed to remain fixed — ANGLE: inspect `HTML.txt:399`

## Lead Disposition
- All leads are covered by local page lines; no separate local terms/privacy page found.

