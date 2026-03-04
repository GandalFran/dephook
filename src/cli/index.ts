import { Command } from "commander";
import { scanCommand } from "./commands/scan";
import { diffCommand } from "./commands/diff";

export const run = async (argv: string[]): Promise<void> => {
  const program = new Command();

  program
    .name("dephook")
    .description("Analyze project dependencies for install and prepare hooks")
    .version("0.1.0");

  program.addCommand(scanCommand, { isDefault: true });
  program.addCommand(diffCommand);

  await program.parseAsync(argv);
};
