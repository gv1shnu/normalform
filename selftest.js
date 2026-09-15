"use strict";

const fs = require("fs");
const vm = require("vm");

function makeElement() {
  let html = "";
  return {
    children: [], value: "", disabled: false, textContent: "",
    classList: { toggle() {} }, addEventListener() {}, setAttribute() {}, removeAttribute() {}, scrollIntoView() {},
    insertAdjacentHTML(_position, value) { this.children.push(value); },
    set innerHTML(value) { html = value; this.children = []; },
    get innerHTML() { return html; }
  };
}

const selectors = ["#journey", "#progress", "#seedInput", "#nextButton", "#backButton", "#resetButton", "#newSeed", "#statusAnnouncer"];
const elements = Object.fromEntries(selectors.map((selector) => [selector, makeElement()]));
const context = {
  document: { querySelector: (selector) => elements[selector] || makeElement(), querySelectorAll: () => [] },
  Date,
  Math
};
vm.createContext(context);
vm.runInContext(fs.readFileSync("app.js", "utf8"), context);

const seeds = [240519, 1, 42, 99, 987654, 314159, 0, "abc"];
const serialize = (value) => JSON.stringify(value);
const rowKey = (row) => serialize(row);
const asSet = (rows) => new Set(rows.map(rowKey));
const sameRows = (left, right) => {
  const a = asSet(left);
  const b = asSet(right);
  return a.size === b.size && [...a].every((value) => b.has(value));
};
const project = (rows, columns) => [...new Map(rows.map((row) => {
  const projected = columns.map((column) => row[column]);
  return [rowKey(projected), projected];
})).values()];

function getCase(seed) {
  context.__testSeed = seed;
  return vm.runInContext("(()=>{const m=createModel(__testSeed);return {model:m,states:databaseStates(m),html:[0,1,2,3,4,5,6].map((index)=>{model=m;return renderStage(index);})};})()", context);
}

let referenceSchema;
for (const seed of seeds) {
  const first = getCase(seed);
  const second = getCase(seed);
  if (serialize(first.model) !== serialize(second.model)) throw new Error(`Seed ${seed}: generation is not deterministic`);

  const schema = first.states.map((state) => state.map(({ title, columns, key }) => ({ title, columns, key })));
  if (!referenceSchema) referenceSchema = serialize(schema);
  if (serialize(schema) !== referenceSchema) throw new Error(`Seed ${seed}: schema changed with the seed`);

  first.states.forEach((state, stateIndex) => state.forEach((table) => {
    if (!table.rows.length) throw new Error(`Seed ${seed}: ${table.title} is empty at state ${stateIndex}`);
    if (table.key.length) {
      const keys = table.rows.map((row) => table.key.map((column) => row[column]));
      if (asSet(keys).size !== keys.length) throw new Error(`Seed ${seed}: duplicate primary key in ${table.title}`);
    }
  }));

  const [state0,state1,state2,state3,state4,state5] = first.states;
  const campus = state1.find((table) => table.title === "Campus_Record_1NF").rows;
  const profile = state2.find((table) => table.title === "Student_Profile_2NF").rows;
  const courses = state2.find((table) => table.title === "Course").rows;
  const enrollment = state2.find((table) => table.title === "Enrollment_2NF").rows;
  const joined2NF = enrollment.map(([studentId,courseId,grade,tutorId]) => {
    const student = profile.find(([id]) => id === studentId);
    const course = courses.find(([id]) => id === courseId);
    return [studentId,student[1],student[2],student[3],courseId,course[1],grade,tutorId];
  });
  if (!sameRows(joined2NF, campus)) throw new Error(`Seed ${seed}: 2NF decomposition is lossy`);

  const students = state3.find((table) => table.title === "Student").rows;
  const departments = state3.find((table) => table.title === "Department").rows;
  const joined3NF = students.map(([studentId,name,deptId]) => [studentId,name,deptId,departments.find(([id]) => id === deptId)[1]]);
  if (!sameRows(joined3NF, profile)) throw new Error(`Seed ${seed}: 3NF decomposition is lossy`);

  const tutorCourse = state4.find((table) => table.title === "Tutor_Course").rows;
  const studentTutorGrade = state4.find((table) => table.title === "Student_Tutor_Grade").rows;
  const joinedBCNF = studentTutorGrade.map(([studentId,tutorId,grade]) => [studentId,tutorCourse.find(([id]) => id === tutorId)[1],grade,tutorId]);
  if (!sameRows(joinedBCNF, enrollment)) throw new Error(`Seed ${seed}: BCNF decomposition is lossy`);

  const joined4NF = first.model.studentHobbies.flatMap(([studentId,hobby]) => first.model.studentLanguages
    .filter(([id]) => id === studentId).map(([,language]) => [studentId,hobby,language]));
  if (!sameRows(joined4NF, first.model.hobbyLanguage)) throw new Error(`Seed ${seed}: 4NF decomposition is lossy`);

  const twoWay = first.model.studentClub.flatMap(([studentId,club]) => first.model.studentEvent
    .filter(([id]) => id === studentId).map(([,event]) => [studentId,club,event]));
  const threeWay = twoWay.filter(([,club,event]) => first.model.clubEvent.some(([c,e]) => c === club && e === event));
  if (sameRows(twoWay, first.model.participation)) throw new Error(`Seed ${seed}: 5NF is reducible to a two-way join`);
  if (!sameRows(threeWay, first.model.participation)) throw new Error(`Seed ${seed}: 5NF three-way join is lossy`);
  if (!sameRows(project(first.model.participation, [0,1]), first.model.studentClub) ||
      !sameRows(project(first.model.participation, [0,2]), first.model.studentEvent) ||
      !sameRows(project(first.model.participation, [1,2]), first.model.clubEvent)) {
    throw new Error(`Seed ${seed}: 5NF pair tables are not true projections`);
  }

  first.html.forEach((html, index) => {
    first.states[index].forEach((table) => {
      if (!html.includes(`data-table="${table.title}"`)) throw new Error(`Seed ${seed}: ${table.title} missing from ${index} outcome`);
    });
    if (index > 0) first.states[index - 1].forEach((table) => {
      if (!html.includes(`data-table="${table.title}"`)) throw new Error(`Seed ${seed}: ${table.title} missing from ${index} input`);
    });
  });
}

console.log(`PASS: ${seeds.length} seeds; deterministic schemas, unique primary keys, complete snapshots, and lossless 2NF–5NF decompositions.`);
