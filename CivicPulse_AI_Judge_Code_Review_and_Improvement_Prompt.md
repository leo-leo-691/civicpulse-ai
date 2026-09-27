You are the **Lead Software Architect, Senior AI/ML Engineer, Senior Full-Stack Engineer, Security Reviewer, and Hackathon Judge** for CivicPulse AI.

This is **not** a planning document — it is a direct code audit of the actual repository at `github.com/leo-leo-691/civicpulse-ai` on `main` (commit `02db56e`, post-merge of `feature/ai-data` + `feature/frontend-gis`), read file-by-file. Every finding below cites a real file and line. Nothing here is speculative. Treat this as the punch list to work through before judging — in priority order.

No git actions were taken to produce this document. This is analysis only.

---

# 0. VERDICT

The **architectural discipline is genuinely strong** — better than most hackathon codebases. The team actually built: a deterministic, weighted priority engine with a real digital-divide correction term; a working DBSCAN clustering engine with sparse/dense switching and grid-search evaluation; a grounded-recommendation validator that rejects unsupported numeric claims; a provider-abstraction layer for LLM/embedding/speech; and 28 passing tests covering multilingual extraction, duplicate detection, clustering, and pipeline failure modes. This is real engineering, not a chatbot wrapper.

**But there is a repeated, systemic pattern that will actively hurt you with any judge who reads code or opens dev tools: the codebase claims things in docs, UI copy, and code comments that the actual implementation does not do.** Not once — at least seven separate places. A judge who catches even one of these (and several are catchable in under 60 seconds) will reasonably start doubting everything else you claim, including the parts that are genuinely well-built.

**Priority order for the time you have left:**
1. Fix the fabricated-metrics bug (§1) — this is the single most damaging thing in the repo if discovered.
2. Fix the silent-failure-that-lies-about-success UI pattern (§2) — this is the second most damaging.
3. Either implement or stop claiming: enum validation, rate limiting, PostGIS, pgvector (§3).
4. Wire the orphaned DBSCAN engine and real demographic/infrastructure data into the live request path (§4–5) — this is where "AI depth" and "data integration" actually get judged, and right now both are stubbed.
5. Everything else (§6 onward) is real improvement but lower stakes than the above.

---

# 1. CRITICAL — Fabricated dashboard metrics (fix before anyone else sees this)

**File:** `backend/app/api/v1/endpoints.py`, `get_analytics_overview()`, lines 199–208.

```python
return {
    "total_requests": max(total_reqs, 4821),
    "unique_requests": max(unique_reqs, 1204),
    "duplicate_count": max(dup_reqs, 3617),
    "active_hotspots": max(active_clusters, 14),
    "critical_priority_projects": 3,
    "total_population_impacted": 428000,
    "avg_infra_gap_pct": 58.4,
    "digital_access_corrections_applied": 4
}
```

`total_reqs`, `dup_reqs`, and `active_clusters` are the real counts queried from the database two lines above — and then this code **throws them away** in favor of hardcoded floors, and four of the eight fields (`critical_priority_projects`, `total_population_impacted`, `avg_infra_gap_pct`, `digital_access_corrections_applied`) are never queried at all — they are pure constants.

**Why this is the single worst thing in the repo:** your own project's founding principle, written into the master build prompt this codebase was built from, is *"Every displayed number must originate from actual data/calculations. Do NOT fabricate metrics."* This function does exactly the thing the whole platform exists to prevent. If a judge submits five test requests live during your demo expecting `total_requests` to visibly climb from a small seeded baseline (a very natural thing for a technical judge to try), it will never move, because `4821` always wins the `max()`. If they then open the network tab and see the real count is much smaller than what's displayed, the "no-hallucination, evidence-grounded" pitch collapses on the spot.

**Fix:** return the real queried values, unconditionally. If you're worried the demo will look sparse with a small seeded dataset, the fix is to seed more realistic volume (§9), not to fake the API response.

---

# 2. CRITICAL — UI silently fabricates success on failure (repeated pattern, 5 locations)

Every data-fetching and data-submitting component in the frontend has the same shape: `try { real call } catch { show fake data as if it succeeded, no error indicator }`. Concretely:

