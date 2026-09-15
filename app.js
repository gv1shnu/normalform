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
  const students = firstNames.slice(0, 4).map((first, index) => ({ id: `S${101 + index}`, name: `${first} ${lastNames[index]}`, dept: ["D1","D1","D2","D3"][index] }));
  const clubs = shuffle(["Robotics", "Drama", "Chess", "Debate"]);
  const clubMembership = [[0,0],[0,1],[1,0],[1,2],[2,1],[2,3],[3,2],[3,3]].map(([s,c]) => [students[s].id, clubs[c]]);
  const unfStudents = students.map((student) => [student.id, student.name, clubMembership.filter(([id]) => id === student.id).map(([,club]) => club).join(", ")]);
  const courses = shuffle(["Databases", "Calculus", "Design"]);
  const enrollments = [[0,0,"A"],[0,1,"B+"],[1,0,"B"],[1,2,"A-"],[2,1,"A"],[2,2,"B+"],[3,0,"A-"],[3,2,"A"]].map(([s,c,g]) => [students[s].id, courses[c], students[s].name, g]);
  const departments = [["D1","Computer Science"],["D2","Mathematics"],["D3","Design"]];
  const studentDept = students.map((student) => [student.id, student.name, student.dept, departments.find(([id]) => id === student.dept)[1]]);
  const tutors = firstNames.slice(4,8).map((first,index) => [`T${index + 1}`, `${first} ${lastNames[index + 4]}`, courses[index % 3]]);
  const tutorAssignments = [[0,0],[1,0],[0,1],[2,1],[1,2],[3,2],[2,3],[3,3]].map(([s,t]) => [students[s].id, tutors[t][2], tutors[t][0]]);
  const hobbies = shuffle(["Cycling", "Painting", "Gaming", "Cooking"]);
  const languages = shuffle(["English", "Hindi", "Spanish", "German"]);
  const studentHobbies = [[0,0],[0,1],[0,2],[1,0],[1,3],[2,1],[3,2]].map(([s,h]) => [students[s].id,hobbies[h]]);
  const studentLanguages = [[0,0],[0,1],[1,0],[1,2],[2,1],[3,0],[3,3]].map(([s,l]) => [students[s].id,languages[l]]);
  const hobbyLanguage = studentHobbies.flatMap(([id,hobby]) => studentLanguages.filter(([student]) => student === id).map(([,language]) => [id,hobby,language])).slice(0,10);
  const suppliers = shuffle(["Acme", "BoltCo", "Nova Parts"]);
  const parts = shuffle(["Sensor", "Valve", "Panel"]);
  const projects = shuffle(["Bridge", "Lab", "Clinic"]);
  const supplierPart = [[0,0],[0,1],[1,0],[1,2],[2,1],[2,2]].map(([s,p]) => [suppliers[s],parts[p]]);
  const supplierProject = [[0,0],[0,1],[1,0],[1,2],[2,1],[2,2]].map(([s,p]) => [suppliers[s],projects[p]]);
  const partProject = [[0,0],[0,1],[0,2],[1,0],[1,1],[2,0],[2,2]].map(([p,j]) => [parts[p],projects[j]]);
  const supplies = supplierPart.flatMap(([supplier,part]) => supplierProject.filter(([s]) => s === supplier).flatMap(([,project]) => partProject.some(([p,j]) => p === part && j === project) ? [[supplier,part,project]] : []));
  return { students, clubs, clubMembership, unfStudents, courses, enrollments, departments, studentDept, tutors, tutorAssignments, hobbies, languages, studentHobbies, studentLanguages, hobbyLanguage, suppliers, parts, projects, supplierPart, supplierProject, partProject, supplies };
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[char]));
}

