# Hollow Night Camp — Product Requirements Document

> **Document type:** Product Requirements Document (PRD)  
> **Product:** Hollow Night Camp  
> **Document status:** Working specification  
> **Audit basis:** `Hollow-Night-Camp-main (10).zip` supplied on 2026-10-21, cross-checked against the current project conversation  
> **Primary maintainer:** Kazu Alther  
> **Repository:** https://github.com/KazuAlther7/Hollow-Night-Camp  
> **Deployment reference:** Cloudflare Worker URL `https://hollow-night-camp.kazualtr.workers.dev/` (configured in Supabase Auth Redirect URLs per project progress). The repository README still references GitHub Pages; canonical production domain and final deployment routing should be verified.

---

## 1. Product Overview

**Hollow Night Camp** is a story-focused website and community hub for the *Hollow Night* universe. It should feel like entering a mysterious campsite after dark: warm campfire light, deep forests, strange details, playful illustrated visuals, and the sense that something is hidden just beyond the edge of the screen.

The product combines a novel-reading library, world-building reference material, community theory discussions, casual arcade games, reader accounts, and a secure author workspace.

The intended visual direction is **mystery-adventure with hand-crafted, animated, slightly weird charm**, taking broad inspiration from the atmosphere and illustrated storytelling of *Gravity Falls* and the suspense of *Stranger Things*. The site should have its own visual identity and must not copy either property's protected characters, logos, or artwork.

### Product vision

> Gather around the fire. Read the stories. Connect the clues. Find out what the woods are hiding.

### Main goals

1. Establish an atmospheric and memorable homepage.
2. Let readers discover and read novels and their chapters.
3. Build a cloud-backed community space for sharing and browsing theories.
4. Give the owner a secure Author Mode for managing novels, chapters, and world-building content.
5. Provide a playful arcade area and useful account settings.
6. Make the website responsive, accessible, reliable, and maintainable.
7. Deploy the static frontend through a suitable hosting platform and use Supabase for supported backend services.

---

## 2. Current Repository Audit

The statuses below describe what is evidenced by the supplied ZIP's source code. A visible page or button does **not** count as a complete feature if its underlying workflow is still a placeholder. Hosting configuration and live deployment status cannot be confirmed from the ZIP alone.

### Status legend

- **DONE — Present:** Implemented in the supplied source to a meaningful degree.
- **PARTIAL — Started:** UI or part of the workflow exists, but the full behavior is incomplete.
- **NOT STARTED — Missing:** No meaningful implementation found in the supplied source.
- **VERIFY — External check required:** Depends on live hosting, Supabase dashboard configuration, database policies, or another external service.

### 2.1 Feature status

Statuses reflect source code in the supplied ZIP plus deployment/setup progress explicitly confirmed in the ongoing project conversation. A source implementation is not treated as production-verified unless it was tested in the live environment.

| Feature / requirement | Status | Current evidence / remaining work |
| --- | --- | --- |
| Login and registration UI | **DONE** | `index.html` and `js/login.js` provide Login / Join Camp flows. |
| Supabase email/password authentication | **DONE / VERIFY** | `js/auth.js` implements sign-up, sign-in, sign-out, session retrieval and auth-state observation. Live email verification and redirect behavior still require production testing. |
| Reader profile: nickname and bio | **DONE** | `js/auth.js` reads and updates `profiles`; the Settings page reports successful saves. |
| Reader profile picture UI | **PARTIAL** | Avatar preview / remove exists; durable object storage and upload policies need verification. |
| Reader / Author role distinction | **PARTIAL** | Author role is loaded from `profiles`; Author Mode toggle and UI gating exist. Trusted role assignment and live database enforcement still need testing. |
| Author-only editor route guard | **DONE (client-side) / VERIFY (server-side)** | `initPage({ requireAuthor: true })` protects editor route. RLS remains the real security boundary and must be tested with Reader credentials. |
| Campfire homepage / welcome screen | **DONE** | `home.html`, `css/home.css`, and `js/home.js` implement the campfire welcome/home experience and visual effects. |
| Welcome background depth / parallax | **DONE** | Background and depth assets are wired into `js/parallax.js`. This is not the planned user-controlled distant-camera exploration mode. |
| Main Bar glass effect | **DONE** | `css/mainbar.css` styles the translucent glass navigation. |
| Main Bar top / sidebar / compact modes | **DONE** | `js/shared.js` includes persistent mode preferences and navigation rendering. |
| Author Mode toggle and cross-page state | **DONE (UI/state) / VERIFY (permissions)** | `js/shared.js` stores Author Mode in local storage and renders author navigation/actions. Local state is not authorization; backend policies must enforce permissions. |
| Editor's three-dot menu | **DONE** | Shared editor menu is implemented in `js/shared.js`. |
| Mobile navigation behavior | **PARTIAL** | Responsive CSS exists; verify horizontal reachability, clipping, and touch behavior on actual mobile devices. |
| Ten requested navigation icons | **DONE (assets)** | Icon assets exist; not all correspond to completed feature workflows. |
| Supabase project connection | **CONFIGURED / VERIFY** | `config/supabase.js` contains project URL and publishable key. Runtime connectivity and production configuration must be tested. |
| Supabase `profiles` table / profile persistence | **CONFIGURED / VERIFY** | Project progress confirms profile table and profile saving. Verify policies and cross-device persistence in production. |
| Novel library page | **DONE (core workflow) / VERIFY** | `js/novels.js` now queries Supabase and renders the library; verify loading, empty/error states and published-only visibility in production. |
| Novel detail page | **DONE (core workflow) / VERIFY** | `js/novels.js` loads novel details and chapter-management UI from Supabase. |
| Create / edit / delete novels | **DONE in source / VERIFY** | Novel dialog and Supabase operations exist in `js/novels.js`; verify RLS and persistence with Author and Reader sessions. |
| Novel cover upload | **PARTIAL / VERIFY** | Upload code targets the `covers` bucket with a 2 MB limit; confirm bucket and Storage policies. |
| Chapter editor UI and word count | **DONE** | `editor.html` and `js/editor.js` implement chapter fields, body editing and word count. |
| Save draft / publish chapter | **DONE in source / VERIFY** | `js/editor.js` implements persistence and draft/publish actions. Confirm database schema and RLS in the live project. |
| Chapter metadata and ordering | **DONE in source / VERIFY** | Editor supports title, subtitle, chapter number and volume fields; verify ordering and database constraints. |
| Reader chapter page | **DONE in source / VERIFY** | `read.html` and `js/read.js` load a chapter, render its content and provide chapter navigation. Draft protection depends on RLS. |
| Chapter Ratings (five d20 icons, one vote per reader per chapter) | **IMPLEMENTED IN SOURCE / VERIFY** | `js/rating.js`, `css/rating.css`, and `js/read.js` implement d20-based chapter ratings and shared rating UI. Verify live schema, one-vote enforcement, average/count, realtime updates, and RLS. |
| Novel Ratings (aggregate of all chapter votes) | **IMPLEMENTED IN SOURCE / VERIFY** | `js/rating.js` and `js/novels.js` include novel rating mounting and statistics helpers. Verify aggregation semantics, published-chapter scope, realtime behavior, and database views/functions in production. |
| Chapter import from TXT / DOCX / text-based PDF | **DONE in source / VERIFY** | `js/import.js` parses supported formats (5 MB limit), presents review flow and creates draft content. Scanned PDFs/OCR are not supported. |
| Latest Chapter section | **PARTIAL / VERIFY** | Homepage author controls/status are present, but confirm a complete reader-facing latest-published-chapter section is wired to live chapter data. |
| Global branded loading animation | **NOT STARTED** | New requirement: logo-led branded loading experience with a distinctive, polished animation used consistently across navigation/data-loading states. |
| Background music and sound effects controls | **NOT STARTED** | New requirement: separate Music and SFX enable/disable and volume controls in Settings; audio assets will live under `assets/sound/`. |
| Realtime online readers count | **NOT STARTED** | New requirement: show a live count of active reader sessions, preferably using Supabase Realtime Presence with stale-session cleanup. |
| Realtime flip-style digital clock | **NOT STARTED** | New requirement: retro folding desk-clock layout, neon digital styling and animated flipping minute cards, with selectable timezone. |
| Global Settings gear dropdown | **PARTIAL / VERIFY** | Settings currently has a dedicated page; new requirement is a global dropdown trigger that opens in place on every page, with animated gear and links to dedicated settings destinations. |
| Volumes / arcs and chapter list | **PARTIAL / VERIFY** | Volume metadata and chapter management exist in the editor/novel workflow; verify full grouping/reordering experience. |
| Theories page | **IMPLEMENTED IN SOURCE / VERIFY** | `theories.html` and `js/theories.js` implement a theory list/detail workflow, categories, posting and replies. Verify schema, moderation rules, email-verification enforcement, and RLS in the live project. |
| Theory posts, replies and cloud persistence | **IMPLEMENTED IN SOURCE / VERIFY** | `js/theories.js` queries and mutates theory/reply data through Supabase. Verify rate limits, persistence, and policies using Reader and Author accounts. |
| Theory categories and moderation | **PARTIAL / VERIFY** | Categories Confirmed / Likely / Speculation / Wild Theory are defined in `js/theories.js`; full moderation permissions and workflow need production verification. |
| Corners Arcade | **NOT STARTED** | `arcade.html` remains a “Coming soon” placeholder; arcade scores, small save-game state, and player profiles should use Supabase-backed tables with RLS. |
| D&D-style dice roll and games | **NOT STARTED** | No playable dice simulation or arcade game is present. |
| Camp Rank, EXP and levels | **NOT STARTED** | Planned progression system. No rank/EXP/streak implementation found in this ZIP. |
| Reading streak and Night Owl badge | **NOT STARTED** | Three consecutive reading days should award the Night Owl badge; requires reliable daily reading activity records and duplicate-safe award logic. |
| Daily Campfire check-in and Ember wallet | **NOT STARTED** | Check-in currency and balance/ledger system are planned; no Ember implementation found. |
| Camp Challenge author menu | **NOT STARTED** | Author-created challenges with Ember rewards require challenge CRUD, eligibility, completion validation, and reward ledger. |
| Category leaderboards and monthly reset | **NOT STARTED** | Top Theorist, Top Reader, and Top Arcade Player, monthly periods, author-controlled reset, badge and Ember rewards are planned. |
| Author Analytics Dashboard | **NOT STARTED** | Chapter reads, average ratings, popular reading hours, and all available content insights need event aggregation and an author-only dashboard. |
| Badge assets | **NOT STARTED** | Future badge artwork should be stored in `assets/badges/`; that directory is not present in this ZIP. |
| Settings: profile details | **DONE (core profile) / VERIFY** | Profile form and save feedback exist. |
| Settings: theme and language | **NOT STARTED** | No complete System / Light / Dark or English / Indonesian preference system found. |
| Notification bell / notification center | **PARTIAL** | Bell icon exists in shared navigation; a working notification center and preferences are not implemented. |
| Reading history and bookmarks | **NOT STARTED** | No persistent reading progress or bookmark workflow found. |
| Help / FAQ / bug reports | **NOT STARTED** | No complete in-site support workflow found. |
| Community social links | **NOT STARTED / VERIFY** | Not implemented as a complete Settings section in the supplied source. |
| FireWatcher easter egg / inspectable location | **NOT STARTED** | No interactive inspection system found. |
| Wide-angle / distant mountain camera mode | **NOT STARTED** | Current parallax is not the requested user-controlled camera mode. |
| Cloudflare deployment | **IN PROGRESS / VERIFY** | Project progress confirms a Cloudflare Worker URL `https://hollow-night-camp.kazualtr.workers.dev/` and that it was added to Supabase Auth Redirect URLs. The supplied ZIP does not include enough deployment configuration to verify canonical domain, build/deploy settings, or live routing. |
| Supabase database CRUD for novels / chapters | **IMPLEMENTED IN SOURCE / VERIFY** | Queries and mutations exist in `js/novels.js` and `js/editor.js`; production schema, RLS, and data persistence require live tests. |
| Security: role-based database policies | **VERIFY** | Earlier project progress established RLS and table grants for the initial schema, but current novel/chapter policies and Storage policies must be checked against the actual tables and buckets. |