| File | Lines | What happens on API failure |
|---|---|---|
| `PolicymakerDashboard.tsx` | 29–42 | Silently swaps in hardcoded KPI numbers, no error banner |
| `PolicymakerDashboard.tsx` | 45–100 | Silently swaps in two fake hotspots with fabricated evidence text |
| `PolicymakerDashboard.tsx` | 112–125 (`handleDecision`) | **Shows "Decision recorded... Audit log updated" even when the POST failed** |
| `CitizenPortal.tsx` | 136–151 (`handleSubmit`) | Fabricates a random `#REQ-XXXXX` and shows "success" |
| `CitizenPortal.tsx` | 163–180 (`handleStatusSearch`) | Returns a canned status for two specific hardcoded ref codes |
| `CitizenPortal.tsx` | 195–199 (`handleWebhookSubmit`) | Returns a canned WhatsApp reply |
| `OpenDataPortal.tsx` | 24–26 | `catch (err) { alert("Open Data Export downloaded successfully."); }` — the failure path **literally announces success** |

**Why this matters more than a normal bug:** the `handleDecision` case (row 3) is not cosmetic — it's a government decision-logging workflow that tells a policymaker their approval was recorded and audited when it may not have been persisted at all. That's the kind of thing that gets flagged hard by anyone with a public-sector-software or security background on a judging panel. The `OpenDataPortal` case is almost self-parodying once you see it: the exact code path that only executes when something went wrong pops an alert saying it worked.

**Fix:** for every one of these, on failure: (a) show a visible, honest error state — a red banner, not a silent swap — and (b) if you want failure-resilient demo behavior for safety, that's a legitimate choice, but it must say so out loud in the UI ("⚠️ Backend unreachable — showing simulated data") rather than being indistinguishable from a real result. Never leave a write-path (`handleDecision`) failing silently into a false-success message under any circumstance — that one should just show the error and let the policymaker retry.

---

# 3. CRITICAL — Claimed defenses that don't exist in code (verified by direct search)

Three separate places in the repo assert specific technical safeguards. I grepped the entire backend for each; none of them exist.

### 3a. "Pydantic Enum Schema Enforcement" — not implemented
`docs/responsible-ai.md` line 17 states: *"Pydantic Enum Schema Enforcement: LLM outputs are validated against strict type schemas."*

Reality — `backend/app/schemas/requests.py` lines 8–11:
```python
category: str = Field(...)
severity: str = Field(default="medium")
urgency: str = Field(default="medium")
```
These are plain `str`, not `Literal["Road Infrastructure", "Water", ...]` or an `Enum`. Nothing stops the LLM (or a crafted prompt-injection payload in citizen free text, since raw text is interpolated unescaped into the prompt at `providers.py` line 59) from returning an arbitrary string that flows straight into the database and the UI.

**Fix (cheap, ~20 minutes):** convert `category`, `subcategory`, `severity`, `urgency` in `ExtractedCitizenRequest`, and `decision` in `DecisionCreate`, to `Literal[...]` types matching the values already documented in the LLM prompt and the model docstrings. Pydantic will then genuinely reject anything outside the allowed set, and the doc's claim becomes true.

### 3b. Rate limiting — configured but never enforced
`config.py` line 25 defines `MAX_SUBMISSIONS_PER_HOUR`. Grep confirms this is the **only place that name appears in the entire codebase** — it's read nowhere. `docs/responsible-ai.md` line 19 claims *"Duplicate Collapse & Rate Limiting"* as an implemented defense. There is no rate limiting.

Same story for the `AbuseFlag` table (`models/domain.py` line 168): it exists in the schema and nowhere else — never inserted into, never queried.

**Fix:** add a lightweight per-`reporter_hash` (or per-IP) counter check in `process_incoming_request` before creating a new row — even an in-memory sliding window or a simple `COUNT(*) WHERE reporter_hash = X AND created_at > now - 1h` against `MAX_SUBMISSIONS_PER_HOUR` closes this gap in under an hour of work, and lets you actually populate `AbuseFlag` rows when the limit is hit, which then gives you a real anomaly-detection story to tell judges instead of a documented-but-fictional one.

### 3c. PostGIS and pgvector — claimed in three places, present in zero
- `docs/data-model.md` line 3: *"Database Engine: PostgreSQL 16 + PostGIS + pgvector"*
- `frontend/src/components/MapView.tsx` line 33: *"GIS Geospatial Hotspot Map — **PostGIS Layer**"* (visible in the live UI)
- `frontend/src/components/PolicymakerDashboard.tsx` line 134: *"**PostGIS** Hotspot Analysis • Digital Divide Correction"* (also visible in the live UI)

