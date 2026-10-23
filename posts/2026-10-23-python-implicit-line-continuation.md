---
title: Python 괄호를 이용한 줄 이음 (Implicit Line Continuation)
date: 2026-10-23
description: "Python은 괄호 `()`, `[]`, `{}` 안에서는 줄바꿈을 무시하므로, 긴 표현식을 여러 줄로 나눠 쓸 수 있다."
tags: [python, pep8]
draft: false
---

## 한 줄 요약

Python은 괄호 `()`, `[]`, `{}` 안에서는 줄바꿈을 무시하므로, 긴 표현식을 여러 줄로 나눠 쓸 수 있다.

## 예시

```python
# 괄호 없이 쓰면 에러
rel = population_relation
    .filter("Population > 10000000")   # SyntaxError

# 괄호로 감싸면 OK
rel = (population_relation
    .filter("Population > 10000000")
    .limit(5))
```

## 배운 점

* 괄호가 없으면 줄바꿈에서 문장이 끝나 `SyntaxError`가 난다.
* 백슬래시(`\`)로도 이을 수 있지만, PEP 8은 괄호 방식을 권장한다.
* 메서드 체이닝을 여러 줄로 쓸 때 자주 쓰이는 패턴이다. ([Python Fluent Interface와 메서드 체이닝](../python-fluent-interface/)과 함께 보면 좋다.)
