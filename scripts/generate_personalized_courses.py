#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate personalized math courses (Decimals & Percentages) for Raya (רעיה)
according to her student profile:
- 10 questions per exercise file
- 20 questions per test file
- Personalized content involving baking, hiking, and friends (תאיר, רבקה, שירה, רעיה אוחנה)
- Encouraging tone ("כל הכבוד, רעיה!", "מצוין!")
"""

import json
from pathlib import Path
import random

ROOT = Path(__file__).resolve().parents[1]
DECIMALS_DIR = ROOT / "content" / "reaya-decimals"
PERCENTAGES_DIR = ROOT / "content" / "reaya-percentages"

# Ensure directories exist
DECIMALS_DIR.mkdir(parents=True, exist_ok=True)
PERCENTAGES_DIR.mkdir(parents=True, exist_ok=True)

# Personalization assets
FRIENDS = ["תאיר", "רבקה", "שירה", "רעיה אוחנה"]
ENCOURAGEMENTS = ["כל הכבוד, רעיה!", "מצוין, רעיה!", "כל הכבוד שאת מנסה!", "איזו חשיבה נהדרת!", "אלופה!", "פשוט מעולה!"]

def get_encouragement():
    # Return a pseudo-random encouragement based on some hash or simple cycle, but keep it deterministic
    # to avoid git diff churn on rerun
    return ENCOURAGEMENTS[0] # Using a warm standard one is safest, or cycle through them

def make_mc(q_id, prompt, choices, correct, explanation, points=10):
    return {
        "id": q_id,
        "type": "multiple_choice",
        "prompt": prompt,
        "choices": choices,
        "correctAnswer": correct,
        "points": points,
        "explanation": f"{get_encouragement()} {explanation}"
    }

def make_sa(q_id, prompt, correct, explanation, points=10):
    return {
        "id": q_id,
        "type": "short_answer",
        "prompt": prompt,
        "correctAnswer": correct,
        "points": points,
        "explanation": f"{get_encouragement()} {explanation}"
    }

# ==========================================
# COURSE 1: DECIMALS GENERATION
# ==========================================

DECIMALS_UNITS = [
    # (Slug, Title, Description)
    ("01-what-are-decimals", "מהם מספרים עשרוניים", "היכרות ראשונה עם מספרים עשרוניים וחיבורם לשברים פשוטים."),
    ("02-place-value", "ערך המקום", "עשיריות, מאיות ואלפיות בתוך המספר העשרוני."),
    ("03-reading-writing-decimals", "קריאה וכתיבה של עשרוניים", "תרגול קריאה, כתיבה ופירוק של מספרים עשרוניים."),
    ("04-money-and-measurements", "כסף ומדידות", "שימוש במספרים עשרוניים במצבים מוכרים מהחיים."),
    ("05-comparing-decimals", "השוואת עשרוניים", "השוואה בין מספרים עשרוניים וסידור מהקטן לגדול."),
    ("06-number-line", "עשרוניים על ישר המספרים", "מיקום מספרים עשרוניים על ציר מספרים."),
    ("07-adding-decimals", "חיבור עשרוניים", "חיבור מספרים עשרוניים בעזרת ערך המקום."),
    ("08-subtracting-decimals", "חיסור עשרוניים", "חיסור מספרים עשרוניים ויישור נקודה עשרונית."),
    ("09-multiplying-decimals", "כפל עשרוניים", "כפל במספרים עשרוניים והבנת גודל התוצאה."),
    ("10-dividing-decimals", "חילוק עשרוניים", "חילוק עם מספרים עשרוניים בשלבים ברורים."),
    ("11-word-problems", "בעיות מילוליות", "שימוש בעשרוניים לפתרון שאלות מילוליות."),
    ("12-review-and-assessment", "חזרה והערכה", "חזרה מסכמת על כל נושאי הקורס.")
]

def generate_decimals_questions(unit_num):
    # Generates 30 questions for a given decimals unit
    # First 10 are for exercises, next 20 are for tests
    q = []
    
    # Simple procedural generation of questions based on unit number
    if unit_num == 1:
        # What are decimals: Tenths, half, etc.
        for i in range(1, 31):
            val = i % 9 + 1
            if i % 2 == 0:
                prompt = f"רעיה ושירה חילקו עוגת שוקולד ל-10 פרוסות שוות. שירה אכלה {val} פרוסות. כתבי כמספר עשרוני איזה חלק מהעוגה אכלה שירה."
                correct = f"0.{val}"
                explanation = f"חילקנו עוגה ל-10 חלקים שוים, לכן כל חלק הוא עשירית (0.1). {val} חלקים הם {val} עשיריות, כלומר {correct}."
                q.append(make_sa(f"u01-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"תאיר ורעיה מכינות בצק ומחלקות אותו ל-10 כדורים שווים. הן משתמשות ב-{val} כדורים להכנת לחמניות. איזה חלק מהבצק נשאר להן ללחמניות?"
                choices = [f"0.{val}", f"{val}.0", f"0.0{val}", f"1.{val}"]
                correct = f"0.{val}"
                explanation = f"מכיוון שהשלם מחולק ל-10 חלקים, {val} מתוכם הם {val} עשיריות, מה שנכתב כמספר עשרוני כ-{correct}."
                q.append(make_mc(f"u01-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 2:
        # Place value: tenths, hundredths, thousandths
        for i in range(1, 31):
            val = (i * 7) % 1000
            dec_str = f"0.{val:03d}"
            # Ensure it has exactly 3 decimals
            if len(dec_str) != 5:
                dec_str = "0.345"
            t_digit = dec_str[2]
            h_digit = dec_str[3]
            th_digit = dec_str[4]
            if i % 3 == 0:
                prompt = f"רעיה שוקלת קמח לאפייה והמשקל מראה {dec_str} ק\"ג. מהי ספרת העשיריות במספר זה?"
                correct = t_digit
                explanation = f"במספר {dec_str}, הספרה הראשונה מימין לנקודה מייצגת את העשיריות. לכן הספרה היא {correct}."
                q.append(make_sa(f"u02-q-{i}", prompt, correct, explanation))
            elif i % 3 == 1:
                prompt = f"במסלול הליכה שהאורך שלו {dec_str} קילומטר, מהי ספרת המאיות?"
                correct = h_digit
                explanation = f"במספר {dec_str}, הספרה השנייה מימין לנקודה העשרונית היא ספרת המאיות, שהיא {correct}."
                q.append(make_sa(f"u02-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה מודדת נפח תמצית וניל ומקבלת {dec_str} ליטר. איזו ספרה מייצגת את האלפיות?"
                choices = [th_digit, t_digit, h_digit, "0"]
                correct = th_digit
                explanation = f"הספרה השלישית מימין לנקודה היא ספרת האלפיות, ולכן התשובה היא {correct}."
                q.append(make_mc(f"u02-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 3:
        # Reading and writing decimals, trailing zeros
        for i in range(1, 31):
            val = (i * 3) % 10
            if val == 0: val = 5
            if i % 2 == 0:
                prompt = f"איך כותבים במספרים: שבע יחידות ו-{val} עשיריות?"
                correct = f"7.{val}"
                explanation = f"שבע יחידות שלמות נכתבות משמאל לנקודה, ו-{val} עשיריות נכתבות כספרה ראשונה מימין לנקודה. התוצאה היא {correct}."
                q.append(make_sa(f"u03-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"איזה מהמספרים הבאים שווה למספר העשרוני 0.{val}?"
                choices = [f"0.{val}0", f"0.0{val}", f"{val}.0", f"0.00{val}"]
                correct = f"0.{val}0"
                explanation = f"הוספת אפסים בסוף החלק העשרוני (מימין) אינה משנה את ערכו של המספר, לכן 0.{val} שווה בדיוק ל-{correct}."
                q.append(make_mc(f"u03-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 4:
        # Money and measurements (ILS, meters, kg)
        for i in range(1, 31):
            val = (i * 15) % 100
            if val < 10: val += 10
            if i % 3 == 0:
                prompt = f"רעיה קנתה עוגייה במאפייה ברובע היהודי. היא שילמה 5 שקלים ו-{val} אגורות. כתבי את המחיר בשקלים כמספר עשרוני."
                correct = f"5.{val}"
                explanation = f"מכיוון ששקל אחד מכיל 100 אגורות, {val} אגורות הן {val} מאיות השקל. לכן נכתוב {correct} ש\"ח."
                q.append(make_sa(f"u04-q-{i}", prompt, correct, explanation))
            elif i % 3 == 1:
                prompt = f"רבקה ורעיה מדדו סרט קישוט לעוגה. אורך הסרט הוא 1 מטר ו-{val} סנטימטר. כמה מטרים זה בכתיבה עשרונית?"
                correct = f"1.{val}"
                explanation = f"סנטימטר הוא מאית המטר (1/100). לכן 1 מטר ו-{val} ס\"מ הם {correct} מטר."
                q.append(make_sa(f"u04-q-{i}", prompt, correct, explanation))
            else:
                kg_val = val / 100.0
                prompt = f"רעיה אוחנה הביאה שקית עם {val * 10} גרם שוקולד צ'יפס. כמה קילוגרם יש בשקית? (רמז: 1 ק\"ג = 1000 גרם)"
                choices = [f"{kg_val:.2f}", f"{kg_val*10:.1f}", f"{kg_val/10:.3f}", f"{val * 10}"]
                correct = f"{kg_val:.2f}"
                explanation = f"כדי לעבור מגרם לקילוגרם מחלקים ב-1000. {val * 10} לחלק ל-1000 נותן {correct} ק\"ג."
                q.append(make_mc(f"u04-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 5:
        # Comparing decimals
        for i in range(1, 31):
            v1 = (i * 7) % 50 / 100.0 + 1.0
            v2 = (i * 13) % 50 / 100.0 + 1.0
            if v1 == v2: v2 += 0.05
            larger = max(v1, v2)
            smaller = min(v1, v2)
            if i % 2 == 0:
                prompt = f"רעיה ותאיר הלכו בטיול. רעיה הלכה {v1:.2f} ק\"מ ותאיר הלכה {v2:.2f} ק\"מ. מי הלכה מרחק גדול יותר? כתבי את המספר הגדול."
                correct = f"{larger:.2f}"
                explanation = f"נשווה קודם את היחידות, ואז את העשיריות והמאיות. אנו רואים ש-{correct} גדול מ-{smaller:.2f}."
                q.append(make_sa(f"u05-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"במתכון לעוגת שוקולד של רעיה אוחנה יש {v1:.2f} כוסות סוכר, ובמתכון של רבקה יש {v2:.2f} כוסות סוכר. איזה סימן מתאים לשים באמצע: {v1:.2f} __ {v2:.2f}?"
                sign = ">" if v1 > v2 else "<"
                choices = [">", "<", "="]
                correct = sign
                explanation = f"המספר {v1:.2f} הוא {'גדול' if v1 > v2 else 'קטן'} יותר מהמספר {v2:.2f}, ולכן הסימן המתאים הוא {correct}."
                q.append(make_mc(f"u05-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 6:
        # Number line
        for i in range(1, 31):
            base = i % 5 + 1
            if i % 2 == 0:
                prompt = f"איזה מספר עשרוני נמצא בדיוק באמצע על ציר המספרים בין {base}.2 לבין {base}.3?"
                correct = f"{base}.25"
                explanation = f"המרחק בין {base}.2 ל-{base}.3 ניתן לחלוקה למאיות: {base}.20 עד {base}.30. האמצע הוא בדיוק {correct}."
                q.append(make_sa(f"u06-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה מסמנת נקודה על ציר המספרים בין 0 ל-1. הנקודה קרובה יותר ל-1 מאשר ל-0. איזה מספר עשרוני זה יכול להיות?"
                choices = ["0.85", "0.25", "0.40", "0.12"]
                correct = "0.85"
                explanation = f"כל מספר שגדול מ-0.5 קרוב יותר ל-1. מבין האפשרויות, רק {correct} גדול מ-0.5."
                q.append(make_mc(f"u06-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 7:
        # Adding decimals
        for i in range(1, 31):
            val1 = (i * 3) % 20 / 10.0 + 1.1
            val2 = (i * 4) % 20 / 10.0 + 0.5
            ans = round(val1 + val2, 2)
            if i % 2 == 0:
                prompt = f"רעיה מכינה בצק שמרים. היא שוקלת בקערה {val1:.1f} ק\"ג קמח, ומוסיפה עוד {val2:.1f} ק\"ג קמח. מה המשקל הכולל של הקמח בקערה?"
                correct = f"{ans:.1f}" if ans.is_integer() or round(ans*10)%10 != 0 else f"{ans:.2f}"
                # strip trailing zeros to simplify input match
                correct = str(round(val1 + val2, 2)).rstrip('0').rstrip('.')
                explanation = f"ניישר את הנקודות העשרוניות בטור ונחבר: {val1:.1f} ועוד {val2:.1f} שווה ל-{correct}."
                q.append(make_sa(f"u07-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"בטיול בהרי ירושלים, רעיה, תאיר ורבקה צעדו {val1:.1f} ק\"מ בבוקר ועוד {val2:.1f} ק\"מ אחרי הצהריים. כמה קילומטרים צעדו הבנות בסך הכל?"
                correct = str(round(val1 + val2, 2)).rstrip('0').rstrip('.')
                choices = [correct, str(round(val1 + val2 + 0.5, 2)), str(round(val1 + val2 - 0.2, 2)), str(round(val1, 2))]
                explanation = f"נחבר בטור תוך שמירה על מיקום הנקודה: {val1:.1f} + {val2:.1f} = {correct} ק\"מ."
                q.append(make_mc(f"u07-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 8:
        # Subtracting decimals
        for i in range(1, 31):
            val1 = (i * 5) % 20 / 10.0 + 3.5
            val2 = (i * 3) % 20 / 10.0 + 1.2
            ans = round(val1 - val2, 2)
            correct = str(ans).rstrip('0').rstrip('.')
            if i % 2 == 0:
                prompt = f"לרעיה היה חבל באורך {val1:.1f} מטרים כדי לקשור ציוד לטיול. היא חתכה ממנו {val2:.1f} מטרים. מה אורך החבל שנשאר לה?"
                explanation = f"נבצע חיסור עשרוני בטור: {val1:.1f} פחות {val2:.1f} שווה ל-{correct} מטרים."
                q.append(make_sa(f"u08-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה ושירה הכינו בלילה של עוגה במשקל {val1:.1f} ק\"ג. הן שפכו {val2:.1f} ק\"ג מהבלילה לתבנית הראשונה. כמה בלילה נשארה עבור התבנית השנייה?"
                choices = [correct, str(round(val1 - val2 + 0.4, 2)), str(round(val1 - val2 - 0.3, 2)), str(round(val1, 2))]
                explanation = f"נחסיר את המשקל של התבנית הראשונה מהמשקל הכולל: {val1:.1f} - {val2:.1f} = {correct} ק\"ג."
                q.append(make_mc(f"u08-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 9:
        # Multiplying decimals
        for i in range(1, 31):
            val1 = (i * 3) % 5 / 10.0 + 0.5
            factor = (i % 3) + 2
            ans = round(val1 * factor, 2)
            correct = str(ans).rstrip('0').rstrip('.')
            if i % 2 == 0:
                prompt = f"רעיה מכינה {factor} תבניות של מאפי שוקולד קטנים. כל תבנית דורשת {val1:.2f} ק\"ג שוקולד. כמה ק\"ג שוקולד צריכה רעיה בסך הכל?"
                explanation = f"נבצע כפל עשרוני: {val1:.2f} כפול {factor} שווה ל-{correct} ק\"ג."
                q.append(make_sa(f"u09-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה, תאיר ורבקה קנו {factor} בקבוקי מיץ לטיול. כל בקבוק מכיל {val1:.2f} ליטר מיץ. כמה ליטר מיץ יש להן בסך הכל?"
                choices = [correct, str(round(val1 * factor + 0.5, 2)), str(round(val1 * factor - 0.2, 2)), str(round(val1, 2))]
                explanation = f"נכפיל את תכולת הבקבוק הבודד במספר הבקבוקים: {val1:.2f} × {factor} = {correct} ליטר."
                q.append(make_mc(f"u09-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 10:
        # Dividing decimals
        for i in range(1, 31):
            factor = (i % 3) + 2
            ans = (i * 2) % 10 / 10.0 + 0.5
            val1 = round(ans * factor, 2)
            correct = str(ans).rstrip('0').rstrip('.')
            if i % 2 == 0:
                prompt = f"רעיה, שירה ותאיר קנו יחד קמח מיוחד לאפייה ב-{val1:.2f} ש\"ח. הן חילקו את הסכום שווה בשווה בין {factor} הבנות. כמה שילמה כל אחת?"
                explanation = f"נחלק את הסכום הכולל במספר הבנות: {val1:.2f} לחלק ל-{factor} שווה ל-{correct} ש\"ח."
                q.append(make_sa(f"u10-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה הלכה בטיול מרחק כולל של {val1:.2f} ק\"מ, וחילקה את המסלול ל-{factor} קטעים שווים למנוחה. מה אורך כל קטע?"
                choices = [correct, str(round(ans + 0.25, 2)), str(round(ans - 0.15, 2)), str(round(val1, 2))]
                explanation = f"נחלק את סך המרחק במספר הקטעים: {val1:.2f} ÷ {factor} = {correct} ק\"מ."
                q.append(make_mc(f"u10-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 11:
        # Word problems
        for i in range(1, 31):
            val1 = (i * 5) % 20 / 10.0 + 2.0
            val2 = (i * 3) % 20 / 10.0 + 1.0
            ans = round(val1 + val2, 2)
            correct = str(ans).rstrip('0').rstrip('.')
            if i % 2 == 0:
                prompt = f"רעיה אופה שתי עוגות שוקולד יחד עם רעיה אוחנה. העוגה הראשונה דורשת {val1:.2f} כוסות קמח, והשנייה דורשת {val2:.2f} כוסות קמח. כמה כוסות קמח הן צריכות בסך הכל?"
                explanation = f"זוהי שאלת חיבור פשוטה. נחבר את כמות הקמח לשתי העוגות: {val1:.2f} + {val2:.2f} = {correct} כוסות קמח."
                q.append(make_sa(f"u11-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה, תאיר ורבקה יצאו לטיול בהרי ירושלים. אורך המסלול המתוכנן הוא 5.5 ק\"מ. הן כבר צעדו {val2:.1f} ק\"מ. כמה קילומטרים נותרו להן ללכת?"
                ans_dist = round(5.5 - val2, 2)
                correct_dist = str(ans_dist).rstrip('0').rstrip('.')
                choices = [correct_dist, str(round(5.5 - val2 + 1.2, 2)), str(round(5.5 - val2 - 0.8, 2)), "5.5"]
                explanation = f"נחסיר את המרחק שכבר עברו מאורך המסלול כולו: 5.5 - {val2:.1f} = {correct_dist} ק\"מ."
                q.append(make_mc(f"u11-q-{i}", prompt, choices, correct_dist, explanation))

    elif unit_num == 12:
        # Review and assessment
        for i in range(1, 31):
            val = i % 5 + 1
            if i % 2 == 0:
                prompt = f"רעיה ושירה מכינות בצק ומחלקות אותו ל-10 חלקים. הן משתמשות ב-{val} חלקים. כתבי כמספר עשרוני איזה חלק זה."
                correct = f"0.{val}"
                explanation = f"כל חלק הוא עשירית (0.1). {val} חלקים הם {val} עשיריות, כלומר {correct}."
                q.append(make_sa(f"u12-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"לרעיה היו 10 שקלים. היא קנתה מאפה ב-7.50 ש\"ח. כמה עודף היא קיבלה?"
                choices = ["2.5", "3.5", "1.5", "2.0"]
                correct = "2.5"
                explanation = f"נחסר את מחיר המאפה מתוך 10 שקלים: 10 - 7.50 = 2.50 ש\"ח (או 2.5)."
                q.append(make_mc(f"u12-q-{i}", prompt, choices, correct, explanation))

    # Split into 10 exercise questions and 20 test questions
    exercises = q[:10]
    tests = q[10:30]
    
    # Adjust points for tests: 15 points for first 16, 20 points for last 4
    for idx, item in enumerate(exercises):
        item["id"] = f"u{unit_num:02d}-ex-{idx+1}"
        item["points"] = 10
    for idx, item in enumerate(tests):
        item["id"] = f"u{unit_num:02d}-test-{idx+1}"
        item["points"] = 15 if idx < 16 else 20
        
    return exercises, tests

# ==========================================
# COURSE 2: PERCENTAGES GENERATION
# ==========================================

PERCENTAGES_UNITS = [
    ("01-what-is-percent", "מהו אחוז", "היכרות עם המשמעות של אחוז כחלק מתוך מאה."),
    ("02-percent-fractions-decimals", "אחוזים, שברים ועשרוניים", "מעבר בין אחוז, שבר פשוט ומספר עשרוני."),
    ("03-finding-percent-of-quantity", "חישוב אחוז מכמות", "מציאת חלק מתוך כמות בעזרת אחוזים."),
    ("04-common-percentages", "אחוזים נפוצים: 10%, 25%, 50%, 75%", "שימוש באחוזים שכדאי לזהות במהירות."),
    ("05-finding-the-whole", "מציאת השלם לפי אחוז", "כאשר ידוע החלק והאחוז, מוצאים את הכמות השלמה."),
    ("06-discounts-and-sales", "הנחות ומבצעים", "חישוב מחיר לאחר הנחה באחוזים."),
    ("07-increase-and-decrease", "התייקרות והוזלה באחוזים", "הבנת שינוי באחוזים כלפי מעלה וכלפי מטה."),
    ("08-comparing-percentages", "השוואת אחוזים", "השוואה בין אחוזים ובין חלקים מכמויות שונות."),
    ("09-percentages-in-data", "אחוזים בדיאגרמות ונתונים", "קריאת אחוזים מתוך טבלאות, סקרים ותרשימים."),
    ("10-word-problems", "בעיות מילוליות באחוזים", "פתרון שאלות אחוזים מתוך סיפורים ומצבים יומיומיים."),
    ("11-everyday-percentages", "אחוזים בחיי היום יום", "יישום אחוזים בכסף, ציונים, סוללה ומתכונים."),
    ("12-review-and-assessment", "חזרה והערכה מסכמת", "חזרה על כל נושאי האחוזים ותרגול מסכם.")
]

def generate_percentages_questions(unit_num):
    q = []
    
    if unit_num == 1:
        # What is percent
        for i in range(1, 31):
            val = (i * 3) % 90 + 5
            if i % 2 == 0:
                prompt = f"רעיה חילקה מגש של עוגיות ריבה ל-100 משבצות שוות. היא שמה ריבת תות על {val} מהמשבצות. כמה אחוזים מהמגש עם ריבת תות?"
                correct = f"{val}%"
                explanation = f"אחוז פירושו חלק מתוך 100. מכיוון שיש {val} משבצות מתוך 100, זהו בדיוק {correct}."
                q.append(make_sa(f"u01-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"תאיר ורעיה סימנו מסלול טיול שמורכב מ-100 תחנות. הן כבר עברו {val} תחנות. כמה אחוז מהמסלול הן עברו?"
                choices = [f"{val}%", f"{val}0%", f"0.{val}%", "100%"]
                correct = f"{val}%"
                explanation = f"חלק מתוך 100 הוא אחוז. {val} מתוך 100 תחנות הם {correct}."
                q.append(make_mc(f"u01-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 2:
        # Percents, fractions, decimals
        for i in range(1, 31):
            choices_list = [
                ("50%", "1/2", "0.5"),
                ("25%", "1/4", "0.25"),
                ("75%", "3/4", "0.75"),
                ("10%", "1/10", "0.1"),
                ("20%", "1/5", "0.2"),
                ("30%", "3/10", "0.3"),
                ("40%", "2/5", "0.4"),
                ("60%", "3/5", "0.6"),
                ("80%", "4/5", "0.8"),
                ("90%", "9/10", "0.9"),
            ]
            pct, frac, dec = choices_list[i % len(choices_list)]
            if i % 3 == 0:
                prompt = f"איזה מספר עשרוני שווה בדיוק ל-{pct}?"
                correct = dec
                explanation = f"כדי לעבור מאחוז למספר עשרוני מחלקים את המספר ב-100. לכן {pct} שווה ל-{correct}."
                q.append(make_sa(f"u02-q-{i}", prompt, correct, explanation))
            elif i % 3 == 1:
                prompt = f"איזה שבר פשוט שווה ל-{pct}?"
                choices = [frac, "1/3", "1/8", "1/6"]
                correct = frac
                explanation = f"{pct} פירושו {pct.replace('%', '')}/100. כשמצמצמים את השבר מקבלים {correct}."
                q.append(make_mc(f"u02-q-{i}", prompt, choices, correct, explanation))
            else:
                prompt = f"רעיה אופה עוגה ומשתמשת ב-{dec} מהקמח שבשקית. כמה אחוז מהקמח נשאר בשקית?"
                correct_pct = f"{int(round((1 - float(dec)) * 100))}%"
                prompt = f"רעיה אופה עוגה ומשתמשת ב-{dec} מהקמח שבשקית. כמה אחוז מהקמח היא ניצלה?"
                choices = [pct, "15%", "5%", "85%"]
                correct = pct
                explanation = f"המספר העשרוני {dec} מייצג {pct} מתוך השלם."
                q.append(make_mc(f"u02-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 3:
        # Finding percent of quantity
        for i in range(1, 31):
            base = ((i * 4) % 10 + 2) * 10 # 20, 30, 40, 50, 60, 70, 80, 90, 100
            pct_val = 10 if (i % 2 == 0) else 50
            ans = int(base * (pct_val / 100.0))
            if i % 2 == 0:
                prompt = f"רעיה מכינה עוגיות שוקולד צ'יפס. יש לה בקערה {base} גרם קמח. היא רוצה להפריד {pct_val}% מהקמח בצד. כמה גרם קמח היא צריכה להפריד?"
                correct = str(ans)
                explanation = f"כדי לחשב {pct_val}% מתוך {base}, נזכור ש-10% הוא עשירית, ולכן מחלקים את הכמות ב-10. {base} לחלק ל-10 זה {correct}."
                q.append(make_sa(f"u03-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה, תאיר ורבקה צועדות במסלול טיול באורך {base} קילומטר. הן עברו כבר {pct_val}% מהמסלול. כמה קילומטרים הן כבר צעדו?"
                choices = [str(ans), str(ans + 5), str(ans - 3), "10"]
                correct = str(ans)
                explanation = f"חישוב של {pct_val}% (שזה בדיוק חצי) מתוך {base} הוא {base} לחלק ל-2, כלומר {correct} קילומטר."
                q.append(make_mc(f"u03-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 4:
        # Common percents
        for i in range(1, 31):
            base = ((i * 3) % 8 + 1) * 12 # 12, 24, 36, 48, 60, 72, 84, 96
            pct_list = [25, 50, 75, 10]
            pct = pct_list[i % len(pct_list)]
            ans = int(base * (pct / 100.0)) if pct != 10 else round(base * 0.1, 1)
            correct = str(ans).rstrip('0').rstrip('.')
            if i % 2 == 0:
                prompt = f"שירה קנתה {base} ביצים לאפייה עם רעיה, ו-{pct}% מהן נשברו בדרך. כמה ביצים נשברו?"
                explanation = f"נזכור את השברים המקבילים: {pct}% זה " + ("רבע (1/4)" if pct == 25 else "חצי (1/2)" if pct == 50 else "שלושה רבעים (3/4)" if pct == 75 else "עשירית (1/10)") + f". לכן נחלק בהתאם ונקבל {correct}."
                q.append(make_sa(f"u04-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה מכינה בצק המורכב מ-{base} גרם נוזלים. {pct}% מהנוזלים הם חלב והשאר מים. כמה גרם חלב יש בבצק?"
                choices = [correct, str(ans + 2), str(ans - 1), "0"]
                explanation = f"נחשב את האחוז הנפוץ מתוך הכמות: {pct}% מתוך {base} שווה ל-{correct}."
                q.append(make_mc(f"u04-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 5:
        # Finding the whole
        for i in range(1, 31):
            pct_list = [10, 25, 50, 75]
            pct = pct_list[i % len(pct_list)]
            ans_whole = ((i * 3) % 6 + 2) * 10 # 20, 30, 40, 50, 60, 70
            part = int(ans_whole * (pct / 100.0))
            if i % 2 == 0:
                prompt = f"רעיה אפתה עוגיות. {part} עוגיות הן {pct}% מסך כל העוגיות שהיא אפתה. כמה עוגיות אפתה רעיה בסך הכל?"
                correct = str(ans_whole)
                explanation = f"אם {pct}% מהעוגיות הן {part}, נוכל למצוא את השלם (100%). " + ("נכפיל ב-2" if pct == 50 else "נכפיל ב-4" if pct == 25 else "נכפיל ב-10" if pct == 10 else "נחלק ב-3 ונכפיל ב-4") + f" ונקבל {correct} עוגיות."
                q.append(make_sa(f"u05-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"בטיול של רעיה אוחנה ותאיר, {part} קילומטרים מהווים {pct}% מכל המסלול. מה אורך המסלול כולו בקילומטרים?"
                choices = [str(ans_whole), str(ans_whole + 10), str(ans_whole - 5), "100"]
                correct = str(ans_whole)
                explanation = f"נחשב את השלם לפי החלק הידוע: אם {pct}% הוא {part}, המסלול המלא (100%) הוא {correct} קילומטרים."
                q.append(make_mc(f"u05-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 6:
        # Discounts and sales
        for i in range(1, 31):
            original = ((i * 4) % 10 + 4) * 20 # 80, 100, 120, 140, 160, 180, 200, 220, 240
            pct_off = 10 if (i % 3 == 0) else 25 if (i % 3 == 1) else 50
            saved = int(original * (pct_off / 100.0))
            final = original - saved
            if i % 2 == 0:
                prompt = f"רעיה ורבקה רצו לקנות תבנית מיוחדת לקונדיטוריה שעולה {original} ש\"ח. לכבוד הקיץ, החנות מציעה {pct_off}% הנחה. כמה שקלים הן יחסכו בזכות ההנחה?"
                correct = str(saved)
                explanation = f"סכום ההנחה הוא {pct_off}% מתוך {original}. זה יוצא {correct} ש\"ח."
                q.append(make_sa(f"u06-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"שירה ורעיה קנו סיר בישול לטיול שעולה {original} ש\"ח וקיבלו הנחה של {pct_off}%. כמה הן שילמו בסופו של דבר לאחר ההנחה?"
                choices = [str(final), str(original), str(final + 10), str(final - 5)]
                correct = str(final)
                explanation = f"קודם נחשב את ההנחה ({saved} ש\"ח) ואז נחסיר אותה מהמחיר המקורי: {original} - {saved} = {correct} ש\"ח."
                q.append(make_mc(f"u06-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 7:
        # Increase and decrease
        for i in range(1, 31):
            original = ((i * 5) % 8 + 2) * 10 # 20, 30, 40, 50, 60, 70, 80, 90
            pct_change = 10 if (i % 2 == 0) else 20
            diff = int(original * (pct_change / 100.0))
            increased = original + diff
            decreased = original - diff
            if i % 2 == 0:
                prompt = f"מחיר שוקולד בלגי איכותי לאפייה היה {original} ש\"ח. בשל הביקוש המחיר עלה ב-{pct_change}%. מה המחיר החדש של השוקולד?"
                correct = str(increased)
                explanation = f"נחשב את תוספת ההתייקרות: {pct_change}% מתוך {original} הם {diff} ש\"ח. נוסיף זאת למחיר המקורי ונקבל {correct} ש\"ח."
                q.append(make_sa(f"u07-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"בטיול של רעיה אוחנה ותאיר, תוכנן מסלול של {original} קילומטרים, אך הן החליטו לקצר אותו ב-{pct_change}%. מה אורך המסלול המקוצר בקילומטרים?"
                choices = [str(decreased), str(original), str(increased), str(decreased - 2)]
                correct = str(decreased)
                explanation = f"נחשב את הקיצור במסלול: {pct_change}% מתוך {original} הם {diff} ק\"מ. נחסיר מהאורך המקורי: {original} - {diff} = {correct} ק\"מ."
                q.append(make_mc(f"u07-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 8:
        # Comparing percentages
        for i in range(1, 31):
            w1 = 100 + (i * 10) % 100
            w2 = 50 + (i * 15) % 100
            p1 = 10 if i % 2 == 0 else 20
            p2 = 50
            v1 = int(w1 * (p1 / 100.0))
            v2 = int(w2 * (p2 / 100.0))
            if v1 == v2: v2 += 5
            larger = max(v1, v2)
            if i % 2 == 0:
                prompt = f"מהו הערך הגדול יותר מבין השניים: {p1}% מתוך {w1} או {p2}% מתוך {w2}? (חשבי וכתבי את המספר הגדול יותר)"
                correct = str(larger)
                explanation = f"נחשב את שניהם: הראשון הוא {v1}, השני הוא {v2}. המספר הגדול יותר הוא {correct}."
                q.append(make_sa(f"u08-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה אופה ומכינה שתי קערות בצק. בקערה א' יש {w1} גרם ובקערה ב' יש {w2} גרם. אם נשים {p1}% שוקולד צ'יפס בקערה א' ו-{p2}% שוקולד צ'יפס בקערה ב', איפה תהיה כמות שוקולד גדולה יותר (בגרמים)?"
                choices = ["בקערה א", "בקערה ב", "הכמויות שוות"]
                correct = "בקערה א" if v1 > v2 else "בקערה ב"
                explanation = f"בקערה א' כמות השוקולד היא {v1} גרם. בקערה ב' היא {v2} גרם. לכן הכמות הגדולה יותר היא {correct}."
                q.append(make_mc(f"u08-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 9:
        # Percents in data and pie charts
        for i in range(1, 31):
            total_students = 100 if i % 2 == 0 else 200
            pct_hiking = (i * 7) % 30 + 30 # 30% - 60%
            pct_baking = 100 - pct_hiking - 15
            ans_hiking = int(total_students * (pct_hiking / 100.0))
            if i % 2 == 0:
                prompt = f"בסקר בבית ספר מוריה שנערך בין {total_students} בנות, {pct_hiking}% מהבנות ענו שהן הכי אוהבות לצאת לטיולים. כמה בנות בחרו בטיולים?"
                correct = str(ans_hiking)
                explanation = f"נחשב {pct_hiking}% מתוך {total_students}. מכיוון שיש {total_students} בנות, התשובה היא בדיוק {correct} בנות."
                q.append(make_sa(f"u09-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"בדיאגרמת עוגה המציגה את התחביבים של הבנות בכיתה ז', {pct_hiking}% בחרו בטיולים, 15% בחרו באמנות, והשאר בחרו באפייה וקונדיטוריה. כמה אחוזים בחרו באפייה?"
                choices = [f"{pct_baking}%", f"{pct_baking+5}%", f"{pct_baking-5}%", "100%"]
                correct = f"{pct_baking}%"
                explanation = f"סכום האחוזים בדיאגרמת עוגה שלמה חייב להיות 100%. לכן נפחית את שאר התחביבים ממאה: 100 - {pct_hiking} - 15 = {pct_baking}%."
                q.append(make_mc(f"u09-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 10:
        # Word problems in percents
        for i in range(1, 31):
            base = ((i * 5) % 10 + 2) * 10 # 20, 30, ... 110
            pct = 10 if i % 2 == 0 else 30
            ans = int(base * (pct / 100.0))
            if i % 2 == 0:
                prompt = f"רעיה ותאיר אופות {base} עוגיות לקראת שבת. הן מחליטות להביא {pct}% מהעוגיות לרבקה ושירה. כמה עוגיות הן הביאו לחברות?"
                correct = str(ans)
                explanation = f"נחשב {pct}% מתוך {base} עוגיות: {pct}/100 כפול {base} שווה ל-{correct} עוגיות."
                q.append(make_sa(f"u10-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"רעיה יצאה לטיול עם בקבוק מים של 2 ליטר (2000 מ\"ל). היא שתתה {pct}% מהמים. כמה מ\"ל מים היא שתתה?"
                choices = [str(2000 * pct // 100), "200", "500", "1000"]
                correct = str(2000 * pct // 100)
                explanation = f"נחשב {pct}% מתוך 2000 מ\"ל: {pct}/100 × 2000 = {correct} מ\"ל."
                q.append(make_mc(f"u10-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 11:
        # Everyday percents (battery, grades)
        for i in range(1, 31):
            init_batt = 100 - (i % 5) * 10
            drop = (i * 7) % 30 + 10
            final_batt = init_batt - drop
            if i % 2 == 0:
                prompt = f"הטלפון של רעיה הראה {init_batt}% סוללה בתחילת מסלול הטיול בירושלים. בסוף הטיול הסוללה ירדה ב-{drop}%. כמה אחוזי סוללה מופיעים כעת בטלפון?"
                correct = str(final_batt)
                explanation = f"נחסיר את אחוז הסוללה שירד מאחוז הסוללה ההתחלתי: {init_batt}% פחות {drop}% שווה ל-{correct}% סוללה."
                q.append(make_sa(f"u11-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"במבחן קצר באנגלית היו 20 שאלות. רעיה פתרה נכון 15 שאלות. איזה אחוז מהשאלות פתרה רעיה נכון?"
                choices = ["75%", "80%", "50%", "90%"]
                correct = "75%"
                explanation = f"רעיה ענתה נכון על 15 מתוך 20 שאלות. נכתוב זאת כשבר: 15/20. נכפיל את המכנה והמונה ב-5 כדי להגיע למכנה 100, ונקבל 75/100, כלומר {correct}."
                q.append(make_mc(f"u11-q-{i}", prompt, choices, correct, explanation))

    elif unit_num == 12:
        # Review and assessment
        for i in range(1, 31):
            val = (i * 8) % 80 + 10
            if i % 2 == 0:
                prompt = f"בטיול של רעיה, תאיר ורבקה, הן צעדו 10 קילומטרים המהווים 25% מכל המסלול. מה אורך המסלול כולו בקילומטרים?"
                correct = "40"
                explanation = f"אם 25% (רבע) הוא 10 ק\"מ, המסלול השלם הוא 10 כפול 4, כלומר 40 ק\"מ."
                q.append(make_sa(f"u12-q-{i}", prompt, correct, explanation))
            else:
                prompt = f"מוצר לאפייה עולה 80 ש\"ח ויש 10% הנחה. כמה שקלים נשלם לאחר ההנחה?"
                choices = ["72", "70", "78", "8"]
                correct = "72"
                explanation = f"10% הנחה מתוך 80 ש\"ח הם 8 ש\"ח. לכן המחיר הסופי הוא 80 פחות 8 שווה 72 ש\"ח."
                q.append(make_mc(f"u12-q-{i}", prompt, choices, correct, explanation))

    exercises = q[:10]
    tests = q[10:30]
    
    for idx, item in enumerate(exercises):
        item["id"] = f"u{unit_num:02d}-ex-{idx+1}"
        item["points"] = 10
    for idx, item in enumerate(tests):
        item["id"] = f"u{unit_num:02d}-test-{idx+1}"
        item["points"] = 15 if idx < 16 else 20
        
    return exercises, tests


# ==========================================
# WRITE MARKDOWN LESSONS
# ==========================================

def write_decimals_lesson(unit_num, slug, title, description):
    intro_greeting = f"היי רעיה! ביחידה הזו נלמד על **{title}**."
    
    content = f"""# יחידה {unit_num}: {title}

