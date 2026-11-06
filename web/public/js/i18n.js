// English / Korean UI text. The language is saved per device and switched from Settings,
// the account menu, or the sign-in page (the page reloads in the new language).

const KEY = "lang";

function detect() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "ko") return saved;
  } catch {}
  return (globalThis.navigator?.language || "en").toLowerCase().startsWith("ko") ? "ko" : "en";
}

export const lang = detect();
export const locale = lang === "ko" ? "ko-KR" : "en-US";

export function setLang(next) {
  try { localStorage.setItem(KEY, next); } catch {}
  setTimeout(() => location.reload(), 350); // let pending saves reach the local database first
}

const en = {
  // common
  cancel: "Cancel", save: "Save", create: "Create", done: "Done", delete: "Delete", edit: "Edit", new: "New",
  name: "Name", start: "Start", end: "End", date: "Date", time: "Time", subject: "Subject", none: "None",
  today: "Today", back: "Back to planners", planners: "Planners", brand: "Cairn", moreOptions: "More options",
  ofDone: "{done} of {total} done", saveFailed: "Couldn't save. Check your connection.",
  loadFailed: "Couldn't load your planners. Check your connection.",
  language: "Language", theme: "Theme", auto: "Auto", light: "Light", dark: "Dark",
  untitled: "Untitled", untitledSubject: "Untitled subject", noSubject: "No subject",
  // auth
  signIn: "Sign in", signInSub: "Your planners, on any device.", email: "Email", password: "Password",
  createAccount: "Create account", createAnAccount: "Create an account", forgot: "Forgot password?",
  signUpSub: "Free. Your data is private to your account.", optional: "(optional)", sixChars: "(6+ characters)",
  haveAccount: "Already have an account? Sign in", resetTitle: "Reset password",
  resetSub: "We'll email you a link to choose a new password.", sendReset: "Send reset link",
  resetSent: "If an account exists for {email}, a reset link is on its way. Check your inbox (and spam).",
  backToSignIn: "Back to sign in", google: "Continue with Google", or: "or", madeBy: "Made by Jimin",
  previewMode: "Preview mode: data stays in this browser. Add your Firebase settings to turn on accounts.",
  // auth errors
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/email-already-in-use": "An account with this email already exists. Try signing in.",
  "auth/weak-password": "Use at least 6 characters.",
  "auth/missing-password": "Enter your password.",
  "auth/too-many-requests": "Too many tries. Wait a moment and try again.",
  "auth/network-request-failed": "No connection. Check your internet and try again.",
  "auth/popup-blocked": "The Google window was blocked. Allow pop-ups and try again.",
  "auth/account-exists-with-different-credential": "This email already uses a different sign-in method.",
  "auth/operation-not-allowed": "This sign-in method isn't turned on in Firebase yet.",
  "auth/unauthorized-domain": "This web address isn't allowed in Firebase Authentication yet.",
  authUnknown: "Something went wrong. Please try again.",
  // list
  downloadBackup: "Download a backup", restoreBackup: "Restore from a backup…", deleteAccount: "Delete account",
  restoreConfirm: "Restore {p} planners and {h} habits from this file? Anything already here from the same backup is replaced by the file.",
  restored: "Restored {p} planners and {h} habits.", restoreFailed: "That file isn't a Cairn backup.",
  deleteAccountConfirm: "Delete your account and all of your planners and habits? This can't be undone. Download a backup first if you want to keep anything.",
  deleteAccountReauth: "For your security, sign in again and then delete the account right away.",
  pastPlanners: "Past planners ({n})", noActivePlanners: "No current planners",
  howItWorks: "How it works", account: "Account", signOut: "Sign out", noPlanners: "No planners yet",
  noPlannersHelp: "A planner covers a stretch of study days, like a midterm week. Start one with the button below.",
  newHere: "New here? See how it works",
  newPlanner: "New planner", newPlannerBtn: "＋ New planner", namePlaceholder: "e.g. Finals",
  startFrom: "Start from", blank: "Blank",   subjectsFrom: "Subjects from {name}", subjects: "Subjects", addSubject: "Add subject",
  subjectName: "Subject name", subjectsHelp: "Add the classes you're studying for. You can change them later in ⚙︎ settings.",
  deleteSubject: "Delete {name}", colour: "Colour",
  // planner
  tabDay: "Day", tabWeek: "Week", tabMonth: "Month", tabProgress: "Progress",
  plannerSettings: "Planner settings", goToday: "Go to today",
  addFor: "Add a task for {day}", addForToday: "Add a task for today", tabHint: "Press Tab to change the subject", newTask: "New task",
  nothingPlanned: "Nothing planned. Type below to add a task.", nothingPlannedShort: "Nothing planned", nothingPlannedHere: "Nothing planned. Type below to add to this day.",
  dueEvents: "Due & events", isDueToday: "{title} is due today", isDueTomorrow: "{title} is due tomorrow",
  more: "+{n} more", due: "Due", event: "event", markDone: "Mark {title} done", markNotDone: "Mark {title} not done",
  movedFrom: "↩ from {day}", isDone: "done", notDone: "not done", dueDate: "due date",
  thisWeek: "This week", weekOf: "Week of {day}", prevWeek: "Previous week", nextWeek: "Next week",
  prevMonth: "Previous month", nextMonth: "Next month", legendDue: "Due date", legendEvent: "Event",
  dayOf: "DAY {k} OF {n}", startsOn: "STARTS {day}", ended: "ENDED · {n} DAYS", percentDone: "{n} percent done",
  leftToday: "left today", rolledOver: "rolled over", perDay: "tasks per day", minutes: "{n} min",
  // editor
  type: "Type", task: "Task", dueDateKind: "Due date", eventKind: "Event", title: "Title",
  phTask: "What will you study?", phDue: "What is due?", phEvent: "Event",
  repeat: "Repeat", never: "Never", everyDay: "Every day", weekdays: "Weekdays", everyWeek: "Every week",
  rolloverNote: "If you don't finish it, it moves to the next day on its own.",
  undo: "Undo", deletedItem: "Deleted “{title}”", postponed: "Moved “{title}” to the next day", tomorrow: "Tomorrow", moveToTomorrow: "Move to tomorrow", dragToReorder: "Drag to reorder",
  addingOn: "Adding to {day}", hasDeadline: "Has a deadline", dueTime: "Due time",
  noSubjectsYet: "Add your subjects and today's tasks will be grouped by class.", subjectsLater: "You can rename or recolour subjects later in ⚙︎ settings.",
  newSubjectOption: "＋ New subject…", pastNoAdd: "Can't add to past days", goTodayShort: "Go to today", addEvent: "Add an event",
  dueNote: "With a deadline, it stays on its date (it doesn't move to the next day) and a red bar shows the day before and on the day.",
  eventNote: "Events are things that happen at a set time, like an exam or office hours. No checkbox, no subject, and they don't count toward progress.",
  // settings
  settings: "Settings", planner: "Planner", plannerName: "Planner name",
  deleteSubjectNote: "Deleting a subject keeps its tasks. They show under “No subject”.",
  deletePlanner: "Delete planner",
  deletePlannerConfirm: "Delete “{name}”? All of its tasks, due dates and events will be removed. This can't be undone.",
  // habits
  habits: "Habits", habitsToday: "Today's habits", daysUnit: "days", habitKeepGoing: "Keep it going", last14: "Last 14 days", addHabit: "Add habit", addFirstHabit: "Add a daily habit", habitName: "Habit",
  habitPh: "e.g. Go to the library", newHabit: "New habit", editHabit: "Edit habit",
  habitDay: "Day {n}", habitStreak: "{n} in a row", habitNotStarted: "Not started yet",
  habitNote: "Check it on the first screen each day you do it. “Day” counts every day you've done it; “in a row” counts the days back from today without a gap.",
  deleteHabit: "Delete habit", deleteHabitConfirm: "Delete “{name}” and its history?",
  markHabit: "Mark {title} for this day", unmarkHabit: "Unmark {title} for this day",
  // AI
  planWithAI: "Plan with AI", aiTitle: "Plan with AI",
  aiIntro: "Add your lecture slides or textbook chapters. Gemini reads them, judges how hard each part is, and spreads the work across your days.",
  materials: "Materials", addFiles: "Add PDFs or images", filesHelp: "PDF, PNG or JPG · up to 14 MB in total · large textbooks: add the chapters you need",
  remove: "Remove", scope: "What to cover", scopePh: "e.g. Chapters 4–6 and Lectures 12–16. Quiz on Friday.",
  finishBy: "Finish by", dailyTime: "Study time per day", makePlan: "Make my plan",
  thinking: "Reading your materials and planning… this can take a minute or two.",
  aiNeedsInput: "Add materials or describe what to cover.", aiTooBig: "These files are too large together (max 14 MB).",
  aiNotSetUp: "AI planning isn't turned on in Firebase yet (AI Logic).", aiAppCheck: "This site couldn't prove it's really Cairn (App Check). Refresh the page and try again.", aiNotAllowed: "AI planning isn't turned on for this account.",
  aiFailed: "Couldn't make a plan. Please try again.", aiNetwork: "The connection dropped. If the files are large, try one chapter at a time.", aiRefused: "The AI couldn't plan from these materials. Try different files or a shorter description.",
  aiPreview: "{n} tasks over {d} days", imageTooBig: "{name} is over 5 MB. Use a smaller image or a PDF.", badFile: "{name} isn't a PDF or image.", aiAuth: "Please sign in again.", aiBusy: "The AI is busy or today's free limit is used up. Try again later.", addTasks: "Add {n} tasks", tryAgain: "Try again",
  easy: "easy", medium: "medium", hard: "hard", hours: "{n} h", mins: "{n} min",
  // guide
  skip: "Skip", swipeHint: "Swipe to see how it works", clickHint: "Click anywhere to see how it works", takeTour: "Take the tour",
  tourSub: "A planner for students who study by subject. Here is how it works — it takes a minute.",
  readyTitle: "Ready when you are", readyText: "Create a free account to keep your planners on every device.", readyTextIn: "Make a planner, add your subjects, and start with today.",
  guideKicker: "How it works", guideTitle: "Study by subject, one calm day at a time.",
  startPlanning: "Start planning",
  guideTips: "Tap a task to edit · Swipe left to move it to tomorrow · Long-press (or right-click) for the menu · Drag ⋮⋮ to reorder · Deleted something? Tap Undo · Past planners fold away on the first screen",
};

