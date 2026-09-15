"use strict";

const FORMS = ["UNF", "1NF", "2NF", "3NF", "BCNF", "4NF", "5NF"];
const DEFAULT_SEED = 240519;
let currentStep = 0;
let seed = DEFAULT_SEED;
let model;

const journey = document.querySelector("#journey");
const progress = document.querySelector("#progress");
const seedInput = document.querySelector("#seedInput");
const nextButton = document.querySelector("#nextButton");
const backButton = document.querySelector("#backButton");
const resetButton = document.querySelector("#resetButton");
const statusAnnouncer = document.querySelector("#statusAnnouncer");

function mulberry32(value) {
  return function random() {
    let t = value += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hashSeed(value) {
  const string = String(value);
  let hash = 2166136261;
  for (let i = 0; i < string.length; i += 1) {
    hash ^= string.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createModel(seedValue) {
  const random = mulberry32(hashSeed(seedValue));
  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  };
  const firstNames = shuffle(["Mira", "Theo", "Anika", "Jonah", "Leila", "Ravi", "Nora", "Caleb", "Inez", "Arun"]);
  const lastNames = shuffle(["Shah", "Park", "Meyer", "Okafor", "Costa", "Patel", "Reed", "Lin", "Bose", "Diaz"]);
  const departments = [["D1","Computer Science"],["D2","Mathematics"],["D3","Design"]];
  const students = firstNames.slice(0, 4).map((first, index) => ({ id: `S${101 + index}`, name: `${first} ${lastNames[index]}`, dept: ["D1","D1","D2","D3"][index] }));
  const courseNames = shuffle(["Databases", "Calculus", "Interaction Design"]);
  const courses = courseNames.map((name, index) => [`C${110 + index * 15}`, name]);
  const tutors = firstNames.slice(4,8).map((first,index) => [`T${index + 1}`, `${first} ${lastNames[index + 4]}`, courses[[0,1,2,0][index]][0]]);
  const enrollmentSpec = [[0,0,"A",0],[0,1,"B+",1],[1,0,"B",0],[1,2,"A-",2],[2,1,"A",1],[2,2,"B+",2],[3,0,"A-",3],[3,2,"A",2]];
  const campusRows = enrollmentSpec.map(([s,c,grade,t]) => {
    const dept = departments.find(([id]) => id === students[s].dept);
    return [students[s].id, students[s].name, dept[0], dept[1], courses[c][0], courses[c][1], grade, tutors[t][0]];
  });
  const hobbies = shuffle(["Cycling", "Painting", "Gaming", "Cooking"]);
  const languages = shuffle(["English", "Hindi", "Spanish", "German"]);
  const studentHobbies = [[0,0],[0,1],[1,0],[1,3],[2,1],[3,2]].map(([s,h]) => [students[s].id,hobbies[h]]);
  const studentLanguages = [[0,0],[0,1],[1,0],[1,2],[2,1],[3,3]].map(([s,l]) => [students[s].id,languages[l]]);
  const hobbyLanguage = studentHobbies.flatMap(([id,hobby]) => studentLanguages.filter(([student]) => student === id).map(([,language]) => [id,hobby,language]));
  const clubs = shuffle(["Robotics", "Drama", "Debate"]);
  const events = shuffle(["Hack Day", "Showcase", "Open Day"]);
  const studentClub = [[0,0],[0,1],[1,0],[1,2],[2,1],[3,2]].map(([s,c]) => [students[s].id,clubs[c]]);
  const studentEvent = [[0,0],[0,1],[1,0],[1,2],[2,0],[3,2]].map(([s,e]) => [students[s].id,events[e]]);
  const clubEvent = [[0,0],[0,1],[0,2],[1,0],[2,0],[2,2]].map(([c,e]) => [clubs[c],events[e]]);
  const participation = studentClub.flatMap(([student,club]) => studentEvent.filter(([id]) => id === student).flatMap(([,event]) => clubEvent.some(([c,e]) => c === club && e === event) ? [[student,club,event]] : []));
  const unfRows = students.map((student) => {
    const dept = departments.find(([id]) => id === student.dept);
    const interests = studentHobbies.filter(([id]) => id === student.id).map(([,h]) => h).join(", ");
    const spoken = studentLanguages.filter(([id]) => id === student.id).map(([,l]) => l).join(", ");
    const activities = participation.filter(([id]) => id === student.id).map(([,club,event]) => `${club} @ ${event}`).join("; ");
    const coursesWithTutors = campusRows.filter(([id]) => id === student.id).map((row) => {
      const tutor = tutors.find(([id]) => id === row[7]);
      return `${row[4]} ${row[5]} — ${row[6]} — ${tutor[0]} ${tutor[1]}`;
    }).join("; ");
    return [student.id, student.name, `${dept[0]} ${dept[1]}`, coursesWithTutors, interests, spoken, activities];
  });
  return { departments, students, courses, tutors, campusRows, hobbies, languages, studentHobbies, studentLanguages, hobbyLanguage, clubs, events, studentClub, studentEvent, clubEvent, participation, unfRows };
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[char]));
}

function table(title, columns, rows, options = {}) {
  const bad = options.bad || [];
  const fixed = options.fixed || [];
  const key = options.key || [];
  const header = columns.map((column, index) => {
    const label = key.includes(index) && !column.includes("(PK)") ? `${column} (PK)` : column;
    return `<th class="${bad.includes(index) ? "offending" : ""} ${fixed.includes(index) ? "fixed" : ""} ${key.includes(index) ? "key" : ""}">${esc(label)}</th>`;
  }).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td class="${bad.includes(index) ? "offending" : ""} ${fixed.includes(index) ? "fixed" : ""} ${key.includes(index) ? "key" : ""}">${esc(cell)}</td>`).join("")}</tr>`).join("");
  const statusClass = options.status ? String(options.status).toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  const status = options.status ? `<b class="table-status ${statusClass}">${esc(options.status)}</b> · ` : "";
  return `<article class="table-card ${options.wide ? "wide" : ""} ${statusClass ? `status-${statusClass}` : ""}" data-table="${esc(title)}"><div class="table-title"><h3>${esc(title)}</h3><span>${status}${rows.length} rows</span></div><div class="table-scroll"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div></article>`;
}

