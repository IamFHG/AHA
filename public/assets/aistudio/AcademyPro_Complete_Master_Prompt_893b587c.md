# AcademyPro --- Complete Academy Management Web Application

## Master Build Specification for Google Gemini AI Studio and AI App Builders

**Document purpose:** This is the single, comprehensive source of truth
for building the application. Upload this Markdown file to the app
builder and instruct it to follow the specification end-to-end. Do not
omit requirements because they are detailed or appear in a later
section.

**Application name:** AcademyPro (configurable)\
**Primary users:** Academy owner/administrator, authorized staff,
students, and parents/guardians\
**Primary region and currency:** Pakistan; PKR\
**Application language:** English\
**Primary goal:** Manage student admissions and individual student
profiles, calculate admission-month fees correctly, issue monthly fee
vouchers, record payments, and let students/parents retrieve official
vouchers through a self-service portal.

------------------------------------------------------------------------

# 1. BUILD DIRECTIVE AND NON-NEGOTIABLE PRINCIPLES

Build a real, full-stack, responsive, database-backed web
application---not merely a static mockup, design prototype, or
collection of nonfunctional screens.

Implement the interface, data model, validation, authentication,
authorization, business logic, persistence, search, filters, reporting,
printing, export, error handling, and deployment instructions. Connect
every visible control to a real operation. Do not leave core buttons as
placeholders.

Follow these principles throughout development:

1.  **One source of truth:** Admin pages and the public student portal
    must use the same student, fee, voucher, and payment records.
2.  **Correct financial logic:** Admission-month fee is prorated,
    rounded to a whole rupee, and remains specific to that month. The
    next month uses the applicable regular monthly fee.
3.  **No decimal currency:** All final monetary amounts shown to users
    and stored as finalized financial amounts must be whole PKR
    integers. Never display `PKR 645.16` or `PKR 1,000.00`.
4.  **No silent financial changes:** Editing a student's profile, fee
    settings, discount, or status must not silently rewrite issued
    vouchers or historical payments.
5.  **Idempotency:** Retrying a voucher-generation or payment operation
    must not create duplicates.
6.  **Privacy by design:** A Student ID is an identifier, not a secret.
    The public portal must not expose unrestricted student records or
    rely on frontend-only security.
7.  **Auditability:** Important changes and financial corrections must
    be recorded.
8.  **Real data only:** Dashboard cards and reports must be calculated
    from stored records. Do not present fabricated statistics as real.
9.  **Mobile-first usability:** The app must be practical on Android
    phones, tablets, laptops, and desktop computers.
10. **No false completion claims:** Do not claim that a database is
    connected, tests passed, or deployment succeeded unless that has
    actually been implemented and verified.
11. **Incremental development:** Keep the app runnable as features are
    built. If the full scope cannot be completed in one pass, implement
    it in phases without replacing working functionality with mock data.
12. **Configuration transparency:** If Firebase or another service needs
    credentials, explain exactly what the owner must configure. Never
    pretend unavailable credentials are configured.

## 1.1 Recommended technology

Preferred stack, subject to the app builder's actual capabilities:

-   React
-   TypeScript
-   A maintained responsive component/CSS system
-   Firebase Authentication
-   Cloud Firestore
-   Firebase Storage for student photos and permitted documents
-   Trusted server-side functions/API endpoints for sensitive financial
    operations
-   Automated tests for fee calculations and critical workflows

Use currently supported SDKs and recommended security practices. If the
builder provides a different robust full-stack environment, preserve all
requirements and document the equivalent architecture. Do not put
privileged credentials or service-account keys in browser code.

------------------------------------------------------------------------

# 2. USER ROLES AND ACCESS

Implement role-based access control enforced by the trusted backend, not
only by hiding buttons.

## 2.1 Administrator

An authorized administrator may, according to assigned permissions:

-   Access the administration dashboard.
-   Create, view, edit, and manage student profiles.
-   Manage classes, subjects, academic sessions, and fee settings.
-   Generate and manage fee vouchers.
-   Record payments and issue receipts.
-   Apply discounts and approved adjustments.
-   Manage attendance.
-   View and export reports.
-   Configure academy details and public portal settings.
-   Manage staff accounts and permissions.
-   Review audit logs and perform permitted corrections.
-   Export data and run supported backups.

## 2.2 Staff

Staff permissions must be configurable. Depending on permissions, staff
may:

-   View permitted student profiles.
-   Register or update students.
-   Mark attendance.
-   Generate or view vouchers.
-   Record payments and issue receipts.
-   View selected reports.

Staff must not automatically receive access to user management,
sensitive settings, audit logs, or financial corrections.

## 2.3 Student/parent public visitor

Students and parents can use the public Student Fee Voucher Portal
without creating an account. Their permissions are strictly read-only.
They can retrieve eligible official vouchers, view the limited details
required to understand the voucher, print it, and save it as a PDF.

Public users must never be able to edit student records, change fees,
create vouchers, record payments, access administrative pages, or browse
the student database.

## 2.4 Secure first administrator setup

Do not create a universal hardcoded production username/password.
Provide a secure initial administrator setup process or document how the
owner creates the first authorized account. Never store plaintext
passwords.

------------------------------------------------------------------------

# 3. APPLICATION INFORMATION ARCHITECTURE

Create the following main areas:

1.  Public landing page / academy information
2.  Public Student Fee Voucher Portal
3.  Secure administrator/staff login
4.  Administration dashboard
5.  Student admission form
6.  Student directory
7.  Individual student profile
8.  Class and subject management
9.  Fee management
10. Fee voucher management
11. Payment management
12. Receipt view/printing
13. Attendance management
14. Reports and analytics
15. User and permissions management
16. Academy settings
17. Audit logs
18. Data export and backup tools

Suggested administration navigation:

-   Dashboard
-   Students
-   New Admission
-   Classes & Subjects
-   Fee Management
-   Fee Vouchers
-   Payments & Receipts
-   Attendance
-   Reports
-   Staff & Permissions
-   Audit Logs
-   Settings
-   Backup & Export

Use clear page titles, breadcrumbs where helpful, consistent buttons,
useful empty states, loading states, confirmation dialogs, and
success/error notifications.

------------------------------------------------------------------------

# 4. ACADEMY DASHBOARD

Create a polished dashboard driven by real database data.

## 4.1 Summary cards

Display:

-   Total students
-   Active students
-   Inactive students
-   Withdrawn students
-   Completed students
-   Recently admitted students
-   Fees generated for the selected month
-   Payments collected for the selected month
-   Total outstanding voucher balances
-   Unpaid vouchers
-   Partially paid vouchers
-   Overdue vouchers

Define each metric precisely. For example, "Payments Collected This
Month" means successful payment transactions recorded in the selected
calendar month, not vouchers generated in that month.

## 4.2 Dashboard panels

Include:

-   Recent admissions
-   Recent payments
-   Upcoming voucher due dates
-   Students with unpaid balances
-   Monthly collections chart
-   Monthly admissions chart
-   Class-wise student distribution
-   Quick actions

Quick actions:

-   Add Student
-   Open Student Directory
-   Generate Monthly Vouchers
-   Record Payment
-   Find/Print Voucher
-   Open Reports

Dashboard cards and charts must use actual stored records and update
after successful operations. Provide sensible empty states when no data
exists. Do not seed production dashboards with fabricated statistics.

------------------------------------------------------------------------

# 5. STUDENT ADMISSION AND REGISTRATION

Create a comprehensive, validated student admission form organized into
sections.

## 5.1 Personal information

Fields:

-   Student ID --- automatically generated, unique, and stable
-   Full student name --- required
-   Student photograph --- optional
-   Father's name --- required or configurable as required by the
    academy
-   Guardian's name --- optional if different
-   Gender --- optional/configurable
-   Date of birth --- optional
-   Student contact number --- optional
-   Father's contact number --- recommended
-   Guardian contact number --- optional
-   Home address --- optional
-   Emergency contact --- optional

Do not require a child to have a personal phone number. Allow a
guardian's number to be the primary contact.

## 5.2 Academic information

Fields:

-   Class/grade
-   Enrolled subjects
-   Academic session
-   Admission date --- required
-   Previous school --- optional
-   Previous academic details --- optional
-   Student status
-   Academic notes --- optional

## 5.3 Fee information

Fields:

-   Regular monthly fee --- whole PKR amount
-   Admission-month fee --- calculated automatically
-   Applicable discount/concession --- if authorized
-   Default voucher due-day or due-date policy
-   Special fee arrangement --- optional, permission-controlled
-   Fee schedule effective date

## 5.4 Administrative information

Fields:

-   Record creation timestamp
-   Created by
-   Last updated timestamp
-   Updated by
-   Admission remarks
-   Uploaded documents --- optional and protected
-   Source of admission --- optional

## 5.5 Form actions and validation

Provide:

-   Save
-   Save & Add Another
-   Cancel
-   Clear only with confirmation if data has been entered

Requirements:

-   Mark required fields clearly.
-   Validate on both frontend and trusted backend.
-   Preserve entered values when validation fails.
-   Prevent duplicate Student IDs.
-   Warn about likely duplicate records using a cautious match of name,
    father's name, and guardian contact; do not automatically merge
    records.
-   Show a confirmation after successful saving.
-   Allow authorized profile edits.
-   Record important changes in the audit log.
-   Do not use a mutable name, phone number, or admission date as the
    primary database identity.

------------------------------------------------------------------------

# 6. STUDENT ID RULES

Generate a unique Student ID automatically, using a configurable prefix,
such as `AP-2026-0001`. This is an example format, not a mandatory fixed
prefix.

Requirements:

-   The prefix must be configurable.
-   IDs must be unique and never silently reused.
-   Concurrent admissions must not create duplicate IDs.
-   Student ID must remain stable when the student changes class, name,
    fee, or status.
-   An authorized correction process may be available for a genuine ID
    error, but it must preserve the old identifier as an alias/audit
    record and must not break historical vouchers.
-   Do not expose internal database document IDs as the public Student
    ID unless deliberately configured and safe.
-   Provide a clear way for the administrator to copy or print a
    student's ID for the student/guardian.

------------------------------------------------------------------------

# 7. INDIVIDUAL STUDENT PROFILE --- REQUIRED CORE FEATURE

Every student must have a dedicated profile page, accessible from the
directory, dashboard lists, voucher lists, payment records, and search
results.

The profile header should show:

-   Student photograph or initials placeholder
-   Full name
-   Student ID
-   Father's name
-   Class/grade
-   Admission date
-   Student status
-   Quick actions: Edit Profile, Generate/View Voucher, Record Payment,
    Print Profile (if implemented)

## 7.1 Overview tab

Show:

-   Personal details
-   Academic details
-   Admission details
-   Current applicable monthly fee
-   Admission-month fee, where relevant
-   Total fees generated for a selected period
-   Total successful payments for a selected period
-   Outstanding voucher balance
-   Last payment date
-   Next due date
-   Current fee status

Avoid presenting "total fees generated" as "money collected." Label each
financial metric accurately.

## 7.2 Fee history tab

Show all vouchers in chronological order, including:

-   Fee month/year
-   Voucher number
-   Original/base fee
-   Admission-month calculation, if applicable
-   Discount
-   Authorized adjustment
-   Previous outstanding amount, if legitimately applied
-   Final payable amount
-   Amount paid
-   Remaining balance
-   Status
-   Issue date and due date

Actions: open voucher, print voucher, save as PDF through browser
printing, and view permitted details.

## 7.3 Payment history tab

Show successful payment transactions and permitted reversals:

-   Payment date/time
-   Receipt number
-   Related voucher number
-   Amount received
-   Payment method
-   Transaction reference, if applicable
-   Received by
-   Notes
-   Transaction status

Allow authorized users to open/print receipts. A profile edit must never
erase this history.

## 7.4 Attendance tab

Show daily attendance history and monthly summaries:

-   Present days
-   Absent days
-   Leave days
-   Attendance percentage
-   Class/session context

## 7.5 Academic information tab

Show classes, subjects, academic session, and relevant academic
notes/history.

## 7.6 Documents tab

Allow authorized staff to upload/view permitted admission documents.
Restrict file access, validate file types and sizes, and do not expose
private files publicly.

## 7.7 Notes and activity tab

Show administrative notes and a chronological event history, such as
admission created, profile updated, class changed, fee changed, voucher
generated, discount approved, payment received, payment reversed, and
status changed.

Restrict private administrative notes from the public portal.

------------------------------------------------------------------------

# 8. FEE CALCULATION POLICY --- CRITICAL BUSINESS LOGIC

This section is authoritative. All app modules must use the same fee
calculation engine.

## 8.1 Core rule

If a student joins partway through a calendar month, charge only for the
period from the admission date through the last calendar day of that
same month, inclusive.

The admission date is a chargeable day.

The final admission-month fee must be settled as a fee for that
admission month. Do not defer the calculation remainder into the
following month. From the next calendar month onward, the applicable
regular monthly fee is charged.

Do not confuse a fee calculation with payment settlement: if the parent
has not actually paid the issued voucher, the unpaid amount remains a
real unpaid voucher balance. The app must not falsely mark it paid or
silently forgive it. The specific admission-month fee must not be
recalculated or transferred to a later month merely because it remains
unpaid.

## 8.2 Default calendar-day formula

Let:

-   `M` = applicable regular monthly fee, stored as an integer PKR
    amount
-   `D` = number of calendar days in the admission month
-   `A` = day number of the admission date in that month
-   `C` = number of chargeable days

Formula:

`C = D - A + 1`

Raw fee:

`RawAdmissionFee = M × C / D`

Final fee:

`AdmissionMonthFee = round half up(RawAdmissionFee)`

Store the finalized amount as a whole-rupee integer. Do not store a
fractional rupee as the final payable amount. Use exact integer/rational
arithmetic or a safe decimal arithmetic method internally; avoid
floating-point rounding errors.

All UI, vouchers, receipts, reports, exports, and stored finalized
amounts must use whole PKR values without decimal places. Display
amounts with thousands separators when useful, e.g. `PKR 12,500`.

## 8.3 Required examples

For monthly fee PKR 1,000:

  -----------------------------------------------------------------------
  Admission date       Month length    Chargeable days              Final
                                                          admission-month
                                                                      fee
  -------------- ------------------ ------------------ ------------------
  October 1                      31                 31          PKR 1,000

  October 12                     31                 20            PKR 645

  October 20                     31                 12            PKR 387

  October 31                     31                  1             PKR 32

  November 1                     30                 30          PKR 1,000

  February 12,                   28                 17            PKR 607
  non-leap year                                        

  February 12,                   29                 18            PKR 621
  leap year                                            
  -----------------------------------------------------------------------

For monthly fee PKR 1,500 and admission date October 20:

`1500 × 12 / 31 = 580.645...`; final fee is **PKR 581**.

For monthly fee PKR 1,000 and admission date October 12:

`1000 × 20 / 31 = 645.161...`; final fee is **PKR 645**.

## 8.4 Rounding policy

-   Use round-half-up for the final fee.
-   Never display decimal places.
-   Reject negative fees.
-   Define how percentage discounts are rounded; use the same
    whole-rupee policy and show the calculation order.
-   Do not round a daily rate first and multiply it by days; calculate
    the complete prorated fraction, then round once at the defined
    finalization step.
-   Keep the original calculation inputs and calculated result for
    auditability.

## 8.5 Required boundary conditions

-   Admission on the first day of the month results in the full monthly
    fee.
-   Admission on the final day results in one chargeable day.
-   February must use 28 or 29 days as appropriate.
-   Handle month/year transitions correctly.
-   Use the academy's configured timezone for admission dates and fee
    periods.
-   Do not infer the admission date from the browser's current date.
-   Validate impossible dates.
-   Do not create an admission-month voucher twice.
-   A student admitted on the first day still follows the same formula
    and receives the full amount.

## 8.6 Following months

Beginning with the calendar month after admission, apply the regular
monthly fee that is effective for that fee period. Do not repeat the
admission-month proration in later months.

If a student's fee changes, keep historical voucher amounts unchanged.
Apply the new fee according to its effective date and an authorized
workflow.

## 8.7 Admin override

An authorized administrator may override the calculated admission-month
amount only through a clearly labeled adjustment process requiring:

-   Original calculated amount
-   Approved final amount
-   Reason
-   User who approved it
-   Timestamp
-   Related student and voucher

The official voucher must show the approved final payable amount and,
where useful, the adjustment clearly. Preserve the original calculation.
Do not permit silent edits.

## 8.8 Discounts and fee adjustments

Support fixed-amount discounts, percentage discounts, scholarships,
concessions, and other approved adjustments. Configure whether discounts
apply before or after proration. Show the order clearly and
consistently.

-   A discount must not accidentally make the payable amount negative.
-   Store the original fee, discount, adjustment, and final payable
    amount separately.
-   Record reason, approver, timestamp, and affected voucher.
-   Do not change historical payments when a discount is applied.
-   If a voucher is already issued, use an auditable
    correction/adjustment workflow rather than silently overwriting it.

## 8.9 Outstanding balance and carry-forward

A genuine unpaid balance is not the same thing as an unrounded
calculation remainder.

-   Never carry a fractional rounding remainder into the next month.
-   Do not automatically merge an admission-month voucher into the next
    month's regular fee.
-   If a real issued voucher remains unpaid, preserve it as outstanding.
-   The academy may configure whether legitimate unpaid balances are
    shown separately on a later statement or included in a consolidated
    statement.
-   If included, show the previous outstanding amount as a separate line
    item; never hide its origin.
-   Never mark a voucher as paid unless successful payment records cover
    its payable balance or an authorized auditable adjustment settles
    it.

------------------------------------------------------------------------

# 9. FEE SCHEDULES AND EFFECTIVE DATES

Do not store only one mutable monthly fee if the app must preserve
history.

Maintain fee schedules or fee-change history with:

-   Student ID
-   Fee amount in whole PKR
-   Effective-from date or fee period
-   Effective-to date where relevant
-   Reason for change
-   Authorized by
-   Timestamp

A new fee applies according to its effective date. Historical vouchers
must retain their issued amounts. When a fee change affects an
already-issued unpaid voucher, require a clear adjustment/correction
workflow with confirmation and an audit entry.

Support a default academy fee and optional class-specific or
student-specific fees. Define precedence explicitly:

1.  Approved student-specific fee schedule, if one is effective
2.  Approved class-specific fee schedule, if configured
3.  Academy default fee, if configured

Show which fee schedule was applied when a voucher was calculated.

------------------------------------------------------------------------

# 10. FEE VOUCHER GENERATION AND MANAGEMENT

Create a dedicated Fee Management area with filters for month/year,
class, student, status, issue date, and due date.

## 10.1 Voucher fields

Each voucher must include:

-   Unique voucher number
-   Student ID
-   Student name
-   Father's/guardian's name as configured for display
-   Class/grade
-   Admission date where relevant
-   Fee month and year
-   Issue date
-   Due date
-   Regular monthly fee
-   Admission-month proration details where applicable
-   Discount
-   Authorized adjustment
-   Legitimate outstanding balance, if configured to be included
-   Total payable
-   Amount paid
-   Remaining balance
-   Payment status
-   Payment instructions
-   Academy details

## 10.2 Voucher statuses

Use consistent statuses:

-   Unpaid
-   Partially Paid
-   Paid
-   Overdue

"Overdue" is derived from an unpaid remaining balance and a passed due
date, according to the academy timezone. Preserve enough underlying data
to distinguish whether the voucher is unpaid, partially paid, or
overdue. If using a single status field, define precedence and still
display balance state clearly.

Suggested precedence for a single displayed label:

-   Paid if remaining balance is zero
-   Overdue if remaining balance is positive and due date has passed
-   Partially Paid if some amount has been paid and a balance remains
    but it is not overdue
-   Unpaid if no payment has been made and it is not overdue

Keep payment totals and dates as the source of truth rather than relying
only on a manually editable status.

## 10.3 Monthly voucher generation

Allow authorized users to generate vouchers for:

-   One student
-   A selected class
-   All eligible active students
-   A selected fee month/year

Before bulk generation, show a preview:

