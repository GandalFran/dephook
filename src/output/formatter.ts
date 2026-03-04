import { ScanResult } from "../types/result";

export interface IOutputFormatter {
  format(result: ScanResult, options?: any): string;
}
