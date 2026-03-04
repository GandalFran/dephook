import * as fs from "fs";
import * as path from "path";
import { ScanResult, DetectedPackageHook } from "../types/result";
import { NpmLockfileParser } from "./lockfile/npm";
import { PnpmLockfileParser } from "./lockfile/pnpm";
import { logger } from "../utils/logger";
import { ILockfileParser } from "./parser";

export class Scanner {
  public async scanProject(projectPath: string): Promise<ScanResult> {
    const npmLockPath = path.join(projectPath, "package-lock.json");
    const pnpmLockPath = path.join(projectPath, "pnpm-lock.yaml");

    let packageManager = "unknown";
    let items: DetectedPackageHook[] = [];
    const warnings: string[] = [];

    try {
      logger.info(`Scanning project at ${projectPath}`);
      const pkgJson = JSON.parse(
        fs.readFileSync(path.join(projectPath, "package.json"), "utf8"),
      );
      const projectName = pkgJson.name || path.basename(projectPath);
      logger.debug(`Project name determined as: ${projectName}`);

      let parser: ILockfileParser | null = null;

      if (fs.existsSync(pnpmLockPath)) {
        packageManager = "pnpm";
        logger.info("Detected pnpm lockfile.");
        parser = new PnpmLockfileParser();
      } else if (fs.existsSync(npmLockPath)) {
        packageManager = "npm";
        logger.info("Detected npm lockfile.");
        parser = new NpmLockfileParser();
      } else {
        logger.warn(
          "No lockfile found. Falling back to simple node_modules scan.",
        );
        warnings.push(
          "No lockfile found. Falling back to simple node_modules scan. (Not fully implemented yet, results might be partial)",
        );
      }

      if (parser) {
        logger.debug(`Starting parse with ${packageManager} parser...`);
        items = await parser.parse(projectPath);
        logger.info(`Parsed ${items.length} relevant packages.`);
      }

      const summary = {
        totalPackagesWithHooks: items.length,
        totalDirect: items.filter((i) => i.direct).length,
        totalTransitive: items.filter((i) => !i.direct).length,
        totalWithBin: items.filter((i) => i.flags.hasBin).length,
        totalPrepare: items.filter((i) => i.flags.hasPrepare).length,
      };

      logger.debug("Generating scan result object...", summary);

      return {
        projectName,
        projectPath,
        packageManagerDetected: packageManager,
        scannedAt: new Date().toISOString(),
        summary,
        items: items.sort((a, b) => {
          if (a.direct && !b.direct) return -1;
          if (!a.direct && b.direct) return 1;
          return a.name.localeCompare(b.name);
        }),
        warnings,
      };
    } catch (error: any) {
      logger.error(`Failed to scan project: ${error.message}`);
      throw new Error(`Failed to scan project: ${error.message}`);
    }
  }
}
