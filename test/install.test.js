#!/usr/bin/env node
'use strict';

/**
 * Installer tests — zero dependencies, plain Node (assert + child_process).
 *
 *   node test/install.test.js                    run everything
 *   node test/install.test.js --update-baseline  regenerate test/fixtures/claude-baseline.json
 *                                                (only after an intentional source change)
 *
 * Pure functions are tested directly; integration tests install into a
 * scratch directory under the OS tmpdir.
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const BIN = path.join(REPO, 'bin', 'install.js');
const BASELINE = path.join(__dirname, 'fixtures', 'claude-baseline.json');
const installer = require(BIN);
const {
  RUNTIMES, RUNTIME_ORDER, parseArgs, buildRuntimePromptText, parseRuntimeInput,
  rewritePaths, rewriteIncludes, rewriteNamespace, rewriteToolNames, stampRuntime,
  rewriteContent, INCLUDE_LIST_INTRO, splitFrontmatter, frontmatterField, frontmatterList,
  convertCommand, commandDestPath, readSource, buildInstallMap,
} = installer;

// ─── helpers ─────────────────────────────────────────────────────────────────

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'n2b-install-test-'));
}

/** { relPath → sha256 } for every file under root (sorted, '/'-separated). */
function hashTree(root) {
  const out = {};
  for (const rel of installer.collectFiles(root)) {
    out[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, rel))).digest('hex');
  }
  return out;
}

function runInstaller(args, options = {}) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', stdio: 'pipe', ...options });
}

function installOk(args) {
  const result = runInstaller(args);
  assert.strictEqual(result.status, 0, `installer failed: ${result.stderr}${result.stdout}`);
  return result;
}

function fileList(root) {
  return installer.collectFiles(root);
}

// ─── --update-baseline ───────────────────────────────────────────────────────

if (process.argv.includes('--update-baseline')) {
  const dir = tmpDir();
  installOk(['--claude', '--target', dir]);
  const files = hashTree(path.join(dir, '.claude'));
  const manifest = {
    _comment: 'Snapshot of what `n2b --claude` writes under <target>/.claude/. Keys are paths relative to .claude/, values are sha256 of file bytes. Claude Code output must stay byte-identical to a verbatim copy of source; regenerate ONLY after an intentional source change: node test/install.test.js --update-baseline',
    root: '.claude',
    fileCount: Object.keys(files).length,
    files,
  };
  fs.writeFileSync(BASELINE, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`updated ${path.relative(REPO, BASELINE)} (${manifest.fileCount} files)`);
  process.exit(0);
}

// ─── mini runner ─────────────────────────────────────────────────────────────

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

