# REQ-011-profile-headline-location-mentorship — Review Packet (round 2)

`Packet: 40KB · round 2 · 11 files in this round`

## Round 2 — what changed since round 1

Open findings addressed by the fix round (all actionable ones): UI-001, UI-002, ARCH-003 (features/me), ARCH-001 (AlumniDTO/AlumniManager), QUAL-001, QUAL-002 (features/profile), QUAL-003 (Switch comment). Needs-your-call items (REFL-001, REFL-002, CORR-001, ARCH-002) are untouched by design.

Source files in this round are inlined below with full context (uncommitted working tree vs HEAD). Test and markdown files changed in this round, read directly via `git diff HEAD -- <path>` (required reading, not a packet gap): packages/backend/src/businessLogic/src/AlumniManager.test.ts packages/backend/src/dal/query/AlumniQuery.test.ts packages/frontend/src/features/me/ProfileForm.test.tsx packages/frontend/src/features/profile/README.md

Base for round 1 was `redesign`; this round diffs the working tree against HEAD (the last commit on the feature branch). The round-1 spec and architecture are unchanged (see requirement.md, architecture.md).

## Diff with full context (round 2 source files)

```diff
diff --git a/packages/backend/src/businessLogic/src/AlumniManager.ts b/packages/backend/src/businessLogic/src/AlumniManager.ts
index b2523fce..271bd907 100644
--- a/packages/backend/src/businessLogic/src/AlumniManager.ts
+++ b/packages/backend/src/businessLogic/src/AlumniManager.ts
@@ -1,55 +1,56 @@
 import { AlumniDTO, AlumniQuery } from "@alumni/dal";
 import { AppError, isUniqueViolation } from "./errors.js";
 import { parseAlumniSearch, requireId, validateAlumniFields } from "./validation.js";
 
 export class AlumniManager {
   alumniQuery: AlumniQuery;
 
   constructor() {
     this.alumniQuery = new AlumniQuery();
   }
 
   // POST /api/alumni: creates the caller's own profile. `userId` comes from the token, never the body.
   public async createAlumni(userId: number, body: Record<string, unknown>) {
     const existing = await this.alumniQuery.findAlumniByUserId(userId);
     if (existing) throw new AppError(409, "You already have an alumni profile");
     const f = validateAlumniFields(body);
     // validateAlumniFields returns years as text; the columns are INTEGER, so pass numbers.
-    const alumni = Object.assign(new AlumniDTO(userId), {
+    const alumni = new AlumniDTO({
       ...f,
+      user_id: userId,
       graduation_year: f.graduation_year === undefined ? undefined : Number(f.graduation_year),
       start_year: f.start_year === undefined ? undefined : Number(f.start_year),
     });
     try {
       return await this.alumniQuery.createAlumni(alumni);
     } catch (error) {
       // alumni.user_id is UNIQUE: a concurrent create for the same user lands here.
       if (isUniqueViolation(error)) {
         throw new AppError(409, "You already have an alumni profile");
       }
       throw error;
     }
   }
 
   // GET /api/alumni/:id. A malformed or unknown id is 404.
   public async findAlumniById(id: unknown) {
     const alumni = await this.alumniQuery.findAlumniById(requireId(id, "Alumni"));
     if (!alumni) throw new AppError(404, "Alumni not found");
     return alumni;
   }
 
   // PUT /api/alumni/:id: only the row's owner may edit it (admins included). user_id can't change.
   public async updateOwnAlumni(requesterId: number, alumniId: unknown, body: Record<string, unknown>) {
     const id = requireId(alumniId, "Alumni");
     const existing = await this.alumniQuery.findAlumniById(id);
     if (!existing) throw new AppError(404, "Alumni not found");
     if (existing.user_id !== requesterId) throw new AppError(403, "You can only edit your own profile");
     return this.alumniQuery.updateAlumni(id, validateAlumniFields(body));
   }
 
   // GET /api/alumni: validates the raw query string first (AppError 400), so bad input never reaches SQL.
   public async searchAlumni(query: Record<string, unknown>) {
     const { filters, page, pageSize } = parseAlumniSearch(query);
     return this.alumniQuery.searchAlumni(filters, { limit: pageSize, offset: (page - 1) * pageSize });
   }
 }
diff --git a/packages/backend/src/dal/dto/AlumniDTO.ts b/packages/backend/src/dal/dto/AlumniDTO.ts
index 15cdde6b..182a0e3f 100644
--- a/packages/backend/src/dal/dto/AlumniDTO.ts
+++ b/packages/backend/src/dal/dto/AlumniDTO.ts
@@ -1,46 +1,64 @@
 import type { BaseDTO } from "./baseDTO";
+
+// What a new alumni row is built from: user_id plus the stored profile columns (years as numbers).
+export type AlumniDTOInit = Pick<AlumniDTO, "user_id"> &
+  Partial<
+    Pick<
+      AlumniDTO,
+      | "department"
+      | "graduation_year"
+      | "current_company"
+      | "job_title"
+      | "experience"
+      | "bio"
+      | "linkedin_url"
+      | "headline"
+      | "location"
+      | "degree"
+      | "start_year"
+      | "mentorship_available"
+    >
+  >;
+
 export class AlumniDTO implements BaseDTO {
   id!: number;
   user_id: number;
   department?: string;
   graduation_year?: number | null; // INTEGER column, nullable
   current_company?: string;
   job_title?: string;
   experience?: string;
   bio?: string;
   linkedin_url?: string;
   headline?: string;
   location?: string;
   degree?: string;
   start_year?: number | null; // INTEGER column, nullable
   mentorship_available?: boolean; // NOT NULL DEFAULT false in the table
   created_at: Date;
   updated_at: Date;
   // Joined from users on reads; never includes the password.
   name?: string;
   email?: string;
   photo_url?: string;
 
-  constructor(
-    user_id: number,
-    department?: string,
-    graduation_year?: number,
-    current_company?: string,
-    job_title?: string,
-    experience?: string,
-    bio?: string,
-    linkedin_url?: string,
-  ) {
-    this.user_id = user_id;
-    this.department = department;
-    this.graduation_year = graduation_year;
-    this.current_company = current_company;
-    this.job_title = job_title;
-    this.experience = experience;
-    this.bio = bio;
-    this.linkedin_url = linkedin_url;
+  // One typed object, so a misspelt or unknown field is a compile error at the call site.
+  constructor(fields: AlumniDTOInit) {
+    this.user_id = fields.user_id;
+    this.department = fields.department;
+    this.graduation_year = fields.graduation_year;
+    this.current_company = fields.current_company;
+    this.job_title = fields.job_title;
+    this.experience = fields.experience;
+    this.bio = fields.bio;
+    this.linkedin_url = fields.linkedin_url;
+    this.headline = fields.headline;
+    this.location = fields.location;
+    this.degree = fields.degree;
+    this.start_year = fields.start_year;
+    this.mentorship_available = fields.mentorship_available;
     const now = new Date();
     this.created_at = now;
     this.updated_at = now;
   }
 }
diff --git a/packages/frontend/src/components/ui/Switch/Switch.tsx b/packages/frontend/src/components/ui/Switch/Switch.tsx
index 1dd80ddc..613bc0d7 100644
--- a/packages/frontend/src/components/ui/Switch/Switch.tsx
+++ b/packages/frontend/src/components/ui/Switch/Switch.tsx
@@ -1,63 +1,64 @@
 import { useId, type ReactNode } from 'react';
 import { Switch as BaseSwitch } from '@base-ui/react/switch';
 import styles from './Switch.module.css';
 
 export interface SwitchProps {
   checked: boolean;
   onCheckedChange: (checked: boolean) => void;
   /** Visible label, tied to the switch with htmlFor (its accessible name). */
   label: ReactNode;
   /** Help text under the label; becomes the switch's accessible description. */
   description?: ReactNode;
   disabled?: boolean;
   /** Id of the switch button; generated when omitted. */
   id?: string;
 }
 
 /**
  * A controlled on/off switch with its label and optional help text on the
  * left and the track on the right. Base UI supplies the behaviour: a native
  * button with role="switch" and aria-checked, toggled by click, Space and Enter.
  */
 export function Switch({
   checked,
   onCheckedChange,
   label,
   description,
   disabled,
   id,
 }: SwitchProps) {
   const generatedId = useId();
   const switchId = id ?? generatedId;
   const descriptionId = `${switchId}-description`;
   const hasDescription = description !== undefined && description !== null && description !== '';
 
   return (
     <div className={styles.field} data-disabled={disabled ? '' : undefined}>
       <div className={styles.text}>
         <label className={styles.label} htmlFor={switchId}>
           {label}
         </label>
         {hasDescription && (
           <p id={descriptionId} className={styles.description}>
             {description}
           </p>
         )}
       </div>
       <BaseSwitch.Root
         id={switchId}
         nativeButton
         render={<button type="button" />}
         checked={checked}
+        // Forward only the boolean: Base UI's second eventDetails argument stays out of our API.
         onCheckedChange={(next) => {
           onCheckedChange(next);
         }}
         disabled={disabled}
         aria-describedby={hasDescription ? descriptionId : undefined}
         className={styles.track}
       >
         <BaseSwitch.Thumb className={styles.thumb} />
       </BaseSwitch.Root>
     </div>
   );
 }
diff --git a/packages/frontend/src/features/me/ProfileForm.tsx b/packages/frontend/src/features/me/ProfileForm.tsx
index 5f92481d..f9050b1e 100644
--- a/packages/frontend/src/features/me/ProfileForm.tsx
+++ b/packages/frontend/src/features/me/ProfileForm.tsx
@@ -1,403 +1,439 @@
 import type { MyProfile } from '@alumni/shared';
 import { useEffect, useRef, useState, type RefObject, type SubmitEvent } from 'react';
 import { flushSync } from 'react-dom';
 import { Alert } from '@/components/ui/Alert';
 import { cx } from '@/components/ui/cx';
 import { Toast } from '@/components/ui/Toast';
 import { CareerSection } from './CareerSection';
 import { EducationSection } from './EducationSection';
 import type { BindField } from './fields';
 import type { LeavePromptProps } from './LeavePrompt';
 import { MentorshipSection } from './MentorshipSection';
 import { PasswordSection } from './PasswordSection';
 import { PersonalSection } from './PersonalSection';
 import { mapProfileError } from './profileErrors';
 import { SaveBar } from './SaveBar';
 import { useLeaveGuard } from './useLeaveGuard';
 import { useUpdateProfile, type SaveResult } from './useUpdateProfile';
 import {
   EMPTY_PASSWORD_VALUES,
   PASSWORD_FIELDS,
   YEAR_ORDER_MESSAGE,
   hasMentorship,
   isDirty,
   planSave,
   profileFields,
   profileKind,
   toPasswordInput,
   toUpdateInput,
   toValues,
   type MeErrors,
   type MeField,
   type PasswordField,
   type PasswordValues,
   type ProfileValues,
 } from './validation';
 import styles from './ProfileForm.module.css';
 
 /** How long the success toast stays (it can also be dismissed). */
 export const TOAST_MS = 4000;
 export const PROFILE_SAVED_TEXT = 'Profile updated successfully';
 export const PASSWORD_SAVED_TEXT = 'Password changed successfully';
 export const TOAST_DISMISS_LABEL = 'Dismiss';
 /** S5-UnsavedToast's caption under the cards, after a save, while nothing is unsaved. */
 export const ALL_SAVED_TEXT = 'All sections saved — no unsaved changes.';
 /** Added to the form-level message when the field in error is hidden at this width. */
 export const HIDDEN_FIELD_HINT = 'Open My Profile on a wider screen to change it.';
+/**
+ * The year order message on Graduation year when Start year is hidden at this
+ * width: it names a field the user cannot see, so it gets the same hint.
+ */
+export const YEAR_ORDER_HIDDEN_MESSAGE = `${YEAR_ORDER_MESSAGE}. ${HIDDEN_FIELD_HINT}`;
 
 function isPasswordField(field: MeField): field is PasswordField {
   return field === 'current_password' || field === 'new_password' || field === 'confirm_password';
 }
 
 // A field CSS hides at this width (Start year below 48rem) cannot take focus,
 // so its error must not be left on it unseen.
+// The other half of this check is `.wideOnly` in Section.module.css (the
+// 48rem rule); change them together. jsdom loads no CSS Modules, so tests hide
+// the wrapper by hand. If a second width-hidden field ever appears, replace
+// this DOM walk with a matchMedia hook on the same breakpoint.
 function isHidden(element: Element): boolean {
   for (let node: Element | null = element; node !== null; node = node.parentElement) {
     if (getComputedStyle(node).display === 'none') return true;
   }
   return false;
 }
 
 function focusIsLost(): boolean {
   const active = document.activeElement;
   return active === null || active === document.body || !active.isConnected;
 }
 
 export interface ProfileFormProps {
   /** The profile from ['me'] when the form mounted. Later refetches are ignored (ADV-004). */
   profile: MyProfile;
   /** The page's h1: focus goes there when the save bar's button unmounts under it. */
   headingRef: RefObject<HTMLHeadingElement | null>;
 }
 
 /**
  * The /me editor. MePage keys it on `user_id` only, so it initialises once;
  * from then on the saved profile (the baseline for "unsaved changes", the
  * photo_url sent back on save) lives in this component's state and is replaced
  * from the mutation's result, never from a refetch (ADV-004). The mutation,
  * the toast and the password error live here too, so a refetch of ['me'] after
  * a save never remounts the form and loses them.
  *
  * Sections follow S5's order: Personal, Education, Career, Mentorship,
  * Password; the account's kind decides which render (Mentorship: alumni only).
  * Errors show after a field is left or Save is tried; a failed Save focuses
  * the first invalid field after flushSync, so it is read with its message. A
  * field hidden at this width (Start year on phones) gets its message on the
  * form instead, with a hint, since it cannot be focused or fixed there.
  */
 export function ProfileForm({ profile, headingRef }: ProfileFormProps) {
   const [saved, setSaved] = useState(profile);
   const [baseline, setBaseline] = useState<ProfileValues>(() => toValues(profile));
   const [values, setValues] = useState<ProfileValues>(baseline);
   const [password, setPassword] = useState<PasswordValues>(EMPTY_PASSWORD_VALUES);
   const [errors, setErrors] = useState<MeErrors>({});
   const [formError, setFormError] = useState<string | null>(null);
   const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
   const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
   const toastCount = useRef(0);
   // The id of the toast under the pointer / holding focus. Kept per id, so a
   // toast that unmounts while hovered (no mouseleave) never pauses the next.
   const [hoveredToast, setHoveredToast] = useState<number | null>(null);
   const [focusedToast, setFocusedToast] = useState<number | null>(null);
   const toastPaused = toast !== null && (hoveredToast === toast.id || focusedToast === toast.id);
   // A save succeeded in this visit: the "all saved" caption may show while clean.
   const [savedOnce, setSavedOnce] = useState(false);
   const formRef = useRef<HTMLFormElement>(null);
   const formErrorRef = useRef<HTMLDivElement>(null);
   const passwordErrorRef = useRef<HTMLDivElement>(null);
 
   const save = useUpdateProfile();
   const kind = profileKind(saved);
   const visibleFields: readonly MeField[] = [...profileFields(kind), ...PASSWORD_FIELDS];
   const dirty = isDirty(values, baseline, kind, password);
   // A save in flight blocks leaving too, so its outcome is never lost unseen (ADV-008).
   const guarding = dirty || save.isPending;
   const blocker = useLeaveGuard(guarding);
 
   // A blocked navigation whose reason is gone (the save it waited for settled
   // with nothing left unsaved, or the edits were typed back): drop the prompt
   // and stay, so the toast is seen; the user can follow the link again.
   useEffect(() => {
     if (blocker.state === 'blocked' && !guarding) blocker.reset();
   }, [blocker, guarding]);
 
   // Auto-close after TOAST_MS, paused while the toast is hovered or holds
   // focus (WCAG 2.2.1); leaving it starts a fresh TOAST_MS.
   useEffect(() => {
     if (toast === null || toastPaused) return;
     const timer = setTimeout(() => {
       // Same as closeToast (inlined to keep the effect's dependencies honest).
       flushSync(() => {
         setToast(null);
       });
       // preventScroll: this fires on a timer, so it must not jump the page to the top.
       if (focusIsLost()) headingRef.current?.focus({ preventScroll: true });
     }, TOAST_MS);
     return () => {
       clearTimeout(timer);
     };
   }, [toast, toastPaused, headingRef]);
 
   function fieldElement(field: MeField): HTMLElement | null {
     const element = formRef.current?.elements.namedItem(field);
     return element instanceof HTMLElement ? element : null;
   }
 
   function focusField(field: MeField) {
     fieldElement(field)?.focus();
   }
 
   function isFieldHidden(field: MeField): boolean {
     const element = fieldElement(field);
     return element !== null && isHidden(element);
   }
 
   function showFormError(message: string) {
     flushSync(() => {
       setFormError(message);
     });
     formErrorRef.current?.focus();
   }
 
+  /**
+   * The year order message names Start year; when that field is hidden here,
+   * the message on Graduation year gets the hint. Applied wherever errors are
+   * stored, so the text matches the width at that moment.
+   */
+  function withOrderHint(fieldErrors: MeErrors): MeErrors {
+    if (fieldErrors.graduation_year !== YEAR_ORDER_MESSAGE || !isFieldHidden('start_year')) {
+      return fieldErrors;
+    }
+    return { ...fieldErrors, graduation_year: YEAR_ORDER_HIDDEN_MESSAGE };
+  }
+
   /** Puts `message` on `field`, or on the form when the field is hidden here. */
   function showFieldError(field: MeField, message: string) {
     if (isFieldHidden(field)) {
       showFormError(`${message}. ${HIDDEN_FIELD_HINT}`);
       return;
     }
     focusField(field);
   }
 
   function focusHeadingIfLost() {
     if (focusIsLost()) headingRef.current?.focus();
   }
 
   // Dismiss unmounts under the pointer or keyboard: focus goes to the heading.
   // The timer pauses while the toast has focus, but the same rule covers it.
   function closeToast() {
     flushSync(() => {
       setToast(null);
     });
     focusHeadingIfLost();
   }
 
   function showToast(text: string) {
     toastCount.current += 1;
     setToast({ id: toastCount.current, text });
   }
 
   const bind: BindField = (field) => ({
     name: field,
     value: isPasswordField(field) ? password[field] : values[field],
     error: errors[field],
     onChange: (event) => {
       const { value } = event.target;
       if (isPasswordField(field)) {
         setPassword((prev) => ({ ...prev, [field]: value }));
         setPasswordFormError(null);
       } else {
         setValues((prev) => ({ ...prev, [field]: value }));
       }
       setErrors((prev) => {
         const next = { ...prev, [field]: undefined };
         // The order rule's message sits on Graduation year but is about both.
-        if (field === 'start_year' && prev.graduation_year === YEAR_ORDER_MESSAGE) {
+        if (
+          field === 'start_year' &&
+          (prev.graduation_year === YEAR_ORDER_MESSAGE ||
+            prev.graduation_year === YEAR_ORDER_HIDDEN_MESSAGE)
+        ) {
           next.graduation_year = undefined;
         }
         return next;
       });
     },
     onBlur: () => {
       // Same rules as Save. Only adds a message: leaving a field must not wipe
       // a server error (e.g. "Current password is incorrect") shown on it.
       const planned = planSave(values, baseline, kind, password).errors;
-      const message = planned[field];
+      const message = withOrderHint(planned)[field];
       if (message !== undefined) setErrors((prev) => ({ ...prev, [field]: message }));
       // Leaving Start year after Graduation year shows the order rule there.
       if (field === 'start_year' && planned.graduation_year === YEAR_ORDER_MESSAGE) {
         setErrors((prev) => ({ ...prev, graduation_year: YEAR_ORDER_MESSAGE }));
       }
     },
   });
 
   function handleDiscard() {
     flushSync(() => {
       setValues(baseline);
       setPassword(EMPTY_PASSWORD_VALUES);
       setErrors({});
       setFormError(null);
       setPasswordFormError(null);
     });
     // Discard unmounted with the bar.
     focusHeadingIfLost();
   }
 
   function applyResult(
     result: SaveResult,
     submittedValues: ProfileValues,
     submittedPassword: PasswordValues,
   ) {
     const passwordMapped =
       result.passwordError === null ? null : mapProfileError(result.passwordError, PASSWORD_FIELDS);
     const toastText = result.profile
       ? PROFILE_SAVED_TEXT
       : result.passwordChanged
         ? PASSWORD_SAVED_TEXT
         : null;
 
     flushSync(() => {
       if (result.profile) {
         const next = toValues(result.profile);
         setSaved(result.profile);
         setBaseline(next);
         // Keep anything typed while the save was in flight.
         setValues((current) => (current === submittedValues ? next : current));
       }
       if (result.passwordChanged) {
         setPassword((current) => (current === submittedPassword ? EMPTY_PASSWORD_VALUES : current));
       }
       if (passwordMapped?.fields) {
         const fields = passwordMapped.fields;
         setErrors((prev) => ({ ...prev, ...fields }));
       }
       if (passwordMapped?.form !== undefined) setPasswordFormError(passwordMapped.form);
       if (toastText !== null) {
         showToast(toastText);
         setSavedOnce(true);
       }
     });
 
     // The typed password stays, with its error, so it can be fixed and saved again.
     const passwordField = PASSWORD_FIELDS.find((f) => passwordMapped?.fields?.[f] !== undefined);
     if (passwordField !== undefined) focusField(passwordField);
     else if (passwordMapped?.form !== undefined) passwordErrorRef.current?.focus();
     else focusHeadingIfLost();
   }
 
   function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
     event.preventDefault();
     if (save.isPending) return;
 
     const plan = planSave(values, baseline, kind, password);
     if (!plan.saveProfile && !plan.savePassword) return;
-    const firstInvalid = visibleFields.find((field) => plan.errors[field] !== undefined);
+    const invalid = visibleFields.filter((field) => plan.errors[field] !== undefined);
+    // An error on a field hidden at this width (Start year on phones) always
+    // goes on the form with the hint, even when a shown field is invalid too,
+    // so it is never stored where nobody can see it (UI-002).
+    const hiddenMessages = invalid
+      .filter((field) => isFieldHidden(field))
+      .map((field) => plan.errors[field]);
+    const hiddenError =
+      hiddenMessages.length === 0 ? null : `${hiddenMessages.join('. ')}. ${HIDDEN_FIELD_HINT}`;
+    const firstShown = invalid.find((field) => !isFieldHidden(field));
     // Render the messages before moving focus, so the field is read with its error.
     flushSync(() => {
-      setErrors(plan.errors);
-      setFormError(null);
+      setErrors(withOrderHint(plan.errors));
+      setFormError(hiddenError);
       setPasswordFormError(null);
     });
-    if (firstInvalid !== undefined) {
-      const message = plan.errors[firstInvalid];
-      if (message !== undefined) showFieldError(firstInvalid, message);
+    if (invalid.length > 0) {
+      // A shown field takes focus so it can be fixed; the form alert (role
+      // "alert") is announced on its own. Only hidden ones: focus the alert.
+      if (firstShown !== undefined) focusField(firstShown);
+      else formErrorRef.current?.focus();
       return;
     }
 
     const submittedValues = values;
     const submittedPassword = password;
     save.mutate(
       {
         profile: plan.saveProfile ? toUpdateInput(values, kind, saved.photo_url) : null,
         password: plan.savePassword ? toPasswordInput(password) : null,
       },
       {
         onSuccess: (result) => {
           applyResult(result, submittedValues, submittedPassword);
         },
         onError: (error) => {
           // PUT /api/me failed, so the password call never ran. A 401 maps to
           // nothing: SessionBridge logs out (ADR-03).
           const mapped = mapProfileError(error, visibleFields);
-          const fieldErrors = mapped.fields;
+          const fieldErrors = mapped.fields && withOrderHint(mapped.fields);
           const field = visibleFields.find((f) => fieldErrors?.[f] !== undefined);
           const fieldMessage = field === undefined ? undefined : fieldErrors?.[field];
           if (field !== undefined && fieldMessage !== undefined) {
             flushSync(() => {
               setErrors((prev) => ({ ...prev, ...fieldErrors }));
             });
             showFieldError(field, fieldMessage);
             return;
           }
           if (mapped.form === undefined) return;
           showFormError(mapped.form);
         },
       },
     );
   }
 
   // Shown only while there is still a reason to block: the reset above reaches
   // the router in a later transition render, so without `guarding` here the
   // prompt would stay on screen next to the "saved" toast until it lands.
   let prompt: LeavePromptProps | null = null;
   if (blocker.state === 'blocked' && guarding) {
     prompt = {
       onStay: () => {
         blocker.reset();
       },
       onLeave: () => {
         blocker.proceed();
       },
     };
   }
   const showBar = dirty || prompt !== null;
 
   return (
     <>
       <form
         ref={formRef}
         noValidate
         className={cx(styles.form, showBar && styles.withBar)}
         onSubmit={handleSubmit}
       >
         {formError !== null && (
           <Alert ref={formErrorRef} tabIndex={-1} tone="error">
             {formError}
           </Alert>
         )}
         <PersonalSection
           bind={bind}
           kind={kind}
           savedName={saved.name}
           photoUrl={saved.photo_url}
         />
         <EducationSection bind={bind} kind={kind} />
         <CareerSection bind={bind} kind={kind} />
         {hasMentorship(kind) && (
           <MentorshipSection
             checked={values.mentorship_available}
             onCheckedChange={(checked) => {
               setValues((prev) => ({ ...prev, mentorship_available: checked }));
             }}
           />
         )}
         <PasswordSection
           bind={bind}
           formError={passwordFormError}
           formErrorRef={passwordErrorRef}
         />
         {savedOnce && !dirty && <p className={styles.allSaved}>{ALL_SAVED_TEXT}</p>}
         {showBar && <SaveBar saving={save.isPending} onDiscard={handleDiscard} prompt={prompt} />}
       </form>
       {/* Always mounted: its status region must be in the page before the
           message is written into it, or screen readers may not announce it. */}
       <Toast
         dismissLabel={TOAST_DISMISS_LABEL}
         onDismiss={closeToast}
         onMouseEnter={() => {
           if (toast !== null) setHoveredToast(toast.id);
         }}
         onMouseLeave={() => {
           setHoveredToast(null);
         }}
         onFocus={() => {
           if (toast !== null) setFocusedToast(toast.id);
         }}
         onBlur={(event) => {
           if (!event.currentTarget.contains(event.relatedTarget)) setFocusedToast(null);
         }}
       >
         {toast?.text ?? null}
       </Toast>
     </>
   );
 }
diff --git a/packages/frontend/src/features/me/Section.module.css b/packages/frontend/src/features/me/Section.module.css
index 0dd5e6be..7c26349f 100644
--- a/packages/frontend/src/features/me/Section.module.css
+++ b/packages/frontend/src/features/me/Section.module.css
@@ -1,69 +1,71 @@
 /* Shared by the /me section cards (Personal, Education, Career, Mentorship, Password).
    Design: docs/design/screens/app/S5-Desktop-Light and S5-Phone-Light
    (.section-card, .row2). Card: surface-raised, border-subtle hairline,
    radius-lg (14px). Padding 16px phone (space-4), 22px from 48rem
    (space-5 - space-1 / 2); gap 12px phone (space-3), 16px from 48rem
    (space-4). Two-column rows from 48rem, one column below (and so at 200% zoom
    on a desktop window); row gap 14px (space-3 + space-1 / 2).
    Nearest tokens: the heading is text-heading-sm (16px) for S5's 14px / 15px.
    S5's 56px / 48px avatar: 3rem phone, 3.5rem from 48rem. */
 
 .card {
   display: flex;
   flex-direction: column;
   gap: var(--space-3);
   min-width: 0;
   padding: var(--space-4);
   background: var(--surface-raised);
   border: 1px solid var(--border-subtle);
   border-radius: var(--radius-lg);
 }
 
 .heading {
   margin: 0;
   font: var(--text-heading-sm);
 }
 
 .intro {
   margin: 0;
   color: var(--ink-secondary);
   font: var(--text-label);
 }
 
 .row {
   display: grid;
   grid-template-columns: minmax(0, 1fr);
   gap: var(--space-3) calc(var(--space-3) + var(--space-1) / 2);
 }
 
 /* Desktop-only field (S5 phone has no Start year): out of the layout, the tab
    order and the accessibility tree below 48rem; its value is kept. Only set
-   below the breakpoint, so the wrapper never sets display otherwise (G18). */
+   below the breakpoint, so the wrapper never sets display otherwise (G18).
+   ProfileForm.tsx's isHidden reads this display:none to put a hidden field's
+   error on the form; change both together (matchMedia if a second field). */
 @media (width < 48rem) {
   .wideOnly {
     display: none;
   }
 }
 
 /* Qualified with the span and data-size so it outranks the Avatar's own size rule (G30). */
 span.avatar[data-size] {
   align-self: flex-start;
   inline-size: 3rem;
   block-size: 3rem;
 }
 
 @media (width >= 48rem) {
   .card {
     gap: var(--space-4);
     padding: calc(var(--space-5) - var(--space-1) / 2);
   }
 
   .row {
     grid-template-columns: repeat(2, minmax(0, 1fr));
   }
 
   span.avatar[data-size] {
     inline-size: 3.5rem;
     block-size: 3.5rem;
   }
 }
diff --git a/packages/frontend/src/features/profile/ProfileHeader.module.css b/packages/frontend/src/features/profile/ProfileHeader.module.css
index 140cfbc1..abb4cb57 100644
--- a/packages/frontend/src/features/profile/ProfileHeader.module.css
+++ b/packages/frontend/src/features/profile/ProfileHeader.module.css
@@ -1,187 +1,193 @@
 /* Design: docs/design/screens/app/S3-Desktop-Light (a row: 84px avatar, 24px
    gap, name 24px, headline 15px, LinkedIn 13px medium) and S3-Phone-Light (a
    centred column: 72px avatar, 10px gap, name 19px, headline 13px, LinkedIn
    12px). Nearest tokens (gate decision): name text-heading-md on phone and
    text-heading-lg from 48rem; headline label size (regular) on phone and
    text-body-sm from 48rem; LinkedIn text-caption on phone and text-label from
    48rem; phone initials text-heading-md (design 24px). Off-scale gaps are
    calc() of tokens: 10px = space-2 + space-1 / 2, 6px = space-1 + space-1 / 2.
    The 72px phone avatar overrides Avatar's own `.avatar[data-size='lg']`, so
    the selector must be more specific than that rule (ADV-004).
    REQ-011: the badge sits beside the name from 48rem (gap 10px) and under the
    headline line on phone, where .nameRow is display: contents and `order`
    moves the badge and the links row (reading order stays name, badge, line).
    Location and LinkedIn share one row (gap 16px desktop, 14px phone); the pin
-   is decorative ink-muted, allowed only on aria-hidden marks (G27). */
+   is decorative ink-muted, allowed only on aria-hidden marks (G27). Both the
+   pin and the LinkedIn icon show from 48rem only: S3 phone draws the location
+   and LinkedIn as text (see the phone media query). */
 
 .header {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: calc(var(--space-2) + var(--space-1) / 2);
   text-align: center;
   min-width: 0;
 }
 
 .identity {
   display: flex;
   flex-direction: column;
   align-items: center;
   gap: var(--space-1);
   min-width: 0;
   max-inline-size: 100%;
 }
 
 .nameRow {
   display: contents;
 }
 
 /* S3 pill: 999px radius, padding 4px 10px, 12px/500 text, a filled 10px dot,
    gap 6px; sage tint (success-soft) with success-strong text (5.2:1 light,
    5.5:1 dark, styles/contrast.test.ts). */
 .badge {
   order: 1;
   display: inline-flex;
   align-items: center;
   gap: calc(var(--space-1) + var(--space-1) / 2);
   margin-block-start: calc(var(--space-1) + var(--space-1) / 2);
   border-radius: var(--radius-pill);
   padding: var(--space-1) calc(var(--space-2) + var(--space-1) / 2);
   font: var(--text-caption);
   background: var(--success-soft);
   color: var(--success-strong);
 }
 
 .badgeDot {
   flex: none;
   inline-size: 0.625rem;
   block-size: 0.625rem;
 }
 
 .name {
   margin: 0;
   color: var(--ink-primary);
   font: var(--text-heading-md);
   overflow-wrap: anywhere;
 }
 
 .headline {
   margin: 0;
   color: var(--ink-secondary);
   font-size: var(--text-label-size);
   font-weight: var(--text-body-weight);
   line-height: var(--text-label-line);
   overflow-wrap: anywhere;
 }
 
 .links {
   order: 2;
   display: flex;
   flex-wrap: wrap;
   justify-content: center;
   align-items: center;
   gap: calc(var(--space-3) + var(--space-1) / 2);
   margin-block-start: calc(var(--space-1) + var(--space-1) / 2);
   min-width: 0;
 }
 
 .location {
   display: inline-flex;
   align-items: center;
   gap: calc(var(--space-1) + var(--space-1) / 2);
   margin: 0;
   color: var(--ink-secondary);
   font: var(--text-caption);
   font-weight: var(--text-body-weight);
   overflow-wrap: anywhere;
 }
 
-.pin {
+.locationPin {
+  flex: none;
+  inline-size: 0.875rem;
+  block-size: 0.875rem;
   color: var(--ink-muted);
 }
 
 .linkedIn {
   display: inline-flex;
   align-items: center;
   gap: calc(var(--space-1) + var(--space-1) / 2);
   color: var(--accent);
   font: var(--text-caption);
   text-decoration: none;
   border-radius: var(--radius-sm);
 }
 
 .linkedIn:hover {
   color: var(--accent-strong);
 }
 
 .icon {
   flex: none;
   inline-size: 0.875rem;
   block-size: 0.875rem;
 }
 
 @media (width < 48rem) {
-  /* S3 phone shows the LinkedIn link as text only. The icon is a decorative
-     aria-hidden svg that never takes the hidden attribute, so display:none
-     is safe here (G18). */
-  .icon {
+  /* S3 phone shows the location and the LinkedIn link as text only, so the
+     pin and the icon hide here on purpose. Both are decorative aria-hidden
+     svgs that never take the hidden attribute, so display:none is safe (G18). */
+  .icon,
+  .locationPin {
     display: none;
   }
 
   .header .avatar[data-size='lg'] {
     inline-size: 4.5rem;
     block-size: 4.5rem;
     font: var(--text-heading-md);
   }
 }
 
 @media (width >= 48rem) {
   .header {
     flex-flow: row wrap;
     align-items: flex-start;
     gap: var(--space-5);
     text-align: start;
   }
 
   .identity {
     flex: 1 1 15rem;
     align-items: flex-start;
     gap: calc(var(--space-1) + var(--space-1) / 2);
   }
 
   .nameRow {
     display: flex;
     flex-wrap: wrap;
     align-items: center;
     gap: calc(var(--space-2) + var(--space-1) / 2);
     min-width: 0;
   }
 
   .badge {
     margin-block-start: 0;
   }
 
   .name {
     font: var(--text-heading-lg);
   }
 
   .links {
     justify-content: flex-start;
     gap: var(--space-4);
     margin-block-start: var(--space-1);
   }
 
   .location {
     font-size: var(--text-label-size);
     line-height: var(--text-label-line);
   }
 
   .headline {
     font: var(--text-body-sm);
     line-height: var(--text-label-line); /* S3 headline box is 18px tall */
   }
 
   .linkedIn {
     font: var(--text-label);
   }
 }
diff --git a/packages/frontend/src/features/profile/ProfileHeader.tsx b/packages/frontend/src/features/profile/ProfileHeader.tsx
index bf786bd1..54fe2bb0 100644
--- a/packages/frontend/src/features/profile/ProfileHeader.tsx
+++ b/packages/frontend/src/features/profile/ProfileHeader.tsx
@@ -1,128 +1,128 @@
 import type { Alumni } from '@alumni/shared';
 import type { Ref } from 'react';
 import { Avatar } from '@/components/ui/Avatar';
-import { cx } from '@/components/ui/cx';
 import { VisuallyHidden } from '@/components/ui/VisuallyHidden';
 import { BRAND_NAME } from '@/config/brand';
 import { headline, present, safeLinkedInUrl } from './format';
 import styles from './ProfileHeader.module.css';
 
 /** The h1 when a profile has no name (the API allows a blank one). */
 export const UNNAMED_PROFILE = 'Alumni profile';
 
 export interface ProfileHeaderProps {
   alumni: Pick<
     Alumni,
     | 'name'
     | 'photo_url'
     | 'headline'
     | 'job_title'
     | 'current_company'
     | 'graduation_year'
     | 'location'
     | 'linkedin_url'
     | 'mentorship_available'
   >;
   /** The page focuses this h1 when the profile first shows (ADV-005). */
   headingRef?: Ref<HTMLHeadingElement>;
 }
 
 /**
  * The profile's header (S3): large avatar, the name as the page's one h1 with
  * the "Available for mentorship" badge beside it (only when the flag is true;
  * a sage pill on success-soft, S3),
  * the line "<headline> · Class of YYYY" under it, then the location and a
  * LinkedIn link (only for a safe http(s) URL). Each part hides when empty.
- * Below 48rem the badge moves under the line (S3 phone). Sets the tab title
+ * Below 48rem the badge moves under the line and the location pin and LinkedIn
+ * icon hide, leaving text only (S3 phone). Sets the tab title
  * to "<name> · Alma". Never shows the email.
  */
 export function ProfileHeader({ alumni, headingRef }: ProfileHeaderProps) {
   const name = present(alumni.name);
   const heading = name ?? UNNAMED_PROFILE;
   const line = headline(alumni);
   const location = present(alumni.location);
   const linkedIn = safeLinkedInUrl(alumni.linkedin_url);
   const mentor = alumni.mentorship_available === true;
 
   return (
     <header className={styles.header}>
       <title>{`${heading} · ${BRAND_NAME}`}</title>
       <Avatar
         className={styles.avatar}
         size="lg"
         name={name ?? ''}
         photoUrl={present(alumni.photo_url)}
       />
       <div className={styles.identity}>
         <div className={styles.nameRow}>
           <h1 ref={headingRef} className={styles.name} tabIndex={-1}>
             {heading}
           </h1>
           {mentor && (
             <span className={styles.badge}>
               <svg
                 className={styles.badgeDot}
                 viewBox="0 0 24 24"
                 fill="currentColor"
                 aria-hidden="true"
                 focusable={false}
               >
                 <circle cx="12" cy="12" r="10" />
               </svg>
               Available for mentorship
             </span>
           )}
         </div>
         {line !== undefined && <p className={styles.headline}>{line}</p>}
         {(location !== undefined || linkedIn !== undefined) && (
           <div className={styles.links}>
             {location !== undefined && (
               <p className={styles.location}>
                 <svg
-                  className={cx(styles.icon, styles.pin)}
+                  className={styles.locationPin}
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth={2}
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   aria-hidden="true"
                   focusable={false}
                 >
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z" />
                   <circle cx="12" cy="10" r="3" />
                 </svg>
                 <VisuallyHidden>Location:</VisuallyHidden> {location}
               </p>
             )}
             {linkedIn !== undefined && (
               <a
                 className={styles.linkedIn}
                 href={linkedIn}
                 target="_blank"
                 rel="noopener noreferrer"
               >
                 <svg
                   className={styles.icon}
                   viewBox="0 0 24 24"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth={2}
                   strokeLinecap="round"
                   strokeLinejoin="round"
                   aria-hidden="true"
                   focusable={false}
                 >
                   <rect x="2" y="9" width="4" height="12" />
                   <circle cx="4" cy="4" r="2" />
                   <path d="M8 9h4v2a4.5 4.5 0 0 1 8 3v7h-4v-6a2 2 0 0 0-4 0v6H8z" />
                 </svg>
                 LinkedIn <VisuallyHidden>(opens in a new tab)</VisuallyHidden>
               </a>
             )}
           </div>
         )}
       </div>
     </header>
   );
 }
```
