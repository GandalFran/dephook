import { ScanResult } from "../types/result";
import { IOutputFormatter } from "./formatter";

export class MarkdownFormatter implements IOutputFormatter {
  public format(result: ScanResult): string {
    const { summary, items } = result;

    let output = `# 🛡️ dephook Results\n\n`;
    output += `> 🕒 **Scanned At:** ${result.scannedAt}\n`;
    output += `> 📁 **Project:** ${result.projectName}\n`;
    output += `> 📦 **PackageManager:** ${result.packageManagerDetected}\n\n`;

    output += `## 📊 Summary\n\n`;
    output += `- 🚨 **Total Packages with Hooks**: ${summary.totalPackagesWithHooks}\n`;
    output += `- 🎯 **Direct Dependencies**: ${summary.totalDirect}\n`;
    output += `- 🌊 **Transitive Dependencies**: ${summary.totalTransitive}\n`;
    output += `- ⚙️ **Expose Bins**: ${summary.totalWithBin}\n`;
    output += `- 🛠️ **Prepare Hooks**: ${summary.totalPrepare}\n\n`;

    output += `## Packages\n\n`;

    if (items.length === 0) {
      output += `No package with install/prepare hooks found!\n`;
      return output;
    }

    items.forEach((item) => {
      const directTag = item.direct ? " 🎯 (Direct)" : " 🌊 (Transitive)";
      output += `### 📦 ${item.name}@${item.version}${directTag}\n\n`;

      if (Object.keys(item.scripts).length > 0) {
        output += `- 🪝 **Hooks:** \`${Object.keys(item.scripts).join(", ")}\`\n`;
      }

      if (item.bins.length > 0) {
        output += `- ⚙️ **Bins:** \`${item.bins.join(", ")}\`\n`;
      }

      output += `- 🔗 **Reason Chain:** \`${item.reasonChain.join(" -> ")}\`\n\n`;
    });

    return output;
  }
}
