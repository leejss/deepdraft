#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import { handleGenerate } from '../commands/generate.js';

// .env 파일 로드
dotenv.config();

const program = new Command();

program
  .name('tech-blog')
  .description('5년차 엔지니어를 위한 고품질 마크다운 기술 블로그 생성 엔진')
  .version('0.1.0');

program
  .command('generate')
  .alias('gen')
  .description('주제 또는 파일로부터 기술 블로그 마크다운 글을 생성합니다.')
  .argument('[topic]', '작성할 기술 블로그 주제')
  .option('-f, --file <path>', '참고할 텍스트/마크다운 파일 경로')
  .option(
    '-o, --output <path>',
    '결과 마크다운 파일 저장 경로 (기본값: ./posts/[date]-[slug].md)',
  )
  .option(
    '-p, --provider <name>',
    'LLM Provider (gemini, openai, claude, agy, codex)',
  )
  .option('-m, --model <name>', '특정 모델 이름 지정')
  .option(
    '-s, --style <type>',
    '글 스타일 (deep-dive, troubleshooting, architecture-compare)',
    'deep-dive',
  )
  .action(async (topic, options) => {
    await handleGenerate(topic, options);
  });

program.parse(process.argv);
