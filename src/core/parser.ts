import { DetectedPackageHook } from "../types/result";

export interface ILockfileParser {
  parse(projectPath: string): Promise<DetectedPackageHook[]>;
}