### 2.2 Existing source files

The supplied ZIP includes, among others:

```text
Hollow-Night-Camp/
├── index.html
├── home.html
├── novels.html
├── novel.html
├── editor.html
├── theories.html
├── arcade.html
├── settings.html
├── config/
│   └── supabase.js
├── assets/
│   ├── image/
│   │   ├── hollow-night-logo.png
│   │   ├── welcome-bg.jpg
│   │   └── welcome-depth.png
│   └── icons/
│       ├── campfire.png
│       ├── novels.png
│       ├── theories.png
│       ├── arcade.png
│       ├── settings.png
│       ├── author-studio.png
│       ├── notification.png
│       ├── add-novel.png
│       ├── chapters.png
│       └── world-building.png
├── css/
│   ├── base.css
│   ├── mainbar.css
│   ├── novels.css
│   ├── editor.css
│   ├── auth.css
│   └── home.css
└── js/
    ├── auth.js
    ├── login.js
    ├── shared.js
    ├── home.js
    ├── novels.js
    ├── editor.js
    └── parallax.js
```

Keep working components intact where possible. Extend the existing shared navigation, authentication utilities, visual tokens, and parallax implementation instead of replacing them unnecessarily.

---

## 3. Target Audience and Roles

### 3.1 Reader

A Reader is a registered community member who can use reader-facing features.

**Allowed actions**
- Browse and read published novels and chapters.
- Browse characters, maps, locations, and other published world-building information.
- Create and participate in theory discussions, subject to community rules.
- Play available arcade games.
- Edit their own nickname, bio, and profile picture.
- Manage their own theme, language, notifications, reading history, and bookmarks when those features are implemented.
- Sign in and sign out.

**Restricted actions**
- Create, edit, publish, draft, or delete novels and chapters.
- Edit official world-building content or maps.
- Change their own account role to Author.
- Modify other users' profiles or data.
- Access author-only content-management operations.

### 3.2 Author / Site Owner

The Author is the trusted content manager for the site.

**Allowed actions**
- All normal Reader actions.
- Create and manage novels.
- Create, edit, order, draft, publish, unpublish, and delete chapters.
- Organize chapters into volumes or arcs.
- Change novel metadata and cover images.
- Import supported document files into the chapter workflow.
- Manage characters, maps, locations, and world-building content.
- Upload map images and place named markers on maps.
- Manage published content and site announcements / notifications where supported.

**Role assignment requirement**
- A user must not be able to become an Author by editing browser storage, a profile form, or a client-side request.
- Author role assignment must be performed through a trusted administrative process.
- Sensitive operations must be enforced by Supabase Row Level Security (RLS) and database policies, not only by hiding buttons or redirecting pages.

---

## 4. Information Architecture

### Main Bar

The primary navigation should contain:

1. **Campfire** — the homepage and atmospheric camp scene.
2. **Novels** — story library and world-building content.
3. **Theories** — community investigation board.
4. **Corners Arcade** — games and dice simulation.
5. **Settings** — a global gear-button dropdown that can be opened from any page without navigating away; its submenu links lead to dedicated settings pages/sections.
6. **Author Studio** — visible only to Author accounts.
7. **Notifications** — bell icon and notification center.
8. **Account / Profile** — profile shortcut and sign-out action.

Settings and Notifications may remain utility controls beside the main navigation, consistent with the current Main Bar.

### Main Bar behavior

- Default: centered floating pill with a translucent glass appearance.
- Desktop: show all primary destinations where space permits.
- Mobile: keep the bar fixed in place and allow the contents to scroll horizontally without cutting off any destination.
- Provide an animated transition between the top bar and sidebar modes.
- Sidebar may collapse to a circular three-dot control.
- In chapter-editing mode, replace the full Main Bar with a circular three-dot menu in the upper-left.
- Keep the Author Studio toggle accessible in the appropriate Author context.
- Respect reduced-motion preferences and maintain keyboard accessibility.

### Novels sub-navigation

The Novels area should provide:

- **Chapters / Reading**
- **Characters**
- **Maps**
- **Locations**

World-building sections may use sub-tabs or a secondary navigation system, but should remain understandable on mobile.

---

## 5. Functional Requirements

Priority labels:
- **P0 — Foundation:** required for secure core operation.
- **P1 — Core product:** required for the main reading and authoring experience.
- **P2 — Community / enhancement:** important, but can follow the core workflows.
- **P3 — Polish / exploration:** atmospheric extras and optional enhancements.

### 5.1 Authentication and account profiles

**Priority: P0**

1. Visitors can register using nickname, email, and password.
2. Visitors can sign in and sign out.
3. Registration and login provide clear loading, success, and error states.
4. Email verification behavior follows the configured Supabase Auth settings.
5. Protected pages redirect signed-out users to the login page.
6. The app loads the user's profile and role from the trusted backend.
7. Readers can edit their own nickname and bio.
8. Readers can upload, preview, replace, or remove a profile picture.
9. Avatar files should be stored in Supabase Storage or another appropriate object store rather than permanently embedding large base64 data URLs in profile rows.
10. Only trusted administrative processes can grant or revoke Author privileges.
11. Users can only update their own profile fields; they cannot edit role or privileged fields through normal profile updates.

**Acceptance criteria**
- A new user can register, complete any required email verification, sign in, and sign out.
- A signed-out user cannot access protected pages.
- A Reader cannot access author-only write operations by manually opening a URL or sending a direct request.
- Profile changes persist after refreshing and signing in on another device.
- Profile update errors are shown clearly and do not silently discard data.

### 5.2 Campfire homepage and welcome scene

**Priority: P1**

The homepage must establish the identity of Hollow Night Camp.

Required elements:
- Illustrated night campsite with a warm campfire.
- Pine forest, distant mountains, night sky, and atmospheric lighting.
- Friendly, slightly strange, hand-crafted visual styling.
- Introductory text and a clear action to enter the camp.
- Subtle animated fireflies, mist, embers, or other lightweight environmental effects.
- Responsive composition for desktop and mobile.
- Existing depth-map parallax welcome effect retained and improved as needed.
- A **The Latest Chapter** section showing the newest published chapter once the novel data workflow exists.
- Useful empty states when no content is published.

Avoid excessive animation, long blocking transitions, and heavy effects that make the site slow or difficult to use.

### 5.3 Interactive background exploration / FireWatcher easter egg

**Priority: P3**

This is an additional exploration mode for the Campfire homepage.

