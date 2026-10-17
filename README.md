# desk — SJ의 개발기록

개발하며 배운 내용을 기록하는 블로그.

```text
https://tryfasting.github.io/blog/
```

이 저장소는 작성한 MD 글을 정해진 디자인과 절차로 등록하고 배포한다. 글의 내용은 다루지 않는다.

---

## 1. 블로그 구조

### 1.1 파이프라인

```text
[작성] desk/ ── 등록 ──▶ [등록] posts/ ── push ──▶ GitHub Actions ── 배포 ──▶ tryfasting.github.io/blog/
```

| 구간 | 범위 | 담당 |
|---|---|---|
| 등록 구간 | `desk/` → `posts/` → push | 등록 도구 (`publish.cmd`) |
| 배포 구간 | GitHub Actions → 운영 사이트 | `.github/workflows/deploy.yml` |

전 과정이 코드로만 동작한다. LLM은 들어가지 않는다.

### 1.2 페이지

| 페이지 | 주소 | 코드 |
|---|---|---|
| 목록 페이지 | `/blog/` | `src/pages/index.astro` |
| 글 페이지 | `/blog/<slug>/` | `src/pages/[slug].astro` |
| 태그 페이지 | `/blog/tags/<태그>/` | `src/pages/tags/[tag].astro` |
| 태그 모음 | `/blog/tags/` | `src/pages/tags/index.astro` |
| 404 페이지 | 없는 주소 | `src/pages/404.astro` |
| 피드 | `/blog/rss.xml`, `/blog/sitemap-index.xml` | `src/pages/rss.xml.ts`, sitemap 통합 |
| 검색 | 머리말의 돋보기로 여는 패널 | `public/search.js` |

`<slug>`는 글 파일 이름에서 날짜를 뺀 부분이다.

### 1.3 화면 구역

```text
┌─ 머리 띠 ─────────────────────────────┐
│  머리말: 사이트 이름 · 메뉴 · 돋보기       │
│  ───────────────────────────────────  │
│  제목 구역: 제목 · 요약 · 메타 줄        │
└──────────────────────────────────────┘
   본문 영역: (목차) | 본문 또는 목록 항목들
┌─ 바닥글 ──────────────────────────────┐
└──────────────────────────────────────┘
```

| 화면 구역 | 가리키는 곳 | 코드 이름 |
|---|---|---|
| 머리 띠 | 맨 위 색 띠 전체 | `masthead` |
| 머리말 | 사이트 이름과 메뉴가 있는 줄 | `blog-header` |
| 제목 구역 | 제목·요약·메타 줄이 있는 구역 | `hero` |
| 본문 영역 | 머리 띠 아래 밝은 영역 | `main`, `blog-main` |
| 바닥글 | 맨 아래 검은 띠 | `blog-footer` |

코드는 `src/blog/BlogLayout.astro`와 `src/blog/blog.css`에 있다.

### 1.4 폴더

| 폴더·파일 | 내용 | Git |
|---|---|---|
| `desk/` | 작성 폴더. 원고를 쓰는 Obsidian 볼트 | 제외 |
| `posts/` | 등록 폴더. 등록된 글, 이미지는 `posts/images/<slug>/` | 포함 |
| `docs/post-template.md` | 원고 양식(템플릿) | 포함 |
| `logs/` | 원고 검사와 등록 실행 기록 | 제외 |
| `publish.cmd` | 등록 도구 실행 파일 | 포함 |
| `scripts/` | 등록 도구, 원고 검사, 화면 검증 | 포함 |
| `src/` | 사이트 코드 | 포함 |
| `tests/` | 테스트 | 포함 |

---

## 2. 사용법

### 2.1 글 쓰기

```text
desk/2026-10-20-uv-basics.md
```

```yaml
---
title: 글 제목
date: 2026-10-20
description: 한두 문장 요약
tags: [python, uv]
---
```

```markdown
![그림 설명](./images/그림.png)
[다른 글 제목](../uv-basics/)
```

- 원고는 `desk/` 아래 어느 폴더에 두어도 된다.
- 파일 이름은 날짜와 영문 소문자, 숫자, 하이픈만 쓴다.
- `title`, `date`, `description`은 필수다. `tags`는 선택이다.
- 이미지는 원고 옆 `images/` 폴더에 두고 상대 경로로 링크한다.
- 다른 글은 주소로 링크한다.
- 표준 마크다운만 쓴다. Obsidian 위키링크(`[[ ]]`)는 쓰지 않는다.

이유

- 날짜를 뺀 파일 이름이 글 주소가 된다. 등록한 뒤 파일 이름을 바꾸면 주소가 바뀌어 링크가 깨진다.
- 영문 소문자를 하이픈으로 잇는 표기를 kebab-case라고 한다. 주소에 한글·대문자·공백이 들어가면 깨지거나 길게 인코딩된다.
- `docs/post-template.md`를 Obsidian 템플릿으로 쓰면 frontmatter 양식이 자동으로 맞는다.
- 세부 규칙은 [docs/operations.md](docs/operations.md)의 "글 작성 규칙"에 있다.

