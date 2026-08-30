# KIGALI SPECIALISTS BARISTA

## Digital Certificate & Academic Record Verification System

### Complete System Scenario / Specification

---

### 1. System Overview

Kigali Specialists Barista (KSB) needs a digital certificate verification system that allows the company to issue certificates to students who successfully complete barista training.

Every certificate must have a **unique Certificate ID** and a **unique QR code**.

When an employer, company, school, or any other person scans the QR code on the certificate, they are taken to an official KSB verification page where they can confirm whether the certificate is genuine.

The verification page should display the student's certificate information and provide access to the student's **academic record**.

---

### 2. Actors / Roles

| Role | Description |
|------|-------------|
| **Administrator** | KSB staff member who registers students, enrolls them in training, and issues certificates. |
| **Student** | Person enrolled in and completing a KSB barista training program. |
| **Verifier** | Any external person (employer, school, HR agency, regulatory body) who scans the QR code to validate a certificate. |
| **Public User** | Anyone who visits the KSB site and manually enters a Certificate ID to verify it. |

---

### 3. Scope

The system consists of three main components:

1. **Student Registration & Training Record** — internal (admin-only)
2. **Certificate Issuance** — internal (admin-only), generates the Certificate ID and QR code
3. **Public Verification Page** — external, read-only, reached by scanning the QR code or entering a Certificate ID manually

---

### 4. Complete System Scenario (End-to-End Flow)

#### Step 1 — Student Registration

1. A prospective student contacts KSB or registers via the website/office.
2. The **Administrator** creates a student record with:
   - Full legal name
   - National ID / Passport number
   - Date of birth
   - Email address
   - Phone number
   - Photos of the student (for the certificate)
3. The system stores the record and the student record gets a unique **Student ID** (e.g., `KSB-S-0001`).
4. The system records the student's status as **Active**.

#### Step 2 — Program Enrollment & Training

1. The Administrator enrolls the student in a training program (e.g., *Barista Foundation*, *Specialty Brewing*, *Latte Art Mastery*).
2. Each program has a start date, end date, duration, and a set of assessed skill modules:
   - Espresso calibration & extraction
   - Milk steaming & latte art
   - Brewing methods (V60, Chemex, Syphon, French Press)
   - Hygiene, workflow & customer service
3. During/after training, the Administrator (or trainer) records the student's **results** per module:
   - Module name
   - Score / grade (e.g., Pass with Distinction, Pass, Retake)
   - Date assessed
   - Assessor name
4. The system builds the student's **academic record** from these results.

#### Step 3 — Graduation / Certificate Issuance

Once the student passes all required modules:

1. The Administrator marks the student as **Graduated**.
2. The system automatically triggers certificate issuance and generates:
   - A **unique Certificate ID**, e.g. `KSB-CERT-2026-00001`
   - A **unique verification token/URL** derived from a random hash, e.g. `KSB1F9X-2Q7RZ-...`
   - A **QR code** image encoding the verification URL
3. The certificate is generated (digital/printable) containing:
   - KSB logo & official branding
   - Certificate ID
   - Student name and photo
   - Program title completed
   - Date of issue
   - Issued by / Authorized signature
   - QR code
4. The generated QR code is embedded on the printed and digital copies handed to the student.
5. The certificate status is stored as **Valid**.

#### Step 4 — Verification via QR Scan (The Key Scenario)

1. An employer receives a certificate from a job applicant (student).
2. The employer scans the **QR code** with any phone camera.
3. The phone opens the official KSB verification page URL:
   `https://kigalispecialistsbarista.com/verify/<token>`
4. The verification page **must** be hosted under the official KSB domain so it cannot be faked.
5. The page performs server-side lookup of the token.

#### Step 5 — Verification Result Display

The verification page shows one of three outcomes:

**A. Certificate is Valid**
- Green "VALID" badge / genuine-cockpress confirmation
- Student full name (public field)
- The student's photo
- Program completed
- Certificate ID
- Issue date
- Graduation date
- The student's **academic record**: a table of each module with grade, score, assessed date, and assessor
- KSB contact/confirmation line

**B. Certificate ID Not Found**
- Red/neutral "NOT FOUND" message
- Advise the verifier to contact KSB directly
- Option to try again (re-enter ID)

**C. Certificate Revoked / Invalid**
- Amber/red "INVALID / REVOKED" message with reason and date of revocation
- Advise verifier that the certificate holder is not currently certified

