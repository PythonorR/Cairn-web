# Cairn AI proxy (Cloudflare Worker)

"AI로 계획 짜기"가 Claude를 부를 때 거치는 작은 서버예요. Anthropic API 키를 웹사이트에 노출하지 않으려고 둬요.

- 웹사이트는 Anthropic 공식 JavaScript SDK로 요청을 보내고, 로그인 토큰을 API 키 자리에 넣어요.
- 이 Worker가 Firebase 로그인 토큰을 확인하고, `ALLOWED_UIDS`에 있는 계정만 통과시켜요.
- 통과한 요청은 진짜 API 키(`ANTHROPIC_API_KEY`, Cloudflare 비밀값)로 바꿔서 api.anthropic.com에 그대로 전달해요.
- 사용 모델: `claude-opus-5-5`. 거절되면 Anthropic이 권하는 모델로 자동 재시도해요(`fallbacks: "default"`).

## 설치 (처음 한 번)
1. https://console.anthropic.com 에서 결제 수단을 등록하고 크레딧을 충전하세요. 그다음 **API Keys → Create Key**로 키를 만들어 복사해 두세요.
2. https://dash.cloudflare.com/sign-up 에서 무료로 가입하세요.
3. Firebase 콘솔 **Authentication → 사용자** 화면에서 내 계정의 **사용자 UID**를 복사하세요.
4. `wrangler.toml`의 `ALLOWED_UIDS = ""` 따옴표 안에 그 UID를 붙여 넣으세요.
5. 터미널에서 이 폴더로 이동해 차례로 실행하세요.
   ```bash
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler deploy
   ```
   두 번째 명령은 키를 물어봐요. 1번에서 복사한 키를 붙여 넣으세요.
6. 마지막에 나오는 주소(예: `https://planner-ai.이름.workers.dev`)를 `web/public/config.js`의 `AI_PROXY_URL`에 넣으세요.
7. 웹사이트를 다시 올리세요(`npx firebase-tools deploy`).

## 비용
Claude API는 쓴 만큼 Anthropic에 결제돼요. Opus 5.5 기준 입력 100만 토큰당 $4, 출력 100만 토큰당 $20예요. PDF는 한 쪽당 대략 1,500~3,000 토큰이에요.

예를 들어 30쪽 강의 자료 하나로 계획을 짜면 대략 $0.2~0.5예요. 두꺼운 자료일수록 비싸지니, 필요한 챕터만 올리세요.

Cloudflare Worker는 무료 요금제로 충분해요.

## 테스트
```bash
node --test test/proxy.test.mjs
```