### 2.2 미리보기

```bash
npm run dev
```

```text
http://127.0.0.1:4321/blog/
```

```bash
npx astro dev stop
```

- 등록된 글 전체와, `desk/`의 원고 가운데 원고 검사를 통과한 것이 "초안" 표시와 함께 보인다.
- 원고를 고쳐 저장하면 화면이 바로 바뀐다.
- 원고 파일을 새로 만들었으면 dev를 끄고 다시 켠다.
- 화면에 없는 원고는 원고 검사를 통과하지 못한 것이다. 이유는 아래에서 본다.

```bash
npm run desk:check
```

```text
logs/desk-check.log
```

이유

- dev는 켜질 때 `desk/`를 한 번 훑는다. 그래서 새 파일은 다시 켜야 보인다.
- `desk/`에는 블로그 글이 아닌 메모도 있을 수 있다. 그런 파일 때문에 dev가 멈추지 않도록 검사를 통과한 원고만 보여 준다.
- 검색은 dev에서 동작하지 않는다. 검색 색인은 `npm run build`가 만든다.

### 2.3 등록

```text
publish.cmd 더블클릭 → 원고 선택 → 등록 → 확인
```

```bash
uv run scripts/publish.py publish desk/2026-10-20-uv-basics.md
```

1. `publish.cmd`를 더블클릭해 창을 연다.
2. 목록에서 상태가 "등록 가능"인 원고를 고른다.
3. **등록**을 누르고 확인한다.
4. 단계 표시가 모두 ✓가 되면 브라우저로 새 글이 열린다.

| 단계 | 하는 일 |
|---|---|
| 사전 점검 | `main` 브랜치, 커밋하지 않은 변경 없음, 원격과 같은 상태인지 확인 |
| 원고 검사 | 미리보기와 같은 규칙으로 검사 |
| 배치 | 원고를 `posts/`로, 이미지를 `posts/images/<slug>/`로 복사 |
| 빌드 | `npm run build` |
| 커밋 | `posts/` 변경만 커밋 (`post: <slug>`) |
| push | `git push origin main` |
| Actions | 배포가 끝날 때까지 대기 |
| 운영 확인 | 새 글 주소와 RSS 확인 후 브라우저로 열기 |

이유

- `desk/` 원본은 그대로 남는다. 등록되는 것은 사본이다.
- push 전에 실패하면 이번 실행이 바꾼 파일과 커밋을 모두 되돌린다. 직접 고친 내용은 건드리지 않는다.
- 한 번에 1~2분 걸린다. 대부분은 Actions를 기다리는 시간이다.

### 2.4 고치기와 내리기

고치기

```text
desk/의 원고 수정 → publish.cmd → 같은 원고("등록됨") 선택 → 등록 → 갱신 확인
```

내리기

```bash
uv run scripts/publish.py remove uv-basics
```

- 같은 파일 이름의 원고를 다시 등록하면 기존 글을 덮어쓴다 (`post: update <slug>`).
- 내용이 같으면 "바꿀 것이 없음"으로 멈추고 아무것도 바꾸지 않는다.
- 내리기는 `posts/`에서 글과 이미지를 지우고 배포한다 (`post: remove <slug>`). `desk/` 원본은 남는다.

이유

- 공개 저장소라서 내린 글도 GitHub의 커밋 기록에는 남는다.

### 2.5 문제가 생겼을 때

```text
logs/publish/<시각>_<slug>.log
logs/publish/summary.jsonl
https://github.com/tryfasting/blog/actions
```

1. 창의 실패 메시지에서 실패한 단계를 본다.
2. **로그 열기**로 그 실행의 로그를 연다.
3. 아래 표대로 고친 뒤 다시 등록한다.

| 실패한 단계 | 할 일 |
|---|---|
| 사전 점검 | 메시지대로 정리한다. 커밋하지 않은 변경을 커밋하거나 되돌리고, 원격과 어긋나면 `git pull` 또는 `git push` |
| 원고 검사 | 메시지의 이유대로 원고를 고친다 |
| 빌드 | 로그에서 오류 문구를 찾는다 (아래 표) |
| push | 인터넷 연결과 GitHub 로그인을 확인한다 |
| Actions | 메시지의 Actions 주소를 열어 실패한 단계를 본다 |
| 운영 확인 | 몇 분 뒤 글 주소를 다시 연다 |

| 빌드 오류 문구 | 뜻 |
|---|---|
| `Blog post slug check failed` | 파일 이름 규칙 위반 또는 다른 글과 같은 주소 |
| `ImageNotFound` | 링크한 이미지 파일이 없음 |
| `InvalidContentEntryDataError` | frontmatter 필수 항목 누락 또는 형식 오류 |

이유

