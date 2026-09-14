<!-- n2b-runtime: claude -->
# Model Profiles Reference

This document is the model routing reference for n2b's agent pipeline. Workflows @-include it to resolve which model each agent gets when spawned. The data lives in one file — `n2b/references/model-catalog.json` (the **catalog**) — and the user's materialized choice lives in `.n2b/config.json` (`model_profile`, `model_provider`, `model_tiers`; see `config-schema.md`). Everything below is either prose about that data or a script that reads it. The catalog is the source of truth; the table in this file is a rendered projection and `npm test` fails if the two drift.

---

## Profile Definitions

| Profile | Philosophy | Cost | Speed |
|---|---|---|---|
| **quality** | Strongest tiers everywhere — `frontier` on the synthesis-critical roles, `heavy` for the rest. | Highest | Slowest |
| **balanced** | `heavy` for planning/synthesis, `standard` for execution/research. Smart where it matters, fast where it doesn't. | Medium | Medium |
| **budget** | `standard` for producing and researching, `light` only for extraction/verification roles. Minimize cost for exploratory/draft projects without letting a weak model own a load-bearing document. | Lowest | Fastest |
| **inherit** | No routing. Every spawn omits the `model` parameter and the host's configured default model applies. Identical on every runtime — on Claude Code it is *not* an alias for `balanced`. | Host's | Host's |

## Tiers

Tiers are semantic and provider-neutral (renamed 2026-09-13 from the Anthropic family names; those survive only as the values of the `claude-aliases` provider):

| Tier | Meaning | `claude-aliases` | `anthropic` (OpenCode full IDs) | `openai` (Codex) |
|---|---|---|---|---|
| `frontier` | strongest available; synthesis-critical roles on Quality only | `fable` | `anthropic/claude-fable-5` | `gpt-5.6-sol` · effort `xhigh` |
| `heavy` | deep reasoning | `opus` | `anthropic/claude-opus-4-8` | `gpt-5.6-sol` · effort `high` |
| `standard` | producing / researching | `sonnet` | `anthropic/claude-sonnet-5` | `gpt-5.6-terra` · effort `medium` |
| `light` | extraction / verification only | `haiku` | `anthropic/claude-haiku-4-5` | `gpt-5.6-luna` · effort `medium` |

A fifth provider, `generic`, has no preset IDs: the user types their own (OpenRouter, LiteLLM, a local server). Any tier may be left `null`; the resolver walks the catalog's **fallback chain** `frontier → heavy → standard → light` until it finds a tier with a model, and omits `model` when the chain runs out.

**Claude Code aliases are tier aliases, not pinned IDs** (decision 88, 2026-07-25): `fable` / `opus` / `sonnet` / `haiku` resolve to the harness's current model of that tier via the Agent tool's `model` parameter, so the mapping never goes stale. If a resolved alias is unavailable in the user's harness (e.g. `fable` on plans without Mythos-class access), fall back one tier (`fable` → `opus`) and proceed — never fail a spawn over model availability.

---

## Per-Agent Model Mapping (rendered from the catalog)

| Agent Role | Quality | Balanced | Budget |
|---|---|---|---|
| **Visionary** (Stage 2) | heavy | standard | standard |
| **Researcher** (Stage 2) | heavy | standard | standard |
| **Synthesizer** (Stage 2) | frontier | heavy | standard |
| **Requirements Architect** (Stage 3) | frontier | heavy | standard |
| **Feature Analyst** (Stage 3) | heavy | standard | standard |
| **Feature Spec Producer** (Stage 3) | heavy | standard | standard |
| **Spec Quality Reviewer** (Stage 3) | heavy | standard | light |
| **Cross-Reference Reconciler** (Stage 3) | frontier | heavy | standard |
| **Profile Analyst** (Stage 4) | heavy | standard | light |
| **Technical Researcher** (Stage 4) | heavy | standard | standard |
| **Feasibility Planner** (Stage 4) | frontier | heavy | standard |
| **Technical Architect** (Stage 4) | frontier | heavy | standard |
| **Schema Designer** (Stage 4) | heavy | standard | standard |
| **Backlog Builder** (Stage 5) | heavy | standard | standard |
| **Export Formatter** (Stage 5) | heavy | standard | standard |
| **Export Fidelity Checker** (Stage 5) | heavy | standard | standard |

Role keys in the catalog are the kebab-case form of these names (`synthesizer`, `requirements-architect`, `export-formatter`, …); the resolver output below uses those keys. `export-formatter` covers every `stage-5/export-*-formatter.md` contract.