Reality: `backend/app/core/database.py` falls back to SQLite for local dev (and this is what's actually running — confirmed by cloning and running the test suite, which uses SQLite). `models/domain.py` uses plain `Float` columns for latitude/longitude, not PostGIS `Geometry`. `embedding_json` is a plain `JSON` column, not a pgvector `Vector` column. `geoalchemy2` and `pgvector` are both listed in `requirements.txt` but grepping the entire backend shows **zero imports of either package anywhere in the codebase.**

**This is the single easiest thing for a technically literate judge to catch**, because the claim is printed directly on the dashboard they're looking at. If they ask "walk me through your PostGIS setup" and the honest answer is "we don't have one," that's a bad moment in front of a panel.

**Fix, pick one:**
- **(Recommended given likely remaining time)** Remove the word "PostGIS" from both UI strings and the docs, replace with what's actually true: "Geospatial lat/long indexing (PostGIS-ready schema)." Same for pgvector — say "JSON-stored embeddings with cosine similarity (pgvector-ready)." This is a 10-minute fix and makes every remaining claim in the app trustworthy by removing the one that isn't.
- **(If you have a spare few hours and a judge who will actually look at your DB)** Stand up a real Postgres instance with the `postgis` and `pgvector` extensions (both are one-line `CREATE EXTENSION` calls), add a `Geometry(Point, 4326)` column and a `Vector(768)` column alongside the existing ones, and switch the duplicate/cluster similarity queries to use pgvector's `<=>` operator instead of the Python loop in §4. This also directly fixes the scalability issue below.

---

# 4. HIGH — The best AI component in the repo is never actually run

`backend/app/ai/clustering.py` (`SemanticClusterEngine.execute_batch_clustering`) is genuinely good work: proper DBSCAN with a sparse/dense execution switch at N>5000, a grid-search hyperparameter evaluator with silhouette scoring, stale-cluster archiving, and idempotent duplicate-of-cluster propagation. It is also thoroughly tested (`test_semantic_clustering.py`, 6 tests).

**It is never called from anywhere except the test suite.** Grep confirms `execute_batch_clustering` and `cluster_engine` appear only in `clustering.py` itself and `test_semantic_clustering.py`. There is no API endpoint, no scheduled job, and no call from `main.py` that ever invokes it. In the live running app, clustering is done entirely by the crude greedy nearest-centroid check inline in `pipeline.py` (lines 176–213, hardcoded similarity threshold `0.78`), which is a much weaker clustering method than the one you actually built and tested.

**Fix:** add `POST /api/v1/admin/reprocess-clusters` that calls `cluster_engine.execute_batch_clustering(db)`, and call it once from `main.py` on startup (after seeding) so the demo dashboard is actually showing DBSCAN output, not the provisional greedy assignment. This is maybe 15 lines of code and turns your most sophisticated, best-tested feature from dead code into something the judges actually see working.

---

# 5. HIGH — Hotspot scoring ignores the real demographic/infrastructure data it claims to fuse

This is the core of the product pitch — *"combines citizen feedback with demographic data, infrastructure indices and public investment plans"* — and it's currently stubbed.

`backend/app/api/v1/endpoints.py`, `get_hotspot_clusters()`, lines 92–103:
```python
p_breakdown = calculate_priority_score(
    ...
    infra_coverage_pct=35.0,
    vulnerability_index=75.0,
    existing_investment_pct=30.0,
    urgency_score=85.0,
    mobile_penetration_pct=48.0 if c.district == "Pune" else 75.0
)
```

Every single cluster in the country gets the **same four hardcoded values**, gated only by a two-way `if district == "Pune"` branch — despite `Demographic` and `Infrastructure` tables existing with exactly these fields (`overall_index`, `vulnerability_index`, `mobile_penetration_rate`, `road_coverage_pct`, etc.) populated with real per-location numbers by the seed script. The priority engine itself (`services/priority.py`) is well-built and correctly implements the digital-divide correction — but it's being fed fake inputs at the call site, so its output can't reflect real regional differences beyond the one hardcoded Pune/other split.

Same pattern for latitude/longitude in both `get_hotspot_clusters` (line 118–119) and `open_data_export` (line 229–230): hardcoded `if district == "Pune"` coordinate pairs instead of reading the real `Location.latitude`/`longitude` that already exists via the cluster's requests' locations.

**Fix:** join `RequestCluster` → its member `CitizenRequest`s → their `Location` → that location's `Demographic`/`Infrastructure` row, and pass the real `overall_index`, `vulnerability_index`, `mobile_penetration_rate`, and real lat/long into `calculate_priority_score`. This is the fix that actually makes "data integration" real rather than asserted — and it's the exact area the master build prompt calls the core differentiator (§7/§16 of the original architecture doc), so it deserves the time.

---

# 6. HIGH — `reporter_contact_hash` uses Python's insecure, unstable `hash()`

`backend/app/api/v1/endpoints.py` line 76: `reporter_contact_hash=str(hash(sender))`.

Python's built-in `hash()` for strings is salted with a random seed **per process** (`PYTHONHASHSEED`) unless explicitly disabled — this is a deliberate security feature (hash-flooding DoS protection), but it means the same phone number will produce a **different** `reporter_contact_hash` every time the server restarts. Any per-sender duplicate detection, rate limiting (once you build §3b), or abuse pattern tracking that depends on this field will silently stop correlating the same citizen across restarts.

**Fix:** `hashlib.sha256(sender.encode()).hexdigest()` — one line, deterministic, and it's the same pattern already used correctly in `pipeline.py`'s `compute_text_hash`.

---

# 7. MEDIUM — The "AI Recommendation Engine" never calls an LLM

`backend/app/services/ai_recommendations.py`: imports `ai_service` (line 4), builds a full LLM prompt (`prompt = f"""..."""`, lines 62–74) — and then never calls it. The actual recommendation text (`intervention_text`, lines 76–79) is a fixed Python f-string template. `prompt` is dead code (unused variable), `ai_service` is a dead import.

This isn't necessarily a design flaw — a fully deterministic, template-based recommendation is arguably *safer* against hallucination than an LLM call, and your `validate_recommendation_evidence` grounding-check (which is well-designed) exists specifically to catch ungrounded LLM output. But right now you have the safety net with nothing under it, and dead code that any linter or code-quality reviewer will flag immediately (`F401 unused import`, `F841 unused variable`).

**Fix:** either (a) actually call `ai_service.llm` with the constructed prompt to generate the intervention sentence, and let your existing validator catch/reject anything ungrounded — this makes the recommendation text read like genuinely AI-authored prose instead of a robotic template, which is a better demo moment, and your safety net already exists to protect it — or (b) if you'd rather stay fully deterministic for the demo, delete the dead `prompt` variable and the unused `ai_service` import, and change the code comment/docs to honestly describe this as "template-based, not LLM-generated" rather than implying otherwise.

---

# 8. MEDIUM — No visibility into REAL vs FALLBACK AI provider status

`providers.py` already tracks whether each call actually hit Gemini/Google Speech (`"REAL"`) or fell back to the heuristic/canned-response path (`"DEVELOPMENT FALLBACK"`) — this is good, honest instrumentation. But it dead-ends: `POST /api/v1/requests`'s response dict (`endpoints.py` lines 25–34) never includes `provider_status`, and no frontend component reads or displays it anywhere.

**Practical risk:** if `GEMINI_API_KEY` is unset or invalid during actual judging (expired trial key, quota exhausted, wrong env var on the judge's demo machine), the entire app keeps working — silently on heuristic keyword-matching and scripted canned transcriptions — with **zero indication to anyone** that "real AI" isn't running. Given the fallback speech transcriber (`providers.py` lines 182–197) returns the *same fixed sentence per language regardless of what was actually said*, a judge who tests the voice feature with their own words, in fallback mode, would get back the canned example sentence and might reasonably conclude the feature doesn't really work — when actually the demo is just quietly degraded.

**Fix:** surface `provider_status` in the `/requests` response and show a small, honest badge in the UI ("🟢 Live Gemini extraction" vs. "🟡 Development fallback active") — this is good practice regardless, and it means you'll know the instant something's wrong during setup, rather than discovering it live in front of judges.

---

# 9. MEDIUM — Seed data volume doesn't match the story it's supposed to tell

`scripts/seed_demo_data.py` creates exactly **4** `CitizenRequest` rows total, with `duplicate_count` fields manually set to small numbers (4, 12, 0, 0) — nowhere near the "4,821 total requests" / "1,204 unique" narrative the dashboard is supposed to demonstrate. That narrative currently only exists because of the hardcoded floor values in §1. Once you fix §1 to show real numbers (which you must), the demo will show "4 requests" unless the seed data actually creates volume.

Similarly, `RequestCluster.unique_request_count`/`total_request_count` are manually hand-set to 837/2480 and 1204/4821 in the seed script rather than being derived from actually counting linked `CitizenRequest` rows — so even the cluster page numbers are typed-in literals, not computed aggregates.

**Fix:** once §1 and §4 are fixed, the seed script needs to generate genuine volume — a loop that creates a few hundred `CitizenRequest` rows per cluster with realistic text variation (can reuse/paraphrase the existing example sentences), so that `unique_request_count` and `total_request_count` are the actual result of running `execute_batch_clustering` over real seeded rows, not hand-typed set dressing. This is the single change that would make every other fix in this document pay off end-to-end.

---

# 10. LOWER PRIORITY — Security & scalability hygiene

These won't sink a demo but are exactly what a "code quality is being checked" judge or any senior engineer reviewer will note in a walkthrough:

- **CORS is misconfigured**: `main.py` sets `allow_origins=["*"]` together with `allow_credentials=True` — this combination is invalid per the CORS spec (browsers reject wildcard origin with credentials) and is a known anti-pattern. Set an explicit origin list from an env var.
- **Hardcoded default secret**: `config.py` line 11 ships a literal fallback `SECRET_KEY` string in source, visible in the public GitHub repo. Even as a "change in production" placeholder, don't commit a real-looking default — use `None` and fail loudly if unset in non-dev environments.
- **No authentication anywhere**: `POST /recommendations/{id}/decision` (a policymaker-only government action) and every other endpoint are completely open. Even a minimal API-key header check for the decision/admin endpoints would close the most obvious gap without needing a full auth system for a hackathon timeline.
- **O(n) full-table scans in the hot path**: `process_incoming_request` in `pipeline.py` calls `db.query(CitizenRequest).all()` (line 112) and recomputes cosine similarity against **every row in the table, in Python, on every single incoming request** — twice (hash loop + similarity loop), plus a third full scan per active cluster for centroid assignment. Fine at demo scale (dozens of rows); flag it explicitly as a known scaling limitation rather than let a judge discover it unprompted — or use the pgvector migration from §3c to make it a real indexed ANN query.
- **Zero logging**: no `import logging` anywhere in the backend; every failure path is `except Exception: pass` (4 confirmed instances). If something breaks during judging, there will be no trace of why. Add even basic `logging.warning()` calls in the provider fallback paths.
- **No pagination** on `/requests`, `/hotspots`, `/recommendations` (`db.query(X).all()` throughout) — not a demo blocker, worth a one-line note in docs as a known limitation.
- **Free-text write validation gaps**: `DecisionCreate.decision` and `RequestCreate.channel`/`language` are unconstrained `str`, so `POST /recommendations/{id}/decision` will happily set a recommendation's status to any arbitrary string, not just the four documented values. Same `Literal[...]` fix as §3a.
- **`messaging_webhook` accepts an untyped `dict`** with no schema validation (`endpoints.py` line 62) — a malformed payload (e.g., `sender` as a non-string) will throw an unhandled `AttributeError` → bare 500, not a clean 4xx.
- **OpenDataPortal's CSV button downloads JSON**: `handleExport('csv')` in `OpenDataPortal.tsx` produces identical JSON content regardless of the `format` argument — the button label promises CSV and never delivers it.
- **`EvidencePanel.tsx` line 40 hardcodes "38%"** in the digital-divide explanation text regardless of which hotspot is actually selected — because the `Hotspot` API type doesn't expose the raw digital-access index number at all (only the derived `digital_access_correction`), this literal can't even be made dynamic without first extending the backend response — flag as a paired frontend+backend fix.
- **`ImpactTracker.tsx` line 129** labels a number "Verified by Jal Jeevan Dashboard" with no actual external data source behind it — same claims-vs-reality issue as §3, just smaller stakes; relabel as "Synthetic demo figure" per your own `docs/dpg-compliance.md`/data-honesty principles.

---

# 11. ADDITIONAL FEATURES AN EXPERIENCED JUDGE WOULD EXPECT (and currently don't exist)

These aren't bugs — they're gaps relative to what a strong Track 1 submission on this exact problem statement should show, given what's already 80% built:

1. **A visible "synthetic data" disclosure banner**, site-wide, per your own `docs/dpg-compliance.md` and the master prompt's Data Honesty section. Right now there's no persistent UI element telling a judge that Pune/Gadchiroli numbers are synthetic demo data rather than real government figures — this is a specific, named requirement in your own architecture doc and it's currently only in docs, not in the product.
2. **An admin/ops view** that actually triggers `execute_batch_clustering` on demand and shows before/after cluster counts — turns your best-tested backend feature (§4) into a visible demo beat: "watch the DBSCAN engine re-cluster live."
3. **A rate-limit/abuse-flag demo moment**: once §3b/§6 are fixed, add a small "Abuse & Anomaly Detection" panel showing flagged submission bursts — you already have the `AbuseFlag` table modeled, it just needs to be used and surfaced.
4. **Error boundaries and honest loading/error states** across the dashboard (directly required by your own architecture doc's UI section: "Useful loading states, empty states, error states" — currently every error state is a silent fake-data swap instead).
5. **Basic auth** on the policymaker decision endpoint — doesn't need to be sophisticated (an API key header check is enough for a hackathon), but "anyone on the internet can approve or reject government budget decisions" is a bad thing to have to explain if asked.
6. **API-level tests for the endpoint layer's failure modes** — the existing 28 tests are strong on the AI/pipeline layer but `test_api_v1.py` is only 33 lines; there's no test coverage proving `get_hotspot_clusters` actually uses real per-location data (which, per §5, it currently doesn't) or that the decision endpoint rejects invalid `decision` values (which, per §3a, it currently doesn't).
7. **A one-page "known limitations" section in the README** — paradoxically, explicitly stating "SQLite for local dev, Postgres+PostGIS+pgvector planned" and "rate limiting configured but not yet enforced" reads as far more credible to a senior judge than silently claiming both are done. Precision about what's finished vs. roadmap is something experienced judges specifically reward; overclaiming is something they specifically penalize once caught.

---

# 12. WHAT'S ALREADY GENUINELY GOOD — don't let panic over the above cause you to rip out working things

To be clear about where the real engineering strength already is, so fixes above don't accidentally regress it:

- `services/priority.py` — the deterministic weighted scoring engine with digital-divide correction is well-written, well-commented, matches the architecture doc's formula exactly, and is properly tested. Leave the math alone; only fix what feeds it (§5).
- `ai/clustering.py` — genuinely sophisticated DBSCAN implementation with sparse/dense switching and grid search. Just needs to be wired in (§4).
- `services/ai_recommendations.py`'s grounding validator (`validate_recommendation_evidence`) — a real, working anti-hallucination check that actually parses numbers out of generated text and cross-checks them against the evidence payload. This is a legitimately impressive, judge-worthy piece of engineering once §7 is resolved.
- The multilingual extraction fallback in `providers.py` — the keyword-based heuristic parser correctly handles English, Hindi, and Marathi keyword variants and is a reasonable, honest fallback (just needs its status surfaced per §8).
- `CitizenPortal.tsx`'s real browser microphone recording (`MediaRecorder` API) — this is genuine, not simulated; the audio really is captured and base64-encoded for submission.
- The overall repo structure, provider-abstraction pattern, and test coverage of the AI layer specifically (multilingual, dedup, clustering, pipeline failures, recommendation grounding) reflect real senior-level engineering discipline that most hackathon teams don't bother with.

---

# 13. SUGGESTED ORDER OF OPERATIONS GIVEN LIMITED TIME

If you only have a few hours left before judging, do these in this order — each is scoped to be independent and low-risk:

1. §1 (fabricated metrics) — 10 min, delete four lines.
2. §3c copy fix (remove false PostGIS/pgvector claims from UI + docs) — 15 min, text-only.
3. §2 (stop lying about success in the UI, especially `handleDecision` and `OpenDataPortal`) — 45 min.
4. §3a (Literal/Enum types on category/severity/urgency/decision) — 20 min, also closes a real prompt-injection gap.
5. §6 (`hash()` → `hashlib.sha256`) — 2 min.
6. §9 (seed script volume) — 45 min, makes §1's honest numbers look good instead of sparse.
7. §5 (wire real demographic/infrastructure data into hotspot scoring) — 1–2 hrs, highest-value remaining item if time allows.
8. §4 (wire the DBSCAN engine into a real endpoint/startup call) — 30 min once §9's real data exists to cluster.
9. Everything else in §10/§11 as time permits, roughly in the order listed.

Steps 1–6 alone (under 3 hours combined) would take this from "will lose points to a careful judge" to "no dishonesty in the codebase" without touching any of the genuinely good engineering underneath.
