# Cairn

과목별로, 하루씩 차분하게 공부를 계획하는 웹 앱이에요.

- **과목별 하루 계획:** 할 일이 과목 아래에 모여요. 과목은 입력창에서 바로 추가해요.
- **못 끝낸 일은 다음 날로 자동 이월:** 처음 계획한 날짜가 함께 표시돼요.
- **할 일과 일정 두 가지:** 할 일에 ‘마감 있음’을 켜면 마감이 돼요. 마감 전날과 당일에만 빨간 바가 떠요. 새 할 일은 오늘 이후에만 추가해요.
- **주간·월간·진행률:** 주간과 월간에서도 그 자리에서 계획을 보고 고칠 수 있어요.
- **습관:** 첫 화면에서 오늘 체크하고, 추가하고, 최근 14일 기록을 봐요.
- **AI로 계획 짜기:** 강의 자료나 교과서 PDF를 올리면 Gemini가 난이도를 보고 날짜별로 나눠 줘요. (Firebase AI Logic, 무료 등급)
- **안심 기능:** 지우거나 미룬 걸 되돌리기, 백업 파일 내려받기·복원, 끝난 플래너는 ‘지난 플래너’로 정리, 계정 삭제
- **손쉬운 정리:** 할 일을 왼쪽으로 밀면 내일로, ⋮⋮를 끌면 순서 바꾸기
- **기타:** 한국어/English, 라이트/다크, 처음 접속할 때 나오는 소개 화면, 어느 기기에서든 같은 계정으로 사용

## 구성
```
web/        웹 앱 (Firebase Hosting + Firestore). 빌드 과정 없이 public/ 폴더가 곧 사이트예요.
ai-proxy/   (지금은 안 씀) Claude로 AI 계획을 하고 싶을 때 쓰는 Cloudflare Worker.
```

## 올리기
```bash
cd web
npx firebase-tools deploy
```
자세한 설정은 `web/README.md`, AI 설정은 `ai-proxy/README.md`를 보세요.

## 테스트
```bash
node --test web/tests/logic.test.mjs
node --test web/tests/sync.test.mjs
node --test ai-proxy/test/proxy.test.mjs
```

아이폰 앱(SwiftUI)은 별도 저장소 `Planner-app`에 있어요.
