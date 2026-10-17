# Agent instructions

이 저장소는 개발 블로그다. GitHub Pages 프로젝트 사이트로 `https://tryfasting.github.io/blog/`에 배포된다. 포트폴리오(`tryfasting/tryfasting.github.io`)와는 별개의 저장소이며 코드·빌드·패키지를 공유하지 않는다.

**도메인 전체 구조(두 저장소, GitHub Actions, Pages, 주소 담당)는 포트폴리오 저장소의 `ARCHITECTURE.md`가 원본이다.** 로컬 `../tryfasting-portfolio/ARCHITECTURE.md`, GitHub https://github.com/tryfasting/tryfasting.github.io/blob/dev/ARCHITECTURE.md. 복사하지 않고 그 문서를 읽는다.

## 공통 규칙

- 한국어로 응답한다. 응답 직전에 Asia/Seoul 현재 시각을 확인하고 첫 줄을 **`[YYYY-MM-DD HH:mm:ss KST]`** 형식으로 적는다.
- 완료 보고에는 변경 파일·핵심 변경, 실행한 검증과 결과, 남은 제한을 적는다.
- 비공개 자료·대화 기록·비밀값은 커밋하지 않는다. `git add .` 대신 변경 파일을 명시한다.
- 삭제·대규모 변경·전역 설치·작업공간 밖 수정은 사용자 승인을 받는다.
- Python은 PEP 8·타입 힌트를 따르고, 사용할 수 있으면 `uv run`으로 실행한다.

## 블로그 규칙

- 작업 전에 [운영 규칙](docs/operations.md)을 읽는다.
- 브랜치는 `main` 하나다. 글과 코드 모두 `main`에 push하면 배포된다.
- 내부 링크는 `src/blog/posts.ts`의 `withBase()`로 만든다(`base: '/blog'`).
- 상단 "포트폴리오" 링크는 다른 사이트이므로 `/general/`를 base 없이 쓴다.
- 검증은 아래 "검증 루프"를 따른다.
- 로컬 전용(커밋 금지): `DESIGN.md`(디자인 참고 원본), `.plans/`(작업 계획). `.git/info/exclude`로 제외되어 있다.

## 검증 루프 (모든 작업에 적용)

이 저장소는 `main`에 push하는 순간 공개된다. 그래서 아래 1~3을 **push 전에** 끝낸다.

1. **작업 전 완료 기준 표**: 작업을 시작하기 전에 `| # | 완료 기준 | 확인 방법 |` 표를 사용자에게 먼저 보여 준다. 확인 방법은 실행할 명령이나 비교 대상처럼 구체적으로 쓴다.
2. **검증 실행과 보고**: 작업 후 기준마다 검증을 실제로 실행하고, 기준 번호별로 결과(통과·실패와 근거가 되는 출력)를 보고한다. 실패했거나 확인하지 못한 기준은 숨기지 않고 그대로 적는다.
   - 기본 명령: `npm run check`, `npm run build`, `npm run preview` 후 `npm run verify`
3. **스크린샷을 사용자에게 보여주기**: 글만 바꾼 작업이어도 `npm run verify`로 스크린샷을 새로 만든다(기본 `artifacts/verify/`, Git 제외). 에이전트가 먼저 열어 확인한 뒤, 대표 화면(최소 글 목록과 바뀐 글의 1440px·375px)을 파일로 사용자에게 보여 준다. 스크린샷 생성 시각과 대상 커밋을 함께 적는다.
4. push 뒤에는 Actions 성공과 운영 주소(`npm run verify -- https://tryfasting.github.io <출력 폴더>`)도 확인한다.
