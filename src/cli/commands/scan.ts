import { Command } from "commander";
import { Scanner } from "../../core/scanner";
import { logger } from "../../utils/logger";
import { TerminalFormatter } from "../../output/terminal";
import { JsonFormatter } from "../../output/json";
import { MarkdownFormatter } from "../../output/markdown";
import { Config } from "../../types/config";
import { IOutputFormatter } from "../../output/formatter";

export const scanCommand = new Command("scan")
  .description("Scan the project for dependency hooks")
  .option("--json", "Output as JSON")
  .option("--md", "Output as Markdown")
  .option("--compact", "Output in compact format")
  .option("--no-color", "Disable styling")
  .option("--debug", "Enable debug logging")
  .action(async (options) => {
    try {
      let configOutput: Config["output"] = "terminal";
      if (options.json) configOutput = "json";
      else if (options.md) configOutput = "md";

      if (options.debug) {
        logger.setLevel(0); // DEBUG
      } else if (configOutput === "json") {
        logger.setLevel(3); // ERROR
      }

      logger.info("Starting scan command...");
      const scanner = new Scanner();
      const result = await scanner.scanProject(process.cwd());

      let formatter: IOutputFormatter;

      if (configOutput === "json") {
        formatter = new JsonFormatter();
        console.log(formatter.format(result));
      } else if (configOutput === "md") {
        formatter = new MarkdownFormatter();
        console.log(formatter.format(result));
      } else {
        formatter = new TerminalFormatter();
        console.log(
          (formatter as TerminalFormatter).format(result, {
            compact: options.compact,
            color: !options.noColor,
          }),
        );
      }
    } catch (err: any) {
      logger.error("Scan failed:", err.message);
      process.exit(1);
    }
  });
