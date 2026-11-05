# Cairn (웹)

과목별로 하루씩 차분하게 공부를 계획하는 웹 앱이에요. (아이폰 앱 Planner의 웹 버전) 주소로 접속하고, 계정으로 로그인하면 어느 기기에서든 같은 데이터가 보여요.

- 로그인: 이메일+비밀번호, Google
- 저장: Firebase (Firestore). 각 사람은 자기 데이터만 볼 수 있어요 (`firestore.rules`).
- 비용: Firebase 무료 요금제(Spark). 카드 등록이 없어서 요금이 청구될 수 없어요.
- 빌드 과정 없음: `public` 폴더가 곧 웹사이트예요.

## 1. Firebase 프로젝트 만들기 (처음 한 번, 약 10분)

1. https://console.firebase.google.com 에 Google 계정으로 들어가서 **프로젝트 추가**를 누르세요.
   - 이름은 예를 들어 `planner`로 하세요. 이름에 따라 주소가 `https://<프로젝트 ID>.web.app`이 돼요.
   - Google 애널리틱스는 **사용 안 함**으로 두세요.
2. 왼쪽 메뉴 **빌드 → Authentication → 시작하기**를 누르세요.
   - **로그인 방법** 탭에서 **이메일/비밀번호**를 켜고 저장하세요.
   - **Google**도 켜고, 지원 이메일을 고른 뒤 저장하세요.
3. **빌드 → Firestore Database → 데이터베이스 만들기**를 누르세요.
   - 위치는 **asia-northeast3 (Seoul)**을 고르세요.
   - **프로덕션 모드**로 만드세요. 보안 규칙은 4단계에서 자동으로 올라가요.
4. 톱니바퀴 **프로젝트 설정 → 일반 → 내 앱**에서 **`</>`(웹)** 아이콘을 누르세요.
   - 앱 닉네임은 `planner`로 하고 **앱 등록**을 누르세요. Hosting 체크는 안 해도 돼요.
   - 화면에 나온 `firebaseConfig` 값(`apiKey`, `authDomain`, …)을 **`public/config.js`**에 붙여 넣으세요.
     또는 저에게 보내 주면 제가 넣어 드릴게요. 이 값은 비밀번호가 아니라서 공개돼도 괜찮아요.

## 2. 인터넷에 올리기 (Mac 터미널)

1. https://nodejs.org 에서 **LTS** 버전을 받아 설치하세요.
2. 터미널을 열고 이 `web` 폴더로 이동하세요. 경로는 실제 위치에 맞게 바꾸세요.
   ```bash
   cd ~/Downloads/Planner/web
   ```
3. Firebase에 로그인하세요. 브라우저가 열리면 1단계에서 쓴 Google 계정으로 로그인하면 돼요.
   ```bash
   npx firebase-tools login
   ```
4. 올리세요. `<프로젝트 ID>`는 Firebase 프로젝트 설정에 나오는 ID예요.
   ```bash
   npx firebase-tools deploy --project <프로젝트 ID>
   ```
5. 끝나면 `Hosting URL: https://<프로젝트 ID>.web.app` 주소가 나와요. 이게 웹사이트 주소예요.

코드를 고친 뒤에는 4번만 다시 실행하면 돼요.

## 아이폰 홈 화면에 앱처럼 추가하기
Safari로 주소를 열고 **공유 → 홈 화면에 추가**를 누르세요.

## 미리보기 (Firebase 없이)
`config.js`가 비어 있으면 **미리보기 모드**로 열려요. 이 모드에서는 데이터가 그 브라우저에만 저장돼요.
```bash
cd web/public && python3 -m http.server 8000
```
브라우저에서 http://localhost:8000 을 여세요.

## 테스트
```bash
node --test web/tests/logic.test.mjs
node --test web/tests/sync.test.mjs
```

## AI로 계획 짜기 (선택)
플래너 화면 위쪽 ✦ 버튼으로 써요. 강의 자료나 교과서 PDF를 올리면 Claude가 난이도를 보고 날짜별로 나눠 줘요.

이 기능은 `config.js`의 `AI_EMAILS`에 있는 계정에만 보여요.

켜는 방법은 `../ai-proxy/README.md`를 보세요. 설정이 끝나면 `config.js`의 `AI_PROXY_URL`에 주소를 넣으면 돼요.

## 앱과 다른 점
- **알림 없음:** 8시 알림은 서버가 필요해서 웹에는 넣지 않았어요. 빨간 마감 바는 똑같이 보여요.
- **길게 누르기 / 우클릭:** 할 일 행을 길게 누르거나(휴대폰) 우클릭하면(컴퓨터) Delete 메뉴가 나와요.
- **계정 메뉴:** 목록 화면 오른쪽 위의 동그란 이니셜 버튼에서 로그아웃할 수 있어요.
