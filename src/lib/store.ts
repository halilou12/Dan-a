import { useSyncExternalStore } from 'react';

export type StudentStatus = 'active' | 'graduated' | 'withdrawn';
export type Grade = 'Competent' | 'Not yet competent';
export type CertificateStatus = 'valid' | 'revoked';

export interface Student {
  id: string;
  fullName: string;
  nationalId: string;
  dob: string;
  email: string;
  phone: string;
  photo: string | null;
  status: StudentStatus;
  createdAt: string;
}

export interface Program {
  id: string;
  title: string;
  weeks: number;
  modules: string[];
}

export interface Enrollment {
  studentId: string;
  programId: string;
  enrolledDate: string;
}

export interface Assessment {
  id: string;
  studentId: string;
  programId: string;
  module: string;
  grade: Grade;
  score: number;
  assessedDate: string;
  assessor: string;
}

export interface Certificate {
  id: string;
  studentId: string;
  programId: string;
  token: string;
  issueDate: string;
  status: CertificateStatus;
  revokedDate?: string;
  revokedReason?: string;
}

export interface GalleryPhoto {
  id: number;
  alt: string;
  category: string;
  src: string;
}

export interface StoreData {
  students: Student[];
  enrollments: Enrollment[];
  assessments: Assessment[];
  certificates: Certificate[];
  gallery: GalleryPhoto[];
  counters: { student: number; cert: number };
}

export const PROGRAMS: Program[] = [
  {
    id: 'PRG-BF',
    title: 'Barista Foundation',
    weeks: 4,
    modules: [
      'Introduction to Coffee',
      'Coffee Processing',
      'Grinder Basics',
      'Water Quality',
      'Espresso',
      'Milk Science & Milk Steaming',
      'Latte Art Basics',
      'Mastery of Brewing Methods',
      'Coffee M.D',
      'Tea M.D',
      'Coffee Management',
      'Customer Service & Workflow',
      'Barista Interview Preferences & Tips',
      'Juice M.D',
      'V60 Pour Over',
      'Chemex',
      'Siphon',
      'French Press',
      'Cupping',
    ],
  },
  {
    id: 'PRG-SB',
    title: 'Specialty Brewing',
    weeks: 3,
    modules: ['V60 Pour Over', 'Chemex', 'Siphon', 'French Press', 'Cupping'],
  },
  {
    id: 'PRG-LA',
    title: 'Latte Art Mastery',
    weeks: 2,
    modules: ['Milk Texture', 'Heart, Rosetta & Tulip', 'Free Pour Techniques', 'Etching & Design'],
  },
];

export const GRADES: Grade[] = ['Competent', 'Not yet competent'];

export const ASSESSORS = ['UWIMANA Araphat', 'SIBOMANA Assouman'];

export const VERIFY_ROUTE = '/verify';

export const verificationURL = (token: string) => `${window.location.origin}${VERIFY_ROUTE}/${token}`;

const STORAGE_KEY = 'ksb-certificate-system-v1';