Requirements:
1. Provide a clear toggle or switch between the normal camera view and a wider, distant view.
2. Animate the camera change smoothly using parallax / layered scene movement.
3. The wider view should reveal more of the landscape, including distant mountains and a FireWatcher location.
4. The FireWatcher should be selectable or inspectable.
5. Selecting it should open a dedicated inspection panel, scene, or detail view.
6. Leave room for additional discoverable locations and easter eggs.
7. The interaction must work on touchscreens and with keyboard navigation.
8. Provide a reduced-motion alternative and a fallback if the advanced effect cannot run.

**Acceptance criteria**
- The transition does not abruptly jump or leave visible gaps in the background.
- The control clearly indicates which camera mode is active.
- The feature does not block access to normal homepage content.

### 5.4 Main Bar and navigation

**Priority: P0 / P1**

The existing Main Bar should be refined, not redesigned from scratch.

Requirements:
- Keep the existing glass effect, icon assets, and current top-bar/sidebar/compact interactions.
- Keep the bar fixed while allowing only its inner navigation area to scroll on small screens.
- Prevent the page itself from being dragged horizontally when the user scrolls the Main Bar.
- Ensure every item can be reached on small screens.
- Keep clear active states, focus indicators, accessible labels, and useful tooltips.
- Preserve the three-dot editor menu.
- Show Author Studio only for the Author role.
- Provide consistent navigation behavior across all protected pages.

### 5.5 Novel library

**Priority: P1**

Readers should be able to browse a cloud-backed list of published novels.

Novel metadata:
- Title
- Author / byline
- Genre
- Status
- Tagline
- Synopsis
- Cover image
- Created and updated timestamps
- Publication state

Requirements:
- Load novels from Supabase.
- Display cover, title, author, genre, and status consistently.
- Provide loading, error, and empty states.
- Readers must not see unpublished drafts unless explicitly authorized.
- Selecting a novel opens its detail page.
- Support useful sorting and filtering as the library grows.

### 5.6 Author Studio and novel management

**Priority: P1**

Author Studio should be a working content-management experience, not merely a set of placeholder buttons.

#### Novel list and creation

- Add a **+ New Novel** action.
- Open a dedicated **Write New Novel** page or editor panel.
- Provide fields for:
  - Novel title
  - Author / byline
  - Genre
  - Status
  - Tagline
  - Synopsis
  - Cover image
- Cover image actions: Add / Replace and Remove.
- Provide Save and Cancel actions.
- Validate required fields and display errors next to the relevant controls.
- Save the novel to Supabase and show it in the Author's novel list.

#### Novel management page

When the Author opens a novel, show:
- **Start Reading / Preview**
- **+ New Chapter**
- **Change Novel Settings**
- **Import Chapters**
- Chapter list
- Volume / arc organization

The Author must be able to edit metadata, reorder chapters, and manage publication status.

**Acceptance criteria**
- A novel remains available after a reload and a new login.
- A Reader cannot create or change official novels.
- Failed saves preserve the user's unsaved text and explain the error.

### 5.7 Chapter authoring and reading

**Priority: P1**

#### Chapter metadata

Each chapter should support:
- Chapter title
- Chapter number or ordering
- Optional subtitle
- Volume / arc
- Draft or published state
- Created and updated timestamps
- Reading body/content

#### Chapter list actions

Author-only actions:
- Mark as Draft / Publish
- Edit chapter metadata
- Edit chapter content
- Reorder within a volume / arc
- Delete, with confirmation

#### Chapter editor

- Provide a comfortable writing surface.
- Keep the current live word count.
- Add explicit Save Draft / Save Changes behavior.
- Provide clear saved / saving / failed states.
- Warn before navigating away when unsaved changes exist.
- Support the planned compact three-dot navigation menu.
- Separate editor controls from the writing page so they do not crowd the text.
- Keep the layout usable on mobile, while prioritizing long-form writing comfort on desktop.

#### Reader experience

- Readers can open published chapters from a novel's chapter list.
- Provide next / previous chapter navigation when available.
- Track reading progress and bookmarks after the History feature is implemented.
- Do not expose drafts to Readers.

### 5.8 Chapter and Novel Ratings (five-star review system)

**Priority: P1**

Implement a five-level rating system for published chapters, with a per-chapter summary and a novel-wide aggregate. Replace star artwork everywhere in this rating UI with **five d20 die icons** (icosahedron / twenty-sided die silhouette), not star glyphs. With zero ratings, show five d20 icons as outline strokes only, with no interior fill. Once ratings exist, fill the interior of each d20 icon to represent the aggregate average; use clipping or an equivalent mask so fractional values (for example, 4.5) fill proportionally and cleanly inside the die outline. Keep the outline visible over the fill for legibility. Ratings remain numeric values from 1 to 5. Do not round the underlying calculation; show one decimal place by default.

#### Rating UI and reader interaction
- Add a **Chapter Ratings** section on each published chapter reading page.
- Show five interactive d20 icons, the chapter's average rating (e.g. `4.5 / 5`), and the total number of submitted ratings.
- When no ratings exist, show `0.0 / 5`, `0 ratings`, and five outline-only d20 icons with no interior fill.
- A signed-in Reader can submit one integer rating from 1 to 5 for each chapter. Selecting a d20 icon previews/selects that value; provide a clear submit/save interaction or an explicitly documented immediate-save interaction with feedback.
- Enforce one rating per user per chapter. Repeated clicks or requests must not create duplicate votes. If rating changes are allowed, the same existing vote is updated rather than inserted as a second vote; otherwise the UI must clearly state that a submitted vote cannot be changed. **Default product behavior: allow the reader to update their own rating**, while still keeping exactly one current rating per user/chapter.
- Guests may view aggregate ratings but must sign in before submitting a rating.
- Prevent ratings on unpublished drafts and enforce this on the backend, not only in the UI.
- Provide loading, saved, error, and no-ratings states. Make the star control keyboard accessible and label each choice (for example, “Rate this chapter 4 out of 5”).

#### Chapter Ratings calculation
- Store each reader's current rating as one integer in the range 1–5, linked to both the user/profile and chapter.
- `chapter_rating_count` is the number of unique current votes for that chapter.
- `chapter_average_rating` is the sum of all current chapter vote values divided by `chapter_rating_count`.
- Example: 10 readers vote on one chapter; five give 4 stars and five give 5 stars. The chapter average is `(5 × 4 + 5 × 5) / 10 = 4.5`, with 10 ratings.
- The d20 interior fill must visually represent the average, including fractional averages such as 4.5, while retaining a crisp visible outline.

#### Novel Ratings calculation
- Add a **Novel Ratings** summary on the novel detail page and, where useful, the novel header/library card.
- The novel rating is the **weighted average of all individual current chapter votes across every published chapter belonging to that novel**. Sum every vote value from those chapters and divide by the total number of votes across those chapters. Do not simply average chapter averages, because chapters may have different numbers of votes.
- `novel_rating_count` is the total number of current individual chapter ratings across all published chapters in the novel. A user's rating of two different chapters counts as two chapter votes, because the rating is per chapter.
- If a novel has no chapter votes, show `0.0 / 5`, `0 ratings`, and five empty stars.
- Example: Chapter A has 10 votes averaging 4.5; Chapter B has 2 votes averaging 3.0. Novel average is `(10 × 4.5 + 2 × 3.0) / (10 + 2) = 4.25`, displayed as `4.3 / 5` to one decimal place, with 12 ratings.
- Adding, changing, or removing a valid vote must update both the affected Chapter Ratings and the parent Novel Ratings consistently.

#### Realtime behavior and data integrity
- Aggregate counts and averages must update in realtime for other connected readers without requiring a manual page refresh. Use Supabase Realtime or a secure database-backed refresh strategy appropriate to the final schema.
- The database must be the source of truth for rating records and aggregates. Do not trust client-supplied averages or counts.
- Recommended table: `chapter_ratings` with a stable ID, `chapter_id`, `user_id` (or profile ID consistent with the existing schema), integer `rating`, and timestamps.
- Add a unique constraint on `(chapter_id, user_id)` and a database check constraint that `rating BETWEEN 1 AND 5`.
- Enable RLS. Readers may read published chapter / novel aggregates and insert or update only their own rating, only for a published chapter. Never allow a Reader to change another user's vote. Avoid exposing voter identities in the public UI.
- Calculate aggregates using database views, safe RPCs, or equivalent queries. If aggregate values are cached/materialized, ensure rating changes update them atomically and reliably. Index `chapter_id`, `user_id`, and the relevant novel/chapter relationship for lookup and aggregation.
- Unpublishing or deleting a chapter must not leak its ratings into public Novel Ratings. Define deletion behavior consistently (prefer cascading deletion of chapter ratings when the chapter is permanently deleted).
- Handle simultaneous submissions, reconnects, duplicate events, and stale realtime subscriptions without double-counting votes. Unsubscribe when leaving the chapter page.

