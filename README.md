# tryfasting blog

개발하며 배운 내용을 기록하는 블로그입니다. 주소는 https://tryfasting.github.io/blog/ 입니다.

이 저장소는 작성한 MD 글을 정해진 디자인과 절차로 등록·배포하는 일만 맡고, 글의 내용은 다루지 않습니다.

## 블로그 구조

```
[작성] desk/ ── 등록 ──▶ [등록] posts/ ── push ──▶ GitHub Actions ── 배포 ──▶ tryfasting.github.io/blog/

사이트의 페이지
  /blog/              목록 페이지     전체 글, 최신순
  /blog/<slug>/       글 페이지       본문 + 목차(조건부)
  /blog/tags/<태그>/  태그 페이지     그 태그가 붙은 글
  /blog/404.html      404 페이지
  /blog/rss.xml 등    피드            사람이 아니라 프로그램이 읽는 파일
  (예정) 검색, 태그 모음

모든 페이지의 공통 뼈대
  ┌─ 머리 띠 ─────────────────────────────┐
  │  머리말: 사이트 이름 · 메뉴              │
  │  ───────────────────────────────────  │
  │  제목 구역: 제목 · 요약 · 메타 줄        │
  └──────────────────────────────────────┘
     본문 영역: (목차) | 본문 또는 목록 항목들
  ┌─ 바닥글 ──────────────────────────────┐
  └──────────────────────────────────────┘
```

- 작성 폴더 `desk/`는 아직 만들기 전입니다(지금은 `posts/_drafts/`가 그 역할). 검색과 태그 모음도 아직 없습니다.
- 글 주소의 `<slug>`는 파일명에서 날짜를 뺀 부분입니다. 예: `posts/2026-10-16-blog-opened.md` → `/blog/blog-opened/`

## 용어

개발할 때 쓰는 이름입니다. 사이트에 표시되는 이름과는 별개입니다.

### 작성과 등록

| 용어 | 뜻 |
|---|---|
| 작성 폴더 | 글을 쓰는 곳 `desk/`. Git에서 제외되어 내 PC에만 있음 |
| 등록 폴더 | 블로그에 올라간 글이 있는 곳 `posts/`. 커밋·push되어 공개됨 |
| 등록 | 작성 폴더의 글을 등록 폴더로 옮겨 커밋·push하는 일 |
| 배포 | push 뒤 GitHub Actions가 빌드해 사이트에 올리는 일 |

### 페이지

| 용어 | 주소 | 코드 |
|---|---|---|
| 목록 페이지 | `/blog/` | `src/pages/index.astro` |
| 글 페이지 | `/blog/<slug>/` | `src/pages/[slug].astro` |
| 태그 페이지 | `/blog/tags/<태그>/` | `src/pages/tags/[tag].astro` |
| 404 페이지 | 없는 주소 | `src/pages/404.astro` |
| 피드 | `/blog/rss.xml`, `/blog/sitemap-index.xml` | `src/pages/rss.xml.ts`, sitemap 통합 |
| 검색 (예정) | 정하는 중 | |
| 태그 모음 (예정) | 정하는 중 | |

### 화면 구역

모든 페이지에 공통입니다. 코드는 `src/blog/BlogLayout.astro`와 `src/blog/blog.css`에 있습니다.

| 용어 | 가리키는 곳 | 코드 이름 |
|---|---|---|
| 머리 띠 | 맨 위 색 띠 전체 | `masthead` |
| 머리말 | 사이트 이름과 메뉴가 있는 줄 | `blog-header` |
| 제목 구역 | 제목·요약·메타 줄이 있는 구역 | `hero` |
| 본문 영역 | 머리 띠 아래 밝은 영역 | `main`, `blog-main` |
| 바닥글 | 맨 아래 검은 띠 | `blog-footer` |

## 더 읽을 문서

- [운영 규칙](docs/operations.md): 글 작성 규칙, 폴더와 주소, 배포, 배포가 실패했을 때
- [AGENTS.md](AGENTS.md): 에이전트 규칙, 개발 원칙, 검증 루프
- 전체 도메인 구조(포트폴리오와 블로그): [ARCHITECTURE.md](https://github.com/tryfasting/tryfasting.github.io/blob/main/ARCHITECTURE.md)
