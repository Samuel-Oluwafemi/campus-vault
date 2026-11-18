export interface CourseCatalogEntry {
  id: string;
  departmentId: 'geology';
  code: string;
  title: string | null;
  level: 300;
  semester: string | null;
  status: 'provisional';
  levelInferred: true;
  sourceFiles: string[];
  resourcesAvailable: boolean;
}

export const provisionalGeologyPastQuestionReferences = [
  '300lv PQ_2025.pdf',
  'Geology 300lvl Past Questions.pdf',
];

export const provisionalGeologyCourses: CourseCatalogEntry[] = [
  {
    id: 'gly-304',
    departmentId: 'geology',
    code: 'GLY 304',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['GLY 304.pdf', 'FERROUS METALS NOTE.pdf'],
    resourcesAvailable: true,
  },
  {
    id: 'gly-305',
    departmentId: 'geology',
    code: 'GLY 305',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['305 PQ answers.pdf'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-306',
    departmentId: 'geology',
    code: 'GLY 306',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['GLY 306 FUNAAB.pdf'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-308',
    departmentId: 'geology',
    code: 'GLY 308',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['FUNAAB GLY 308 Met Pet 2026.pdf', 'GLY 308.pdf'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-310',
    departmentId: 'geology',
    code: 'GLY 310',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['310.pdf'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-311',
    departmentId: 'geology',
    code: 'GLY 311',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['GLY 311 - Marine Geology-1.pptx'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-314',
    departmentId: 'geology',
    code: 'GLY 314',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['GLY 314 - Marine Geology-2.pptx', 'GLY 314 Lecture Note.pdf'],
    resourcesAvailable: false,
  },
  {
    id: 'gly-316',
    departmentId: 'geology',
    code: 'GLY 316',
    title: null,
    level: 300,
    semester: null,
    status: 'provisional',
    levelInferred: true,
    sourceFiles: ['Electromagnetic note GLY 316.docx'],
    resourcesAvailable: false,
  },
];