async function main() {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  \x1b[32m✓\x1b[0m ${t.name}`);
    } catch (err) {
      failed++;
      console.log(`  \x1b[31m✗\x1b[0m ${t.name}`);
      console.log((err.stack || String(err)).split('\n').map((l) => `      ${l}`).join('\n'));
    }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

const codex = RUNTIMES.codex;
const opencode = RUNTIMES.opencode;
const cursor = RUNTIMES.cursor;
const claude = RUNTIMES.claude;

// ─── 1. parseRuntimeInput ────────────────────────────────────────────────────

test('parseRuntimeInput: empty / default / single / multi / all / invalid / dedupe', () => {
  assert.deepStrictEqual(parseRuntimeInput(''), ['claude']);
  assert.deepStrictEqual(parseRuntimeInput(undefined), ['claude']);
  assert.deepStrictEqual(parseRuntimeInput('1'), ['claude']);
  assert.deepStrictEqual(parseRuntimeInput('1,3'), ['claude', 'opencode']);
  assert.deepStrictEqual(parseRuntimeInput('1 3'), ['claude', 'opencode']);
  assert.deepStrictEqual(parseRuntimeInput('4, 2'), ['cursor', 'codex']);
  assert.deepStrictEqual(parseRuntimeInput('5'), RUNTIME_ORDER);
  assert.deepStrictEqual(parseRuntimeInput('2,5'), RUNTIME_ORDER);
  assert.deepStrictEqual(parseRuntimeInput('9'), ['claude']);
  assert.deepStrictEqual(parseRuntimeInput('2,2'), ['codex']);
});

// ─── 2. buildRuntimePromptText ───────────────────────────────────────────────

test('buildRuntimePromptText lists every runtime label, dir, and the All option', () => {
  const text = buildRuntimePromptText();
  for (const id of RUNTIME_ORDER) {
    assert.ok(text.includes(RUNTIMES[id].label), `missing label ${RUNTIMES[id].label}`);
    assert.ok(text.includes(`(./${RUNTIMES[id].dir})`), `missing dir ${RUNTIMES[id].dir}`);
  }
  assert.ok(/5\x1b\[0m\) All/.test(text));
  assert.ok(text.includes('Select multiple: 1,3 or 1 3'));
});

// ─── 3. parseArgs ────────────────────────────────────────────────────────────

test('parseArgs: flags combine in RUNTIME_ORDER, --all, --target, errors, --help', () => {
  assert.deepStrictEqual(parseArgs([]).runtimes, []);
  assert.deepStrictEqual(parseArgs(['--codex', '--claude']).runtimes, ['claude', 'codex']);
  assert.deepStrictEqual(parseArgs(['--all']).runtimes, RUNTIME_ORDER);
  assert.deepStrictEqual(parseArgs(['--cursor', '--all']).runtimes, RUNTIME_ORDER);
  assert.strictEqual(parseArgs(['--target', 'x']).targetDir, path.resolve('x'));
  assert.ok(parseArgs(['--target']).error);
  assert.ok(parseArgs(['--target', '--codex']).error);
  assert.ok(parseArgs(['--bogus']).error);
  assert.ok(parseArgs(['--global']).error, 'no global scope');
  assert.strictEqual(parseArgs(['-h']).help, true);
  assert.strictEqual(parseArgs(['--help']).help, true);
});

// ─── R1 paths ────────────────────────────────────────────────────────────────

test('R1 rewritePaths: project-relative forms only; URLs and anchored paths untouched', () => {
  const input = 'see `.claude/n2b/x.md`, @./.claude/n2b/y.md, TPL=".claude/n2b/z", https://x/.claude/ and ~/.claude/ and a/.claude/';
  const out = rewritePaths(input, codex);
  assert.strictEqual(out, 'see `.codex/n2b/x.md`, @./.codex/n2b/y.md, TPL=".codex/n2b/z", https://x/.claude/ and ~/.claude/ and a/.claude/');
  assert.strictEqual(rewritePaths('.claude/n2b/', opencode), '.opencode/n2b/');
  assert.strictEqual(rewritePaths('.claude/n2b/', cursor), '.cursor/n2b/');
});

// ─── R2 includes ─────────────────────────────────────────────────────────────

test('R2 rewriteIncludes: @ block → read list; inline @ dropped; @AGENTS.md untouched', () => {
  const input = [
    '<execution_context>',
    '@./.codex/n2b/workflows/stage-1/init.md',
    '@./.codex/n2b/references/stage-1/questioning.md',
    '@./.codex/n2b/templates/stage-1/brief.md',
    '</execution_context>',
    '',
    'Execute the init workflow from @./.codex/n2b/workflows/stage-1/init.md end-to-end.',
    '| **Screen** | `@./.codex/n2b/references/x.md` |',
    '```markdown',
    '@AGENTS.md',
    '```',
  ].join('\n');
  const out = rewriteIncludes(input, codex);
  assert.strictEqual(out, [
    '<execution_context>',
    INCLUDE_LIST_INTRO,
    '- .codex/n2b/workflows/stage-1/init.md',
    '- .codex/n2b/references/stage-1/questioning.md',
    '- .codex/n2b/templates/stage-1/brief.md',
    '</execution_context>',
    '',
    'Execute the init workflow from ./.codex/n2b/workflows/stage-1/init.md end-to-end.',
    '| **Screen** | `./.codex/n2b/references/x.md` |',
    '```markdown',
    '@AGENTS.md',
    '```',
  ].join('\n'));
});

test('R2 rewriteIncludes: two separate @ blocks produce two lists', () => {
  const out = rewriteIncludes('@./.cursor/a.md\n\ntext\n\n@./.cursor/b.md\n@./.cursor/c.md\n', cursor);
  assert.strictEqual(out, `${INCLUDE_LIST_INTRO}\n- .cursor/a.md\n\ntext\n\n${INCLUDE_LIST_INTRO}\n- .cursor/b.md\n- .cursor/c.md\n`);
});

// ─── R3 namespace ────────────────────────────────────────────────────────────

test('R3 rewriteNamespace (codex): mentions → $n2b-<cmd>; paths untouched', () => {
  const input = 'Run `/n2b:s2-define` then /n2b:status ("/n2b:s1-init"). Read `.codex/n2b/agents/stage-2/n2b-visionary.md`. Also `/n2b-status` and /n2b:s{N} and name: n2b:status';
  const out = rewriteNamespace(input, codex);
  assert.strictEqual(out, 'Run `$n2b-s2-define` then $n2b-status ("$n2b-s1-init"). Read `.codex/n2b/agents/stage-2/n2b-visionary.md`. Also `$n2b-status` and $n2b-s{N} and name: n2b-status');
  assert.ok(!/n2b:/.test(out));
});

test('R3 rewriteNamespace (hyphen runtimes): /n2b: → /n2b-, n2b: → n2b-', () => {
  const input = 'Run `/n2b:s2-define` (`/n2b:s5-export dev-brief`). name: n2b:status. path .opencode/n2b/agents/n2b-visionary.md';
  assert.strictEqual(rewriteNamespace(input, opencode), 'Run `/n2b-s2-define` (`/n2b-s5-export dev-brief`). name: n2b-status. path .opencode/n2b/agents/n2b-visionary.md');
  assert.strictEqual(rewriteNamespace(input, cursor), rewriteNamespace(input, opencode));
});

test('R3 rewriteNamespace (claude): identity', () => {
  const input = 'Run `/n2b:s2-define`, name: n2b:status';
  assert.strictEqual(rewriteNamespace(input, claude), input);
});

// ─── R4 tool names ───────────────────────────────────────────────────────────

test('R4 rewriteToolNames per runtime', () => {
  const input = 'Use AskUserQuestion here. <using_askuserquestion> stays. AskUserQuestions (plural) stays.';
  assert.strictEqual(rewriteToolNames(input, opencode), 'Use question here. <using_askuserquestion> stays. AskUserQuestions (plural) stays.');
  assert.strictEqual(rewriteToolNames(input, cursor), 'Use conversational prompting here. <using_askuserquestion> stays. AskUserQuestions (plural) stays.');
  assert.strictEqual(rewriteToolNames(input, codex), input);
  assert.strictEqual(rewriteToolNames(input, claude), input);
  const tools = 'Read, Write, Bash, Agent, WebSearch, WebFetch';
  for (const rt of Object.values(RUNTIMES)) assert.strictEqual(rewriteToolNames(tools, rt), tools);
});

// ─── stamp ───────────────────────────────────────────────────────────────────

test('stampRuntime rewrites the marker to the target id; source marker says claude', () => {
  assert.strictEqual(stampRuntime('<!-- n2b-runtime: claude -->\n# x', opencode), '<!-- n2b-runtime: opencode -->\n# x');
  assert.strictEqual(stampRuntime('no marker', codex), 'no marker');
  const src = fs.readFileSync(path.join(REPO, 'n2b/references/model-profiles.md'), 'utf8');
  assert.ok(src.startsWith('<!-- n2b-runtime: claude -->\n'), 'model-profiles.md must start with the claude marker');
  assert.strictEqual(rewriteContent(src, claude), src);
});

// ─── frontmatter helpers ─────────────────────────────────────────────────────

test('splitFrontmatter / frontmatterField / frontmatterList', () => {
  const content = '---\nname: n2b:x\ndescription: "Hello: world"\nargument-hint: "[a]"\nallowed-tools:\n  - Read\n  - Bash\n---\n<objective>\n---\nnot frontmatter\n</objective>\n';
  const { frontmatter, body } = splitFrontmatter(content);
  assert.strictEqual(frontmatterField(frontmatter, 'name'), 'n2b:x');
  assert.strictEqual(frontmatterField(frontmatter, 'description'), 'Hello: world');
  assert.strictEqual(frontmatterField(frontmatter, 'argument-hint'), '[a]');
  assert.strictEqual(frontmatterField(frontmatter, 'missing'), null);
  assert.deepStrictEqual(frontmatterList(frontmatter, 'allowed-tools'), ['Read', 'Bash']);
  assert.deepStrictEqual(frontmatterList(frontmatter, 'nope'), []);
  assert.strictEqual(body, '\n<objective>\n---\nnot frontmatter\n</objective>\n');
  assert.deepStrictEqual(splitFrontmatter('no fm'), { frontmatter: null, body: 'no fm' });
});

// ─── frontmatter reshape on a real command ───────────────────────────────────

function realCommand(stem, rt) {
  const raw = fs.readFileSync(path.join(REPO, 'commands', 'n2b', `${stem}.md`), 'utf8');
  return convertCommand(rewriteContent(raw, rt), stem, rt);
}

test('Codex writer: quoted SKILL.md frontmatter, adapter header, no allowed-tools', () => {
  const out = realCommand('s3-specify', codex);
  const { frontmatter, body } = splitFrontmatter(out);
  assert.strictEqual(frontmatter.split('\n')[0], 'name: "n2b-s3-specify"');
  assert.strictEqual(frontmatterField(frontmatter, 'description'), 'Transform product definition into implementation-ready feature specifications');
  assert.ok(/^metadata:\n  short-description: "/m.test(frontmatter));
  assert.ok(!frontmatter.includes('allowed-tools'));
  assert.ok(!frontmatter.includes('argument-hint'));
  assert.ok(body.startsWith('\n\n<codex_skill_adapter>\n'));
  assert.ok(body.includes('`$n2b-s3-specify`'));
  assert.ok(body.includes('Arguments: `[--continue] [--batch N|all]`'));
  assert.ok(body.includes('request_user_input'));
  assert.ok(body.includes('spawn_agent'));
  assert.ok(body.includes('</codex_skill_adapter>\n\n<objective>'));
  assert.ok(body.includes('`$n2b-s3-specify --continue`'));
  assert.ok(!/\.claude\//.test(out) && !/n2b:/.test(out));
});

test('Cursor writer: identifier name, quoted description, adapter header', () => {
  const out = realCommand('s1-init', cursor);
  const { frontmatter, body } = splitFrontmatter(out);
  assert.strictEqual(frontmatter, 'name: n2b-s1-init\ndescription: "Initialize Stage 1 — open conversation to capture project vision and produce BRIEF.md"');
  assert.ok(body.startsWith('\n\n<cursor_skill_adapter>\n'));
  assert.ok(body.includes('`/n2b-s1-init`'));
  assert.ok(body.includes('Task(subagent_type="generalPurpose"'));
  assert.ok(body.includes('</cursor_skill_adapter>\n\n<objective>'));
  assert.ok(!out.includes('AskUserQuestion'));
  assert.ok(!out.includes('user-invocable'));
});

test('Cursor writer: description truncated to 180 chars', () => {
  const long = 'x'.repeat(200);
  const out = convertCommand(`---\nname: n2b:t\ndescription: ${long}\n---\nbody\n`, 't', cursor);
  const desc = frontmatterField(splitFrontmatter(out).frontmatter, 'description');
  assert.strictEqual(desc.length, 180);
  assert.ok(desc.endsWith('...'));
});

test('OpenCode writer: name/model dropped, tools map, other fields verbatim, no header', () => {
  const out = realCommand('s3-specify', opencode);
  const { frontmatter, body } = splitFrontmatter(out);
  assert.strictEqual(frontmatter,
    'description: Transform product definition into implementation-ready feature specifications\n' +
    'argument-hint: "[--continue] [--batch N|all]"\n' +
    'tools:\n  read: true\n  write: true\n  bash: true\n  agent: true\n  webfetch: true');
  assert.ok(body.startsWith('\n<objective>'));
  assert.ok(!out.includes('_skill_adapter'));
  assert.ok(out.includes('`/n2b-s3-specify --continue`'));
  const withModel = convertCommand('---\nname: n2b:t\nmodel: opus\ndescription: d\nallowed-tools:\n  - AskUserQuestion\n  - WebSearch\n  - mcp__x__y\n---\nb', 't', opencode);
  assert.strictEqual(withModel, '---\ndescription: d\ntools:\n  question: true\n  websearch: true\n  mcp__x__y: true\n---\nb');
});

test('commandDestPath per runtime', () => {
  assert.strictEqual(commandDestPath('s1-init', claude), 'commands/n2b/s1-init.md');
  assert.strictEqual(commandDestPath('s1-init', codex), 'skills/n2b-s1-init/SKILL.md');
  assert.strictEqual(commandDestPath('s1-init', opencode), 'commands/n2b-s1-init.md');
  assert.strictEqual(commandDestPath('s1-init', cursor), 'skills/n2b-s1-init/SKILL.md');
});

// ─── Integration: Claude byte-identity ───────────────────────────────────────

test('--claude output is byte-identical to a verbatim copy of source', () => {
  const dir = tmpDir();
  installOk(['--claude', '--target', dir]);
  const root = path.join(dir, '.claude');
  const produced = hashTree(root);
  const expected = {};
  for (const rel of fileList(path.join(REPO, 'commands', 'n2b'))) {
    expected[`commands/n2b/${rel}`] = crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, 'commands', 'n2b', rel))).digest('hex');
  }
  for (const rel of fileList(path.join(REPO, 'n2b'))) {
    expected[`n2b/${rel}`] = crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, 'n2b', rel))).digest('hex');
  }
  assert.deepStrictEqual(produced, expected);
  assert.deepStrictEqual(fs.readdirSync(dir), ['.claude'], 'nothing but .claude/ is created');
});

