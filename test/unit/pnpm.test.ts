import { PnpmLockfileParser } from "../../src/core/lockfile/pnpm";
import * as path from "path";
import * as fs from "fs";
import * as yaml from "yaml";

describe("PNPM lockfile parsing", () => {
  let parser: PnpmLockfileParser;

  beforeEach(() => {
    parser = new PnpmLockfileParser();
  });

  it("should parse an empty project gracefully", async () => {
    const dir = path.join(__dirname, "..", "fixtures", "fake-pnpm");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "fake" }),
    );
    fs.writeFileSync(
      path.join(dir, "pnpm-lock.yaml"),
      yaml.stringify({
        lockfileVersion: "6.0",
        importers: {
          ".": {
            dependencies: {},
          },
        },
        packages: {},
      }),
    );

    const result = await parser.parse(dir);
    expect(result).toHaveLength(0);
  });
});
