# REQ-011 design comparison (AC15)

Run 2026-10-07 against the live app (Vite + API, dev DB migrated with 004) and the design files `docs/design/screens/app/S2|S3|S5-*`, using one throwaway alumni account (removed afterwards). Desktop at 1383 px; phone as a 390 px frame beside the design. Screenshots were viewed in the browser session, not saved as image files (the browser tool returns them inline).

| Page | Desktop light | Desktop dark | Phone light | Phone dark |
|---|---|---|---|---|
| S3 public profile | checked (badge fixed after) | checked (badge fixed after) | checked after fix | checked after fix |
| S5 My Profile | checked | not separately checked (tokens only differ) | checked | checked |
| S2 directory | checked | checked | checked | checked (tag below the frame in this shot; seen on desktop dark) |

## Fixed
- **Mentorship badge (S3)**: was a grey `Tag` with a green dot; the design is a round sage pill. Added tokens `success-soft` / `success-strong` (the design's own hex values, contrast 5.21:1 light, 5.55:1 dark) and a pill in `ProfileHeader`. Now matches in all four S3 views checked.
- **Mentorship help text (S5)**: design says "appear in mentor search"; there is no mentor search, so the text says "…and a Mentor tag on your directory card". Intentional.

## Matches
- S3: headline line, location with pin, Education line "Degree · 2013–2017", sections hide when empty.
- S5: Headline and Location in Personal, Degree and Start year / Graduation year in Education, Mentorship card with switch (same look and place); Start year is absent on phone, as in the S5 phone design.
- S2: "Mentor" tag under the job line, accent-soft fill, in light and dark.

## Differences left, with reasons
1. **S2 phone shows the Mentor tag (and the department line)**; the S2 phone design draws a compact card without either. The tag is what was asked for on directory cards at every width; the department line was already shown before this REQ. Decision for the user.
2. **S5 "Change photo"** button absent: photo upload is out of scope.
3. **S5 field labels and input fill**: design labels are smaller and bolder, light-theme inputs are white; ours use the shared `Input` (tinted fill). Already listed in REQ-010's `s5-differences.md`; not new in this REQ.
4. **S5 "About" textarea and "Department" field** have no counterpart in the design (existing fields).
5. **Mentorship card spacing**: about 6 px more space between the label and the help text than the design. Cosmetic; left.
6. **S3 LinkedIn link / Employment history / extra posts** shown in the design are sample data; the test account had none.
7. **Design S2 files** contain unrendered template placeholders ({{p.name}}), so only layout and the tag could be compared.
