import * as fs from "fs";
import * as path from "path";
import * as yaml from "yaml";
import { DetectedPackageHook } from "../../types/result";
import { ILockfileParser } from "../parser";
import { logger } from "../../utils/logger";

export class PnpmLockfileParser implements ILockfileParser {
  private targetHooks = ["preinstall", "install", "postinstall", "prepare"];

  public async parse(projectPath: string): Promise<DetectedPackageHook[]> {
    const lockfilePath = path.join(projectPath, "pnpm-lock.yaml");
    if (!fs.existsSync(lockfilePath)) {
      throw new Error(`pnpm-lock.yaml not found in ${projectPath}`);
    }

    const lockfile = yaml.parse(fs.readFileSync(lockfilePath, "utf8"));
    const items: DetectedPackageHook[] = [];

    const importers = lockfile.importers || { ".": lockfile };
    const packages = lockfile.packages || {};

    const isDirectDeps = new Set<string>();

    for (const importer of Object.values(importers) as any[]) {
      if (importer.dependencies)
        Object.keys(importer.dependencies).forEach((d) => isDirectDeps.add(d));
      if (importer.devDependencies)
        Object.keys(importer.devDependencies).forEach((d) =>
          isDirectDeps.add(d),
        );
    }

    for (const [pkgPath, pkgInfo] of Object.entries(packages)) {
      let name = "";

      const match = pkgPath.match(/^\/(@?[^/]+(?:\/[^/]+)?)(?:@|\/)/);
      if (match) {
        name = match[1];
      } else {
        name = pkgPath.split("@")[0];
        if (name.startsWith("/")) name = name.substring(1);
      }

      const absolutePkgPath = path.join(projectPath, "node_modules", name);
      const realPkgJsonPath = path.join(absolutePkgPath, "package.json");

      let scripts: Record<string, string> = {};
      let bins: string[] = [];

      if (fs.existsSync(realPkgJsonPath)) {
        try {
          const realPkg = JSON.parse(fs.readFileSync(realPkgJsonPath, "utf8"));
          scripts = realPkg.scripts || {};
          if (typeof realPkg.bin === "string") {
            bins.push(name);
          } else if (typeof realPkg.bin === "object") {
            bins = Object.keys(realPkg.bin);
          }
        } catch {
          logger.debug(`Failed to parse real package.json for ${name}`);
        }
      }

      const hooksFound: Record<string, string> = {};
      for (const hook of this.targetHooks) {
        if (scripts[hook]) {
          hooksFound[hook] = scripts[hook];
        }
      }

      if (Object.keys(hooksFound).length > 0 || bins.length > 0) {
        const isDirect = isDirectDeps.has(name);
        const reasonChain = [path.basename(projectPath), name];

        items.push({
          name,
          version: (pkgInfo as any).version || null,
          scripts: hooksFound,
          bins,
          direct: isDirect,
          reasonChain,
          sourcePath: absolutePkgPath,
          packageManager: "pnpm",
          flags: {
            hasPrepare: !!hooksFound["prepare"],
            hasBin: bins.length > 0,
            multipleHooks: Object.keys(hooksFound).length > 1,
          },
        });
      }
    }

    const uniqueItems = items.filter(
      (item, i, a) => a.findIndex((t) => t.name === item.name) === i,
    );

    return uniqueItems;
  }
}
