# לימודי קיץ

אפליקציית HTML מקומית בעברית לניהול תוכנית לימודים פשוטה לקיץ.

## הפעלה מקומית

פתחי מסוף בתיקייה הזאת והריצי:

```bash
python -m http.server 8000
```

לאחר מכן פתחי בדפדפן:

```text
http://localhost:8000
```

מומלץ להריץ דרך שרת מקומי כי הדפדפן עלול לחסום טעינת קבצי JSON ו-Markdown כאשר פותחים את `index.html` ישירות.

## סיסמת אבא

בכניסה הראשונה לאיזור אבא תתבקשי לבחור סיסמה. הסיסמה לא נשמרת כטקסט גלוי, אלא כ-hash עם salt בתוך אחסון הדפדפן.

אם הסיסמה נשכחה, אפשר לאפס אותה דרך Codex או מסוף מקומי:

```bash
python scripts/reset_admin_password.py "סיסמה חדשה"
```

לאחר מכן רענני את הדפדפן. האפליקציה תזהה את `data/admin-settings.json` המעודכן ותחליף את סיסמת אבא המקומית.

## מבנה תוכן AI

האפליקציה קוראת הסברים מקבצי Markdown, ותרגילים/מבחנים מקבצי JSON.

קורס מוגדר בתוך `data/courses.json` כך:

```json
{
  "id": "math-summer",
  "title": "חשבון לקיץ",
  "subject": "מתמטיקה",
  "description": "תיאור קצר של הקורס",
  "lessons": [
    {
      "id": "fractions-intro",
      "title": "מבוא לשברים",
      "contentFile": "content/sample-course/fractions.md"
    }
  ],
  "exercisesFile": "content/sample-course/exercises.json",
  "testsFile": "content/sample-course/tests.json"
}
```

תרגיל או שאלה במבחן צריכים להיות במבנה:

```json
{
  "id": "question-1",
  "type": "multiple_choice",
  "prompt": "מהו חצי של 10?",
  "choices": ["2", "5", "8", "10"],
  "correctAnswer": "5",
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

## פרומפטים לדוגמה ליצירת תוכן

### יצירת הסבר Markdown

```text
צרי שיעור קצר בעברית לתלמידה בבית ספר יסודי בנושא [נושא].
החזירי Markdown בלבד.
כללי:
- כותרת ראשית אחת
- 2-3 כותרות משנה
- דוגמאות פשוטות
- רשימת נקודות קצרה
- שפה חמה וברורה
```

### יצירת תרגול JSON

```text
צרי 5 שאלות תרגול בעברית בנושא [נושא].
החזירי JSON בלבד במערך.
כל שאלה חייבת לכלול:
id, type, prompt, choices אם זו שאלה אמריקאית, correctAnswer, points, explanation.
השתמשי רק ב-type מהאפשרויות: multiple_choice או short_answer.
```

### יצירת מבחן JSON

```text
צרי מבחן קצר בעברית בנושא [נושא].
החזירי JSON בלבד במערך של 6 שאלות.
הציונים צריכים להסתכם ל-100 נקודות.
כל שאלה חייבת לכלול:
id, type, prompt, choices אם זו שאלה אמריקאית, correctAnswer, points, explanation.
```

## גיבוי ושחזור

באיזור אבא אפשר לייצא קובץ גיבוי JSON הכולל תלמידות, קורסים, התקדמות והגדרות אבא. אפשר לייבא גיבוי קודם כקובץ או בהדבקת JSON, לאחר בדיקת מבנה בסיסית.
