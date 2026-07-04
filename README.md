# לימודי קיץ

אפליקציית HTML מקומית בעברית לניהול תוכנית לימודים פשוטה לקיץ.

## הפעלה מקומית

```bash
python -m http.server 8000
```

ואז לפתוח בדפדפן:

```text
http://localhost:8000
```

מומלץ להריץ דרך שרת מקומי כי הדפדפן עלול לחסום טעינת קבצי JSON ו-Markdown כאשר פותחים את `index.html` ישירות.

## סיסמת אבא

בכניסה הראשונה לאיזור אבא בוחרים סיסמה. הסיסמה נשמרת כ-hash עם salt באחסון הדפדפן, ולא כטקסט גלוי.

אם הסיסמה נשכחה:

```bash
python scripts/reset_admin_password.py "סיסמה חדשה"
```

לאחר מכן לרענן את הדפדפן. האפליקציה תזהה את `data/admin-settings.json` המעודכן ותחליף את סיסמת אבא המקומית.

## קורסים ויחידות

כל קורס יכול להכיל כמה יחידות. כל יחידה יכולה לכלול כל שילוב של:

- הסבר Markdown
- משחק JSON
- מבחן JSON

מבנה קורס:

```json
{
  "id": "course-id",
  "title": "שם הקורס",
  "subject": "תחום הלימוד",
  "description": "תיאור קצר של הקורס",
  "units": [
    {
      "id": "unit-id",
      "title": "שם היחידה",
      "description": "תיאור קצר של היחידה",
      "lessonFile": "content/course-folder/unit.md",
      "exercisesFile": "content/course-folder/exercises.json",
      "testsFile": "content/course-folder/test.json"
    }
  ]
}
```

אפשר גם לשמור תוכן ישירות בתוך היחידה, בלי קבצים:

```json
{
  "id": "decimal-place-value",
  "title": "ערך המקום בעשרוניים",
  "description": "יחידה קצרה עם הסבר, משחק ומבחן.",
  "lessonMarkdown": "# ערך המקום\n\nהסבר בעברית.",
  "exercises": [],
  "tests": []
}
```

## פורמט שאלה

שאלות בתוך `exercises` מוצגות באפליקציה כמשחק פתיחת קוד. אפשר להוסיף לכל שאלה `gameReward` או `reward` כדי לבחור איזה חלק קוד ייחשף אחרי תשובה נכונה. אם לא מוסיפים, האפליקציה תשתמש במספר המשימה.

```json
{
  "id": "question-1",
  "type": "multiple_choice",
  "prompt": "מהו חצי של 10?",
  "choices": ["2", "5", "8", "10"],
  "correctAnswer": "5",
  "gameReward": "3",
  "points": 10,
  "explanation": "חצי פירושו לחלק לשני חלקים שווים."
}
```

לשאלה פתוחה קצרה:

```json
{
  "id": "question-2",
  "type": "short_answer",
  "prompt": "מהו רבע של 12?",
  "correctAnswer": "3",
  "points": 10,
  "explanation": "12 לחלק ל-4 שווה 3."
}
```

## העלאת תוכן דרך איזור אבא

באיזור אבא נכנסים אל `קורסים ויחידות`.

אפשר:

- להוסיף קורס.
- להוסיף כמה יחידות לכל קורס.
- לערוך שם, תיאור, קבצי Markdown/JSON או תוכן מודבק ישירות.
- להעלות קובץ Markdown להסבר.
- להעלות קובץ JSON למשחק או מבחן.
- לייבא יחידה שלמה מ-Codex כקובץ JSON או בהדבקת JSON.

## העלאת תוכן אוטומטית על ידי Codex

Codex יכול ליצור קובץ JSON של יחידה ואז להריץ:

```bash
python scripts/upsert_course_unit.py --course-id course-id --unit-json generated-unit.json
```

הסקריפט מוסיף את היחידה לקורס או מחליף יחידה קיימת עם אותו `id`. לאחר מכן צריך להעלות לגיט ולפרוס ל-Firebase.

מבנה JSON מומלץ ל-Codex:

```json
{
  "id": "unit-id",
  "title": "שם היחידה",
  "description": "תיאור קצר",
  "lessonMarkdown": "# הסבר\n\nטקסט ההסבר.",
  "exercises": [
    {
      "id": "ex-1",
      "type": "multiple_choice",
      "prompt": "שאלה בעברית",
      "choices": ["א", "ב", "ג"],
      "correctAnswer": "א",
      "gameReward": "א",
      "points": 10,
      "explanation": "הסבר קצר"
    }
  ],
  "tests": []
}
```

## גיבוי ושחזור

באיזור אבא אפשר לייצא קובץ גיבוי JSON הכולל תלמידות, קורסים, יחידות, התקדמות והגדרות אבא. אפשר לייבא גיבוי קודם כקובץ או בהדבקת JSON.
## Firebase storage

The deployed app stores shared runtime data in Cloud Firestore under the `hebrewSummer` collection:

- `students`
- `courses`
- `progress`
- `adminSettings`

Firebase Hosting still serves the static app files. Firestore is the source of truth for app changes across browsers and machines. If Firestore is unavailable, the app shows a warning and falls back to this browser only.

Deploy hosting and Firestore rules with:

```bash
firebase deploy --project summer-learning-shemen
```
