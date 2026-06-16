#!/usr/bin/env node
/* ----------------------------------------------------------------
   Changelog bot.

   Turns the commits since the last release into a Discord-ready
   changelog in the house format, then (optionally) posts it to a
   webhook and stamps a new version tag.

   Usage:
     node scripts/changelog-bot.mjs            # print the changelog for the next release
     node scripts/changelog-bot.mjs --write    # also prepend it to CHANGELOG.md
     node scripts/changelog-bot.mjs --post     # also POST to CHANGELOG_WEBHOOK (Discord)
     node scripts/changelog-bot.mjs --tag      # also create + push the new vX.Y tag

   Env:
     CHANGELOG_WEBHOOK   Discord webhook URL for the changelog/announcements channel
------------------------------------------------------------------- */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const args = new Set(process.argv.slice(2));
const sh = (cmd) => execSync(cmd, { encoding: "utf8" }).trim();
const trysh = (cmd) => { try { return sh(cmd); } catch { return ""; } };

/* ---- figure out the version + commit range ---- */
const lastTag = trysh("git tag --list 'v*' --sort=-v:refname | head -n1");
const range = lastTag ? `${lastTag}..HEAD` : "HEAD";

function bump(tag) {
  const m = /^v(\d+)\.(\d+)/.exec(tag || "");
  if (!m) return "v1.0";
  return `v${m[1]}.${Number(m[2]) + 1}`;
}
const version = bump(lastTag);
const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/* ---- collect + classify commits ---- */
const raw = trysh(`git log ${range} --no-merges --pretty=format:%s`);
const subjects = raw ? raw.split("\n").map((s) => s.trim()).filter(Boolean) : [];

const SKIP = /^(merge|chore|docs?|ci|build|test|bump|release|changelog|wip|initial commit)\b|\[skip changelog\]/i;
const NEW = /^(add|new|feat|introduce|create|launch|implement|support|enable|ship)\b|^✨/i;
const FIX = /^(fix|bug|patch|resolve|correct|hotfix|repair)\b|^🐞|^🐛/i;
const IMP = /^(improve|update|enhance|refine|polish|tweak|refactor|perf|optimi|redesign|rework|revamp|better|style|speed|replace|rename|move|clean|simplif)\b|^🔧/i;

function pretty(s) {
  let t = s.replace(/^(\w+)(\([^)]+\))?:\s*/, ""); // strip conventional "feat(scope): "
  t = t.replace(/\s+\(#\d+\)$/, "");               // strip trailing "(#123)"
  t = t.replace(/[.\s]+$/, "");                     // strip trailing period/space
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const buckets = { "New": [], "Improved": [], "Fixed": [] };
for (const s of subjects) {
  if (SKIP.test(s)) continue;
  const where = FIX.test(s) ? "Fixed" : NEW.test(s) ? "New" : IMP.test(s) ? "Improved" : "Improved";
  buckets[where].push(pretty(s));
}

/* ---- render in the house format (omit empty sections) ---- */
const sectionEmoji = { "New": "✨", "Improved": "🔧", "Fixed": "🐞" };
const blocks = [];
for (const name of ["New", "Improved", "Fixed"]) {
  const items = buckets[name];
  if (!items.length) continue;
  blocks.push(`${sectionEmoji[name]} **${name}**\n` + items.map((i) => `- ${i}`).join("\n"));
}

if (!blocks.length) {
  console.error("No changelog-worthy commits since " + (lastTag || "the start") + " — nothing to do.");
  process.exit(0);
}

const DISCORD_INVITE = process.env.DISCORD_INVITE || "https://discord.gg/f4rhKFa6MD";
const message =
  `**${version} — ${date}**\n\n` +
  blocks.join("\n\n") +
  `\n\nFull details on bigger releases go in **#announcements**.` +
  `\n💬 Community & support: ${DISCORD_INVITE}`;

console.log(message);

/* ---- optional: write to CHANGELOG.md ---- */
if (args.has("--write")) {
  const path = "CHANGELOG.md";
  const prev = existsSync(path) ? readFileSync(path, "utf8") : "# Changelog\n";
  const header = prev.startsWith("# Changelog") ? "# Changelog\n" : "";
  const body = prev.replace(/^# Changelog\n/, "");
  writeFileSync(path, `${header}\n${message}\n\n---\n${body}`);
  console.error(`\n→ wrote ${path}`);
}

/* ---- optional: post to Discord as a rich embed ---- */
if (args.has("--post")) {
  const url = process.env.CHANGELOG_WEBHOOK;
  if (!url) {
    console.error("\n→ CHANGELOG_WEBHOOK not set; skipping Discord post.");
  } else {
    const embed = {
      title: `${version} — ${date}`,
      description: (blocks.join("\n\n") + `\n\n💬 **Community & support:** ${DISCORD_INVITE}`).slice(0, 4000),
      color: Number(process.env.EMBED_COLOR || 0xc9a84c),
      footer: { text: "Full details on bigger releases go in #announcements" },
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }),
    });
    console.error(res.ok ? "\n→ posted to Discord ✓" : `\n→ Discord post failed: ${res.status}`);
  }
}

/* ---- optional: tag the release ---- */
if (args.has("--tag")) {
  try {
    sh(`git tag ${version}`);
    trysh(`git push origin ${version}`);
    console.error(`\n→ tagged ${version}`);
  } catch (e) {
    console.error(`\n→ could not tag ${version}: ${e.message}`);
  }
}