**Acceptance criteria**
- [ ] A chapter with no votes shows five empty stars and `0.0 / 5` with `0 ratings`.
- [ ] A signed-in Reader can submit one 1–5 rating per chapter and can update their own vote without creating a duplicate.
- [ ] The 5 × 4-star plus 5 × 5-star example produces an average of exactly 4.5 and count 10.
- [ ] The d20 icons use outline-only strokes when there are no ratings, and their interior fills accurately depict fractional averages while preserving the outlines.
- [ ] Chapter average and count update live across active clients after a vote is saved or changed.
- [ ] Novel average is computed from all individual chapter votes using a weighted average, and its count equals the total number of current votes across the novel's published chapters.
- [ ] Novel aggregates update live when a vote on any of its chapters changes.
- [ ] A Reader cannot rate a draft, impersonate another voter, or submit duplicate votes by bypassing the UI.
- [ ] RLS, unique constraints, invalid rating rejection, responsive layout, keyboard operation, and realtime unsubscribe behavior are tested.

### 5.9 Import chapters from PDF / DOC / DOCX

**Priority: P2**

Requirements:
- Provide an **Import Chapters** action in the novel management page.
- Initially support clearly documented file formats such as `.txt`, `.docx`, and text-based `.pdf`, subject to the chosen parsing libraries.
- Show file name, size, and import progress.
- Extract text into a review step before saving.
- Let the Author assign the imported content to a new chapter or existing draft.
- Preserve paragraph breaks as well as possible.
- Report unsupported, scanned, encrypted, oversized, or unreadable files.
- Never publish imported content automatically without an explicit Author action.

**Important implementation note:** PDF and Word files do not always contain clean, structured chapter data. Importing should create editable draft content first. OCR for scanned PDFs is a separate, optional enhancement.

### 5.10 World building: characters, maps, and locations

**Priority: P1 / P2**

#### Characters
- List and detail pages for official characters.
- Support appropriate fields such as name, role, description, appearance, relationships, and image.
- Only Authors can create, edit, publish, or delete official entries.

#### Maps
- Allow Authors to create a map entry and upload a map image.
- Display the map in a responsive viewer.
- Allow Authors to place named markers on the map.
- Each marker should store a stable identifier, label, description, and position relative to the image.
- Selecting a marker opens its information.
- Markers must remain correctly positioned when the map scales on different screen sizes.
- Allow Authors to edit or delete markers.

#### Locations
- List and detail pages for official locations.
- Support name, description, associated map / marker, and optional image.
- Link related characters, chapters, and locations where appropriate.

#### Data integrity
- Images should be stored in object storage.
- Use stable record IDs and explicit relations between world-building entries.
- Public Readers should only see published content.

### 5.11 Theories and investigation board

**Priority: P1 / P2**

The Theories page should feel like a large, ongoing investigation board rather than a static article page.

#### Theory categories

Provide category filters:
- **Confirmed**
- **Likely**
- **Speculation**
- **Wild Theory**

These categories are labels for community interpretation, not automatic truth verification. A clearly defined moderation process should control any official confirmation or category changes.

#### Reader actions
- Create a theory post with a title and body.
- Browse and filter posts by category.
- Open a theory to read its discussion.
- Reply to a theory or participate in its thread.
- See the author nickname and relevant timestamps.
- Edit or delete their own content according to the chosen policy.
- Report inappropriate content.
- Receive clear empty, loading, and error states.

#### Persistence and live updates
- Store posts and replies in Supabase.
- Preserve discussions across sessions and devices.
- Use Supabase Realtime only where it improves the experience; normal refresh-based loading is an acceptable initial implementation.
- Apply pagination or incremental loading as the board grows.

#### Safety and moderation
- Enforce permissions for creating, editing, deleting, and moderating posts.
- Sanitize user-generated content and render it safely.
- Provide rate limiting / anti-spam measures where practical.
- Establish a moderation and reporting workflow before opening the board widely.

### 5.12 Corners Arcade

**Priority: P2**

The Arcade page should contain playable games rather than a “Coming soon” placeholder. Use Supabase as the durable source of truth for player identity and any game data that should follow a user across devices. Keep short-lived animation state and purely temporary session state client-side where appropriate.

#### Player profile and persistence
- Provide a tidy player profile linked to the authenticated Supabase user / `profiles` record. Reuse the existing profile rather than creating a second identity system.
- Store persistent high scores / leaderboard entries, small save-game state, and player-specific arcade statistics in Supabase tables, rather than relying only on browser storage.
- Suggested tables: `arcade_scores` (game key, user ID, score, achieved timestamp, optional metadata), `arcade_saves` (user ID, game key, versioned compact save payload, updated timestamp), and optionally `arcade_player_stats` if stats cannot be derived efficiently from score records. Final schema may consolidate these where appropriate.
- A save payload must be small, versioned, validated, and limited to the data required to resume a game. Do not store secrets, executable code, or untrusted HTML in save payloads.
- Use stable game identifiers and database constraints/indexes for leaderboard sorting and per-user lookups. Define whether each leaderboard is global, per-game, or seasonal before implementation.
- Show a clear save/load state and handle loading, empty, offline, permission, and save-failure states. Avoid claiming a save succeeded until Supabase confirms it.
- Permit guests to play games that do not need persistence. Require sign-in to submit persistent scores or sync a save across devices; explain this at the point of use.
- Enforce RLS so users can read public leaderboard data but can only create/update their own saves and profile-linked records. Do not trust client-submitted user IDs, score values, or metadata. Validate score submissions server-side or through trusted database functions where cheating risk matters; never expose a service-role key in the frontend.
- Do not store every frame or transient input in the database. Persist only meaningful score submissions, checkpoints, and compact save-state changes; debounce or explicitly trigger save operations to avoid excessive writes.

#### D&D-style dice simulation

#### D&D-style dice simulation
- Support common dice types such as d4, d6, d8, d10, d12, d20, and d100.
- Allow the user to choose a die and roll it.
- Animate the roll and then display the final result clearly.
- Provide a roll history for the current session.
- Include an accessible reduced-motion or instant-result mode.

#### Simple arcade games
- Add lightweight, browser-based games that fit the camp theme.
- Ensure games work on desktop and mobile.
- Avoid requiring an account for simple single-player games unless saving scores becomes a feature.
- Keep game code isolated so additional games can be added later.

### 5.13 Settings

**Priority: P2**

Organize Settings into clear, interactive sections.

#### Profile
- Nickname
- Bio
- Profile picture: upload / replace / remove
- Account role (read-only)
- Save profile
- Sign in / sign out behavior appropriate to the current session

#### Display
- Theme: **System / Light / Dark**
- Language: **English / Indonesian**

Theme and language preferences should persist across sessions. The initial implementation may use browser storage for non-sensitive preferences.

#### Notifications
- Novel / Chapter Updates: On / Off
- Promotions / Events: On / Off
- Global notifications enabled: On / Off
- Explain that turning off notifications stops the selected notification types.
- Store preferences in the user's profile or a related preference table.
- Keep the bell icon and notification center in sync with preferences.

#### History
- Reading history
- Last-read chapter / progress
- Add and remove bookmarks
- Resume reading from a saved location
- Allow the user to clear their own history.

#### Support & Feedback
- Bug / error report
- New feature suggestion
- FAQ / Help Center
- Contact email: `juliandoniel07@gmail.com`

The support interface should provide a clear subject and message workflow. If it opens the user's email client, label that behavior clearly; if reports are stored in the cloud, provide a privacy notice and status feedback.

#### Community
Provide links to the creator's community channels:
- Instagram: `https://www.instagram.com/kazu.png_`
- X / Twitter: `https://x.com/KazuAltr`
- TikTok: `https://www.tiktok.com/@kazualther`
- YouTube: `https://www.youtube.com/@kazualther`
- Discord: `https://discord.gg/C4hf3kkNEe`

Use recognizable platform icons while respecting their trademarks and each platform's brand guidance. Open external destinations safely, using appropriate `rel` attributes for new tabs.

#### Information
- About Hollow Night Camp
- Version / release information
- Credits
- Privacy information
- Terms / community guidelines as the project matures

### 5.14 Notifications center

**Priority: P2**

- Bell icon remains visible in the Main Bar.
- Clicking it opens a notification panel or page.
- Show relevant updates such as newly published novels or chapters and site announcements.
- Support read / unread states and a mark-as-read action.
- Show a clear empty state.
- Respect the user's notification preferences.
- Do not show a permanent unread indicator when there are no unread notifications.
- Notification delivery method and whether email notifications are included must be decided separately; the initial requirement is an in-site notification center.

### 5.15 Language and localization

**Priority: P2**

- Provide English and Indonesian.
- Keep interface text in translation resources rather than scattering hard-coded strings across scripts.
- Persist the selected language.
- Use the selected language consistently across navigation, settings, error messages, and core workflows.
- Novel content remains in the language chosen by the Author; changing interface language should not automatically translate story content.

### 5.16 Latest Chapter

**Priority: P1**

- Show the latest **published** chapter on the homepage.
- Include chapter title, parent novel, publication/update date, and a link to read.
- Determine “latest” from a reliable publication timestamp or chapter ordering rule.

### 5.17 Global branded loading animation

**Priority: P1**

Create a custom loading experience that uses the official Hollow Night Camp logo (`assets/image/hollow-night-logo.png`) as its visual anchor. It must feel original to the site's mysterious campsite identity, polished, and memorable rather than using a generic spinner.