-   Number of eligible students
-   Number of vouchers that will be created
-   Number already existing and therefore skipped
-   Expected total payable
-   Any students excluded and why

Require confirmation before executing a bulk operation.

Requirements:

-   Only eligible students receive new vouchers.
-   Apply admission-month proration only to the student's admission
    month.
-   Apply the effective regular fee in later months.
-   Do not create duplicate vouchers for the same student and fee
    period.
-   Do not overwrite a paid voucher.
-   Do not silently alter an issued voucher.
-   The operation must be safe to retry.
-   Use backend uniqueness checks/transactions or equivalent controls.
-   Return a clear success/skipped/failure summary.
-   A voucher lookup from the public portal must never create a voucher.
-   Do not generate future vouchers for inactive, withdrawn, or
    completed students unless an authorized explicit exception is
    configured.

## 10.4 Voucher numbering

Use a configurable prefix and unique sequence or collision-safe ID,
e.g. `FV-2026-0001`. This is an example. Ensure concurrent operations
cannot produce duplicate numbers. Voucher IDs must not be derived only
from student names.

------------------------------------------------------------------------

# 11. PRINTABLE VOUCHER DESIGN

Create a professional, clear, print-ready voucher that is suitable for
Pakistani academy use.

## 11.1 Academy header

-   Academy logo, if configured
-   Academy name
-   Address
-   Contact number
-   Optional email

## 11.2 Student and voucher details

-   Voucher number
-   Student ID
-   Student name
-   Father's name
-   Class/grade
-   Fee month/year
-   Admission date if relevant
-   Issue date
-   Due date

## 11.3 Financial breakdown

-   Regular monthly fee
-   Admission-month fee or proration description, when applicable
-   Discount
-   Authorized adjustment
-   Separately identified previous outstanding balance, if applicable
-   Other authorized charges
-   Total payable
-   Amount already paid
-   Remaining amount due
-   Status

All monetary values must be whole PKR amounts, without decimals.

## 11.4 Payment instructions and slip

Allow the administrator to configure payment instructions and a short
policy note. Include a detachable payment slip area when appropriate,
with student ID, voucher number, fee month, amount due, and space for
payment details.

## 11.5 Print requirements

-   A4 page support
-   Printer-friendly layout
-   Black-and-white compatibility
-   Clear typography and contrast
-   Proper page margins
-   Avoid clipped text and table overflow
-   Hide navigation, buttons, menus, and non-voucher interface elements
    during printing
-   Keep the voucher within the intended print page
-   Support browser Print and Save as PDF
-   Provide individual and batch voucher printing
-   Preview selected vouchers before batch printing

The printed voucher must match the official stored voucher. Printing
must not recalculate or change amounts.

------------------------------------------------------------------------

# 12. STUDENT SELF-SERVICE FEE VOUCHER PORTAL

This is a required public-facing feature.

## 12.1 Objective

Provide a public page where a student or parent can retrieve an
already-generated official fee voucher without creating an account.

Portal name: **Student Fee Voucher Portal**\
Primary action: **Get Your Fee Voucher**

The portal must share the same backend and records as the administration
system. Never build a separate student database or a second fee
calculation engine.

## 12.2 Portal interface

Show:

-   Academy logo
-   Academy name
-   Heading: Student Fee Voucher Portal
-   Brief instructions
-   Student ID field --- mandatory
-   Admission Date field --- optional in the interface, subject to the
    configured security policy
-   Fee Month selector
-   Fee Year selector
-   Get Fee Voucher button
-   Clear/Reset button
-   Search Another Voucher action after retrieval
-   Print Fee Voucher action
-   Save as PDF action or browser Print / Save as PDF guidance
-   Academy contact information

Make the page simple, accessible, responsive, and usable on a mobile
phone.

## 12.3 Student ID lookup

-   Student ID is mandatory.
-   Match the ID against an existing student record using safe
    normalization rules.
-   Do not permit lookup by name, father's name, or phone number alone.
-   Do not reveal detailed student information before verification.
-   Do not expose internal database IDs.
-   If the admission date is entered, validate it against the stored
    admission date on the trusted backend.
-   If the date is incorrect, do not display the voucher or personal
    details.
-   If the date is omitted, follow the administrator's security setting.
-   The portal must be read-only.

## 12.4 Security policy for optional admission date

A Student ID is an identifier, not a secret. An optional admission date
does not make ID-only access secure by itself.

Recommended default security behavior:

-   Student ID is mandatory.
-   Admission Date is optional in the visible form but required by
    default for verification before releasing full voucher details.
-   The administrator may explicitly enable Student-ID-only retrieval
    after being warned about privacy implications.
-   When ID-only retrieval is enabled, return only the minimum
    information needed to retrieve the voucher.
-   If stronger verification is configured, support a one-time code sent
    to the registered guardian contact through a real configured
    messaging provider. Do not claim this feature is active unless it
    has been implemented and configured.

The UI must explain when an additional verification field is required by
the academy's security policy.

## 12.5 Fee month/year selection

-   Allow the user to choose the desired fee month and year.
-   Default to the current fee month when appropriate.
-   Limit retrieval to months allowed by the portal settings.
-   Retrieve only existing eligible vouchers.
-   If the voucher has not been generated, show a clear message and do
    not create it automatically.
-   Do not expose a student's entire fee history by default; retrieve
    only the requested voucher unless settings and verification
    explicitly permit more.

## 12.6 Voucher contents shown to student/parent

Display only information appropriate for the student's own voucher:

-   Academy name, logo, and contact information
-   Student ID
-   Student name
-   Father's/guardian's name where configured
-   Class/grade
-   Voucher number
-   Fee month/year
-   Issue and due dates
-   Regular fee and admission-month proration where relevant
-   Approved discount/adjustment
-   Legitimate outstanding amount if configured
-   Total payable
-   Amount paid
-   Remaining balance
-   Payment status
-   Payment instructions

Never show internal administrative notes, audit logs, staff private
details, unrelated students, private documents, or unrestricted payment
histories.

## 12.7 Public portal behavior and messages

Use clear, non-sensitive messages, including:

-   Missing Student ID: "Please enter your Student ID."
-   Failed lookup: "Unable to retrieve the requested voucher. Please
    verify your details or contact the academy administration."
-   Verification mismatch: "The supplied details could not be verified.
    Please check the information and try again."
-   Voucher unavailable: "Your fee voucher for the selected month is not
    available yet. Please contact the academy administration."
-   Successful retrieval: "Your fee voucher is ready."
-   Portal disabled: "The Student Fee Voucher Portal is currently
    unavailable. Please contact the academy administration."

Avoid revealing whether an ID belongs to a particular person or
returning detailed technical/database errors.

## 12.8 Portal security

Implement:

-   Trusted backend validation for lookups
-   Rate limiting
-   Protection against automated Student ID enumeration
-   Monitoring of repeated suspicious requests where supported
-   No unrestricted public database reads
-   No privileged credentials in frontend code
-   No reliance on frontend checks as the only protection
-   Minimal response data
-   Appropriate cache controls for private voucher data
-   Access restrictions on student photos/documents
-   Safe handling of errors and logs

Do not return the complete student document to the browser if the portal
only needs a limited voucher view.

## 12.9 Admin portal settings

Add a "Student Self-Service Portal" section with:

-   Enable/disable portal
-   Allowed voucher months
-   Require admission-date verification
-   Permit Student-ID-only lookup
-   Permit retrieval of partially paid vouchers
-   Permit retrieval of fully paid vouchers
-   Permit inactive students to retrieve historical vouchers
-   Show/hide remaining balance
-   Academy contact details shown publicly
-   Public instructions
-   Optional stronger verification integration status

Default recommendations:

-   Portal enabled after administrator setup
-   Student ID mandatory
-   Admission-date verification required before releasing full voucher
    details
-   ID-only retrieval disabled unless explicitly enabled
-   Public portal is read-only
-   No public database browsing
-   No automatic voucher generation

## 12.10 Public portal tests

Test:

1.  Valid Student ID and correct admission date.
2.  Valid Student ID with date omitted when policy permits.
3.  Date omitted when policy requires it.
4.  Incorrect admission date.
5.  Invalid Student ID.
6.  Existing voucher.
7.  Voucher not generated.
8.  Voucher month not allowed by settings.
9.  Partially paid voucher.
10. Fully paid voucher.
11. Inactive student under each configured policy.
12. Manipulated requests attempting to access another student's data.
13. Repeated lookups and rate limiting.
14. Mobile and desktop layouts.
15. Print and Save as PDF behavior.
16. Confirmation that portal access cannot edit any record or create a
    voucher.

------------------------------------------------------------------------

# 13. PAYMENT RECORDING

Create a payment module connected to students and vouchers.

## 13.1 Payment form

Fields:

-   Student search/selection
-   Student profile link
-   Voucher selection
-   Payment date/time
-   Amount received --- positive whole PKR integer
-   Payment method
-   Transaction reference --- optional
-   Received by
-   Notes --- optional

Payment methods:

-   Cash
-   Bank transfer
-   Mobile wallet
-   Other

## 13.2 Payment rules

-   Reject zero or negative payment amounts.
-   Accept whole PKR values only.
-   Validate the voucher and remaining balance on the trusted backend.
-   Do not allow payment to exceed the remaining balance unless the
    academy has explicitly enabled and implemented advance payments.
-   If advance payments are supported, record them separately and apply
    them only through an explicit, auditable allocation workflow.
-   Update voucher paid totals and balances atomically.
-   A successful payment must generate a unique receipt number.
-   A duplicate submission must not create another payment.
-   Payment status must reflect the actual successful transactions.
-   Preserve payment records even if the student's status or fee
    schedule changes.
-   Do not delete a financial transaction silently.
-   Correct mistaken payments using a reversal/correction workflow with
    reason, user, timestamp, and audit entry.

## 13.3 Balance calculations

For a voucher:

`Remaining Balance = Total Payable - Successful Payments Allocated to Voucher`

Ensure remaining balance cannot be accidentally negative under the
normal payment policy. If the system supports explicit credits or
advance payments, represent them as separate ledger records rather than
silently producing negative voucher balances.

## 13.4 Payment receipts

Generate a unique receipt for each successful payment.

Receipt includes:

-   Academy name/logo/contact
-   Receipt number
-   Student name and ID
-   Father's/guardian's name if configured
-   Payment date
-   Amount received in whole PKR
-   Related voucher number
-   Fee month/year
-   Payment method
-   Remaining voucher balance
-   Received by
-   Authorized signature area

Provide print and Save as PDF through browser printing. Receipt output
must match the stored transaction and must not create a payment.

------------------------------------------------------------------------

# 14. DISCOUNTS, SCHOLARSHIPS, AND ADJUSTMENTS

Support:

-   Fixed-amount discounts
-   Percentage discounts
-   Scholarship concessions
-   Special concessions
-   Approved charges or credits
-   Admission-month fee overrides

For each discount/adjustment, store:

-   Student ID
-   Related voucher if applicable
-   Adjustment type
-   Amount/rate
-   Reason
-   Effective date
-   Approved by
-   Timestamp
-   Original amount
-   Resulting amount

Rules:

-   Whole PKR amounts for finalized money values.
-   Validate the percentage range.
-   Prevent unintended negative payable amounts.
-   Show original fee, discount, adjustment, and final payable
    separately.
-   Configure whether discount is applied before or after
    admission-month proration.
-   Keep the calculation order consistent across the admin app and
    public portal.
-   Preserve issued voucher history.
-   Require an authorized correction process for an issued voucher.
-   Never silently alter payments as a side effect of a discount.

------------------------------------------------------------------------

# 15. STUDENT STATUS AND WITHDRAWAL

Supported statuses:

-   Active
-   Inactive
-   Withdrawn
-   Completed

When status changes:

-   Preserve profile and financial history.
-   Record status change, reason where appropriate, user, and timestamp.
-   Stop future automatic voucher generation when the status makes the
    student ineligible.
-   Continue to show genuine outstanding balances to authorized staff.
-   Follow portal settings for historical voucher access.
-   Permit authorized reactivation.
-   Do not delete the student record as a shortcut for withdrawal.
-   Clearly distinguish archived/withdrawn students from active students
    in search and reports.

------------------------------------------------------------------------

# 16. ATTENDANCE MANAGEMENT

Implement a practical attendance module.

Features:

-   Mark daily attendance by class
-   Present, Absent, and Leave statuses
-   Student-specific attendance history
-   Date and class filters
-   Monthly attendance summaries
-   Present/absent/leave counts
-   Attendance percentage
-   Printable attendance sheets
-   Attendance exports where supported

Rules:

-   Attendance must reference the correct student, class, date, and
    academic session.
-   Prevent duplicate attendance entries for the same
    student/date/session unless a permitted correction is made.
-   Corrections must be auditable.
-   Attendance must not change fees automatically unless a separately
    configured, explicitly implemented policy permits it.
-   Do not infer attendance from fee payment status.

------------------------------------------------------------------------

# 17. CLASSES, SUBJECTS, AND ACADEMIC SESSIONS

Allow administrators to create, edit, deactivate, and manage:

-   Classes/grades
-   Subjects
-   Class-subject assignments
-   Academic sessions
-   Student class enrolments

Each student must reference the appropriate class and enrolled subjects.

Requirements:

-   Validate class and subject references.
-   Allow class/subject changes without deleting history.
-   Preserve historical class/session context for attendance and
    reports.
-   Prevent deleting a class or subject that is still referenced by
    active/historical records; offer archive/deactivate behavior
    instead.
