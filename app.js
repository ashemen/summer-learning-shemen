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
  selectedUnitId: "",
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
  state.courses = readStorage(STORAGE.courses, seedCourses).map(normalizeCourse);
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

function normalizeCourse(course) {
  const normalized = { ...course };
  if (!Array.isArray(normalized.units)) {
    normalized.units = [
      {
        id: course.lessons?.[0]?.id || `${course.id}-unit-1`,
        title: course.lessons?.[0]?.title || "יחידה 1",
        description: course.description || "",
        lessonFile: course.lessons?.[0]?.contentFile || "",
        exercisesFile: course.exercisesFile || "",
        testsFile: course.testsFile || "",
      },
    ];
  }
  normalized.units = normalized.units.map((unit, index) => normalizeUnit(unit, index));
  return normalized;
}

function normalizeUnit(unit, index = 0) {
  return {
    id: unit.id || `unit-${Date.now()}-${index}`,
    title: unit.title || `יחידה ${index + 1}`,
    description: unit.description || "",
    lessonFile: unit.lessonFile || unit.contentFile || "",
    lessonMarkdown: unit.lessonMarkdown || "",
    exercisesFile: unit.exercisesFile || "",
    exercises: Array.isArray(unit.exercises) ? unit.exercises : [],
    testsFile: unit.testsFile || "",
    tests: Array.isArray(unit.tests) ? unit.tests : [],
  };
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
      <p>מרחב למידה עברי, פשוט ונעים, עם שיעורים, משחקים, מבחנים וציונים.</p>
    </section>
    <section class="entry-grid">
      <article class="entry-card student">
        <div>
          <h2>אזור ליצנית קיץ</h2>
          <p class="muted">כניסה לשיעורים, משחקים, מבחנים וסקירת ציונים.</p>
          <button class="card-button" data-action="go" data-screen="studentSelect">כניסה לליצנית קיץ</button>
        </div>
        <div class="entry-icon sketch-icon" aria-hidden="true">${renderClownIcon()}</div>
      </article>
      <article class="entry-card admin">
        <div>
          <h2>איזור אבא</h2>
          <p class="muted">ניהול תלמידות, קורסים, יחידות, תוכן וציונים.</p>
          <button class="card-button" data-action="admin-entry">כניסה לאבא</button>
        </div>
        <div class="entry-icon sketch-icon" aria-hidden="true">${renderDadIcon()}</div>
      </article>
    </section>
    <section class="panel soft">
      <h2>איך התוכן עובד?</h2>
      <p>כל קורס מחולק ליחידות. בכל יחידה אפשר לשלב הסבר, משחק, מבחן או כל שילוב ביניהם.</p>
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
          <p class="muted">בחרי קורס, ואז יחידה מתוך הקורס.</p>
        </div>
        <button class="ghost" data-action="go" data-screen="studentSelect">החלפת ליצנית קיץ</button>
      </div>
      <div class="toolbar">${courseButtons || `<span class="empty">עדיין לא הוקצו לך קורסים.</span>`}</div>
    </section>
    ${selectedCourse ? await renderCourseWorkspace(student, selectedCourse) : ""}
  `;
}

async function renderCourseWorkspace(student, course) {
  const units = course.units || [];
  const unit = getSelectedUnit(course);
  if (!unit) return `<section class="panel"><div class="empty">לקורס הזה עדיין אין יחידות.</div></section>`;

  const tabs = [
    ["lesson", "הסבר"],
    ["game", "משחק"],
    ["test", "מבחן"],
    ["scores", "ציונים"],
  ];

  let body = "";
  if (state.studentTab === "lesson") body = await renderLesson(unit);
  if (state.studentTab === "game") body = await renderLearningGame(student, course, unit);
  if (state.studentTab === "test") body = await renderQuestionSet(student, course, unit, "tests");
  if (state.studentTab === "scores") body = renderScoreOverview(student, course, unit);

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>${escapeHtml(course.title)}</h2>
          <p class="muted">${escapeHtml(course.description || "")}</p>
        </div>
        <span class="score-pill">${escapeHtml(course.subject || "קורס")}</span>
      </div>
      <div class="unit-nav">
        ${units
          .map(
            (item, index) => `
              <button class="unit-button ${item.id === unit.id ? "active" : ""}" data-action="select-unit" data-id="${item.id}">
                <span>${index + 1}</span>
                ${escapeHtml(item.title)}
              </button>
            `
          )
          .join("")}
      </div>
      <article class="panel soft unit-summary">
        <h3>${escapeHtml(unit.title)}</h3>
        <p>${escapeHtml(unit.description || "יחידה ללא תיאור.")}</p>
      </article>
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

async function renderLesson(unit) {
  if (unit.lessonMarkdown) return `<article class="lesson">${markdownToHtml(unit.lessonMarkdown)}</article>`;
  if (!unit.lessonFile) return `<div class="empty">ביחידה הזאת עדיין אין הסבר.</div>`;
  try {
    const markdown = await fetchText(unit.lessonFile);
    return `<article class="lesson">${markdownToHtml(markdown)}</article>`;
  } catch {
    return `<div class="message error">לא ניתן לטעון את קובץ ההסבר: ${escapeHtml(unit.lessonFile)}</div>`;
  }
}

async function loadQuestions(unit, kind) {
  const inline = kind === "exercises" ? unit.exercises : unit.tests;
  const file = kind === "exercises" ? unit.exercisesFile : unit.testsFile;
  if (Array.isArray(inline) && inline.length) return inline;
  if (!file) return [];
  return await fetchJson(file, []);
}

async function renderQuestionSet(student, course, unit, kind) {
  const label = kind === "exercises" ? "משחק" : "מבחן";
  const questions = await loadQuestions(unit, kind);
  if (!questions.length) return `<div class="empty">ביחידה הזאת אין ${label}.</div>`;

  const attempt = getAttempt(student.id, course.id, unit.id, kind);
  const currentScore = attempt ? getCurrentScore(attempt) : null;

  return `
    ${attempt ? `<div class="message success">הוגש ${label}. הציון הנוכחי: ${currentScore}/${attempt.total}</div>` : ""}
    <form data-form="submit-questions" data-kind="${kind}" data-course-id="${course.id}" data-unit-id="${unit.id}" class="grid">
      ${questions.map((question, index) => renderQuestion(question, index + 1, attempt)).join("")}
      <button class="primary" type="submit">${attempt ? "הגשה מחדש" : `הגשת ${label}`}</button>
    </form>
  `;
}

async function renderLearningGame(student, course, unit) {
  const questions = await loadQuestions(unit, "exercises");
  if (!questions.length) return `<div class="empty">ביחידה הזאת עדיין אין משחק.</div>`;

  const attempt = getAttempt(student.id, course.id, unit.id, "exercises");
  const solvedCount = attempt ? countCorrectAnswers(questions, attempt.answers) : 0;
  const allSolved = solvedCount === questions.length;
  const codeTiles = questions
    .map((question, index) => {
      const solved = attempt && isCorrect(attempt.answers?.[question.id], question.correctAnswer);
      return `<span class="code-tile ${solved ? "unlocked" : ""}">${solved ? escapeHtml(getGameReward(question, index)) : "?"}</span>`;
    })
    .join("");

  return `
    <article class="game-hero">
      <div>
        <h3>משחק פתיחת הקוד</h3>
        <p>עני על המשימות כדי לגלות את חלקי הקוד של היחידה. אפשר לנסות שוב עד שהכול נפתח.</p>
      </div>
      <div class="game-code" aria-label="קוד המשחק">${codeTiles}</div>
    </article>
    ${
      attempt
        ? `<div class="message ${allSolved ? "success" : "warning"}">
            ${allSolved ? "כל הכבוד! כל חלקי הקוד נפתחו." : `פתחת ${solvedCount}/${questions.length} חלקי קוד. אפשר לתקן ולנסות שוב.`}
          </div>`
        : ""
    }
    <form data-form="submit-questions" data-kind="exercises" data-course-id="${course.id}" data-unit-id="${unit.id}" class="grid game-board">
      ${questions.map((question, index) => renderGameChallenge(question, index + 1, attempt)).join("")}
      <button class="primary" type="submit">${attempt ? "בדיקה מחדש" : "בדיקת הקוד"}</button>
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

  return `
    <article class="item">
      <div class="item-row">
        <strong>שאלה ${number}</strong>
        <span class="score-pill">${Number(question.points) || 0} נק׳</span>
      </div>
      <p>${escapeHtml(question.prompt)}</p>
      ${renderAnswerInput(question, savedAnswer)}
      ${feedback}
    </article>
  `;
}

