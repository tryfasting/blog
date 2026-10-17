# 블로그 운영 규칙

개발하며 배운 내용을 기록·공개하는 블로그. 저장소 `tryfasting/blog`의 GitHub Pages 프로젝트 사이트로, 주소는 `https://tryfasting.github.io/blog/`, 글은 `/blog/<slug>/`.

발행 흐름: **마크다운 작성 → `main`에 `git push` → GitHub Actions 빌드 → 자동 배포**

포트폴리오(`tryfasting/tryfasting.github.io`)와는 별개의 저장소다. 코드·빌드·패키지 버전을 공유하지 않고, 상단 "포트폴리오" 링크(`/general/`)로만 연결된다.

## 목적과 범위

- **목적**: 개발하며 배운 내용을 기록·공개한다. 장기적으로 채용 담당자·면접관에게 보여 줄 수 있는 기록이 된다.
- **운영 원칙**: 간단하고 손이 덜 가며, 글 쓰고 올리기 쉽고, 오래 유지할 수 있을 것. 편집기는 Obsidian과 VS Code 어느 쪽이든 쓸 수 있어야 한다.
- **현재 범위**: 글 목록(최신순), 글 상세(읽는 시간, 넓은 화면의 목차), 태그별 목록, 태그 모음(`/blog/tags/`), 검색(머리말의 돋보기), RSS, sitemap, 메타·OG 태그, 포트폴리오 링크.
- **하지 않기로 한 것**(나중에 다시 검토): 댓글, 시리즈·카테고리(분류는 태그만), 조회수·애널리틱스, 다크모드.

## 구조

| 위치 | 용도 |
|---|---|
| `posts/` | 등록된 글 (공개) |
| `desk/` | 작성 폴더: 원고 (Git 제외, 빌드 제외, `npm run dev`에서만 원고 검사를 통과한 것이 보임) |
| `docs/post-template.md` | 원고 frontmatter 템플릿 |
| `logs/` | 로컬 기록 (`desk-check.log` 등, Git 제외) |
| `src/content.config.ts` | 컬렉션 정의, frontmatter 스키마, dev에서 원고 포함 |
| `public/search.js` | 검색 패널(돋보기). 번들러를 거치지 않는 정적 파일 |
| `publish.cmd`, `scripts/publish.py`, `scripts/blog_publish/` | 등록 도구(창과 터미널 명령). Python 표준 라이브러리, `uv run`으로 실행 |
| `src/blog/desk.ts`, `scripts/desk-check.ts` | `desk/` 원고 검사와 로그 (`npm run desk:check`) |
| `src/blog/` | 레이아웃·컴포넌트·CSS·helper (`posts.ts`의 `withBase`로 모든 내부 링크에 `/blog`를 붙임) |
| `src/blog/lib/` | Astro 없이 도는 순수 함수(slug 계산·검사, 원고 검사, 주소 조립, 날짜 표기). 페이지는 `posts.ts`를 거쳐 쓴다 |
| `tests/` | `lib` 단위 테스트(`npm test`), 등록 도구 규칙(`npm run test:py`, pytest), 빌드가 실패해야 하는 경우 검사(`npm run test:build`, 느림) |
| `src/pages/` | 라우트: `index`(목록), `[slug]`(글), `tags/[tag]`, `rss.xml`, `404` |
| `astro.config.mjs` | `base: '/blog'` (주소가 `/blog/` 아래인 이유) |
| `scripts/verify-blog.cjs` | 화면 검증과 스크린샷 (`npm run verify -- [기본 URL] [출력 폴더] [--dev]`, 기본 출력 `artifacts/verify/`, Git 제외. `--dev`는 dev 서버용으로 sitemap 검사만 건너뜀) |

- 내부 링크는 반드시 `withBase()`로 만든다. `/blog/`를 직접 쓰거나 `/`로 시작하는 경로를 그대로 쓰지 않는다.

## 디자인

