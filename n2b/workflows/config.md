<purpose>

Show or change the pipeline settings in `.n2b/config.json` after Stage 1 has written them. This is the "anytime" companion to `/n2b:status`: it owns every field `config-schema.md` registers as writable after intake — `model_profile`, `model_provider`, `model_tiers`, `spec_review`, `design_system_source` — and it is the only way to change them without re-running Stage 1.

It is programmatic, not judged: flags are parsed and validated, the config is rewritten by the `n2b-model-materializer` script that Stage 1 Step 6.5 also uses, the `n2b-agent-sync` script then pushes the result into the native agent files on runtimes that route that way (OpenCode), and the result is printed back. The interactive path (no flags) asks exactly the questions Stage 1 Step 6.5 asks, runtime-aware, plus the two Stage 1 writes silently (spec review, design system). It never writes a tracking file and never re-runs any stage.

</purpose>

<required_reading>

Before starting, read these files:

- `.n2b/config.json` — the current settings (may be a legacy five-field file from before `model_provider`/`model_tiers` existed — the materializer upgrades it)
- `n2b/references/config-schema.md` — field owner: allowed values, defaults, readers
- `n2b/references/model-profiles.md` — the `n2b-model-materializer`, `n2b-model-resolver`, and `n2b-agent-sync` blocks (run verbatim), the Transport Rules, the runtime stamp
- `n2b/references/model-catalog.json` — providers, tiers, `runtimes.<id>.knownProviders` (data behind the questions)
- `n2b/references/ui-brand.md` — banner format

</required_reading>

<!-- Anti-patterns:
     - Do NOT hand-edit .n2b/config.json — every write goes through the materializer block
     - Do NOT hand-edit .claude/agents/n2b-*.md — the agent-sync block owns their `model:` line and nothing else in them is n2b state
     - Do NOT touch .n2b/tracking/ — this command changes settings, not pipeline state
     - Do NOT re-ask what a flag already answered — flags are authoritative; ask only on a bare invocation
     - Do NOT pick a default when the user cancels the interactive path — print the current config and stop
     - Do NOT write `inherit`, `(omit)`, or an empty string into a model_tiers entry — the materializer refuses it; a tier is a model ID or null -->

<process>

## Step 0 — Preconditions and argument parse

```bash
[ -f .n2b/config.json ] && echo "CONFIG: present" || echo "CONFIG: missing"
```

If missing: display

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No pipeline settings yet — Stage 1 writes them.
Run /n2b:s1-init first.
```

and stop. Nothing is written.

Parse the command argument into flags. Accepted, in any order and combination:

| Flag | Value | Validation |
|---|---|---|
| `--show` | — | — |
| `--profile` | `quality` \| `balanced` \| `budget` \| `inherit` | must be in the catalog's `profiles` |
| `--provider` | a key of the catalog's `providers`, or `inherit` | — |
| `--set` | `<tier>=<model-id>` (repeatable) | tier ∈ catalog `tiers`; id non-empty. Implies `--provider generic` unless `--provider` was also given (then it must be `generic`) |
| `--spec-review` | `independent` \| `self-only` | — |
| `--design-system` | `none` \| `user` | — |

Anything else → display the `UNKNOWN FLAG` line `Unknown option: {token}. Usage: /n2b:config [--show] [--profile <p>] [--provider <name>] [--set <tier>=<id>] [--spec-review <v>] [--design-system <v>]` and stop without writing.

Set `MODE`:
- no tokens at all → `interactive`
- only `--show` → `show`
- any setting flag (with or without `--show`) → `set`

## Step 1 — Show (MODE `show`, and the final step of every other mode)

Display the CONFIG banner, then run the **`n2b-model-resolver`** block from `model-profiles.md` verbatim:

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

Render, from the current `.n2b/config.json` and the resolver output:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
n2b > CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Runtime:        {RUNTIME}  (transport: {TRANSPORT})
Model profile:  {model_profile}
Provider:       {model_provider}
Tiers:          frontier {model or —} · heavy {model or —} · standard {model or —} · light {model or —}
                {append "· effort {reasoning_effort}" after a tier when the entry has one}
Spec review:    {spec_review}
Design system:  {design_system_source}
Configured:     {created} · n2b {n2b_version}

Per-agent models right now ({model_profile}):
  {one line per resolver role line, aligned: "  synthesizer                 opus"  — print "(session model)" for (omit); append " · effort {value}" when reasoning_effort is not (omit)}

{If the resolver printed MODEL_PROVIDER=inherit or every role is (omit): "Every agent runs on the host's session model."}
{If model_tiers was absent from the file (legacy config): "⚠ Legacy config (pre-0.3) — shown values are the runtime defaults. Any change below rewrites it into the current shape."}
{If RUNTIME is opencode: "ℹ OpenCode runs each agent on the `model:` line of .claude/agents/n2b-<role>.md, kept in sync by this command (reinstalling n2b keeps those lines)."}

Change with: /n2b:config --profile <p> · --provider <name> · --set <tier>=<id> · --spec-review <v> · --design-system <v>
```

