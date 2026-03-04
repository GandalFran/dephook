import { ScanResult } from "../types/result";
import { IOutputFormatter } from "./formatter";

export class JsonFormatter implements IOutputFormatter {
  public format(result: ScanResult): string {
    return JSON.stringify(result, null, 2);
  }
}
