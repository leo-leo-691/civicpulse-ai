# Responsible AI & Safety Framework

CivicPulse AI enforces robust Responsible AI guardrails designed for public sector deployment:

---

## 1. Digital Divide Bias Mitigation
Demand-weighted priority engines naturally favor affluent, highly connected urban citizens who submit requests frequently. CivicPulse AI incorporates an explicit **Digital-Access Index Correction**:
- Evaluates mobile penetration, literacy rate, and historical submission rates per capita.
- Applies an upward priority boost (+N points) to high-gap regions with low digital access.
- Flags regions as *"Under-Reported — Verify via Offline Channel"*.

---

## 2. Prompt Injection & Astroturfing Defenses
- **Data Boundary:** Citizen free text is treated strictly as unprivileged input to extract from, never as execution instructions.
- **Pydantic Enum Schema Enforcement:** LLM outputs are validated against strict type schemas.
- **Deterministic Priority Engine:** Priority scores are calculated by mathematical formula, preventing injected text from altering priority logic.
- **Duplicate Collapse & Rate Limiting:** Duplicate detection suppresses repeat spam submissions from inflating demand metrics.

---

## 3. Human-In-The-Loop Governance
- AI outputs are strictly decision-support recommendations.
- Final spending decisions require formal human authorization and logged justification.