- 로그에는 단계마다 시작·끝·소요 시간, 실행한 명령, 종료 코드, 출력이 남는다. 최근 50개만 보관한다.
- push 뒤에 실패해도 사이트는 마지막으로 성공한 배포 상태로 떠 있다.

---

## 3. 명령 모음

| 명령 | 하는 일 | 언제 |
|---|---|---|
| `publish.cmd` | 등록 도구 창 열기 | 글을 등록·갱신할 때 |
| `uv run scripts/publish.py list` | 원고 목록과 상태 | 창 없이 볼 때 |
| `uv run scripts/publish.py preview <원고>` | dev를 다시 켜고 원고 열기 | 창 없이 미리볼 때 |
| `uv run scripts/publish.py publish <원고>` | 등록 또는 갱신 | 창 없이 등록할 때 |
| `uv run scripts/publish.py remove <slug>` | 글 내리기 | 공개를 취소할 때 |
| `npm run dev` | 미리보기 서버 켜기 | 글을 쓰면서 |
| `npx astro dev stop` | 미리보기 서버 끄기 | 다 본 뒤 |
| `npm run desk:check` | 원고 검사만 | 원고가 미리보기에 안 보일 때 |
| `npm ci` | 패키지 설치 | 저장소를 처음 받았을 때 |
| `npm test` | 사이트 규칙 단위 테스트 | 사이트 코드를 고쳤을 때 |
| `npm run test:py` | 등록 도구 테스트 | 등록 도구를 고쳤을 때 |
| `npm run test:build` | 잘못된 글이 빌드에서 막히는지 확인 (약 30초) | 빌드 규칙을 고쳤을 때 |
| `npm run check` | 타입 검사 | 코드를 고쳤을 때 |
| `npm run build` | 사이트 파일과 검색 색인 만들기 | 코드를 고쳤을 때 |
| `npm run preview` → `npm run verify` | 빌드 결과를 브라우저로 자동 점검 | 코드나 디자인을 고쳤을 때 |

`<원고>`는 `desk/`로 시작하는 원고 경로, `<slug>`는 날짜를 뺀 파일 이름이다.

---

## 4. 유지보수

### 4.1 백업

```text
desk/
DESIGN.md
DESIGN-anthropic.md
.plans/
```

- 위 파일은 Git에 올라가지 않는다. PC가 망가지면 사라지므로 따로 백업한다.
- `logs/`, `dist/`, `artifacts/`, `node_modules/`는 지워져도 다시 생긴다.

### 4.2 주소를 지키는 것들

- 저장소 이름 `blog`를 바꾸지 않는다.
- GitHub 저장소의 Settings → Pages → Source를 "GitHub Actions"로 둔다.
- 등록한 글의 파일 이름을 바꾸지 않는다.

이유

- 저장소 이름이 주소의 `/blog/`이고, 파일 이름이 글 주소다.

### 4.3 패키지 업데이트

```bash
npm outdated
npm update
npm audit
npm test
npm run test:py
npm run check
npm run build
npm run preview
npm run verify
```

1. 위 명령을 차례로 실행한다.
2. 모두 통과하면 `package.json`과 `package-lock.json`을 커밋하고 push한다.

이유

- 몇 달에 한 번이면 충분하다.
- 큰 버전이 바뀌는 업데이트(Astro 7 → 8 같은)는 공식 업그레이드 안내를 먼저 읽는다.
- GitHub Actions는 Node 24를 쓴다. 내 PC도 같은 큰 버전을 쓰면 "내 PC에서는 되는데 배포는 실패"가 줄어든다.
- 등록 도구에는 uv와 Python 3.12 이상이 필요하다.

### 4.4 Python 개발자를 위한 대응표

| 이 저장소(Node.js) | Python에서 비슷한 것 |
|---|---|
| `package.json` | `pyproject.toml` |
| `package-lock.json` | `uv.lock` |
| `node_modules/` | `.venv/` |
| `npm ci` | `uv sync` |
| `npm run <이름>` | `uv run <명령>` |
| `.ts` 파일 | 타입 힌트를 붙인 Python 파일 |
| `.astro` 파일 | 위쪽에 코드 블록이 붙은 Jinja 템플릿 |
| `node --test` | `pytest` |

사이트는 Astro(정적 사이트 생성기)로 만든다. 마크다운을 읽어 HTML 파일을 만들고, 그 파일을 GitHub Pages가 그대로 보여 준다. 서버 프로그램은 없다.

---

## 5. 더 읽을 문서

| 문서 | 내용 |
|---|---|
| [docs/operations.md](docs/operations.md) | 운영 규칙. 글 작성 규칙, 폴더와 주소, 디자인 규칙, 배포 |
| [AGENTS.md](AGENTS.md) | AI 에이전트에게 주는 규칙. 개발 원칙, 검증 루프 |
| [ARCHITECTURE.md](https://github.com/tryfasting/tryfasting.github.io/blob/main/ARCHITECTURE.md) | 포트폴리오와 블로그를 합친 도메인 전체 구조 |