function dependency(value) {
  return `<div class="dependency"><strong>Dependency</strong><code>${esc(value)}</code></div>`;
}

function renderMoveCue(moves) {
  return `<div class="transform-cue" aria-label="Attribute movement">${moves.map(({ from, to }) => `<div class="move-item"><code>${esc(from)}</code><span aria-hidden="true">→</span><strong>${esc(to)}</strong></div>`).join("")}</div>`;
}

function lesson(before, wrong, dependencyText, fix, after = "", moves = []) {
  return `<section class="lesson-step"><span class="phase-kicker">1 · Start with the table</span>${before}</section>
    <section class="lesson-step"><span class="phase-kicker problem">2 · What is wrong</span><div class="note bad"><p>${wrong}</p></div>${dependency(dependencyText)}</section>
    <section class="lesson-step"><span class="phase-kicker solution">3 · What to change</span><div class="note good"><p>${fix}</p></div>${renderMoveCue(moves)}${after}</section>`;
}

function stage(index, title, rule, content) {
  return `<article class="stage" id="stage-${index}" data-step="${index}"><header class="stage-head"><span class="stage-number">0${index + 1}</span><h2>${title}<span class="stage-rule">${rule}</span></h2></header>${content}</article>`;
}

function databaseStates(m) {
  const studentProfile = m.students.map((student) => {
    const dept = m.departments.find(([id]) => id === student.dept);
    return [student.id,student.name,dept[0],dept[1]];
  });
  const studentRows = m.students.map((student) => [student.id,student.name,student.dept]);
  const enrollment = m.campusRows.map((row) => [row[0],row[4],row[6],row[7]]);
  const tutorCourse = m.tutors.map((tutor) => [tutor[0],tutor[2]]);
  const studentTutorGrade = m.campusRows.map((row) => [row[0],row[7],row[6]]);
  const workbook = { title:"Campus_Workbook", columns:["StudentID","StudentName","Department","Courses + grade + tutor","Hobbies","Languages","Club events"], rows:m.unfRows, key:[], fixed:[], wide:true };
  const campus = { title:"Campus_Record_1NF", columns:["StudentID","StudentName","DeptID","DeptName","CourseID","CourseName","Grade","TutorID"], rows:m.campusRows, key:[0,4], fixed:[0,4], wide:true };
  const interests = { title:"Student_Hobby_Language", columns:["StudentID","Hobby","Language"], rows:m.hobbyLanguage, key:[0,1,2], fixed:[0,1,2], wide:true };
  const participation = { title:"Student_Club_Event", columns:["StudentID","Club","Event"], rows:m.participation, key:[0,1,2], fixed:[0,1,2], wide:true };
  const profile = { title:"Student_Profile_2NF", columns:["StudentID","StudentName","DeptID","DeptName"], rows:studentProfile, key:[0], fixed:[0,1,2,3] };
  const course = { title:"Course", columns:["CourseID","CourseName"], rows:m.courses, key:[0], fixed:[0,1] };
  const enrollmentTable = { title:"Enrollment_2NF", columns:["StudentID","CourseID","Grade","TutorID"], rows:enrollment, key:[0,1], fixed:[0,1,2,3], wide:true };
  const student = { title:"Student", columns:["StudentID","StudentName","DeptID"], rows:studentRows, key:[0], fixed:[0,1,2] };
  const department = { title:"Department", columns:["DeptID","DeptName"], rows:m.departments, key:[0], fixed:[0,1] };
  const tutor = { title:"Tutor_Course", columns:["TutorID","CourseID"], rows:tutorCourse, key:[0], fixed:[0,1] };
  const tutoring = { title:"Student_Tutor_Grade", columns:["StudentID","TutorID","Grade"], rows:studentTutorGrade, key:[0,1], fixed:[0,1,2] };
  const hobby = { title:"Student_Hobby", columns:["StudentID","Hobby"], rows:m.studentHobbies, key:[0,1], fixed:[0,1] };
  const language = { title:"Student_Language", columns:["StudentID","Language"], rows:m.studentLanguages, key:[0,1], fixed:[0,1] };
  const studentClub = { title:"Student_Club", columns:["StudentID","Club"], rows:m.studentClub, key:[0,1], fixed:[0,1] };
  const studentEvent = { title:"Student_Event", columns:["StudentID","Event"], rows:m.studentEvent, key:[0,1], fixed:[0,1] };
  const clubEvent = { title:"Club_Event", columns:["Club","Event"], rows:m.clubEvent, key:[0,1], fixed:[0,1] };
  return [
    [workbook],
    [campus,interests,participation],
    [profile,course,enrollmentTable,interests,participation],
    [student,department,course,enrollmentTable,interests,participation],
    [student,department,course,tutor,tutoring,interests,participation],
    [student,department,course,tutor,tutoring,hobby,language,participation],
    [student,department,course,tutor,tutoring,hobby,language,studentClub,studentEvent,clubEvent]
  ];
}