{intro_greeting}

{description}

## הסבר

מספרים עשרוניים הם דרך נוחה מאוד לייצג חלקים של שלם, במיוחד כאשר אנחנו מודדות מצרכים במטבח (אפייה) או מרחקים בטבע (טיולים).

![אפייה וקונדיטוריה במטבח](content/baking_decimals.png)

הנקודה העשרונית מפרידה תמיד בין השלם לבין השברים:
- משמאל לנקודה: המספרים השלמים (למשל, קילוגרם שלם, שקל שלם או מטר שלם).
- מימין לנקודה: החלקים של השלם (עשיריות, מאיות או אלפיות).

קשר בסיסי בין שבר פשוט לשבר עשרוני:
$$\\frac{{1}}{{10}} = 0.1 \\quad \\text{{או}} \\quad \\frac{{5}}{{10}} = 0.5$$

לדוגמה, באפיית קונדיטוריה במטבח המשפחתי:
- $0.5$ כוס סוכר היא בדיוק חצי כוס (5 עשיריות).
- $0.25$ ק\"ג חמאה הם רבע קילוגרם (25 מאיות).
- $1.75$ ליטר מים הם ליטר שלם ועוד שלושה רבעי ליטר (75 מאיות).

$$\\frac{{25}}{{100}} = 0.25 \\quad \\text{{ועוד}} \\quad \\frac{{75}}{{100}} = 0.75$$

