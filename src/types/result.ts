export interface DetectedPackageHook {
  name: string;
  version: string | null;
  scripts: Record<string, string>;
  bins: string[];
  direct: boolean;
  reasonChain: string[];
  sourcePath: string;
  packageManager: "npm" | "pnpm" | "unknown";
  flags: {
    hasPrepare: boolean;
    hasBin: boolean;
    multipleHooks: boolean;
  };
}

export interface ScanResult {
  projectName: string;
  projectPath: string;
  packageManagerDetected: string;
  scannedAt: string;
  summary: {
    totalPackagesWithHooks: number;
    totalDirect: number;
    totalTransitive: number;
    totalWithBin: number;
    totalPrepare: number;
  };
  items: DetectedPackageHook[];
  warnings: string[];
}
