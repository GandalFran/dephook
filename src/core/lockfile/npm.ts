import * as fs from "fs";
import * as path from "path";
import { DetectedPackageHook } from "../../types/result";
import { ILockfileParser } from "../parser";
import { logger } from "../../utils/logger";

export class NpmLockfileParser implements ILockfileParser {
  private targetHooks = ["preinstall", "install", "postinstall", "prepare"];

  public async parse(projectPath: string): Promise<DetectedPackageHook[]> {
    const lockfilePath = path.join(projectPath, "package-lock.json");
    if (!fs.existsSync(lockfilePath)) {
      throw new Error(`package-lock.json not found in ${projectPath}`);
    }

    const lockfile = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
    const items: DetectedPackageHook[] = [];
    const packages = lockfile.packages || {};
    const isDirectDeps = new Set<string>();

    if (packages[""]) {
      const rootDeps = {
        ...packages[""].dependencies,
        ...packages[""].devDependencies,
      };
      Object.keys(rootDeps).forEach((dep) => isDirectDeps.add(dep));
    }

    for (const [pkgPath, pkgInfo] of Object.entries(packages)) {
      if (!pkgPath || pkgPath === "") continue;

      const nameMatch = pkgPath.match(
        /node_modules\/((?:@[^/]+\/)?(?:[^/]+))$/,
      );
      const name = nameMatch ? nameMatch[1] : pkgPath;

      const absolutePkgPath = path.join(projectPath, pkgPath);
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
        const isDirect =
          pkgPath === `node_modules/${name}` && isDirectDeps.has(name);

        const chainParts = pkgPath.split("node_modules/").filter((x) => x);
        const reasonChain = [
          path.basename(projectPath),
          ...chainParts.map((p) => p.replace(/\/$/, "")),
        ];

        if (Object.keys(hooksFound).length > 0 || bins.length > 0) {
          items.push({
            name,
            version: (pkgInfo as any).version || null,
            scripts: hooksFound,
            bins,
            direct: isDirect,
            reasonChain,
            sourcePath: absolutePkgPath,
            packageManager: "npm",
            flags: {
              hasPrepare: !!hooksFound["prepare"],
              hasBin: bins.length > 0,
              multipleHooks: Object.keys(hooksFound).length > 1,
            },
          });
        }
      }
    }

    return items;
  }
}
