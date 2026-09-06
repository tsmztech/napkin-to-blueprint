#!/usr/bin/env node
'use strict';

/**
 * n2b installer — syncs napkin-to-blueprint source into a project's runtime
 * directory (Claude Code, Codex, OpenCode, or Cursor). Project-local only.
 *
 * Source is authored once in Claude Code native format and translated while
 * copying — the same design as open-gsd/gsd-core. Every format decision below
 * cites the gsd-core file it was read from; the full rationale lives in
 * n2b-manager/plans/multi-runtime-install-plan.md.
 *
 * Zero npm dependencies. Plain Node ≥16.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const green = '\x1b[32m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// ─── Runtime descriptors ─────────────────────────────────────────────────────
// The ONLY place that knows a runtime's name, directory, command surface and
// invocation form. Behaviour is driven from this table, never from
// `if (runtime === 'x')` chains (gsd-core ADR-1239, bin/install.js:600-660).
// Shape borrowed from gsd-core capabilities/<runtime>/capability.json:
// runtime.localConfigDir, runtime.artifactLayout.local, runtime.commandStyle.
const RUNTIMES = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    dir: '.claude',
    // commands/n2b/<stem>.md — the source layout, copied verbatim
    // (gsd-core capabilities/claude/capability.json: local kind "commands", converter null)
    commandKind: 'claude-commands',
    namespaceStyle: 'colon',      // /n2b:<stem>
    toolNames: {},
    invoke: '/n2b:s1-init',
    nextStep: 'Open the folder in Claude Code and run /n2b:s1-init',
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    dir: '.codex',
    // skills/n2b-<stem>/SKILL.md
    // (gsd-core capabilities/codex/capability.json: local kind "skills",
    //  converter convertClaudeCommandToCodexSkill; commandStyle "shell-var")
    commandKind: 'skills',
    namespaceStyle: 'shell-var',  // $n2b-<stem>
    toolNames: {},             // AskUserQuestion kept; mapped in the skill adapter header
    invoke: '$n2b-s1-init',
    nextStep: 'Open the folder in Codex and run $n2b-s1-init',
  },
  opencode: {
    id: 'opencode',
    label: 'OpenCode',
    dir: '.opencode',
    // commands/n2b-<stem>.md — flat, PLURAL "commands/" (gsd-core #2329;
    //  capabilities/opencode/capability.json: local kind "commands",
    //  destSubpath "commands"; commandStyle "slash-hyphen")
    commandKind: 'flat-commands',
    namespaceStyle: 'hyphen',     // /n2b-<stem>
    toolNames: { AskUserQuestion: 'question' },   // gsd-core bin/install.js:7212
    invoke: '/n2b-s1-init',
    nextStep: 'Open the folder in OpenCode and run /n2b-s1-init',
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    dir: '.cursor',
    // skills/n2b-<stem>/SKILL.md — Cursor's legacy commands/ surface was
    // retired in gsd-core #2644 (capabilities/cursor/capability.json:
    //  local kind "skills", converter convertClaudeCommandToCursorSkill)
    commandKind: 'skills',
    namespaceStyle: 'hyphen',     // /n2b-<stem> from the "/" menu, or a mention
    toolNames: { AskUserQuestion: 'conversational prompting' },   // gsd-core bin/install.js:2572
    invoke: '/n2b-s1-init',
    nextStep: 'Open the folder in Cursor and run /n2b-s1-init (or mention n2b-s1-init)',
  },
};
const RUNTIME_ORDER = ['claude', 'codex', 'opencode', 'cursor'];
const DEFAULT_RUNTIME = 'claude';

// Interactive picker options. Module-level so tests can assert structurally
// (gsd-core bin/install.js:13181-13185).
const runtimeMap = { '1': 'claude', '2': 'codex', '3': 'opencode', '4': 'cursor' };
const ALL_RUNTIMES_OPTION = '5';

const COMMAND_PREFIX = 'n2b';         // source: commands/n2b/<stem>.md, name: n2b:<stem>
const PAYLOAD_DIR = 'n2b';            // source: n2b/** → <root>/n2b/**

// ─── CLI ─────────────────────────────────────────────────────────────────────

function usageText() {
  return `Usage: n2b [--claude] [--codex] [--opencode] [--cursor] [--all] [--target <dir>]

Installs n2b into the chosen runtime's project-local directory. With no
runtime flag an interactive picker appears (Claude Code is used when no
terminal is attached).

  --claude        Claude Code  → <dir>/.claude/
  --codex         Codex        → <dir>/.codex/
  --opencode      OpenCode     → <dir>/.opencode/
  --cursor        Cursor       → <dir>/.cursor/
  --all           all four runtimes
  --target <dir>  project directory (defaults to the current directory)
  -h, --help      show this help

Examples:
  npx napkin-to-blueprint@latest                       # interactive picker
  npx napkin-to-blueprint@latest --claude
  npx napkin-to-blueprint@latest --codex
  npx napkin-to-blueprint@latest --opencode
  npx napkin-to-blueprint@latest --cursor --target ./my-idea
  npx napkin-to-blueprint@latest --all
`;
}

/**
 * Parse argv into { runtimes, targetDir, help, error }.
 * Pure — exported for tests. Runtime flags combine; --all selects every
 * runtime; the result is ordered by RUNTIME_ORDER for deterministic output.
 */