- 색·글꼴·크기와 그 근거, 결정 이력은 로컬 전용 `DESIGN.md` 앞부분("블로그 디자인 기준")에 있다. refero에서 가져온 참고 원문이 같은 파일에 있어 커밋하지 않는다. 값의 실제 원본은 `src/blog/blog.css`와 `src/blog/code-theme.mjs`다.
- 지켜야 할 핵심 규칙
  - 라이트 전용이다.
  - 클라이언트 JavaScript는 기능에 꼭 필요한 곳에만, 빌드 결과물로 정적 제공하고 외부 서비스·추적 코드는 쓰지 않는다(2026-10-17 사용자 결정). 지금은 검색(`public/search.js` + Pagefind)뿐이다.
  - 검색: `npm run build`가 Astro 빌드 뒤 `pagefind --site dist`로 색인을 만든다. 글 페이지의 본문(`data-pagefind-body`)만 색인한다. 그래서 `npm run dev`에서는 검색이 동작하지 않고 `npm run preview`와 운영 사이트에서 동작한다.
  - 배치: 위쪽 머리 띠(`--color-band`)에 머리말과 페이지 제목 구역(글은 제목·요약·작성일·읽는 시간·태그)을 두고, 그 아래 본문은 더 밝은 면(`--color-canvas`)에 둔다. 페이지는 `BlogLayout`의 `hero` slot으로 제목 구역을 넘긴다.
  - 글 본문은 데스크톱 17px·모바일 16px, 행간 1.7, 가독폭 680px.
  - 작은 글자를 포함해 모든 글자는 배경 대비 4.5:1 이상. 주황(`--color-accent-mark`)은 장식에만 쓰고 글자·버튼에는 쓰지 않는다.
  - 색은 `blog.css`의 토큰만 쓰고, 새 색은 `DESIGN.md`의 "디자인 선택 절차"로 정한다. 강조는 굵기·크기·회색 단계로 한다.
  - 375px에서 가로 넘침이 없어야 한다(`npm run verify`가 검사).

## 글 작성 규칙

- **표준 마크다운만** 쓴다. Obsidian `[[위키링크]]`, `![[임베드]]`는 쓰지 않는다.
- 이미지는 글과 같은 폴더의 `images/`에 두고 상대 경로로 참조한다: `![설명](./images/그림.png)`
- 목차: 본문의 `##`·`###` 제목이 3개 이상이면 1200px 이상 화면에서 왼쪽에 목차가 자동으로 붙는다(빌드 때 만들고 JavaScript는 쓰지 않음). 짧은 글에는 붙지 않는다.
- 다른 글은 주소(slug)로 링크한다: `[글 제목](../uv-basics/)`. 글 주소가 `/blog/<slug>/`이므로 `../`가 블로그 첫 화면을 가리키고, 폴더를 옮겨도 깨지지 않는다. `/blog/`를 직접 쓰지 않고 `.md` 파일 경로로도 링크하지 않는다.
- 파일명: `YYYY-MM-DD-영문-kebab-case.md` (소문자·숫자·하이픈만, 한글 파일명 금지). 날짜를 뺀 부분이 이 규칙에 맞지 않으면 빌드가 실패한다. `tags`는 예약어라 슬러그로 쓸 수 없다.
- frontmatter (빌드 시 검증, 필수 항목이 없거나 형식이 틀리면 빌드 실패)

  ```yaml
  ---
  title: 글 제목             # 필수
  date: 2026-10-16           # 필수
  description: 한두 문장 요약  # 필수 (목록·검색 미리보기·OG에 사용)
  tags: [astro, python]      # 선택, 기본값 []
  draft: false               # 선택, 기본값 false. true면 빌드에서 제외(dev에서는 "초안" 표시와 함께 보임)
  ---
  ```

- 공개 레포이므로 커밋된 `draft: true` 글은 사이트에는 안 보여도 GitHub 소스에서는 보인다. 공개 전 글은 `desk/`에 둔다.

## 글 쓰고 올리기

### 작성 폴더 `desk/`

- 글은 저장소 루트의 작성 폴더 `desk/`에서 쓴다. Git에서 제외되어 내 PC에만 있고, 안의 구조(하위 폴더, Obsidian 설정, 메모)는 자유다.
- 새 원고는 템플릿 [docs/post-template.md](post-template.md)의 frontmatter 양식을 따른다(Obsidian Templates나 QuickAdd 등에 복사해 쓴다). VS Code에서는 `post` 입력 후 `Ctrl+Space`.
- 이미지는 원고와 같은 폴더의 `images/`에 두고 `![설명](./images/그림.png)`로 참조한다.

### 원고 미리보기

- `npm run dev`를 실행하고 http://127.0.0.1:4321/blog/ 를 연다. 등록된 글 전체와, `desk/`의 원고 가운데 원고 검사를 통과한 것이 "초안" 표시와 함께 보인다. 원고를 고쳐 저장하면 화면이 바로 바뀐다.
- 원고 검사(파일명, frontmatter, YAML 문법, slug 중복, 이미지)를 통과하지 못한 파일은 건너뛰고, 터미널 경고와 `logs/desk-check.log`(Git 제외)에 파일 경로와 이유를 남긴다. 서버 없이 같은 검사만 하려면 `npm run desk:check`.
- 원고 검사는 dev를 시작할 때 한 번 한다. 원고 파일을 새로 만들었거나 제외됐던 원고를 고쳤다면 dev를 다시 시작한다.
- 원고와 `draft: true`인 글은 RSS와 `npm run build` 결과물에 들어가지 않는다. Astro 7의 dev 서버는 뒤에서 계속 돌므로 다 보면 `npx astro dev stop`으로 끈다.

