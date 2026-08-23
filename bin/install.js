#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const green = '\x1b[32m';
const cyan = '\x1b[36m';
const yellow = '\x1b[33m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

const args = process.argv.slice(2);
const targetFlag = args.indexOf('--target');
let targetDir;
if (targetFlag !== -1) {
  if (!args[targetFlag + 1]) {
    console.error('Usage: n2b [--target <directory>]   (defaults to the current directory)');
    process.exit(1);
  }
  targetDir = path.resolve(args[targetFlag + 1]);
} else {
  targetDir = process.cwd();
}

const projectRoot = path.resolve(__dirname, '..');
const targetRoot = path.join(targetDir, '.claude');

const copies = [
  { src: 'commands/n2b', dest: 'commands/n2b' },
  { src: 'n2b',          dest: 'n2b' },
];

function collectFiles(dir, base) {
  const files = new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      for (const f of collectFiles(path.join(dir, entry.name), rel)) files.add(f);
    } else {
      files.add(rel);
    }
  }
  return files;
}

function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) removeEmptyDirs(path.join(dir, entry.name));
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}

function syncDir(src, dest) {
  let copied = 0;
  let removed = 0;

  // Copy source → dest
  fs.mkdirSync(dest, { recursive: true });
  const srcFiles = collectFiles(src, '');

  for (const rel of srcFiles) {
    const srcPath = path.join(src, rel);
    const destPath = path.join(dest, rel);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }

  // Remove dest files that no longer exist in source
  if (fs.existsSync(dest)) {
    const destFiles = collectFiles(dest, '');
    for (const rel of destFiles) {
      if (!srcFiles.has(rel)) {
        fs.unlinkSync(path.join(dest, rel));
        removed++;
      }
    }
    removeEmptyDirs(dest);
  }

  return { copied, removed };
}

console.log(`\n${cyan}n2b${reset} installer`);
console.log(`  target: ${dim}${targetDir}${reset}`);
console.log();

let totalFiles = 0;
let totalRemoved = 0;

for (const { src, dest } of copies) {
  const srcPath = path.join(projectRoot, src);
  const destPath = path.join(targetRoot, dest);

  if (!fs.existsSync(srcPath)) {
    console.log(`  skip  ${dim}${src}/${reset} (not found)`);
    continue;
  }

  const { copied, removed } = syncDir(srcPath, destPath);
  totalFiles += copied;
  totalRemoved += removed;
  let line = `  ${green}synced${reset}  ${src}/ → .claude/${dest}/  ${dim}(${copied} files)${reset}`;
  if (removed > 0) line += `  ${yellow}removed ${removed} stale${reset}`;
  console.log(line);
}

console.log(`\n${green}Installed${reset} ${totalFiles} files into .claude/`);
if (totalRemoved > 0) console.log(`${yellow}Cleaned${reset}  ${totalRemoved} stale files`);
console.log();