const seed = (): StoreData => ({
  counters: { student: 3, cert: 2 },
  gallery: [
    { id: 1, alt: 'Coffee Training Session', category: 'Training', src: '/images/IMG-20260408-WA0013.jpg' },
    { id: 2, alt: 'Latte Art', category: 'Coffee', src: '/images/IMG-20260408-WA0014.jpg' },
    { id: 3, alt: 'Fresh Juices', category: 'Beverages', src: '/images/IMG-20260408-WA0023.jpg' },
    { id: 4, alt: 'Barista at Work', category: 'Training', src: '/images/IMG-20260408-WA0026.jpg' },
    { id: 5, alt: 'Smoothie Preparation', category: 'Beverages', src: '/images/IMG-20260408-WA0027.jpg' },
    { id: 6, alt: 'Specialty Coffee Brewing', category: 'Coffee', src: '/images/Latte.jpeg' },
    { id: 7, alt: 'Milkshake Display', category: 'Beverages', src: '/images/Chocolate Milkshake.jpeg' },
    { id: 8, alt: 'Tea Selection', category: 'Beverages', src: '/images/African Tea.jpeg' },
    { id: 9, alt: 'Specialty Coffee Brewing', category: 'Coffee', src: '/images/home-image.jpg' },
  ],
  students: [
    {
      id: 'KSB-S-0001',
      fullName: 'Letitia Uwase',
      nationalId: '1221/19/0745',
      dob: '2002-04-18',
      email: 'letitia.uwase@example.com',
      phone: '+250780000001',
      photo: '/images/IMG-20260408-WA0013.jpg',
      status: 'graduated',
      createdAt: '2026-06-01',
    },
    {
      id: 'KSB-S-0002',
      fullName: 'Eric Niyonzima',
      nationalId: '1200/19/1021',
      dob: '2001-11-02',
      email: 'eric.niyonzima@example.com',
      phone: '+250780000002',
      photo: '/images/IMG-20260408-WA0014.jpg',
      status: 'active',
      createdAt: '2026-06-15',
    },
    {
      id: 'KSB-S-0003',
      fullName: 'Aline Mukamana',
      nationalId: '1211/20/0334',
      dob: '2003-02-09',
      email: 'aline.mukamana@example.com',
      phone: '+250780000003',
      photo: '/images/IMG-20260408-WA0027.jpg',
      status: 'graduated',
      createdAt: '2026-05-10',
    },
  ],
  enrollments: [
    { studentId: 'KSB-S-0001', programId: 'PRG-BF', enrolledDate: '2026-07-01' },
    { studentId: 'KSB-S-0002', programId: 'PRG-BF', enrolledDate: '2026-08-03' },
    { studentId: 'KSB-S-0003', programId: 'PRG-LA', enrolledDate: '2026-05-01' },
  ],
  assessments: [
    {
      id: 'A-0001',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Introduction to Coffee',
      grade: 'Competent',
      score: 95,
      assessedDate: '2026-07-22',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0002',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Coffee Processing',
      grade: 'Competent',
      score: 88,
      assessedDate: '2026-07-22',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0003',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Grinder Basics',
      grade: 'Competent',
      score: 84,
      assessedDate: '2026-07-23',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0004',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Water Quality',
      grade: 'Competent',
      score: 93,
      assessedDate: '2026-07-23',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0005',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Espresso',
      grade: 'Competent',
      score: 96,
      assessedDate: '2026-07-24',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0006',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Milk Science & Milk Steaming',
      grade: 'Competent',
      score: 87,
      assessedDate: '2026-07-24',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0007',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Latte Art Basics',
      grade: 'Competent',
      score: 85,
      assessedDate: '2026-07-25',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0008',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Mastery of Brewing Methods',
      grade: 'Competent',
      score: 90,
      assessedDate: '2026-07-25',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0009',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Coffee M.D',
      grade: 'Competent',
      score: 94,
      assessedDate: '2026-07-26',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0010',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Tea M.D',
      grade: 'Competent',
      score: 86,
      assessedDate: '2026-07-26',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0011',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Coffee Management',
      grade: 'Competent',
      score: 83,
      assessedDate: '2026-07-27',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0012',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Customer Service & Workflow',
      grade: 'Competent',
      score: 97,
      assessedDate: '2026-07-27',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0013',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Barista Interview Preferences & Tips',
      grade: 'Competent',
      score: 89,
      assessedDate: '2026-07-28',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0014',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Juice M.D',
      grade: 'Competent',
      score: 91,
      assessedDate: '2026-07-28',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0016',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'V60 Pour Over',
      grade: 'Competent',
      score: 90,
      assessedDate: '2026-07-29',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0017',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Chemex',
      grade: 'Competent',
      score: 88,
      assessedDate: '2026-07-29',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0018',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Siphon',
      grade: 'Competent',
      score: 87,
      assessedDate: '2026-07-29',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0019',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'French Press',
      grade: 'Competent',
      score: 89,
      assessedDate: '2026-07-29',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0020',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      module: 'Cupping',
      grade: 'Competent',
      score: 92,
      assessedDate: '2026-07-29',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0015',
      studentId: 'KSB-S-0002',
      programId: 'PRG-BF',
      module: 'Introduction to Coffee',
      grade: 'Competent',
      score: 78,
      assessedDate: '2026-08-12',
      assessor: 'UWIMANA Araphat',
    },
    {
      id: 'A-0006',
      studentId: 'KSB-S-0003',
      programId: 'PRG-LA',
      module: 'Milk Texture',
      grade: 'Competent',
      score: 96,
      assessedDate: '2026-05-08',
      assessor: 'SIBOMANA Assouman',
    },
    {
      id: 'A-0007',
      studentId: 'KSB-S-0003',
      programId: 'PRG-LA',
      module: 'Heart, Rosetta & Tulip',
      grade: 'Competent',
      score: 85,
      assessedDate: '2026-05-11',
      assessor: 'SIBOMANA Assouman',
    },
  ],
  certificates: [
    {
      id: 'KSB-CERT-2026-00001',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      token: 'XVZ4K-9QWPL-8HRTU',
      issueDate: '2026-07-29',
      status: 'valid',
    },
    {
      id: 'KSB-CERT-2026-00002',
      studentId: 'KSB-S-0003',
      programId: 'PRG-LA',
      token: 'MK7QR-2PTRS-LN45X',
      issueDate: '2026-05-20',
      status: 'revoked',
      revokedDate: '2026-08-02',
      revokedReason: 'Certificate holder breached the KSB professional code of conduct.',
    },
  ],
});