### 등록 (등록 도구)

저장소 루트의 `publish.cmd`를 더블클릭하면 창이 열린다(터미널에서는 `uv run scripts/publish.py`). 원고를 고르고 **등록**을 누르면 정해진 단계를 차례로 실행한다. 전 과정이 코드로만 돈다(LLM 없음).

단계별 설명과 실패했을 때 할 일은 [README](../README.md)의 "2.3 등록"과 "2.5 문제가 생겼을 때"에 있다. 단계 이름은 사전 점검(preflight), 원고 검사(validate), 배치(place), 빌드(build), 커밋(commit), push, Actions, 운영 확인(live)이다.

- push 전에 실패하면 이번 실행이 바꾼 파일과 커밋을 모두 되돌린다. 직접 고친 내용은 건드리지 않는다. push 뒤에 실패하면 사이트는 마지막 성공 배포 상태로 남는다.
- 실행 기록: `logs/publish/<시각>_<slug>.log`(단계마다 시작·끝·소요 시간·명령·종료 코드·출력)와 `logs/publish/summary.jsonl`(실행마다 한 줄). 최근 50개만 남긴다. 창의 **로그 열기**로 연다.
- 터미널 명령: `uv run scripts/publish.py list`, `preview <원고>`, `publish <원고>`, `remove <slug>`(등록된 글 내리기). `--yes`는 확인 질문을 건너뛰고, `--no-browser`는 브라우저를 열지 않는다.
- 이미 등록한 원고(`posts/`에 같은 파일 이름이 있음)는 목록에 "등록됨"으로 나오고, 미리보기에는 등록된 글이 보인다.

### push 전 확인 (선택)

`npm run check`와 `npm run build`가 통과하면 배포도 통과한다. 코드를 바꿨다면 `npm test`도 실행한다.

## 폴더와 URL

- 폴더 깊이는 최대 2단계로 정리한다: `posts/` 안에 주제 폴더 1단계, 그 안에 `images/`까지.
  - 허용: `posts/2026-10-16-first-post.md`, `posts/python/2026-10-20-uv-basics.md`, `posts/python/images/그림.png`
  - 쓰지 않음: `posts/python/basics/2026-10-20-uv-basics.md`
  - 이 규칙은 운영 습관이며 빌드에서 강제하지 않는다.
- **URL은 폴더와 무관하다.** 슬러그 = 파일명에서 날짜 접두사(`YYYY-MM-DD-`)를 뺀 값. 예: `posts/python/2026-10-20-uv-basics.md` → `/blog/uv-basics/`
  - 글을 다른 주제 폴더로 옮겨도 URL은 바뀌지 않는다.
  - 한 번 공개된 슬러그(파일명)는 바꾸지 않는다.
- 폴더가 달라도 같은 슬러그가 둘 이상이면 **빌드가 실패**하고 겹친 파일 경로가 표시된다.
- 주제 폴더는 정리용일 뿐이다. 사이트 분류는 frontmatter `tags`로만 한다.

## 브랜치·배포

- **모든 변경(글과 코드)은 `main`에 push한다.** push하면 GitHub Actions가 `npm test` → `npm run check` → `npm run build` → 배포를 실행한다.
- 큰 코드 변경을 나눠 작업하고 싶으면 짧은 작업 브랜치를 만들었다가 `main`에 merge하고 지운다. 상시 유지하는 브랜치는 `main` 하나다.
- 글 하나의 빌드 오류는 블로그 배포만 막는다. 사이트는 마지막 성공 배포본을 계속 보여 주므로 내려가지는 않는다. 포트폴리오에는 영향이 없다.

## 배포가 실패하면

1. GitHub Actions 로그에서 frontmatter 오류(필수 항목 누락, 날짜 형식)를 확인한다.
2. 슬러그 오류(중복·형식)인지 확인한다 (`Blog post slug check failed`, 겹친 경로가 로그에 나온다).
3. 이미지 경로 오류인지 확인한다 (`ImageNotFound`: 링크한 이미지 파일이 없거나 경로가 틀림).
4. 타입 오류인지 확인한다 (`npm run check` 단계).
5. 단위 테스트 실패인지 확인한다 (`npm test` 단계, 실패한 테스트 이름이 기대 동작을 알려 준다).

로컬에서 먼저 확인하려면 `npm test`, `npm run check`, `npm run build`를 실행한다.

## 검색 노출

- 블로그 페이지는 모두 색인을 허용한다.
- sitemap은 `https://tryfasting.github.io/blog/sitemap-index.xml`이다.