-   Allow multiple subjects per student.
-   Make academic session fields configurable.

------------------------------------------------------------------------

# 18. SEARCH, FILTERING, SORTING, AND PAGINATION

Provide global and contextual search.

Student search fields:

-   Student ID
-   Student name
-   Father's name
-   Contact number, subject to staff permissions

Filters:

-   Class
-   Subject
-   Academic session
-   Admission month/year
-   Student status
-   Fee month/year
-   Voucher status
-   Outstanding balance
-   Payment date range

Sorting:

-   Student name
-   Student ID
-   Admission date
-   Monthly fee
-   Outstanding balance
-   Voucher due date
-   Payment date

Requirements:

-   Search results link to the relevant profile or record.
-   Provide pagination or efficient list loading.
-   Preserve filters when navigating back where practical.
-   Show a clear "no results" state.
-   Do not allow the public portal to use general student search.

------------------------------------------------------------------------

# 19. REPORTS AND ANALYTICS

Provide report filters for month, year, date range, class, status, and
other relevant fields.

## 19.1 Student reports

-   All students
-   Active students
-   Inactive students
-   Withdrawn/completed students
-   Recent admissions
-   Admission register
-   Class-wise student list
-   Subject-wise enrolment

## 19.2 Financial reports

-   Monthly vouchers generated
-   Monthly payments collected
-   Daily collection report
-   Outstanding fee report
-   Student-wise payment history
-   Unpaid vouchers
-   Partially paid vouchers
-   Overdue vouchers
-   Discount/concession report
-   Fee adjustment report
-   Reversed payment report
-   Fee schedule change report

## 19.3 Attendance reports

-   Daily attendance
-   Monthly attendance
-   Student-wise attendance
-   Class-wise attendance

## 19.4 Report correctness

-   Fees generated are not the same as payments collected.
-   Only successful payment transactions count as collections.
-   Reversed payments must not be counted as successful collections.
-   Outstanding totals must be based on real remaining voucher balances
    and explicitly defined credit allocation.
-   Avoid double-counting a payment in reports.
-   All final amounts must be whole PKR.
-   Provide CSV export for tabular reports where appropriate.
-   Provide print-friendly report views.
-   Display the selected date range and filter criteria on reports.

------------------------------------------------------------------------

# 20. ACADEMY SETTINGS

Create a protected settings area.

## 20.1 Academy identity

-   Academy name
-   Logo
-   Address
-   Contact number
-   Email address
-   Optional website/social information
-   Voucher footer text
-   Payment instructions
-   Receipt footer/signature text

## 20.2 Academic setup

-   Classes
-   Subjects
-   Academic sessions

## 20.3 Fee setup

-   Default monthly fee
-   Class-specific fee schedules
-   Student-specific fee schedules
-   Effective dates
-   Default voucher due date or due-day policy
-   Admission-month calculation policy
-   Whole-rupee rounding policy
-   Discount calculation order
-   Outstanding balance presentation/carry-forward policy
-   Permitted payment methods
-   Rules for advance payments, if supported

## 20.4 Identifier settings

-   Student ID prefix
-   Voucher number prefix
-   Receipt number prefix

## 20.5 Portal settings

Include all settings specified in Section 12.9.

## 20.6 Change safety

-   Restrict settings to authorized roles.
-   Log significant changes.
-   Show confirmation for consequential changes.
-   Do not retroactively alter issued vouchers when defaults change.
-   Clearly identify which settings affect only new records and which
    require a controlled migration/correction.

------------------------------------------------------------------------

# 21. DATABASE DESIGN AND RELATIONSHIPS

Use a reliable database-backed architecture. If using Firebase, use
Authentication, Firestore, Storage, and trusted backend functions as
needed.

Suggested collections/tables:

1.  `students`
2.  `studentIdAliases` or equivalent if ID corrections are supported
3.  `classes`
4.  `subjects`
5.  `academicSessions`
6.  `enrolments` or class history, if needed
7.  `feeSchedules`
8.  `feeVouchers`
9.  `payments`
10. `paymentAllocations` if payments can be allocated across vouchers
11. `receipts` or receipt data associated with payment transactions
12. `feeAdjustments`
13. `attendance`
14. `academySettings`
15. `users`
16. `rolesPermissions` or equivalent
17. `auditLogs`
18. `backupJobs`/export metadata where appropriate

## 21.1 Student record

Include a stable internal ID and a separate public Student ID. Store
personal and academic details, admission date, status, timestamps, and
relevant references. Store fee schedules separately or maintain an
effective-dated history so edits do not erase prior terms.

## 21.2 Voucher record

Include:

-   Stable voucher ID
-   Unique voucher number
-   Student reference
-   Fee month/year
-   Fee period start/end where useful
-   Fee schedule reference/version
-   Original monthly fee
-   Admission date and proration inputs where relevant
-   Calculated admission-month amount
-   Approved override/adjustment
-   Discount and charges
-   Previous outstanding amount if explicitly included
-   Final payable amount as whole PKR
-   Paid amount derived from successful allocations/transactions
-   Remaining balance
-   Issue date
-   Due date
-   Status/derived status
-   Creation and update metadata
-   Voucher version or immutable issued snapshot

Enforce uniqueness for one normal voucher per student and fee period,
with a controlled exception process only if the academy has a legitimate
alternative fee structure. Do not use a client-side check alone to
prevent duplicates.

## 21.3 Payment record

Include:

-   Stable payment ID
-   Unique receipt number
-   Student reference
-   Voucher reference or explicit allocation references
-   Amount as whole PKR
-   Payment date/time
-   Payment method
-   Reference number if provided
-   Received by
-   Transaction status
-   Reversal/correction linkage
-   Notes
-   Creation metadata
-   Idempotency key or equivalent duplicate-submission protection

## 21.4 Attendance record

Include student reference, class/session, date, status, recorded by,
timestamps, and correction history as needed. Prevent duplicates for the
same student/date/session under normal operation.

## 21.5 Audit record

Include event type, record reference, actor/user ID, timestamp, summary,
and appropriate before/after values for important changes. Never log
passwords, access tokens, or unnecessary sensitive secrets.

## 21.6 Database constraints and indexes

Create suitable indexes for common queries:

-   Student ID
-   Student name where supported
-   Student status
-   Class
-   Admission date
-   Voucher student/month
-   Voucher status/due date
-   Payment date
-   Student payment history
-   Attendance class/date

Document required indexes and backend rules. Validate all references and
amounts on trusted server operations.

------------------------------------------------------------------------

# 22. SECURITY AND PRIVACY

Implement security as a functional requirement, not merely a visual
setting.

