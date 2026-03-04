import { NpmLockfileParser } from "../../src/core/lockfile/npm";
import * as path from "path";
import * as fs from "fs";

describe("NPM lockfile parsing", () => {
  let parser: NpmLockfileParser;

  beforeEach(() => {
    parser = new NpmLockfileParser();
  });

  it("should parse an empty project gracefully", async () => {
    const dir = path.join(__dirname, "..", "fixtures", "fake-npm");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "fake" }),
    );
    fs.writeFileSync(
      path.join(dir, "package-lock.json"),
      JSON.stringify({
        name: "fake",
        version: "1.0.0",
        lockfileVersion: 2,
        packages: {
          "": { name: "fake", version: "1.0.0" },
        },
      }),
    );

    const result = await parser.parse(dir);
    expect(result).toHaveLength(0);
  });

  it("should detect preinstall and bin in a dependency", async () => {
    const dir = path.join(__dirname, "..", "fixtures", "fake-npm-hooks");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({
        name: "fake-hooks",
        dependencies: { "bad-pkg": "^1.0.0" },
      }),
    );

    fs.writeFileSync(
      path.join(dir, "package-lock.json"),
      JSON.stringify({
        name: "fake-hooks",
        version: "1.0.0",
        lockfileVersion: 2,
        packages: {
          "": {
            name: "fake-hooks",
            version: "1.0.0",
            dependencies: { "bad-pkg": "^1.0.0" },
          },
          "node_modules/bad-pkg": { version: "1.0.0" },
        },
      }),
    );

    const badPkgDir = path.join(dir, "node_modules", "bad-pkg");
    fs.mkdirSync(badPkgDir, { recursive: true });
    fs.writeFileSync(
      path.join(badPkgDir, "package.json"),
      JSON.stringify({
        name: "bad-pkg",
        version: "1.0.0",
        scripts: {
          preinstall: "echo 'malicious'",
        },
        bin: {
          "bad-bin": "./bad.js",
        },
      }),
    );

    const result = await parser.parse(dir);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("bad-pkg");
    expect(result[0].direct).toBe(true);
    expect(result[0].scripts.preinstall).toBe("echo 'malicious'");
    expect(result[0].bins).toContain("bad-bin");
    expect(result[0].flags.hasBin).toBe(true);
    expect(result[0].flags.hasPrepare).toBe(false);
  });
});