function parseArgs(argv) {
  const result = { runtimes: [], targetDir: null, help: false, error: null };
  const selected = new Set();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') { result.help = true; continue; }
    if (arg === '--target') {
      const value = argv[i + 1];
      if (!value || value.startsWith('-')) {
        result.error = '--target requires a directory';
        return result;
      }
      result.targetDir = path.resolve(value);
      i++;
      continue;
    }
    if (arg === '--all') {
      for (const id of RUNTIME_ORDER) selected.add(id);
      continue;
    }
    if (arg.startsWith('--') && RUNTIMES[arg.slice(2)]) {
      selected.add(arg.slice(2));
      continue;
    }
    result.error = `Unknown option: ${arg}`;
    return result;
  }
  result.runtimes = RUNTIME_ORDER.filter((id) => selected.has(id));
  return result;
}

// ─── Interactive runtime picker ──────────────────────────────────────────────
// Mirrors gsd-core's promptRuntime (bin/install.js:13190-13292).

/**
 * Build the runtime-selection prompt text. Pure function — no I/O.
 * Exported so tests assert on the rendered prompt instead of grepping source.
 */
function buildRuntimePromptText() {
  const rows = RUNTIME_ORDER.map((id, i) => {
    const rt = RUNTIMES[id];
    return `  ${cyan}${i + 1}${reset}) ${rt.label.padEnd(12)} ${dim}(./${rt.dir})${reset}`;
  });
  rows.push(`  ${cyan}${ALL_RUNTIMES_OPTION}${reset}) All`);
  return `  ${yellow}Which runtime(s) would you like to install n2b for?${reset}\n\n${rows.join('\n')}\n\n  ${dim}Select multiple: 1,3 or 1 3${reset}\n`;
}

/**
 * Parse picker input into a runtime id list. Pure — exported for tests.
 * (gsd-core parseRuntimeInput, bin/install.js:13235-13256)
 *  - comma- and/or whitespace-separated choices
 *  - deduplicated, order preserved
 *  - option 5 ("All") anywhere → every runtime
 *  - empty / nothing valid → ['claude']
 */
function parseRuntimeInput(answer) {
  const input = (answer == null ? '' : String(answer)).trim() || '1';
  const choices = input.split(/[\s,]+/).filter(Boolean);
  if (choices.includes(ALL_RUNTIMES_OPTION)) return RUNTIME_ORDER.slice();

  const selected = [];
  for (const choice of choices) {
    const id = runtimeMap[choice];
    if (id && !selected.includes(id)) selected.push(id);
  }
  return selected.length > 0 ? selected : [DEFAULT_RUNTIME];
}

function promptRuntime(callback) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answered = false;

  // Ctrl-C / EOF before an answer (gsd-core bin/install.js:13277-13283)
  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  console.log(buildRuntimePromptText());
  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    callback(parseRuntimeInput(answer));
  });
}

// ─── Content rewrite rules (non-Claude runtimes only) ────────────────────────
// Pure functions taking (content, rt), applied R1 → R4 then the runtime
// stamp. Claude Code is the source format and never passes through these.
//
// R5 (brand neutralising, gsd-core neutralizeAgentReferences
// bin/install.js:7195-7207) is deliberately NOT implemented: a grep of
// commands/ and n2b/ on 2026-09-05 found zero standalone "Claude" — only
// "Claude Code" product references, which gsd-core preserves as well.

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * R1 — path rewrite: `.claude/` → `.<dir>/`.
 * n2b only uses project-relative forms (`.claude/n2b/...`, `./.claude/n2b/...`);
 * there are no `~/.claude` or `$HOME/.claude` forms. The guarded bare-form
 * regex is gsd-core's (Codex converter, bin/install.js:3846-3850): the
 * lookbehind keeps URLs and already-anchored paths untouched. `./` form first.
 */
