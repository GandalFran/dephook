export interface Config {
  allow?: string[];
  deny?: string[];
  onlyHooks?: string[];
  ignoreWorkspace?: boolean;
  output?: "terminal" | "json" | "md" | "sarif";
  failOnHooks?: boolean;
  failOnPrepare?: boolean;
  failOnNew?: boolean;
  baseline?: string | null;
}
