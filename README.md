# DeepDraft

DeepDraft is a CLI that turns a topic or a set of notes into a polished technical article in Markdown. It can run through local coding agents to minimize API costs, while keeping OpenAI, Gemini, and Claude available through the same writing pipeline when needed.

The intended audience, editorial voice, and quality bar are defined in [`soul.md`](./soul.md), rather than being hard-coded into the CLI or pipeline.

## Features

- **Explicit provider selection**: You decide which backend runs each job. DeepDraft never selects a provider or falls back to another one automatically.
- **Local-agent support**: Codex CLI and Antigravity CLI run in isolated temporary workspaces with sandboxing enabled.
- **Five-stage writing pipeline**: Direction, outline, draft, evidence-aware revision, and frontmatter assembly are handled as distinct stages.
- **Evidence-aware revision without another model call**: The revision stage removes or qualifies unsupported measurements, arbitrary thresholds, version-dependent generalizations, and leaked agent instructions.
- **Validated structured output**: Zod validation and a bounded retry protect the pipeline from malformed model responses.
- **Safe file output**: Existing files are never overwritten unless `--force` is explicitly provided.
- **Observable usage**: The completion summary reports the provider and the actual number of generation calls.

## Requirements

- Node.js 22 or later
- At least one supported local CLI or API credential

## Install and build

```bash
npm install
npm run build
npm link
```

## Usage

You must explicitly select a provider and output language for every run. DeepDraft currently supports Korean (`ko`) and English (`en`).

```bash
# Local agents
deepdraft write "How Go's garbage collector coordinates write barriers" --provider codex --language en
deepdraft write "PostgreSQL 인덱스 핫스팟 완화" --provider agy --language ko

# API providers
OPENAI_API_KEY=... deepdraft write "Kafka consumer rebalancing" --provider openai --language en
GEMINI_API_KEY=... deepdraft write "Redis 장애 복구" --provider gemini --language ko
ANTHROPIC_API_KEY=... deepdraft write "Distributed transaction trade-offs" --provider claude --language en

# Notes as the primary input
deepdraft write --file ./notes/incident.md --provider codex --language en
```

`topic`과 `--file`은 동시에 지정할 수 없습니다. 둘 중 하나만 입력으로 사용해야 합니다.

## CLI options

| Option | Description | Default |
| :--- | :--- | :--- |
| `[topic]` | Technical article topic | - |
| `-f, --file <path>` | Text or Markdown input file | - |
| `-p, --provider <name>` | One of `codex`, `agy`, `openai`, `gemini`, or `claude` | Required |
| `-l, --language <code>` | Output language: `ko` or `en` | Required |
| `-m, --model <name>` | Model to use with the selected provider | Provider default |
| `-s, --style <type>` | Optional writing-style hint | `deep-dive` |
| `-o, --output <path>` | Output Markdown path | `./posts/[date]-[slug].md` |
| `--force` | Overwrite an existing explicit output path | `false` |

If the selected provider is unavailable or fails, DeepDraft exits with an error instead of silently switching to another provider.

## Development and verification

```bash
npm test
npm run build
npm run check
npm pack --dry-run
```
