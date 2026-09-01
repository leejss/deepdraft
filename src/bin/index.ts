#!/usr/bin/env node
import { SUPPORTED_LANGUAGES, SUPPORTED_LEVELS } from '@deepdraft/core';
import { Command, Option } from 'commander';
import dotenv from 'dotenv';
import { handleWrite, resolveWriteInput } from '../commands/write.js';
import { logger } from '../utils/logger.js';

dotenv.config();
const program = new Command();

program
  .name('deepdraft')
  .description('Generate polished technical articles with Codex')
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
    new Option('-l, --language <code>', 'output language')
      .choices([...SUPPORTED_LANGUAGES])
      .default('ko'),
  )
  .addOption(
    new Option('--level <level>', 'reader experience level')
      .choices([...SUPPORTED_LEVELS])
      .default('intermediate'),
  )
  .option('-m, --model <name>', 'Codex model to use')
  .option('--soul <path>', 'custom Soul Markdown path')
  .option('--force', 'overwrite an existing output file', false)
  .option('--debug', 'log each pipeline stage result', false)
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
