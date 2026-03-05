# 🛡️ dephook

[![npm version](https://badge.fury.io/js/dephook.svg)](https://badge.fury.io/js/dephook)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
[![CI](https://github.com/GandalFran/deephook/actions/workflows/ci.yml/badge.svg)](https://github.com/GandalFran/deephook/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)


A lightweight CLI focused on security & visibility of dependencies, inspecting Node.js projects for install/prepare hooks and binaries. Find out what dependencies are running scripts during install, why they are present, and what binaries they expose.

## 📖 The Problem

Supply chain attacks often leverage `preinstall`, `install`, `postinstall`, or `prepare` scripts to execute malicious code. It's difficult to quickly answer:
- *Which direct/transitive dependencies run hooks in my project?*
- *Why exactly is this dependency in my tree?*
- *Has anything new with hooks been introduced since last week?*

`dephook` solves this by giving you highly targeted, actionable insight into your dependency tree hooks without noise.

## 🚀 Installation

You can run it directly without installing using `npx`:

```bash
npx dephook
```

Or install it as a dev dependency in your project:

```bash
npm install -D dephook
```

To install globally:

```bash
npm install -g dephook
```

## 🛠️ Usage

### Basic scan

Run the tool without arguments to analyze your project (supports `npm` and `pnpm`).

```bash
dephook scan
```

To see debug logs and follow the internal process, run:

```bash
dephook scan --debug
```

**Example output (Terminal):**
```text
🔍 dephook results

[🌊 TRANSITIVE] 📦 esbuild@0.20.2 [⚙️ BIN]
  🪝 Hooks: postinstall
  ⚙️ Bins:  esbuild
  🔗 Reason: my-app -> vite -> esbuild

📊 Summary
🚨 Packages with install/prepare hooks: 1
- 🎯 Direct:     0
- 🌊 Transitive: 1
- ⚙️ With bins:  1
```

### 🤖 CI / Automation (JSON)

Output deterministic JSON that you can pipe or save as an artifact:

```bash
dephook scan --json > .dephook.json
```

**Example output (JSON):**
```json
{
  "projectName": "my-app",
  "projectPath": "/path/to/my-app",
  "packageManagerDetected": "npm",
  "scannedAt": "2026-03-04T12:00:00.000Z",
  "summary": {
    "totalPackagesWithHooks": 1,
    "totalDirect": 0,
    "totalTransitive": 1,
    "totalWithBin": 1,
    "totalPrepare": 0
  },
  "items": [
    {
      "name": "esbuild",
      "version": "0.20.2",
      "scripts": { "postinstall": "node install.js" },
      "bins": ["esbuild"],
      "direct": false,
      "reasonChain": ["my-app", "vite", "esbuild"],
      "sourcePath": "/path/to/my-app/node_modules/esbuild",
      "packageManager": "npm",
      "flags": {
        "hasPrepare": false,
        "hasBin": true,
        "multipleHooks": false
      }
    }
  ],
  "warnings": []
}
```

### 📝 Documentation (Markdown)

Great for generating tables/lists for PRs or Security Audits:

```bash
dephook scan --md > DEPENDENCY_HOOKS.md
```

**Example output (Markdown):**

```
# 🛡️ dephook Results

> 🕒 **Scanned At:** 2026-03-04T12:00:00.000Z
> 📁 **Project:** my-app
> 📦 **PackageManager:** npm

## 📊 Summary

- 🚨 **Total Packages with Hooks**: 1
- 🎯 **Direct Dependencies**: 0
- 🌊 **Transitive Dependencies**: 1
- ⚙️ **Expose Bins**: 1
- 🛠️ **Prepare Hooks**: 0

## Packages

### 📦 esbuild@0.20.2 🌊 (Transitive)

- 🪝 **Hooks:** `postinstall`
- ⚙️ **Bins:** `esbuild`
- 🔗 **Reason Chain:** `my-app -> vite -> esbuild`
```

## 🔮 Future Roadmap

- Configuration file support (`.dephook.json`).
- Automated diffs comparing lockfiles (`dephook diff`).
- SARIF export for GitHub Code Scanning compatibility.
- Yarn classic and berry support.
- Full Workspace analysis. 