-   Authentication for private admin/staff records
-   Role-based authorization enforced on the backend
-   Least-privilege database access
-   Secure file access
-   Validated uploads and reasonable size limits
-   Server-side validation of financial operations
-   Rate limiting for public lookup endpoints
-   Protection against Student ID enumeration
-   No privileged keys in frontend code
-   No plaintext passwords
-   Safe error messages
-   Appropriate session handling
-   Audit logs for consequential changes
-   No unrestricted public Firestore/database reads
-   No public access to private student documents/photos
-   No sensitive data in URLs or analytics logs
-   No use of student data for unrelated purposes

The public voucher endpoint should return only the fields needed to
render the requested voucher after the configured verification succeeds.

If Firebase is used, configure Firebase Authentication, Firestore
security rules, Storage rules, and trusted functions correctly. Do not
use permissive development rules in production.

------------------------------------------------------------------------

# 23. DATA EXPORT, BACKUP, AND RESTORE

Allow authorized administrators to export:

-   Student directory
-   Student profiles in a suitable structured format
-   Fee schedules
-   Vouchers
-   Payment records
-   Attendance
-   Reports

Support CSV for tabular data. If JSON export is implemented, document
the schema.

Provide a documented backup approach supported by the selected backend.
Distinguish clearly between:

-   A report/export
-   A logical data export
-   A complete restorable database backup

Requirements:

-   Validate imports before saving.
-   Preview import changes where practical.
-   Prevent duplicate student IDs, vouchers, and payments.
-   Do not overwrite historical financial data without explicit
    authorization and validation.
-   Record import/export actions in the audit log where appropriate.
-   Provide clear restore instructions.
-   Do not claim a backup is complete unless all required data and file
    references are covered.

------------------------------------------------------------------------

# 24. USER INTERFACE AND VISUAL DESIGN

Design a premium, clean, modern, professional academy administration
product.

Design goals:

-   Clear hierarchy
-   Consistent typography
-   Readable tables
-   Practical forms
-   Good spacing
-   Professional icons
-   Restrained, purposeful color use
-   Attractive but understated summary cards
-   Consistent button sizes and labels
-   Clear success/error states
-   Useful empty states
-   Accessible contrast
-   No clutter
-   No unnecessary animations
-   No oversized decorative graphics that interfere with work

Use a coherent design system for colors, typography, spacing, borders,
cards, buttons, form controls, dialogs, and tables. The design should
feel cohesive across admin and public portal.

The public voucher portal should be simpler than the admin interface and
should not expose admin navigation.

------------------------------------------------------------------------

# 25. RESPONSIVE DESIGN AND ACCESSIBILITY

Support:

-   Android phones
-   iPhones
-   Tablets
-   Laptops
-   Desktop screens

Requirements:

-   Responsive navigation/sidebar
-   Touch-friendly controls
-   Mobile-friendly admission forms
-   Student profiles readable on narrow screens
-   Data tables that adapt using horizontal scrolling or responsive
    cards
-   Filters usable on phones
-   Voucher print layout independent of the screen layout
-   Responsive public portal
-   Keyboard-accessible form controls
-   Visible focus states
-   Labels associated with inputs
-   Useful validation messages
-   Semantic headings and buttons
-   Accessible contrast
-   Do not rely on color alone to communicate payment status

Do not simply shrink the desktop interface. Adapt layout and interaction
for smaller screens.

------------------------------------------------------------------------

# 26. VALIDATION, ERRORS, LOADING, AND RECOVERY

Validate on the client for usability and on the trusted backend for
correctness/security.

Examples:

-   Required student name cannot be empty.
-   Admission date must be valid.
-   Monthly fee cannot be negative.
-   Finalized fee amounts must be whole PKR integers.
-   Payment amounts must be positive whole integers.
-   Discount percentage must be within the configured range.
-   Discounts must not create unintended negative payable amounts.
-   Student ID must be unique.
-   Voucher must reference an existing student and valid fee period.
-   Duplicate voucher generation must be prevented.
-   Duplicate payment submission must be prevented.
-   Unauthorized operations must fail safely.
-   An invalid date or malformed request must not crash the app.

Provide:

-   Loading indicators
-   Disabled submit buttons while a request is in progress
-   Clear success messages only after confirmed success
-   Clear error messages
-   Retry guidance for temporary network failures
-   Confirmation for consequential actions
-   Empty states
-   Safe cancellation
-   Recovery from interrupted bulk operations

Never show a success notification if the underlying operation failed. Do
not expose stack traces, credentials, database rules, or internal
implementation details to public users.

------------------------------------------------------------------------

# 27. AUTOMATED TESTING AND ACCEPTANCE TESTS

Write and execute tests where the builder supports testing. Do not claim
a test passed unless it was run.

## 27.1 Fee calculation tests

For a monthly fee of PKR 1,000:

-   October 1: PKR 1,000
-   October 12: PKR 645
-   October 20: PKR 387
-   October 31: PKR 32
-   November 1: PKR 1,000
-   February 12 in a non-leap year: PKR 607
-   February 12 in a leap year: PKR 621

For monthly fee PKR 1,500 and October 20 admission: PKR 581.

Test:

-   Half-up rounding boundaries
-   First and last day of month
-   28-day February
-   29-day February
-   Year transitions
-   Invalid dates
-   Whole-rupee validation
-   No floating-point precision errors
-   Discount order
-   Authorized manual override and audit trail
-   Fee schedule effective dates

## 27.2 Student tests

-   Create a student.
-   Generate a unique ID.
-   Open the profile.
-   Edit personal information.
-   Confirm fee history is preserved.
-   Confirm payment history is preserved.
-   Change class/status.
-   Confirm historical class/financial records remain available.
-   Check duplicate warnings.

## 27.3 Voucher tests

-   Generate admission-month voucher.
-   Confirm correct prorated fee.
-   Generate next month's voucher.
-   Confirm regular fee applies.
-   Retry generation.
-   Confirm no duplicate.
-   Confirm a fee edit does not silently change an issued voucher.
-   Confirm a paid voucher cannot be overwritten.
-   Test bulk preview, skipped records, and partial failures.

## 27.4 Payment tests

-   Full payment
-   Partial payment
-   Multiple partial payments
-   Exact remaining balance
-   Correct status
-   Unique receipt
-   Duplicate submit protection
-   Reversal/correction
-   Prevent overpayment unless explicit advance payment support is
    enabled
-   Reports exclude reversed transactions from successful collections

## 27.5 Public portal tests

-   Valid ID and correct admission date
-   Omitted date when permitted
-   Omitted date when required
-   Incorrect date
-   Invalid ID
-   Missing voucher
-   Allowed/disallowed fee month
-   Partially paid and fully paid voucher policy
-   Inactive student policy
-   Attempted access to another student's data
-   Enumeration protection and rate limiting
-   No editing or voucher creation
-   Print/PDF behavior on mobile and desktop

## 27.6 Security tests

-   Unauthenticated user cannot access private admin records.
-   Staff permissions are enforced.
-   Public user cannot query the full database.
-   Public user cannot edit student/voucher/payment records.
-   Sensitive operations are not authorized solely by frontend
    validation.
