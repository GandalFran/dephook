import chalk from "chalk";
import { ScanResult } from "../types/result";
import { IOutputFormatter } from "./formatter";

export interface TerminalOptions {
  compact?: boolean;
  color?: boolean;
}

export class TerminalFormatter implements IOutputFormatter {
  public format(result: ScanResult, options: TerminalOptions = {}): string {
    const { summary, items } = result;
    const isColor = options.color !== false;

    const c = {
      title: isColor ? chalk.bold.blue : (s: string) => s,
      success: isColor ? chalk.green : (s: string) => s,
      warn: isColor ? chalk.yellow : (s: string) => s,
      error: isColor ? chalk.red : (s: string) => s,
      dim: isColor ? chalk.dim : (s: string) => s,
      pkg: isColor ? chalk.bold : (s: string) => s,
    };

    let output = c.title("🔍 dephook results\n") + "\n";

    if (items.length === 0) {
      output += c.success("No package with install/prepare hooks found!\n");
      return output;
    }

    items.forEach((item) => {
      const typeTag = item.direct
        ? c.warn("[🎯 DIRECT]")
        : c.dim("[🌊 TRANSITIVE]");
      const binTag = item.flags.hasBin ? c.title("[⚙️ BIN]") : "";

      output += `${typeTag} 📦 ${c.pkg(item.name)}@${item.version || "unknown"} ${binTag}\n`;

      if (Object.keys(item.scripts).length > 0) {
        output += `  🪝 Hooks: ${Object.keys(item.scripts).join(", ")}\n`;
      }

      if (item.bins.length > 0) {
        output += `  ⚙️ Bins:  ${item.bins.join(", ")}\n`;
      }

      output += c.dim(`  🔗 Reason: ${item.reasonChain.join(" -> ")}\n`);
      output += "\n";
    });

    output += c.title("📊 Summary\n");
    output += `🚨 Packages with install/prepare hooks: ${summary.totalPackagesWithHooks}\n`;
    output += `- 🎯 Direct:     ${summary.totalDirect}\n`;
    output += `- 🌊 Transitive: ${summary.totalTransitive}\n`;
    output += `- ⚙️ With bins:  ${summary.totalWithBin}\n`;

    return output;
  }
}