function renderGameChallenge(question, number, attempt) {
  const savedAnswer = attempt?.answers?.[question.id] || "";
  const solved = attempt && isCorrect(savedAnswer, question.correctAnswer);
  const feedback = attempt
    ? `<div class="message ${solved ? "success" : "warning"}">
        ${
          solved
            ? `נפתח חלק קוד: <strong>${escapeHtml(getGameReward(question, number - 1))}</strong>`
            : "החלק הזה עדיין נעול. נסי שוב."
        }
        ${question.explanation ? `<span>${escapeHtml(question.explanation)}</span>` : ""}
      </div>`
    : "";

  return `
    <article class="item game-card ${solved ? "solved" : ""}">
      <div class="item-row">
        <strong>משימה ${number}</strong>
        <span class="score-pill">${solved ? "נפתח" : "נעול"}</span>
      </div>
      <p>${escapeHtml(question.prompt)}</p>
      ${renderAnswerInput(question, savedAnswer)}
      ${feedback}
    </article>
  `;
}

function renderAnswerInput(question, savedAnswer) {
  if (question.type === "multiple_choice") {
    return `<div class="choices">
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
    </div>`;
  }

  return `<label>תשובה
    <input name="${question.id}" value="${escapeAttr(savedAnswer)}" autocomplete="off" />
  </label>`;
}