-   Uploaded private files are not publicly exposed.
-   Secrets are not bundled into frontend code.

## 27.7 Final end-to-end test

Test the complete workflow:

1.  Administrator signs in.
2.  Administrator configures academy details and fee rules.
3.  Administrator registers a student with an admission date.
4.  App generates a unique Student ID.
5.  App calculates the admission-month fee.
6.  Administrator generates the official voucher.
7.  Student/parent retrieves the voucher through the public portal under
    the configured verification policy.
8.  Student/parent prints or saves the voucher as PDF.
9.  Administrator records a payment.
10. App issues a receipt and updates the balance.
11. Student profile shows the correct voucher/payment history.
12. Reports show generated fees and actual collections separately.
13. The audit log records relevant changes.

------------------------------------------------------------------------

# 28. DEVELOPMENT PHASES

Build in a sequence that keeps the application runnable.

## Phase 1 --- Foundation

-   Project setup
-   Design system
-   Navigation
-   Authentication
-   Database configuration
-   Secure initial administrator setup

## Phase 2 --- Students

-   Admission form
-   Unique Student IDs
-   Student directory
-   Student profiles
-   Search/filter

## Phase 3 --- Fee logic

-   Fee schedules
-   Admission-month calculation
-   Whole-rupee rounding
-   Effective dates
-   Discounts and authorized adjustments

## Phase 4 --- Vouchers

-   Voucher numbering
-   Single and bulk generation
-   Duplicate protection
-   Voucher management
-   Printing and Save as PDF

## Phase 5 --- Payments

-   Payment form
-   Balance calculation
-   Receipts
-   Partial payments
-   Corrections/reversals
-   Payment history

## Phase 6 --- Public student portal

-   Student ID lookup
-   Verification policy
-   Fee month/year selector
-   Read-only voucher retrieval
-   Rate limiting and privacy controls
-   Print/PDF

## Phase 7 --- Academy operations

-   Classes and subjects
-   Academic sessions
-   Attendance
-   Student status handling

## Phase 8 --- Reports and controls

-   Dashboard analytics
-   Reports
-   CSV export
-   Audit logs
-   Staff permissions
-   Settings
-   Backup guidance

## Phase 9 --- Quality and deployment

-   Responsive testing
-   Accessibility checks
-   Security checks
-   Automated tests
-   Fix errors
-   Environment configuration
-   Deployment instructions
-   Final acceptance checklist

Do not skip testing of fee calculations, voucher uniqueness, payment
integrity, or public portal access control.

------------------------------------------------------------------------

# 29. DEPLOYMENT AND HANDOVER

Provide:

-   Application run instructions
-   Required environment variables
-   Backend/database setup instructions
-   Authentication configuration
-   Storage configuration, if used
-   Database rules and indexes
-   Trusted function/API deployment steps
-   Local development instructions
-   Production deployment steps
-   Admin account setup procedure
-   Backup/restore guidance
-   Troubleshooting instructions

Use environment variables for configuration and never commit secrets.
Include a safe example environment file containing placeholders, not
real credentials.

Clearly list any feature that remains unimplemented or requires external
credentials. Do not label an incomplete feature as production-ready.

------------------------------------------------------------------------

# 30. FINAL ACCEPTANCE CHECKLIST

The application is not complete until all applicable requirements below
are implemented and verified:

-   [ ] Secure administrator login and role-based permissions
-   [ ] Unique, stable Student IDs
-   [ ] Comprehensive admission form
-   [ ] Dedicated profile for every student
-   [ ] Student photo/document handling with access controls
-   [ ] Student directory, search, filters, and sorting
-   [ ] Effective-dated fee schedules
-   [ ] Correct calendar-day admission-month fee calculation
-   [ ] Admission date counted as a chargeable day
-   [ ] Whole PKR amounts only; no decimal display
-   [ ] Correct half-up rounding
-   [ ] Correct leap-year handling
-   [ ] Full regular fee from the next calendar month
-   [ ] No artificial carry-forward of rounding remainders
-   [ ] Real unpaid vouchers remain accurately outstanding
-   [ ] Controlled fee overrides with reasons and audit history
-   [ ] Discounts and adjustments with traceability
-   [ ] Unique voucher numbers
-   [ ] Single and bulk voucher generation
-   [ ] Duplicate voucher prevention
-   [ ] Printable A4 vouchers
-   [ ] Browser Print / Save as PDF
-   [ ] Payment recording and partial payments
-   [ ] Unique receipts
-   [ ] Duplicate payment protection
-   [ ] Auditable payment corrections/reversals
-   [ ] Correct remaining balances and statuses
-   [ ] Student/parent public voucher portal
-   [ ] Mandatory Student ID
-   [ ] Optional admission-date field governed by security settings
-   [ ] Fee month/year selector
-   [ ] Public portal retrieves existing official vouchers only
-   [ ] Public portal never creates or modifies vouchers
-   [ ] Rate limiting and protection against ID enumeration
-   [ ] No unrestricted public student database access
-   [ ] Attendance module
-   [ ] Class, subject, and academic session management
-   [ ] Reports that distinguish fees generated from payments collected
-   [ ] CSV export and documented backup approach
-   [ ] Audit logs
-   [ ] Mobile, tablet, and desktop usability
-   [ ] Accessible controls and readable print layouts
-   [ ] Critical automated and end-to-end tests executed
-   [ ] Setup and deployment documentation supplied
-   [ ] No fake data represented as real
-   [ ] No false claims about tests, integrations, or deployment

------------------------------------------------------------------------

# 31. FINAL INSTRUCTION TO THE APP BUILDER

Treat this document as the complete product specification.

Before coding, summarize the architecture and implementation plan
briefly, identify any genuine platform limitations, and then begin
implementation. Do not stop after producing a plan or mockup.

Implement the application in phases, keeping existing working code and
data models intact as later modules are added. Use shared components and
one authoritative fee calculation service. All financial calculations
and sensitive record operations must be validated by a trusted backend.

The most important business workflow is:

**Register student → assign unique Student ID → calculate
admission-month fee → generate official voucher → allow student/parent
to retrieve the existing voucher through the public portal → record
payment → issue receipt → update balance and student profile → reflect
real figures in reports.**

The core financial rule is:

**Prorate the admission month using actual calendar days, include the
admission date, round the final amount half-up to a whole PKR, and
charge the applicable regular monthly fee beginning the next calendar
month. Never silently transfer a rounding remainder or change historical
financial records.**

The core transparency rule is:

**The administrator and student portal must use the same official stored
voucher. The public portal is read-only, Student ID is mandatory, and
admission-date verification follows the configured security policy.**

Finish only after implementing the features, testing critical workflows,
fixing discovered errors, and documenting any remaining configuration
steps.
