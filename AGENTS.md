# Agent instructions

이 저장소는 개발 블로그다. GitHub Pages 프로젝트 사이트로 `https://tryfasting.github.io/blog/`에 배포된다. 포트폴리오(`tryfasting/tryfasting.github.io`)와는 별개의 저장소이며 코드·빌드·패키지를 공유하지 않는다.

**도메인 전체 구조(두 저장소, GitHub Actions, Pages, 주소 담당)는 포트폴리오 저장소의 `ARCHITECTURE.md`가 원본이다.** 로컬 `../tryfasting-portfolio/ARCHITECTURE.md`, GitHub https://github.com/tryfasting/tryfasting.github.io/blob/main/ARCHITECTURE.md. 복사하지 않고 그 문서를 읽는다.

## 공통 규칙

- 한국어로 응답한다. 응답 직전에 Asia/Seoul 현재 시각을 확인하고 첫 줄을 **`[YYYY-MM-DD HH:mm:ss KST]`** 형식으로 적는다.
- 완료 보고에는 변경 파일·핵심 변경, 실행한 검증과 결과, 남은 제한을 적는다.
- **사용자의 실명을 사이트·문서·커밋·시안 어디에도 넣지 않는다**(2026-10-17 사용자 지시). 작성자 표기는 `SJ`다(`src/blog/site.ts`).
- 비공개 자료·대화 기록·비밀값은 커밋하지 않는다. `git add .` 대신 변경 파일을 명시한다.
- 삭제·대규모 변경·전역 설치·작업공간 밖 수정은 사용자 승인을 받는다.
- Python은 PEP 8·타입 힌트를 따르고, 사용할 수 있으면 `uv run`으로 실행한다.

## 블로그 규칙

- **이 저장소의 관심사는 "받은 MD 글을 정해진 디자인과 절차로 안정적으로 배포하는 것"뿐이다**(2026-10-17 사용자 지시). 글의 내용(주제, 문장, 제목, 요약)은 다루지 않는다. 글을 대신 쓰거나 다듬지 않고, 형식만 맞춘다.
- 블로그 구조와 개발용 용어(페이지, 화면 구역, 작성·등록)는 [README.md](README.md)에 있다. 대화와 문서에서 이 용어를 쓰고, 페이지나 화면 구역을 바꾸면 README의 그림과 표를 같은 커밋에서 고친다.
- 작업 전에 [운영 규칙](docs/operations.md)을 읽는다. 디자인 기준은 로컬 `DESIGN.md` 앞부분, 목표·다음 단계는 로컬 `.plans/BLOG_PLAN.md`, 끝난 단계의 기록은 로컬 `.plans/BLOG_DONE.md`에 있다(모두 커밋하지 않음). 새 문서를 만들기 전에 이 문서들을 고쳐 쓸 수 있는지 먼저 본다.
- 브랜치는 `main` 하나다. 글과 코드 모두 `main`에 push하면 배포된다.
- 내부 링크는 `src/blog/posts.ts`의 `withBase()`로 만든다(`base: '/blog'`).
- 상단 "포트폴리오" 링크는 다른 사이트이므로 `/general/`를 base 없이 쓴다.
- 검증은 아래 "검증 루프"를 따른다.
- 로컬 전용(커밋 금지): `DESIGN.md`(디자인 기준 + refero 참고 원본), `DESIGN-anthropic.md`(refero 참고 원본, 2026-10-17 추가), `.plans/`(작업 계획 `BLOG_PLAN.md`, 완료 기록 `BLOG_DONE.md`). `.git/info/exclude`로 제외되어 있다.

## 개발 원칙 (2026-10-17 사용자 지시)

코드 재사용성과 이해 가능성을 위해 아래를 지킨다. 계획을 보여 줄 때 각 원칙을 어떻게 지킬지 함께 적는다.

1. **인터페이스 우선 설계**: 구현 전에 함수 시그니처·타입·컴포넌트 `Props`·frontmatter 스키마처럼 바깥에서 보이는 모양을 먼저 정해 계획에 적는다. 구현은 그다음이다.
2. **모듈 경계 명시**: 각 모듈의 책임을 지키고, 경계를 바꾸면 이 표와 `docs/operations.md`의 구조 표를 같이 고친다.

   | 모듈 | 책임 | 하지 않는 것 |
   |---|---|---|
   | `src/content.config.ts` | 글 컬렉션과 frontmatter 스키마, `_drafts/`는 dev에서만 로드 | 화면, URL |
   | `src/blog/posts.ts` | 글 조회·정렬, draft 노출(페이지는 `getVisiblePosts`: dev에서만 draft 포함, RSS는 `getPublishedPosts`: 항상 제외), 페이지가 쓰는 helper의 단일 진입점(`lib` 함수를 Astro 값과 연결, 예: `withBase`) | 마크업, 스타일, 순수 계산 로직 |
   | `src/blog/lib/*.ts` | Astro 없이 도는 순수 계산(`slug.ts` slug·태그 slug·slug 검사, `url.ts` 주소 조립, `date.ts` 날짜 표기, `draft.ts` draft 판정, `reading.ts` 읽는 시간, `toc.ts` 목차 항목). 단위 테스트 대상 | `astro:*`·`import.meta.env` 사용, 페이지에서 직접 import |
   | `tests/*.test.ts` | `lib` 단위 테스트(`npm test`, Node 내장 `node:test`) | Astro 런타임 의존 |
   | `tests/build-guards.test.mjs` | 빌드가 거부하거나(실패와 오류 문구) 빼야 하는(draft) 글을 임시로 만들어 `astro build`로 확인(`npm run test:build`) | `dist/` 덮어쓰기, 실행 뒤 임시 파일 남기기 |
   | `src/blog/site.ts` | 사이트 이름·설명 같은 상수 | 로직 |
   | `src/blog/BlogLayout.astro`, `PostList.astro` | 페이지 뼈대(머리 띠: 머리말 + 이름 있는 slot `hero`로 받는 제목 구역)와 목록 마크업 | 컬렉션 직접 조회 |
   | `src/blog/blog.css`, `code-theme.mjs` | 모든 스타일과 코드 하이라이트 | 페이지별 인라인 스타일 |
   | `src/pages/*` | 위 모듈을 조합한 라우트 | `getCollection` 직접 호출, `/blog/`·`/` 경로 하드코딩 |

