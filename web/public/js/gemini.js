// "Plan with AI" through Gemini (Firebase AI Logic, Gemini Developer API).
// The browser calls Gemini through Firebase, so no API key or server of our own is needed.

export const PLAN_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD" },
          title: { type: "string" },
          minutes: { type: "integer" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        },
        required: ["date", "title", "minutes", "difficulty"],
      },
    },
  },
  required: ["summary", "tasks"],
};

export const SYSTEM = `You plan study schedules for a university student. You receive course materials (lecture slides, textbook chapters, problem sets) and/or a description of what to cover, the dates available, and how much study time the student has per day.

Read the materials and judge how demanding each part is: how dense it is, how many new concepts or derivations it introduces, and how much practice it needs. Then spread the work over the available days:
- Make concrete study tasks a student can finish in one sitting (about 20–120 minutes), named by what they cover, for example "Ch 5.2–5.3 Conditional expectation: read + 4 exercises".
- Give harder parts more time and split them across days instead of cramming them into one.
- Put prerequisites before the topics that build on them.
- Leave the final days for review and practice (past exams, problem sets, a summary sheet); keep the last day light.
- Days that already have planned tasks get less new work.
- Only use dates from the start date to the finish date, inclusive. A day's total minutes must not exceed the daily study time.
- If everything won't fit, prioritise what is most likely to be tested, and say in the summary what you left out.

Write task titles and the summary in the language named in the request. Keep titles under 70 characters. The summary is one or two sentences on how you divided the work.`;

/** Model missing, or the connection dropped (Safari "Load failed"): worth trying the next model. */
const tryNext = (e) => /not found|404|is not supported|unsupported model|no longer available|deprecated|load failed|failed to fetch|networkerror|network error/i
  .test(String(e?.message || e));

const REMEMBER = "cairn.geminiModel";
const remembered = () => { try { return localStorage.getItem(REMEMBER); } catch { return null; } };
const remember = (m) => { try { localStorage.setItem(REMEMBER, m); } catch {} };

/** files: [{ mimeType, data (base64) }], text: the request. Tries each model in turn. Returns { summary, tasks }. */
export async function planWithGemini(fb, app, { models, files, text }) {
  const ai = fb.getAI(app, { backend: new fb.GoogleAIBackend() });
  const parts = [
    ...files.map((f) => ({ type: "inlineData", inlineData: { mimeType: f.mimeType, data: f.data } })),
    { type: "text", text },
  ];
  const last = remembered();
  const order = last && models.includes(last) ? [last, ...models.filter((m) => m !== last)] : models;
  let lastError;
  for (const model of order) {
    try {
      const gemini = fb.getGenerativeModel(ai, {
        model,
        systemInstruction: SYSTEM,
        generationConfig: { responseMimeType: "application/json", responseJsonSchema: PLAN_SCHEMA },
      });
      const result = await gemini.generateContent({ contents: [{ role: "user", parts }] });
      const plan = JSON.parse(result.response.text());
      remember(model);
      return plan;
    } catch (e) {
      lastError = e;
      if (!tryNext(e)) throw e;
      console.warn(`Gemini model ${model} failed, trying the next one`, e);
    }
  }
  throw lastError;
}
