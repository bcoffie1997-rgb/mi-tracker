#!/usr/bin/env node
// Reads `git log` and writes lib/changelog.generated.json so the /changelog
// page can render commits without shelling out at runtime. Wired to prebuild +
// predev in package.json. Safe to run from any cwd inside the repo.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SEP   = "<<<E>>>";   // line separator
const FIELD = "<<<F>>>";   // field separator inside a line

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_PATH  = resolve(REPO_ROOT, "lib/changelog.generated.json");

function runGitLog() {
  const fmt = ["%H", "%an", "%aI", "%s", "%b"].join(FIELD);
  // --no-merges hides merge commits, which are usually noise in a changelog.
  // We cap at 500 entries so the JSON stays small even on long-lived repos.
  return execSync(
    `git log --no-merges -n 500 --pretty=format:"${fmt}${SEP}"`,
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
}

function parse(raw) {
  return raw
    .split(SEP)
    .map((s) => s.replace(/^\s+|\s+$/g, ""))
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, subject, ...rest] = line.split(FIELD);
      const body = rest.join(FIELD).trim();
      return {
        hash: (hash || "").slice(0, 7),
        author: author || "",
        date: date || "",
        subject: subject || "",
        body,
      };
    });
}

function main() {
  let entries = [];
  try {
    entries = parse(runGitLog());
  } catch (err) {
    console.warn(`[changelog] git log failed (${err.message}); writing empty file.`);
  }
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(entries, null, 2) + "\n");
  console.log(`[changelog] wrote ${entries.length} entries → ${OUT_PATH}`);
}

main();
