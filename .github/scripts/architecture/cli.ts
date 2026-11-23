import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { ARCHITECTURE_BASELINE, isOurPath } from "../settings.ts";
import { type BaselineEntry, isScanned, judgeTree, treeFails } from "./index.ts";

try {
  const paths = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split("\n").filter((path) => isScanned(path) || isOurPath(path));
  const files = paths.map((path) => ({ path, source: readFileSync(path, "utf8") }));
  const baseline: BaselineEntry[] = JSON.parse(readFileSync(ARCHITECTURE_BASELINE, "utf8")).entries;
  const verdict = judgeTree(files, baseline);
  for (const id of verdict.fresh) console.log(`NEW ${id}`);
  for (const id of verdict.stale) console.log(`STALE ${id} (fixed; remove it from ${ARCHITECTURE_BASELINE})`);
  for (const error of verdict.long) console.log(`LONG ${error}`);
  const { scanned, found, fresh, stale, long } = verdict;
  console.log(`${scanned} files, ${found} known or new violations, ${fresh.length} new, ${stale.length} stale, ${long.length} too long`);
  process.exitCode = treeFails(verdict) ? 1 : 0;
} catch (error) {
  console.error((error as Error).message);
  process.exitCode = 2;
}
