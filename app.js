const STORAGE = {
  students: "hebrewSummer.students",
  courses: "hebrewSummer.courses",
  progress: "hebrewSummer.progress",
  admin: "hebrewSummer.adminSettings",
};

const app = document.querySelector("#app");

const state = {
  students: [],
  courses: [],
  progress: { attempts: {} },
  adminSettings: {},
  adminAuthenticated: false,
  screen: "home",
  adminTab: "students",
  selectedStudentId: "",
  selectedCourseId: "",
  studentTab: "lesson",
  message: null,
};

const contentCache = new Map();

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("change", handleChange);

async function init() {
  try {
    await loadInitialData();
    await render();
  } catch (error) {
    app.innerHTML = `<main class="loading-card"><h1>שגיאה בטעינה</h1><p>${escapeHtml(error.message)}</p></main>`;
  }
}

async function loadInitialData() {
  const [seedStudents, seedCourses, seedProgress, fileAdmin] = await Promise.all([
    fetchJson("data/students.json", []),
    fetchJson("data/courses.json", []),
    fetchJson("data/progress.json", { attempts: {} }),
    fetchJson(`data/admin-settings.json?ts=${Date.now()}`, {}),
  ]);

  state.students = readStorage(STORAGE.students, seedStudents);
  state.courses = readStorage(STORAGE.courses, seedCourses);
  state.progress = readStorage(STORAGE.progress, seedProgress);

  const localAdmin = readStorage(STORAGE.admin, {});
  if (shouldApplyRecovery(localAdmin, fileAdmin)) {
    state.adminSettings = fileAdmin;
    saveStorage(STORAGE.admin, state.adminSettings);
  } else {
    state.adminSettings = Object.keys(localAdmin).length ? localAdmin : fileAdmin;
  }
}

function shouldApplyRecovery(localAdmin, fileAdmin) {
  if (!fileAdmin || !fileAdmin.passwordHash || !fileAdmin.recoveryUpdatedAt) return false;
  if (!localAdmin || !localAdmin.recoveryUpdatedAt) return true;
  return Date.parse(fileAdmin.recoveryUpdatedAt) > Date.parse(localAdmin.recoveryUpdatedAt);
}

