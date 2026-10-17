# tryfasting blog — 나를 위한 안내서

개발하며 배운 내용을 기록하는 내 블로그다. 주소는 https://tryfasting.github.io/blog/ 이다.

이 문서는 **글을 올리는 나**와 **몇 달 뒤 이 저장소를 다시 여는 나**를 위해 쓴다. 이 저장소는 내가 쓴 MD 글을 정해진 디자인과 절차로 올리는 일만 맡고, 글의 내용에는 관여하지 않는다.

---

## 1. 글 올리기

### 지금 방식

1. **파일 만들기**: `posts/` 안에 `YYYY-MM-DD-영문-kebab-case.md` 이름으로 만든다.
   - kebab-case = 소문자 영어 단어를 하이픈으로 잇는 표기. 예: `2026-10-20-uv-basics.md`
   - 날짜를 뺀 부분(`uv-basics`)이 글 주소가 된다: `/blog/uv-basics/`. **한 번 올린 뒤에는 바꾸지 않는다**(링크가 깨진다).
2. **맨 위에 frontmatter를 쓴다.** VS Code에서는 `post` 입력 후 `Ctrl+Space`, Obsidian에서는 `docs/post-template.md`를 템플릿으로 쓴다.

   ```yaml
   ---
   title: 글 제목             # 필수
   date: 2026-10-20           # 필수
   description: 한두 문장 요약  # 필수 (목록과 검색 미리보기에 쓰임)
   tags: [python, uv]         # 선택
   draft: false               # 선택. true면 사이트에 안 나옴
   ---
   ```

3. **이미지**는 글과 같은 폴더의 `images/`에 넣고 `![설명](./images/그림.png)`로 쓴다.
4. **미리 보기**(선택): 터미널에서 `npm run dev` → 브라우저로 http://127.0.0.1:4321/blog/ . 공개 전 원고는 작성 폴더 `desk/`에 두면 "초안" 표시와 함께 여기서만 보인다(양식이 안 맞는 원고는 `logs/desk-check.log`에 이유가 남는다). 다 보면 `npx astro dev stop`.
5. **올리기**: `git add <글 파일과 이미지>` → `git commit` → `git push`. 1~2분 뒤 사이트에 반영된다.

빌드가 막아 주는 실수: 필수 항목 누락, 날짜 형식 오류, 파일명 규칙 위반(한글·대문자 등), 다른 글과 같은 주소, 없는 이미지. 이런 글은 배포되지 않고, 사이트는 마지막 정상 상태를 유지한다.

### 앞으로 (준비 중)

- 글은 **작성 폴더** `desk/`(Git 제외, 내 PC에만 있음)에서 Obsidian으로 자유롭게 쓴다.
- **등록 도구**(Python + tkinter 창, `uv run`으로 실행)에서 원고를 고르면, 규칙 검사 → `posts/`로 옮기기 → 빌드·화면 검증 → 커밋·push → 배포 확인까지 자동으로 하고, 다 되면 올라간 글을 브라우저로 열어 준다. 모든 단계는 로그로 남는다.
- 사이트에 **검색**(돋보기)이 생긴다.

---

## 2. 자주 쓰는 명령

터미널에서 저장소 폴더(`C:\Workspace\01-active\tryfasting-blog`)에서 실행한다.

| 명령 | 하는 일 | 언제 |
|---|---|---|
| `npm ci` | 패키지 설치(`package-lock.json` 그대로) | 처음 받았을 때, 다른 PC에서 |
| `npm run dev` | 내 PC에서 사이트 미리 보기(초안 포함). 끄기: `npx astro dev stop` | 글·디자인 확인 |
| `npm test` | 규칙 함수 단위 테스트(1초) | 코드를 바꿨을 때 |
| `npm run check` | 타입 검사 | push 전 |
| `npm run build` | 실제 사이트 파일 생성(`dist/`) | push 전 |
| `npm run preview` → `npm run verify` | 빌드 결과를 브라우저로 자동 점검하고 스크린샷 저장(`artifacts/verify/`) | push 전 |
| `npm run test:build` | 잘못된 글이 빌드에서 막히는지 확인(30초) | 빌드 규칙을 바꿨을 때 |

push하면 GitHub Actions가 `npm test` → `check` → `build`를 다시 돌리고, 통과하면 배포한다. 진행 상황: https://github.com/tryfasting/blog/actions

---

## 3. Python 개발자의 눈으로 본 이 저장소

이 블로그는 **Astro**(정적 사이트 생성기)로 만들었다. 마크다운을 읽어 HTML 파일들을 만들어 내고, 그 파일을 GitHub Pages가 그대로 보여 준다. 서버 프로그램은 없다.

| 이 저장소(Node.js) | Python에서 비슷한 것 |
|---|---|
| `package.json` | `pyproject.toml` (의존성과 실행 명령 목록) |
| `package-lock.json` | `uv.lock` (정확한 버전 고정, 직접 고치지 않음) |
| `node_modules/` | `.venv/` (설치된 패키지, Git 제외) |
| `npm ci` | `uv sync` |
| `npm run <이름>` | `uv run <명령>` (`package.json`의 `scripts`에 적힌 것) |
| `.ts` 파일 | 타입 힌트를 붙인 Python 파일 같은 것(TypeScript) |
| `.astro` 파일 | Jinja 템플릿 + 위쪽에 Python 코드 블록이 붙은 것 |
| `node --test` | `pytest` |

---

## 4. 블로그 구조

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

`desk/`는 Git에서 제외되어 내 PC에만 있다.