test('--claude output matches test/fixtures/claude-baseline.json', () => {
  const manifest = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const dir = tmpDir();
  installOk(['--claude', '--target', dir]);
  const produced = hashTree(path.join(dir, '.claude'));
  const diffs = [];
  for (const rel of new Set([...Object.keys(manifest.files), ...Object.keys(produced)])) {
    if (manifest.files[rel] !== produced[rel]) diffs.push(rel);
  }
  assert.deepStrictEqual(diffs, [], 'Claude output differs from the baseline. If the source change was intentional, run: node test/install.test.js --update-baseline');
  assert.strictEqual(manifest.fileCount, Object.keys(produced).length);
});

// ─── Integration: non-Claude runtimes ────────────────────────────────────────

for (const id of ['codex', 'opencode', 'cursor']) {
  test(`--${id}: clean tree, six command artifacts, payload mirrors source, stamp set`, () => {
    const rt = RUNTIMES[id];
    const dir = tmpDir();
    installOk([`--${id}`, '--target', dir]);
    const root = path.join(dir, rt.dir);
    assert.deepStrictEqual(fs.readdirSync(dir), [rt.dir]);

    const files = fileList(root);
    for (const rel of files) {
      const text = fs.readFileSync(path.join(root, rel), 'utf8');
      assert.ok(!/\.claude\//.test(text), `${rel} still mentions .claude/`);
      assert.ok(!/\bn2b:/.test(text), `${rel} still uses the n2b: namespace`);
      assert.ok(!/@\.\//.test(text), `${rel} still has an @./ include`);
      if (id !== 'codex') assert.ok(!/AskUserQuestion/.test(text), `${rel} still names AskUserQuestion`);
    }

    const stems = fileList(path.join(REPO, 'commands', 'n2b')).map((f) => f.slice(0, -3));
    assert.strictEqual(stems.length, 6);
    for (const stem of stems) {
      const dest = commandDestPath(stem, rt);
      assert.ok(files.includes(dest), `missing ${dest}`);
      if (rt.commandKind === 'skills') {
        const fm = splitFrontmatter(fs.readFileSync(path.join(root, dest), 'utf8')).frontmatter;
        const name = frontmatterField(fm, 'name');
        assert.strictEqual(name, path.posix.basename(path.posix.dirname(dest)), 'SKILL.md name must equal its directory');
        assert.ok(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name), `bad skill name ${name}`);
      }
    }

    const payload = files.filter((f) => f.startsWith('n2b/')).map((f) => f.slice(4));
    assert.deepStrictEqual(payload, fileList(path.join(REPO, 'n2b')));
    assert.ok(fs.readFileSync(path.join(root, 'n2b/references/model-profiles.md'), 'utf8').startsWith(`<!-- n2b-runtime: ${id} -->\n`));
    assert.strictEqual(files.length, 96);
  });
}

test('buildInstallMap is deterministic and keyed by destination path', () => {
  const source = readSource(REPO);
  for (const rt of Object.values(RUNTIMES)) {
    const a = buildInstallMap(source, rt);
    const b = buildInstallMap(source, rt);
    assert.deepStrictEqual([...a.keys()], [...b.keys()]);
    assert.strictEqual(a.size, 96);
    for (const [k, v] of a) assert.strictEqual(Buffer.from(v).equals(Buffer.from(b.get(k))), true, k);
  }
});

// ─── Integration: --all, idempotency, stale pruning ──────────────────────────

test('--all creates all four roots, re-run is idempotent, stale n2b files are pruned, user files kept', () => {
  const dir = tmpDir();
  installOk(['--all', '--target', dir]);
  assert.deepStrictEqual(fs.readdirSync(dir).sort(), ['.claude', '.codex', '.cursor', '.opencode']);
  const before = {};
  for (const id of RUNTIME_ORDER) before[id] = hashTree(path.join(dir, RUNTIMES[id].dir));

  // stale n2b-owned files (as if a source file had been deleted)
  fs.writeFileSync(path.join(dir, '.claude/n2b/references/old.md'), 'stale');
  fs.mkdirSync(path.join(dir, '.claude/commands/n2b/gone'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.claude/commands/n2b/gone/x.md'), 'stale');
  fs.mkdirSync(path.join(dir, '.codex/skills/n2b-old'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.codex/skills/n2b-old/SKILL.md'), 'stale');
  fs.writeFileSync(path.join(dir, '.opencode/commands/n2b-old.md'), 'stale');
  fs.mkdirSync(path.join(dir, '.cursor/skills/n2b-old'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.cursor/skills/n2b-old/SKILL.md'), 'stale');
  // user-owned files in the same surface dirs — must survive
  fs.writeFileSync(path.join(dir, '.claude/commands/mine.md'), 'mine');
  fs.mkdirSync(path.join(dir, '.codex/skills/mine'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.codex/skills/mine/SKILL.md'), 'mine');
  fs.writeFileSync(path.join(dir, '.opencode/commands/mine.md'), 'mine');
  fs.mkdirSync(path.join(dir, '.cursor/skills/mine'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.cursor/skills/mine/SKILL.md'), 'mine');
  fs.writeFileSync(path.join(dir, '.cursor/rules.md'), 'mine');

  const result = installOk(['--all', '--target', dir]);
  assert.ok(result.stdout.includes('removed 1 stale'), result.stdout);

  for (const stale of ['.claude/n2b/references/old.md', '.claude/commands/n2b/gone', '.codex/skills/n2b-old', '.opencode/commands/n2b-old.md', '.cursor/skills/n2b-old']) {
    assert.ok(!fs.existsSync(path.join(dir, stale)), `${stale} should have been pruned`);
  }
  for (const mine of ['.claude/commands/mine.md', '.codex/skills/mine/SKILL.md', '.opencode/commands/mine.md', '.cursor/skills/mine/SKILL.md', '.cursor/rules.md']) {
    assert.strictEqual(fs.readFileSync(path.join(dir, mine), 'utf8'), 'mine', `${mine} must be kept`);
  }
  for (const id of RUNTIME_ORDER) {
    const after = hashTree(path.join(dir, RUNTIMES[id].dir));
    for (const k of Object.keys(before[id])) assert.strictEqual(after[k], before[id][k], `${id}:${k} changed on re-run`);
  }
});

// ─── CLI behaviour ───────────────────────────────────────────────────────────

test('non-TTY with no runtime flag installs Claude Code only and says so', () => {
  const dir = tmpDir();
  const result = runInstaller(['--target', dir], { input: '2,3\n' });
  assert.strictEqual(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('Non-interactive terminal detected, defaulting to Claude Code install'));
  assert.deepStrictEqual(fs.readdirSync(dir), ['.claude']);
  assert.ok(result.stdout.includes('run /n2b:s1-init'));
});

test('--help exits 0 with usage; unknown flag exits 1 with usage; each runtime prints its next step', () => {
  const help = runInstaller(['--help']);
  assert.strictEqual(help.status, 0);
  assert.ok(help.stdout.includes('--opencode'));
  const bad = runInstaller(['--nope']);
  assert.strictEqual(bad.status, 1);
  assert.ok(bad.stderr.includes('Unknown option: --nope'));
  assert.ok(bad.stderr.includes('Usage:'));
  const dir = tmpDir();
  const all = installOk(['--all', '--target', dir]);
  for (const id of RUNTIME_ORDER) assert.ok(all.stdout.includes(RUNTIMES[id].nextStep), `missing next step for ${id}`);
});

main();
