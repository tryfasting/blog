# 블로그 운영 규칙

개발하며 배운 내용을 기록·공개하는 블로그. 저장소 `tryfasting/blog`의 GitHub Pages 프로젝트 사이트로, 주소는 `https://tryfasting.github.io/blog/`, 글은 `/blog/<slug>/`.

발행 흐름: **마크다운 작성 → `main`에 `git push` → GitHub Actions 빌드 → 자동 배포**

포트폴리오(`tryfasting/tryfasting.github.io`)와는 별개의 저장소다. 코드·빌드·패키지 버전을 공유하지 않고, 상단 "포트폴리오" 링크(`/general/`)로만 연결된다.

## 목적과 범위

- **목적**: 개발하며 배운 내용을 기록·공개한다. 장기적으로 채용 담당자·면접관에게 보여 줄 수 있는 기록이 된다.
- **운영 원칙**: 간단하고 손이 덜 가며, 글 쓰고 올리기 쉽고, 오래 유지할 수 있을 것. 편집기는 Obsidian과 VS Code 어느 쪽이든 쓸 수 있어야 한다.
- **현재 범위**: 글 목록(최신순), 글 상세, 태그별 목록, RSS, sitemap, 메타·OG 태그, 포트폴리오 링크.
- **하지 않기로 한 것**(나중에 다시 검토): 댓글, 사이트 내 검색, 시리즈·카테고리, 조회수·애널리틱스, 목차(TOC) 자동 생성, 다크모드.

## 구조

| 위치 | 용도 |
|---|---|
| `posts/` | 글 (Obsidian 볼트로 여는 폴더) |
| `posts/_templates/` | Obsidian 기본 Templates용 템플릿 (빌드 제외) |
| `posts/_drafts/` | 공개 전 초안 (Git 제외, 빌드 제외) |
| `src/content.config.ts` | 컬렉션 정의, frontmatter 스키마 |
| `src/blog/` | 레이아웃·컴포넌트·CSS·helper (`posts.ts`의 `withBase`로 모든 내부 링크에 `/blog`를 붙임) |
| `src/blog/lib/` | Astro 없이 도는 순수 함수(주소 조립·날짜 표기). 페이지는 `posts.ts`를 거쳐 쓴다 |
| `tests/` | `lib` 단위 테스트 (`npm test`) |
| `src/pages/` | 라우트: `index`(목록), `[slug]`(글), `tags/[tag]`, `rss.xml`, `404` |
| `astro.config.mjs` | `base: '/blog'` (주소가 `/blog/` 아래인 이유) |
| `scripts/verify-blog.cjs` | 화면 검증과 스크린샷 (`npm run verify -- [기본 URL] [출력 폴더]`, 기본 출력 `artifacts/verify/`, Git 제외) |

- 내부 링크는 반드시 `withBase()`로 만든다. `/blog/`를 직접 쓰거나 `/`로 시작하는 경로를 그대로 쓰지 않는다.

## 디자인

- 색·글꼴·크기와 그 근거, 결정 이력은 로컬 전용 `DESIGN.md` 앞부분("블로그 디자인 기준")에 있다. refero에서 가져온 참고 원문이 같은 파일에 있어 커밋하지 않는다. 값의 실제 원본은 `src/blog/blog.css`와 `src/blog/code-theme.mjs`다.
- 지켜야 할 핵심 규칙
  - 라이트 전용이며 클라이언트 JavaScript는 쓰지 않는다.
  - 글 본문은 데스크톱 17px·모바일 16px, 행간 1.7, 가독폭 680px.
  - 작은 글자를 포함해 모든 글자는 배경 대비 4.5:1 이상. 주황(`--color-accent-mark`)은 장식에만 쓰고 글자·버튼에는 쓰지 않는다.
  - 새 색을 늘리지 않는다. 강조는 굵기·크기·회색 단계로 한다.
  - 375px에서 가로 넘침이 없어야 한다(`npm run verify`가 검사).

## 글 작성 규칙

