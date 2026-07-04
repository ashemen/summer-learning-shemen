from pathlib import Path
import argparse
import shutil
import subprocess


PROMPTS = [
    ("01_scaffold_app.txt", """Create a local static web app for a Hebrew summer learning program.

Requirements:
- Files: index.html, styles.css, app.js, data/*.json, content/sample-course/*.md/json.
- UI language: Hebrew.
- HTML must use lang="he" and dir="rtl".
- No backend, no build step.
- Use localStorage for runtime state.
- Seed with one admin setup flow, two sample students, and one sample course.
- The first screen should let the user choose: student area or admin area.
- Keep the design polished, readable, child-friendly, and simple.
- Do not use external paid services.

After implementation, explain how to open the app locally.
"""),
    ("02_admin_password.txt", """Implement admin password setup and login.

Requirements:
- On first admin access, ask the administrator to choose a password.
- Store only a salted SHA-256 hash, not the plain password.
- Add logout.
- Add change-password flow after login.
- Add a documented Codex recovery path:
  - Create scripts/reset_admin_password.py.
  - It accepts a new password and updates the stored admin password hash.
  - It must not expose a reset button in the student UI.
- Add Hebrew error/success messages.
- Verify wrong password fails and correct password succeeds.
"""),
    ("03_student_course_management.txt", """Implement admin management screens.

Requirements:
- Admin can add and remove students.
- Admin can add courses.
- Admin can assign or unassign courses per student.
- Store student/course assignments in localStorage, seeded from JSON defaults.
- Student names, course names, and UI labels must support Hebrew.
- Add confirmation before deleting a student or course.
- Show empty states in Hebrew.
"""),
    ("04_ai_content_format.txt", """Implement the learning-content format.

Requirements:
- Explanatory lessons are Markdown files.
- Exercises and tests are JSON files.
- courses.json links lessons, exercises, and tests.
- app.js loads content from JSON and Markdown files using fetch.
- Add sample Hebrew content for one course.
- Add a README section describing the exact AI generation format.

Exercise/test JSON shape:
- id
- type: "multiple_choice" or "short_answer"
- prompt
- choices, only for multiple choice
- correctAnswer
- points
- explanation
"""),
    ("05_student_learning_experience.txt", """Implement the student experience.

Requirements:
- Student selects their name.
- Student sees only assigned courses.
- Each course has four tabs:
  - הסבר
  - תרגול
  - מבחן
  - ציונים
- Render Markdown explanations.
- Render exercises interactively.
- Render tests interactively.
- Automatically score answers.
- Save progress in localStorage.
- Show feedback in Hebrew after submission.
"""),
    ("06_scores_admin_overrides.txt", """Implement score review and override.

Requirements:
- Admin can view each student's course progress.
- Admin can see exercise and test attempts.
- Admin can override a score manually.
- Manual override must store:
  - overridden score
  - original score
  - admin note
  - timestamp
- Student score overview should show current score after override.
- Use Hebrew labels throughout.
"""),
    ("07_import_export.txt", """Add simple backup and content-management tools.

Requirements:
- Admin can export all localStorage data as a JSON backup file.
- Admin can import a previous backup JSON file.
- Validate imported backup shape before applying it.
- Admin can view the expected AI content format.
- Include sample prompts in README for generating new Hebrew lessons, exercises, and tests.
"""),
    ("08_final_qa_polish.txt", """Perform final QA and polish.

Requirements:
- Check Hebrew RTL layout on desktop and mobile width.
- Verify admin setup, login, logout, password change, and reset_admin_password.py.
- Verify add/remove students.
- Verify course assignment.
- Verify lesson Markdown renders.
- Verify exercise and test scoring.
- Verify admin score override.
- Verify export/import.
- Fix visual overflow, untranslated text, broken paths, and console errors.
- Provide final usage instructions.
"""),
]


def write_prompts(out_dir: Path) -> None:
    out_dir.mkdir(exist_ok=True)
    for filename, body in PROMPTS:
        (out_dir / filename).write_text(body.strip() + "\n", encoding="utf-8")


def run_prompt(path: Path) -> int:
    codex = shutil.which("codex")
    if not codex:
        print("Codex CLI was not found. Prompt files were created for manual use.")
        return 2

    prompt = path.read_text(encoding="utf-8")
    print(f"Running {path.name}...")
    result = subprocess.run([codex, "exec", prompt], text=True)
    return result.returncode


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="implementation-prompts")
    parser.add_argument("--print", dest="print_only", action="store_true")
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()

    out_dir = Path(args.dir)
    write_prompts(out_dir)

    if args.print_only:
        for path in sorted(out_dir.glob("*.txt")):
            print(f"\n--- {path.name} ---\n")
            print(path.read_text(encoding="utf-8"))
        return 0

    if args.execute:
        for path in sorted(out_dir.glob("*.txt")):
            code = run_prompt(path)
            if code != 0:
                return code
        return 0

    print(f"Wrote {len(PROMPTS)} prompts to {out_dir}")
    print("Use --print to view them or --execute to run them with Codex CLI.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