In MODE `show`, stop here. Nothing is written.

## Step 2 — Interactive (MODE `interactive`)

Determine the runtime from the `n2b-runtime` stamp at the top of `model-profiles.md` (the resolver prints it as `RUNTIME=`). Then ask exactly what Stage 1 Step 6.5 asks for that runtime, with the current values marked "(current)" in the option labels:

- **`claude`:** Q1 Models — "Balanced — smart planning, fast execution", "Quality — best models everywhere, higher cost", "Budget — fastest and cheapest", plus "Inherit — use my session model for every agent". `PROVIDER` = `claude-aliases` (or `inherit` for Inherit).
- **`codex` / `opencode`:** show the runtime notice from Stage 1 Step 6.5, then Q1 Models (Inherit / Balanced / Quality / Budget), then — unless Inherit — Q2 Provider from the catalog's `runtimes.<id>.knownProviders` plus "Custom model IDs"; Custom asks for the `heavy`, `standard`, `light` IDs (required) and `frontier` (optional) → `TIER_ARGS`.
- **`cursor`:** display `Cursor runs every n2b agent on its configured model — the model profile is fixed to inherit here.` and skip to Q3.

Then, on every runtime:

- **Q3 — Spec review.** AskUserQuestion, header "Spec review", question "How should Stage 3 review each feature spec?", options "Independent — a separate reviewer agent checks every spec (Recommended)" / "Self-only — rely on the producer's own self-review (cheaper)". Maps to `spec_review`.
- **Q4 — Design system.** AskUserQuestion, header "Design system", question "Are you supplying your own design system in .n2b/inputs/design-system/?", options "None — ship the package design-agnostic" / "User — carry my files in .n2b/inputs/design-system/ into the package verbatim". Maps to `design_system_source`. If the answer is User and the directory is empty or missing, warn `⚠ .n2b/inputs/design-system/ is empty — add your files before running /n2b:s3-specify` but still record the answer.

If the user cancels at any question: display `No changes made.` followed by the Step 1 show block, and stop. Do **not** write defaults — unlike Stage 1, there is nothing that must exist after this command.

Collect the answers as the same key=value arguments the flags would have produced, then continue to Step 3.

## Step 3 — Materialize (MODE `set`, and after Step 2)

Build the argument list from the flags / answers — only the keys that were given:
- `--profile p` → `model_profile=p`
- `--provider n` → `model_provider=n`
- `--set tier=id` (each) → `tier=id`, and `model_provider=generic` if no `--provider` was given
- `--spec-review v` → `spec_review=v`
- `--design-system v` → `design_system_source=v`

Consistency rules before running (stop with a one-line error, nothing written, when violated):
- `--set` together with `--provider` other than `generic` → `--set requires --provider generic (or omit --provider)`.
- `--profile` other than `inherit` while the effective provider is `inherit` on a runtime whose catalog entry has `offerProviderChoice: true` (codex, opencode) and the file's current provider is also `inherit` → `A routed profile needs a provider on this runtime — add --provider <name> or run /n2b:config with no flags` (on `claude` the materializer defaults to `claude-aliases`; on `cursor` any profile is accepted but tiers stay null and the show block says so).

Run the **`n2b-model-materializer`** block from `model-profiles.md` verbatim, with the argument list in place of `model_profile={PROFILE} model_provider={PROVIDER}` (pass only the keys that were given — the script keeps every other field from the current file):

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

The script prints the written file, or a `CONFIG-ERROR:` line and exits non-zero having written nothing — surface that line verbatim and stop.

