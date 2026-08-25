#!/usr/bin/env node
import { Command, Option } from 'commander';
import dotenv from 'dotenv';
import { handleWrite, resolveWriteInput } from '../commands/write.js';
import { SUPPORTED_LANGUAGES } from '../core/language.js';
import { SUPPORTED_AGENTS, SUPPORTED_PROVIDERS } from '../providers/factory.js';
import { logger } from '../utils/logger.js';

dotenv.config();
const program = new Command();

program
  .name('deepdraft')
  .description(
    'Generate polished technical articles with local agents or LLM APIs',
  )
  .version('0.1.0');

program
  .command('write')
  .description('Write a technical article from a topic or input file')
  .argument('[topic]', 'technical article topic')
  .option('-f, --file <path>', 'text or Markdown input file')
  .option(
    '-o, --output <path>',
    'output Markdown path (default: ./posts/[date]-[slug].md)',
  )
  .addOption(
    new Option(
      '--agent <name>',
      `local agent to use (${SUPPORTED_AGENTS.join(', ')})`,
    )
      .choices([...SUPPORTED_AGENTS])
      .conflicts('provider'),
  )
  .addOption(
    new Option(
      '-p, --provider <name>',
      `API provider to use (${SUPPORTED_PROVIDERS.join(', ')})`,
    )
      .choices([...SUPPORTED_PROVIDERS])
      .conflicts('agent'),
  )
  .addOption(
    new Option('-l, --language <code>', 'output language')
      .choices([...SUPPORTED_LANGUAGES])
      .makeOptionMandatory(),
  )
  .option('-m, --model <name>', 'model to use with the selected backend')
  .option(
    '-s, --style <type>',
    'writing style hint (deep-dive, troubleshooting, architecture-compare)',
    'deep-dive',
  )
  .option('--force', 'overwrite an existing output file', false)
  .action(async (topic, options) => {
    const input = resolveWriteInput(topic, options.file);
    const { file: _file, ...writeOptions } = options;
    await handleWrite(input, writeOptions);
  });

try {
  await program.parseAsync(process.argv);
} catch (error: any) {
  logger.error(error.message || String(error));
  process.exitCode = 1;
}