let data: StoreData | null = null;
const listeners = new Set<() => void>();

const load = (): StoreData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreData;
      if (!Array.isArray(parsed.gallery)) {
        parsed.gallery = seed().gallery;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
  } catch {
    // fall through to seed
  }
  const seeded = seed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

const getData = (): StoreData => {
  if (!data) data = load();
  return data;
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = (): StoreData => getData();

const commit = (mutate: (current: StoreData) => StoreData): void => {
  const next = mutate(getData());
  data = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage may be full or unavailable; keep in-memory state
  }
  listeners.forEach((l) => l());
};

export const today = (): string => new Date().toISOString().slice(0, 10);

const pad = (n: number, width: number): string => String(n).padStart(width, '0');

const nextStudentId = (counters: StoreData['counters']): string => {
  counters.student += 1;
  return `KSB-S-${pad(counters.student, 4)}`;
};

const nextAssessmentId = (): string =>
  `A-${pad(Date.now() % 1000000, 6)}`;

const nextCertificateId = (counters: StoreData['counters']): string => {
  counters.cert += 1;
  const year = new Date().getFullYear();
  return `KSB-CERT-${year}-${pad(counters.cert, 5)}`;
};

export const createToken = (): string => {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const b36 = Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `${b36.slice(0, 5)}-${b36.slice(5, 10)}-${b36.slice(10, 15)}`;
};

export interface RegisterInput {
  fullName: string;
  nationalId: string;
  dob: string;
  email: string;
  phone: string;
  photo: string | null;
}

export const findStudent = (id: string): Student | undefined =>
  getData().students.find((s) => s.id === id);

export const findStudentByName = (name: string): Student | undefined =>
  getData().students.find(
    (s) => s.fullName.toLowerCase() === name.trim().toLowerCase(),
  );

export const enrollmentsOf = (studentId: string): Enrollment[] =>
  getData().enrollments.filter((e) => e.studentId === studentId);

export const programById = (id: string): Program | undefined =>
  PROGRAMS.find((p) => p.id === id);

export const assessmentsOf = (studentId: string, programId: string): Assessment[] =>
  getData().assessments.filter(
    (a) => a.studentId === studentId && a.programId === programId,
  );

export const certificatesOf = (studentId: string): Certificate[] =>
  getData().certificates.filter((c) => c.studentId === studentId);

export const findCertificateByToken = (token: string): Certificate | undefined =>
  getData().certificates.find(
    (c) => c.token.toUpperCase() === token.trim().toUpperCase(),
  );

export const findCertificateById = (id: string): Certificate | undefined =>
  getData().certificates.find(
    (c) => c.id.toUpperCase() === id.trim().toUpperCase(),
  );