async function fetchJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Cannot load ${path}`);
    return await response.json();
  } catch (error) {
    console.warn(error);
    return fallback;
  }
}

async function fetchText(path) {
  if (!path) return "";
  if (contentCache.has(path)) return contentCache.get(path);
  const response = await fetch(`${path}?ts=${Date.now()}`);
  if (!response.ok) throw new Error(`Cannot load ${path}`);
  const text = await response.text();
  contentCache.set(path, text);
  return text;
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveAll() {
  saveStorage(STORAGE.students, state.students);
  saveStorage(STORAGE.courses, state.courses);
  saveStorage(STORAGE.progress, state.progress);
  saveStorage(STORAGE.admin, state.adminSettings);
}

async function render() {
  const content = await renderScreen();
  app.innerHTML = `
    <div class="layout">
      ${renderSideNav()}
      <main class="main">
        ${state.message ? renderMessage(state.message) : ""}
        ${content}
      </main>
    </div>
  `;
  state.message = null;
}

async function renderScreen() {
  if (state.screen === "studentSelect") return renderStudentSelect();
  if (state.screen === "studentCourse") return await renderStudentCourse();
  if (state.screen === "adminAuth") return renderAdminAuth();
  if (state.screen === "admin") return renderAdmin();
  return renderHome();
}

function renderSideNav() {
  const adminLabel = state.adminAuthenticated ? "לוח אבא" : "איזור אבא";
  return `
    <aside class="side-nav">
      <div class="brand"><span class="brand-mark">ק</span><span>לימודי קיץ</span></div>
      <button class="nav-button ${state.screen === "home" ? "active" : ""}" data-action="go" data-screen="home">בית <span>⌂</span></button>
      <button class="nav-button ${state.screen.startsWith("student") ? "active" : ""}" data-action="go" data-screen="studentSelect">אזור ליצנית קיץ <span>◐</span></button>
      <button class="nav-button ${state.screen.startsWith("admin") ? "active" : ""}" data-action="admin-entry">${adminLabel} <span>⚙</span></button>
      <div class="nav-spacer"></div>
      ${state.adminAuthenticated ? `<button class="nav-button" data-action="admin-logout">יציאה מאיזור אבא <span>↪</span></button>` : ""}
    </aside>
  `;
}

function renderHome() {
  return `
    <section class="hero">
      <h1>לימודי קיץ</h1>
      <p>מרחב למידה עברי, פשוט ונעים, עם שיעורים, תרגול, מבחנים וציונים.</p>
    </section>
    <section class="entry-grid">
      <article class="entry-card student">
        <div>
          <h2>אזור ליצנית קיץ</h2>
          <p class="muted">כניסה לשיעורים, תרגול, מבחנים וסקירת ציונים.</p>
          <button class="card-button" data-action="go" data-screen="studentSelect">כניסה לליצנית קיץ</button>
        </div>
        <div class="entry-icon sketch-icon" aria-hidden="true">${renderClownIcon()}</div>
      </article>
      <article class="entry-card admin">
        <div>
          <h2>איזור אבא</h2>
          <p class="muted">ניהול תלמידות, קורסים, תוכן וציונים.</p>
          <button class="card-button" data-action="admin-entry">כניסה לאבא</button>
        </div>
        <div class="entry-icon sketch-icon" aria-hidden="true">${renderDadIcon()}</div>
      </article>
    </section>
    <section class="panel soft">
      <h2>איך התוכן עובד?</h2>
      <p>הסברים נשמרים כקבצי Markdown, ותרגילים/מבחנים נשמרים כקבצי JSON שהאפליקציה יודעת לקרוא ולבדוק.</p>
    </section>
  `;
}

function renderStudentSelect() {
  const students = state.students
    .map(
      (student) => `
        <article class="item">
          <div class="item-row">
            <div>
              <strong>${escapeHtml(student.name)}</strong>
              <div class="muted">כיתה ${escapeHtml(student.grade || "לא צוינה")}</div>
            </div>
            <button class="primary" data-action="select-student" data-id="${student.id}">בחירה</button>
          </div>
        </article>
      `
    )
    .join("");

  return `
    <section class="panel">
      <div class="panel-header">
        <h1>בחירת ליצנית קיץ</h1>
        <button class="ghost" data-action="go" data-screen="home">חזרה</button>
      </div>
      <div class="list">${students || `<div class="empty">עדיין אין תלמידות. הוסיפי תלמידה באיזור אבא.</div>`}</div>
    </section>
  `;
}

async function renderStudentCourse() {
  const student = getSelectedStudent();
  if (!student) {
    state.screen = "studentSelect";
    return renderStudentSelect();
  }

  const assignedCourses = state.courses.filter((course) => student.courseIds?.includes(course.id));
  const selectedCourse = assignedCourses.find((course) => course.id === state.selectedCourseId) || assignedCourses[0];
  if (selectedCourse) state.selectedCourseId = selectedCourse.id;

  const courseButtons = assignedCourses
    .map(
      (course) => `
        <button class="secondary ${course.id === selectedCourse?.id ? "active" : ""}" data-action="select-course" data-id="${course.id}">
          ${escapeHtml(course.title)}
        </button>
      `
    )
    .join("");

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h1>שלום ${escapeHtml(student.name)}</h1>
          <p class="muted">בחרי קורס והמשיכי ללמוד בקצב שלך.</p>
        </div>
        <button class="ghost" data-action="go" data-screen="studentSelect">החלפת ליצנית קיץ</button>
      </div>
      <div class="toolbar">${courseButtons || `<span class="empty">עדיין לא הוקצו לך קורסים.</span>`}</div>
    </section>
    ${selectedCourse ? await renderCourseWorkspace(student, selectedCourse) : ""}
  `;
}

