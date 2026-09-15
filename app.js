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
  const shuffle = (items) => [...items].sort(() => random() - .5);
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
  const studentEvent = [[0,0],[0,1],[1,0],[1,2],[2,1],[3,2]].map(([s,e]) => [students[s].id,events[e]]);
  const clubEvent = [[0,0],[0,1],[0,2],[1,0],[1,1],[2,0],[2,2]].map(([c,e]) => [clubs[c],events[e]]);
  const participation = studentClub.flatMap(([student,club]) => studentEvent.filter(([id]) => id === student).flatMap(([,event]) => clubEvent.some(([c,e]) => c === club && e === event) ? [[student,club,event]] : []));
  const unfRows = students.map((student) => {
    const studentCourses = campusRows.filter(([id]) => id === student.id).map((row) => `${row[4]} ${row[5]} (${row[6]})`).join("; ");
    const interests = studentHobbies.filter(([id]) => id === student.id).map(([,h]) => h).join(", ");
    const spoken = studentLanguages.filter(([id]) => id === student.id).map(([,l]) => l).join(", ");
    const activities = participation.filter(([id]) => id === student.id).map(([,club,event]) => `${club} @ ${event}`).join("; ");
    return [student.id, student.name, studentCourses, interests, spoken, activities];
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
  return `<article class="table-card ${options.wide ? "wide" : ""}"><div class="table-title"><h3>${esc(title)}</h3><span>${rows.length} rows</span></div><div class="table-scroll"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div></article>`;
}

function notes(wrong, fix) {
  return `<div class="explain-grid"><div class="note bad"><span class="note-label">What was wrong</span><p>${wrong}</p></div><div class="note good"><span class="note-label">What changed</span><p>${fix}</p></div></div>`;
}

function dependency(value) {
  return `<div class="dependency"><strong>Dependency</strong><code>${esc(value)}</code></div>`;
}

function lesson(before, wrong, dependencyText, fix, after = "") {
  return `<section class="lesson-step"><span class="phase-kicker">1 · Start with the table</span>${before}</section>
    <section class="lesson-step"><span class="phase-kicker problem">2 · What is wrong</span><div class="note bad"><p>${wrong}</p></div>${dependency(dependencyText)}</section>
    <section class="lesson-step"><span class="phase-kicker solution">3 · What to change</span><div class="note good"><p>${fix}</p></div>${after}</section>`;
}

function stage(index, title, rule, content) {
  return `<article class="stage" id="stage-${index}" data-step="${index}"><header class="stage-head"><span class="stage-number">0${index + 1}</span><h2>${title}<span class="stage-rule">${rule}</span></h2></header>${content}</article>`;
}

function schemaStrip(names) {
  return `<aside class="schema-strip"><strong>Campus Connect schema now</strong><div>${names.map((name) => `<code>${esc(name)}</code>`).join("")}</div></aside>`;
}

function renderStage(index) {
  const m = model;
  const studentProfile = m.students.map((student) => {
    const dept = m.departments.find(([id]) => id === student.dept);
    return [student.id,student.name,dept[0],dept[1]];
  });
  const enrollment = m.campusRows.map((row) => [row[0],row[4],row[6],row[7]]);
  if (index === 0) {
    const before = `<div class="tables-grid">${table("Campus_Workbook", ["StudentID","StudentName","Courses","Hobbies","Languages","Club events"], m.unfRows, { bad:[2,3,4,5], wide:true })}</div>`;
    return stage(index, "UNF", "The Campus Connect starting spreadsheet", `<section class="lesson-step"><span class="phase-kicker problem">Starting table</span>${before}<div class="compact-callout problem"><strong>Why unnormalized?</strong> Courses, hobbies, languages, and club events are repeating groups. There is no reliable primary key for the individual facts.</div>${dependency("StudentID → {Courses, Hobbies, Languages, Club events}")}</section>${schemaStrip(["Campus_Workbook"] )}`);
  }
  if (index === 1) {
    const atomic = `<div class="tables-grid">${table("Campus_Record_1NF", ["StudentID","StudentName","DeptID","DeptName","CourseID","CourseName","Grade","TutorID"], m.campusRows, { fixed:[4,6,7], key:[0,4], wide:true })}</div>`;
    return stage(index, "1NF", "One value per cell; one fact per row", `<section class="lesson-step"><span class="phase-kicker solution">Atomic result</span><div class="transform-cue"><code>course list</code><span aria-hidden="true">→</span><strong>one enrollment per row</strong></div>${atomic}<div class="compact-callout"><strong>What changed?</strong> Every cell is atomic. StudentID (PK) and CourseID (PK) together form the composite primary key.</div>${dependency("(StudentID, CourseID) → Grade, TutorID")}</section>${schemaStrip(["Campus_Record_1NF","Activity rows (atomic)"])}`);
  }
  if (index === 2) {
    const before = `<div class="tables-grid">${table("Campus_Record_1NF", ["StudentID","StudentName","DeptID","DeptName","CourseID","CourseName","Grade","TutorID"], m.campusRows, { bad:[1,2,3,5], key:[0,4], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student_Profile_2NF", ["StudentID","StudentName","DeptID","DeptName"], studentProfile, { key:[0], fixed:[1,2,3] })}${table("Course", ["CourseID","CourseName"], m.courses, { key:[0], fixed:[1] })}${table("Enrollment_2NF", ["StudentID","CourseID","Grade","TutorID"], enrollment, { key:[0,1], fixed:[2,3], wide:true })}</div>`;
    return stage(index, "2NF", "Remove dependencies on only part of a composite key", `${lesson(before, "Student details depend only on StudentID. CourseName depends only on CourseID. Both repeat because the primary key has two columns.", "StudentID → StudentName, DeptID · CourseID → CourseName", "Move student facts to Student_Profile and course facts to Course. Keep enrollment facts with the full composite primary key.", after)}${schemaStrip(["Student_Profile_2NF","Course","Enrollment_2NF","Student interests","Club participation"])}`);
  }
  if (index === 3) {
    const before = `<div class="tables-grid">${table("Student_Profile_2NF", ["StudentID","StudentName","DeptID","DeptName"], studentProfile, { bad:[3], key:[0], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student", ["StudentID","StudentName","DeptID"], m.students.map((s) => [s.id,s.name,s.dept]), { key:[0], fixed:[1,2] })}${table("Department", ["DeptID","DeptName"], m.departments, { key:[0], fixed:[1] })}</div>`;
    return stage(index, "3NF", "Remove dependencies between non-key columns", `${lesson(before, "DeptName depends on DeptID, not directly on StudentID. It repeats for every student in the same department.", "StudentID → DeptID → DeptName", "Keep DeptID with Student and store each department name once in Department.", after)}${schemaStrip(["Student","Department","Course","Enrollment_2NF","Student interests","Club participation"])}`);
  }
  if (index === 4) {
    const before = `<div class="tables-grid">${table("Enrollment_2NF", ["StudentID","CourseID","Grade","TutorID"], enrollment, { bad:[1,3], key:[0,1], wide:true })}</div>`;
    const tutorCourse = m.tutors.map((t) => [t[0],t[2]]);
    const studentTutorGrade = m.campusRows.map((row) => [row[0],row[7],row[6]]);
    const after = `<div class="tables-grid">${table("Tutor_Course", ["TutorID","CourseID"], tutorCourse, { key:[0], fixed:[1] })}${table("Student_Tutor_Grade", ["StudentID","TutorID","Grade"], studentTutorGrade, { key:[0,1], fixed:[2] })}</div>`;
    return stage(index, "BCNF", "Every determinant must be a candidate key", `${lesson(before, "TutorID determines CourseID, but TutorID is not a primary key of Enrollment_2NF because one tutor helps several students.", "TutorID → CourseID (TutorID is not a superkey)", "Store each tutor’s course once. Student_Tutor_Grade keeps the student’s grade for that tutor’s course.", after)}${schemaStrip(["Student","Department","Course","Tutor_Course","Student_Tutor_Grade","Student interests","Club participation"])}`);
  }
  if (index === 5) {
    const before = `<div class="tables-grid">${table("Student_Hobby_Language", ["StudentID","Hobby","Language"], m.hobbyLanguage, { bad:[1,2], key:[0,1,2], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student_Hobby", ["StudentID","Hobby"], m.studentHobbies, { key:[0,1], fixed:[1] })}${table("Student_Language", ["StudentID","Language"], m.studentLanguages, { key:[0,1], fixed:[1] })}</div>`;
    return stage(index, "4NF", "Separate independent multivalued facts", `${lesson(before, "A student’s hobbies do not depend on the languages they speak. Combining both lists creates every possible pairing.", "StudentID ↠ Hobby · StudentID ↠ Language", "Store hobbies and languages in separate relations, each with its own composite primary key.", after)}${schemaStrip(["Student","Department","Course","Tutor_Course","Student_Tutor_Grade","Student_Hobby","Student_Language","Club participation"])}`);
  }
  const conclusion = `<section class="conclusion" aria-label="Conclusion"><article class="conclusion-card pro"><h3>What full normalization buys</h3><ul><li>Far less duplicate data</li><li>Fewer update, insert, and delete anomalies</li><li>Clearer integrity constraints</li></ul></article><article class="conclusion-card con"><h3>What it costs</h3><ul><li>More tables to understand</li><li>More joins and query complexity</li><li>Possible read-performance overhead</li></ul></article><aside class="denormalize"><h3>When to step back</h3><p>5NF is valuable when genuine join dependencies exist; for most systems, 3NF or BCNF is the pragmatic finish line. Denormalize deliberately for measured, read-heavy bottlenecks—keep a canonical normalized source and make duplicated values explicit and testable.</p></aside></section>`;
  const before = `<div class="tables-grid">${table("Student_Club_Event", ["StudentID","Club","Event"], m.participation, { bad:[0,1,2], key:[0,1,2], wide:true })}</div>`;
  const after = `<div class="tables-grid">${table("Student_Club", ["StudentID","Club"], m.studentClub, { key:[0,1], fixed:[0,1] })}${table("Student_Event", ["StudentID","Event"], m.studentEvent, { key:[0,1], fixed:[0,1] })}${table("Club_Event", ["Club","Event"], m.clubEvent, { key:[0,1], fixed:[0,1] })}</div>`;
  const finalSchema = schemaStrip(["Student","Department","Course","Tutor_Course","Student_Tutor_Grade","Student_Hobby","Student_Language","Student_Club","Student_Event","Club_Event"]);
  return stage(index, "5NF", "Separate facts implied by three smaller pairings", `${lesson(before, "A participation row is implied when the student belongs to the club, the student registered for the event, and the club attends that event.", "⋈ {Student_Club, Student_Event, Club_Event} = Student_Club_Event", "Keep the three pairwise relations. Their natural join recreates exactly the original participation rows.", after)}${finalSchema}<header class="stage-head conclusion-head"><span class="stage-number">08</span><h2>Conclusion<span class="stage-rule">Normalize for integrity; denormalize with evidence.</span></h2></header>${conclusion}`);
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
  seed = nextSeed;
  seedInput.value = seed;
  model = createModel(seed);
  journey.innerHTML = "";
  currentStep = 0;
  renderThrough(0, false);
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