function renderSnapshot(state, label, options = {}) {
  const changed = options.changed || [];
  const badByTable = options.badByTable || {};
  const mode = options.mode || "input";
  const cards = state.map((spec) => table(spec.title, spec.columns, spec.rows, {
    key: spec.key,
    wide: spec.wide,
    bad: badByTable[spec.title] || [],
    fixed: changed.includes(spec.title) ? spec.fixed : [],
    status: mode === "input" ? "input" : changed.includes(spec.title) ? "updated" : "carried forward"
  })).join("");
  return `<div class="snapshot" data-snapshot="${esc(mode)}"><div class="snapshot-head"><h3>${esc(label)}</h3><span>${state.length} ${state.length === 1 ? "table" : "tables"}</span></div><div class="tables-grid">${cards}</div></div>`;
}

function renderStage(index) {
  const m = model;
  const states = databaseStates(m);
  if (index === 0) {
    const current = renderSnapshot(states[0], "Starting database", { mode:"input", badByTable:{ Campus_Workbook:[3,4,5,6] } });
    return stage(index, "UNF", "The Campus Connect starting spreadsheet", `<section class="lesson-step"><span class="phase-kicker problem">Current state</span>${current}<div class="compact-callout problem"><strong>Why unnormalized?</strong> Courses with tutors, hobbies, languages, and club events are repeating groups. Department and tutor facts are already present—they are only packed into messy cells.</div>${dependency("StudentID → {Courses with tutors, Hobbies, Languages, Club events}")}<div class="handoff-note">This exact database is the input to 1NF.</div></section>`);
  }
  const transforms = [
    null,
    { bad:{ Campus_Workbook:[3,4,5,6] }, changed:["Campus_Record_1NF","Student_Hobby_Language","Student_Club_Event"], wrong:"Repeating groups place several values in one cell, so individual facts cannot be keyed or constrained.", dependency:"StudentID → {Courses with tutors, Hobbies, Languages, Club events}", fix:"Expand every list into atomic relations. Department and tutor values are unpacked from facts already visible in UNF.", moves:[{from:"Courses + grade + tutor",to:"Campus_Record_1NF"},{from:"Hobbies + Languages",to:"Student_Hobby_Language"},{from:"Club events",to:"Student_Club_Event"}] },
    { bad:{ Campus_Record_1NF:[1,2,3,5] }, changed:["Student_Profile_2NF","Course","Enrollment_2NF"], wrong:"Student details depend only on StudentID. CourseName depends only on CourseID. Both repeat inside a relation whose primary key has two columns.", dependency:"StudentID → StudentName, DeptID · CourseID → CourseName", fix:"Move student facts to Student_Profile_2NF and course facts to Course. Carry the two activity relations forward untouched.", moves:[{from:"StudentName, DeptID, DeptName",to:"Student_Profile_2NF"},{from:"CourseName",to:"Course"},{from:"Grade, TutorID",to:"Enrollment_2NF"}] },
    { bad:{ Student_Profile_2NF:[3] }, changed:["Student","Department"], wrong:"DeptName depends on DeptID, not directly on StudentID. It repeats for every student in the same department.", dependency:"StudentID → DeptID → DeptName", fix:"Replace Student_Profile_2NF with Student and Department. Every other table is carried forward untouched.", moves:[{from:"StudentName, DeptID",to:"Student"},{from:"DeptName",to:"Department"}] },
    { bad:{ Enrollment_2NF:[1,3] }, changed:["Tutor_Course","Student_Tutor_Grade"], wrong:"TutorID determines CourseID, but TutorID is not a superkey of Enrollment_2NF because one tutor helps several students.", dependency:"TutorID → CourseID (TutorID is not a superkey)", fix:"Replace Enrollment_2NF with Tutor_Course and Student_Tutor_Grade. All other tables remain untouched.", moves:[{from:"TutorID, CourseID",to:"Tutor_Course"},{from:"StudentID, TutorID, Grade",to:"Student_Tutor_Grade"}], extra:"BCNF trade-off: (StudentID, CourseID) → TutorID is no longer enforceable inside a single table after this split." },
    { bad:{ Student_Hobby_Language:[1,2] }, changed:["Student_Hobby","Student_Language"], wrong:"A student’s hobbies do not depend on the languages they speak. Combining both sets creates every possible pairing.", dependency:"StudentID ↠ Hobby · StudentID ↠ Language", fix:"Replace Student_Hobby_Language with Student_Hobby and Student_Language. Carry every other table forward untouched.", moves:[{from:"Hobby",to:"Student_Hobby"},{from:"Language",to:"Student_Language"}] },
    { bad:{ Student_Club_Event:[0,1,2] }, changed:["Student_Club","Student_Event","Club_Event"], wrong:"Any two pairwise facts are insufficient: joining only Student_Club and Student_Event invents a club–event participation that never happened.", dependency:"⋈ {Student_Club, Student_Event, Club_Event} = Student_Club_Event", fix:"Keep all three projections. Only their three-way natural join removes the spurious pairing and recreates the original relation exactly.", moves:[{from:"StudentID + Club",to:"Student_Club"},{from:"StudentID + Event",to:"Student_Event"},{from:"Club + Event",to:"Club_Event"}] }
  ];
  const config = transforms[index];
  const input = renderSnapshot(states[index - 1], `Input from ${FORMS[index - 1]}`, { mode:"input", badByTable:config.bad });
  const outcome = renderSnapshot(states[index], `${FORMS[index]} outcome — complete database`, { mode:"outcome", changed:config.changed });
  const rules = ["", "One value per cell; one fact per row", "Remove dependencies on part of a composite key", "Remove dependencies between non-key columns", "Every determinant must be a candidate key", "Separate independent multivalued facts", "Separate facts implied by three smaller pairings"];
  const conclusion = `<section class="conclusion" aria-label="Conclusion"><article class="conclusion-card pro"><h3>What full normalization buys</h3><ul><li>Far less duplicate data</li><li>Fewer update, insert, and delete anomalies</li><li>Clearer integrity constraints</li></ul></article><article class="conclusion-card con"><h3>What it costs</h3><ul><li>More tables to understand</li><li>More joins and query complexity</li><li>Possible read-performance overhead</li></ul></article><aside class="denormalize"><h3>When to step back</h3><p>5NF is valuable when genuine join dependencies exist; for most systems, 3NF or BCNF is the pragmatic finish line. Denormalize deliberately for measured, read-heavy bottlenecks—keep a canonical normalized source and make duplicated values explicit and testable.</p></aside></section>`;
  const tradeoff = config.extra ? `<aside class="tradeoff-note">${esc(config.extra)}</aside>` : "";
  const handoff = `<div class="handoff-note">This complete outcome is the exact input to ${index === 6 ? "the finished schema" : FORMS[index + 1]}.</div>`;
  const ending = index === 6 ? `<header class="stage-head conclusion-head"><span class="stage-number">08</span><h2>Conclusion<span class="stage-rule">Normalize for integrity; denormalize with evidence.</span></h2></header>${conclusion}` : "";
  return stage(index, FORMS[index], rules[index], `${lesson(input, config.wrong, config.dependency, config.fix, outcome, config.moves)}${tradeoff}${handoff}${ending}`);
}