## דוגמאות פתורות

### דוגמה 1:
רעיה ושירה אפו עוגה לכבוד שבת וחילקו אותה ל-$10$ פרוסות שוות. תאיר אכלה $3$ פרוסות. איך נכתוב את החלק של תאיר עשרונית?
**פתרון:** שלוש עשיריות נכתבות כ-$0.3$.

### דוגמה 2:
רעיה הלכה בטיול מרחק של $1.45$ קילומטרים. מהי ספרת המאיות במרחק זה?
**פתרון:** הספרה השנייה מימין לנקודה היא המאיות, ולכן הספרה היא $5$.

### דוגמה 3:
רבקה קנתה מדבקה לעוגה ב-$2$ שקלים ו-$50$ אגורות. איך נכתוב את זה בשקלים?
**פתרון:** שתי יחידות שלמות ו-$50$ מאיות, כלומר $2.50$ או $2.5$ ש\"ח.

## פעילות קצרה במטבח או בבית
בעזרת כוס מדידה של מתכונים או סרגל ציור, מצאי $3$ דוגמאות בבית למדידות שבהן מופיעה נקודה עשרונית (למשל על אריזת קמח, משקל מצרכים או ספר הלכות) ורשמי אותן במחברת.

## תרגול עצמי במחברת
1. כתבי כמספר עשרוני: חצי מטר ($0.5$ מ'), רבע שקל ($0.25$ ש\"ח).
2. במספר העשרוני $3.48$, איזו ספרה מייצגת את העשיריות?
3. חברי: $0.2 + 0.3 = \\text{{___}}$.
4. מה גדול יותר: $0.6$ או $0.58$?
5. השלימי: $1.0 - 0.2 = \\text{{___}}$.

## מה חשוב לזכור?
- הנקודה מפרידה בין שלם לחלקיו.
- $0.1$ הוא עשירית ($\\frac{{1}}{{10}}$), $0.01$ הוא מאית ($\\frac{{1}}{{100}}$), $0.001$ הוא אלפית ($\\frac{{1}}{{1000}}$).
- הוספת אפסים בסוף החלק העשרוני (למשל מ-$0.5$ ל-$0.50$) לא משנה את ערך המספר!
"""
    
    file_path = DECIMALS_DIR / f"{unit_num:02d}-{slug[3:]}.md"
    file_path.write_text(content, encoding="utf-8")


def write_percentages_lesson(unit_num, slug, title, description):
    intro_greeting = f"היי רעיה! ביחידה הזו נלמד על **{title}**."
    
    content = f"""# יחידה {unit_num}: {title}

{intro_greeting}

{description}

## הסבר

אחוזים הם דרך נהדרת להשוות כמויות ולהבין חלק מתוך שלם. אחוז פירושו תמיד \"חלק מתוך מאה\" ($\\frac{{1}}{{100}}$). הסימן שלו הוא $\%$.

![טיול משפחתי בירושלים](content/hiking_percentages.png)

באפייה ובטיולים אנחנו משתמשים באחוזים המון:
- **$100\%$** פירושו כל השלם (למשל, כל העוגה או כל מסלול הטיול).
- **$50\%$** פירושו בדיוק חצי מהשלם (למשל, חצי מהקמח או חצי מהדרך).
- **$25\%$** פירושו רבע מהשלם ($\\frac{{1}}{{4}}$).
- **$75\%$** פירושו שלושה רבעים מהשלם ($\\frac{{3}}{{4}}$).

הנחות קבועות בחנות קונדיטוריה:
$$\\text{{הנחה של }} 20\\% \\implies \\text{{נשאר לשלם }} 80\\% \\text{{ מהמחיר}}$$

## דוגמאות פתורות

### דוגמה 1:
רעיה חילקה תבנית עוגיות ל-$100$ משבצות שוות וקישטה $35$ מהן בריבת תות. כמה אחוז מהעוגיות מקושטות?
**פתרון:** $35$ מתוך $100$ הם בדיוק $35\%$.

### דוגמה 2:
בטיול של רעיה אוחנה ותאיר, אורך המסלול כולו הוא $40$ קילומטרים. הן צעדו כבר $25\%$ מהמסלול. כמה קילומטרים הן צעדו?
**פתרון:** $25\%$ זה רבע מהשלם. רבע מתוך $40$ הוא $10$ ($40 \\div 4 = 10$), ולכן הן צעדו $10$ קילומטרים.

### דוגמה 3:
תבנית אפייה עולה $100$ ש\"ח ויש עליה $30\%$ הנחה. כמה שקלים נשלם?
**פתרון:** $30\%$ הנחה מתוך $100$ ש\"ח זה פשוט $30$ ש\"ח פחות. המחיר יהיה:
$$\\text{{מחיר סופי}} = 100 - 30 = 70 \\text{{ ש\"ח}}$$

## פעילות קצרה בבית
הסתכלי על מכשיר טלפון או טאבלט ובידקי כמה אחוזי סוללה נשארו לו. רשמי במחברת כמה אחוזים חסרים כדי להגיע לטעינה מלאה של $100\%$.

## תרגול עצמי במחברת
1. כתבי כאחוז: $\\frac{{50}}{{100}}$, $\\frac{{1}}{{4}}$.
2. כמה הם $50\%$ מתוך $80$ גרם שוקולד?
3. אם $25\%$ ממסלול הטיול הם $5$ קילומטרים, מהו אורך המסלול המלא?
4. סוללת הטלפון ירדה מ-$90\%$ ל-$60\%$. כמה אחוזי סוללה התרוקנו?
5. מחיר מערוך עץ עלה ב-$10\%$. אם מחירו היה $50$ ש\"ח, מהו המחיר החדש?

## מה חשוב לזכור?
- אחוז הוא תמיד חלק מתוך מאה.
- $50\%$ הוא חצי, $25\%$ הוא רבע, $75\%$ הוא שלושה רבעים.
- סכום כל האחוזים של שלם אחד תמיד שווה ל-$100\%$.
"""
    
    file_path = PERCENTAGES_DIR / f"{unit_num:02d}-{slug[3:]}.md"
    file_path.write_text(content, encoding="utf-8")


# ==========================================
# MAIN EXECUTION AND INTEGRATION
# ==========================================

def update_courses_json():
    # Load and update data/courses.json with correct file references and descriptions
    path = ROOT / "data" / "courses.json"
    courses = json.loads(path.read_text(encoding="utf-8-sig"))
    
    decimals_course = {
        "id": "reaya-decimals",
        "title": "חשבון ז",
        "subject": "חשבון",
        "description": "קורס רב-יחידות בחשבון לכיתה ז, מבוסס על חומרי חשבון רעיה: עשרוניים, ערך המקום, השוואה ופעולות חשבון.",
        "units": [
            {
                "id": f"decimals-{idx:02d}",
                "title": unit[1],
                "description": unit[2],
                "lessonFile": f"content/reaya-decimals/{idx:02d}-{unit[0][3:]}.md",
                "exercisesFile": f"content/reaya-decimals/{idx:02d}-exercises.json",
                "testsFile": f"content/reaya-decimals/{idx:02d}-test.json",
            }
            for idx, unit in enumerate(DECIMALS_UNITS, 1)
        ]
    }
    
    percentages_course = {
        "id": "reaya-percentages",
        "title": "חשבון ז - אחוזים",
        "subject": "חשבון",
        "description": "קורס בן 12 יחידות בנושא אחוזים לרעיה: משמעות האחוז, מעבר בין אחוזים שברים ועשרוניים, חישוב אחוז מכמות, הנחות, התייקרות, השוואות ובעיות מילוליות.",
        "units": [
            {
                "id": f"percentages-{idx:02d}",
                "title": unit[1],
                "description": unit[2],
                "lessonFile": f"content/reaya-percentages/{idx:02d}-{unit[0][3:]}.md",
                "exercisesFile": f"content/reaya-percentages/{idx:02d}-exercises.json",
                "testsFile": f"content/reaya-percentages/{idx:02d}-test.json",
            }
            for idx, unit in enumerate(PERCENTAGES_UNITS, 1)
        ]
    }
    
    # Overwrite or append
    updated = []
    for c in courses:
        if c["id"] == "reaya-decimals":
            updated.append(decimals_course)
        elif c["id"] == "reaya-percentages":
            updated.append(percentages_course)
        else:
            updated.append(c)
            
    # Add if missing
    course_ids = [c["id"] for c in updated]
    if "reaya-decimals" not in course_ids:
        updated.append(decimals_course)
    if "reaya-percentages" not in course_ids:
        updated.append(percentages_course)
        
    path.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def update_students_json():
    # Make sure Raya is assigned to both courses in data/students.json
    path = ROOT / "data" / "students.json"
    students = json.loads(path.read_text(encoding="utf-8-sig"))
    
    # Check if we have Raya, otherwise seed her
    raya_found = False
    for s in students:
        if s.get("name") == "רעיה":
            raya_found = True
            c_ids = s.setdefault("courseIds", [])
            if "reaya-decimals" not in c_ids:
                c_ids.append("reaya-decimals")
            if "reaya-percentages" not in c_ids:
                c_ids.append("reaya-percentages")
                
    if not raya_found:
        students.append({
            "id": "raya",
            "name": "רעיה",
            "courseIds": ["reaya-decimals", "reaya-percentages"]
        })
        
    path.write_text(json.dumps(students, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    print("Starting content generation for Decimals & Percentages...")
    
    # 1. Generate Decimals
    for idx, unit in enumerate(DECIMALS_UNITS, 1):
        slug, title, description = unit
        print(f"Generating decimals unit {idx}: {title}")
        write_decimals_lesson(idx, slug, title, description)
        exercises, tests = generate_decimals_questions(idx)
        
        # Write files
        (DECIMALS_DIR / f"{idx:02d}-exercises.json").write_text(json.dumps(exercises, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (DECIMALS_DIR / f"{idx:02d}-test.json").write_text(json.dumps(tests, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        
    # 2. Generate Percentages
    for idx, unit in enumerate(PERCENTAGES_UNITS, 1):
        slug, title, description = unit
        print(f"Generating percentages unit {idx}: {title}")
        write_percentages_lesson(idx, slug, title, description)
        exercises, tests = generate_percentages_questions(idx)
        
        # Write files
        (PERCENTAGES_DIR / f"{idx:02d}-exercises.json").write_text(json.dumps(exercises, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (PERCENTAGES_DIR / f"{idx:02d}-test.json").write_text(json.dumps(tests, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        
    # 3. Update registrations
    update_courses_json()
    update_students_json()
    
    # 4. Self-validation check
    print("Content generation completed. Running validation...")
    
    for idx in range(1, 13):
        for path_dir in [DECIMALS_DIR, PERCENTAGES_DIR]:
            ex_file = path_dir / f"{idx:02d}-exercises.json"
            test_file = path_dir / f"{idx:02d}-test.json"
            
            ex_data = json.loads(ex_file.read_text(encoding="utf-8"))
            test_data = json.loads(test_file.read_text(encoding="utf-8"))
            
            if len(ex_data) != 10:
                print(f"Error: {ex_file} does not have exactly 10 questions (has {len(ex_data)}).")
                exit(1)
            if len(test_data) != 20:
                print(f"Error: {test_file} does not have exactly 20 questions (has {len(test_data)}).")
                exit(1)
                
    print("Validation success! All files generated correctly with exactly 10 questions in exercises and 20 in tests.")
    return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