function rewritePaths(content, rt) {
  return content
    .replace(/\.\/\.claude\//g, `./${rt.dir}/`)
    .replace(/(?<![A-Za-z0-9_\-./~$])\.claude\//g, `${rt.dir}/`);
}

const INCLUDE_LINE = /^@(\.\/\S+)\s*$/;
const INCLUDE_LIST_INTRO = 'Before doing anything else, read these files in full (they are part of these instructions):';

/**
 * R2 — `@./...` include lines → an explicit read list.
 * Claude Code expands `@path` includes; Codex and Cursor SKILL.md do not, and
 * OpenCode's `@file` handling resolves relative to the commands dir and has
 * bitten gsd-core twice (#2376, #2831). Rather than inherit host-specific `@`
 * semantics, every contiguous block of `@./` lines becomes a prose "read
 * these files" list, and inline `@./.<dir>/` mentions lose their `@`.
 * Paths are listed project-relative (after R1). `@AGENTS.md`-style lines
 * (no `./`) are untouched.
 */
function rewriteIncludes(content, rt) { // eslint-disable-line no-unused-vars
  const lines = content.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!INCLUDE_LINE.test(lines[i])) {
      out.push(lines[i]);
      continue;
    }
    const block = [];
    while (i < lines.length && INCLUDE_LINE.test(lines[i])) {
      block.push(lines[i].match(INCLUDE_LINE)[1].replace(/^\.\//, ''));
      i++;
    }
    i--;
    out.push(INCLUDE_LIST_INTRO);
    for (const p of block) out.push(`- ${p}`);
  }
  return out.join('\n').replace(/@(?=\.\/\.[A-Za-z])/g, '');
}

/**
 * R3 — command namespace. Colon style (`/n2b:<stem>`) is Claude-only.
 *  - hyphen (opencode, cursor): `/n2b:` → `/n2b-`, and `n2b:` → `n2b-`
 *    elsewhere (gsd-core Cursor bin/install.js:2562-2566, OpenCode :7215).
 *  - shell-var (codex): `/n2b:<cmd>` → `$n2b-<cmd>`, using gsd-core's
 *    boundary-guarded form so filesystem paths are never touched
 *    (convertSlashCommandsToCodexSkillMentions, bin/install.js:3800-3822).
 */
function rewriteNamespace(content, rt) {
  if (rt.namespaceStyle === 'colon') return content;
  let out = content;
  if (rt.namespaceStyle === 'shell-var') {
    // Colon-style never appears as a path segment, so no boundary guard needed.
    out = out.replace(new RegExp(`\\/${COMMAND_PREFIX}:([a-z0-9-]+)`, 'gi'),
      (_, cmd) => `$${COMMAND_PREFIX}-${cmd.toLowerCase()}`);
    // Hyphen-style mentions: left boundary (start / whitespace / inline-prose
    // delimiter) and right boundary (not followed by a path separator).
    out = out.replace(new RegExp(`(?<=^|[\\s\`"'([])\\/${COMMAND_PREFIX}-([a-z0-9-]+)(?![a-z0-9/-])`, 'gi'),
      (_, cmd) => `$${COMMAND_PREFIX}-${cmd.toLowerCase()}`);
  }
  // Anything still in colon form (frontmatter `name:`, bare mentions) → hyphen.
  return out.replace(new RegExp(`\\b${COMMAND_PREFIX}:(?=[a-z])`, 'g'), `${COMMAND_PREFIX}-`);
}

/**
 * R4 — tool names in body prose, from the descriptor's `toolNames` map
 * (word-boundary replace). Only `AskUserQuestion` needs mapping for n2b;
 * gsd-core leaves Read/Write/Bash/Agent/WebSearch/WebFetch prose alone on
 * every runtime, and Codex keeps `AskUserQuestion` and maps it in the skill
 * adapter header instead (bin/install.js:3871-3889).
 */
function rewriteToolNames(content, rt) {
  let out = content;
  for (const [from, to] of Object.entries(rt.toolNames || {})) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, 'g'), to);
  }
  return out;
}