export const registerStudent = (input: RegisterInput): Student => {
  const student: Student = {
    ...input,
    id: nextStudentId(getData().counters),
    status: 'active',
    createdAt: today(),
  };
  commit((d) => ({ ...d, students: [...d.students, student] }));
  return student;
};

export const enrollStudent = (studentId: string, programId: string): Enrollment | null => {
  if (enrollmentsOf(studentId).some((e) => e.programId === programId)) return null;
  const enrollment: Enrollment = { studentId, programId, enrolledDate: today() };
  commit((d) => ({ ...d, enrollments: [...d.enrollments, enrollment] }));
  return enrollment;
};

export interface AssessmentInput {
  studentId: string;
  programId: string;
  module: string;
  grade: Grade;
  score: number;
  assessor: string;
}

export const addAssessment = (input: AssessmentInput): Assessment | null => {
  if (assessmentsOf(input.studentId, input.programId).some((a) => a.module === input.module)) return null;
  const assessment: Assessment = {
    ...input,
    id: nextAssessmentId(),
    assessedDate: today(),
  };
  commit((d) => ({ ...d, assessments: [...d.assessments, assessment] }));
  return assessment;
};

export const graduationProgress = (studentId: string, programId: string) => {
  const prog = programById(programId);
  if (!prog) return { total: 0, done: 0, passed: 0, failed: 0, ready: false };
  const assessed = assessmentsOf(studentId, programId);
  const done = assessed.length;
  const failed = assessed.filter((a) => a.grade === 'Not yet competent').length;
  const passed = done - failed;
  return {
    total: prog.modules.length,
    done,
    passed,
    failed,
    ready: done === prog.modules.length && failed === 0,
  };
};

export const graduateStudent = (studentId: string, programId: string): { ok: boolean; error?: string } => {
  const student = findStudent(studentId);
  if (!student) return { ok: false, error: 'Student not found.' };
  if (student.status === 'graduated') return { ok: false, error: 'Student is already graduated.' };
  const progress = graduationProgress(studentId, programId);
  if (!progress.ready) {
    return {
      ok: false,
      error:
        progress.failed > 0
          ? 'Some modules are not yet competent. Reassess before graduating.'
          : `Graduation requires all ${progress.total} modules to be assessed.`,
    };
  }
  commit((d) => ({
    ...d,
    students: d.students.map((s) =>
      s.id === studentId ? { ...s, status: 'graduated' as const } : s,
    ),
  }));
  return { ok: true };
};

export const issueCertificate = (
  studentId: string,
  programId: string,
): Certificate | null => {
  const student = findStudent(studentId);
  if (!student || student.status !== 'graduated') return null;
  if (certificatesOf(studentId).some((c) => c.programId === programId && c.status === 'valid')) return null;
  const certificate: Certificate = {
    id: nextCertificateId(getData().counters),
    studentId,
    programId,
    token: createToken(),
    issueDate: today(),
    status: 'valid',
  };
  commit((d) => ({ ...d, certificates: [...d.certificates, certificate] }));
  return certificate;
};

export const revokeCertificate = (id: string, reason: string): void => {
  commit((d) => ({
    ...d,
    certificates: d.certificates.map((c) =>
      c.id === id
        ? {
            ...c,
            status: 'revoked' as const,
            revokedDate: today(),
            revokedReason: reason || 'Revoked by KSB administration.',
          }
        : c,
    ),
  }));
};

export const addGalleryItem = (item: Omit<GalleryPhoto, 'id'>): GalleryPhoto => {
  const nextId =
    getData().gallery.reduce((max, g) => Math.max(max, g.id), 0) + 1;
  const photo: GalleryPhoto = { ...item, id: nextId };
  commit((d) => ({ ...d, gallery: [...d.gallery, photo] }));
  return photo;
};

export const removeGalleryItem = (id: number): void => {
  commit((d) => ({ ...d, gallery: d.gallery.filter((g) => g.id !== id) }));
};

export const useStore = (): StoreData => useSyncExternalStore(subscribe, getSnapshot);