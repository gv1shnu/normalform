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

const GLOSSARY = {
  fact: { term: "Fact", body: `A single true statement about one thing &mdash; for example, &ldquo;student S101 is named Nora Diaz.&rdquo; The 1NF rule <b>one value per cell, one fact per row</b> means never packing several facts into the same cell or row.` },
  dependency: { term: "Dependency", body: `A rule that one value decides another, written <b>X &rarr; Y</b> (&ldquo;X determines Y&rdquo;) &mdash; for example <code>StudentID &rarr; StudentName</code>. Two looser forms appear later: <b>&#8608;</b> a multivalued dependency (one value maps to a whole set), and <b>&#8904;</b> a join dependency (the data only survives when the split tables are joined back together).` }
};

function termTag(key, extraClass = "") {
  const g = GLOSSARY[key];
  return `<button type="button" class="term ${extraClass}" aria-expanded="false"><span class="term-label">${esc(g.term)}</span><span class="term-badge" aria-hidden="true">i</span><span class="term-pop" role="tooltip"><b class="term-pop-title">${esc(g.term)}</b>${g.body}</span></button>`;
}

// A column is a foreign key only when the entity table it references is actually
// present in the same snapshot. The value tables (Hobby, Language, Club, Event)
// never own a table, so those key columns are always plain composite-key columns.
const FK_OWNERS = { StudentID: ["Student", "Student_Profile_2NF"], DeptID: ["Department"], CourseID: ["Course"], TutorID: ["Tutor_Course"] };

function foreignKeys(spec, state) {
  const present = new Set(state.map((table) => table.title));
  const fks = {};
  spec.columns.forEach((column, index) => {
    const owners = FK_OWNERS[column];
    if (!owners) return;
    const target = owners.find((title) => title !== spec.title && present.has(title));
    if (target) fks[index] = target;
  });
  return fks;
}

