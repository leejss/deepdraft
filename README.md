# DeepDraft

DeepDraft is a small npm workspace that turns a topic or a set of notes into a polished technical article in Markdown with the Codex SDK.

The intended audience, editorial voice, and quality bar are defined in a Soul Markdown file rather than being hard-coded into the CLI or pipeline. DeepDraft uses the packaged [`soul.md`](./soul.md) by default, and you can select a different file for each run.

## Features

- **Codex SDK integration**: Codex is bundled as an application dependency, so DeepDraft does not shell out to a user-installed CLI.
- **Isolated generation**: Every generation call starts a new read-only Codex thread in a temporary workspace with approvals and web search disabled.
- **Five-stage writing pipeline**: Direction, outline, draft, evidence-aware revision, and frontmatter assembly are handled as distinct stages.
- **Selectable editorial Soul**: Use `--soul <path>` to apply a different audience, voice, and quality bar to all five stages of a run.
- **Evidence-aware revision without another model call**: The revision stage removes or qualifies unsupported measurements, arbitrary thresholds, version-dependent generalizations, and leaked agent instructions.
- **Validated structured output**: Zod validation and a bounded retry protect the pipeline from malformed model responses.
- **Safe file output**: Existing files are never overwritten unless `--force` is explicitly provided.

## Requirements

- Node.js 22 or later
- A valid Codex sign-in or API credential available to the local Codex runtime

## Install and build

```bash
npm install
npm run build
npm link
```

## Package structure

```text
deepdraft                    CLI composition layer
├── @deepdraft/core          Provider-neutral pipeline and contracts
└── @deepdraft/agent-codex   Codex SDK adapter
```

`@deepdraft/core` does not import the Codex SDK or CLI presentation code. An agent package only implements the core `LLMProvider` contract. The root CLI selects `CodexProvider`, loads the Soul file, reports progress, and writes the result.

The packages can also be composed without the CLI:

```ts
import { CodexProvider } from '@deepdraft/agent-codex';
import { runPipeline } from '@deepdraft/core';

const result = await runPipeline({
  input: 'Why dependency injection improves testability',
  provider: new CodexProvider(),
  language: 'en',
  soulPrompt: '# Editorial Soul\n\nWrite for working software engineers.',
});

console.log(result.markdown);
```

## Usage

DeepDraft always uses Codex. It supports Korean (`ko`) and English (`en`), and defaults to Korean when `--language` is omitted.

```bash
deepdraft write "How Go's garbage collector coordinates write barriers" --language en
deepdraft write "PostgreSQL 인덱스 핫스팟 완화" --language ko

# Notes as the primary input
deepdraft write --file ./notes/incident.md --language en

# A custom editorial Soul for this run
deepdraft write "PostgreSQL query planning" --language en --soul ./souls/backend.md
```

`topic`과 `--file`은 동시에 지정할 수 없습니다. 둘 중 하나만 입력으로 사용해야 합니다.

`--soul` accepts an absolute path or a path relative to the current working directory. When it is omitted, DeepDraft uses the `soul.md` packaged at the project root. If an explicitly selected file is missing, unreadable, or empty, the command exits with an error instead of silently using the default.

## CLI options

| Option | Description | Default |
| :--- | :--- | :--- |
| `[topic]` | Technical article topic | - |
| `-f, --file <path>` | Text or Markdown input file | - |
| `-l, --language <code>` | Output language: `ko` or `en` | `ko` |
| `-m, --model <name>` | Codex model to use | Codex default |
| `--soul <path>` | Soul Markdown file applied to this run | Packaged root `soul.md` |
| `-o, --output <path>` | Output Markdown path | `./posts/[date]-[slug].md` |
| `--force` | Overwrite an existing explicit output path | `false` |

If Codex is not authenticated or a generation fails, DeepDraft exits without switching to another backend.

## Development and verification

```bash
npm test
npm run build
npm run check
npm pack --dry-run
npm pack --dry-run -w @deepdraft/core
npm pack --dry-run -w @deepdraft/agent-codex
```