Then run the **`n2b-agent-sync`** block from `model-profiles.md` verbatim (a no-op except on OpenCode, where it writes or strips the `model:` line of every `.claude/agents/n2b-<role>.md` from the config just written; surface its summary line, and a `MISSING` line as `⚠ re-run the installer, then /n2b:config`):

```bash
# n2b-agent-sync — write or strip the `model:` line of each native agent file from .n2b/config.json model_tiers (model-profiles.md, Syncing Native Agent Files). No-op unless the runtime's transport is agent-frontmatter. Do not edit here: model-profiles.md owns this block and npm test checks every copy matches.
python3 - <<'PYEOF'
import json, re, os
cat = json.load(open('.claude/n2b/references/model-catalog.json'))
stamp = re.search(r'n2b-runtime: ([a-z-]+)', open('.claude/n2b/references/model-profiles.md').read())
runtime = stamp.group(1) if stamp else 'claude'
transport = cat['runtimes'][runtime]['transport']
if transport != 'agent-frontmatter': print(f"AGENT-SYNC: n/a — {runtime} routes via {transport}, no agent files to update"); raise SystemExit
cfg = {}
try: cfg = json.load(open('.n2b/config.json'))
except Exception: pass
profile = cfg.get('model_profile') if cfg.get('model_profile') in cat['profiles'] else 'inherit'
tiers = cfg.get('model_tiers') if isinstance(cfg.get('model_tiers'), dict) else {}
if profile == 'inherit' or cfg.get('model_provider') == 'inherit': tiers = {}
updated = missing = 0
for role, row in cat['roles'].items():
    tier = None if profile == 'inherit' else row[profile]
    while tier and not (tiers.get(tier) or {}).get('model'):
        tier = cat['fallback'].get(tier)
    model = (tiers.get(tier) or {}).get('model') if tier else None
    path = f'.claude/agents/n2b-{role}.md'
    if not os.path.exists(path): missing += 1; print(f"AGENT-SYNC: {role} MISSING {path} — re-run the n2b installer"); continue
    text = open(path).read()
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m: missing += 1; print(f"AGENT-SYNC: {role} SKIPPED {path} — no frontmatter"); continue
    lines = [l for l in m.group(1).split('\n') if not l.startswith('model:')]
    if model:
        at = next((i for i, l in enumerate(lines) if l.startswith('mode:')), len(lines) - 1) + 1
        lines.insert(at, f'model: {model}')
    new = '---\n' + '\n'.join(lines) + '\n---\n' + text[m.end():]
    if new != text: open(path, 'w').write(new); updated += 1
    print(f"AGENT-SYNC: {role} model={model or '(none — session model)'}")
print(f"AGENT-SYNC: {updated} of {len(cat['roles'])} agent files changed, {missing} missing")
PYEOF
```

Then display `✓ Pipeline settings updated` and the Step 1 show block (re-run the resolver so the per-agent list reflects the new file). Close with the one-line consequence note that applies:
- profile/provider/tier changed → `Takes effect on the next stage command. Stages already completed are not re-run.`
- `spec_review` changed while Stage 3 is in progress → `Applies to the next Stage 3 batch (/n2b:s3-specify --continue).`
- `design_system_source` changed to `user` → `Stage 3 carries .n2b/inputs/design-system/ into the package on its next run.`

</process>

<success_criteria>

- Never writes anything but `.n2b/config.json` (only through the `n2b-model-materializer` block) and, on OpenCode, the `model:` line of `.claude/agents/n2b-*.md` (only through the `n2b-agent-sync` block); never touches `.n2b/tracking/`
- `--show` prints runtime, the seven fields, and the per-agent resolution from the `n2b-model-resolver` block — the same block every stage workflow runs, so what it shows is what the next stage will do
- Flags are authoritative and programmatic: parsed, validated against the catalog, applied without any question; unknown flags and invalid values stop the command with one line and no write
- Bare invocation asks the Stage 1 Step 6.5 questions for this runtime (runtime read from the `n2b-runtime` stamp) plus spec review and design system; cancel = no write
- The written file always has exactly the seven registered fields in schema order, `n2b_version` from the template, `created` preserved; `inherit` is never written into a tier; a legacy five-field config is upgraded in place
- Banner uses exactly 40 `━` characters with `n2b > CONFIG` (ui-brand.md)

</success_criteria>