function buildProgress() {
  progress.innerHTML = FORMS.map((form, index) => `<li><button class="progress-button" type="button" data-step="${index}" disabled aria-label="Jump to ${form}">${form}</button></li>`).join("");
  progress.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-step]");
    if (!button || button.disabled) return;
    const target = Number(button.dataset.step);
    currentStep = target;
    updateControls();
    document.querySelector(`#stage-${target}`).scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function renderThrough(step, scroll = false) {
  const existing = journey.children.length;
  for (let index = existing; index <= step; index += 1) journey.insertAdjacentHTML("beforeend", renderStage(index));
  currentStep = step;
  updateControls();
  if (scroll) statusAnnouncer.textContent = `${FORMS[step]} revealed`;
  if (scroll) document.querySelector(`#stage-${step}`).scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateControls() {
  document.querySelectorAll(".progress-button").forEach((button, index) => {
    const revealed = index < journey.children.length;
    button.disabled = !revealed;
    button.classList.toggle("revealed", revealed);
    button.classList.toggle("current", index === currentStep);
    if (index === currentStep) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current");
  });
  backButton.disabled = currentStep === 0;
  nextButton.disabled = currentStep === FORMS.length - 1;
  nextButton.innerHTML = currentStep === FORMS.length - 2 ? "Reveal conclusion <span aria-hidden=\"true\">▸</span>" : "Next step <span aria-hidden=\"true\">▸</span>";
}

function regenerate(nextSeed) {
  const activeStep = currentStep;
  const revealedThrough = Math.max(0, journey.children.length - 1);
  seed = nextSeed;
  seedInput.value = seed;
  model = createModel(seed);
  journey.innerHTML = "";
  for (let index = 0; index <= revealedThrough; index += 1) journey.insertAdjacentHTML("beforeend", renderStage(index));
  currentStep = Math.min(activeStep, revealedThrough);
  updateControls();
  statusAnnouncer.textContent = `Sample data regenerated with seed ${seed}`;
}

nextButton.addEventListener("click", () => { if (currentStep < FORMS.length - 1) renderThrough(currentStep + 1, true); });
backButton.addEventListener("click", () => {
  if (currentStep === 0) return;
  currentStep -= 1;
  updateControls();
  document.querySelector(`#stage-${currentStep}`).scrollIntoView({ behavior: "smooth", block: "start" });
});
resetButton.addEventListener("click", () => { regenerate(seed); document.querySelector("#stage-0").scrollIntoView({ behavior: "smooth" }); });
document.querySelector("#newSeed").addEventListener("click", () => regenerate(Math.floor(Date.now() % 1000000)));
seedInput.addEventListener("change", () => regenerate(seedInput.value.trim() || DEFAULT_SEED));
seedInput.addEventListener("keydown", (event) => { if (event.key === "Enter") { event.preventDefault(); regenerate(seedInput.value.trim() || DEFAULT_SEED); } });

buildProgress();
regenerate(DEFAULT_SEED);