async function renderCourseWorkspace(student, course) {
  const tabs = [
    ["lesson", "הסבר"],
    ["exercise", "תרגול"],
    ["test", "מבחן"],
    ["scores", "ציונים"],
  ];

  let body = "";
  if (state.studentTab === "lesson") body = await renderLesson(course);
  if (state.studentTab === "exercise") body = await renderQuestionSet(student, course, "exercises");
  if (state.studentTab === "test") body = await renderQuestionSet(student, course, "tests");
  if (state.studentTab === "scores") body = renderScoreOverview(student, course);

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(course.title)}</h2>
          <p class="muted">${escapeHtml(course.description || "")}</p>
        </div>
        <span class="score-pill">${escapeHtml(course.subject || "קורס")}</span>
      </div>
      <div class="tabs">
        ${tabs
          .map(
            ([id, label]) => `
              <button class="tab ${state.studentTab === id ? "active" : ""}" data-action="student-tab" data-tab="${id}">
                ${label}
              </button>
            `
          )
          .join("")}
      </div>
      ${body}
    </section>
  `;
}

async function renderLesson(course) {
  const lesson = course.lessons?.[0];
  if (!lesson?.contentFile) return `<div class="empty">עדיין לא נוסף הסבר לקורס הזה.</div>`;
  try {
    const markdown = await fetchText(lesson.contentFile);
    return `<article class="lesson">${markdownToHtml(markdown)}</article>`;
  } catch {
    return `<div class="message error">לא ניתן לטעון את קובץ ההסבר: ${escapeHtml(lesson.contentFile)}</div>`;
  }
}

async function renderQuestionSet(student, course, kind) {
  const file = kind === "exercises" ? course.exercisesFile : course.testsFile;
  const label = kind === "exercises" ? "תרגול" : "מבחן";
  let questions = [];
  try {
    questions = file ? await fetchJson(file, []) : [];
  } catch {
    questions = [];
  }

  if (!questions.length) return `<div class="empty">עדיין אין ${label} לקורס הזה.</div>`;

  const attempt = getAttempt(student.id, course.id, kind);
  const currentScore = attempt ? getCurrentScore(attempt) : null;

  return `
    ${attempt ? `<div class="message success">הוגש ${label}. הציון הנוכחי: ${currentScore}/${attempt.total}</div>` : ""}
    <form id="submit-${kind}" data-course-id="${course.id}" class="grid">
      ${questions.map((question, index) => renderQuestion(question, index + 1, attempt)).join("")}
      <button class="primary" type="submit">${attempt ? "הגשה מחדש" : `הגשת ${label}`}</button>
    </form>
  `;
}

function renderQuestion(question, number, attempt) {
  const savedAnswer = attempt?.answers?.[question.id] || "";
  const feedback = attempt
    ? `<div class="message ${isCorrect(savedAnswer, question.correctAnswer) ? "success" : "warning"}">
        ${isCorrect(savedAnswer, question.correctAnswer) ? "נכון!" : "כדאי לבדוק שוב."}
        ${escapeHtml(question.explanation || "")}
      </div>`
    : "";

  const input =
    question.type === "multiple_choice"
      ? `<div class="choices">
          ${(question.choices || [])
            .map(
              (choice) => `
                <label class="choice">
                  <input type="radio" name="${question.id}" value="${escapeAttr(choice)}" ${savedAnswer === choice ? "checked" : ""} />
                  <span>${escapeHtml(choice)}</span>
                </label>
              `
            )
            .join("")}
        </div>`
      : `<label>תשובה
          <input name="${question.id}" value="${escapeAttr(savedAnswer)}" autocomplete="off" />
        </label>`;

  return `
    <article class="item">
      <div class="item-row">
        <strong>שאלה ${number}</strong>
        <span class="score-pill">${Number(question.points) || 0} נק׳</span>
      </div>
      <p>${escapeHtml(question.prompt)}</p>
      ${input}
      ${feedback}
    </article>
  `;
}

function renderScoreOverview(student, course) {
  const ex = getAttempt(student.id, course.id, "exercises");
  const test = getAttempt(student.id, course.id, "tests");
  return `
    <div class="grid two">
      ${renderScoreCard("תרגול", ex)}
      ${renderScoreCard("מבחן", test)}
    </div>
  `;
}

function renderScoreCard(label, attempt) {
  if (!attempt) {
    return `<article class="item"><h3>${label}</h3><p class="muted">עדיין לא הוגש.</p></article>`;
  }
  const score = getCurrentScore(attempt);
  return `
    <article class="item">
      <div class="item-row">
        <h3>${label}</h3>
        <span class="score-pill">${score}/${attempt.total}</span>
      </div>
      <p class="muted">הוגש בתאריך ${formatDate(attempt.submittedAt)}</p>
      ${attempt.override ? `<p class="message warning">הציון עודכן ידנית. הערה: ${escapeHtml(attempt.override.note || "ללא הערה")}</p>` : ""}
    </article>
  `;
}

function renderAdminAuth() {
  const hasPassword = Boolean(state.adminSettings.passwordHash);
  return `
    <section class="panel">
      <div class="panel-header">
        <h1>${hasPassword ? "כניסת אבא" : "הגדרת סיסמת אבא"}</h1>
        <button class="ghost" data-action="go" data-screen="home">חזרה</button>
      </div>
      ${
        hasPassword
          ? `<form id="admin-login" class="form-grid">
              <label>סיסמה
                <input type="password" name="password" required autocomplete="current-password" />
              </label>
              <button class="primary" type="submit">כניסה</button>
            </form>`
          : `<form id="admin-setup" class="form-grid">
              <label>בחרי סיסמה
                <input type="password" name="password" required minlength="6" autocomplete="new-password" />
              </label>
              <label>אימות סיסמה
                <input type="password" name="confirm" required minlength="6" autocomplete="new-password" />
              </label>
              <button class="primary" type="submit">שמירת סיסמה</button>
            </form>`
      }
      <p class="muted">אם הסיסמה נשכחה, אפשר לאפס אותה דרך Codex באמצעות <code>python scripts/reset_admin_password.py "סיסמה חדשה"</code>.</p>
    </section>
  `;
}

function renderAdmin() {
  const tabs = [
    ["students", "תלמידות"],
    ["courses", "קורסים"],
    ["scores", "ציונים"],
    ["tools", "כלים"],
  ];

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h1>לוח אבא</h1>
          <p class="muted">ניהול תלמידות, קורסים, תוכן וציונים.</p>
        </div>
        <button class="secondary" data-action="admin-tab" data-tab="password">החלפת סיסמה</button>
      </div>
      <div class="tabs">
        ${tabs
          .map(
            ([id, label]) => `
              <button class="tab ${state.adminTab === id ? "active" : ""}" data-action="admin-tab" data-tab="${id}">
                ${label}
              </button>
            `
          )
          .join("")}
      </div>
      ${renderAdminTab()}
    </section>
  `;
}

