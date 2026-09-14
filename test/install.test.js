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
  convertCommand, commandDestPath, readSource, buildInstallMap, agentWriter, rewriteSubagentTypes, roleByContractMap,
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

test('R2 rewriteIncludes: @ block → read list; inline @./ → project-relative path; @AGENTS.md untouched', () => {
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
    'Execute the init workflow from .codex/n2b/workflows/stage-1/init.md end-to-end.',
    '| **Screen** | `.codex/n2b/references/x.md` |',
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

test('R6 rewriteSubagentTypes: appends subagent_type only where agentKind is set and the contract maps to a role', () => {
  const roles = roleByContractMap(catalog.roles);
  const input = 'Prompt: "Read the agent contract at `.opencode/n2b/agents/stage-2/n2b-visionary.md` and execute…" · contract at `.opencode/n2b/agents/stage-5/export-jira-formatter.md` · contract at `{FMT_AGENT}` · contracts at `.opencode/n2b/agents/stage-4/{name}.md`';
  const out = rewriteSubagentTypes(input, opencode, roles);
  assert.ok(out.includes('contract at `.opencode/n2b/agents/stage-2/n2b-visionary.md` (subagent_type: "n2b-visionary") and execute'));
  assert.ok(out.includes('contract at `.opencode/n2b/agents/stage-5/export-jira-formatter.md` (subagent_type: "n2b-export-formatter")'), 'shared export-formatter role');
  assert.ok(out.includes('contract at `{FMT_AGENT}` ·') && out.includes('`.opencode/n2b/agents/stage-4/{name}.md`'), 'placeholders untouched');
  assert.strictEqual(rewriteSubagentTypes(input, codex, roles), input, 'codex: agentKind null → identity');
  assert.strictEqual(rewriteSubagentTypes(input, cursor, roles), input);
  assert.strictEqual(rewriteSubagentTypes(input, opencode, undefined), input, 'no map → identity');
  assert.strictEqual(rewriteSubagentTypes('contract at `.opencode/n2b/agents/stage-9/unknown.md`', opencode, roles), 'contract at `.opencode/n2b/agents/stage-9/unknown.md`', 'unknown contract untouched');
  // end to end: every static contract mention in the installed OpenCode tree is annotated; Codex/Cursor carry none
  const ocMap = buildInstallMap(readSource(REPO), opencode);
  const mentions = [];
  for (const [k, v] of ocMap) for (const m of v.toString().matchAll(/contract at `\.opencode\/n2b\/agents\/(stage-\d\/[a-z0-9-]+\.md)`( \(subagent_type: "n2b-[a-z-]+"\))?/g)) mentions.push({ file: k, contract: m[1], annotated: Boolean(m[2]) });
  assert.ok(mentions.length >= 15, `expected the workflow spawns, got ${mentions.length}`);
  for (const m of mentions) assert.ok(m.annotated, `${m.file}: ${m.contract} not annotated`);
  assert.ok(mentions.some((m) => m.file === 'n2b/agents/stage-3/requirements-architect.md'), 'nested Feature Analyst spawn annotated too');
  for (const rt of [codex, cursor]) for (const v of buildInstallMap(readSource(REPO), rt).values()) assert.ok(!/subagent_type: "n2b-[a-z][a-z-]*"/.test(v.toString()), `${rt.id} must not carry a concrete subagent_type (the Transport Rules prose template is fine)`);
});

test('stampRuntime rewrites the marker to the target id; source marker says claude', () => {
  assert.strictEqual(stampRuntime('<!-- n2b-runtime: claude -->\n# x', opencode), '<!-- n2b-runtime: opencode -->\n# x');
  assert.strictEqual(stampRuntime('no marker', codex), 'no marker');
  const src = fs.readFileSync(path.join(REPO, 'n2b/references/model-profiles.md'), 'utf8');
  assert.ok(src.startsWith('<!-- n2b-runtime: claude -->\n'), 'model-profiles.md must start with the claude marker');
  assert.strictEqual(rewriteContent(src, claude), src);
});

test('stage-1/init.md carries exactly one runtime stamp, inside Step 6.5, and it is rewritten per runtime', () => {
  const src = fs.readFileSync(path.join(REPO, 'n2b/workflows/stage-1/init.md'), 'utf8');
  const stamps = src.match(/<!-- n2b-runtime: [a-z-]+ -->/g) || [];
  assert.deepStrictEqual(stamps, ['<!-- n2b-runtime: claude -->']);
  const step65 = src.indexOf('## Step 6.5');
  assert.ok(step65 > 0 && src.indexOf(stamps[0]) > step65 && src.indexOf(stamps[0]) < src.indexOf('## Step 6.7'), 'stamp must sit in Step 6.5');
  assert.strictEqual(rewriteContent(src, claude), src);
  for (const rt of [codex, opencode, cursor]) {
    const out = rewriteContent(src, rt);
    assert.ok(out.includes(`<!-- n2b-runtime: ${rt.id} -->`));
    assert.ok(!out.includes('n2b-runtime: claude'));
    assert.ok(out.includes('model_profile: "inherit"'));
  }
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
  test(`--${id}: clean tree, seven command artifacts, payload mirrors source, stamp set`, () => {
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
      assert.ok(!/n2b-runtime: claude/.test(text), `${rel} still carries the claude runtime stamp`);
    }
    // Stage 1 Step 6.5 branches on its own stamp (asks on claude, writes `inherit` elsewhere).
    const init = fs.readFileSync(path.join(root, 'n2b/workflows/stage-1/init.md'), 'utf8');
    assert.ok(init.includes(`<!-- n2b-runtime: ${id} -->`), 'init.md Step 6.5 must carry the target runtime stamp');
    assert.ok(init.includes('model_profile: "inherit"'), 'init.md Step 6.5 must keep the inherit branch');

    const stems = fileList(path.join(REPO, 'commands', 'n2b')).map((f) => f.slice(0, -3));
    assert.strictEqual(stems.length, 7);
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
    const agents = files.filter((f) => f.startsWith('agents/'));
    assert.strictEqual(agents.length, rt.agentKind ? Object.keys(catalog.roles).length : 0, `${id}: native agent files only where agentKind is set`);
    assert.strictEqual(files.length, 99 + agents.length);
  });
}

// ─── Native agent files (OpenCode) ───────────────────────────────────────────

test('agentKind: only opencode has one; agentWriter is null elsewhere; AGENT_WRITERS keyed on kind, not runtime id', () => {
  for (const id of RUNTIME_ORDER) {
    assert.ok('agentKind' in RUNTIMES[id], `${id} must declare agentKind`);
    assert.strictEqual(RUNTIMES[id].agentKind, id === 'opencode' ? 'opencode-agents' : null);
    assert.strictEqual(agentWriter(RUNTIMES[id]) !== null, id === 'opencode');
  }
  assert.throws(() => agentWriter({ agentKind: 'bogus' }), /Unknown agentKind/);
  const src = fs.readFileSync(path.join(REPO, 'bin/install.js'), 'utf8');
  assert.ok(!/rt\.id === 'opencode'|runtime === 'opencode'/.test(src), 'no runtime-id chains for agent files');
});

test('--opencode emits one agents/n2b-<role>.md per catalog role: subagent, described, no model:, contract paths real', () => {
  const map = buildInstallMap(readSource(REPO), opencode);
  const roles = Object.keys(catalog.roles);
  const agentFiles = [...map.keys()].filter((k) => k.startsWith('agents/'));
  assert.deepStrictEqual(agentFiles.sort(), roles.map((r) => `agents/n2b-${r}.md`).sort());
  for (const role of roles) {
    const text = map.get(`agents/n2b-${role}.md`).toString();
    const { frontmatter, body } = splitFrontmatter(text);
    assert.ok(frontmatter !== null, `${role}: frontmatter`);
    assert.strictEqual(frontmatterField(frontmatter, 'mode'), 'subagent');
    assert.ok(frontmatterField(frontmatter, 'description').includes(catalog.roles[role].label), `${role}: description names the role`);
    assert.ok(!/^model:/m.test(frontmatter), `${role}: no model: line at install (OpenCode rejects aliases and inherit)`);
    assert.ok(/^# model: /m.test(frontmatter), `${role}: keeps the sync hint comment`);
    assert.ok(!/\.claude\/|\bn2b:|@\.\/|inherit/.test(text), `${role}: rewritten for opencode`);
    for (const rel of catalog.roles[role].agents) {
      assert.ok(body.includes(`\`.opencode/n2b/agents/${rel}\``), `${role}: body names contract ${rel}`);
      assert.ok(map.has(`n2b/agents/${rel}`), `${role}: contract ${rel} is installed`);
    }
    assert.ok(body.includes('Read the agent contract at'), `${role}: body explains the spawn prompt`);
  }
  for (const rt of [claude, codex, cursor]) {
    assert.ok([...buildInstallMap(readSource(REPO), rt).keys()].every((k) => !k.startsWith('agents/')), `${rt.id} must not get agent files`);
  }
});

test('buildInstallMap is deterministic and keyed by destination path', () => {
  const source = readSource(REPO);
  for (const rt of Object.values(RUNTIMES)) {
    const a = buildInstallMap(source, rt);
    const b = buildInstallMap(source, rt);
    assert.deepStrictEqual([...a.keys()], [...b.keys()]);
    assert.strictEqual(a.size, 99 + (rt.agentKind ? Object.keys(catalog.roles).length : 0));
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
  fs.writeFileSync(path.join(dir, '.opencode/agents/n2b-old-role.md'), 'stale');
  fs.mkdirSync(path.join(dir, '.cursor/skills/n2b-old'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.cursor/skills/n2b-old/SKILL.md'), 'stale');
  // user-owned files in the same surface dirs — must survive
  fs.writeFileSync(path.join(dir, '.claude/commands/mine.md'), 'mine');
  fs.mkdirSync(path.join(dir, '.codex/skills/mine'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.codex/skills/mine/SKILL.md'), 'mine');
  fs.writeFileSync(path.join(dir, '.opencode/commands/mine.md'), 'mine');
  fs.writeFileSync(path.join(dir, '.opencode/agents/mine.md'), 'mine');
  fs.mkdirSync(path.join(dir, '.cursor/skills/mine'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.cursor/skills/mine/SKILL.md'), 'mine');
  fs.writeFileSync(path.join(dir, '.cursor/rules.md'), 'mine');

  const result = installOk(['--all', '--target', dir]);
  assert.ok(result.stdout.includes('removed 1 stale'), result.stdout);
  assert.ok(result.stdout.includes('removed 2 stale'), 'opencode prunes the stale command and the stale agent file');

  for (const stale of ['.claude/n2b/references/old.md', '.claude/commands/n2b/gone', '.codex/skills/n2b-old', '.opencode/commands/n2b-old.md', '.opencode/agents/n2b-old-role.md', '.cursor/skills/n2b-old']) {
    assert.ok(!fs.existsSync(path.join(dir, stale)), `${stale} should have been pruned`);
  }
  for (const mine of ['.claude/commands/mine.md', '.codex/skills/mine/SKILL.md', '.opencode/commands/mine.md', '.opencode/agents/mine.md', '.cursor/skills/mine/SKILL.md', '.cursor/rules.md']) {
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

// ─── Model catalog / routing (model-profiles Phase 1) ────────────────────────

const CATALOG_PATH = path.join(REPO, 'n2b', 'references', 'model-catalog.json');
const PROFILES_PATH = path.join(REPO, 'n2b', 'references', 'model-profiles.md');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
const TIERS = ['frontier', 'heavy', 'standard', 'light'];

/** Every ```bash fenced block in a Markdown file whose first line contains <marker>. */
function fencedBlocks(markdown, marker) {
  const out = [];
  const re = /```bash\n([\s\S]*?)\n```/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    if (m[1].split('\n')[0].includes(marker)) out.push(m[1]);
  }
  return out;
}

const hasPython = spawnSync('python3', ['--version'], { encoding: 'utf8' }).status === 0;
function python(script, cwd, args = []) {
  return spawnSync('python3', ['-', ...args], { input: script, encoding: 'utf8', cwd });
}
/** Strip the `python3 - … <<'PYEOF'` line and the PYEOF terminator from a resolver/materializer block. */
function pythonBody(block) {
  const lines = block.split('\n');
  const start = lines.findIndex((l) => l.startsWith('python3 - '));
  const end = lines.lastIndexOf('PYEOF');
  assert.ok(start >= 0 && end > start, 'block must be a python3 heredoc');
  return lines.slice(start + 1, end).join('\n');
}

test('catalog: profiles, tiers, fallback chain, 16 roles with valid tiers and existing agent contracts', () => {
  assert.deepStrictEqual(catalog.profiles, ['quality', 'balanced', 'budget', 'inherit']);
  assert.deepStrictEqual(catalog.tiers, TIERS);
  for (const t of TIERS.slice(0, -1)) assert.strictEqual(catalog.fallback[t], TIERS[TIERS.indexOf(t) + 1], `fallback ${t}`);
  assert.strictEqual(catalog.fallback.light, undefined, 'light is the end of the chain');
  const roles = Object.keys(catalog.roles);
  assert.strictEqual(roles.length, 16);
  const claimed = [];
  for (const [key, row] of Object.entries(catalog.roles)) {
    assert.ok(/^[a-z]+(-[a-z]+)*$/.test(key), `role key ${key}`);
    assert.strictEqual(row.label.toLowerCase().replace(/ /g, '-'), key, `label ↔ key for ${key}`);
    assert.ok([2, 3, 4, 5].includes(row.stage), `stage for ${key}`);
    for (const p of ['quality', 'balanced', 'budget']) assert.ok(TIERS.includes(row[p]), `${key}.${p} = ${row[p]}`);
    assert.ok(Array.isArray(row.agents) && row.agents.length > 0, `${key} lists agent contracts`);
    for (const rel of row.agents) {
      assert.ok(rel.startsWith(`stage-${row.stage}/`), `${key} agent ${rel} is in its stage dir`);
      assert.ok(fs.existsSync(path.join(REPO, 'n2b', 'agents', rel)), `${key} agent contract ${rel} missing`);
      claimed.push(rel);
    }
  }
  assert.deepStrictEqual(claimed.sort(), fileList(path.join(REPO, 'n2b', 'agents')), 'every agent contract belongs to exactly one role');
  // decision 88: research/design roles never drop to light
  for (const key of ['researcher', 'technical-researcher', 'schema-designer']) {
    for (const p of ['quality', 'balanced', 'budget']) assert.notStrictEqual(catalog.roles[key][p], 'light', `${key}.${p}`);
  }
});

test('catalog: providers are null or {model, reasoning_effort?}; runtimes match RUNTIME_ORDER and reference real providers', () => {
  for (const [name, tiers] of Object.entries(catalog.providers)) {
    assert.deepStrictEqual(Object.keys(tiers), TIERS, `provider ${name} tier keys`);
    for (const [t, entry] of Object.entries(tiers)) {
      if (entry === null) continue;
      assert.strictEqual(typeof entry.model, 'string', `${name}.${t}.model`);
      assert.ok(entry.model.length > 0, `${name}.${t}.model non-empty`);
      for (const k of Object.keys(entry)) assert.ok(['model', 'reasoning_effort'].includes(k), `${name}.${t}.${k} unexpected`);
      if (name !== 'claude-aliases') assert.ok(!/^(fable|opus|sonnet|haiku)$/.test(entry.model), `${name}.${t} must not be a Claude alias`);
    }
  }
  assert.deepStrictEqual(catalog.providers['claude-aliases'], { frontier: { model: 'fable' }, heavy: { model: 'opus' }, standard: { model: 'sonnet' }, light: { model: 'haiku' } });
  assert.deepStrictEqual(Object.keys(catalog.runtimes), RUNTIME_ORDER);
  for (const [id, rt] of Object.entries(catalog.runtimes)) {
    assert.ok(rt.defaultProvider === 'inherit' || catalog.providers[rt.defaultProvider], `${id}.defaultProvider`);
    for (const p of rt.knownProviders) assert.ok(catalog.providers[p], `${id}.knownProviders ${p}`);
    assert.strictEqual(typeof rt.transport, 'string');
  }
  assert.strictEqual(catalog.runtimes.claude.defaultProvider, 'claude-aliases');
  for (const id of ['codex', 'opencode', 'cursor']) assert.strictEqual(catalog.runtimes[id].defaultProvider, 'inherit', `${id} defaults to inherit`);
});

test('catalog: contains no rewrite triggers and installs byte-identical on every runtime', () => {
  const text = fs.readFileSync(CATALOG_PATH, 'utf8');
  for (const bad of [/\.claude\//, /\bn2b:/, /@\.\//, /AskUserQuestion/, /n2b-runtime:/]) assert.ok(!bad.test(text), `catalog matches ${bad}`);
  const source = readSource(REPO);
  for (const id of RUNTIME_ORDER) {
    const out = buildInstallMap(source, RUNTIMES[id]).get('n2b/references/model-catalog.json');
    assert.strictEqual(Buffer.isBuffer(out) ? out.toString('utf8') : out, text, `${id} catalog differs from source`);
  }
});

test('config template: seven registered fields in schema order, Claude alias tiers', () => {
  const tpl = JSON.parse(fs.readFileSync(path.join(REPO, 'n2b', 'templates', 'config.json'), 'utf8'));
  assert.deepStrictEqual(Object.keys(tpl), ['model_profile', 'model_provider', 'model_tiers', 'spec_review', 'design_system_source', 'created', 'n2b_version']);
  assert.strictEqual(tpl.model_profile, 'balanced');
  assert.strictEqual(tpl.model_provider, 'claude-aliases');
  assert.deepStrictEqual(tpl.model_tiers, catalog.providers['claude-aliases']);
  assert.strictEqual(tpl.created, '{DATE}');
  assert.strictEqual(tpl.n2b_version, require(path.join(REPO, 'package.json')).version);
});

test('model-profiles.md rendered role table matches the catalog', () => {
  const md = fs.readFileSync(PROFILES_PATH, 'utf8');
  const rows = md.split('\n').filter((l) => /^\| \*\*.+\*\* \(Stage \d\) \|/.test(l));
  assert.strictEqual(rows.length, 16, 'rendered table has 16 role rows');
  const rendered = {};
  for (const row of rows) {
    const m = row.match(/^\| \*\*(.+?)\*\* \(Stage (\d)\) \| (\S+) \| (\S+) \| (\S+) \|$/);
    assert.ok(m, `unparseable row: ${row}`);
    rendered[m[1].toLowerCase().replace(/ /g, '-')] = { stage: Number(m[2]), quality: m[3], balanced: m[4], budget: m[5] };
  }
  const expected = {};
  for (const [k, r] of Object.entries(catalog.roles)) expected[k] = { stage: r.stage, quality: r.quality, balanced: r.balanced, budget: r.budget };
  assert.deepStrictEqual(rendered, expected, 'model-profiles.md table drifted from model-catalog.json — the catalog is the source of truth; re-render the table');
});

test('resolver, materializer and agent-sync blocks: owned by model-profiles.md, copied verbatim into every consumer', () => {
  const md = fs.readFileSync(PROFILES_PATH, 'utf8');
  const [resolver] = fencedBlocks(md, '# n2b-model-resolver');
  const [materializer] = fencedBlocks(md, '# n2b-model-materializer');
  const [sync] = fencedBlocks(md, '# n2b-agent-sync');
  assert.ok(resolver && materializer && sync, 'model-profiles.md must define all three blocks');
  assert.ok(resolver.includes(".claude/n2b/references/model-catalog.json") && resolver.includes(".claude/n2b/references/model-profiles.md"));
  assert.ok(!/n2b-runtime: claude/.test(resolver), 'resolver reads the stamp at run time — it must not carry one');
  assert.ok(sync.includes('.claude/agents/n2b-{role}.md') && sync.includes("'agent-frontmatter'") && !/inherit/.test(sync.replace(/'inherit'/g, '')), 'sync targets the agent files, gates on transport, never writes the word inherit');
  const consumers = {
    'model-resolver': { block: resolver, files: ['n2b/workflows/stage-2/define.md', 'n2b/workflows/stage-3/specify.md', 'n2b/workflows/stage-4/architect.md', 'n2b/workflows/stage-5/export.md', 'n2b/workflows/config.md'] },
    'model-materializer': { block: materializer, files: ['n2b/workflows/stage-1/init.md', 'n2b/workflows/config.md'] },
    'agent-sync': { block: sync, files: ['n2b/workflows/stage-1/init.md', 'n2b/workflows/config.md'] },
  };
  for (const [kind, { block: canonical, files }] of Object.entries(consumers)) {
    for (const rel of files) {
      const blocks = fencedBlocks(fs.readFileSync(path.join(REPO, rel), 'utf8'), `# n2b-${kind}`);
      assert.strictEqual(blocks.length, 1, `${rel} must carry exactly one ${kind} block`);
      assert.strictEqual(blocks[0], canonical, `${rel} ${kind} block differs from model-profiles.md`);
    }
  }
  // the OpenCode transport row and the Stage 1 notice no longer say "not yet"
  for (const rel of ['n2b/references/model-profiles.md', 'n2b/workflows/stage-1/init.md', 'n2b/workflows/config.md']) {
    assert.ok(!/does not ship yet|not yet applied|not ship yet/.test(fs.readFileSync(path.join(REPO, rel), 'utf8')), `${rel} still describes OpenCode routing as unshipped`);
  }
  // no workflow resolves models the old way any more
  for (const rel of consumers['model-resolver'].files) {
    const text = fs.readFileSync(path.join(REPO, rel), 'utf8');
    assert.ok(!/Per-Agent Model Mapping table/.test(text), `${rel} still points at the table`);
    assert.ok(!/case "\$MODEL_PROFILE"/.test(text), `${rel} still has the old case guard`);
  }
});

test('Codex adapter: model routing is capability-gated, aliases banned, one-shot re-spawn', () => {
  const out = realCommand('s2-define', codex);
  assert.ok(out.includes('inspect the visible `spawn_agent` schema first'));
  assert.ok(out.includes('Pass `model` only when the schema advertises a `model` field'));
  assert.ok(out.includes('re-spawn once with no `model`'));
  assert.ok(!out.includes('Do NOT pass a `model` parameter'), 'Codex no longer bans model unconditionally');
  const cursorOut = realCommand('s2-define', cursor);
  assert.ok(cursorOut.includes('Do NOT pass a `model` parameter'), 'Cursor still never passes a model');
});

test('resolver + materializer end-to-end (python3): Claude spawns unchanged, inherit omits, legacy configs, Codex omits aliases', function () {
  if (!hasPython) { console.log('      (python3 not found — skipped)'); return; }
  const md = fs.readFileSync(PROFILES_PATH, 'utf8');
  const resolver = pythonBody(fencedBlocks(md, '# n2b-model-resolver')[0]);
  const materializer = pythonBody(fencedBlocks(md, '# n2b-model-materializer')[0]);
  const gate0 = fs.readFileSync(path.join(REPO, 'n2b/workflows/stage-1/init.md'), 'utf8').split('\n').find((l) => l.includes('GATE0-CONFIG'));
  assert.ok(gate0, 'Gate 0 config check present');

  const parse = (stdout) => Object.fromEntries(stdout.trim().split('\n').slice(1).map((l) => { const m = l.match(/^([a-z-]+): model=(\S+) reasoning_effort=(\S+)$/); assert.ok(m, `bad resolver line: ${l}`); return [m[1], { model: m[2], effort: m[3] }]; }));
  const run = (cwd, rtDir, script, args = []) => {
    const r = python(script.split('.claude/').join(`${rtDir}/`), cwd, args);
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    return r.stdout;
  };
  const readCfg = (cwd) => JSON.parse(fs.readFileSync(path.join(cwd, '.n2b/config.json'), 'utf8'));
  const gate = (cwd, rtDir) => spawnSync('bash', ['-c', gate0.split('.claude/').join(`${rtDir}/`)], { cwd, encoding: 'utf8' }).stdout.trim();

  // Claude Code
  const dir = tmpDir();
  installOk(['--claude', '--codex', '--target', dir]);
  fs.mkdirSync(path.join(dir, '.n2b'));
  run(dir, '.claude', materializer, ['model_profile=balanced', 'model_provider=claude-aliases', 'design_system_source=none']);
  let cfg = readCfg(dir);
  assert.deepStrictEqual(Object.keys(cfg), ['model_profile', 'model_provider', 'model_tiers', 'spec_review', 'design_system_source', 'created', 'n2b_version']);
  assert.deepStrictEqual(cfg.model_tiers, catalog.providers['claude-aliases']);
  assert.strictEqual(cfg.n2b_version, require(path.join(REPO, 'package.json')).version);
  assert.ok(gate(dir, '.claude').startsWith('GATE0-CONFIG: PASS'), gate(dir, '.claude'));
  let out = run(dir, '.claude', resolver);
  assert.ok(out.startsWith('MODEL_PROFILE=balanced MODEL_PROVIDER=claude-aliases RUNTIME=claude TRANSPORT=spawn-alias\n'));
  let roles = parse(out);
  // The pre-Phase-1 Balanced column, verbatim — the regression bar.
  const balancedBefore = { visionary: 'sonnet', researcher: 'sonnet', synthesizer: 'opus', 'requirements-architect': 'opus', 'feature-analyst': 'sonnet', 'feature-spec-producer': 'sonnet', 'spec-quality-reviewer': 'sonnet', 'cross-reference-reconciler': 'opus', 'profile-analyst': 'sonnet', 'technical-researcher': 'sonnet', 'feasibility-planner': 'opus', 'technical-architect': 'opus', 'schema-designer': 'sonnet', 'backlog-builder': 'sonnet', 'export-formatter': 'sonnet', 'export-fidelity-checker': 'sonnet' };
  assert.deepStrictEqual(Object.fromEntries(Object.entries(roles).map(([k, v]) => [k, v.model])), balancedBefore);
  for (const v of Object.values(roles)) assert.strictEqual(v.effort, '(omit)');

  run(dir, '.claude', materializer, ['model_profile=quality']);
  roles = parse(run(dir, '.claude', resolver));
  assert.strictEqual(roles.synthesizer.model, 'fable');
  assert.strictEqual(roles['spec-quality-reviewer'].model, 'opus');
  run(dir, '.claude', materializer, ['model_profile=budget']);
  roles = parse(run(dir, '.claude', resolver));
  assert.strictEqual(roles['spec-quality-reviewer'].model, 'haiku');
  assert.strictEqual(roles.researcher.model, 'sonnet');

  run(dir, '.claude', materializer, ['model_profile=inherit']);
  cfg = readCfg(dir);
  assert.strictEqual(cfg.model_provider, 'inherit');
  assert.deepStrictEqual(cfg.model_tiers, { frontier: null, heavy: null, standard: null, light: null });
  for (const v of Object.values(parse(run(dir, '.claude', resolver)))) assert.strictEqual(v.model, '(omit)');
  assert.ok(gate(dir, '.claude').startsWith('GATE0-CONFIG: PASS'));

  // generic provider: partial IDs + fallback walk; a later --set keeps the others
  run(dir, '.claude', materializer, ['model_profile=quality', 'model_provider=generic', 'heavy=my/big', 'standard=my/mid']);
  cfg = readCfg(dir);
  assert.deepStrictEqual(cfg.model_tiers, { frontier: null, heavy: { model: 'my/big' }, standard: { model: 'my/mid' }, light: null });
  roles = parse(run(dir, '.claude', resolver));
  assert.strictEqual(roles.synthesizer.model, 'my/big', 'frontier null → heavy');
  run(dir, '.claude', materializer, ['light=my/small']);
  assert.deepStrictEqual(readCfg(dir).model_tiers.heavy, { model: 'my/big' });
  assert.deepStrictEqual(readCfg(dir).model_tiers.light, { model: 'my/small' });

  // invalid values are refused and nothing is written
  const before = fs.readFileSync(path.join(dir, '.n2b/config.json'), 'utf8');
  for (const bad of [['model_profile=turbo'], ['model_provider=nope'], ['spec_review=maybe']]) {
    const r = python(materializer, dir, bad);
    assert.notStrictEqual(r.status, 0, `${bad} should fail`);
    assert.ok(/CONFIG-ERROR/.test(r.stderr + r.stdout), `${bad} should print CONFIG-ERROR`);
  }
  assert.strictEqual(fs.readFileSync(path.join(dir, '.n2b/config.json'), 'utf8'), before);

  // legacy five-field config on Claude Code routes exactly as before
  fs.writeFileSync(path.join(dir, '.n2b/config.json'), JSON.stringify({ model_profile: 'balanced', spec_review: 'independent', design_system_source: 'none', created: '2026-09-01', n2b_version: '0.2.0' }));
  out = run(dir, '.claude', resolver);
  assert.ok(out.startsWith('MODEL_PROFILE=balanced MODEL_PROVIDER=claude-aliases RUNTIME=claude'));
  assert.deepStrictEqual(Object.fromEntries(Object.entries(parse(out)).map(([k, v]) => [k, v.model])), balancedBefore);
  assert.ok(gate(dir, '.claude').startsWith('GATE0-CONFIG: FAIL'), 'legacy shape fails Gate 0 (Stage 1 must write the full shape)');
  // materializer upgrades it in place, preserving created
  run(dir, '.claude', materializer, []);
  cfg = readCfg(dir);
  assert.strictEqual(cfg.created, '2026-09-01');
  assert.deepStrictEqual(cfg.model_tiers, catalog.providers['claude-aliases']);

  // Codex: the same legacy config must NOT leak aliases; default provider is inherit; openai materializes effort
  fs.writeFileSync(path.join(dir, '.n2b/config.json'), JSON.stringify({ model_profile: 'balanced', spec_review: 'independent', design_system_source: 'none', created: '2026-09-01', n2b_version: '0.2.0' }));
  out = run(dir, '.codex', resolver);
  assert.ok(out.startsWith('MODEL_PROFILE=balanced MODEL_PROVIDER=inherit RUNTIME=codex TRANSPORT=spawn-if-advertised\n'), out.split('\n')[0]);
  for (const v of Object.values(parse(out))) assert.strictEqual(v.model, '(omit)');
  fs.unlinkSync(path.join(dir, '.n2b/config.json'));
  run(dir, '.codex', materializer, ['model_profile=balanced']);
  assert.strictEqual(readCfg(dir).model_provider, 'inherit');
  run(dir, '.codex', materializer, ['model_profile=quality', 'model_provider=openai']);
  roles = parse(run(dir, '.codex', resolver));
  assert.deepStrictEqual(roles.synthesizer, { model: 'gpt-5.6-sol', effort: 'xhigh' });
  assert.deepStrictEqual(roles.visionary, { model: 'gpt-5.6-sol', effort: 'high' });
  for (const v of Object.values(roles)) assert.ok(!/^(fable|opus|sonnet|haiku)$/.test(v.model), 'no alias on codex');
});

test('agent-sync end-to-end (python3): OpenCode agent files get model: from model_tiers, inherit strips it, idempotent, n/a elsewhere', function () {
  if (!hasPython) { console.log('      (python3 not found — skipped)'); return; }
  const md = fs.readFileSync(PROFILES_PATH, 'utf8');
  const materializer = pythonBody(fencedBlocks(md, '# n2b-model-materializer')[0]);
  const sync = pythonBody(fencedBlocks(md, '# n2b-agent-sync')[0]);
  const run = (cwd, rtDir, script, args = []) => {
    const r = python(script.split('.claude/').join(`${rtDir}/`), cwd, args);
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    return r.stdout;
  };
  const roles = Object.keys(catalog.roles);
  const dir = tmpDir();
  installOk(['--opencode', '--codex', '--claude', '--target', dir]);
  fs.mkdirSync(path.join(dir, '.n2b'));
  const agentPath = (role) => path.join(dir, '.opencode/agents', `n2b-${role}.md`);
  const modelOf = (role) => { const m = fs.readFileSync(agentPath(role), 'utf8').match(/^model: (.+)$/m); return m ? m[1] : null; };
  const installedBytes = Object.fromEntries(roles.map((r) => [r, fs.readFileSync(agentPath(r), 'utf8')]));

  // fresh install: no model anywhere
  for (const r of roles) assert.strictEqual(modelOf(r), null, `${r}: installer must not write model:`);

  // quality · anthropic → every file carries a provider/model ID; per-role tiers honoured
  run(dir, '.opencode', materializer, ['model_profile=quality', 'model_provider=anthropic', 'design_system_source=none']);
  let out = run(dir, '.opencode', sync);
  assert.ok(out.trim().endsWith(`AGENT-SYNC: ${roles.length} of ${roles.length} agent files changed, 0 missing`), out);
  for (const r of roles) {
    const tier = catalog.roles[r].quality;
    assert.strictEqual(modelOf(r), catalog.providers.anthropic[tier].model, `${r}: model from tier ${tier}`);
    assert.ok(modelOf(r).startsWith('anthropic/'), `${r}: full provider/model ID`);
    const fm = splitFrontmatter(fs.readFileSync(agentPath(r), 'utf8')).frontmatter;
    assert.strictEqual((fm.match(/^model:/gm) || []).length, 1, `${r}: exactly one model: line`);
    assert.strictEqual(frontmatterField(fm, 'mode'), 'subagent', `${r}: mode kept`);
  }
  assert.strictEqual(modelOf('synthesizer'), 'anthropic/claude-fable-5');
  assert.strictEqual(modelOf('spec-quality-reviewer'), 'anthropic/claude-opus-4-8');
  // idempotent
  out = run(dir, '.opencode', sync);
  assert.ok(out.includes(`AGENT-SYNC: 0 of ${roles.length} agent files changed`), out);

  // budget · openai: light tier lands on luna; fallback walk covers null frontier
  run(dir, '.opencode', materializer, ['model_profile=budget', 'model_provider=openai']);
  run(dir, '.opencode', sync);
  assert.strictEqual(modelOf('spec-quality-reviewer'), 'gpt-5.6-luna');
  assert.strictEqual(modelOf('feature-spec-producer'), 'gpt-5.6-terra');
  run(dir, '.opencode', materializer, ['model_profile=quality', 'model_provider=generic', 'heavy=openrouter/big', 'standard=openrouter/mid', 'light=openrouter/small']);
  run(dir, '.opencode', sync);
  assert.strictEqual(modelOf('synthesizer'), 'openrouter/big', 'frontier null → heavy');

  // inherit strips every model: line and restores the installed bytes exactly
  run(dir, '.opencode', materializer, ['model_profile=inherit']);
  out = run(dir, '.opencode', sync);
  assert.ok(out.includes(`AGENT-SYNC: ${roles.length} of ${roles.length} agent files changed`), out);
  for (const r of roles) assert.strictEqual(fs.readFileSync(agentPath(r), 'utf8'), installedBytes[r], `${r}: inherit must restore the installed file byte-for-byte`);
  assert.ok(!out.includes('model=inherit'), 'never prints/writes inherit as a model');

  // legacy five-field config on OpenCode → session model (defaultProvider inherit), nothing written
  fs.writeFileSync(path.join(dir, '.n2b/config.json'), JSON.stringify({ model_profile: 'balanced', spec_review: 'independent', design_system_source: 'none', created: '2026-09-01', n2b_version: '0.2.0' }));
  out = run(dir, '.opencode', sync);
  assert.ok(out.includes(`AGENT-SYNC: 0 of ${roles.length} agent files changed`), out);
  for (const r of roles) assert.strictEqual(modelOf(r), null);

  // missing agent file is reported, the rest still sync, exit 0
  fs.unlinkSync(agentPath('visionary'));
  run(dir, '.opencode', materializer, ['model_profile=balanced', 'model_provider=anthropic']);
  out = run(dir, '.opencode', sync);
  assert.ok(/AGENT-SYNC: visionary MISSING \.opencode\/agents\/n2b-visionary\.md/.test(out), out);
  assert.ok(out.trim().endsWith(`AGENT-SYNC: ${roles.length - 1} of ${roles.length} agent files changed, 1 missing`), out);
  assert.strictEqual(modelOf('researcher'), 'anthropic/claude-sonnet-5');

  // other runtimes: one n/a line, nothing touched
  for (const [rtDir, transport] of [['.codex', 'spawn-if-advertised'], ['.claude', 'spawn-alias']]) {
    out = run(dir, rtDir, sync);
    assert.strictEqual(out.trim(), `AGENT-SYNC: n/a — ${rtDir.slice(1)} routes via ${transport}, no agent files to update`);
  }
});

main();