/**
 * Runtime stamp: `<!-- n2b-runtime: claude -->` in source (model-profiles.md)
 * is rewritten to the target runtime id so workflows know which host they run
 * on without guessing (gsd-core _stampNonClaudeRuntimeDefaults,
 * bin/install.js:7972-7976).
 */
const RUNTIME_STAMP = /<!-- n2b-runtime: [a-z-]+ -->/g;
function stampRuntime(content, rt) {
  return content.replace(RUNTIME_STAMP, `<!-- n2b-runtime: ${rt.id} -->`);
}

/** Apply every rewrite rule for a non-Claude runtime. Identity for Claude Code. */
function rewriteContent(content, rt) {
  if (rt.id === DEFAULT_RUNTIME) return content;
  let out = rewritePaths(content, rt);
  out = rewriteIncludes(out, rt);
  out = rewriteNamespace(out, rt);
  out = rewriteToolNames(out, rt);
  out = stampRuntime(out, rt);
  return out;
}

// ─── Command writers (filled in by the next commit) ──────────────────────────

/**
 * Reshape a command file into the runtime's command artifact.
 * Identity for Claude Code.
 */
function convertCommand(content, stem, rt) { // eslint-disable-line no-unused-vars
  return content;
}

// ─── Destination layout ──────────────────────────────────────────────────────

/** Path (relative to the runtime root) of the command artifact for <stem>. */
function commandDestPath(stem, rt) {
  switch (rt.commandKind) {
    case 'claude-commands': return `commands/${COMMAND_PREFIX}/${stem}.md`;
    case 'skills':          return `skills/${COMMAND_PREFIX}-${stem}/SKILL.md`;
    case 'flat-commands':   return `commands/${COMMAND_PREFIX}-${stem}.md`;
    default: throw new Error(`Unknown commandKind: ${rt.commandKind}`);
  }
}

/** Human description of the command surface, for the install summary. */
function commandSurfaceLabel(rt) {
  switch (rt.commandKind) {
    case 'claude-commands': return `commands/${COMMAND_PREFIX}/`;
    case 'skills':          return `skills/${COMMAND_PREFIX}-*/SKILL.md`;
    case 'flat-commands':   return `commands/${COMMAND_PREFIX}-*.md`;
    default: throw new Error(`Unknown commandKind: ${rt.commandKind}`);
  }
}

/**
 * Is <rel> (relative to the runtime root) a path n2b owns and may prune?
 * Only the n2b payload tree and n2b's own command artifacts — never a user's
 * other skills/commands living in the same surface directory.
 */
function isOwnedPath(rel, rt) {
  if (rel === PAYLOAD_DIR || rel.startsWith(`${PAYLOAD_DIR}/`)) return true;
  switch (rt.commandKind) {
    case 'claude-commands': return rel.startsWith(`commands/${COMMAND_PREFIX}/`);
    case 'skills':          return new RegExp(`^skills/${COMMAND_PREFIX}-[^/]+/`).test(rel);
    case 'flat-commands':   return new RegExp(`^commands/${COMMAND_PREFIX}-[^/]+\\.md$`).test(rel);
    default: return false;
  }
}

// ─── Filesystem helpers ──────────────────────────────────────────────────────

/** All files under <dir>, as sorted '/'-separated paths relative to <dir>. */
function collectFiles(dir, base = '') {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...collectFiles(path.join(dir, entry.name), rel));
    else files.push(rel);
  }
  return files.sort();
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

// ─── Install pipeline: produce map → write → prune ───────────────────────────

/** Read the source tree once: six commands + the n2b payload. */
function readSource(projectRoot) {
  const commandsDir = path.join(projectRoot, 'commands', COMMAND_PREFIX);
  const payloadDir = path.join(projectRoot, PAYLOAD_DIR);
  const commands = collectFiles(commandsDir)
    .filter((rel) => rel.endsWith('.md') && !rel.includes('/'))
    .map((rel) => ({ stem: rel.slice(0, -3), content: fs.readFileSync(path.join(commandsDir, rel)) }));
  const payload = collectFiles(payloadDir)
    .map((rel) => ({ rel, content: fs.readFileSync(path.join(payloadDir, rel)) }));
  return { commands, payload };
}

/**
 * Build the full { destRel → bytes } map for one runtime. Pure given the
 * source; exported for tests. For Claude Code the bytes are the source bytes
 * untouched (gsd-core: Claude's converter is null) — byte-identical output.
 */
