import { Command } from "commander";
import { logger } from "../../utils/logger";
import * as fs from "fs";
import { ScanResult, DetectedPackageHook } from "../../types/result";
import chalk from "chalk";

export const diffCommand = new Command("diff")
  .description(
    "Compare two scan results (JSON) for newly added hooks or packages",
  )
  .requiredOption("--from <file>", "Baseline scan result JSON file")
  .requiredOption("--to <file>", "Target scan result JSON file")
  .action(async (options) => {
    try {
      if (!fs.existsSync(options.from)) {
        logger.error(`File not found: ${options.from}`);
        process.exit(1);
      }
      if (!fs.existsSync(options.to)) {
        logger.error(`File not found: ${options.to}`);
        process.exit(1);
      }

      const fromResult: ScanResult = JSON.parse(
        fs.readFileSync(options.from, "utf-8"),
      );
      const toResult: ScanResult = JSON.parse(
        fs.readFileSync(options.to, "utf-8"),
      );

      const fromMap = new Map<string, DetectedPackageHook>();
      fromResult.items.forEach((i) => fromMap.set(`${i.name}@${i.version}`, i));

      const added: DetectedPackageHook[] = [];
      const changed: {
        name: string;
        old: DetectedPackageHook;
        new: DetectedPackageHook;
      }[] = [];

      toResult.items.forEach((newItem) => {
        const key = `${newItem.name}@${newItem.version}`;
        const oldItem = fromMap.get(key);
        if (!oldItem) {
          added.push(newItem);
        } else {
          // Check if hooks or bins changed
          const oldScripts = JSON.stringify(oldItem.scripts);
          const newScripts = JSON.stringify(newItem.scripts);
          const oldBins = JSON.stringify(oldItem.bins);
          const newBins = JSON.stringify(newItem.bins);

          if (oldScripts !== newScripts || oldBins !== newBins) {
            changed.push({ name: newItem.name, old: oldItem, new: newItem });
          }
        }
      });

      console.log(chalk.bold.blue("🔍 dephook diff results\n"));

      if (added.length === 0 && changed.length === 0) {
        console.log(
          chalk.green(
            "✅ No new dependencies with hooks or bins detected between the two states.",
          ),
        );
        return;
      }

      if (added.length > 0) {
        console.log(
          chalk.bold.red(
            `🚨 Newly Added Packages with Hooks/Bins (${added.length}):\n`,
          ),
        );
        added.forEach((item) => {
          const typeTag = item.direct
            ? chalk.yellow("[🎯 DIRECT]")
            : chalk.dim("[🌊 TRANSITIVE]");
          console.log(
            `${typeTag} 📦 ${chalk.bold(item.name)}@${item.version || "unknown"}`,
          );
          if (Object.keys(item.scripts).length > 0) {
            console.log(`  🪝 Hooks: ${Object.keys(item.scripts).join(", ")}`);
          }
          if (item.bins.length > 0) {
            console.log(`  ⚙️ Bins:  ${item.bins.join(", ")}`);
          }
          console.log(
            chalk.dim(`  🔗 Reason: ${item.reasonChain.join(" -> ")}\n`),
          );
        });
      }

      if (changed.length > 0) {
        console.log(
          chalk.bold.yellow(
            `⚠️ Packages with Modified Hooks/Bins (${changed.length}):\n`,
          ),
        );
        changed.forEach((change) => {
          console.log(`📦 ${chalk.bold(change.name)}`);
          console.log(
            chalk.dim(`  Old Hooks: `) +
              chalk.red(Object.keys(change.old.scripts).join(", ") || "none"),
          );
          console.log(
            chalk.dim(`  New Hooks: `) +
              chalk.green(Object.keys(change.new.scripts).join(", ") || "none"),
          );
          console.log(`\n`);
        });
      }

      // Throw exit code 1 so it can be used in CI to break builds
      process.exit(1);
    } catch (err: any) {
      logger.error("Diff failed:", err.message);
      process.exit(1);
    }
  });
