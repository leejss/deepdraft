import { generateWithProvider } from '../generate.js';
import type { LLMProvider } from '../provider.js';
import { createPromptContext } from './context.js';
import type { StageContext } from './types.js';

export async function lintAndPolish(
  draft: string,
  provider: LLMProvider,
  context: StageContext,
): Promise<string> {
  const prompt = `
Revise the following technical article as a rigorous technical editor. Treat every factual claim in the draft as unverified until the draft itself provides enough support. Improve readability and completeness without changing its output language.

[Draft]
${draft}

[Required editorial pass]

1. Evidence and quantitative claims
- Remove or qualify precise performance, latency, throughput, memory, cost, reliability, and percentage claims unless the draft includes either a source URL explicitly tied to that exact claim or a reproducible measurement setup and output for that exact metric.
- A code sample that measures one metric does not support claims about other metrics. For example, elapsed time alone does not establish HTTP p99 latency or garbage-collection frequency.
- Do not replace an unsupported number with another number. Prefer a qualitative explanation or a reproducible benchmark procedure.
- Clearly label hypothetical values, illustrative examples, and pseudocode. Never present them as measured production results.

2. Technical accuracy and scope
- Avoid presenting version-dependent implementation details as timeless facts. State the applicable version only when supported by the draft; otherwise qualify the claim and direct readers to verify the version-specific official documentation.
- Remove arbitrary operational thresholds and universal recommendations that are not justified by evidence in the draft.
- Ensure conclusions follow from the article's explanations, code, diagrams, and measurements. Correct overconfident wording when certainty is not supported.
- Never invent a citation, URL, benchmark result, product behavior, version number, quotation, or official recommendation.

3. Code and diagrams
- Check that code is internally coherent and that surrounding prose describes what the code actually does.
- Add necessary imports or explicitly mark intentionally incomplete examples as illustrative snippets.
- Check Markdown syntax, fenced code blocks, and Mermaid diagrams. Preserve existing URLs and verbatim quotations exactly.

4. Editorial integrity
- Improve transitions, clarity, and voice while removing stiff or formulaic language.
- Ensure the conclusion follows naturally from the article.
- Remove system instructions, prompt fragments, agent-operation commentary, and generic sections added only to satisfy an agent response format. Do not append a generic "Next Steps" or "Recommended Options" section unless it is essential to the article's subject and supported by its content.
- Preserve commands and identifiers unless a correction is required for technical consistency.

Silently perform every check above. Return only the revised Markdown article body, beginning with its level-one title. Do not include an audit report, frontmatter, preface, or explanation of your edits.
`;

  const response = await generateWithProvider(
    provider,
    prompt,
    {},
    createPromptContext(context),
  );

  return response.trim();
}