function table(title, columns, rows, options = {}) {
  const bad = options.bad || [];
  const fixed = options.fixed || [];
  const key = options.key || [];
  const header = columns.map((column, index) => `<th class="${bad.includes(index) ? "offending" : ""} ${fixed.includes(index) ? "fixed" : ""} ${key.includes(index) ? "key" : ""}">${esc(column)}</th>`).join("");
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

function renderStage(index) {
  const m = model;
  if (index === 0) {
    const before = `<div class="tables-grid">${table("Student_Spreadsheet", ["StudentID","StudentName","Clubs"], m.unfStudents, { bad:[2], key:[0], wide:true })}</div>`;
    return stage(index, "UNF", "The starting point: a repeating group inside one cell", `<section class="lesson-step"><span class="phase-kicker problem">Starting table</span>${before}<div class="compact-callout problem"><strong>Why unnormalized?</strong> The Clubs cell contains a repeating group.</div>${dependency("StudentID → {Clubs} (repeating group)")}</section>`);
  }
  if (index === 1) {
    const after = `<div class="tables-grid">${table("Student_Club", ["StudentID","Club"], m.clubMembership, { fixed:[1], key:[0,1], wide:true })}</div>`;
    return stage(index, "1NF", "One value per cell; one fact per row", `<section class="lesson-step"><span class="phase-kicker solution">Atomic result</span><div class="transform-cue"><code>“${esc(m.unfStudents[0][2])}”</code><span aria-hidden="true">→</span><strong>two separate rows</strong></div>${after}<div class="compact-callout"><strong>What changed?</strong> Every cell is now atomic, and each row records one club membership.</div>${dependency("(StudentID, Club) identifies one membership")}</section>`);
  }
  if (index === 2) {
    const enrollment = m.enrollments.map(([id,course,,grade]) => [id,course,grade]);
    const before = `<div class="tables-grid">${table("Enrollment_before", ["StudentID","Course","StudentName","Grade"], m.enrollments, { bad:[2], key:[0,1], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student", ["StudentID","StudentName"], m.students.map((s) => [s.id,s.name]), { key:[0], fixed:[1] })}${table("Enrollment", ["StudentID","Course","Grade"], enrollment, { key:[0,1], fixed:[2] })}</div>`;
    return stage(index, "2NF", "Use the whole composite key", lesson(before, "StudentName depends only on StudentID, not on StudentID + Course. It repeats for every course.", "StudentID → StudentName · (StudentID, Course) → Grade", "Move names to Student. Keep Grade in Enrollment because it needs both key columns.", after));
  }
  if (index === 3) {
    const before = `<div class="tables-grid">${table("Student_before", ["StudentID","StudentName","DeptID","DeptName"], m.studentDept, { bad:[3], key:[0], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student", ["StudentID","StudentName","DeptID"], m.students.map((s) => [s.id,s.name,s.dept]), { key:[0], fixed:[2] })}${table("Department", ["DeptID","DeptName"], m.departments, { key:[0], fixed:[1] })}</div>`;
    return stage(index, "3NF", "Non-key facts should not depend on other non-key facts", lesson(before, "DeptName depends on DeptID, not directly on StudentID. It repeats for students in the same department.", "StudentID → DeptID → DeptName", "Keep DeptID with the student and store each department name once.", after));
  }
  if (index === 4) {
    const before = `<div class="tables-grid">${table("Student_Course_Tutor", ["StudentID","Course","TutorID"], m.tutorAssignments, { bad:[1,2], key:[0,2], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Tutor_Course", ["TutorID","Course"], m.tutors.map((t) => [t[0],t[2]]), { key:[0], fixed:[1] })}${table("Student_Tutor", ["StudentID","TutorID"], m.tutorAssignments.map(([s,,t]) => [s,t]), { key:[0,1], fixed:[0,1] })}</div>`;
    return stage(index, "BCNF", "Anything that determines a value must be a key", lesson(before, "Each tutor teaches one course, so TutorID determines Course. But TutorID alone does not identify a student–tutor assignment.", "TutorID → Course (TutorID is not a key of the original table)", "Store the tutor’s course separately from which students meet that tutor.", after));
  }
  if (index === 5) {
    const before = `<div class="tables-grid">${table("Student_Hobby_Language", ["StudentID","Hobby","Language"], m.hobbyLanguage, { bad:[1,2], key:[0,1,2], wide:true })}</div>`;
    const after = `<div class="tables-grid">${table("Student_Hobby", ["StudentID","Hobby"], m.studentHobbies, { key:[0,1], fixed:[1] })}${table("Student_Language", ["StudentID","Language"], m.studentLanguages, { key:[0,1], fixed:[1] })}</div>`;
    return stage(index, "4NF", "Separate independent many-to-many facts", lesson(before, "A student’s hobbies do not depend on the languages they speak. Combining them creates every possible pairing.", "StudentID ↠ Hobby · StudentID ↠ Language", "Store hobbies and languages in separate two-column tables.", after));
  }
  const conclusion = `<section class="conclusion" aria-label="Conclusion"><article class="conclusion-card pro"><h3>What full normalization buys</h3><ul><li>Far less duplicate data</li><li>Fewer update, insert, and delete anomalies</li><li>Clearer integrity constraints</li></ul></article><article class="conclusion-card con"><h3>What it costs</h3><ul><li>More tables to understand</li><li>More joins and query complexity</li><li>Possible read-performance overhead</li></ul></article><aside class="denormalize"><h3>When to step back</h3><p>5NF is valuable when genuine join dependencies exist; for most systems, 3NF or BCNF is the pragmatic finish line. Denormalize deliberately for measured, read-heavy bottlenecks—keep a canonical normalized source and make duplicated values explicit and testable.</p></aside></section>`;
  const before = `<div class="tables-grid">${table("Supply", ["Supplier","Part","Project"], m.supplies, { bad:[0,1,2], key:[0,1,2], wide:true })}</div>`;
  const after = `<div class="tables-grid">${table("Supplier_Part", ["Supplier","Part"], m.supplierPart, { key:[0,1], fixed:[0,1] })}${table("Supplier_Project", ["Supplier","Project"], m.supplierProject, { key:[0,1], fixed:[0,1] })}${table("Part_Project", ["Part","Project"], m.partProject, { key:[0,1], fixed:[0,1] })}</div>`;
  return stage(index, "5NF", "Split facts that can be rebuilt from smaller pairings", `${lesson(before, "Supplier–Part–Project rows are fully implied by three pairwise rules: who supplies what, who serves which project, and what each project uses.", "⋈ {Supplier_Part, Supplier_Project, Part_Project} = Supply", "Keep those three simpler facts. Their natural join rebuilds the original rows without inventing extras.", after)}<header class="stage-head conclusion-head"><span class="stage-number">08</span><h2>Conclusion<span class="stage-rule">Normalize for integrity; denormalize with evidence.</span></h2></header>${conclusion}`);
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