- Design a distinctive logo-led animation that can combine subtle logo movement/glow, a campfire or ember motif, and restrained atmospheric details. Treat these as art-direction guidance; the final animation should remain coherent and not visually cluttered.
- Use the same loading language for initial app/page transitions and meaningful asynchronous states (for example, novel/chapter data loads). Avoid covering the whole page for tiny operations that can use inline feedback.
- Show loading text or an accessible status label where appropriate; keep the logo's alternative text meaningful.
- The loader must not trap interaction indefinitely. Always remove it on success, empty results, or errors, and provide a usable error/retry state when necessary.
- Keep animation performant on mobile and low-powered devices. Respect `prefers-reduced-motion` with a calm static/fade alternative.
- Avoid replaying a long full-screen intro on every small navigation action. Use a short transition for subsequent loads and reserve the full treatment for initial entry or genuinely blocking loads.
- Do not make sound a prerequisite for the loader; loading visuals must work when audio is disabled or blocked by the browser.

### 5.18 Music and sound effects

**Priority: P2**

Add independent background Music and Sound Effects (SFX) controls to Settings. Audio assets will be supplied by the maintainer and stored under `assets/sound/`; do not invent filenames before the assets are provided.

- Provide separate enable/disable toggles for Music and SFX. Disabling one must not disable or alter the other.
- Provide an independent volume slider for each category, with an understandable numeric or percentage indication.
- Suggested preference keys: `musicEnabled`, `musicVolume`, `sfxEnabled`, and `sfxVolume`. Persist preferences across pages and sessions; use account-backed preferences when available, with a local preference fallback for signed-out visitors.
- Apply volume changes immediately. A volume of zero must be silent even if the category is enabled.
- Background music must not autoplay with audible sound before a user gesture. Start or resume playback only after an allowed user interaction, handle browser autoplay restrictions gracefully, and provide clear state feedback.
- Music should avoid restarting on every page transition where technically feasible. Prevent duplicate overlapping tracks and stop/release audio resources when no longer needed.
- SFX should be short, purposeful, and not play on every pointer movement. Respect the SFX toggle and volume for every effect.
- If a requested audio file is missing or fails to load, the site must remain usable and must not throw an uncaught error. Log useful diagnostics in development without exposing sensitive information to readers.
- Keep a documented asset convention under `assets/sound/` (for example, separate music and sfx subfolders if useful), and update this PRD when actual filenames/formats are selected.
- Respect reduced-motion settings as applicable, and provide an obvious way to mute audio. Audio should never be required to understand the interface.

### 5.19 Realtime online readers count

**Priority: P2**

Display a live count of currently active readers/sessions in an appropriate shared site location. The count must represent active sessions rather than cumulative visits or registered accounts.

- Prefer Supabase Realtime Presence or an equivalent server-backed mechanism that supports joining/leaving and expiry of stale sessions.
- Define “online” as a session that has an active presence heartbeat/connection within a documented timeout window. Remove disconnected or stale sessions automatically; do not let closed tabs inflate the count indefinitely.
- Count unique active sessions or users consistently and document which interpretation is used. Avoid counting the same session multiple times due to reconnects.
- Update the display when sessions join or leave without requiring a page refresh. Show a small loading/unknown state while connecting, and a graceful fallback if realtime is unavailable.
- Do not expose reader identities, emails, IP addresses, or other personal details. The UI should display only the aggregate count.
- Avoid storing long-term behavioral tracking just to show the aggregate. Apply database/channel access controls and validate the design against Supabase Realtime limits.
- Test multiple tabs, reconnects, network loss, signed-out visitors, mobile backgrounding, and cleanup of stale sessions. Document whether bots and the current visitor are included in the count.

### 5.20 Realtime retro neon flip clock

**Priority: P2**

Create a real-time digital clock styled like a retro split-flap/folding desk clock, reimagined with a digital neon finish that fits Hollow Night Camp's visual identity.

- Display the current hour and minute and update automatically in real time. The default format should be 24-hour, with a 12/24-hour preference only if the wider settings design supports it cleanly.
- Use a desk-clock silhouette with separate upper/lower digit panels. When a digit changes, animate the front card flipping forward/down to reveal the next digit, like a vintage flip clock. The animation should be convincingly card-like rather than a generic number fade.
- Add restrained neon glow, contrast, shadows, and retro detailing so digits remain readable on desktop and mobile. Avoid excessive glow that reduces legibility or causes performance issues.
- Include a timezone selector in Settings. Offer a sensible default based on the browser's detected timezone, allow a manual IANA timezone selection (for example, `Asia/Jakarta`), and persist the selected value across sessions. Clearly label the selected timezone near the clock or in its settings.
- Use timezone-aware date formatting; do not manually add fixed offsets, because daylight-saving changes vary by timezone.
- Update the time without repeated network polling; the clock should use the client clock and timezone APIs. Handle invalid saved timezone values by falling back safely to the browser timezone.
- Respect `prefers-reduced-motion`: reduce or replace the flip animation with a subtle transition while still updating the time. Ensure screen readers receive a useful time label without announcing every visual frame.
- Test minute/hour/day rollovers, 12 AM/PM boundaries if 12-hour mode is supported, timezone changes, mobile sizing, and reduced-motion behavior.

### 5.21 Global Settings gear dropdown

**Priority: P1**

The Settings gear must act as a global in-place dropdown trigger available from every applicable page. Clicking the gear must not navigate away from the current page. The existing Settings content remains organized into the sections specified in §5.12; dropdown entries act as shortcuts to their corresponding dedicated settings page or destination.

- Opening the menu reveals a dropdown anchored to the gear button, regardless of which site page the reader is currently viewing.
- Animate the gear rotation in sync with the dropdown opening/closing. The dropdown should unfold/slide down with a polished, coordinated transition; clicking the gear again reverses the motion and closes the menu.
- Clicking a submenu item navigates to the correct dedicated settings destination. Opening or closing the dropdown alone must preserve the current route and page state.
- Include the existing planned settings destinations: Profile, Display, Notifications, History, Support & Feedback, Community, and Information. Add the new Audio controls and Clock / timezone preferences to suitable settings sections.
- Close the dropdown after a destination is selected, when the user clicks outside it, or presses Escape. Keep keyboard focus predictable and return focus to the trigger when Escape closes it.
- Use correct button semantics, `aria-expanded`, `aria-controls`, and accessible names. Do not rely on gear rotation alone to communicate open state.
- Ensure it fits inside the viewport on small screens, does not get clipped by parent containers, and layers above page content without blocking unrelated controls when closed.
- Respect `prefers-reduced-motion` by shortening or disabling the rotation/dropdown animation.
- Avoid duplicate dropdown instances or event listeners when navigating between pages. Keep shared behavior in the shared navigation layer where possible.
- Do not show drafts.
- Show a designed empty state if no published chapters exist.

---

### 5.22 Camp Rank, EXP, levels, and achievements

**Priority: P2 — planned; not implemented in the supplied ZIP**

Hollow Night Camp will use a progression system called **Camp Rank** to reward meaningful reading and community participation. The system should encourage exploration without turning reading into a grind or making the community hostile.

#### Rank thresholds

The number is the minimum level required for each named rank. Levels between named thresholds retain the previous rank until the next threshold is reached.

| Level | Camp Rank |
| ---: | --- |
| 1 | Wanderer |
| 5 | Camper |
| 10 | Story Seeker |
| 20 | Clue Hunter |
| 30 | Night Reader |
| 40 | Theorist |
| 50 | Hollow Investigator |
| 60 | Fire Watcher |
| 70 | Hollow Watcher |
| 80 | Hollow Flame |
| 90 | The UnderReader |
| 100 | Hollow Legend |

#### EXP rules

- Define a central, documented EXP event catalogue before implementation.
- Award EXP only for server-verifiable or otherwise abuse-resistant actions, such as completing a published chapter or approved challenge.
- Do not award EXP repeatedly for refreshing a page, reopening the same chapter, or replaying a client request.
- Keep EXP transactions auditable and idempotent; users must not be able to set their own EXP or level through client-side data.
- Calculate level and Camp Rank from the canonical EXP total rather than trusting values submitted by the browser.
- Display current EXP, next rank, progress to next rank, and earned achievements in the reader profile.
- The exact EXP amounts per activity remain an implementation decision and must be documented before release.

#### Reading streak and Night Owl badge

- A reading day counts when a signed-in reader completes a meaningful reading activity on a published chapter; define a minimum threshold and persist the event server-side.
- A streak advances at most once per user per calendar day, using one explicitly chosen timezone policy.
- Three consecutive qualifying days award the **Night Owl** badge once.
- Missing a calendar day resets the active streak; the longest streak may remain as a profile statistic.
- Prevent duplicate awards during retries, parallel requests, and timezone/day-boundary changes.

#### Daily Campfire check-in and Ember

- Provide a daily check-in action in the Campfire area.
- A successful check-in grants Ember, the platform's planned reward currency.
- A reader may claim no more than once per defined calendar day; duplicate clicks and retries must not create extra currency.
- Show the claim result, current balance, and next eligible check-in.
- Ember is intended to unlock future items or experiences; redemption catalog and prices are intentionally deferred.
- Treat Ember as a non-cash, in-platform reward currency with no real-world monetary value or cash-out feature.

#### Badge assets

- Custom badge art will be authored later and stored under `assets/badges/`.
- The interface must tolerate missing badge images gracefully during development.
- Badge awards should reference stable badge IDs/keys rather than hard-coded image paths.
- Badge definitions, award records, and assets are separate concerns; an image existing in the repository must not itself grant a badge.

### 5.23 Camp Challenge