function renderAdminTab() {
  if (state.adminTab === "courses") return renderAdminCourses();
  if (state.adminTab === "scores") return renderAdminScores();
  if (state.adminTab === "tools") return renderAdminTools();
  if (state.adminTab === "password") return renderPasswordChange();
  return renderAdminStudents();
}

function renderAdminStudents() {
  return `
    <section class="grid two">
      <article class="panel mint">
        <h2>הוספת תלמידה</h2>
        <form id="add-student" class="grid">
          <label>שם תלמידה
            <input name="name" required />
          </label>
          <label>כיתה
            <input name="grade" placeholder="לדוגמה: ד׳" />
          </label>
          <button class="primary" type="submit">הוספה</button>
        </form>
      </article>
      <article class="panel">
        <h2>רשימת תלמידות</h2>
        <div class="list">
          ${
            state.students
              .map(
                (student) => `
                  <div class="item">
                    <div class="item-row">
                      <div>
                        <strong>${escapeHtml(student.name)}</strong>
                        <div class="muted">כיתה ${escapeHtml(student.grade || "לא צוינה")}</div>
                      </div>
                      <button class="danger" data-action="delete-student" data-id="${student.id}">מחיקה</button>
                    </div>
                    <div class="grid">
                      <strong>קורסים משויכים</strong>
                      ${renderAssignmentChecks(student)}
                    </div>
                  </div>
                `
              )
              .join("") || `<div class="empty">עדיין אין תלמידות.</div>`
          }
        </div>
      </article>
    </section>
  `;
}

function renderAssignmentChecks(student) {
  if (!state.courses.length) return `<p class="muted">אין קורסים זמינים.</p>`;
  return state.courses
    .map(
      (course) => `
        <label class="choice">
          <input type="checkbox" data-action="toggle-assignment" data-student-id="${student.id}" data-course-id="${course.id}" ${
        student.courseIds?.includes(course.id) ? "checked" : ""
      } />
          <span>${escapeHtml(course.title)}</span>
        </label>
      `
    )
    .join("");
}

function renderAdminCourses() {
  return `
    <section class="grid two">
      <article class="panel mint">
        <h2>הוספת קורס</h2>
        <form id="add-course" class="grid">
          <label>שם קורס
            <input name="title" required />
          </label>
          <label>תחום
            <input name="subject" placeholder="לדוגמה: עברית" />
          </label>
          <label>תיאור
            <textarea name="description" rows="3"></textarea>
          </label>
          <label>קובץ הסבר Markdown
            <input name="lessonFile" placeholder="content/my-course/lesson.md" />
          </label>
          <label>קובץ תרגול JSON
            <input name="exercisesFile" placeholder="content/my-course/exercises.json" />
          </label>
          <label>קובץ מבחן JSON
            <input name="testsFile" placeholder="content/my-course/tests.json" />
          </label>
          <button class="primary" type="submit">הוספת קורס</button>
        </form>
      </article>
      <article class="panel">
        <h2>קורסים קיימים</h2>
        <div class="list">
          ${
            state.courses
              .map(
                (course) => `
                  <div class="item">
                    <div class="item-row">
                      <div>
                        <strong>${escapeHtml(course.title)}</strong>
                        <div class="muted">${escapeHtml(course.subject || "")}</div>
                      </div>
                      <button class="danger" data-action="delete-course" data-id="${course.id}">מחיקה</button>
                    </div>
                    <p>${escapeHtml(course.description || "ללא תיאור")}</p>
                    <small class="muted">הסבר: ${escapeHtml(course.lessons?.[0]?.contentFile || "לא הוגדר")}</small>
                  </div>
                `
              )
              .join("") || `<div class="empty">עדיין אין קורסים.</div>`
          }
        </div>
      </article>
    </section>
  `;
}

