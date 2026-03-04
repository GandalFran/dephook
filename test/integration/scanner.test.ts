import { Scanner } from "../../src/core/scanner";
import * as path from "path";
import * as fs from "fs";

describe("Scanner Integration", () => {
  let scanner: Scanner;

  beforeEach(() => {
    scanner = new Scanner();
  });

  it("should warn about fallback missing lockfile", async () => {
    const dir = path.join(__dirname, "..", "fixtures", "no-lockfile");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "missing-locks" }),
    );

    // ensure no lockfiles exist
    const npmLock = path.join(dir, "package-lock.json");
    if (fs.existsSync(npmLock)) fs.unlinkSync(npmLock);

    const pnpmLock = path.join(dir, "pnpm-lock.yaml");
    if (fs.existsSync(pnpmLock)) fs.unlinkSync(pnpmLock);

    const result = await scanner.scanProject(dir);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("No lockfile found");
    expect(result.packageManagerDetected).toBe("unknown");
  });

  it("should process an npm project with multi-hooks via scanner", async () => {
    const dir = path.join(__dirname, "..", "fixtures", "integration-npm");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "int-npm" }),
    );

    fs.writeFileSync(
      path.join(dir, "package-lock.json"),
      JSON.stringify({
        name: "int-npm",
        version: "1.0.0",
        lockfileVersion: 2,
        packages: {
          "": { name: "int-npm", version: "1.0.0" },
          "node_modules/complex-pkg": { version: "2.5.0" },
        },
      }),
    );

    const complexPkgDir = path.join(dir, "node_modules", "complex-pkg");
    fs.mkdirSync(complexPkgDir, { recursive: true });
    fs.writeFileSync(
      path.join(complexPkgDir, "package.json"),
      JSON.stringify({
        name: "complex-pkg",
        version: "2.5.0",
        scripts: {
          install: "make block",
          postinstall: "node install.js",
        },
      }),
    );

    const result = await scanner.scanProject(dir);

    expect(result.packageManagerDetected).toBe("npm");
    expect(result.summary.totalPackagesWithHooks).toBe(1);

    const pkg = result.items[0];
    expect(pkg.name).toBe("complex-pkg");
    expect(pkg.flags.multipleHooks).toBe(true);
    expect(pkg.scripts["install"]).toBeTruthy();
    expect(pkg.scripts["postinstall"]).toBeTruthy();
  });
});