function buildInstallMap(source, rt) {
  const map = new Map();
  const isClaude = rt.id === DEFAULT_RUNTIME;
  for (const { stem, content } of source.commands) {
    const rel = `commands/${COMMAND_PREFIX}/${stem}.md`;
    const out = isClaude
      ? content
      : convertCommand(rewriteContent(content.toString('utf8'), rt), stem, rt);
    map.set(commandDestPath(stem, rt), out);
  }
  for (const { rel, content } of source.payload) {
    const out = isClaude
      ? content
      : rewriteContent(content.toString('utf8'), rt);
    map.set(`${PAYLOAD_DIR}/${rel}`, out);
  }
  return map;
}

/** Write the map under <root>, prune stale n2b-owned files, return counts. */
function installRuntime(source, targetDir, rt) {
  const root = path.join(targetDir, rt.dir);
  const map = buildInstallMap(source, rt);

  let commandFiles = 0;
  let payloadFiles = 0;
  for (const [rel, content] of map) {
    const dest = path.join(root, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    if (rel.startsWith(`${PAYLOAD_DIR}/`)) payloadFiles++; else commandFiles++;
  }

  let removed = 0;
  for (const rel of collectFiles(root)) {
    if (isOwnedPath(rel, rt) && !map.has(rel)) {
      fs.unlinkSync(path.join(root, rel));
      removed++;
    }
  }
  removeEmptyDirs(path.join(root, PAYLOAD_DIR));
  // Prune empty command dirs we own; leave the shared surface dir itself alone.
  for (const rel of new Set([...map.keys()].map((k) => path.posix.dirname(k)))) {
    if (rel !== '.' && isOwnedPath(`${rel}/`, rt)) removeEmptyDirs(path.join(root, rel));
  }

  return { root, commandFiles, payloadFiles, removed };
}

function printRuntimeSummary(rt, stats) {
  const total = stats.commandFiles + stats.payloadFiles;
  console.log(`  ${cyan}${rt.label}${reset} → ${rt.dir}/`);
  console.log(`    ${green}synced${reset}  commands/${COMMAND_PREFIX}/ → ${rt.dir}/${commandSurfaceLabel(rt)}  ${dim}(${stats.commandFiles} files)${reset}`);
  console.log(`    ${green}synced${reset}  ${PAYLOAD_DIR}/ → ${rt.dir}/${PAYLOAD_DIR}/  ${dim}(${stats.payloadFiles} files)${reset}`);
  let line = `    ${green}Installed${reset} ${total} files into ${rt.dir}/`;
  if (stats.removed > 0) line += `  ${yellow}(removed ${stats.removed} stale)${reset}`;
  console.log(line);
  console.log(`    ${dim}Next:${reset} ${rt.nextStep}`);
  console.log();
}

function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(usageText());
    process.exit(0);
  }
  if (parsed.error) {
    console.error(`${yellow}${parsed.error}${reset}\n`);
    console.error(usageText());
    process.exit(1);
  }

  const targetDir = parsed.targetDir || process.cwd();
  const projectRoot = path.resolve(__dirname, '..');

  console.log(`\n${cyan}n2b${reset} installer`);
  console.log(`  target: ${dim}${targetDir}${reset}`);
  console.log();

  const run = (runtimeIds) => {
    const source = readSource(projectRoot);
    for (const id of runtimeIds) {
      const rt = RUNTIMES[id];
      printRuntimeSummary(rt, installRuntime(source, targetDir, rt));
    }
  };

  if (parsed.runtimes.length > 0) {
    run(parsed.runtimes);
  } else if (!process.stdin.isTTY) {
    // gsd-core bin/install.js:14227-14229
    console.log(`  ${dim}Non-interactive terminal detected, defaulting to Claude Code install${reset}\n`);
    run([DEFAULT_RUNTIME]);
  } else {
    promptRuntime(run);
  }
}

module.exports = {
  RUNTIMES,
  RUNTIME_ORDER,
  DEFAULT_RUNTIME,
  runtimeMap,
  ALL_RUNTIMES_OPTION,
  usageText,
  parseArgs,
  buildRuntimePromptText,
  parseRuntimeInput,
  rewritePaths,
  rewriteIncludes,
  rewriteNamespace,
  rewriteToolNames,
  stampRuntime,
  rewriteContent,
  INCLUDE_LIST_INTRO,
  convertCommand,
  commandDestPath,
  isOwnedPath,
  collectFiles,
  readSource,
  buildInstallMap,
  installRuntime,
};

if (require.main === module) main();
