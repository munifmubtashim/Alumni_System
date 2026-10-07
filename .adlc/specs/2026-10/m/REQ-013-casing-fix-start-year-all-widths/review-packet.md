# REQ-013-casing-fix-start-year-all-widths — Review Packet

`Packet: 78KB · uncommitted working tree vs HEAD (redesign tip) · source with full context, tests/docs 4 lines`

Base is `redesign`. Read `git diff HEAD -- <path>` yourself for more (required reading, not a packet gap).

## Source diff, full context

```diff
diff --git a/packages/backend/src/dal/dto/AlumniDTO.ts b/packages/backend/src/dal/dto/AlumniDTO.ts
index 182a0e3f..99515891 100644
--- a/packages/backend/src/dal/dto/AlumniDTO.ts
+++ b/packages/backend/src/dal/dto/AlumniDTO.ts
@@ -1,64 +1,64 @@
-import type { BaseDTO } from "./baseDTO";
+import type { BaseDTO } from "./BaseDTO";
 
 // What a new alumni row is built from: user_id plus the stored profile columns (years as numbers).
 export type AlumniDTOInit = Pick<AlumniDTO, "user_id"> &
   Partial<
     Pick<
       AlumniDTO,
       | "department"
       | "graduation_year"
       | "current_company"
       | "job_title"
       | "experience"
       | "bio"
       | "linkedin_url"
       | "headline"
       | "location"
       | "degree"
       | "start_year"
       | "mentorship_available"
     >
   >;
 
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
 
   // One typed object, so a misspelt or unknown field is a compile error at the call site.
   constructor(fields: AlumniDTOInit) {
     this.user_id = fields.user_id;
     this.department = fields.department;
     this.graduation_year = fields.graduation_year;
     this.current_company = fields.current_company;
     this.job_title = fields.job_title;
     this.experience = fields.experience;
     this.bio = fields.bio;
     this.linkedin_url = fields.linkedin_url;
     this.headline = fields.headline;
     this.location = fields.location;
     this.degree = fields.degree;
     this.start_year = fields.start_year;
     this.mentorship_available = fields.mentorship_available;
     const now = new Date();
     this.created_at = now;
     this.updated_at = now;
   }
 }
diff --git a/packages/backend/src/dal/dto/baseDTO.ts b/packages/backend/src/dal/dto/BaseDTO.ts
similarity index 100%
rename from packages/backend/src/dal/dto/baseDTO.ts
rename to packages/backend/src/dal/dto/BaseDTO.ts
diff --git a/packages/backend/src/dal/dto/CommentDTO.ts b/packages/backend/src/dal/dto/CommentDTO.ts
index d4fec016..38f79a8b 100644
--- a/packages/backend/src/dal/dto/CommentDTO.ts
+++ b/packages/backend/src/dal/dto/CommentDTO.ts
@@ -1,24 +1,24 @@
-import type  { BaseDTO } from "./baseDTO";
+import type  { BaseDTO } from "./BaseDTO";
 
 export class CommentDTO implements BaseDTO {
     id!: number;
     user_id: number;
     post_id: number;
     parent_id: number | null;
     content: string;
     created_at: Date;
     updated_at: Date;
     // Joined from users on reads.
     author_name?: string;
     author_photo?: string;
 
     constructor(user_id: number, post_id: number, content: string, parent_id: number | null = null) {
         this.user_id = user_id;
         this.post_id = post_id;
         this.parent_id = parent_id;
         this.content = content;
         const now = new Date();
         this.created_at = now;
         this.updated_at = now;
     }
 }
diff --git a/packages/backend/src/dal/dto/PostDTO.ts b/packages/backend/src/dal/dto/PostDTO.ts
index fc5b5470..ec0697af 100644
--- a/packages/backend/src/dal/dto/PostDTO.ts
+++ b/packages/backend/src/dal/dto/PostDTO.ts
@@ -1,27 +1,27 @@
-import type { BaseDTO } from "./baseDTO";
+import type { BaseDTO } from "./BaseDTO";
 
 export class PostDTO implements BaseDTO {
   id!: number;
   user_id: number;
   caption?: string;
   media_url?: string;
   comment_count: number;
   created_at?: Date;
   updated_at?: Date;
 
   constructor(
     
     user_id: number,
     comment_count: number,
     caption?: string,
     media_url?: string,
   ) {
     this.user_id = user_id;
     this.caption = caption;
     this.media_url = media_url;
     this.comment_count = comment_count;
     const now = new Date();
     this.created_at = now;
     this.updated_at = now;
   }
 }
diff --git a/packages/backend/src/dal/dto/UserDTO.ts b/packages/backend/src/dal/dto/UserDTO.ts
index 0827c84b..c63f88fd 100644
--- a/packages/backend/src/dal/dto/UserDTO.ts
+++ b/packages/backend/src/dal/dto/UserDTO.ts
@@ -1,30 +1,30 @@
-import type  { BaseDTO } from "./baseDTO";
+import type  { BaseDTO } from "./BaseDTO";
 
 
 export class UserDTO implements BaseDTO {
     id!: number;
     name: string;
     email: string;
     password: string;
     role: string;
     photo_url?: string;
     login_at: Date;
     logout_at: Date;
     created_at: Date;
     updated_at: Date;
     constructor(name: string, email: string, password: string, role: string,
         photo_url: string) {
         this.name = name;
         this.email = email;
         this.password = password;
         this.role = role;
         this.photo_url = photo_url;
         const now = new Date();
         this.login_at = now;
         this.logout_at = now;
         this.created_at = now;
         this.updated_at = now;
     }
 
 }
 
diff --git a/packages/frontend/src/features/me/EducationSection.tsx b/packages/frontend/src/features/me/EducationSection.tsx
index 3a30e722..5c174f6c 100644
--- a/packages/frontend/src/features/me/EducationSection.tsx
+++ b/packages/frontend/src/features/me/EducationSection.tsx
@@ -1,75 +1,73 @@
 import { useId } from 'react';
 import { Input } from '@/components/ui/Input';
 import type { BindField } from './fields';
 import type { ProfileKind } from './validation';
 import styles from './Section.module.css';
 
 export interface EducationSectionProps {
   bind: BindField;
   kind: ProfileKind;
 }
 
 /**
  * University, department and the year: graduation year for alumni, expected
  * graduation year for students (required, with department). Alumni also get
  * Degree (beside University) and Start year (beside Graduation year), as in
- * S5 (REQ-011). Start year is in the DOM at every width but hidden below 48rem
- * by CSS, as S5 phone has none; its value is kept and sent unchanged.
+ * S5 (REQ-011). Start year shows at every width, although S5 phone has none
+ * (REQ-013): phones stack Degree, Start year, Graduation year.
  * Hidden for an account with no profile row, whose University is in Personal.
  */
 export function EducationSection({ bind, kind }: EducationSectionProps) {
   const headingId = useId();
   if (kind === 'none') return null;
   const university = (
     <Input label="University" autoComplete="organization" {...bind('university')} />
   );
   const department = <Input label="Department" {...bind('department')} />;
 
   return (
     <section aria-labelledby={headingId} className={styles.card}>
       <h2 id={headingId} className={styles.heading}>
         Education
       </h2>
       {kind === 'student' ? (
         <>
           <div className={styles.row}>
             {university}
             {department}
           </div>
           <div className={styles.row}>
             <Input
               label="Expected graduation year"
               inputMode="numeric"
               autoComplete="off"
               {...bind('expected_graduation_year')}
             />
           </div>
         </>
       ) : (
         <>
           <div className={styles.row}>
             {university}
             <Input label="Degree" autoComplete="off" {...bind('degree')} />
           </div>
           {department}
           <div className={styles.row}>
-            <div className={styles.wideOnly}>
-              <Input
-                label="Start year"
-                inputMode="numeric"
-                autoComplete="off"
-                {...bind('start_year')}
-              />
-            </div>
+            <Input
+              label="Start year"
+              inputMode="numeric"
+              autoComplete="off"
+              {...bind('start_year')}
+            />
             <Input
               label="Graduation year"
               inputMode="numeric"
               autoComplete="off"
               {...bind('graduation_year')}
             />
           </div>
         </>
       )}
     </section>
   );
 }
diff --git a/packages/frontend/src/features/me/ProfileForm.tsx b/packages/frontend/src/features/me/ProfileForm.tsx
index de774a97..ce9cdd55 100644
--- a/packages/frontend/src/features/me/ProfileForm.tsx
+++ b/packages/frontend/src/features/me/ProfileForm.tsx
@@ -1,439 +1,374 @@
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
-/** Added to the form-level message when the field in error is hidden at this width. */
-export const HIDDEN_FIELD_HINT = 'Open Account settings on a wider screen to change it.';
-/**
- * The year order message on Graduation year when Start year is hidden at this
- * width: it names a field the user cannot see, so it gets the same hint.
- */
-export const YEAR_ORDER_HIDDEN_MESSAGE = `${YEAR_ORDER_MESSAGE}. ${HIDDEN_FIELD_HINT}`;
 
 function isPasswordField(field: MeField): field is PasswordField {
   return field === 'current_password' || field === 'new_password' || field === 'confirm_password';
 }
 
-// A field CSS hides at this width (Start year below 48rem) cannot take focus,
-// so its error must not be left on it unseen.
-// The other half of this check is `.wideOnly` in Section.module.css (the
-// 48rem rule); change them together. jsdom loads no CSS Modules, so tests hide
-// the wrapper by hand. If a second width-hidden field ever appears, replace
-// this DOM walk with a matchMedia hook on the same breakpoint.
-function isHidden(element: Element): boolean {
-  for (let node: Element | null = element; node !== null; node = node.parentElement) {
-    if (getComputedStyle(node).display === 'none') return true;
-  }
-  return false;
-}
-
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
- * the first invalid field after flushSync, so it is read with its message. A
- * field hidden at this width (Start year on phones) gets its message on the
- * form instead, with a hint, since it cannot be focused or fixed there.
+ * the first invalid field after flushSync, so it is read with its message.
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
 
-  function isFieldHidden(field: MeField): boolean {
-    const element = fieldElement(field);
-    return element !== null && isHidden(element);
-  }
-
   function showFormError(message: string) {
     flushSync(() => {
       setFormError(message);
     });
     formErrorRef.current?.focus();
   }
 
-  /**
-   * The year order message names Start year; when that field is hidden here,
-   * the message on Graduation year gets the hint. Applied wherever errors are
-   * stored, so the text matches the width at that moment.
-   */
-  function withOrderHint(fieldErrors: MeErrors): MeErrors {
-    if (fieldErrors.graduation_year !== YEAR_ORDER_MESSAGE || !isFieldHidden('start_year')) {
-      return fieldErrors;
-    }
-    return { ...fieldErrors, graduation_year: YEAR_ORDER_HIDDEN_MESSAGE };
-  }
-
-  /** Puts `message` on `field`, or on the form when the field is hidden here. */
-  function showFieldError(field: MeField, message: string) {
-    if (isFieldHidden(field)) {
-      showFormError(`${message}. ${HIDDEN_FIELD_HINT}`);
-      return;
-    }
-    focusField(field);
-  }
-
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
-        if (
-          field === 'start_year' &&
-          (prev.graduation_year === YEAR_ORDER_MESSAGE ||
-            prev.graduation_year === YEAR_ORDER_HIDDEN_MESSAGE)
-        ) {
+        if (field === 'start_year' && prev.graduation_year === YEAR_ORDER_MESSAGE) {
           next.graduation_year = undefined;
         }
         return next;
       });
     },
     onBlur: () => {
       // Same rules as Save. Only adds a message: leaving a field must not wipe
       // a server error (e.g. "Current password is incorrect") shown on it.
       const planned = planSave(values, baseline, kind, password).errors;
-      const message = withOrderHint(planned)[field];
+      const message = planned[field];
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
-    const invalid = visibleFields.filter((field) => plan.errors[field] !== undefined);
-    // An error on a field hidden at this width (Start year on phones) always
-    // goes on the form with the hint, even when a shown field is invalid too,
-    // so it is never stored where nobody can see it (UI-002).
-    const hiddenMessages = invalid
-      .filter((field) => isFieldHidden(field))
-      .map((field) => plan.errors[field]);
-    const hiddenError =
-      hiddenMessages.length === 0 ? null : `${hiddenMessages.join('. ')}. ${HIDDEN_FIELD_HINT}`;
-    const firstShown = invalid.find((field) => !isFieldHidden(field));
+    const firstInvalid = visibleFields.find((field) => plan.errors[field] !== undefined);
     // Render the messages before moving focus, so the field is read with its error.
     flushSync(() => {
-      setErrors(withOrderHint(plan.errors));
-      setFormError(hiddenError);
+      setErrors(plan.errors);
+      setFormError(null);
       setPasswordFormError(null);
     });
-    if (invalid.length > 0) {
-      // A shown field takes focus so it can be fixed; the form alert (role
-      // "alert") is announced on its own. Only hidden ones: focus the alert.
-      if (firstShown !== undefined) focusField(firstShown);
-      else formErrorRef.current?.focus();
+    if (firstInvalid !== undefined) {
+      focusField(firstInvalid);
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
-          const fieldErrors = mapped.fields && withOrderHint(mapped.fields);
+          const fieldErrors = mapped.fields;
           const field = visibleFields.find((f) => fieldErrors?.[f] !== undefined);
-          const fieldMessage = field === undefined ? undefined : fieldErrors?.[field];
-          if (field !== undefined && fieldMessage !== undefined) {
+          if (field !== undefined) {
             flushSync(() => {
               setErrors((prev) => ({ ...prev, ...fieldErrors }));
             });
-            showFieldError(field, fieldMessage);
+            focusField(field);
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
index 7c26349f..adb6afb6 100644
--- a/packages/frontend/src/features/me/Section.module.css
+++ b/packages/frontend/src/features/me/Section.module.css
@@ -1,71 +1,60 @@
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
 
-/* Desktop-only field (S5 phone has no Start year): out of the layout, the tab
-   order and the accessibility tree below 48rem; its value is kept. Only set
-   below the breakpoint, so the wrapper never sets display otherwise (G18).
-   ProfileForm.tsx's isHidden reads this display:none to put a hidden field's
-   error on the form; change both together (matchMedia if a second field). */
-@media (width < 48rem) {
-  .wideOnly {
-    display: none;
-  }
-}
-
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
diff --git a/packages/frontend/src/features/me/profileErrors.ts b/packages/frontend/src/features/me/profileErrors.ts
index 590a3f7c..3c3e8266 100644
--- a/packages/frontend/src/features/me/profileErrors.ts
+++ b/packages/frontend/src/features/me/profileErrors.ts
@@ -1,78 +1,78 @@
 import { isAxiosError } from 'axios';
 import { UNEXPECTED_MESSAGE, UNREACHABLE_MESSAGE } from '@/features/auth';
 import type { MeErrors, MeField } from './validation';
 
 /**
  * Shown instead of the server's "Photo URL ..." text: the form has no photo
  * field (the stored link is sent back unchanged), so there is nothing to fix here.
  */
 export const PHOTO_URL_MESSAGE =
   "Your saved photo link isn't a valid web address, so the profile can't be saved. Contact support to fix it.";
 
 /** What a failed save shows: a form-level message and/or field messages. */
 export interface ProfileFormError {
   form?: string;
   fields?: MeErrors;
 }
 
 // Backend message prefixes (businessLogic/src/validation.ts field names and
 // UserManager.updateMe / changeMyPassword) to form fields. An explicit table,
 // because the UI labels differ (Bio is "About", Job title is "Current role").
 // Longer prefixes first, so "Expected graduation year" never matches a shorter one.
 // The year order rule's message starts with "Graduation year", so it lands on
-// that field (visible at every width), never on the phone-hidden Start year.
+// that field, not on Start year.
 const FIELD_PREFIXES: readonly (readonly [string, MeField])[] = [
   ['Expected graduation year', 'expected_graduation_year'],
   ['Graduation year', 'graduation_year'],
   ['Current password', 'current_password'],
   ['New password', 'new_password'],
   ['LinkedIn URL', 'linkedin_url'],
   ['University', 'university'],
   ['Department', 'department'],
   ['Experience', 'experience'],
   ['Start year', 'start_year'],
   ['Job title', 'job_title'],
   ['Headline', 'headline'],
   ['Location', 'location'],
   ['Company', 'current_company'],
   ['Degree', 'degree'],
   ['Name', 'name'],
   ['Bio', 'bio'],
 ];
 
 function serverMessage(data: unknown): string | undefined {
   if (typeof data !== 'object' || data === null || !('message' in data)) return undefined;
   const { message } = data;
   return typeof message === 'string' && message.trim() !== '' ? message : undefined;
 }
 
 function fieldFor(message: string): MeField | undefined {
   return FIELD_PREFIXES.find(([prefix]) => message.startsWith(`${prefix} `))?.[1];
 }
 
 /**
  * Maps a failed PUT /api/me or PUT /api/me/password:
  * - a 4xx whose message names a field goes on that field ("Current password is
  *   incorrect" on current_password); a field not in `visible` goes on the form;
  * - "Photo URL ..." gets plain wording on the form;
  * - any other 4xx shows the server's message on the form;
  * - network errors and 5xx get the shared "couldn't reach the server" text;
  * - 401 maps to nothing: SessionBridge logs the user out (ADR-03).
  */
 export function mapProfileError(error: unknown, visible?: readonly MeField[]): ProfileFormError {
   if (!isAxiosError(error)) return { form: UNEXPECTED_MESSAGE };
   if (error.response === undefined) return { form: UNREACHABLE_MESSAGE };
 
   const { status } = error.response;
   if (status === 401) return {};
   if (status >= 500) return { form: UNREACHABLE_MESSAGE };
 
   const message = serverMessage(error.response.data);
   if (message === undefined) return { form: UNEXPECTED_MESSAGE };
   if (message.startsWith('Photo URL ')) return { form: PHOTO_URL_MESSAGE };
   const field = fieldFor(message);
   if (field !== undefined && (visible === undefined || visible.includes(field))) {
     return { fields: { [field]: message } };
   }
   return { form: message };
 }
diff --git a/packages/frontend/src/features/me/validation.ts b/packages/frontend/src/features/me/validation.ts
index 662b597f..1a289d08 100644
--- a/packages/frontend/src/features/me/validation.ts
+++ b/packages/frontend/src/features/me/validation.ts
@@ -1,414 +1,414 @@
 import type { ChangePasswordInput, MyProfile, UpdateMyProfileInput } from '@alumni/shared';
 
 // Rules and messages mirror the backend, so the client and the server agree:
 // businessLogic/src/validation.ts (optionalText, requiredText, optionalYear,
 // requiredExpectedYear, optionalWebUrl, validateNewPassword, validateAlumniFields,
 // validateStudentFields, NAME_MAX, UNIVERSITY_MAX, DEPARTMENT_MAX, HEADLINE_MAX,
 // LOCATION_MAX, DEGREE_MAX and the start/graduation year order rule) and
 // UserManager.updateMe / changeMyPassword. These numbers are hand copies
 // (@alumni/shared has no runtime code); the server's own 400 message is still
 // shown if they ever drift (ADR-04).
 
 export const NAME_MAX = 100;
 export const UNIVERSITY_MAX = 150;
 export const DEPARTMENT_MAX = 100;
 export const COMPANY_MAX = 100;
 export const JOB_TITLE_MAX = 100;
 export const BIO_MAX = 2000;
 export const EXPERIENCE_MAX = 5000;
 export const LINKEDIN_URL_MAX = 255;
 export const HEADLINE_MAX = 120;
 export const LOCATION_MAX = 100;
 export const DEGREE_MAX = 100;
 /** optionalYear() first runs the text check with a 10-character limit. */
 export const YEAR_TEXT_MAX = 10;
 export const YEAR_MIN = 1900;
 /** Graduation year: up to this year + 10. */
 export const GRADUATION_YEAR_SPAN = 10;
 /** Expected graduation year (students): this year to this year + 8. */
 export const EXPECTED_YEAR_SPAN = 8;
 export const PASSWORD_MIN_CHARS = 8;
 /** bcrypt only uses the first 72 bytes, so the backend caps the UTF-8 length. */
 export const PASSWORD_MAX_BYTES = 72;
 
 /**
  * The year order rule (alumni): start year after graduation year. The server's
  * message is the same and starts with "Graduation year", so it lands on that
- * field, which shows at every width (Start year is hidden on phones).
+ * field.
  */
 export const YEAR_ORDER_MESSAGE = "Graduation year can't be before the start year";
 
 /** Client-only: the API has no confirmation field. */
 export const PASSWORD_MISMATCH_MESSAGE = "Passwords don't match";
 
 /**
  * Which profile the account has. Alumni wins over student, as in
  * UserManager.updateMe; 'none' is an account with neither row (e.g. admin).
  */
 export type ProfileKind = 'alumni' | 'student' | 'none';
 
 /** The profile's text fields as typed (strings); each has an input. */
 export interface ProfileTextValues {
   name: string;
   headline: string;
   location: string;
   bio: string;
   university: string;
   degree: string;
   department: string;
   start_year: string;
   graduation_year: string;
   expected_graduation_year: string;
   job_title: string;
   current_company: string;
   linkedin_url: string;
   experience: string;
 }
 
 /**
  * The whole form state: the text fields plus the Mentorship switch (alumni
  * only), which is a boolean and so stays out of the text binder and the checks.
  */
 export interface ProfileValues extends ProfileTextValues {
   mentorship_available: boolean;
 }
 
 export interface PasswordValues {
   current_password: string;
   new_password: string;
   confirm_password: string;
 }
 
 export type ProfileField = keyof ProfileTextValues;
 export type PasswordField = keyof PasswordValues;
 export type MeField = ProfileField | PasswordField;
 
 export type ProfileErrors = Partial<Record<ProfileField, string>>;
 export type PasswordErrors = Partial<Record<PasswordField, string>>;
 export type MeErrors = Partial<Record<MeField, string>>;
 
 export const EMPTY_PASSWORD_VALUES: PasswordValues = {
   current_password: '',
   new_password: '',
   confirm_password: '',
 };
 
 export const PASSWORD_FIELDS: readonly PasswordField[] = [
   'current_password',
   'new_password',
   'confirm_password',
 ];
 
 // Shown text fields per kind, in form order: Personal, Education, Career.
 // Headline, location, degree and start year are alumni only (REQ-011).
 const FIELDS: Record<ProfileKind, readonly ProfileField[]> = {
   alumni: [
     'name',
     'headline',
     'location',
     'bio',
     'university',
     'degree',
     'department',
     'start_year',
     'graduation_year',
     'job_title',
     'current_company',
     'linkedin_url',
     'experience',
   ],
   student: [
     'name',
     'bio',
     'university',
     'department',
     'expected_graduation_year',
     'job_title',
     'current_company',
     'linkedin_url',
     'experience',
   ],
   none: ['name', 'university'],
 };
 
 export function profileKind(profile: MyProfile): ProfileKind {
   if (profile.has_alumni_profile) return 'alumni';
   if (profile.has_student_profile) return 'student';
   return 'none';
 }
 
 /** True when this kind of account sees and sends the Mentorship switch. */
 export function hasMentorship(kind: ProfileKind): boolean {
   return kind === 'alumni';
 }
 
 /** The text fields this kind of account sees and sends, in form order. */
 export function profileFields(kind: ProfileKind): readonly ProfileField[] {
   return FIELDS[kind];
 }
 
 // The API can answer null for an empty column, and a year may arrive as a number.
 function text(value: unknown): string {
   if (typeof value === 'string') return value;
   if (typeof value === 'number') return String(value);
   return '';
 }
 
 /** Form values from the stored profile; null or missing becomes ''. */
 export function toValues(profile: MyProfile): ProfileValues {
   return {
     name: text(profile.name),
     headline: text(profile.headline),
     location: text(profile.location),
     bio: text(profile.bio),
     university: text(profile.university),
     degree: text(profile.degree),
     department: text(profile.department),
     start_year: text(profile.start_year),
     graduation_year: text(profile.graduation_year),
     expected_graduation_year: text(profile.expected_graduation_year),
     job_title: text(profile.job_title),
     current_company: text(profile.current_company),
     linkedin_url: text(profile.linkedin_url),
     experience: text(profile.experience),
     // Always a boolean from the API; anything else (a missing field) reads as off.
     mentorship_available: profile.mentorship_available === true,
   };
 }
 
 // Mirrors optionalText(): NUL rejected, then the trimmed length.
 function optionalTextError(value: string, field: string, max: number): string | undefined {
   if (value.includes('\u0000')) return `${field} contains an invalid character`;
   if (value.trim().length > max) return `${field} must be at most ${String(max)} characters`;
   return undefined;
 }
 
 // Mirrors requiredText().
 function requiredTextError(value: string, field: string, max: number): string | undefined {
   const textError = optionalTextError(value, field, max);
   if (textError) return textError;
   if (!value.trim()) return `${field} is required`;
   return undefined;
 }
 
 // Mirrors optionalYear(): 4 digits, 1900 to this year + 10.
 function optionalYearError(value: string, field: string, now: Date): string | undefined {
   const textError = optionalTextError(value, field, YEAR_TEXT_MAX);
   if (textError) return textError;
   const year = value.trim();
   if (!year) return undefined;
   const n = Number(year);
   if (!/^\d{4}$/.test(year) || n < YEAR_MIN || n > now.getFullYear() + GRADUATION_YEAR_SPAN) {
     return `${field} is not valid`;
   }
   return undefined;
 }
 
 // Mirrors validateAlumniFields' order rule: checked only when both years pass
 // their own checks, and reported on the graduation year.
 function yearOrderError(values: ProfileValues, now: Date): string | undefined {
   const start = values.start_year.trim();
   const graduation = values.graduation_year.trim();
   if (!start || !graduation) return undefined;
   if (optionalYearError(start, 'Start year', now) !== undefined) return undefined;
   if (optionalYearError(graduation, 'Graduation year', now) !== undefined) return undefined;
   return Number(start) > Number(graduation) ? YEAR_ORDER_MESSAGE : undefined;
 }
 
 // Mirrors requiredExpectedYear(): this year to this year + 8.
 function expectedYearError(value: string, now: Date): string | undefined {
   const field = 'Expected graduation year';
   const textError = requiredTextError(value, field, YEAR_TEXT_MAX);
   if (textError) return textError;
   const year = value.trim();
   const thisYear = now.getFullYear();
   const last = thisYear + EXPECTED_YEAR_SPAN;
   const n = Number(year);
   if (!/^\d{4}$/.test(year) || n < thisYear || n > last) {
     return `${field} must be between ${String(thisYear)} and ${String(last)}`;
   }
   return undefined;
 }
 
 // Mirrors optionalWebUrl().
 function webUrlError(value: string, field: string): string | undefined {
   const textError = optionalTextError(value, field, LINKEDIN_URL_MAX);
   if (textError) return textError;
   const url = value.trim();
   if (url && !/^https?:\/\/\S+$/i.test(url)) return `${field} must start with http:// or https://`;
   return undefined;
 }
 
 // Mirrors validateNewPassword(value, "New password"): the minimum counts
 // characters, the maximum UTF-8 bytes. Copied from features/auth/validation
 // (whose wording says "Password") because the field name differs here.
 function newPasswordError(value: string): string | undefined {
   if (value.length < PASSWORD_MIN_CHARS) {
     return `New password must be at least ${String(PASSWORD_MIN_CHARS)} characters`;
   }
   if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
     return 'New password is too long';
   }
   return undefined;
 }
 
 function fieldError(
   field: ProfileField,
   values: ProfileValues,
   kind: ProfileKind,
   now: Date,
 ): string | undefined {
   const value = values[field];
   switch (field) {
     case 'name':
       return requiredTextError(value, 'Name', NAME_MAX);
     case 'headline':
       return optionalTextError(value, 'Headline', HEADLINE_MAX);
     case 'location':
       return optionalTextError(value, 'Location', LOCATION_MAX);
     case 'degree':
       return optionalTextError(value, 'Degree', DEGREE_MAX);
     case 'start_year':
       return optionalYearError(value, 'Start year', now);
     case 'bio':
       return optionalTextError(value, 'Bio', BIO_MAX);
     case 'university':
       return optionalTextError(value, 'University', UNIVERSITY_MAX);
     case 'department':
       return kind === 'student'
         ? requiredTextError(value, 'Department', DEPARTMENT_MAX)
         : optionalTextError(value, 'Department', DEPARTMENT_MAX);
     case 'graduation_year':
       return optionalYearError(value, 'Graduation year', now) ?? yearOrderError(values, now);
     case 'expected_graduation_year':
       return expectedYearError(value, now);
     case 'job_title':
       return optionalTextError(value, 'Job title', JOB_TITLE_MAX);
     case 'current_company':
       return optionalTextError(value, 'Company', COMPANY_MAX);
     case 'linkedin_url':
       return webUrlError(value, 'LinkedIn URL');
     case 'experience':
       return optionalTextError(value, 'Experience', EXPERIENCE_MAX);
   }
 }
 
 /**
  * Profile checks for the fields this kind shows, in form order. Hidden fields
  * are never checked. `now` sets the allowed year ranges (injectable for tests).
  */
 export function validateProfile(
   values: ProfileValues,
   kind: ProfileKind,
   now: Date = new Date(),
 ): ProfileErrors {
   const errors: ProfileErrors = {};
   for (const field of FIELDS[kind]) {
     const message = fieldError(field, values, kind, now);
     if (message !== undefined) errors[field] = message;
   }
   return errors;
 }
 
 /** True when any of the three password fields has text. */
 export function hasPasswordInput(password: PasswordValues): boolean {
   return PASSWORD_FIELDS.some((field) => password[field] !== '');
 }
 
 /**
  * Password checks, only when any of the three fields is filled (all empty means
  * "not changing it"). Passwords are checked as typed, never trimmed.
  */
 export function validatePasswordChange(password: PasswordValues): PasswordErrors {
   if (!hasPasswordInput(password)) return {};
   const errors: PasswordErrors = {};
   if (password.current_password === '') errors.current_password = 'Current password is required';
   const newError = newPasswordError(password.new_password);
   if (newError) errors.new_password = newError;
   else if (password.new_password === password.current_password) {
     errors.new_password = 'New password must be different from the current one';
   }
   if (password.confirm_password !== password.new_password) {
     errors.confirm_password = PASSWORD_MISMATCH_MESSAGE;
   }
   return errors;
 }
 
 /**
  * True when any field this kind shows differs from the baseline: text trimmed,
  * the Mentorship switch by value (alumni only).
  */
 export function isProfileChanged(
   values: ProfileValues,
   baseline: ProfileValues,
   kind: ProfileKind,
 ): boolean {
   if (hasMentorship(kind) && values.mentorship_available !== baseline.mentorship_available) {
     return true;
   }
   return FIELDS[kind].some((field) => values[field].trim() !== baseline[field].trim());
 }
 
 /** Unsaved changes: a shown profile field differs, or a password field has text. */
 export function isDirty(
   values: ProfileValues,
   baseline: ProfileValues,
   kind: ProfileKind,
   password: PasswordValues,
 ): boolean {
   return isProfileChanged(values, baseline, kind) || hasPasswordInput(password);
 }
 
 export interface SavePlan {
   /** PUT /api/me is needed: a profile field changed. */
   saveProfile: boolean;
   /** PUT /api/me/password is needed: a password field has text. */
   savePassword: boolean;
   /** Errors in form order; when non-empty, nothing is sent. */
   errors: MeErrors;
 }
 
 /**
  * What one Save does. When no profile field changed, PUT /api/me is skipped and
  * only the password fields are checked, so a stored value the rules now reject
  * (e.g. a student's past expected year) never blocks a password change (ADV-003).
  */
 export function planSave(
   values: ProfileValues,
   baseline: ProfileValues,
   kind: ProfileKind,
   password: PasswordValues,
   now: Date = new Date(),
 ): SavePlan {
   const saveProfile = isProfileChanged(values, baseline, kind);
   const savePassword = hasPasswordInput(password);
   const errors: MeErrors = {
     ...(saveProfile ? validateProfile(values, kind, now) : {}),
     ...validatePasswordChange(password),
   };
   return { saveProfile, savePassword, errors };
 }
 
 /**
  * The PUT /api/me body: every field this kind shows, trimmed (an empty one is
  * sent as '' and cleared, since the endpoint is a full replace), plus the stored
  * photo_url so Save never erases it, and for alumni the Mentorship switch
  * (always sent, since an omitted one is saved as off). Never email, never a
  * field the kind does not show.
  */
 export function toUpdateInput(
   values: ProfileValues,
   kind: ProfileKind,
   photoUrl: string | null | undefined,
 ): UpdateMyProfileInput {
   const input: UpdateMyProfileInput = { name: values.name.trim() };
   for (const field of FIELDS[kind]) input[field] = values[field].trim();
   if (hasMentorship(kind)) input.mentorship_available = values.mentorship_available;
   if (typeof photoUrl === 'string') input.photo_url = photoUrl;
   return input;
 }
 
 /** The PUT /api/me/password body, as typed. */
 export function toPasswordInput(password: PasswordValues): ChangePasswordInput {
   return { current_password: password.current_password, new_password: password.new_password };
 }
