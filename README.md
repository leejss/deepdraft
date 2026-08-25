# DeepDraft

DeepDraft is a CLI that turns a topic or a set of notes into a polished technical article in Markdown. It can run through local coding agents to minimize API costs, while keeping OpenAI, Gemini, and Claude available through the same writing pipeline when needed.

The intended audience, editorial voice, and quality bar are defined in [`soul.md`](./soul.md), rather than being hard-coded into the CLI or pipeline.

## Features

- **Explicit backend selection**: Choose either a local agent with `--agent` or an API provider with `--provider`. The two options are mutually exclusive, and DeepDraft never falls back automatically.
- **Local-agent support**: Codex, Antigravity, Claude, and OpenCode CLIs run in isolated temporary workspaces with restrictive permissions.
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

You must explicitly select exactly one local agent or API provider, plus an output language, for every run. DeepDraft currently supports Korean (`ko`) and English (`en`).

```bash
# Local agents
deepdraft write "How Go's garbage collector coordinates write barriers" --agent codex --language en
deepdraft write "PostgreSQL 인덱스 핫스팟 완화" --agent agy --language ko
deepdraft write "Node.js 이벤트 루프" --agent claude --language ko
deepdraft write "Rust ownership patterns" --agent opencode --language en

# API providers
OPENAI_API_KEY=... deepdraft write "Kafka consumer rebalancing" --provider openai --language en
GEMINI_API_KEY=... deepdraft write "Redis 장애 복구" --provider gemini --language ko
ANTHROPIC_API_KEY=... deepdraft write "Distributed transaction trade-offs" --provider claude --language en

# Notes as the primary input
deepdraft write --file ./notes/incident.md --agent codex --language en
```

`topic`과 `--file`은 동시에 지정할 수 없습니다. 둘 중 하나만 입력으로 사용해야 합니다.
`--agent`와 `--provider`도 동시에 지정할 수 없으며, 둘 중 정확히 하나를 선택해야 합니다.

## CLI options

| Option | Description | Default |
| :--- | :--- | :--- |
| `[topic]` | Technical article topic | - |
| `-f, --file <path>` | Text or Markdown input file | - |
| `--agent <name>` | Local CLI agent: `codex`, `agy`, `claude`, or `opencode` | One of agent/provider |
| `-p, --provider <name>` | API provider: `openai`, `gemini`, or `claude` | One of agent/provider |
| `-l, --language <code>` | Output language: `ko` or `en` | Required |
| `-m, --model <name>` | Model to use with the selected backend | Backend default |
| `-s, --style <type>` | Optional writing-style hint | `deep-dive` |
| `-o, --output <path>` | Output Markdown path | `./posts/[date]-[slug].md` |
| `--force` | Overwrite an existing explicit output path | `false` |

If the selected agent or provider is unavailable or fails, DeepDraft exits with an error instead of silently switching to another backend.

## Development and verification

```bash
npm test
npm run build
npm run check
npm pack --dry-run
```