const ko = {
  cancel: "취소", save: "저장", create: "만들기", done: "완료", delete: "삭제", edit: "편집", new: "새 항목",
  name: "이름", start: "시작", end: "끝", date: "날짜", time: "시간", subject: "과목", none: "없음",
  today: "오늘", back: "플래너 목록으로", planners: "플래너", brand: "Cairn", moreOptions: "더 보기",
  ofDone: "{total}개 중 {done}개 완료", saveFailed: "저장하지 못했어요. 인터넷 연결을 확인해 주세요.",
  loadFailed: "플래너를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.",
  language: "언어", theme: "테마", auto: "자동", light: "라이트", dark: "다크",
  untitled: "제목 없음", untitledSubject: "이름 없는 과목", noSubject: "과목 없음",
  signIn: "로그인", signInSub: "어느 기기에서든 내 플래너를.", email: "이메일", password: "비밀번호",
  createAccount: "가입하기", createAnAccount: "계정 만들기", forgot: "비밀번호를 잊으셨나요?",
  signUpSub: "무료예요. 내 데이터는 나만 볼 수 있어요.", optional: "(선택)", sixChars: "(6자 이상)",
  haveAccount: "이미 계정이 있나요? 로그인", resetTitle: "비밀번호 재설정",
  resetSub: "새 비밀번호를 정할 수 있는 링크를 이메일로 보내드려요.", sendReset: "재설정 링크 보내기",
  resetSent: "{email} 계정이 있다면 재설정 링크를 보냈어요. 받은편지함(과 스팸함)을 확인해 주세요.",
  backToSignIn: "로그인으로 돌아가기", google: "Google로 계속하기", or: "또는", madeBy: "Made by Jimin",
  previewMode: "미리보기 모드: 데이터가 이 브라우저에만 저장돼요. Firebase 설정을 넣으면 계정이 켜져요.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 틀렸어요.",
  "auth/invalid-email": "이메일 주소 형식이 올바르지 않아요.",
  "auth/email-already-in-use": "이미 가입된 이메일이에요. 로그인해 보세요.",
  "auth/weak-password": "6자 이상 입력해 주세요.",
  "auth/missing-password": "비밀번호를 입력해 주세요.",
  "auth/too-many-requests": "시도가 너무 많아요. 잠시 후 다시 해 주세요.",
  "auth/network-request-failed": "인터넷에 연결되지 않았어요. 연결을 확인해 주세요.",
  "auth/popup-blocked": "Google 창이 차단됐어요. 팝업을 허용한 뒤 다시 해 주세요.",
  "auth/account-exists-with-different-credential": "이 이메일은 다른 로그인 방법으로 가입돼 있어요.",
  "auth/operation-not-allowed": "이 로그인 방법이 Firebase에서 아직 켜져 있지 않아요.",
  "auth/unauthorized-domain": "이 주소가 Firebase 인증에 아직 허용되지 않았어요.",
  authUnknown: "문제가 생겼어요. 다시 시도해 주세요.",
  downloadBackup: "백업 파일 내려받기", restoreBackup: "백업에서 복원…", deleteAccount: "계정 삭제",
  restoreConfirm: "이 파일의 플래너 {p}개와 습관 {h}개를 복원할까요? 같은 항목이 있으면 파일의 내용으로 바뀌어요.",
  restored: "플래너 {p}개와 습관 {h}개를 복원했어요.", restoreFailed: "Cairn 백업 파일이 아니에요.",
  deleteAccountConfirm: "계정과 모든 플래너·습관을 삭제할까요? 되돌릴 수 없어요. 남기고 싶은 게 있다면 먼저 백업을 내려받으세요.",
  deleteAccountReauth: "보안을 위해 다시 로그인한 뒤, 바로 계정 삭제를 해 주세요.",
  pastPlanners: "지난 플래너 ({n})", noActivePlanners: "진행 중인 플래너가 없어요",
  howItWorks: "사용법", account: "계정", signOut: "로그아웃", noPlanners: "아직 플래너가 없어요",
  noPlannersHelp: "플래너는 중간고사 주간처럼 공부하는 기간 하나예요. 아래 버튼으로 시작해 보세요.",
  newHere: "처음이신가요? 사용법 보기",
  newPlanner: "새 플래너", newPlannerBtn: "＋ 새 플래너", namePlaceholder: "예: 기말고사",
  startFrom: "시작 방법", blank: "빈 플래너",   subjectsFrom: "‘{name}’의 과목 가져오기", subjects: "과목", addSubject: "과목 추가",
  subjectName: "과목 이름", subjectsHelp: "공부할 과목을 추가하세요. 나중에 ⚙︎ 설정에서 바꿀 수 있어요.",
  deleteSubject: "{name} 삭제", colour: "색",
  tabDay: "하루", tabWeek: "주간", tabMonth: "월간", tabProgress: "진행률",
  plannerSettings: "플래너 설정", goToday: "오늘로 이동",
  addFor: "{day}에 할 일 추가", addForToday: "오늘 할 일 추가", tabHint: "Tab을 누르면 과목이 바뀌어요", newTask: "새 할 일",
  nothingPlanned: "계획이 없어요. 아래에 입력해서 할 일을 추가하세요.", nothingPlannedShort: "계획 없음", nothingPlannedHere: "계획이 없어요. 아래에 입력하면 이 날에 추가돼요.",
  dueEvents: "마감 · 일정", isDueToday: "오늘 마감: {title}", isDueTomorrow: "내일 마감: {title}",
  more: "+{n}개 더", due: "마감", event: "일정", markDone: "{title} 완료로 표시", markNotDone: "{title} 완료 취소",
  movedFrom: "↩ {day}에서 넘어옴", isDone: "완료", notDone: "미완료", dueDate: "마감 있음",
  thisWeek: "이번 주", weekOf: "{day} 주", prevWeek: "지난주", nextWeek: "다음 주",
  prevMonth: "지난달", nextMonth: "다음 달", legendDue: "마감", legendEvent: "일정",
  dayOf: "{n}일 중 {k}일째", startsOn: "{day} 시작", ended: "끝남 · {n}일", percentDone: "{n}퍼센트 완료",
  leftToday: "오늘 남은 일", rolledOver: "넘어온 일", perDay: "하루 평균 할 일", minutes: "{n}분",
  type: "종류", task: "할 일", dueDateKind: "마감", eventKind: "일정", title: "제목",
  phTask: "무엇을 공부할까요?", phDue: "무엇이 마감인가요?", phEvent: "일정",
  repeat: "반복", never: "안 함", everyDay: "매일", weekdays: "평일", everyWeek: "매주",
  rolloverNote: "끝내지 못하면 다음 날로 저절로 넘어가요.",
  undo: "되돌리기", deletedItem: "‘{title}’ 삭제됨", postponed: "‘{title}’ 다음 날로 미뤘어요", tomorrow: "내일로", moveToTomorrow: "내일로 미루기", dragToReorder: "끌어서 순서 바꾸기",
  addingOn: "{day}에 추가돼요", hasDeadline: "마감 있음", dueTime: "마감 시간",
  noSubjectsYet: "과목을 추가하면 할 일이 과목별로 정리돼요.", subjectsLater: "이름과 색은 나중에 ⚙︎ 설정에서 바꿀 수 있어요.",
  newSubjectOption: "＋ 새 과목…", pastNoAdd: "지난 날에는 추가할 수 없어요", goTodayShort: "오늘로", addEvent: "일정 추가",
  dueNote: "마감이 있는 할 일은 다음 날로 넘어가지 않고 그 날짜에 남아요. 마감 전날과 당일에는 빨간 바가 보여요.",
  eventNote: "일정은 시험이나 면담처럼 정해진 시간에 있는 일이에요. 체크와 과목이 없고 진행률에도 들어가지 않아요.",
  settings: "설정", planner: "플래너", plannerName: "플래너 이름",
  deleteSubjectNote: "과목을 지워도 할 일은 남아요. ‘과목 없음’ 아래에 보여요.",
  deletePlanner: "플래너 삭제",
  deletePlannerConfirm: "‘{name}’을(를) 삭제할까요? 할 일, 마감, 일정이 모두 지워지고 되돌릴 수 없어요.",
  habits: "습관", habitsToday: "오늘의 습관", daysUnit: "일째", habitKeepGoing: "계속 이어가 보세요", last14: "최근 14일", addHabit: "습관 추가", addFirstHabit: "매일 할 습관 추가", habitName: "습관",
  habitPh: "예: 도서관 가기", newHabit: "새 습관", editHabit: "습관 편집",
  habitDay: "{n}일째", habitStreak: "연속 {n}일", habitNotStarted: "아직 시작 전",
  habitNote: "한 날마다 첫 화면에서 체크하세요. ‘○일째’는 지금까지 한 날의 합계, ‘연속’은 오늘부터 거꾸로 빠짐없이 한 날 수예요.",
  deleteHabit: "습관 삭제", deleteHabitConfirm: "‘{name}’과(와) 기록을 삭제할까요?",
  markHabit: "{title} 이 날 체크", unmarkHabit: "{title} 이 날 체크 취소",
  planWithAI: "AI로 계획 짜기", aiTitle: "AI로 계획 짜기",
  aiIntro: "강의 자료나 교과서 챕터를 올리세요. Gemini가 읽고 부분별 난이도를 판단해서 날짜별로 알맞게 나눠 드려요.",
  materials: "자료", addFiles: "PDF 또는 이미지 추가", filesHelp: "PDF, PNG, JPG · 합쳐서 14MB까지 · 두꺼운 교과서는 필요한 챕터만 올리세요",
  remove: "빼기", scope: "공부할 범위", scopePh: "예: 4–6장, 12–16강. 금요일에 퀴즈.",
  finishBy: "언제까지", dailyTime: "하루 공부 시간", makePlan: "계획 만들기",
  thinking: "자료를 읽고 계획을 짜고 있어요… 1~2분 걸릴 수 있어요.",
  aiNeedsInput: "자료를 올리거나 공부할 범위를 적어 주세요.", aiTooBig: "파일이 합쳐서 너무 커요 (최대 14MB).",
  aiNotSetUp: "Firebase에서 AI 기능(AI Logic)이 아직 켜져 있지 않아요.", aiAppCheck: "사이트 확인(App Check)에 실패했어요. 새로고침한 뒤 다시 시도해 주세요.", aiNotAllowed: "이 계정에는 AI 계획 기능이 켜져 있지 않아요.",
  aiFailed: "계획을 만들지 못했어요. 다시 시도해 주세요.", aiNetwork: "연결이 끊겼어요. 파일이 크다면 챕터를 나눠서 올려 보세요.", aiRefused: "이 자료로는 계획을 만들 수 없었어요. 다른 파일이나 더 짧은 설명으로 해 보세요.",
  aiPreview: "{d}일 동안 할 일 {n}개", imageTooBig: "{name}이(가) 5MB를 넘어요. 더 작은 이미지나 PDF를 써 주세요.", badFile: "{name}은(는) PDF나 이미지가 아니에요.", aiAuth: "다시 로그인해 주세요.", aiBusy: "AI가 바쁘거나 오늘 무료 사용량을 다 썼어요. 잠시 뒤에 다시 해 주세요.", addTasks: "할 일 {n}개 추가", tryAgain: "다시 만들기",
  easy: "쉬움", medium: "보통", hard: "어려움", hours: "{n}시간", mins: "{n}분",
  skip: "Skip", swipeHint: "옆으로 밀어서 넘겨 보세요", clickHint: "화면을 클릭해서 넘겨 보세요", takeTour: "앱 둘러보기",
  tourSub: "과목별로 공부하는 학생을 위한 플래너예요. 어떻게 쓰는지 1분이면 알 수 있어요.",
  readyTitle: "이제 시작해 볼까요", readyText: "무료 계정을 만들면 어느 기기에서든 내 플래너를 쓸 수 있어요.", readyTextIn: "플래너를 만들고, 과목을 넣고, 오늘부터 시작해 보세요.",
  guideKicker: "사용법", guideTitle: "과목별로, 하루씩 차분하게.",
  startPlanning: "시작하기",
  guideTips: "누르면 편집 · 왼쪽으로 밀면 내일로 · 길게 누르거나 우클릭하면 메뉴 · ⋮⋮를 끌면 순서 바꾸기 · 지웠다면 ‘되돌리기’ · 끝난 플래너는 첫 화면의 ‘지난 플래너’로 접혀요",
};

const dict = lang === "ko" ? ko : en;

/** t("ofDone", { done: 2, total: 6 }) */
export function t(key, vars) {
  let s = dict[key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