- **표준 마크다운만** 쓴다. Obsidian `[[위키링크]]`, `![[임베드]]`는 쓰지 않는다.
- 이미지는 글과 같은 폴더의 `images/`에 두고 상대 경로로 참조한다: `![설명](./images/그림.png)`
- 파일명: `YYYY-MM-DD-영문-kebab-case.md` (소문자·숫자·하이픈만, 한글 파일명 금지). 날짜를 뺀 부분이 이 규칙에 맞지 않으면 빌드가 실패한다. `tags`는 예약어라 슬러그로 쓸 수 없다.
- frontmatter (빌드 시 검증, 필수 항목이 없거나 형식이 틀리면 빌드 실패)

  ```yaml
  ---
  title: 글 제목             # 필수
  date: 2026-10-16           # 필수
  description: 한두 문장 요약  # 필수 (목록·검색 미리보기·OG에 사용)
  tags: [astro, python]      # 선택, 기본값 []
  draft: false               # 선택, 기본값 false. true면 빌드에서 제외
  ---
  ```

- 공개 레포이므로 커밋된 `draft: true` 글은 사이트에는 안 보여도 GitHub 소스에서는 보인다. 공개 전 글은 `posts/_drafts/`에 둔다.

## 글 쓰고 올리기

### Obsidian

처음 한 번 설정한다 (`posts/`를 볼트로 연다. `posts/.obsidian/`은 Git에서 제외된다).

| 설정 위치 | 값 |
|---|---|
| Core plugins → Templates | 켜기. Template folder location: `_templates` |
| Files and links → Default location for new attachments | In subfolder under current folder, Subfolder name: `images` |
| Files and links → New link format | Relative path to file |
| Files and links → Use [[Wikilinks]] | 끄기 |

글 쓰는 순서

1. 주제 폴더(또는 `posts/` 바로 아래)에 새 노트를 `YYYY-MM-DD-영문-kebab-case` 이름으로 만든다.
2. 명령 팔레트 → "Templates: Insert template" → `blog-post`.
3. `title`(파일명이 들어가 있음)과 `description`, `tags`를 고쳐 쓴다.
4. 이미지는 붙여 넣으면 같은 폴더의 `images/`에 저장되고 표준 링크로 들어간다. 파일명에 공백이 있어도 된다.
5. 저장 후 `main`에 push한다.

공개 전 글은 `posts/_drafts/`에 두었다가 공개할 때 주제 폴더로 옮긴다.

### VS Code

1. `posts/` 안에 `YYYY-MM-DD-영문-kebab-case.md` 파일을 만든다.
2. `Ctrl+Shift+P` → "Insert Snippet" → "Blog post" (또는 `post` 입력 후 `Ctrl+Space`). 날짜는 오늘로 채워진다.
3. 이미지는 같은 폴더의 `images/`에 넣고 `![설명](./images/파일.png)`로 참조한다.

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

- **모든 변경(글과 코드)은 `main`에 push한다.** push하면 GitHub Actions가 `npm run check` → `npm run build` → 배포를 실행한다.
- 큰 코드 변경을 나눠 작업하고 싶으면 짧은 작업 브랜치를 만들었다가 `main`에 merge하고 지운다. 상시 유지하는 브랜치는 `main` 하나다.
- 글 하나의 빌드 오류는 블로그 배포만 막는다. 사이트는 마지막 성공 배포본을 계속 보여 주므로 내려가지는 않는다. 포트폴리오에는 영향이 없다.

## 배포가 실패하면

1. GitHub Actions 로그에서 frontmatter 오류(필수 항목 누락, 날짜 형식)를 확인한다.
2. 슬러그 오류(중복·형식)인지 확인한다 (`Blog post slug check failed`, 겹친 경로가 로그에 나온다).
3. 이미지 경로 오류인지 확인한다 (`ImageNotFound`: 링크한 이미지 파일이 없거나 경로가 틀림).
4. 타입 오류인지 확인한다 (`npm run check` 단계).

로컬에서 먼저 확인하려면 `npm run check`와 `npm run build`를 실행한다.

## 검색 노출

- 블로그 페이지는 모두 색인을 허용한다.
- sitemap은 `https://tryfasting.github.io/blog/sitemap-index.xml`이다.
