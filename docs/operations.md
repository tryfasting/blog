# 블로그 운영 규칙

개발하며 배운 내용을 기록·공개하는 블로그. 저장소 `tryfasting/blog`의 GitHub Pages 프로젝트 사이트로, 주소는 `https://tryfasting.github.io/blog/`, 글은 `/blog/<slug>/`.

발행 흐름: **마크다운 작성 → `main`에 `git push` → GitHub Actions 빌드 → 자동 배포**

포트폴리오(`tryfasting/tryfasting.github.io`)와는 별개의 저장소다. 코드·빌드·패키지 버전을 공유하지 않고, 상단 "포트폴리오" 링크(`/general/`)로만 연결된다.

## 구조

| 위치 | 용도 |
|---|---|
| `posts/` | 글 (Obsidian 볼트로 여는 폴더) |
| `posts/_templates/` | Obsidian 기본 Templates용 템플릿 (빌드 제외) |
| `posts/_drafts/` | 공개 전 초안 (Git 제외, 빌드 제외) |
| `src/content.config.ts` | 컬렉션 정의, frontmatter 스키마 |
| `src/blog/` | 레이아웃·컴포넌트·CSS·helper (`posts.ts`의 `withBase`로 모든 내부 링크에 `/blog`를 붙임) |
| `src/pages/` | 라우트: `index`(목록), `[slug]`(글), `tags/[tag]`, `rss.xml`, `404` |
| `astro.config.mjs` | `base: '/blog'` (주소가 `/blog/` 아래인 이유) |
| `scripts/verify-blog.cjs` | 화면 검증 (`npm run verify [기본 URL]`) |

- 내부 링크는 반드시 `withBase()`로 만든다. `/blog/`를 직접 쓰거나 `/`로 시작하는 경로를 그대로 쓰지 않는다.

## 디자인

- **라이트 전용**. 다크모드·테마 전환 기능은 두지 않는다 (2026-10-16 사용자 결정). 클라이언트 JS는 쓰지 않는다.
- 따뜻한 무채색 편집형 디자인: 배경 `#f8f8f6`, 본문 `#121212`, 보조 `#373734`, 카드·코드 배경 `#efeeeb`, 선 `#e7e6e1`. 주황 `#d97757`은 작은 장식(점, 인용 선)에만 쓰고 글자·버튼에는 쓰지 않는다.
- 작은 글자(날짜·캡션)는 `#6b6964`를 쓴다. 원래 참고값 `#7b7974`는 배경 대비 4.09:1이라 4.5:1 기준에 맞게 어둡게 보정했다.
- 글 본문: 데스크톱 17px / 모바일 16px, 행간 1.7, 가독폭 680px. UI 글자는 11~16px, 제목 세리프 24·30px weight 400, 산세리프 강조는 weight 580까지.
- 폰트: 제목 세리프는 Source Serif 4(라틴) + Noto Serif KR(한글), 그 외는 Pretendard Variable. 코드는 시스템 고정폭 폰트.
- 코드 하이라이트는 색 대신 굵기·기울임·회색 단계로 구분하는 자체 테마(`src/blog/code-theme.mjs`)를 쓴다. 모든 토큰 색이 코드 배경 대비 4.5:1 이상이다.
- 본문 링크는 밑줄을 기본으로 둔다.

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

`npm run check`와 `npm run build`가 통과하면 배포도 통과한다.

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