#### Step 6 — Manual Entry Fallback

A verifier who cannot scan the QR can visit the site and enter the **Certificate ID** manually into the verification form; same result pages as Step 5.

---

### 5. Data Model (Minimal)

**students**
| Field | Type | Notes |
|-------|-------|-------|
| student_id | PK | `KSB-S-0001` |
| full_name | string | |
| national_id | string | private |
| dob | date | private |
| email | string | |
| phone | string | |
| photo_url | string | shown on verification |
| status | enum | active / graduated / withdrawn |

**programs**
| Field | Type | Notes |
|-------|-------|-------|
| program_id | PK | e.g., `PRG-2026-001` |
| title | string | |
| start_date / end_date | date | |

**assessments**
| Field | Type | Notes |
|-------|-------|-------|
| id | PK | |
| student_id | FK | |
| program_id | FK | |
| module | string | |
| grade | string | e.g., Pass with Distinction |
| score | number | optional |
| assessed_date | date | |
| assessor | string | |

**certificates**
| Field | Type | Notes |
|-------|-------|-------|
| certificate_id | PK/unique | `KSB-CERT-2026-00001` |
| student_id | FK | |
| program_id | FK | |
| verification_token | unique | random hash used in URL |
| qr_code_url | string | generated image |
| issue_date | date | |
| status | enum | valid / revoked |

---

### 6. Functional Requirements (Summary)

| ID | Requirement |
|----|-------------|
| F1 | Register student with full details and unique Student ID |
| F2 | Enroll student into a training program |
| F3 | Record per-module assessment results |
| F4 | Build the student academic record automatically |
| F5 | Issue certificate only when all modules are passed |
| F6 | Auto-generate unique Certificate ID per certificate |
| F7 | Auto-generate unique verification token per certificate |
| F8 | Auto-generate unique QR code encoding the verification URL |
| F9 | Public verification page reachable by scanning QR |
| F10 | Public verification page reachable by manual Certificate ID entry |
| F11 | Display certificate info + photo + academic record on valid result |
| F12 | Show distinct messages for valid / not-found / revoked |
| F13 | Allow admin to revoke a certificate (status change) |
| F14 | All verification pages must load from the official KSB domain |
| F15 | Verification is read-only — verifiers cannot modify any data |

---

### 7. Security Considerations

- Verification tokens must be **random and unguessable** (cryptographically generated), acting like a public-key identifier separate from the human-readable Certificate ID.
- The verification page must never expose private data (national ID, DOB, phone, email) — only public cert/academic data.
- Certificate status changes (revocation) must be admin-only and logged.
- The QR code must resolve only to the official KSB domain to prevent phishing pages.
- Rate-limit manual lookups to prevent automated scanning/enumeration.

---

### 8. Sample End-to-End Walkthrough (Concrete Example)

1. **Register:** Letitia Uwase (ID `1221/19/0745`) is registered → Student ID `KSB-S-0001`, status *Active*.
2. **Enroll:** Admin enrolls her in *Barista Foundation* (`PRG-2026-001`), 4 weeks, started `2026-07-01`.
3. **Assess:** Modules recorded — Espresso Technique: *Pass with Distinction* (95/100) by Trainer A; Milk Steaming: *Pass* (82/100) by Trainer A; Brewing Methods: *Pass* (88/100) by Trainer B.
4. **Graduate & Issue:** All passed → system issues certificate `KSB-CERT-2026-00001`, token `XVZ4K-9QWPL-8HRTU`, issue date `2026-07-29`, prints QR + photo.
5. **Scan:** An HR manager at a Kigali hotel scans the QR on Letitia's printed certificate.
6. **Verify:** Phone opens `https://kigalispecialistsbarista.com/verify/XVZ4K-9QWPL-8HRTU`.
7. **Result:** Green **VALID** badge, Letitia's name + photo, program *Barista Foundation*, Certificate ID `KSB-CERT-2026-00001`, issue date, plus her **academic record** table with grades, scores, dates and assessors for the three modules.
8. **Confidence:** The employer confirms the certificate is genuine and hires the applicant.

---

### 9. Out of Scope (v1)

- Money/payment processing for training fees
- Student self-service login portal
- Pre-printed static certificate numbering without digital verification
- Public search of all students (privacy — verification must be certificate-based)