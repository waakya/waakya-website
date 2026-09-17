"""Render the QA matrix (JSON lines written by kit.ts) as docs/PHASE1_FULL_FUNCTIONAL_MATRIX.md.

Usage: python3 matrix-to-md.py <final matrix.jsonl> <pre-fix matrix.jsonl> <commit> <out.md>
The last row recorded for a scenario id wins (a re-run after a fix replaces the first result).
"""
import json
import re
import sys
from collections import OrderedDict

final_path, pre_path, commit, out = sys.argv[1:5]


def load(path):
    rows = OrderedDict()
    try:
        for line in open(path):
            if line.strip():
                row = json.loads(line)
                rows[row["id"]] = row
    except FileNotFoundError:
        pass
    return rows


def key(scenario_id):
    return [int(p) if p.isdigit() else p for p in re.split(r"[.T]", scenario_id) if p]


final = load(final_path)
pre = load(pre_path)
ids = sorted(final.keys(), key=key)


def cell(text):
    return str(text or "").replace("|", "\\|").replace("\n", " ").strip()


totals = {"PASS": 0, "FAIL": 0, "BLOCKED": 0}
for i in ids:
    totals[final[i]["result"]] += 1
pre_totals = {"PASS": 0, "FAIL": 0, "BLOCKED": 0}
for row in pre.values():
    pre_totals[row["result"]] += 1

lines = [
    "# Phase 1 — Full Functional Matrix",
    "",
    f"Production: https://waakya.com · commit `{commit}` · executed with Playwright against the live site, one browser session per person.",
    "",
    "Organization **Sharma Interiors QA** (Priya Sharma · Owner, Arjun Mehta · Manager, Rahul Verma · Team member, Neha Singh · Team member) and a second organization **Rao Builders QA** (Vikram Rao · Owner) for isolation. Every run uses fresh accounts and a fresh organization.",
    "",
    "A scenario passes only when the actor's action, the receiver's view, the reloads and the permission checks all hold. Database reads verify persistence and security; they never replace the receiving user's screen.",
    "",
    "## Summary",
    "",
    "| | Final run | First run (before fixes) |",
    "|---|---|---|",
    f"| Scenarios | {len(ids)} | {len(pre)} |",
    f"| PASS | {totals['PASS']} | {pre_totals['PASS']} |",
    f"| FAIL | {totals['FAIL']} | {pre_totals['FAIL']} |",
    f"| BLOCKED | {totals['BLOCKED']} | {pre_totals['BLOCKED']} |",
    "",
    "## Matrix",
    "",
    "| ID | Scenario | Initiator | Receiver | Expected | Actual | Desktop | Mobile | Persistence | Permission | Result | First run |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
]
for i in ids:
    r = final[i]
    first = pre.get(i, {}).get("result", "—")
    lines.append(
        "| "
        + " | ".join(
            cell(x)
            for x in [
                r["id"],
                f"**{r['area']}** — {r['scenario']}",
                r["initiator"],
                r["receiver"],
                r["expected"],
                r["actual"],
                r["desktop"],
                r["mobile"],
                r["persistence"],
                r["permission"],
                r["result"],
                first,
            ]
        )
        + " |"
    )
open(out, "w").write("\n".join(lines) + "\n")
print(totals, pre_totals)