**Priority: P2 — planned; not implemented in the supplied ZIP**

Add a dedicated **Camp Challenge** destination reachable from the main navigation or a clearly discoverable community menu.

Author capabilities:
- Create, edit, publish, unpublish, schedule, and archive a challenge.
- Define title, description, instructions, start/end time, eligibility, completion criteria, and Ember reward.
- Review challenge participation and completion records.
- Cancel a challenge with a clear reason and a policy for already-issued rewards.
- Manage challenge availability without changing unrelated reader progression data.

Reader capabilities:
- Browse active, upcoming, and completed challenges.
- View requirements, time remaining, reward, and progress.
- Submit or trigger completion through a validated workflow.
- See completion history and Ember rewards.

System requirements:
- Completion criteria must be validated server-side; do not trust a client-supplied `completed=true`.
- Each user may receive a challenge reward only once per challenge unless the challenge is explicitly configured as repeatable.
- Award Ember through the same auditable ledger used by daily check-in and other reward sources.
- Enforce author permissions and RLS on challenge creation, edits, moderation, participation, and rewards.
- Provide loading, empty, success, and error states.

Acceptance criteria:
- An Author can publish a challenge and see it appear to Readers.
- A Reader can complete an eligible challenge and receive the configured Ember reward once.
- Repeated requests, refreshes, or concurrent submissions cannot duplicate rewards.
- Unpublished and future challenges are not exposed as active challenges to ordinary Readers.

### 5.24 Community leaderboards and monthly rewards

**Priority: P2 — planned; not implemented in the supplied ZIP**

Create a dedicated **Leaderboards** menu/page with separate categories rather than one all-purpose score ranking.

Categories:
1. **Top Theorist** — rank by likes received on eligible theories.
2. **Top Reader** — rank by published chapters completed.
3. **Top Arcade Player** — rank by validated total score across eligible arcade games.

Rules and safeguards:
- Leaderboards are grouped into calendar months using a single documented timezone, with the current month clearly labeled.
- Define tie-break rules before launch. Recommended tie-breakers: earliest achievement of the tied score, then stable display-name ordering.
- Only count eligible, non-deleted content and valid activity. Exclude self-likes, duplicate likes, test records, and invalid or suspicious score submissions.
- Avoid exposing private account details; display only public nickname/avatar and the relevant metric.
- Make the experience community-focused: no public shaming, negative rankings, or “worst user” lists.
- The monthly board should preserve past-period results as an archive rather than deleting history when a new month starts.

#### Monthly rewards and Author controls

- At the end of each month, eligible winners can receive a configured badge and Ember reward.
- Add an Author-only leaderboard management area to preview the month, inspect eligible results, trigger/finalize the monthly settlement, and issue or correct rewards through an audited workflow.
- Support an explicit reset/close action for the active period, but do not allow a reset to silently erase historical results or reward records.
- Prefer automated period boundaries plus an Author-controlled finalization step over destructive manual clearing.
- Require confirmation for finalization/reset actions and record actor, timestamp, period, and reason.
- Make reward settlement idempotent so repeated finalization cannot award duplicate badges or Ember.

Acceptance criteria:
- Each category has its own metric and ranking.
- The displayed month and metric definition are visible to users.
- Only authorized Authors can manage/finalize monthly boards.
- A monthly settlement is reproducible from stored activity records and cannot pay rewards twice.

### 5.25 Author Analytics Dashboard

**Priority: P2 — planned; not implemented in the supplied ZIP**

Provide an Author-only **Analytics** menu within Author Studio. It should surface all insights supported by reliable data, clearly distinguishing observed metrics from estimates.

Initial analytics:
- **Chapter reads:** total and unique reads per chapter, with date range and trend where data supports it.
- **Most-read chapters:** ranked chapter list and period comparison.
- **Average ratings:** chapter and novel rating averages, vote counts, and changes over time where historical snapshots exist.
- **Favorite reading hours:** aggregated distribution of qualifying reading activity by hour; disclose the timezone used.
- **Reading completion:** completed chapters and completion rates where completion events are instrumented.
- **Reader engagement:** daily/weekly active readers and returning-reader trends only when privacy-safe activity records support them.
- **Community insights:** theory counts, likes, and replies where relevant and available.
- **Challenge / reward insights:** participation, completion, and Ember rewards after Camp Challenge ships.
- **Arcade insights:** plays and validated scores after arcade tracking ships.
- **Data coverage:** clearly indicate which metrics are unavailable because instrumentation has not yet shipped.

Privacy and correctness:
- Analytics are available only to authorized Authors and should not expose private reading histories tied to identifiable users unless a separately approved moderation purpose requires it.
- Use aggregated data by default and apply reasonable minimum group sizes where appropriate.
- Define “read,” “unique read,” “completed chapter,” and “favorite hour” explicitly before reporting metrics.
- Avoid counting every page refresh as a meaningful read; use deduplication windows or qualifying reading events.
- Use timezone-aware aggregation and state the timezone in the dashboard.
- Do not fabricate historical data for events that were not tracked.
- Ensure expensive reports are paginated, indexed, cached, or pre-aggregated as needed.

Acceptance criteria:
- An Author can select a date range and inspect chapter-level read counts and rating summaries.
- Favorite reading hours are derived from recorded qualifying events with a visible timezone.
- The dashboard labels missing or incomplete instrumentation rather than displaying misleading zeros.
- Readers cannot access author analytics through direct routes or direct database requests.

### 5.26 Shared economy, activity ledger, and data model

**Priority: P0 for secure implementation of the above systems**

The progression, check-in, challenge, and leaderboard systems share rewards and must use one consistent source of truth.

Recommended logical entities (exact physical schema may vary):
- `reader_activity_events`: validated events such as chapter completion, challenge completion, and eligible theory interactions.
- `reader_progress`: canonical EXP total, level/rank derivation, current streak, longest streak, and last qualifying reading date.
- `badge_definitions`: stable badge key, title, description, and optional asset path.
- `user_badges`: user/badge award record, source event, and award timestamp.
- `ember_ledger`: append-only credit/debit transactions, source type/ID, amount, timestamp, and idempotency key.
- `daily_checkins`: one record per user per eligible day.
- `camp_challenges`: author-managed challenge definitions and publication schedule.
- `challenge_participation`: user status, progress, completion time, and reward settlement status.
- `leaderboard_periods`: month, category, state, and finalization metadata.
- `leaderboard_snapshots` or equivalent aggregate records: reproducible period results and rank metrics.
- `analytics_events` or pre-aggregated analytics tables: qualifying reads, completion events, and timestamps needed for dashboard reports.

Security requirements:
- Enable RLS on exposed tables and write policies for the exact Reader/Author access model.
- Use database constraints, unique indexes, and trusted server-side logic/RPCs for one-per-day check-ins, unique badge awards, and idempotent reward settlement.
- Never trust browser-submitted EXP, Ember balance, leaderboard totals, challenge completion, or winner status.
- Do not expose service-role credentials in frontend code.
- Keep a transaction trail for corrections; do not silently overwrite or delete economy history.
- Test unauthorized reads/writes and concurrent duplicate submissions before release.


## 6. Visual and Interaction Design

### Art direction

- Illustrated, atmospheric, slightly quirky, mysterious, and welcoming.
- A palette built around midnight blues / forest greens, warm firelight, parchment-like neutrals, and restrained accent colors.
- Use expressive headings and readable body text.
- Favor layered scene composition, silhouettes, hand-crafted details, and subtle environmental animation.
- Keep the design playful rather than corporate or overly rigid.
- Do not use copyrighted show assets or imitate exact protected artwork.

### Interface principles

1. **Atmosphere without sacrificing clarity.** Visual effects must not reduce text contrast.
2. **Consistent components.** Reuse shared buttons, inputs, cards, badges, menus, dialogs, and empty states.
3. **Mobile-first navigation.** Do not let labels or controls become unreachable on narrow screens.
4. **Useful feedback.** Every save, upload, login, import, or delete operation needs a visible result.
5. **Accessible motion.** Respect `prefers-reduced-motion`.
6. **Responsive images.** Use optimized image sizes and appropriate loading behavior.
7. **No dead controls.** If a control is visible, it must work or be explicitly marked as unavailable / coming soon.

---

## 7. Technical Requirements and Architecture

### Current stack found in the ZIP

- HTML5
- CSS3
- JavaScript ES modules
- Supabase JavaScript client v2 loaded from `esm.sh`
- Supabase Auth and profile queries
- CSS / JavaScript parallax effect using a background image and depth map
- Planned shared loader animation, browser audio controls for `assets/sound/`, Supabase Realtime Presence for online-session counts, timezone-aware client clock, and shared Settings dropdown.

### Proposed responsibilities

| Layer | Responsibility |
| --- | --- |
| Static frontend | Page layout, responsive UI, interaction states, and navigation |
| Supabase Auth | Registration, login, session handling, and logout |
| Supabase Postgres | Novels, chapters, world-building, theories, replies, notifications, preferences, bookmarks, and reading history |
| Supabase Storage | Novel covers, profile pictures, map images, character art, and location images |
| Supabase RLS | Enforce ownership, public visibility, Reader permissions, and Author permissions |
| Hosting platform | Serve the frontend over HTTPS and deploy repository changes |
| Optional edge / server functions | Trusted administrative operations, import processing, moderation tools, or notification jobs where client-side access is insufficient |

