# Tech Blog Engine

> **5년차 엔지니어가 동료 엔지니어에게 공유하고 싶은, 밀도 높고 타협 없는 마크다운 기술 블로그 생성 엔진**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![Biome](https://img.shields.io/badge/Biome-2.5+-60a5fa.svg)](https://biomejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 왜 이 엔진인가? (Why Tech Blog Engine?)

인터넷에 넘쳐나는 얕은 요약과 획일적인 템플릿 위주의 "AI Slop" 기술 글을 배제합니다.

- **완전 자율 판단 & 동적 서사 아키텍처**: 딱딱한 고정 템플릿 대신, 주제의 성격(장애 회고, 런타임 딥다이브, 아키텍처 마이그레이션 등)에 맞게 최적의 스토리라인과 결론 방식을 AI가 자율적으로 설계합니다.
- **내부 메커니즘 중심 (Under the Hood)**: 단순 사용법 나열이 아닌, 런타임/스토리지 엔진 레벨의 인과관계와 동작 원리를 파헤칩니다.
- **가치 있는 다이어그램 & 실전 코드**: 시각적 이해가 꼭 필요한 순간에만 절제된 Mermaid 다이어그램과 프로덕션 수준의 코드를 배치합니다.

---

## 주요 기능

- **멀티 LLM Provider & 로컬 에이전트 지원**:
  - 클라우드 API: Google Gemini, OpenAI GPT-4o, Anthropic Claude (Vercel AI SDK)
  - 로컬 코딩 에이전트: `agy` (Antigravity CLI), `codex` (Codex CLI) 자동 감지 및 무설정(Zero Config) 실행
- **다양한 입력 지원**:
  - 터미널 인자 문자열
  - 텍스트/마크다운 메모 파일 (`--file`)

---

## 빠른 시작

### 1. 설치 및 빌드

```bash
npm install
npm run build
```

### 2. 실행 방법

#### (1) 로컬 에이전트(`agy` 또는 `codex`)로 실행 (API 키 불필요)

```bash
# agy 또는 codex가 로컬에 설치되어 있다면 자동 감지되어 실행됩니다.
npm run dev -- generate "Go 런타임의 가비지 컬렉터와 Write Barrier 동작 원리"

# 특정 로컬 에이전트 명시
npm run dev -- generate "PostgreSQL B-Tree 인덱스 핫스팟 완화 전략" --provider agy
npm run dev -- generate "React 18 동시성과 CSS-in-JS 런타임 오버헤드" --provider codex
```

#### (2) 클라우드 API Provider로 실행

```bash
# 환경 변수 설정
export GEMINI_API_KEY="your-gemini-api-key"
# 또는
export OPENAI_API_KEY="your-openai-api-key"

# 글 생성
npm run dev -- generate "Kafka 파티션 리밸런싱과 무중단 컨슈머 아키텍처" --provider gemini
```

#### (3) 텍스트 파일/메모 기반 생성

```bash
npm run dev -- generate --file ./notes/architecture-review.txt
```

---

## CLI 옵션

| 옵션                    | 설명                                                        | 기본값                     |
| :---------------------- | :---------------------------------------------------------- | :------------------------- |
| `[topic]`               | 작성할 기술 블로그 주제                                     | -                          |
| `-f, --file <path>`     | 참고할 텍스트/마크다운 파일 경로                            | -                          |
| `-o, --output <path>`   | 결과 마크다운 파일 저장 경로                                | `./posts/[date]-[slug].md` |
| `-p, --provider <name>` | LLM Provider (`gemini`, `openai`, `claude`, `agy`, `codex`) | 자동 감지                  |
| `-m, --model <name>`    | 특정 모델 이름 지정                                         | 기본 모델                  |
| `-s, --style <type>`    | 글 스타일 요청 (예: `deep-dive`, `troubleshooting`)         | -                          |

---

## 코드 검증 및 테스트

```bash
# 단위 및 통합 테스트 실행 (Vitest)
npm test

# Biome 린팅 및 포맷팅 검사
npm run check

# Biome 자동 수정
npm run check:fix
```
