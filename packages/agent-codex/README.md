# @deepdraft/agent-codex

Codex SDK implementation of the `@deepdraft/core` `LLMProvider` contract.

```ts
import { CodexProvider } from '@deepdraft/agent-codex';

const provider = new CodexProvider();
const response = await provider.generate('Write a concise technical summary.');
```

Each call uses a new read-only Codex thread in a temporary working directory, with approvals, network access, and web search disabled.