```

## Tests and docs diff, 4 lines of context

```diff
diff --git a/.adlc/knowledge/components/backend.md b/.adlc/knowledge/components/backend.md
index 8eb34b2e..72f082c5 100644
--- a/.adlc/knowledge/components/backend.md
+++ b/.adlc/knowledge/components/backend.md
@@ -26,9 +26,9 @@ Express 4 + Postgres API in three npm workspaces that form one pipeline: routes
 - Not yet: controllers as classes + one Express error middleware (redesign convention); token revocation (role is trusted from the JWT for up to 1 hour).
 
 ## Gotchas
 
-[[knowledge/gotchas#^g02|G02]] vitest hoisting · [[knowledge/gotchas#^g13|G13]] pool mock path · [[knowledge/gotchas#^g14|G14]] requireId → 404 · [[knowledge/gotchas#^g15|G15]] schema only in backups · [[knowledge/gotchas#^g16|G16]] packet excludes · [[knowledge/gotchas#^g21|G21]] LIKE escaping · [[knowledge/gotchas#^g22|G22]] baseDTO casing · [[knowledge/gotchas#^g23|G23]] NUL → 400 · [[knowledge/gotchas#^g24|G24]] TestManager sweep
+[[knowledge/gotchas#^g02|G02]] vitest hoisting · [[knowledge/gotchas#^g13|G13]] pool mock path · [[knowledge/gotchas#^g14|G14]] requireId → 404 · [[knowledge/gotchas#^g15|G15]] schema only in backups · [[knowledge/gotchas#^g16|G16]] packet excludes · [[knowledge/gotchas#^g21|G21]] LIKE escaping · [[knowledge/gotchas#^g22|G22]] BaseDTO file name · [[knowledge/gotchas#^g23|G23]] NUL → 400 · [[knowledge/gotchas#^g24|G24]] TestManager sweep
 
 ## Touched by
 
 - [[REQ-003]] — auth on every non-public route, post ownership, partial post update, shared sendError, first backend test suite (ADR-05)
diff --git a/.adlc/knowledge/concepts/route-layout.md b/.adlc/knowledge/concepts/route-layout.md
index 72ce71f2..7eea62fc 100644
--- a/.adlc/knowledge/concepts/route-layout.md
+++ b/.adlc/knowledge/concepts/route-layout.md
@@ -22,8 +22,9 @@
 - **Phone tab bar height.** `AppShell` sets `--tab-bar-height` on the shell (0 from 48rem) and `BottomTabs` uses it as its min height, so a page's own fixed bottom bar (the `/me` save bar) can sit just above the tab bar.
 - **Tests:** `createRoutes(pageRoutes)` puts test pages under `AppShell`. To test "a guest sees the header", use an unknown path, not `/login` ([[knowledge/gotchas#^g19|G19]]).
 
 - **Deliberate design deviation ([[REQ-012]]).** `/me` is "Account settings" (the S1/S2/S3/S5 screens still draw "My Profile"): it is not in the header nav (reached from the avatar menu and the Home card) and the phone tab bar's third tab reads "Account". `HEADER_NAV_ITEMS` and `TAB_NAV_ITEMS` in `app/AppShell/navItems.tsx` are separate lists so the two navs can differ.
+- **Deliberate design deviation ([[REQ-013]]).** Account settings shows Start year at every width, although the S5 phone design has none: phones stack Degree, Start year, Graduation year, so no editable field is ever hidden.
 
 ## Related
 
 [[knowledge/concepts/session-and-401]] · [[knowledge/components/frontend]]
diff --git a/.adlc/knowledge/gotchas.md b/.adlc/knowledge/gotchas.md
index d03d077c..a20d6106 100644
--- a/.adlc/knowledge/gotchas.md
+++ b/.adlc/knowledge/gotchas.md
@@ -501,9 +501,9 @@ Use both. They serve different purposes.
 **Related:** [[REQ-005]]
 
 ---
 
-## G22 — `dal/dto/baseDTO.ts` is lower-case in git; import it as `./baseDTO` ^g22
+## G22 — `dal/dto/BaseDTO.ts`: git name, disk name and imports must share one casing ^g22
 
 | Field | Value |
 |---|---|
 | Discovered | 2026-10-06 |
@@ -511,13 +511,15 @@ Use both. They serve different purposes.
 | Component | backend dal |
 | Status | confirmed |
 | Severity | trap |
 
-**What:** Git tracks `baseDTO.ts`. Four DTOs imported `./BaseDTO`, which works on a case-insensitive Mac checkout (and `core.ignorecase=true` hides the mismatch), but fails `tsc` with TS1261 in any fresh clone, worktree or Linux CI. Fixed in REQ-005 by importing `./baseDTO`.
+**What:** Since REQ-013 the file is `BaseDTO.ts` in git and on disk (like the other DTOs), and the four DTOs import `./BaseDTO`. A mismatch works on a case-insensitive Mac checkout (`core.ignorecase=true` hides it) but fails `tsc` with TS1261 in a fresh clone, worktree, Linux CI, or wherever the disk name differs from the import.
 
-**Don't:** Import with the exact case git tracks (`git ls-files` shows it). Renaming the file to `BaseDTO.ts` would also work, but needs a two-step `git mv` on macOS.
+**History:** git used to track `baseDTO.ts`; REQ-005 changed the imports to `./baseDTO`, and later the disk name drifted to `BaseDTO.ts` again (G32). That lowercase rule no longer applies.
 
-**Related:** [[REQ-005]]
+**Don't:** rename a tracked file by case alone on macOS: use a two-step `git mv` (`a` → temp → `A`) and check `git ls-files` afterwards. Import with the exact case git tracks.
+
+**Related:** [[REQ-005]] · [[REQ-013]] · [[knowledge/gotchas#^g32|G32]]
 
 ---
 
 ## G23 — Postgres rejects NUL characters in text; validators turn them into a 400 ^g23
@@ -707,9 +709,9 @@ Use both. They serve different purposes.
 
 **Don't:** replace the subquery with a join, or split the update and its read-back into two statements.
 **Related:** [[knowledge/lessons/LESSON-REQ-009-1-profile-links-need-the-alumni-id|L-REQ-009-1]]
 
-## G32 — Backend typecheck needs a fresh businessLogic dist and stops early on this machine ^g32
+## G32 — Backend typecheck needs a fresh businessLogic dist ^g32
 
 | Field | Value |
 |---|---|
 | Discovered | 2026-10-07 |
@@ -719,14 +721,14 @@ Use both. They serve different purposes.
 | Severity | careful |
 
 **What:**
 - `npm run typecheck:backend` type-checks `api` against `businessLogic/dist/*.d.ts`: after adding a Manager method, run `tsc` in `packages/backend/src/businessLogic` first or it fails with "does not exist". Tests and `tsconfig.test.json` read the source, so they never show it.
-- On this checkout git tracks `dal/dto/baseDTO.ts` but the file on disk is `BaseDTO.ts` (core.ignorecase hides it), so `tsc` fails TS1261 at the dal step; the script chains with `&&`, so `tsconfig.test.json` is never checked. `npx tsc -p tsconfig.test.json` by hand hits the same TS1261 (it includes dal), so it is not a workaround (REQ-011): check with a scratch tsconfig outside the repo that extends it, sets `forceConsistentCasingInFileNames: false` and `typeRoots` to the root `node_modules/@types` (without `typeRoots` it fails TS2688 for `node`), or fix the file name with a two-step `git mv`.
+- Fixed in REQ-013: the TS1261 casing failure at the dal step (git tracked `baseDTO.ts`, the disk had `BaseDTO.ts`) is gone, since the file is now `BaseDTO.ts` everywhere (G22). The script chains with `&&`, so a failure in an early step still skips `tsconfig.test.json`.
 
 **Where:** `packages/backend/package.json` (typecheck script), `packages/backend/src/dal/dto/`
 
-**Don't:** trust a green `typecheck:backend` as proof that test files compile; rename the file without checking `git ls-files` (the tracked name is lowercase).
-**Related:** [[knowledge/gotchas#^g12|G12]]
+**Don't:** trust a green `typecheck:backend` as proof that `dist/` is current (it reads `dist/*.d.ts` only for `api`; tests read the source).
+**Related:** [[knowledge/gotchas#^g12|G12]] · [[knowledge/gotchas#^g22|G22]]
 
 ## G33 — Two contrast pairs the tokens do not cover ^g33
 
 | Field | Value |
@@ -843,9 +845,9 @@ Use both. They serve different purposes.
 **What:**
 - Backend messages start with the API field name ("Bio", "Company", "Job title"), which differs from the UI labels (About, Current role): use an explicit prefix table, "prefix + space", longest first ("Expected graduation year" before "Graduation year").
 - `optionalYear` checks the 10-character text limit before the year rules, so a long year says "must be at most 10 characters", not "is not valid": mirror that order.
 - `PUT /api/me` clears every omitted optional field, including `photo_url`: always send the stored value back.
-- A cross-field message must start with the label of a field that is visible at every width (REQ-011: "Graduation year can't be before the start year" lands on the field phones still show). `mentorship_available` is a boolean sent every time; omitted means false on every full-replace route.
+- A cross-field message lands on the field its text starts with (REQ-011: "Graduation year can't be before the start year" lands on Graduation year). Keep that field visible at every width; since REQ-013 every /me field is. `mentorship_available` is a boolean sent every time; omitted means false on every full-replace route.
 
 **Where:** `features/me/profileErrors.ts`, `features/me/validation.ts`; `businessLogic/src/validation.ts:31`
 
 **Don't:** match by label text or send a partial body.
diff --git a/CLAUDE.md b/CLAUDE.md
index fc4beebd..c76f1dd3 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -92,9 +92,9 @@ Each backend sub-package is its own workspace with its own `package.json`/`tscon
 - **Lazy routes (ADR-08):** large pages load with the route's `lazy`, so each is its own chunk; Home stays eager. Four lazy pages: `DIRECTORY_ROUTE` (`/directory`, `import('@/features/directory/DirectoryPage')`), `PROFILE_ROUTE` (`/alumni/:id`, `import('@/features/profile/ProfilePage')`), `FEED_ROUTE` (`/feed`, `import('@/features/feed/FeedPage')`) and `ME_ROUTE` (`/me`, `import('@/features/me/MePage')`) in `app/router.tsx`. Nothing else in `src/` may import any of them statically, not even another lazy feature (none has an `index.ts`; an ESLint rule bans each outside its own folder and tests, `import type` excepted, and `app/lazyRoutes.test.ts` reads every non-test file and fails on one; both run one check per feature from the `LAZY_FEATURES` list). `HydrateFallback` ("Loading…" in `<main>`) must be a static property of the lazy route object itself: the router stops rendering at the nearest route with a fallback, so on the root it would hide the shell. A chunk that fails to load shows the inner `RouteError`. Check with `npm run build` that the page is a separate chunk in `dist/assets`.
 - **Directory (REQ-006):** `features/directory` lists alumni from `GET /api/alumni`, 12 per page. Search text, filters and page live in the URL query string (ADR-08), parsed by the pure `params.ts`, which ignores any value the API would reject; filters and pages push history, typed search replaces the URL after 300 ms. `useAlumniSearch` is the TanStack Query hook. States: skeletons, error with Retry, no matches with Clear filters, no alumni yet, page past the end. A card closes with a "Mentor" `Tag` when `mentorship_available` is true (REQ-011).
 - **Profile (REQ-008):** `features/profile` shows `/alumni/:id` from `GET /api/alumni/:id` and `GET /api/posts/user/:userId` (newest 5): header, About, Education, Employment, Recent posts; a section with no data is hidden, as is any header part with no data. Since REQ-011 the header shows the alumnus's `headline` in place of the "Job title at Company" line when set (" · Class of YYYY" stays), the location, and an "Available for mentorship" badge when `mentorship_available` is true; Education shows "Degree · 2013–2017" (degree and years) in place of the department when a degree is set; a posts failure keeps the profile. 404 (unknown or malformed id) shows "Profile not found". "Back to directory" restores the directory search through router state, whose shape only `config/directoryReturn` knows (lazy features never import each other).
 - **Feed (REQ-009):** `features/feed` shows `/feed` from `GET /api/posts` (20 per page, Load more): a composer, post cards with comment threads (one level of replies), and edit/delete for the author or an admin (the API stays the judge; a refused write shows its message). New posts and comments appear before the server answers and roll back on failure (ADR-09). A post with comments asks inline before it is deleted. The author name links to `/alumni/<author_alumni_id>` only when that is set. Details: `packages/frontend/src/features/feed/README.md`.
-- **Account settings (REQ-010, renamed in REQ-012):** `features/me` is the signed-in user's own editor at `/me` (design `docs/design/screens/app/S5-*`, which calls it My Profile), reached from the avatar menu, Home and, on phones, the "Account" tab (not the desktop header nav). It reads the `['me']` query and saves with `PUT /api/me` (a full replace, so the stored `photo_url` is sent back unchanged), then `PUT /api/me/password` when a password was typed. Sections: Personal, Education, Career, Mentorship, Password; the account's kind (alumni, student, or no profile row) decides which fields show. Alumni only (REQ-011): Headline and Location in Personal, Degree and Start year in Education, and the Mentorship card (a `Switch`, "Available for mentorship"; its help text names the profile badge and the directory Mentor tag; the value is always sent). Start year is hidden below 48rem by CSS (S5 phone has none) and its value kept; the year order error shows on Graduation year. Errors follow the API's rules, shown when a field is left or Save is tried. A save bar ("Unsaved changes", Discard, Save) shows only while something changed; leaving with unsaved changes or a save in flight asks first (`useBlocker` plus the browser's leave prompt). A save shows a toast and, while nothing is unsaved, the caption "All sections saved — no unsaved changes." The save is not optimistic and a refetch never remounts the form. On phones the bar sits above the tab bar through `--tab-bar-height` (set on `AppShell`). **Not built:** photo upload, though S5 shows it, because the API has no endpoint for it; it needs its own REQ. Email is never shown or sent. Details: `packages/frontend/src/features/me/README.md`.
+- **Account settings (REQ-010, renamed in REQ-012):** `features/me` is the signed-in user's own editor at `/me` (design `docs/design/screens/app/S5-*`, which calls it My Profile), reached from the avatar menu, Home and, on phones, the "Account" tab (not the desktop header nav). It reads the `['me']` query and saves with `PUT /api/me` (a full replace, so the stored `photo_url` is sent back unchanged), then `PUT /api/me/password` when a password was typed. Sections: Personal, Education, Career, Mentorship, Password; the account's kind (alumni, student, or no profile row) decides which fields show. Alumni only (REQ-011): Headline and Location in Personal, Degree and Start year in Education, and the Mentorship card (a `Switch`, "Available for mentorship"; its help text names the profile badge and the directory Mentor tag; the value is always sent). Start year shows at every width, although the S5 phone design has none (REQ-013); the year order error shows on Graduation year. Errors follow the API's rules, shown when a field is left or Save is tried. A save bar ("Unsaved changes", Discard, Save) shows only while something changed; leaving with unsaved changes or a save in flight asks first (`useBlocker` plus the browser's leave prompt). A save shows a toast and, while nothing is unsaved, the caption "All sections saved — no unsaved changes." The save is not optimistic and a refetch never remounts the form. On phones the bar sits above the tab bar through `--tab-bar-height` (set on `AppShell`). **Not built:** photo upload, though S5 shows it, because the API has no endpoint for it; it needs its own REQ. Email is never shown or sent. Details: `packages/frontend/src/features/me/README.md`.
 - **Dev proxy:** `vite.config.ts` proxies `/api` to `http://localhost:<PORT>` (`PORT` read from the root `.env`, default 3000; nothing else from that file reaches the client). Run the API alongside Vite (root `npm run dev`).
 
 ## Conventions (redesign)
 
diff --git a/packages/frontend/README.md b/packages/frontend/README.md
index 5e98834b..818367a3 100644
--- a/packages/frontend/README.md
+++ b/packages/frontend/README.md
@@ -144,9 +144,9 @@ REQ-009, ADR-09. `/feed` (signed in; the header's "Feed" link, the Feed tab on p
 
 REQ-010, renamed from My Profile in REQ-012. `/me` (signed in; the avatar menu's "Account settings", the Home card and, on phones, the Account tab) lets the signed-in user edit their own details and change their password, after the S5 designs.
 
 - **Saving:** one Save sends `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed. A save bar shows while there are unsaved changes, a prompt asks before leaving with them, and a toast confirms a save. Not optimistic.
-- **Sections:** which ones show depends on the account (alumni, student, or no profile row). Alumni also get Headline, Location, Degree, Start year (hidden below 48rem, value kept) and a Mentorship switch (REQ-011). Email is never shown or sent; photo upload is not built (no API for it).
+- **Sections:** which ones show depends on the account (alumni, student, or no profile row). Alumni also get Headline, Location, Degree, Start year (at every width since REQ-013) and a Mentorship switch (REQ-011). Email is never shown or sent; photo upload is not built (no API for it).
 - More: `src/features/me/README.md`.
 
 ## Forms
 
diff --git a/packages/frontend/src/features/me/ProfileForm.test.tsx b/packages/frontend/src/features/me/ProfileForm.test.tsx
index e1628802..dc12e54f 100644
--- a/packages/frontend/src/features/me/ProfileForm.test.tsx
+++ b/packages/frontend/src/features/me/ProfileForm.test.tsx
@@ -13,15 +13,13 @@ import { httpClient } from '@/services/httpClient';
 import { LEAVE_PROMPT_TEXT } from './LeavePrompt';
 import { MENTORSHIP_HELP, MENTORSHIP_LABEL } from './MentorshipSection';
 import {
   ALL_SAVED_TEXT,
-  HIDDEN_FIELD_HINT,
   PASSWORD_SAVED_TEXT,
   PROFILE_SAVED_TEXT,
   ProfileForm,
   TOAST_DISMISS_LABEL,
   TOAST_MS,
-  YEAR_ORDER_HIDDEN_MESSAGE,
 } from './ProfileForm';
 import { SAVE_BAR_LABEL } from './SaveBar';
 import { YEAR_ORDER_MESSAGE } from './validation';
 
@@ -514,86 +512,60 @@ describe('ProfileForm alumni fields and Mentorship', () => {
     });
     expect(screen.getByLabelText(label)).toHaveAccessibleDescription(message);
   });
 
-  // Below 48rem CSS hides Start year (jsdom applies no CSS, so the test hides
-  // it by hand): its error goes on the form with a hint, never on a field
-  // that cannot take focus.
-  function hideStartYear() {
-    // Class names are not scoped in tests: this is EducationSection's wrapper.
-    const wrapper = screen.getByLabelText('Start year').closest('.wideOnly');
-    if (!(wrapper instanceof HTMLElement)) throw new Error('no Start year wrapper');
-    wrapper.style.display = 'none';
-  }
-
-  it('shows a hidden Start year check failure on the form, focused', async () => {
-    const user = userEvent.setup();
-    api(() => ({ status: 500 }));
+  // REQ-013: Start year shows at every width, so its errors stay on it.
+  it('renders Start year with its label for an alumni user, in no width-hidden wrapper', () => {
     renderForm(ALUMNI);
-    await user.type(screen.getByLabelText('Start year'), '20x7');
-    hideStartYear();
-    await user.click(screen.getByRole('button', { name: 'Save changes' }));
-    expect(calls).toEqual([]);
-    const alert = screen.getByText(`Start year is not valid. ${HIDDEN_FIELD_HINT}`);
-    expect(alert.closest('[tabindex="-1"]')).toHaveFocus();
+    const start = screen.getByLabelText('Start year');
+    expect(start).toBeVisible();
+    // Class names are not scoped in tests, so the old wrapper's name would match.
+    expect(start.closest('.wideOnly')).toBeNull();
+    expect(start.closest('[style*="display: none"]')).toBeNull();
   });
 
-  it('shows a server Start year error on the form when the field is hidden', async () => {
+  it('shows a Start year check failure on Start year and focuses it on Save', async () => {
     const user = userEvent.setup();
-    api(() => ({ status: 400, data: { message: 'Start year is not valid' } }));
+    api(() => ({ status: 500 }));
     renderForm(ALUMNI);
-    hideStartYear();
-    await user.type(screen.getByLabelText('Headline'), 'PM');
+    const start = screen.getByLabelText('Start year');
+    await user.type(start, '20x7');
     await user.click(screen.getByRole('button', { name: 'Save changes' }));
-    const alert = await screen.findByText(`Start year is not valid. ${HIDDEN_FIELD_HINT}`);
-    await waitFor(() => {
-      expect(alert.closest('[tabindex="-1"]')).toHaveFocus();
-    });
+    expect(calls).toEqual([]);
+    expect(start).toHaveFocus();
+    expect(start).toHaveAccessibleDescription('Start year is not valid');
+    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
   });
 
-  it('shows a hidden Start year error on the form when a shown field is invalid too', async () => {
+  it('focuses the first invalid field on Save when several are invalid', async () => {
     const user = userEvent.setup();
     api(() => ({ status: 500 }));
     renderForm(ALUMNI);
     await user.type(screen.getByLabelText('Start year'), '20x7');
-    hideStartYear();
     await user.clear(screen.getByLabelText('Full name'));
     await user.click(screen.getByRole('button', { name: 'Save changes' }));
     expect(calls).toEqual([]);
     expect(screen.getByLabelText('Full name')).toHaveFocus();
-    expect(screen.getByRole('alert')).toHaveTextContent(
-      `Start year is not valid. ${HIDDEN_FIELD_HINT}`,
+    expect(screen.getByLabelText('Start year')).toHaveAccessibleDescription(
+      'Start year is not valid',
     );
+    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
   });
 
-  it('adds the hint to the year order message when Start year is hidden', async () => {
+  it('shows the plain year order message on Graduation year on blur and on Save', async () => {
     const user = userEvent.setup();
     api(() => ({ status: 500 }));
     renderForm(ALUMNI_FULL);
-    hideStartYear();
     const graduation = screen.getByLabelText('Graduation year');
     await user.clear(graduation);
     await user.type(graduation, '2010');
     await user.tab();
-    expect(graduation).toHaveAccessibleDescription(YEAR_ORDER_HIDDEN_MESSAGE);
+    expect(graduation).toHaveAccessibleDescription(YEAR_ORDER_MESSAGE);
     await user.click(screen.getByRole('button', { name: 'Save changes' }));
     expect(calls).toEqual([]);
     expect(graduation).toHaveFocus();
-    expect(graduation).toHaveAccessibleDescription(YEAR_ORDER_HIDDEN_MESSAGE);
-  });
-
-  it('adds the hint to a server year order message when Start year is hidden', async () => {
-    const user = userEvent.setup();
-    api(() => ({ status: 400, data: { message: YEAR_ORDER_MESSAGE } }));
-    renderForm(ALUMNI);
-    hideStartYear();
-    await user.type(screen.getByLabelText('Headline'), 'PM');
-    await user.click(screen.getByRole('button', { name: 'Save changes' }));
-    const graduation = screen.getByLabelText('Graduation year');
-    await waitFor(() => {
-      expect(graduation).toHaveFocus();
-    });
-    expect(graduation).toHaveAccessibleDescription(YEAR_ORDER_HIDDEN_MESSAGE);
+    expect(graduation).toHaveAccessibleDescription(YEAR_ORDER_MESSAGE);
+    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
   });
 });
 
 describe('ProfileForm leave guard', () => {
diff --git a/packages/frontend/src/features/me/README.md b/packages/frontend/src/features/me/README.md
index 62996248..3afc7f13 100644
--- a/packages/frontend/src/features/me/README.md
+++ b/packages/frontend/src/features/me/README.md
@@ -5,9 +5,9 @@
 **What is here:**
 
 - `MePage` — reads the `['me']` query (`useCurrentUser`) and shows skeleton cards, a first-load error with Retry, or `ProfileForm`. Heading and tab title "Account settings · Alma" (`ME_HEADING`; REQ-012 renamed it from "My Profile", the S5 design's name). Below 48rem a slim top bar (back arrow and title, one link "Back to home") replaces the visible h1, which stays in the page clipped (never `display: none`). Focus goes to the h1 on a view change only when focus was lost (LESSON-REQ-008-2).
 - `ProfileForm` — the controlled form (ADR-04). Keyed on `user_id` only, so a refetch or the save's own cache write never remounts it (ADV-004): the saved profile, the baseline for "unsaved changes", the toast and the password error live in its state and are replaced from the save's result. Errors show when a field is left or Save is tried; a failed Save focuses the first invalid field after `flushSync`. Discard restores the baseline and clears the password fields. After a save in this visit, and only while nothing is unsaved, a caption under the cards reads "All sections saved — no unsaved changes." (S5-UnsavedToast); the success toast (the `Toast` primitive, always mounted so its status region announces the message) closes after 4 s, paused while hovered or focused, or on Dismiss (focus then goes to the heading).
-- Sections, in S5's order: `PersonalSection`, `EducationSection`, `CareerSection`, `MentorshipSection`, `PasswordSection` (labelled regions with an h2; shared `Section.module.css`). The account's kind (`profileKind`: alumni, student, none) decides which show: an account with no profile row gets Personal (name and University) and Password only. Alumni only (REQ-011): Headline and Location in Personal, Degree and Start year in Education, and the Mentorship card (the `Switch` primitive, "Available for mentorship", help text naming the profile badge and the directory Mentor tag; a boolean kept outside the text binder, counted as unsaved by value and always sent). Start year is hidden below 48rem by CSS (`.wideOnly`; S5 phone has none), its value kept; an error on it while hidden goes on the form with a hint instead of a field that cannot take focus. The year order rule (start after graduation) shows on Graduation year, client and server alike. "Change photo" is left out (no API for it); email is never shown or sent.
+- Sections, in S5's order: `PersonalSection`, `EducationSection`, `CareerSection`, `MentorshipSection`, `PasswordSection` (labelled regions with an h2; shared `Section.module.css`). The account's kind (`profileKind`: alumni, student, none) decides which show: an account with no profile row gets Personal (name and University) and Password only. Alumni only (REQ-011): Headline and Location in Personal, Degree and Start year in Education, and the Mentorship card (the `Switch` primitive, "Available for mentorship", help text naming the profile badge and the directory Mentor tag; a boolean kept outside the text binder, counted as unsaved by value and always sent). Start year shows at every width (REQ-013), although S5 phone has none: phones stack Degree, Start year, Graduation year; its errors show on it like any field. The year order rule (start after graduation) shows on Graduation year, client and server alike. "Change photo" is left out (no API for it); email is never shown or sent.
 - `SaveBar` — the fixed "Unsaved changes" region with Discard and Save (the form's submit button), shown only while dirty or while a navigation waits for an answer. `LeavePrompt` takes its place then: "Leave" / "Keep editing" (focus starts on Keep editing). `InfoIcon` is the bar's decorative icon.
 - Hooks: `useUpdateProfile` (one `useMutation`: `PUT /api/me` when a profile field changed, then `PUT /api/me/password` when a password was typed; a password failure is returned, not thrown; on success it writes `['me']` and invalidates `['alumni']` and `['posts']`, unless the session is gone; not optimistic). `useLeaveGuard(active)` (`useBlocker` plus `beforeunload`, only while dirty or saving; never blocks without a live token, to `/login`, or on the same path, so a 401 logout is never held up, ADV-002).
 - Pure helpers: `validation.ts` (`planSave`, `isDirty`, `toValues`, `toUpdateInput`, `toPasswordInput`, `hasMentorship`, the client copies of the API limits and the year order message), `profileErrors.ts` (`mapProfileError`: a server message naming a field lands on that field), `fields.ts` (the `BindField` contract the sections use).
 
```

## Requirement

---
kind: task
---
# Fix the BaseDTO casing typecheck error; show Start year at every width

| Field | Value |
|---|---|
| REQ | REQ-013 |
| Kind | task |
| Created | 2026-10-07 |
| Primary repo | alumni-system |
| Related | [[REQ-011]] (CORR-001: Start year hidden below 48rem; follow-up decided by the user) · [[knowledge/gotchas#^g22\|G22]] · [[knowledge/gotchas#^g32\|G32]] · [[knowledge/lessons/LESSON-REQ-011-2-css-hidden-fields\|L-REQ-011-2]] · [[knowledge/lessons/LESSON-REQ-012-2-record-design-deviations\|L-REQ-012-2]] |

## Goal

(1) `npm run typecheck:backend` passes on every checkout, with no TS1261 casing error. (2) My Profile shows the Start year input at every screen width, including phones and zoomed desktops, so no editable field is ever hidden.

## Acceptance criteria

- [ ] AC1. `npm run typecheck:backend` (root) exits 0: no TS1261 about `baseDTO.ts` / `BaseDTO.ts`. The git-tracked file name, the on-disk name and all four imports agree on one casing, `BaseDTO.ts` (like the other DTO files).
- [ ] AC2. The Start year field is rendered and visible at every width (no `display: none` rule, no `.wideOnly`), in Education between Degree and Graduation year on phones, as before on desktop. Its value, validation, dirty state and save payload are unchanged.
- [ ] AC3. The hidden-field machinery that existed only for the phone-hidden Start year (`isHidden` / `getComputedStyle`, `HIDDEN_FIELD_HINT`, `YEAR_ORDER_HIDDEN_MESSAGE`, `withOrderHint`, the hidden-error fallback to the form alert) is removed; the year-order error is the plain backend message on Graduation year. Tests are updated (hidden-field tests replaced by a check that Start year is always shown) and all tests, typecheck, lint, format pass. Docs and gotchas that name the old behaviour are corrected.

## Scope / non-goals

- No change to the API, validation rules, the migration, or any other field. No new design tokens.
- Deliberate deviation from the S5 phone design (it has no Start year); recorded on the route-layout concept page.
- The 48rem layout of the other fields is unchanged.

## Approach

- **Casing:** `git mv` the tracked `dal/dto/baseDTO.ts` to `BaseDTO.ts` (two steps; the working tree on this machine is case-insensitive), change the four imports (`AlumniDTO`, `CommentDTO`, `PostDTO`, `UserDTO`) from `./baseDTO` to `./BaseDTO`, then run `npm run typecheck:backend` and the backend tests. Update G22 (title and text) and G32 (no longer fails; keep the dist-rebuild bullet).
- **Start year:** in `features/me/EducationSection.tsx` drop the `.wideOnly` wrapper; in `Section.module.css` drop the `.wideOnly` rule; in `ProfileForm.tsx` remove the hidden-field helpers listed in AC3 and use the plain error paths. Check `profileErrors.ts` and `validation.ts` for leftovers.
- **Tests:** `ProfileForm.test.tsx` — remove the hidden-field tests and their `hideStartYear` helper, add one that the year-order error shows on Graduation year with the backend message and that Start year is present; `MePage.test.tsx` if it references the hint.
- **Docs (L-REQ-010-5):** `CLAUDE.md`, `packages/frontend/README.md`, `features/me/README.md` (Start year "hidden below 48rem"), `concepts/route-layout.md` (deviation from S5 phone), gotchas G22/G32, `LESSON-REQ-011-2` gets a one-line "REQ-013 chose to show it" note at wrapup.