function table(title, columns, rows, options = {}) {
  const bad = options.bad || [];
  const fixed = options.fixed || [];
  const key = options.key || [];
  const fk = options.fk || {};
  const cellClass = (index) => `${bad.includes(index) ? "offending" : ""} ${fixed.includes(index) ? "fixed" : ""} ${key.includes(index) ? "key" : ""} ${fk[index] ? "fk" : ""}`;
  const header = columns.map((column, index) => {
    const roles = `${key.includes(index) ? `<span class="col-role pk">PK</span>` : ""}${fk[index] ? `<span class="col-role fkref">FK → ${esc(fk[index])}</span>` : ""}`;
    return `<th class="${cellClass(index)}"><span class="col-name">${esc(column)}</span>${roles ? `<span class="col-roles">${roles}</span>` : ""}</th>`;
  }).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td class="${cellClass(index)}">${esc(cell)}</td>`).join("")}</tr>`).join("");
  const statusClass = options.status ? String(options.status).toLowerCase().replace(/[^a-z0-9]+/g, "-") : "";
  const status = options.status ? `<b class="table-status ${statusClass}">${esc(options.status)}</b> · ` : "";
  const meta = `${status}${rows.length} rows`;
  const classes = `table-card ${options.wide ? "wide" : ""} ${statusClass ? `status-${statusClass}` : ""}`;
  const grid = `<div class="table-scroll"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
  if (options.collapsible) {
    return `<details class="${classes} collapsible" data-table="${esc(title)}"><summary class="table-title"><h3>${esc(title)}</h3><span class="table-meta">${meta}</span><span class="expand-toggle" aria-hidden="true"><span class="expand-caret"></span></span></summary>${grid}</details>`;
  }
  return `<article class="${classes}" data-table="${esc(title)}"><div class="table-title"><h3>${esc(title)}</h3><span>${meta}</span></div>${grid}</article>`;
}

function dependency(value) {
  return `<div class="dependency">${termTag("dependency", "term-mini")}<code>${esc(value)}</code></div>`;
}

function renderMoveCue(moves) {
  return `<div class="transform-cue" aria-label="Attribute movement">${moves.map(({ from, to }) => `<div class="move-item"><code>${esc(from)}</code><span aria-hidden="true">→</span><strong>${esc(to)}</strong></div>`).join("")}</div>`;
}

function renderSplit(inputState, outcomeState, index, config) {
  const before = renderSnapshot(inputState, "Before", { mode:"input", badByTable:config.bad, stacked:true, sub:`Coming from ${FORMS[index - 1]}` });
  const after = renderSnapshot(outcomeState, "After", { mode:"outcome", changed:config.changed, stacked:true, sub:`${FORMS[index]} applied` });
  return `<div class="split-view">
    <section class="split-side before" aria-label="Before this step">${before}</section>
    <section class="split-side after" aria-label="After this step">${after}</section>
  </div>`;
}

function explain(config) {
  return `<div class="explain">
    <section class="explain-block problem"><span class="phase-kicker problem">The problem</span><div class="note bad"><p>${config.wrong}</p></div>${dependency(config.dependency)}</section>
    <section class="explain-block solution"><span class="phase-kicker solution">The fix</span><div class="note good"><p>${config.fix}</p></div>${renderMoveCue(config.moves)}</section>
  </div>`;
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
  const cards = state.map((spec) => {
    const focus = mode === "input" ? Boolean(badByTable[spec.title]) : changed.includes(spec.title);
    return table(spec.title, spec.columns, spec.rows, {
      key: spec.key,
      wide: spec.wide,
      bad: badByTable[spec.title] || [],
      fixed: changed.includes(spec.title) ? spec.fixed : [],
      status: mode === "input" ? (focus ? "input" : "carried forward") : (focus ? "updated" : "carried forward"),
      collapsible: !focus,
      fk: foreignKeys(spec, state)
    });
  }).join("");
  const gridClass = options.stacked ? "tables-grid stacked" : "tables-grid";
  const sub = options.sub ? `<span class="snapshot-sub">${esc(options.sub)}</span>` : "";
  return `<div class="snapshot" data-snapshot="${esc(mode)}"><div class="snapshot-head"><h3>${esc(label)}</h3>${sub}<span>${state.length} ${state.length === 1 ? "table" : "tables"}</span></div><div class="${gridClass}">${cards}</div></div>`;
}

function renderForwardHint() {
  return `<aside class="contrast-hint">Coming up: <code>Student_Club_Event</code> at 5NF looks exactly like this table — three columns, all part of the key — but it <b>cannot</b> be split into two, because a third relationship links its columns. That gap is the whole reason 5NF exists.</aside>`;
}

function renderContrastNote(m) {
  const twoWay = m.studentClub.flatMap(([student, club]) => m.studentEvent.filter(([id]) => id === student).map(([, event]) => [student, club, event]));
  const real = new Set(m.participation.map((row) => JSON.stringify(row)));
  const phantom = twoWay.find((row) => !real.has(JSON.stringify(row)));
  const example = phantom ? `<p class="contrast-example"><b>See it in the data:</b> joining only <code>Student_Club</code> and <code>Student_Event</code> would invent <b>${esc(phantom[0])} · ${esc(phantom[1])} · ${esc(phantom[2])}</b> — but that row never happened, because <b>${esc(phantom[1])}</b> does not attend <b>${esc(phantom[2])}</b> (that pair is not in <code>Club_Event</code>). The third table filters it out.</p>` : "";
  return `<aside class="contrast-note" aria-label="Why 5NF differs from 4NF"><h3>Why isn&rsquo;t this the same as the 4NF table?</h3><p><code>Student_Club_Event</code> looks identical to <code>Student_Hobby_Language</code> from 4NF — same three columns, all part of the key. The difference is the data inside.</p><div class="contrast-grid"><div><span class="contrast-tag good">4NF · independent columns</span><p>Hobbies and languages are unrelated, so that table held <b>every</b> hobby-language pairing. Two tables rebuild it: <code>Student_Hobby ⋈ Student_Language</code>.</p></div><div><span class="contrast-tag warn">5NF · linked columns</span><p>A third fact &mdash; <code>Club_Event</code>, which clubs attend which events &mdash; limits the combinations, so this is <b>not</b> every pairing. Only the three-way join rebuilds it.</p></div></div>${example}</aside>`;
}

function renderStage(index) {
  const m = model;
  const states = databaseStates(m);
  if (index === 0) {
    const current = renderSnapshot(states[0], "Starting point", { mode:"input", badByTable:{ Campus_Workbook:[3,4,5,6] }, stacked:true, sub:"One big spreadsheet" });
    return stage(index, "UNF", "Where we start: one messy spreadsheet", `<div class="explain single"><section class="explain-block problem"><span class="phase-kicker problem">Why it's messy</span><div class="note bad"><p>Some columns cram a whole list into a single cell — courses, hobbies, languages, and club events. Nothing is missing; it's just packed together, so you can't work with one fact on its own.</p></div>${dependency("One StudentID → many courses, hobbies, languages, and events")}</section></div><div class="split-view single"><section class="split-side before" aria-label="Starting database">${current}</section></div><div class="handoff-note">This spreadsheet is the input for 1NF.</div>`);
  }
  const transforms = [
    null,
    { bad:{ Campus_Workbook:[3,4,5,6] }, changed:["Campus_Record_1NF","Student_Hobby_Language","Student_Club_Event"], wrong:"Some cells hold a whole list of values. When many facts share one cell, you can't reliably find, update, or check any single one of them.", dependency:"One StudentID → many courses, hobbies, languages, and events", fix:"Give every value its own row and cell, so each row states one plain fact. The messy lists become separate tables.", moves:[{from:"Courses + grade + tutor",to:"Campus_Record_1NF"},{from:"Hobbies + Languages",to:"Student_Hobby_Language"},{from:"Club events",to:"Student_Club_Event"}] },
    { bad:{ Campus_Record_1NF:[1,2,3,5] }, changed:["Student_Profile_2NF","Course","Enrollment_2NF"], wrong:"The key here is StudentID and CourseID together. But a student's name depends on StudentID alone, and a course's name on CourseID alone — so those details repeat on every row.", dependency:"StudentID → StudentName, DeptID · CourseID → CourseName", fix:"Split off the parts that depend on only half the key: student details into one table, course details into another.", moves:[{from:"StudentName, DeptID, DeptName",to:"Student_Profile_2NF"},{from:"CourseName",to:"Course"},{from:"Grade, TutorID",to:"Enrollment_2NF"}] },
    { bad:{ Student_Profile_2NF:[3] }, changed:["Student","Department"], wrong:"A department's name really belongs to the department, not the student. So it gets repeated for every student in the same department.", dependency:"StudentID → DeptID → DeptName", fix:"Give departments their own table, and point each student at it by ID.", moves:[{from:"StudentName, DeptID",to:"Student"},{from:"DeptName",to:"Department"}] },
    { bad:{ Enrollment_2NF:[1,3] }, changed:["Tutor_Course","Student_Tutor_Grade"], wrong:"Each tutor teaches one course, so the tutor decides the course. But the tutor isn't this table's key, so the course repeats for every student that tutor helps.", dependency:"TutorID → CourseID, but TutorID isn't the key", fix:"Store each tutor's course once in its own table, and keep only student, tutor, and grade together.", moves:[{from:"TutorID, CourseID",to:"Tutor_Course"},{from:"StudentID, TutorID, Grade",to:"Student_Tutor_Grade"}], extra:"Trade-off: after this split, no single table can enforce that a student takes each course with just one tutor." },
    { bad:{ Student_Hobby_Language:[1,2] }, changed:["Student_Hobby","Student_Language"], wrong:"Hobbies and languages have nothing to do with each other. Keeping them in one table pairs every hobby with every language — rows that don't mean anything.", dependency:"StudentID ↠ Hobby · StudentID ↠ Language", fix:"Give hobbies and languages their own separate tables, one fact each.", moves:[{from:"Hobby",to:"Student_Hobby"},{from:"Language",to:"Student_Language"}] },
    { bad:{ Student_Club_Event:[0,1,2] }, changed:["Student_Club","Student_Event","Club_Event"], wrong:"Two of the pairings aren't enough. Joining just student-club with student-event invents club-at-event combinations that never actually happened.", dependency:"join {Student_Club, Student_Event, Club_Event} = Student_Club_Event", fix:"Keep all three pair tables. Only joining all three together rebuilds the real data without inventing extra rows.", moves:[{from:"StudentID + Club",to:"Student_Club"},{from:"StudentID + Event",to:"Student_Event"},{from:"Club + Event",to:"Club_Event"}] }
  ];
  const config = transforms[index];
  const split = renderSplit(states[index - 1], states[index], index, config);
  const rules = ["", "One value per cell, one fact per row", "Split off columns that depend on only part of the key", "Move facts that belong to another thing into their own table", "Anything that decides a column should be a key", "Separate two lists that don't relate to each other", "Split into three pair tables that only rejoin correctly together"];
  const conclusion = `<section class="conclusion" aria-label="Conclusion"><article class="conclusion-card pro"><h3>What you gain</h3><ul><li>Much less repeated data</li><li>Fewer ways for edits to go wrong</li><li>Rules that are easy to enforce</li></ul></article><article class="conclusion-card con"><h3>What it costs</h3><ul><li>More tables to keep track of</li><li>Queries need more joins</li><li>Reads can get a little slower</li></ul></article><aside class="denormalize"><h3>When to stop</h3><p>Full 5NF is rarely needed. For most apps, 3NF or BCNF is a good place to stop. If reads get slow, you can add some duplication back on purpose — just keep one clean source of truth and know exactly where you copied data.</p></aside></section>`;
  const tradeoff = config.extra ? `<aside class="tradeoff-note">${esc(config.extra)}</aside>` : "";
  const contrast = index === 5 ? renderForwardHint() : index === 6 ? renderContrastNote(m) : "";
  const handoff = `<div class="handoff-note">This result becomes the input for ${index === 6 ? "the finished design" : FORMS[index + 1]}.</div>`;
  const ending = index === 6 ? `<header class="stage-head conclusion-head"><span class="stage-number">08</span><h2>Conclusion<span class="stage-rule">Normalize for a clean design; add duplication back only when you have a reason.</span></h2></header>${conclusion}` : "";
  return stage(index, FORMS[index], rules[index], `${explain(config)}${split}${contrast}${tradeoff}${handoff}${ending}`);
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

const glossaryHost = document.querySelector("#glossary");
if (glossaryHost) glossaryHost.innerHTML = `<span class="glossary-label">Glossary</span>${termTag("fact")}${termTag("dependency")}`;

if (typeof document.addEventListener === "function") {
  const closeTerms = (except) => document.querySelectorAll(".term[aria-expanded='true']").forEach((button) => { if (button !== except) button.setAttribute("aria-expanded", "false"); });
  document.addEventListener("click", (event) => {
    const term = event.target.closest && event.target.closest(".term");
    if (term) {
      const open = term.getAttribute("aria-expanded") === "true";
      closeTerms(term);
      term.setAttribute("aria-expanded", open ? "false" : "true");
      return;
    }
    closeTerms(null);
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeTerms(null); });
}

buildProgress();
regenerate(DEFAULT_SEED);