3. **TDD 먼저**: 새 로직이나 버그 수정은 실패하는 테스트를 먼저 쓰고, 통과시키는 순서로 한다. 테스트 이름은 기대 동작을 문장으로 적는다.
   - 순수 계산은 `src/blog/lib/`에 두고 `tests/*.test.ts`에 테스트를 먼저 쓴다. `npm test`로 실행한다(Node 24가 `.ts`를 직접 실행하므로 import에 `.ts` 확장자를 붙인다).
   - 빌드가 실패해야 하는 경우(slug 중복·한글 파일명·예약어 `tags`·필수 항목 누락·날짜 형식·없는 이미지)와 draft가 결과물·RSS·sitemap에서 빠지는지는 `npm run test:build`가 확인한다. 실제 빌드를 여러 번 돌려 30초쯤 걸리므로 빌드 검사·스키마·글 경로 처리를 바꿀 때 실행한다. `npm run dev`가 떠 있을 때는 돌리지 않는다.
   - 화면·링크는 `npm run verify`가 확인한다. dev 서버(draft 포함)를 볼 때는 `npm run verify -- http://127.0.0.1:4321 artifacts/verify-dev --dev`(sitemap 검사만 건너뜀).
4. **완료 기준 먼저 정의**: 아래 "검증 루프" 1번. 기준이 없으면 작업을 시작하지 않는다.
5. **규칙은 AGENTS.md와 docs로 문서화**: 새 규칙·결정이 생기면 그 변경과 같은 커밋에서 이 파일, `docs/operations.md`, 로컬 `DESIGN.md`(디자인), 로컬 `.plans/BLOG_PLAN.md`(계획) 중 맞는 곳에 적는다. 같은 역할의 문서가 있으면 새로 만들지 않고 고쳐 쓴다. 같은 내용을 두 곳에 복사하지 않고 한 곳에 두고 링크한다.
6. **리뷰 가능한 크기**: 한 커밋은 한 가지 목적만 담는다. lockfile을 뺀 변경이 대략 200줄을 넘거나 목적이 둘 이상이면 나눈다. 커밋 메시지에 무엇을·왜를 적는다.
7. **이해 가능성 유지**: 이름은 하는 일을 드러내게 짓고, 주석은 "무엇"이 아니라 "왜"를 적는다. 영리한 한 줄보다 읽히는 코드를 고른다. 바꾼 동작은 문서에도 반영한다.

## 검증 루프 (모든 작업에 적용)

이 저장소는 `main`에 push하는 순간 공개된다. 그래서 아래 1~3을 **push 전에** 끝낸다.

1. **작업 전 완료 기준 표**: 작업을 시작하기 전에 `| # | 완료 기준 | 확인 방법 |` 표를 사용자에게 먼저 보여 준다. 확인 방법은 실행할 명령이나 비교 대상처럼 구체적으로 쓴다.
2. **검증 실행과 보고**: 작업 후 기준마다 검증을 실제로 실행하고, 기준 번호별로 결과(통과·실패와 근거가 되는 출력)를 보고한다. 실패했거나 확인하지 못한 기준은 숨기지 않고 그대로 적는다.
   - 기본 명령: `npm test`, `npm run check`, `npm run build`, `npm run preview` 후 `npm run verify`
3. **스크린샷을 사용자에게 보여주기**: 글만 바꾼 작업이어도 `npm run verify`로 스크린샷을 새로 만든다(기본 `artifacts/verify/`, Git 제외). 에이전트가 먼저 열어 확인한 뒤, 대표 화면(최소 글 목록과 바뀐 글의 1440px·375px)을 파일로 사용자에게 보여 준다. 스크린샷 생성 시각과 대상 커밋을 함께 적는다.
4. push 뒤에는 Actions 성공과 운영 주소(`npm run verify -- https://tryfasting.github.io <출력 폴더>`)도 확인한다.