### Cloudflare deployment

The request mentions Cloudflare. The supplied ZIP does not prove that Cloudflare Pages is already connected or configured.

Before changing hosting:
1. Confirm the current live deployment provider and domain settings.
2. If Cloudflare Pages is selected, connect the GitHub repository and configure the correct project root / build settings for a static HTML project.
3. Confirm that direct navigation to every `.html` page works.
4. Configure required environment values and safe deployment practices.
5. Test the production domain and Supabase Auth redirect URLs.
6. Document the deployment process so future updates are repeatable.

A static frontend generally does not need a build command if no build tool is introduced. Do not add Cloudflare configuration files without a specific need.

### Environment and secrets

- The current Supabase client configuration contains a publishable client key. Publishable keys are intended for frontend use only when the database and Storage are correctly secured with RLS and policies.
- Never expose a Supabase service-role key, database password, private token, or other server secret in frontend files or Git history.
- Use environment variables / platform secrets for any server-side credentials.
- Confirm Auth redirect URLs and allowed origins for local development and production.

### Database entities to plan for

The exact final schema should be designed and migrated deliberately. Suggested entities:

- `profiles`
- `novels`
- `chapters`
- `chapter_ratings` (one current rating per user per chapter; unique `(chapter_id, user_id)`; rating constrained to 1–5)
- `arcade_scores` (persistent score submissions / leaderboard records, linked to a Supabase user and stable game key)
- `arcade_saves` (compact, versioned save-game payloads linked to a Supabase user and game key)
- `arcade_player_stats` (optional derived or cached arcade profile statistics; avoid storing data that can be safely derived from scores)
- `characters`
- `maps`
- `map_markers`
- `locations`
- `theories`
- `theory_replies`
- `notifications`
- `notification_preferences`
- `reading_progress`
- `bookmarks`
- `support_reports` (if reports are stored in the application)
- `user_preferences` or equivalent fields for audio settings, timezone, display preferences, and other per-user settings (avoid duplicating preferences already represented in `profiles`).
- Realtime Presence channel/configuration for aggregate online sessions; this may not require a persistent table if Supabase Presence is used.

Each table should use stable IDs, timestamps where appropriate, and explicit relationships. Add indexes for common list queries, sorting, and foreign keys.

### Security rules

- Enable and test RLS on every user-facing table.
- Public users may read only content intended to be public and published.
- Readers may create and manage only the content explicitly allowed to them.
- Readers may only update their own profile and preference records.
- Author privileges must be based on a trusted role source.
- Do not trust role values supplied by the browser.
- Validate input and file uploads; limit file size and allowed content types.
- Render user-generated text safely and prevent script injection.
- Confirm Storage policies for uploaded files.
- Test policies using both Reader and Author sessions, plus unauthenticated requests.

---

## 8. Non-Functional Requirements

### Performance
- Optimize images and avoid loading large scene assets on pages that do not need them.
- Pause or reduce animation loops when the scene is hidden or the page is not active.
- Avoid excessive database requests and load long lists incrementally.
- Keep interactions responsive on mid-range mobile devices.

### Accessibility
- Use semantic HTML and meaningful accessible names.
- Ensure keyboard navigation and visible focus states.
- Maintain sufficient color contrast.
- Do not rely on color alone to communicate status.
- Provide reduced-motion behavior for parallax and dice animations.
- Associate form labels with inputs and announce errors / success states to assistive technologies.

### Reliability
- Provide loading, empty, error, and success states for data-driven pages.
- Prevent duplicate submissions during saves.
- Confirm destructive actions such as deleting a novel or chapter.
- Preserve unsaved editor text when a save fails.
- Handle missing or unavailable Supabase data gracefully.

### Compatibility
- Support current major mobile and desktop browsers.
- Test narrow mobile screens, tablet layouts, and desktop widths.
- Verify that Supabase Auth redirects, cookies / sessions, and page navigation work on the production origin.

### Maintainability
- Reuse shared UI and authentication utilities.
- Keep content data separate from page presentation.
- Avoid duplicating navigation and permission logic across pages.
- Document schema changes and deployment settings.
- Keep TODOs and feature status updated as the project evolves.

---

## 9. Delivery Plan and Current Progress

The checkboxes below track the implementation visible in the supplied repository. “Verify” means the code exists but must still be tested against the live Supabase / Cloudflare setup.

### Phase 0 — Audit and stabilization
- [x] Establish the repository and initial static website structure.
- [x] Implement Supabase email/password sign-up and sign-in client flow.
- [x] Implement profile read/update for nickname and bio.
- [x] Implement shared navigation and Author-only editor route guard.
- [x] Build the campfire welcome screen and parallax depth effect.
- [x] Add glass Main Bar and top-bar / sidebar / compact navigation modes.
- [x] Configure Supabase project URL and publishable client key in frontend.
- [x] Create the `profiles` table and confirm profile save behavior in project progress.
- [x] Add the Cloudflare Worker URL to Supabase Auth Redirect URLs, as confirmed in project progress.
- [ ] Implement shared logo-led loading animation with error/reduced-motion states.
- [ ] Verify production sign-up, email verification / redirect, login, logout and session persistence end-to-end.
- [ ] Test RLS and Storage policies using Reader, Author and signed-out sessions.
- [ ] Confirm canonical production domain and repeatable deployment workflow (the README still references GitHub Pages).

**Current exit status: PARTIALLY COMPLETE.** Main frontend foundation and account/profile workflow exist; live security and deployment checks remain.

### Phase 1 — Core story library and authoring
- [x] Implement novel library data loading and rendering in `js/novels.js`.
- [x] Implement novel detail and chapter-management workflow in `js/novels.js`.
- [x] Implement novel create/edit/delete operations in source.
- [x] Implement chapter editor with title, subtitle, chapter number, volume and word count.
- [x] Implement save-draft and publish actions in source.
- [x] Add reader-facing chapter page and chapter navigation.
- [ ] Implement Chapter Ratings with five d20 icons (outline-only when unrated, proportionally filled interiors after ratings), one current vote per Reader per chapter, fractional fill, and realtime chapter average/count.
- [ ] Implement weighted Novel Ratings aggregated from all individual votes across published chapters, with realtime count/average updates and database-enforced uniqueness/RLS; use the same d20 rating visual system.
- [x] Add chapter import flow for TXT, DOCX and text-based PDF, with review before draft creation.
- [ ] Verify database schema, RLS, published-only Reader visibility, Storage bucket policies and cross-session persistence.
- [ ] Verify complete latest-published-chapter display on the Campfire homepage.
- [ ] Verify chapter ordering, volume / arc grouping and deletion confirmation in the live workflow.
- [ ] Test unsaved-change protection and save failure recovery.

**Current exit status: IMPLEMENTED IN SOURCE, LIVE VERIFICATION REQUIRED.** This phase is substantially further along than the earlier PRD audit indicated.

### Phase 2 — Author tools and world building
- [ ] Complete volume / arc organization and chapter reordering.
- [x] Add dedicated Characters management and reader pages (`characters.html`, `js/world.js`; Author-only editing, Readers view published).
- [x] Add Maps, map image upload and responsive named markers (`maps.html`; markers stored as % of image, Author add / edit / move / delete).
- [x] Add Locations management and linked lore records (`locations.html`; links to a map + marker and to characters based there). Links to chapters still open.
- [x] Add Novels sub-navigation (Novels / Characters / Maps / Locations) under each page headline, above the Author toolbar.
- [ ] Run `supabase/world-building.sql` in Supabase, then verify RLS and the `worldbuilding` Storage bucket with Reader, Author and signed-out sessions.
- [ ] Verify and improve novel cover / image upload through Supabase Storage.

**Current exit status: NOT COMPLETE.** Chapter volume metadata and cover-upload code exist, but full world-building management is not implemented.

### Phase 3 — Community investigation
- [ ] Implement theory creation and listing.
- [ ] Implement Confirmed / Likely / Speculation / Wild Theory filters.
- [ ] Implement theory detail pages and replies.
- [ ] Add ownership rules, reporting, moderation and anti-spam protections.
- [ ] Verify persistence and RLS.

**Current exit status: NOT STARTED.** Theories page is still a placeholder.

### Phase 4 — Settings and notifications
- [x] Implement profile nickname / bio editing and save feedback.
- [ ] Complete avatar persistence through an object-storage bucket.
- [ ] Implement System / Light / Dark themes.
- [ ] Implement English / Indonesian interface localization.
- [ ] Implement notification preferences and notification center.
- [x] Implement reading history and bookmarks (`js/reading.js`, `js/history.js`, tables `bookmarks` + `reading_progress` in `supabase/bookmarks-history.sql`; Bookmark / Resume on `read.html`, Continue reading on `novel.html`, History section in Settings with clear-history). Live verification still required.
- [ ] Add Help / FAQ, support feedback and Community social links.
- [x] Add global Settings gear dropdown available in place on every applicable page, with synchronized gear rotation/dropdown animation and accessible close behavior (`shared.js`, `css/settings-menu.css`). Entries so far: Profile, History & Bookmarks, Clock & timezone; add Display / Notifications / Support / Community / Information as those sections are built.
- [ ] Add independent Music and SFX enable/disable and volume controls backed by `assets/sound/` assets.
- [x] Add persisted timezone selection and the retro neon split-flap clock UI (`js/status-widget.js`, `css/status.css`; timezone chosen in Settings, stored in localStorage `hnc_timezone`, 24-hour). Top-right placement; widget sits under the Main Bar on narrow screens.