function renderAdminScores() {
  const rows = [];
  for (const student of state.students) {
    for (const course of state.courses.filter((item) => student.courseIds?.includes(item.id))) {
      for (const kind of ["exercises", "tests"]) {
        const attempt = getAttempt(student.id, course.id, kind);
        rows.push({ student, course, kind, attempt });
      }
    }
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>תלמידה</th>
            <th>קורס</th>
            <th>סוג</th>
            <th>ציון</th>
            <th>עדכון ידני</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows
              .map(
                ({ student, course, kind, attempt }) => `
                  <tr>
                    <td>${escapeHtml(student.name)}</td>
                    <td>${escapeHtml(course.title)}</td>
                    <td>${kind === "exercises" ? "תרגול" : "מבחן"}</td>
                    <td>${attempt ? `${getCurrentScore(attempt)}/${attempt.total}` : "טרם הוגש"}</td>
                    <td>
                      ${
                        attempt
                          ? `<form data-form="override-score" data-student-id="${student.id}" data-course-id="${course.id}" data-kind="${kind}" class="grid">
                              <label>ציון חדש
                                <input name="score" type="number" min="0" max="${attempt.total}" value="${getCurrentScore(attempt)}" />
                              </label>
                              <label>הערת אבא
                                <input name="note" value="${escapeAttr(attempt.override?.note || "")}" />
                              </label>
                              <button class="secondary" type="submit">שמירת עדכון</button>
                            </form>`
                          : `<span class="muted">אין ניסיון לעדכון.</span>`
                      }
                    </td>
                  </tr>
                `
              )
              .join("") || `<tr><td colspan="5">אין נתונים להצגה.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminTools() {
  return `
    <section class="grid two">
      <article class="panel mint">
        <h2>גיבוי ושחזור</h2>
        <div class="toolbar">
          <button class="primary" data-action="export-backup">ייצוא גיבוי</button>
        </div>
        <form id="import-backup" class="grid">
          <label>ייבוא קובץ גיבוי JSON
            <input type="file" name="backup" accept="application/json,.json" />
          </label>
          <label>או הדבקת JSON לשחזור
            <textarea name="backupText" rows="5" placeholder='{"version":1,...}'></textarea>
          </label>
          <button class="secondary" type="submit">ייבוא גיבוי</button>
        </form>
      </article>
      <article class="panel">
        <h2>פורמט תוכן AI</h2>
        <p>הסברים נוצרים כ-Markdown. תרגילים ומבחנים נוצרים כ-JSON במבנה קבוע.</p>
        <pre><code>${escapeHtml(JSON.stringify(sampleQuestionFormat(), null, 2))}</code></pre>
      </article>
    </section>
  `;
}

function renderPasswordChange() {
  return `
    <section class="panel mint">
      <h2>החלפת סיסמת אבא</h2>
      <form id="change-password" class="form-grid">
        <label>סיסמה נוכחית
          <input type="password" name="current" required autocomplete="current-password" />
        </label>
        <label>סיסמה חדשה
          <input type="password" name="password" required minlength="6" autocomplete="new-password" />
        </label>
        <label>אימות סיסמה חדשה
          <input type="password" name="confirm" required minlength="6" autocomplete="new-password" />
        </label>
        <button class="primary" type="submit">שמירת סיסמה חדשה</button>
      </form>
    </section>
  `;
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;

  const action = target.dataset.action;
  if (action === "go") {
    state.screen = target.dataset.screen;
    await render();
  }
  if (action === "admin-entry") {
    state.screen = state.adminAuthenticated ? "admin" : "adminAuth";
    await render();
  }
  if (action === "admin-logout") {
    state.adminAuthenticated = false;
    state.screen = "home";
    state.message = { type: "success", text: "יצאת מאיזור אבא." };
    await render();
  }
  if (action === "select-student") {
    state.selectedStudentId = target.dataset.id;
    state.selectedCourseId = "";
    state.studentTab = "lesson";
    state.screen = "studentCourse";
    await render();
  }
  if (action === "select-course") {
    state.selectedCourseId = target.dataset.id;
    state.studentTab = "lesson";
    await render();
  }
  if (action === "student-tab") {
    state.studentTab = target.dataset.tab;
    await render();
  }
  if (action === "admin-tab") {
    state.adminTab = target.dataset.tab;
    await render();
  }
  if (action === "delete-student") {
    deleteStudent(target.dataset.id);
    await render();
  }
  if (action === "delete-course") {
    deleteCourse(target.dataset.id);
    await render();
  }
  if (action === "export-backup") {
    exportBackup();
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = new FormData(form);

  if (form.id === "admin-setup") return setupAdmin(data);
  if (form.id === "admin-login") return loginAdmin(data);
  if (form.id === "change-password") return changePassword(data);
  if (form.id === "add-student") return addStudent(data);
  if (form.id === "add-course") return addCourse(data);
  if (form.id === "submit-exercises") return submitQuestions(form, "exercises");
  if (form.id === "submit-tests") return submitQuestions(form, "tests");
  if (form.dataset.form === "override-score") return overrideScore(form, data);
  if (form.id === "import-backup") return importBackup(data);
}

async function handleChange(event) {
  const target = event.target.closest("[data-action='toggle-assignment']");
  if (!target) return;
  const student = state.students.find((item) => item.id === target.dataset.studentId);
  if (!student) return;
  student.courseIds = student.courseIds || [];
  if (target.checked && !student.courseIds.includes(target.dataset.courseId)) {
    student.courseIds.push(target.dataset.courseId);
  }
  if (!target.checked) {
    student.courseIds = student.courseIds.filter((id) => id !== target.dataset.courseId);
  }
  saveStorage(STORAGE.students, state.students);
  state.message = { type: "success", text: "שיוך הקורס עודכן." };
  await render();
}

async function setupAdmin(data) {
  const password = data.get("password") || "";
  const confirm = data.get("confirm") || "";
  if (password.length < 6) return show("error", "הסיסמה חייבת להכיל לפחות 6 תווים.");
  if (password !== confirm) return show("error", "אימות הסיסמה אינו תואם.");
  state.adminSettings = await createPasswordSettings(password);
  state.adminAuthenticated = true;
  state.screen = "admin";
  saveStorage(STORAGE.admin, state.adminSettings);
  return show("success", "סיסמת אבא נשמרה בהצלחה.");
}

async function loginAdmin(data) {
  const ok = await verifyPassword(data.get("password") || "");
  if (!ok) return show("error", "הסיסמה שגויה.");
  state.adminAuthenticated = true;
  state.screen = "admin";
  return show("success", "ברוכה הבאה לאיזור אבא.");
}

async function changePassword(data) {
  const current = data.get("current") || "";
  const password = data.get("password") || "";
  const confirm = data.get("confirm") || "";
  if (!(await verifyPassword(current))) return show("error", "הסיסמה הנוכחית שגויה.");
  if (password.length < 6) return show("error", "הסיסמה החדשה חייבת להכיל לפחות 6 תווים.");
  if (password !== confirm) return show("error", "אימות הסיסמה החדשה אינו תואם.");
  state.adminSettings = await createPasswordSettings(password);
  saveStorage(STORAGE.admin, state.adminSettings);
  return show("success", "הסיסמה עודכנה בהצלחה.");
}

async function createPasswordSettings(password) {
  const salt = randomHex(16);
  return {
    ...state.adminSettings,
    passwordSalt: salt,
    passwordHash: await sha256Hex(`${salt}:${password}`),
    recoveryUpdatedAt: new Date().toISOString(),
  };
}

async function verifyPassword(password) {
  if (!state.adminSettings.passwordHash || !state.adminSettings.passwordSalt) return false;
  const hash = await sha256Hex(`${state.adminSettings.passwordSalt}:${password}`);
  return hash === state.adminSettings.passwordHash;
}

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomHex(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function addStudent(data) {
  state.students.push({
    id: `student-${Date.now()}`,
    name: String(data.get("name") || "").trim(),
    grade: String(data.get("grade") || "").trim(),
    courseIds: [],
  });
  saveStorage(STORAGE.students, state.students);
  return show("success", "התלמידה נוספה.");
}

function deleteStudent(id) {
  const student = state.students.find((item) => item.id === id);
  if (!student || !confirm(`למחוק את ${student.name}?`)) return;
  state.students = state.students.filter((item) => item.id !== id);
  delete state.progress.attempts[id];
  saveStorage(STORAGE.students, state.students);
  saveStorage(STORAGE.progress, state.progress);
  state.message = { type: "success", text: "התלמידה נמחקה." };
}

async function addCourse(data) {
  const title = String(data.get("title") || "").trim();
  const lessonFile = String(data.get("lessonFile") || "").trim();
  state.courses.push({
    id: `course-${Date.now()}`,
    title,
    subject: String(data.get("subject") || "").trim(),
    description: String(data.get("description") || "").trim(),
    lessons: lessonFile ? [{ id: `lesson-${Date.now()}`, title: "הסבר", contentFile: lessonFile }] : [],
    exercisesFile: String(data.get("exercisesFile") || "").trim(),
    testsFile: String(data.get("testsFile") || "").trim(),
  });
  saveStorage(STORAGE.courses, state.courses);
  return show("success", "הקורס נוסף.");
}

function deleteCourse(id) {
  const course = state.courses.find((item) => item.id === id);
  if (!course || !confirm(`למחוק את הקורס ${course.title}?`)) return;
  state.courses = state.courses.filter((item) => item.id !== id);
  state.students.forEach((student) => {
    student.courseIds = (student.courseIds || []).filter((courseId) => courseId !== id);
  });
  for (const studentAttempts of Object.values(state.progress.attempts || {})) {
    delete studentAttempts[id];
  }
  saveStorage(STORAGE.courses, state.courses);
  saveStorage(STORAGE.students, state.students);
  saveStorage(STORAGE.progress, state.progress);
  state.message = { type: "success", text: "הקורס נמחק." };
}

async function submitQuestions(form, kind) {
  const student = getSelectedStudent();
  const course = state.courses.find((item) => item.id === form.dataset.courseId);
  if (!student || !course) return;

  const file = kind === "exercises" ? course.exercisesFile : course.testsFile;
  const questions = await fetchJson(file, []);
  const data = new FormData(form);
  const answers = {};
  let score = 0;
  let total = 0;

  for (const question of questions) {
    const answer = String(data.get(question.id) || "").trim();
    answers[question.id] = answer;
    const points = Number(question.points) || 0;
    total += points;
    if (isCorrect(answer, question.correctAnswer)) score += points;
  }

  setAttempt(student.id, course.id, kind, {
    answers,
    score,
    total,
    submittedAt: new Date().toISOString(),
  });
  saveStorage(STORAGE.progress, state.progress);
  return show("success", `ההגשה נשמרה. הציון: ${score}/${total}`);
}

async function overrideScore(form, data) {
  const attempt = getAttempt(form.dataset.studentId, form.dataset.courseId, form.dataset.kind);
  if (!attempt) return;
  const newScore = Number(data.get("score"));
  if (Number.isNaN(newScore) || newScore < 0 || newScore > attempt.total) {
    return show("error", "הציון החדש אינו תקין.");
  }
  attempt.override = {
    score: newScore,
    originalScore: attempt.override?.originalScore ?? attempt.score,
    note: String(data.get("note") || "").trim(),
    timestamp: new Date().toISOString(),
  };
  saveStorage(STORAGE.progress, state.progress);
  return show("success", "הציון עודכן ידנית.");
}

function exportBackup() {
  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students: state.students,
    courses: state.courses,
    progress: state.progress,
    adminSettings: state.adminSettings,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `limudei-kayitz-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importBackup(data) {
  const file = data.get("backup");
  const pastedText = String(data.get("backupText") || "").trim();
  if ((!file || !file.size) && !pastedText) return show("error", "לא נבחר קובץ ולא הודבק JSON.");
  try {
    const backup = JSON.parse(file && file.size ? await file.text() : pastedText);
    if (!isValidBackup(backup)) throw new Error("Invalid backup");
    state.students = backup.students;
    state.courses = backup.courses;
    state.progress = backup.progress;
    state.adminSettings = backup.adminSettings;
    saveAll();
    return show("success", "הגיבוי יובא בהצלחה.");
  } catch {
    return show("error", "קובץ הגיבוי אינו תקין.");
  }
}

function isValidBackup(backup) {
  return (
    backup &&
    Array.isArray(backup.students) &&
    Array.isArray(backup.courses) &&
    backup.progress &&
    typeof backup.progress === "object" &&
    backup.adminSettings &&
    typeof backup.adminSettings === "object"
  );
}

function getSelectedStudent() {
  return state.students.find((student) => student.id === state.selectedStudentId);
}

function getAttempt(studentId, courseId, kind) {
  return state.progress.attempts?.[studentId]?.[courseId]?.[kind] || null;
}

function setAttempt(studentId, courseId, kind, attempt) {
  state.progress.attempts = state.progress.attempts || {};
  state.progress.attempts[studentId] = state.progress.attempts[studentId] || {};
  state.progress.attempts[studentId][courseId] = state.progress.attempts[studentId][courseId] || {};
  state.progress.attempts[studentId][courseId][kind] = attempt;
}

function getCurrentScore(attempt) {
  return attempt.override ? attempt.override.score : attempt.score;
}

function isCorrect(answer, correctAnswer) {
  return normalizeAnswer(answer) === normalizeAnswer(correctAnswer);
}

function normalizeAnswer(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

async function show(type, text) {
  state.message = { type, text };
  await render();
}

function renderMessage(message) {
  return `<div class="message ${message.type}">${escapeHtml(message.text)}</div>`;
}

function renderDadIcon() {
  return `
    <svg viewBox="0 0 96 96" role="img" aria-label="אבא">
      <path class="sketch-fill soft-blue" d="M24 39c1-18 11-28 25-28 15 0 25 10 25 28v8c0 20-11 35-25 35S24 67 24 47z" />
      <path class="sketch-line" d="M24 42c1-19 10-31 25-31 15 0 25 12 25 31" />
      <path class="sketch-fill white" d="M24 31c5-12 13-18 25-18 11 0 20 6 25 18-7 3-16 4-25 4s-18-1-25-4z" />
      <path class="sketch-line" d="M25 31c6-12 14-18 24-18s19 6 25 18M31 32c10 3 25 4 39 0" />
      <path class="sketch-line" d="M26 45c-8-2-12 8-8 15 2 4 5 6 9 5M72 45c8-2 12 8 8 15-2 4-5 6-9 5" />
      <path class="sketch-line" d="M33 47c5-4 12-4 17 0M50 47c5-4 12-4 17 0M48 49h3" />
      <rect class="sketch-line no-fill" x="30" y="43" width="19" height="11" rx="4" />
      <rect class="sketch-line no-fill" x="52" y="43" width="19" height="11" rx="4" />
      <path class="sketch-line" d="M46 57c2 2 4 2 6 0M39 65c6 5 14 5 20 0" />
      <path class="sketch-line" d="M31 58c3 18 11 27 18 27s15-9 18-27" />
      <path class="sketch-fill ink" d="M31 57c2 20 10 30 18 30s16-10 18-30c-8 5-13 7-18 7s-10-2-18-7z" />
      <path class="sketch-line" d="M21 41c-5 12-4 27 5 35M75 41c5 12 4 27-5 35M20 73c-6 3-7 9-2 12M77 73c6 3 7 9 2 12" />
    </svg>
  `;
}

function renderClownIcon() {
  return `
    <svg viewBox="0 0 96 96" role="img" aria-label="ליצנית קיץ">
      <path class="sketch-fill soft-coral" d="M23 48c0-18 11-30 26-30s25 12 25 30c0 20-11 34-25 34S23 68 23 48z" />
      <path class="sketch-line" d="M24 48c0-18 10-30 25-30s25 12 25 30c0 20-11 34-25 34S24 68 24 48z" />
      <path class="sketch-fill yellow" d="M35 18 48 5l13 13c-8 4-17 4-26 0z" />
      <path class="sketch-line" d="M35 18 48 5l13 13M38 19c7 3 14 3 21 0" />
      <path class="sketch-line" d="M25 44c-9-5-15 3-14 12 1 8 8 12 15 8M73 44c9-5 15 3 14 12-1 8-8 12-15 8" />
      <path class="sketch-line" d="M18 43c-6-5-3-13 5-13M78 43c6-5 3-13-5-13" />
      <circle class="sketch-fill coral" cx="49" cy="53" r="6" />
      <path class="sketch-line" d="M38 44c3-3 8-3 11 0M54 44c3-3 8-3 11 0M38 64c7 7 15 7 22 0" />
      <path class="sketch-line" d="M31 80c6 9 11 9 17 1 6 8 12 8 18-1" />
      <path class="sketch-fill teal" d="M35 78c4 8 8 8 13 1 5 7 9 7 14-1-8 3-18 3-27 0z" />
      <path class="sketch-line" d="M30 30c5-8 14-11 19-11s15 3 19 11" />
    </svg>
  `;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }
    if (line.startsWith("### ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h3>${inlineMarkdown(line.slice(4))}</h3>`;
    } else if (line.startsWith("## ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2>${inlineMarkdown(line.slice(3))}</h2>`;
    } else if (line.startsWith("# ")) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h1>${inlineMarkdown(line.slice(2))}</h1>`;
    } else if (line.startsWith("- ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inlineMarkdown(line.slice(2))}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p>${inlineMarkdown(line)}</p>`;
    }
  }
  if (inList) html += "</ul>";
  return html;
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function sampleQuestionFormat() {
  return [
    {
      id: "unique-question-id",
      type: "multiple_choice",
      prompt: "טקסט השאלה בעברית",
      choices: ["תשובה א", "תשובה ב", "תשובה ג"],
      correctAnswer: "תשובה א",
      points: 10,
      explanation: "הסבר קצר לתלמידה אחרי ההגשה",
    },
  ];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
