---
name: 위젯별 CSS 파일 분리
description: 위젯마다 별도의 CSS 파일을 만드는 구조로 진행
type: feedback
---

위젯마다 CSS 파일을 나눠서 만든다.

**Why:** 사용자가 위젯별로 스타일을 독립적으로 관리하고자 함.

**How to apply:** 새 위젯을 추가할 때 css/ 디렉토리 아래에 위젯 이름의 별도 CSS 파일(예: css/widget-name.css)을 생성하고, index.css는 공통 베이스 스타일 전용으로 유지한다.