Tier rationale (decision 88, 2026-07-25):
- **`frontier` rows (Quality only):** the five synthesis-critical roles — Synthesizer, Requirements Architect, Cross-Reference Reconciler, Feasibility Planner, Technical Architect — are the "`heavy` even on Balanced" rows: each one integrates everything upstream into a document every later stage depends on. On Quality they get the strongest available tier; where it is unavailable they fall back to `heavy`.
- **No `light` on research or design roles (any profile):** the Stage 2 Researcher and Stage 4 Technical Researcher do live web research whose quality bounds everything downstream, and the Schema Designer produces the real-product database schema — a weak model there fabricates or thins the package's load-bearing documents. Budget keeps them at `standard`. `light` remains only where the job is extraction or verification against existing text: Spec Quality Reviewer (a safety-net check, not a producer), Profile Analyst (extracts a technical profile from finished docs).
- **Stage 5:** rendering is transformation, not invention. Package indexing is a workflow-owned bash step, not an agent — MANIFEST.md is written only by workflows (C-04), so no model row exists for it. The Backlog Builder authors and runs a mechanical extraction script against the canonical files (code work — no `light`, which would risk parse and validation errors on the package's load-bearing structured artifact); it is spawned only for targets whose registry row needs backlog.json. The Export Formatter and Export Fidelity Checker are fidelity-critical — a rendered package must match the canonical documents exactly — so they keep stronger tiers.

---

## Transport Rules (per runtime)

The `n2b-runtime` marker at the top of this file names the runtime this copy was installed for (the installer stamps it). The resolver prints it as `RUNTIME=` and the catalog's `runtimes.<id>.transport` as `TRANSPORT=`. What a workflow does with a resolved model depends only on that:

| Runtime | `TRANSPORT` | What to do with a resolved `model=` / `reasoning_effort=` |
|---|---|---|
| `claude` | `spawn-alias` | Pass `model` as the Agent tool's `model` parameter. Never pass `reasoning_effort`. `(omit)` → leave `model` out. |
| `codex` | `spawn-if-advertised` | **Inspect the visible `spawn_agent` schema first.** Pass `model` only when the schema advertises a `model` field **and** the resolver printed a concrete ID (not `(omit)`); pass `reasoning_effort` only when *that* field is advertised too — decide the two independently. Never pass a Claude alias or any `claude-*` value (the `openai` and `generic` providers are the only ones the catalog offers on Codex). If a spawn is rejected because of the model, **re-spawn once without `model` and `reasoning_effort`** and append `- **Model:** {role} spawned without model — host rejected {id}` to the active STAGE.md `## Deviations`. |
| `opencode` | `agent-frontmatter` | OpenCode's `task` tool has no model parameter: routing happens through `model:` frontmatter on native agent files, which n2b does not ship yet. Until it does, spawn without a model — the materialized `model_tiers` are recorded, shown by `/n2b:status`, and will apply automatically once native agents land. |
| `cursor` | `none` | Never pass a model. Cursor's configured model applies to every agent. |

Two rules hold on every runtime: **`(omit)` means omit** — never pass the literal strings `inherit`, `(omit)`, or an empty value; and **never fail a spawn over model availability** — fall back a tier (Claude) or re-spawn without `model` (Codex), and keep going.

---

## Resolution Logic

```
.n2b/config.json  →  model_profile   ─┐
                     model_tiers     ─┤→ resolver → one line per role: `<role>: model=<id|(omit)> reasoning_effort=<effort|(omit)>`
model-catalog.json → roles, fallback ─┘                → transport rule for RUNTIME → spawn
```

Resolution happens **once per workflow**, before the first spawn, by running the block below verbatim. Every spawn then reads its role's line — the workflow never looks a model up by hand and never hardcodes a model name. `model_tiers` is already materialized, so the only catalog data the resolver needs is `roles` and `fallback`.

```bash
# n2b-model-resolver — resolve every agent role's model once per workflow (model-profiles.md, Resolution Logic). Do not edit here: model-profiles.md owns this block and npm test checks every copy matches.
python3 - <<'PYEOF'
import json, re
cfg = {}
try: cfg = json.load(open('.n2b/config.json'))
except Exception: pass
cat = json.load(open('.claude/n2b/references/model-catalog.json'))
stamp = re.search(r'n2b-runtime: ([a-z-]+)', open('.claude/n2b/references/model-profiles.md').read())
runtime = stamp.group(1) if stamp else 'claude'
profile = cfg.get('model_profile', 'balanced')
if profile not in cat['profiles']: profile = 'balanced'
provider = cfg.get('model_provider')
tiers = cfg.get('model_tiers')
if not isinstance(tiers, dict):  # legacy config: materialize on the fly from the runtime's default provider
    if provider != 'inherit' and provider not in cat['providers']: provider = cat['runtimes'][runtime]['defaultProvider']
    tiers = cat['providers'].get(provider) or {}
if profile == 'inherit' or provider == 'inherit': tiers = {}
print(f"MODEL_PROFILE={profile} MODEL_PROVIDER={provider or 'inherit'} RUNTIME={runtime} TRANSPORT={cat['runtimes'][runtime]['transport']}")
for role, row in cat['roles'].items():
    tier = None if profile == 'inherit' else row[profile]
    while tier and not (tiers.get(tier) or {}).get('model'):
        tier = cat['fallback'].get(tier)
    entry = (tiers.get(tier) or {}) if tier else {}
    print(f"{role}: model={entry.get('model') or '(omit)'} reasoning_effort={entry.get('reasoning_effort') or '(omit)'}")
PYEOF
```


Rules the script encodes (so a reader can audit it):
- Missing `.n2b/config.json` or an unknown `model_profile` → `balanced` (config-schema.md, Missing/Invalid Handling).
- `model_profile: inherit` or `model_provider: inherit` → every role prints `(omit)`.
- A `null` tier walks the catalog's `fallback` chain; when the chain ends without a model the role prints `(omit)`.
- **Legacy config** (no `model_tiers` object — written before 0.3): tiers come from the runtime's `defaultProvider` in the catalog — `claude-aliases` on Claude Code (so existing projects route exactly as before), `inherit` elsewhere (so no alias ever reaches a non-Claude host).

---

## Materializing the Config

Stage 1 Step 6.5 and the `/n2b:config` command both write `.n2b/config.json` with this block — never by hand. Replace `{PROFILE}` / `{PROVIDER}` with the resolved answers; add `spec_review=…`, `design_system_source=…`, or `<tier>=<model id>` pairs (for the `generic` provider) as needed. Any key not passed keeps the current config's value, else the template's default. The script exits non-zero with a `CONFIG-ERROR:` line on an invalid value and writes nothing in that case.

```bash
# n2b-model-materializer — write .n2b/config.json from the catalog (config-schema.md owns the fields). Arguments are key=value pairs; omitted keys keep the current config's value, else the default. Do not edit here: model-profiles.md owns this block and npm test checks every copy matches.
python3 - model_profile={PROFILE} model_provider={PROVIDER} <<'PYEOF'
import json, re, sys, datetime
args = dict(a.split('=', 1) for a in sys.argv[1:])
cat = json.load(open('.claude/n2b/references/model-catalog.json'))
tpl = json.load(open('.claude/n2b/templates/config.json'))
stamp = re.search(r'n2b-runtime: ([a-z-]+)', open('.claude/n2b/references/model-profiles.md').read())
runtime = stamp.group(1) if stamp else 'claude'
try: cfg = json.load(open('.n2b/config.json'))
except Exception: cfg = {}
default_profile = 'balanced' if runtime == 'claude' else 'inherit'
profile = args.get('model_profile') or cfg.get('model_profile') or default_profile
if profile not in cat['profiles']: sys.exit(f"CONFIG-ERROR: model_profile must be one of {cat['profiles']}, got {profile!r}")
provider = args.get('model_provider') or cfg.get('model_provider') or cat['runtimes'][runtime]['defaultProvider']
if profile == 'inherit': provider = 'inherit'
if provider != 'inherit' and provider not in cat['providers']: sys.exit(f"CONFIG-ERROR: model_provider must be one of {list(cat['providers']) + ['inherit']}, got {provider!r}")
old = cfg.get('model_tiers') if isinstance(cfg.get('model_tiers'), dict) else {}
if provider == 'inherit': tiers = {t: None for t in cat['tiers']}
elif provider == 'generic': tiers = {t: (old.get(t) if cfg.get('model_provider') == 'generic' else None) for t in cat['tiers']}
else: tiers = {t: cat['providers'][provider][t] for t in cat['tiers']}
for t in cat['tiers']:
    if t in args: tiers[t] = {'model': args[t]} if args[t] else None
for t, e in tiers.items():
    if e is not None and not (isinstance(e, dict) and isinstance(e.get('model'), str) and e['model']): sys.exit(f"CONFIG-ERROR: model_tiers.{t} must be null or {{\"model\": \"<id>\"}}")
allowed = {'spec_review': ('independent', 'self-only'), 'design_system_source': ('none', 'user')}
out = {'model_profile': profile, 'model_provider': provider, 'model_tiers': tiers}
for k, ok in allowed.items():
    v = args.get(k) or cfg.get(k) or tpl[k]
    if v not in ok: sys.exit(f"CONFIG-ERROR: {k} must be one of {list(ok)}, got {v!r}")
    out[k] = v
out['created'] = cfg.get('created') or datetime.date.today().isoformat()
out['n2b_version'] = tpl['n2b_version']
json.dump(out, open('.n2b/config.json', 'w'), indent=2); open('.n2b/config.json', 'a').write('\n')
print(json.dumps(out, indent=2))
PYEOF
```


What it guarantees:
- Exactly the seven registered fields, in schema order; `n2b_version` copied from the template, never typed; `created` preserved on rewrite.
- `model_provider` is forced to `inherit` when the profile is `inherit`, and `model_tiers` is all-`null` under `inherit`.
- Known providers are materialized from the catalog; `generic` keeps previously typed IDs and applies `<tier>=<id>` arguments (an empty value clears a tier to `null`); `inherit` is never written into a tier.
