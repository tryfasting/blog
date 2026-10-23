---
title: Python Fluent Interface와 메서드 체이닝
date: 2026-10-23
description: "Fluent interface는 메서드가 `self`(또는 같은 타입의 새 객체)를 반환해서 `.a().b().c()`처럼 호출을 이어 쓰게 만든 API 설계 방식이다."
tags: [python]
draft: false
---

## 한 줄 요약

Fluent interface는 메서드가 `self`(또는 같은 타입의 새 객체)를 반환해서 `.a().b().c()`처럼 호출을 이어 쓰게 만든 API 설계 방식이다.

## 예시 (DuckDB)

```python
# 일반 방식: 중간 결과를 변수에 계속 저장
rel = con.sql("SELECT * FROM items")
rel = rel.filter("value > 1")
rel = rel.order("value")
df = rel.df()

# fluent 방식: 하나의 흐름으로 이어 씀
df = con.sql("SELECT * FROM items").filter("value > 1").order("value").df()
```

## 배운 점

### 체이닝 가능 여부는 반환 타입 설계에 달려 있다

* `a.b().c()`는 “`a.b()`의 반환값에 `.c()`를 호출”하는 평범한 Python 문법이다.
* 이어지려면 앞 메서드가 다음 메서드를 가진 객체를 반환해야 한다. Python이 자동으로 체이닝을 만들어 주지 않는다.
* DuckDB의 `filter()`, `project()`, `limit()`은 모두 `DuckDBPyRelation`을 반환하도록 설계되어 이어진다.
* 따라서 `filter()` → `order()` → `df()`가 왼쪽부터 순서대로 작동한다.
* 반대로 `list.append()`는 `None`을 반환하므로 `[].append(1).append(2)`는 에러가 난다.

문법은 Python이 제공하고, 체이닝 가능 여부는 라이브러리의 반환 타입 설계가 결정한다.

관련 글: [Python 괄호를 이용한 줄 이음 (Implicit Line Continuation)](../python-implicit-line-continuation/)