## 5. 용어

개발할 때 쓰는 이름이다. 사이트에 표시되는 이름과는 별개다.

**작성과 등록**

| 용어 | 뜻 |
|---|---|
| 작성 폴더 | 글을 쓰는 곳 `desk/`. Git에서 제외되어 내 PC에만 있음 |
| 등록 폴더 | 블로그에 올라간 글이 있는 곳 `posts/`. 커밋·push되어 공개됨 |
| 등록 | 작성 폴더의 글을 등록 폴더로 옮겨 커밋·push하는 일 |
| 배포 | push 뒤 GitHub Actions가 빌드해 사이트에 올리는 일 |

**페이지**

| 용어 | 주소 | 코드 |
|---|---|---|
| 목록 페이지 | `/blog/` | `src/pages/index.astro` |
| 글 페이지 | `/blog/<slug>/` | `src/pages/[slug].astro` |
| 태그 페이지 | `/blog/tags/<태그>/` | `src/pages/tags/[tag].astro` |
| 404 페이지 | 없는 주소 | `src/pages/404.astro` |
| 피드 | `/blog/rss.xml`, `/blog/sitemap-index.xml` | `src/pages/rss.xml.ts`, sitemap 통합 |
| 검색 (예정) | 정하는 중 | |
| 태그 모음 (예정) | 정하는 중 | |

**화면 구역** (모든 페이지 공통, 코드는 `src/blog/BlogLayout.astro`, `src/blog/blog.css`)

| 용어 | 가리키는 곳 | 코드 이름 |
|---|---|---|
| 머리 띠 | 맨 위 색 띠 전체 | `masthead` |
| 머리말 | 사이트 이름과 메뉴가 있는 줄 | `blog-header` |
| 제목 구역 | 제목·요약·메타 줄이 있는 구역 | `hero` |
| 본문 영역 | 머리 띠 아래 밝은 영역 | `main`, `blog-main` |
| 바닥글 | 맨 아래 검은 띠 | `blog-footer` |

---

## 6. 무엇을 바꾸려면 어디를 보나

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 글 | `posts/` |
| 색·글꼴·크기·간격 | `src/blog/blog.css` (맨 위 `:root`의 색 이름들) |
| 코드 블록 색 | `src/blog/code-theme.mjs` |
| 사이트 이름·설명 | `src/blog/site.ts` |
| 머리말·바닥글·공통 뼈대 | `src/blog/BlogLayout.astro` |
| 페이지 하나의 모양 | `src/pages/` 아래 해당 파일 |
| frontmatter 규칙(필수 항목 등) | `src/content.config.ts` |
| 주소·날짜·초안 같은 규칙 계산 | `src/blog/lib/` (테스트는 `tests/`) |
| 배포 과정 | `.github/workflows/deploy.yml` |

---

## 7. 배포가 안 됐을 때

1. https://github.com/tryfasting/blog/actions 에서 빨간 X가 붙은 실행을 연다.
2. 실패한 단계 이름을 본다.
   - `Unit tests`: 규칙 함수가 깨짐
   - `Type check`: 코드 타입 오류
   - `Build with Astro`: 대부분 글 문제. 로그에 원인이 나온다(필수 항목 누락, 날짜 형식, `Blog post slug check failed` = 파일명·주소 문제, `ImageNotFound` = 이미지 경로)
3. 고쳐서 다시 push한다. 실패하는 동안에도 사이트는 마지막 정상 상태로 떠 있다.

자세한 규칙: [docs/operations.md](docs/operations.md)

---

## 8. 오래 유지하려면

- **백업**: 아래 파일은 Git에 올라가지 않으므로 PC가 망가지면 사라진다. 따로 백업한다.
  - `desk/`: 공개 전 원고
  - `DESIGN.md`, `DESIGN-anthropic.md`: 디자인 기준과 참고 원본
  - `.plans/`: 작업 계획과 완료 기록
- **주소를 지키는 것들**
  - 저장소 이름 `blog`가 곧 주소의 `/blog/`다. 이름을 바꾸면 주소가 바뀐다.
  - GitHub 저장소 Settings → Pages → Source는 "GitHub Actions"여야 한다.
  - 올린 글의 파일명(날짜 뒤 부분)은 바꾸지 않는다.
- **패키지 업데이트**(몇 달에 한 번이면 충분): `npm outdated`로 확인 → `npm update` → `npm test`, `npm run check`, `npm run build`, `npm run preview` 후 `npm run verify`가 모두 통과하면 `package.json`, `package-lock.json`을 커밋한다. 큰 버전 업(예: Astro 7 → 8)은 공식 업그레이드 안내를 먼저 읽는다.
- **Node 버전**: Actions는 Node 24를 쓴다(`deploy.yml`). 내 PC도 같은 큰 버전을 쓰면 "내 PC에서는 되는데 배포는 실패"가 줄어든다.
- **비밀값 없음**: 이 저장소는 API 키나 비밀번호를 쓰지 않는다. 앞으로도 커밋하지 않는다.

## 9. 더 읽을 문서

- [운영 규칙](docs/operations.md): 글 작성 규칙, 폴더와 주소, 배포, 배포 실패 대응
- [AGENTS.md](AGENTS.md): AI 에이전트에게 주는 규칙(개발 원칙, 검증 루프)
- 포트폴리오와 블로그를 합친 도메인 전체 구조: [ARCHITECTURE.md](https://github.com/tryfasting/tryfasting.github.io/blob/main/ARCHITECTURE.md)
