# Codex Provider 구현 가이드

DeepDraft는 현재 Codex SDK만 사용한다. 구현은 npm workspace 세 개로 나뉘며, 이 문서는 CLI 입력이 Codex 호출로 이어지는 최소 경로와 안전 경계를 설명한다.

```text
deepdraft write
  -> handleWrite
  -> @deepdraft/core/runPipeline
  -> @deepdraft/core/generateWithProvider
  -> @deepdraft/agent-codex/CodexProvider
  -> @openai/codex-sdk
```

## 패키지 경계

- `@deepdraft/core`: `LLMProvider` 계약, 5단계 pipeline, prompt 구성, 구조화 출력 검증
- `@deepdraft/agent-codex`: Codex SDK 설정, thread 실행, 격리된 임시 작업 디렉터리 관리
- `deepdraft`: CLI option, Soul 로딩, 진행 표시, 결과 파일 저장

의존 방향은 `deepdraft -> agent-codex -> core`이며, `deepdraft -> core`도 직접 연결된다. `core`는 agent 또는 CLI 패키지를 import하지 않는다.

## Provider 계약

Pipeline은 구체 SDK 대신 `@deepdraft/core`가 공개하는 `LLMProvider`에 의존한다. 이 작은 경계는 테스트에서 실제 Codex 호출 없이 5단계 pipeline을 검증하고, 이후 agent adapter를 독립 패키지로 추가할 수 있게 한다.

```ts
export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
```

Codex 외 backend 선택은 지원하지 않는다. CLI에도 `--agent`와 `--provider` 옵션이 없으며 `handleWrite()`가 `CodexProvider`를 직접 생성한다.

## Codex 실행 경계

`CodexProvider.generate()`는 호출마다 다음 순서로 동작한다.

1. 빈 임시 작업 디렉터리를 만든다.
2. read-only sandbox와 `approvalPolicy: 'never'`로 새 thread를 만든다.
3. 네트워크와 웹 검색을 비활성화한다.
4. JSON Schema가 있으면 SDK의 `outputSchema`로 전달한다.
5. 10분 `AbortSignal` 제한 안에서 prompt를 실행한다.
6. `finalResponse`를 반환하고 임시 디렉터리를 정리한다.

각 pipeline stage는 독립 thread를 사용한다. 이전 stage의 정보는 대화 기록에 암묵적으로 의존하지 않고 다음 prompt에 명시적으로 포함된다.

SDK config에는 `history.persistence = 'none'`을 전달한다. 이는 transcript history 저장을 비활성화하지만 CLI의 `--ephemeral`과 완전히 같은 동작을 보장하지는 않는다.

## 구조화 출력

Angle, outline, metadata stage는 JSON Schema를 Codex SDK에 전달한 뒤 애플리케이션에서 다시 Zod로 검증한다. 모델 응답이 schema와 맞지 않으면 최대 두 번 시도하고 실패를 명시적으로 반환한다.

## 검증

```bash
npm test
npm run build
npm run check
npm pack --dry-run -w @deepdraft/core
npm pack --dry-run -w @deepdraft/agent-codex
```

단위 테스트는 SDK client를 주입해 sandbox, approval, working directory, schema, timeout, cleanup을 검증한다. 실제 인증과 모델 호출은 별도의 smoke test로 확인한다.