function renderScoreOverview(student, course, unit) {
  const ex = getAttempt(student.id, course.id, unit.id, "exercises");
  const test = getAttempt(student.id, course.id, unit.id, "tests");
  return `
    <div class="grid two">
      ${renderScoreCard("משחק", ex)}
      ${renderScoreCard("מבחן", test)}
    </div>
  `;
}

function renderScoreCard(label, attempt) {
  if (!attempt) return `<article class="item"><h3>${label}</h3><p class="muted">עדיין לא הוגש.</p></article>`;
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
    ["courses", "קורסים ויחידות"],
    ["scores", "ציונים"],
    ["tools", "כלים"],
  ];

  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h1>לוח אבא</h1>
          <p class="muted">ניהול תלמידות, קורסים, יחידות, תוכן וציונים.</p>
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
          <span>${escapeHtml(course.title)} (${course.units?.length || 0} יחידות)</span>
        </label>
      `
    )
    .join("");
}

function renderAdminCourses() {
  return `
    <section class="grid">
      <article class="panel mint">
        <h2>הוספת קורס</h2>
        <form id="add-course" class="form-grid">
          <label>שם קורס
            <input name="title" required />
          </label>
          <label>תחום
            <input name="subject" placeholder="לדוגמה: מתמטיקה" />
          </label>
          <label>תיאור
            <textarea name="description" rows="2"></textarea>
          </label>
          <button class="primary" type="submit">הוספת קורס</button>
        </form>
      </article>
      <article class="panel">
        <h2>קורסים ויחידות</h2>
        <div class="list">
          ${state.courses.map((course) => renderCourseEditor(course)).join("") || `<div class="empty">עדיין אין קורסים.</div>`}
        </div>
      </article>
    </section>
  `;
}

function renderCourseEditor(course) {
  return `
    <div class="item course-editor">
      <div class="item-row">
        <div>
          <h3>${escapeHtml(course.title)}</h3>
          <p class="muted">${escapeHtml(course.subject || "ללא תחום")} · ${course.units?.length || 0} יחידות</p>
        </div>
        <button class="danger" data-action="delete-course" data-id="${course.id}">מחיקת קורס</button>
      </div>
      <p>${escapeHtml(course.description || "ללא תיאור")}</p>
      <details>
        <summary>הוספת יחידה חדשה</summary>
        <form data-form="add-unit" data-course-id="${course.id}" class="grid form-slab">
          <label>שם יחידה
            <input name="title" required placeholder="לדוגמה: ערך המקום בעשרוניים" />
          </label>
          <label>תיאור קצר
            <textarea name="description" rows="2"></textarea>
          </label>
          <label>קובץ הסבר Markdown
            <input name="lessonFile" placeholder="content/course/unit.md" />
          </label>
          <label>קובץ משחק JSON
            <input name="exercisesFile" placeholder="content/course/exercises.json" />
          </label>
          <label>קובץ מבחן JSON
            <input name="testsFile" placeholder="content/course/test.json" />
          </label>
          <button class="primary" type="submit">הוספת יחידה</button>
        </form>
      </details>
      <details>
        <summary>ייבוא יחידה מ-Codex או מקובץ JSON</summary>
        <form data-form="import-unit" data-course-id="${course.id}" class="grid form-slab">
          <label>קובץ יחידה JSON
            <input type="file" name="unitFile" accept="application/json,.json" />
          </label>
          <label>או הדבקת JSON של יחידה
            <textarea class="textarea-code" name="unitJson" rows="8" placeholder='{"title":"יחידה חדשה","lessonMarkdown":"# הסבר","exercises":[],"tests":[]}'></textarea>
          </label>
          <button class="secondary" type="submit">ייבוא יחידה לקורס</button>
        </form>
      </details>
      <div class="unit-list">
        ${(course.units || []).map((unit, index) => renderUnitEditor(course, unit, index)).join("") || `<div class="empty">לקורס הזה עדיין אין יחידות.</div>`}
      </div>
    </div>
  `;
}

function renderUnitEditor(course, unit, index) {
  return `
    <details class="unit-card">
      <summary>
        <span>${index + 1}. ${escapeHtml(unit.title)}</span>
        <small>${unitHasContentLabel(unit)}</small>
      </summary>
      <form data-form="update-unit" data-course-id="${course.id}" data-unit-id="${unit.id}" class="grid form-slab">
        <label>שם יחידה
          <input name="title" value="${escapeAttr(unit.title)}" required />
        </label>
        <label>תיאור
          <textarea name="description" rows="2">${escapeHtml(unit.description || "")}</textarea>
        </label>
        <label>קובץ הסבר Markdown
          <input name="lessonFile" value="${escapeAttr(unit.lessonFile || "")}" />
        </label>
        <label>העלאת/הדבקת הסבר Markdown
          <input type="file" name="lessonUpload" accept=".md,text/markdown,text/plain" />
          <textarea class="textarea-code" name="lessonMarkdown" rows="5">${escapeHtml(unit.lessonMarkdown || "")}</textarea>
        </label>
        <label>קובץ משחק JSON
          <input name="exercisesFile" value="${escapeAttr(unit.exercisesFile || "")}" />
        </label>
        <label>העלאת/הדבקת משחק JSON
          <input type="file" name="exercisesUpload" accept="application/json,.json" />
          <textarea class="textarea-code" name="exercisesJson" rows="5">${escapeHtml(unit.exercises?.length ? JSON.stringify(unit.exercises, null, 2) : "")}</textarea>
        </label>
        <label>קובץ מבחן JSON
          <input name="testsFile" value="${escapeAttr(unit.testsFile || "")}" />
        </label>
        <label>העלאת/הדבקת מבחן JSON
          <input type="file" name="testsUpload" accept="application/json,.json" />
          <textarea class="textarea-code" name="testsJson" rows="5">${escapeHtml(unit.tests?.length ? JSON.stringify(unit.tests, null, 2) : "")}</textarea>
        </label>
        <div class="row-actions">
          <button class="secondary" type="submit">שמירת יחידה</button>
          <button class="danger" type="button" data-action="delete-unit" data-course-id="${course.id}" data-unit-id="${unit.id}">מחיקת יחידה</button>
        </div>
      </form>
    </details>
  `;
}

function unitHasContentLabel(unit) {
  const parts = [];
  if (unit.lessonMarkdown || unit.lessonFile) parts.push("הסבר");
  if (unit.exercises?.length || unit.exercisesFile) parts.push("משחק");
  if (unit.tests?.length || unit.testsFile) parts.push("מבחן");
  return parts.length ? parts.join(" · ") : "ללא תוכן";
}

function renderAdminScores() {
  const rows = [];
  for (const student of state.students) {
    for (const course of state.courses.filter((item) => student.courseIds?.includes(item.id))) {
      for (const unit of course.units || []) {
        for (const kind of ["exercises", "tests"]) {
          rows.push({ student, course, unit, kind, attempt: getAttempt(student.id, course.id, unit.id, kind) });
        }
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
            <th>יחידה</th>
            <th>סוג</th>
            <th>ציון</th>
            <th>עדכון ידני</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows
              .map(
                ({ student, course, unit, kind, attempt }) => `
                  <tr>
                    <td>${escapeHtml(student.name)}</td>
                    <td>${escapeHtml(course.title)}</td>
                    <td>${escapeHtml(unit.title)}</td>
                    <td>${kind === "exercises" ? "משחק" : "מבחן"}</td>
                    <td>${attempt ? `${getCurrentScore(attempt)}/${attempt.total}` : "טרם הוגש"}</td>
                    <td>
                      ${
                        attempt
                          ? `<form data-form="override-score" data-student-id="${student.id}" data-course-id="${course.id}" data-unit-id="${unit.id}" data-kind="${kind}" class="grid">
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
              .join("") || `<tr><td colspan="6">אין נתונים להצגה.</td></tr>`
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
        <h2>פורמט יחידה ל-Codex</h2>
        <p>Codex יכול ליצור JSON של יחידה ולהדביק אותו באיזור "ייבוא יחידה".</p>
        <pre><code>${escapeHtml(JSON.stringify(sampleUnitFormat(), null, 2))}</code></pre>
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
    state.selectedUnitId = "";
    state.studentTab = "lesson";
    state.screen = "studentCourse";
    await render();
  }
  if (action === "select-course") {
    state.selectedCourseId = target.dataset.id;
    state.selectedUnitId = "";
    state.studentTab = "lesson";
    await render();
  }
  if (action === "select-unit") {
    state.selectedUnitId = target.dataset.id;
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
  if (action === "delete-unit") {
    deleteUnit(target.dataset.courseId, target.dataset.unitId);
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
  if (form.dataset.form === "add-unit") return addUnit(form, data);
  if (form.dataset.form === "update-unit") return updateUnit(form, data);
  if (form.dataset.form === "import-unit") return importUnit(form, data);
  if (form.dataset.form === "submit-questions") return submitQuestions(form);
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
  state.courses.push(
    normalizeCourse({
      id: `course-${Date.now()}`,
      title: String(data.get("title") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      description: String(data.get("description") || "").trim(),
      units: [],
    })
  );
  saveStorage(STORAGE.courses, state.courses);
  return show("success", "הקורס נוסף. עכשיו אפשר להוסיף לו יחידות.");
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

async function addUnit(form, data) {
  const course = getCourse(form.dataset.courseId);
  if (!course) return show("error", "הקורס לא נמצא.");
  course.units = course.units || [];
  course.units.push(
    normalizeUnit({
      id: slugify(String(data.get("title") || "")) || `unit-${Date.now()}`,
      title: String(data.get("title") || "").trim(),
      description: String(data.get("description") || "").trim(),
      lessonFile: String(data.get("lessonFile") || "").trim(),
      exercisesFile: String(data.get("exercisesFile") || "").trim(),
      testsFile: String(data.get("testsFile") || "").trim(),
    }, course.units.length)
  );
  saveStorage(STORAGE.courses, state.courses);
  return show("success", "היחידה נוספה לקורס.");
}

async function updateUnit(form, data) {
  const course = getCourse(form.dataset.courseId);
  const unit = getUnit(course, form.dataset.unitId);
  if (!course || !unit) return show("error", "היחידה לא נמצאה.");

  const lessonUpload = data.get("lessonUpload");
  const exercisesUpload = data.get("exercisesUpload");
  const testsUpload = data.get("testsUpload");

  unit.title = String(data.get("title") || "").trim();
  unit.description = String(data.get("description") || "").trim();
  unit.lessonFile = String(data.get("lessonFile") || "").trim();
  unit.exercisesFile = String(data.get("exercisesFile") || "").trim();
  unit.testsFile = String(data.get("testsFile") || "").trim();
  unit.lessonMarkdown = lessonUpload?.size ? await lessonUpload.text() : String(data.get("lessonMarkdown") || "").trim();
  unit.exercises = await readQuestionArray(exercisesUpload, data.get("exercisesJson"), "משחק");
  unit.tests = await readQuestionArray(testsUpload, data.get("testsJson"), "מבחן");

  saveStorage(STORAGE.courses, state.courses);
  return show("success", "היחידה נשמרה.");
}

async function importUnit(form, data) {
  const course = getCourse(form.dataset.courseId);
  if (!course) return show("error", "הקורס לא נמצא.");
  const file = data.get("unitFile");
  const pasted = String(data.get("unitJson") || "").trim();
  if ((!file || !file.size) && !pasted) return show("error", "לא נבחר קובץ ולא הודבק JSON.");

  try {
    const payload = JSON.parse(file && file.size ? await file.text() : pasted);
    const unit = normalizeImportedUnit(payload);
    const existingIndex = (course.units || []).findIndex((item) => item.id === unit.id);
    course.units = course.units || [];
    if (existingIndex >= 0) {
      course.units[existingIndex] = unit;
    } else {
      course.units.push(unit);
    }
    saveStorage(STORAGE.courses, state.courses);
    return show("success", `היחידה "${unit.title}" יובאה לקורס.`);
  } catch (error) {
    return show("error", `JSON היחידה אינו תקין: ${error.message}`);
  }
}

function normalizeImportedUnit(payload) {
  const raw = payload.unit || payload;
  const unit = normalizeUnit(
    {
      id: raw.id || slugify(raw.title || "") || `unit-${Date.now()}`,
      title: raw.title,
      description: raw.description,
      lessonFile: raw.lessonFile,
      lessonMarkdown: raw.lessonMarkdown || raw.markdown || raw.explanationMarkdown,
      exercisesFile: raw.exercisesFile,
      exercises: raw.exercises || [],
      testsFile: raw.testsFile,
      tests: raw.tests || [],
    },
    0
  );
  if (!unit.title) throw new Error("חסר שם יחידה");
  validateQuestions(unit.exercises, "משחק");
  validateQuestions(unit.tests, "מבחן");
  return unit;
}

async function readQuestionArray(file, textValue, label) {
  const text = file?.size ? await file.text() : String(textValue || "").trim();
  if (!text) return [];
  const questions = JSON.parse(text);
  validateQuestions(questions, label);
  return questions;
}

function validateQuestions(questions, label) {
  if (!Array.isArray(questions)) throw new Error(`${label} חייב להיות מערך שאלות`);
  for (const question of questions) {
    if (!question.id || !question.type || !question.prompt || question.correctAnswer === undefined) {
      throw new Error(`שאלה ב${label} חסרה שדות חובה`);
    }
  }
}

function deleteUnit(courseId, unitId) {
  const course = getCourse(courseId);
  const unit = getUnit(course, unitId);
  if (!course || !unit || !confirm(`למחוק את היחידה ${unit.title}?`)) return;
  course.units = (course.units || []).filter((item) => item.id !== unitId);
  for (const studentAttempts of Object.values(state.progress.attempts || {})) {
    const courseAttempts = studentAttempts[courseId];
    if (courseAttempts?.units) delete courseAttempts.units[unitId];
  }
  saveStorage(STORAGE.courses, state.courses);
  saveStorage(STORAGE.progress, state.progress);
  state.message = { type: "success", text: "היחידה נמחקה." };
}

async function submitQuestions(form) {
  const student = getSelectedStudent();
  const course = getCourse(form.dataset.courseId);
  const unit = getUnit(course, form.dataset.unitId);
  if (!student || !course || !unit) return;

  const kind = form.dataset.kind;
  const questions = await loadQuestions(unit, kind);
  const data = new FormData(form);
  const answers = {};
  let score = 0;
  let total = 0;
  let correctCount = 0;

  for (const question of questions) {
    const answer = String(data.get(question.id) || "").trim();
    answers[question.id] = answer;
    const points = Number(question.points) || 0;
    total += points;
    if (isCorrect(answer, question.correctAnswer)) {
      score += points;
      correctCount += 1;
    }
  }

  setAttempt(student.id, course.id, unit.id, kind, {
    answers,
    score,
    total,
    submittedAt: new Date().toISOString(),
  });
  saveStorage(STORAGE.progress, state.progress);
  if (kind === "exercises") {
    const fullCode = questions.map((question, index) => getGameReward(question, index)).join("");
    const message =
      correctCount === questions.length
        ? `כל הכבוד! פתחת את כל הקוד: ${fullCode}`
        : `המשחק נשמר. פתחת ${correctCount}/${questions.length} חלקי קוד.`;
    return show("success", message);
  }
  return show("success", `ההגשה נשמרה. הציון: ${score}/${total}`);
}

async function overrideScore(form, data) {
  const attempt = getAttempt(form.dataset.studentId, form.dataset.courseId, form.dataset.unitId, form.dataset.kind);
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
    version: 2,
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
    state.courses = backup.courses.map(normalizeCourse);
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

function getSelectedUnit(course) {
  if (!course?.units?.length) return null;
  const unit = course.units.find((item) => item.id === state.selectedUnitId) || course.units[0];
  state.selectedUnitId = unit.id;
  return unit;
}

function getCourse(courseId) {
  return state.courses.find((course) => course.id === courseId);
}

function getUnit(course, unitId) {
  return course?.units?.find((unit) => unit.id === unitId);
}

function getAttempt(studentId, courseId, unitId, kind) {
  const courseAttempts = state.progress.attempts?.[studentId]?.[courseId];
  return courseAttempts?.units?.[unitId]?.[kind] || courseAttempts?.[kind] || null;
}

function setAttempt(studentId, courseId, unitId, kind, attempt) {
  state.progress.attempts = state.progress.attempts || {};
  state.progress.attempts[studentId] = state.progress.attempts[studentId] || {};
  state.progress.attempts[studentId][courseId] = state.progress.attempts[studentId][courseId] || {};
  state.progress.attempts[studentId][courseId].units = state.progress.attempts[studentId][courseId].units || {};
  state.progress.attempts[studentId][courseId].units[unitId] = state.progress.attempts[studentId][courseId].units[unitId] || {};
  state.progress.attempts[studentId][courseId].units[unitId][kind] = attempt;
}

function getCurrentScore(attempt) {
  return attempt.override ? attempt.override.score : attempt.score;
}

function countCorrectAnswers(questions, answers = {}) {
  return questions.filter((question) => isCorrect(answers[question.id], question.correctAnswer)).length;
}

function getGameReward(question, index) {
  return question.gameReward || question.reward || String(index + 1);
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

function sampleUnitFormat() {
  return {
    id: "decimal-place-value",
    title: "ערך המקום בעשרוניים",
    description: "יחידה קצרה עם הסבר, משחק ומבחן.",
    lessonMarkdown: "# כותרת ההסבר\n\nטקסט ההסבר בעברית.",
    exercises: [sampleQuestionFormat()[0]],
    tests: [sampleQuestionFormat()[0]],
  };
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

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