**Current exit status: PARTIAL.** Profile basics work; remaining account preferences and utilities are outstanding.

### Phase 4B — Camp Rank, rewards, challenges, leaderboards, and analytics
- [ ] Define EXP events, rank calculation, streak day boundary, and Night Owl award rules.
- [ ] Add Camp Rank profile display and server-validated activity tracking.
- [ ] Implement daily Campfire check-in and the append-only Ember ledger.
- [ ] Add `assets/badges/` and badge definition / user award records.
- [ ] Build Author-managed Camp Challenge creation, publishing, completion validation, and Ember rewards.
- [ ] Build category leaderboards: Top Theorist, Top Reader, Top Arcade Player.
- [ ] Add monthly archive, Author-controlled finalization/reset, and idempotent badge/Ember rewards.
- [ ] Build Author Analytics Dashboard for chapter reads, ratings, reading-hour trends, and all instrumented insights.
- [ ] Add RLS, abuse prevention, idempotency, privacy review, and concurrency tests for every reward/ranking flow.

**Current exit status: NOT STARTED.** The supplied ZIP contains no implementation for Camp Rank, streaks, Ember, Camp Challenge, monthly leaderboards, or Author Analytics.

### Phase 5 — Arcade
- [ ] Implement Supabase-backed arcade score submissions and leaderboards with RLS and validated score writes.
- [ ] Implement compact, versioned Supabase save-game records and player-linked stats/profile display; retain guest play for games that do not require persistence.
- [ ] Implement animated dice rolling and session roll history.
- [ ] Add simple playable browser games.
- [ ] Test mobile input and reduced-motion behavior.

**Current exit status: NOT STARTED.** Arcade remains a placeholder. Supabase-backed leaderboards, compact cross-device game saves, and player-linked arcade stats are requirements for persistent arcade features; simple guest play can remain local-only.

### Phase 6 — Camp exploration, deployment and polish
- [ ] Add wide-angle / distant-camera mode.
- [ ] Add FireWatcher inspection interaction and optional easter eggs.
- [ ] Optimize scene assets and animation performance.
- [x] Implement aggregate realtime online-reader count with stale-session cleanup and privacy-safe display (`js/status-widget.js`, Supabase Realtime Presence channel `camp-online`, one key per tab, count only). Live verification still required.
- [ ] Conduct accessibility, responsive and regression testing.
- [ ] Verify Cloudflare Worker / Pages deployment, canonical domain, direct-page navigation and Supabase Auth redirects.
- [ ] Update README deployment instructions to match the actual hosting setup.

**Current exit status: PARTIAL.** The existing welcome parallax is implemented, and Cloudflare Worker URL / Auth redirect setup has progressed, but the exploration mode and full deployment verification remain.

## 10. Definition of Done

A feature is complete only when all relevant conditions are met:

- [ ] The UI matches the intended design and works on mobile and desktop.
- [ ] All visible controls have working behavior.
- [ ] Data persists correctly where persistence is required.
- [ ] Loading, empty, success, and error states are handled.
- [ ] Reader and Author permissions are enforced at the backend.
- [ ] RLS and Storage policies have been tested with real role sessions.
- [ ] No secrets are exposed in frontend code.
- [ ] Keyboard navigation and reduced-motion behavior are considered.
- [ ] Existing working features have not regressed.
- [ ] The feature is tested in the deployed environment, not only locally.
- [ ] This PRD's status table is updated to reflect the actual implementation.

---

## 11. Open Decisions

Resolve these during implementation rather than guessing:

1. **Cloudflare:** Is Cloudflare Pages the intended permanent host, or should the existing GitHub Pages deployment remain active?
2. **Author assignment:** Which trusted administrative method will grant the initial Author role and future role changes?
3. **Chapter imports:** Which formats must be supported in the first release, and what file-size limits should apply?
4. **Theory moderation:** Who can mark a theory as Confirmed, and can the original poster change a category after publishing?
5. **Notifications:** Should the first release provide in-site notifications only, or also email notifications?
6. **Map markers:** Should markers open a popover, side panel, or dedicated location page?
7. **Support reports:** Should reports open the user's email client or be submitted and tracked inside the site?
8. **Community accounts:** Should theory posting require a verified email address?
9. **Reading history:** Should reading progress sync across devices, and should users be able to delete it?
10. **Localization:** Which language should be selected by default for new visitors?
11. **Audio assets:** What are the final filenames, formats, and intended looping behavior for music and SFX under `assets/sound/`?
12. **Online readers:** Should the count represent unique users or active browser sessions, and should the current visitor be included? Default proposal: active sessions, including the current visitor, with no identities exposed.
13. **Clock placement:** Where should the clock and online count appear across the shared site layout (for example, Main Bar utility area or a homepage status panel)?
14. **Clock format:** Should 24-hour time be mandatory or should users be able to choose 12/24-hour format? Default proposal: 24-hour.
15. **EXP schedule:** How much EXP should each qualifying action award, and which actions are eligible?
16. **Streak timezone:** Should streaks follow the reader's selected timezone or one platform-wide timezone? Prevent retroactive timezone changes from granting extra streak days.
17. **Ember economy:** What will Ember unlock, what are the costs, and should any rewards expire? Keep this undecided until the first reward catalog is designed.
18. **Challenge verification:** Which challenge types can be automatically validated, and which require Author review?
19. **Monthly leaderboard settlement:** What exact monthly timezone, tie-breakers, and reward amounts should apply to each category?
20. **Analytics privacy:** What minimum aggregation threshold and retention period should apply to reading-hour and reader-engagement analytics?
21. **Reading completion definition:** What qualifies a chapter as completed for Top Reader and streak eligibility?

---

## 12. Source Audit Notes

This update was based on the supplied `Hollow-Night-Camp-main (10).zip` and relevant implementation files:

- `index.html` and `js/login.js`: login / registration interface and form flow.
- `js/auth.js`: Supabase Auth, session observation, profile retrieval and profile updates.
- `js/shared.js`: page/session guard, Author role check, Author Mode state, Main Bar and editor three-dot menu.
- `home.html`, `js/home.js`, `js/parallax.js`: welcome screen, homepage interactions and depth-map parallax.
- `novels.html`, `novel.html`, `js/novels.js`: novel listing, novel details, author novel operations and chapter-management workflow.
- `editor.html`, `js/editor.js`: chapter metadata, body editor, word count, draft saving and publishing.
- `read.html`, `js/read.js`: reader-facing chapter display and chapter navigation.
- `js/import.js`: TXT / DOCX / text-based PDF extraction, review step and draft import.
- `js/rating.js`, `css/rating.css`: d20 rating visuals and chapter/novel rating helpers.
- `js/status-widget.js`: timezone-aware retro flip clock and Supabase Realtime Presence online-reader count.
- `settings.html`: profile editor and avatar UI.
- `theories.html` and `js/theories.js`: theory list/detail, category, post, and reply workflows are present in source; `arcade.html` remains a placeholder.
- `config/supabase.js`: Supabase project URL and publishable client key.
- `css/mainbar.css` and `assets/icons/`: glass navigation styling and icon assets.

### External progress noted on 2026-10-20

The ongoing project conversation confirms that the Cloudflare Worker URL `https://hollow-night-camp.kazualtr.workers.dev/` was added to Supabase Auth Redirect URLs. This is evidence of configuration progress, not proof that all sign-in redirects, production routes, or deployment settings have passed end-to-end tests. The repository README still contains the older GitHub Pages URL and should be reconciled with the intended canonical domain.

**Security note:** A client-side Author Mode switch or route guard is not sufficient authorization. Verify that database RLS policies and Supabase Storage policies reject unauthorized writes. Do not place service-role keys or private credentials in frontend files.

**Audit limitation:** This is a source-code and project-progress review, not a live penetration test. External dashboard state, production routing, deployed code parity, RLS behavior, and actual persistence must be verified separately.

<div align="center">

**HOLLOW NIGHT CAMP**  
*The fire is still burning. The woods are watching.*

</div>


### Feature requirements recorded on 2026-10-21

The following are **planned requirements only** and are not claimed to be implemented in the supplied ZIP: (1) custom logo-led loading animation, (2) separate Music and SFX controls with independent volumes and assets under `assets/sound/`, (3) aggregate realtime online-reader count, (4) timezone-configurable retro neon split-flap clock, and (5) a global in-place Settings gear dropdown with synchronized gear/dropdown animation. Detailed acceptance criteria are defined in §5.16–§5.20. Update the status table and phase checkboxes only after implementation is present in the repository; verify runtime behavior separately.


### New requirements recorded on 2026-10-21

The following Camp Rank features are **planned requirements only** and are not implemented in the supplied ZIP: Camp Rank levels and EXP, the three-day Night Owl streak badge, daily Campfire check-in and Ember currency, Author-managed Camp Challenge, monthly category leaderboards with badge/Ember rewards and Author controls, and an Author Analytics Dashboard. Custom badge art is planned for `assets/badges/`, which does not exist in the supplied ZIP. Detailed requirements, security controls, acceptance criteria, and suggested data entities are defined in §5.22–§5.26. Do not mark these features complete until the implementation and backend policies have been verified.
