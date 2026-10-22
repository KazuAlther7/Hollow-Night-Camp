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

| Feature / requirement | Status | Current evidence / remaining work |
| --- | --- | --- |
| Login and registration UI | **DONE** | `index.html` and `js/login.js` provide Login / Join Camp flows. |
| Supabase email/password authentication | **DONE / VERIFY** | `js/auth.js` implements sign-up, sign-in, sign-out, session retrieval and auth-state observation. |
| Reader profile: nickname and bio | **DONE** | `js/auth.js` reads and updates `profiles`; Settings page reports successful saves. |
| Reader profile picture UI | **PARTIAL** | Avatar preview / remove exists; durable object storage and upload policies need verification. |
| Reader / Author role distinction | **PARTIAL** | Author role is loaded from `profiles`; Author Mode toggle and UI gating exist. Trusted role assignment still needs testing. |
| Author-only editor route guard | **DONE (client-side) / VERIFY (server-side)** | `initPage({ requireAuthor: true })` protects editor route. RLS remains the real security boundary. |
| Campfire homepage / welcome screen | **DONE** | `home.html`, `css/home.css`, `js/home.js` implement the welcome experience. |
| Welcome background depth / parallax | **DONE** | Background and depth assets wired into `js/parallax.js`. |
| Main Bar glass effect | **DONE** | `css/mainbar.css` styles the translucent glass navigation. |
| Main Bar top / sidebar / compact modes | **DONE** | `js/shared.js` includes persistent mode preferences and navigation rendering. |
| Author Mode toggle and cross-page state | **DONE (UI/state) / VERIFY (permissions)** | Local state is not authorization; backend policies must enforce permissions. |
| Editor's three-dot menu | **DONE** | Shared editor menu is implemented in `js/shared.js`. |
| Mobile navigation behavior | **PARTIAL** | Responsive CSS exists; verify horizontal reachability, clipping, and touch behavior. |
| Ten requested navigation icons | **DONE (assets)** | Icon assets exist; not all correspond to completed feature workflows. |
| Supabase project connection | **CONFIGURED / VERIFY** | `config/supabase.js` contains project URL and publishable key. |
| Supabase `profiles` table / profile persistence | **CONFIGURED / VERIFY** | Verify policies and cross-device persistence in production. |
| Novel library page | **DONE (core workflow) / VERIFY** | `js/novels.js` queries Supabase and renders the library. |
| Novel detail page | **DONE (core workflow) / VERIFY** | `js/novels.js` loads novel details and chapter-management UI. |
| Create / edit / delete novels | **DONE in source / VERIFY** | Novel dialog and Supabase operations exist. |
| Novel cover upload | **PARTIAL / VERIFY** | Upload code targets `covers` bucket with 2 MB limit. |
| Chapter editor UI and word count | **DONE** | `editor.html` and `js/editor.js` implement chapter fields, body editing and word count. |
| Save draft / publish chapter | **DONE in source / VERIFY** | Confirm database schema and RLS in the live project. |
| Chapter metadata and ordering | **DONE in source / VERIFY** | Editor supports title, subtitle, chapter number and volume fields. |
| Reader chapter page | **DONE in source / VERIFY** | `read.html` and `js/read.js` load a chapter and provide chapter navigation. |
| Chapter Ratings (five d20 icons) | **IMPLEMENTED IN SOURCE / VERIFY** | `js/rating.js`, `css/rating.css`, `js/read.js`. Verify live schema, one-vote enforcement, and realtime. |
| Novel Ratings (aggregate of chapter votes) | **IMPLEMENTED IN SOURCE / VERIFY** | `js/rating.js` and `js/novels.js` include novel rating mounting. |
| Chapter import from TXT / DOCX / text-based PDF | **DONE in source / VERIFY** | `js/import.js` parses supported formats (5 MB limit). |
| Latest Chapter section | **PARTIAL / VERIFY** | Homepage author controls present; confirm reader-facing latest-published-chapter section. |
| Global branded loading animation | **NOT STARTED** | Logo-led branded loading experience. |
| Background music and sound effects controls | **NOT STARTED** | Separate Music and SFX controls; assets under `assets/sound/`. |
| Realtime online readers count | **NOT STARTED** | Live count of active reader sessions via Supabase Realtime Presence. |
| Realtime flip-style digital clock | **NOT STARTED** | Retro folding desk-clock layout with selectable timezone. |
| Global Settings gear dropdown | **PARTIAL / VERIFY** | Global dropdown trigger; expanding into dedicated settings destinations. |
| Volumes / arcs and chapter list | **PARTIAL / VERIFY** | Verify full grouping/reordering experience. |
| Theories page | **IMPLEMENTED IN SOURCE / VERIFY** | `theories.html` and `js/theories.js` implement theory list/detail, categories, posting and replies. |
| Theory posts, replies and cloud persistence | **IMPLEMENTED IN SOURCE / VERIFY** | Verify rate limits, persistence, and policies. |
| Theory categories and moderation | **PARTIAL / VERIFY** | Categories Confirmed / Likely / Speculation / Wild Theory. |
| Corners Arcade | **NOT STARTED** | `arcade.html` remains a "Coming soon" placeholder. |
| D&D-style dice roll and games | **NOT STARTED** | No playable dice simulation or arcade game present. |
| Camp Rank, EXP and levels | **NOT STARTED** | 12-tier progression system (§5.22). |
| Reading streak and Night Owl badge | **NOT STARTED** | Three consecutive reading days → Night Owl badge (§5.22). |
| Daily Campfire check-in and Ember wallet | **NOT STARTED** | Ember is the primary in-platform currency (§5.22). |
| Camp Challenge author menu | **NOT STARTED** | Dedicated Main Bar menu + Author CRUD + Ember rewards (§5.23). |
| Category leaderboards and monthly reset | **NOT STARTED** | Top Theorist / Top Reader / Top Arcade Player (§5.24). |
| Author Analytics Dashboard | **NOT STARTED** | All instrumented insights (§5.25). |
| Badge assets | **NOT STARTED** | 12 Camp Rank + Night Owl badges under `assets/badges/` (§5.22). |
| Settings: profile details | **DONE (core profile) / VERIFY** | Profile form and save feedback exist. |
| Settings: theme and language | **NOT STARTED** | System / Light / Dark + EN / ID. |
| Notification bell / notification center | **PARTIAL** | Bell icon exists; center not implemented. |
| Reading history and bookmarks | **NOT STARTED** | No persistent reading progress or bookmark workflow found. |
| Help / FAQ / bug reports | **NOT STARTED** | No complete in-site support workflow. |
| Community social links | **NOT STARTED / VERIFY** | Not implemented as a complete Settings section. |
| FireWatcher easter egg / inspectable location | **NOT STARTED** | No interactive inspection system found. |
| Wide-angle / distant mountain camera mode | **NOT STARTED** | Current parallax is not the requested user-controlled camera mode. |
| Cloudflare deployment | **IN PROGRESS / VERIFY** | Cloudflare Worker URL confirmed; canonical domain verification pending. |
| Supabase database CRUD for novels / chapters | **IMPLEMENTED IN SOURCE / VERIFY** | Production schema, RLS, and data persistence require live tests. |
| Security: role-based database policies | **VERIFY** | RLS and table grants must be checked against actual tables and buckets. |

### 2.2 Existing source files

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
- Participate in Camp Challenge and view Leaderboards (§5.23, §5.24).
- Earn EXP, level up through Camp Rank tiers, maintain a reading streak, and collect Ember (§5.22).
- Edit their own nickname, bio, and profile picture.
- Manage their own theme, language, notifications, reading history, and bookmarks when those features are implemented.
- Sign in and sign out.

**Restricted actions**
- Create, edit, publish, draft, or delete novels and chapters.
- Edit official world-building content or maps.
- Change their own account role to Author.
- Modify other users' profiles or data.
- Access author-only content-management operations, Author Studio, Author leaderboard controls, or the Author Analytics Dashboard.
- Award themselves EXP, Ember, badges, or leaderboard placement directly.

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
- Create, publish, edit, and archive Camp Challenge (§5.23).
- Manage monthly leaderboard periods, finalize rewards, and reset categories (§5.24).
- Access the Author Analytics Dashboard to view all instrumented insights (§5.25).

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
5. **Camp Challenge** — Author-managed community challenges with Ember rewards (§5.23). Dedicated menu item required.
6. **Leaderboards** — Top Theorist / Top Reader / Top Arcade Player, monthly (§5.24). Dedicated menu item required.
7. **Settings** — global gear-button dropdown, opens in place on any page; submenu links to dedicated settings sections.
8. **Author Studio** — visible only to Author accounts.
9. **Notifications** — bell icon and notification center.
10. **Account / Profile** — profile shortcut, Camp Rank badge, Ember balance, sign-out action.

Settings and Notifications may remain utility controls beside the main navigation. Camp Challenge and Leaderboards should be primary destinations where space permits, and must remain reachable on mobile via the scrollable Main Bar or the sidebar mode.

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

Requirements:
- Keep existing glass effect, icon assets, and top-bar/sidebar/compact interactions.
- Keep the bar fixed while allowing only its inner navigation area to scroll on small screens.
- Prevent the page itself from being dragged horizontally when the user scrolls the Main Bar.
- Ensure every item can be reached on small screens.
- Keep clear active states, focus indicators, accessible labels, and useful tooltips.
- Preserve the three-dot editor menu.
- Show Author Studio only for the Author role.
- Provide consistent navigation behavior across all protected pages.
- Include dedicated Camp Challenge and Leaderboards destinations.

### 5.5 Novel library

**Priority: P1**

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

#### Novel list and creation

- Add a **+ New Novel** action.
- Open a dedicated **Write New Novel** page or editor panel.
- Provide fields for title, author/byline, genre, status, tagline, synopsis, and cover image.
- Cover image actions: Add / Replace and Remove.
- Provide Save and Cancel actions.
- Validate required fields and display errors next to relevant controls.
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

- Comfortable writing surface.
- Keep the current live word count.
- Explicit Save Draft / Save Changes behavior.
- Clear saved / saving / failed states.
- Warn before navigating away when unsaved changes exist.
- Support the planned compact three-dot navigation menu.
- Separate editor controls from the writing page.
- Keep layout usable on mobile, prioritizing long-form writing on desktop.

#### Reader experience

- Readers can open published chapters from a novel's chapter list.
- Provide next / previous chapter navigation when available.
- Track reading progress and bookmarks after the History feature is implemented.
- Do not expose drafts to Readers.
- Emit chapter completion events to the gamification activity ledger (§5.22, §5.26) once that system ships.

### 5.8 Chapter and Novel Ratings (five d20 review system)

**Priority: P1**

Implement a five-level rating system using **five d20 die icons** (icosahedron silhouette) instead of stars. With zero ratings, show five outline-only d20 icons. Once ratings exist, fill the interior proportionally to the aggregate average, preserving the outline. Ratings remain numeric 1–5, one decimal displayed.

#### Rating UI and reader interaction
- Add a **Chapter Ratings** section on each published chapter reading page.
- Show five interactive d20 icons, chapter average (e.g. `4.5 / 5`), and count of ratings.
- When no ratings exist, show `0.0 / 5`, `0 ratings`, five outline-only d20 icons.
- A signed-in Reader can submit one integer rating 1–5 per chapter. Default: allow updating their own vote.
- Enforce one rating per user per chapter via unique constraint.
- Guests may view aggregate but must sign in to rate.
- Prevent ratings on unpublished drafts, backend-enforced.
- Provide loading, saved, error, and no-ratings states with keyboard accessibility.

#### Chapter Ratings calculation
- `chapter_rating_count` = unique current votes.
- `chapter_average_rating` = sum of votes / count.
- Example: 5×4 stars + 5×5 stars = 4.5 average, 10 ratings.
- d20 interior fill visually represents fractional averages with crisp outline.

#### Novel Ratings calculation
- Novel rating = **weighted average of all individual chapter votes** across published chapters (do not average chapter averages).
- `novel_rating_count` = total current chapter votes across the novel.
- Example: Chapter A (10 votes @ 4.5) + Chapter B (2 votes @ 3.0) = (10×4.5 + 2×3.0)/12 = 4.25 → displayed 4.3 with 12 ratings.
- Adding, changing, or removing a vote updates both ratings consistently.

#### Realtime behavior and data integrity
- Aggregates update in realtime; Supabase Realtime or equivalent.
- Database is source of truth; never trust client-supplied aggregates.
- Table: `chapter_ratings` with `chapter_id`, `user_id`, integer `rating`, timestamps.
- Unique constraint `(chapter_id, user_id)`; check `rating BETWEEN 1 AND 5`.
- RLS: readers read aggregates; insert/update only own vote on published chapters.
- Unpublishing/deleting chapter must not leak ratings into Novel Ratings (cascade delete).
- Handle concurrent submissions, reconnects, duplicate events without double-counting; unsubscribe on leave.

**Acceptance criteria**
- [ ] Zero-vote chapter shows five empty d20 icons and `0.0 / 5` with `0 ratings`.
- [ ] Signed-in Reader can submit and update their own rating without duplicate.
- [ ] 5×4 + 5×5 example = exactly 4.5 average, count 10.
- [ ] d20 outline-only when no ratings; interior fills fractional averages while preserving outlines.
- [ ] Chapter average/count updates live across active clients.
- [ ] Novel average is weighted, count = total current votes across published chapters.
- [ ] Novel aggregates update live on any chapter vote change.
- [ ] Reader cannot rate a draft, impersonate voters, or bypass UI for duplicates.
- [ ] RLS, constraints, keyboard operation, and realtime unsubscribe tested.

### 5.9 Import chapters from PDF / DOC / DOCX

**Priority: P2**

- Provide an **Import Chapters** action in the novel management page.
- Support `.txt`, `.docx`, text-based `.pdf` initially.
- Show filename, size, and import progress.
- Extract text into a review step before saving.
- Let Author assign imported content to a new chapter or existing draft.
- Preserve paragraph breaks.
- Report unsupported, scanned, encrypted, oversized, or unreadable files.
- Never publish imported content automatically without explicit Author action.

**Implementation note:** PDFs and Word files rarely contain clean structured chapter data. Import should create editable draft content first. OCR for scanned PDFs is a separate enhancement.

### 5.10 World building: characters, maps, and locations

**Priority: P1 / P2**

#### Characters
- List and detail pages for official characters.
- Fields: name, role, description, appearance, relationships, image.
- Only Authors can create, edit, publish, delete official entries.

#### Maps
- Allow Authors to create map entries and upload images.
- Responsive viewer with named markers.
- Markers store stable ID, label, description, position relative to image.
- Markers remain correctly positioned when the map scales.
- Authors can edit or delete markers.

#### Locations
- List and detail pages for official locations.
- Fields: name, description, associated map / marker, optional image.
- Link related characters, chapters, and locations.

#### Data integrity
- Images stored in object storage.
- Stable record IDs and explicit relations.
- Public Readers only see published content.

### 5.11 Theories and investigation board

**Priority: P1 / P2**

#### Theory categories
- **Confirmed**
- **Likely**
- **Speculation**
- **Wild Theory**

Categories are community labels; moderation controls official confirmation.

#### Reader actions
- Create theory post with title and body.
- Browse and filter posts by category.
- Open theory to read discussion.
- Reply to theory.
- See author nickname and timestamps.
- Edit / delete own content per policy.
- Report inappropriate content.
- Clear empty, loading, error states.

#### Persistence and live updates
- Store posts and replies in Supabase.
- Preserve across sessions and devices.
- Use Supabase Realtime only where it improves experience.
- Pagination or incremental loading as board grows.
- Emit theory like events for Top Theorist leaderboard (§5.24, §5.26).

#### Safety and moderation
- Enforce permissions for create/edit/delete/moderate.
- Sanitize user content safely.
- Rate limiting / anti-spam.
- Establish moderation and reporting workflow before opening widely.

### 5.12 Corners Arcade

**Priority: P2**

The Arcade page should contain playable games rather than a "Coming soon" placeholder. Use Supabase as durable source of truth for player identity and persistent game data.

#### Player profile and persistence
- Tidy player profile linked to authenticated Supabase user / `profiles`.
- Persistent high scores, save-game state, and stats in Supabase tables.
- Suggested tables: `arcade_scores`, `arcade_saves`, optionally `arcade_player_stats`.
- Save payloads must be small, versioned, validated, and limited.
- Stable game identifiers with database constraints for sorting.
- Show clear save/load states; avoid claiming success before Supabase confirms.
- Permit guests to play games that don't need persistence.
- Enforce RLS: users read public leaderboards, write only own saves/scores.
- Validate scores server-side or via trusted database functions; never expose service-role keys.
- Persist only meaningful score/checkpoint events; debounce saves.
- Submit validated arcade scores to Top Arcade Player leaderboard (§5.24) and Author Analytics (§5.25).

#### D&D-style dice simulation
- Support d4, d6, d8, d10, d12, d20, d100.
- Choose die, animate roll, display result.
- Session roll history.
- Reduced-motion / instant-result mode.

#### Simple arcade games
- Lightweight browser games fitting the camp theme.
- Work on desktop and mobile.
- Guests can play games that don't require accounts.
- Isolated code so additional games can be added.

### 5.13 Settings

**Priority: P2**

#### Profile
- Nickname
- Bio
- Profile picture: upload / replace / remove
- Account role (read-only)
- Camp Rank badge and current Ember balance (read-only)
- Save profile
- Sign in / sign out

#### Display
- Theme: **System / Light / Dark**
- Language: **English / Indonesian**
- Persist across sessions.

#### Notifications
- Novel / Chapter Updates: On / Off
- Promotions / Events: On / Off
- Global notifications enabled: On / Off
- Store in profile or preference table.
- Keep bell icon and notification center in sync.

#### History
- Reading history
- Last-read chapter / progress
- Add / remove bookmarks
- Resume reading from saved location
- Clear own history

#### Support & Feedback
- Bug / error report
- Feature suggestion
- FAQ / Help Center
- Contact email: `juliandoniel07@gmail.com`
- Clear subject and message workflow.
- If opens email client, label that clearly.

#### Community
- Instagram: `https://www.instagram.com/kazu.png_`
- X / Twitter: `https://x.com/KazuAltr`
- TikTok: `https://www.tiktok.com/@kazualther`
- YouTube: `https://www.youtube.com/@kazualther`
- Discord: `https://discord.gg/C4hf3kkNEe`

Open external destinations safely with appropriate `rel` attributes.

#### Information
- About Hollow Night Camp
- Version / release information
- Credits
- Privacy information
- Terms / community guidelines

### 5.14 Notifications center

**Priority: P2**

- Bell icon remains in Main Bar.
- Clicking opens notification panel or page.
- Show updates such as newly published novels / chapters and announcements.
- Read / unread states with mark-as-read.
- Clear empty state.
- Respect user notification preferences.
- No permanent unread indicator when there are no unread notifications.
- Initial delivery: in-site only; email notifications decided separately.

### 5.15 Language and localization

**Priority: P2**

- English and Indonesian.
- Interface text in translation resources, not hard-coded.
- Persist selected language.
- Consistent across navigation, settings, error messages, and core workflows.
- Novel content remains in Author's chosen language; interface language does not auto-translate story content.

### 5.16 Latest Chapter

**Priority: P1**

- Show latest **published** chapter on homepage.
- Include chapter title, parent novel, publication/update date, and link to read.
- Determine "latest" from reliable publication timestamp or chapter ordering.
- Designed empty state when no published chapters exist.

### 5.17 Global branded loading animation

**Priority: P1**

Custom loading experience using the official Hollow Night Camp logo (`assets/image/hollow-night-logo.png`) as visual anchor. Original, polished, memorable — not a generic spinner.

- Distinctive logo-led animation combining subtle logo movement/glow, campfire or ember motif, and restrained atmospheric details.
- Same loading language for initial page transitions and meaningful async states. Avoid covering the whole page for tiny operations.
- Accessible status label; meaningful logo alt text.
- Loader must not trap interaction indefinitely. Always remove on success, empty, or error with usable error/retry state.
- Performant on mobile. Respect `prefers-reduced-motion` with calm static/fade alternative.
- Avoid replaying long full-screen intro on every small navigation.
- Loading visuals must work with audio disabled.

### 5.18 Music and sound effects

**Priority: P2**

Independent Music and SFX controls in Settings. Assets stored under `assets/sound/`.

- Separate enable/disable toggles for Music and SFX.
- Independent volume sliders with numeric/percentage display.
- Preference keys: `musicEnabled`, `musicVolume`, `sfxEnabled`, `sfxVolume`. Persist across sessions.
- Volume changes apply immediately. Zero volume = silent even if enabled.
- Background music must not autoplay before user gesture. Handle browser autoplay restrictions.
- Music should avoid restarting on every page transition.
- SFX short, purposeful; respect toggle and volume.
- Missing or failed audio files must not break the site.
- Document asset conventions under `assets/sound/`.
- Obvious mute control. Audio never required to understand interface.

### 5.19 Realtime online readers count

**Priority: P2**

Live count of active readers/sessions in shared site location. Represents active sessions, not cumulative visits.

- Prefer Supabase Realtime Presence or equivalent with stale-session expiry.
- "Online" = active heartbeat within documented timeout. Remove disconnected sessions automatically.
- Count unique active sessions or users consistently. Avoid double-counting reconnects.
- Update display when sessions join/leave without refresh.
- Do not expose reader identities, emails, IPs, or personal details.
- Avoid long-term behavioral tracking just for aggregate.
- Test multiple tabs, reconnects, network loss, signed-out visitors, mobile backgrounding, stale cleanup.
- Document whether bots and current visitor included.

### 5.20 Realtime retro neon flip clock

**Priority: P2**

Real-time digital clock styled like retro split-flap/folding desk clock with neon finish fitting Hollow Night Camp's visual identity.

- Display hour and minute; default 24-hour; 12/24-hour preference if settings support cleanly.
- Desk-clock silhouette with separate upper/lower digit panels. Front card flips forward/down to reveal next digit.
- Restrained neon glow, contrast, shadows, retro detailing. Readable on desktop and mobile.
- Timezone selector in Settings. Default from browser; allow manual IANA selection. Persist across sessions.
- Timezone-aware date formatting; no manual fixed offsets.
- Update without repeated network polling; use client clock and timezone APIs.
- Handle invalid saved timezone by falling back to browser timezone.
- Respect `prefers-reduced-motion`: reduce or replace flip animation.
- Test minute/hour/day rollovers, AM/PM boundaries if 12-hour, timezone changes, mobile sizing, reduced-motion.

### 5.21 Global Settings gear dropdown

**Priority: P1**

Settings gear acts as a global in-place dropdown trigger on every applicable page. Clicking the gear must not navigate away.

- Dropdown anchored to gear button regardless of page.
- Gear rotates in sync with opening/closing animation.
- Clicking submenu navigates to dedicated settings destination; opening alone preserves current route.
- Include destinations: Profile, Display, Notifications, History, Support & Feedback, Community, Information, Audio, Clock / timezone.
- Close on destination selection, outside click, or Escape. Focus returns to trigger on Escape.
- Use correct button semantics, `aria-expanded`, `aria-controls`, accessible names.
- Fits viewport on small screens; layers above page content.
- Respect `prefers-reduced-motion`.
- No duplicate dropdown instances or listeners across pages.

### 5.22 Camp Rank, EXP, levels, and achievements

**Priority: P2 — planned; not implemented in the supplied ZIP**

Hollow Night Camp uses a progression system called **Camp Rank** to reward meaningful reading and community participation.

#### Rank thresholds

Minimum level for each named rank. Levels between thresholds retain the previous rank. **Twelve tiers:**

| Level | Camp Rank | Badge key / file |
| ---: | --- | --- |
| 1 | Wanderer | `rank:wanderer` → `assets/badges/wanderer.png` |
| 5 | Camper | `rank:camper` → `assets/badges/camper.png` |
| 10 | Story Seeker | `rank:story-seeker` → `assets/badges/story-seeker.png` |
| 20 | Clue Hunter | `rank:clue-hunter` → `assets/badges/clue-hunter.png` |
| 30 | Night Reader | `rank:night-reader` → `assets/badges/night-reader.png` |
| 40 | Theorist | `rank:theorist` → `assets/badges/theorist.png` |
| 50 | Hollow Investigator | `rank:hollow-investigator` → `assets/badges/hollow-investigator.png` |
| 60 | Fire Watcher | `rank:fire-watcher` → `assets/badges/fire-watcher.png` |
| 70 | Hollow Watcher | `rank:hollow-watcher` → `assets/badges/hollow-watcher.png` |
| 80 | Hollow Flame | `rank:hollow-flame` → `assets/badges/hollow-flame.png` |
| 90 | The UnderReader | `rank:under-reader` → `assets/badges/under-reader.png` |
| 100 | Hollow Legend | `rank:hollow-legend` → `assets/badges/hollow-legend.png` |

#### EXP rules
- Define central documented EXP event catalogue before implementation.
- Award EXP only for server-verifiable or abuse-resistant actions.
- No repeated EXP for refreshing, reopening chapters, or client-request replay.
- EXP transactions auditable and idempotent; users cannot set their own EXP.
- Calculate level and Camp Rank from canonical server EXP total.
- Display current EXP, next rank, progress, and achievements in profile.
- Exact EXP amounts per activity decided before release.

#### Reading streak and Night Owl badge
- Reading day counts when signed-in reader completes meaningful activity on a published chapter; minimum threshold persisted server-side.
- Streak advances at most once per user per calendar day, using one explicit timezone policy.
- Three consecutive qualifying days award the **Night Owl** badge once. Badge key: `achievement:night-owl`, asset at `assets/badges/night-owl.png`.
- Missing a calendar day resets active streak; longest streak remains as profile statistic.
- Prevent duplicate awards during retries, parallel requests, and timezone/day-boundary changes.

#### Daily Campfire check-in and Ember
- Daily check-in action in Campfire area.
- Successful check-in grants **Ember**, the **primary in-platform currency of Hollow Night Camp**. Ember is intended to unlock future items or experiences; redemption catalog and prices deferred.
- No more than once per calendar day; duplicate clicks and retries must not create extra currency.
- Show claim result, current balance, and next eligible check-in.
- Ember is non-cash, in-platform reward currency with no real-world value or cash-out.

#### Badge assets and naming convention
- Custom badge art authored later, stored under `assets/badges/`.
- Kebab-case filenames matching stable badge key (`wanderer.png`, `night-owl.png`, `under-reader.png`, `hollow-legend.png`).
- Badge key in database is source of truth; asset path is rendering detail. An image existing in repo must not itself grant a badge.
- UI tolerates missing badge images gracefully — fallback to text-only badge pill with rank name and neutral ring.
- Badge definitions, award records, and assets are separate concerns.

#### Acceptance criteria
- [ ] Reader's Camp Rank derived from server-stored EXP.
- [ ] Tier list renders exactly the 12 documented ranks at documented thresholds.
- [ ] Repeated refreshes or reopening same chapter does not grant duplicate EXP.
- [ ] Three consecutive qualifying reading days award Night Owl exactly once.
- [ ] Daily check-in grants Ember at most once per calendar day.
- [ ] Reader cannot set own EXP, level, streak, or Ember balance via client.
- [ ] Missing badge images render text fallback.

### 5.23 Camp Challenge

**Priority: P2 — planned; not implemented in the supplied ZIP**

**Dedicated Camp Challenge menu item in the Main Bar navigation** reachable by both Author and Reader accounts.

Author capabilities:
- Create, edit, publish, unpublish, schedule, archive challenges.
- Define title, description, instructions, start/end time, eligibility, completion criteria, Ember reward.
- Review participation and completion records.
- Cancel challenge with clear reason and reward policy.
- Manage challenge availability without affecting reader progression data.

Reader capabilities:
- Browse active, upcoming, completed challenges.
- View requirements, time remaining, reward, progress.
- Submit or trigger completion via validated workflow.
- See completion history and Ember rewards.

System requirements:
- Completion validated server-side; never trust client `completed=true`.
- Each user receives reward only once per challenge unless explicitly repeatable.
- Award Ember through same auditable ledger as daily check-in.
- Enforce author permissions and RLS.
- Loading, empty, success, error states.
- Camp Challenge menu appears correctly for eligible roles even with no published challenges.

Acceptance criteria:
- [ ] Author can publish challenge appearing to Readers via Camp Challenge menu.
- [ ] Reader can complete eligible challenge receiving Ember reward once.
- [ ] Repeated requests / concurrent submissions cannot duplicate rewards.
- [ ] Unpublished / future challenges not exposed as active.

### 5.24 Community leaderboards and monthly rewards

**Priority: P2 — planned; not implemented in the supplied ZIP**

**Dedicated Leaderboards menu/page in Main Bar** with separate categories.

Categories:
1. **Top Theorist** — likes received on eligible theories.
2. **Top Reader** — published chapters completed.
3. **Top Arcade Player** — validated total score across eligible arcade games.

Rules and safeguards:
- Grouped by calendar months using single documented timezone; current month clearly labeled.
- Define tie-break rules: earliest achievement, then stable display-name ordering.
- Only count eligible, non-deleted content and valid activity. Exclude self-likes, duplicate likes, test records, invalid scores.
- Do not expose private account details; display only nickname/avatar and metric.
- Community-focused: no public shaming, negative rankings, "worst user" lists.
- Preserve past-period results as archive.

#### Monthly rewards and Author controls
- Eligible winners receive configured badge and Ember reward.
- **Author-only leaderboard management menu accessible both from Author Studio AND from a control panel on Leaderboards page.** Author can preview current month, inspect results, trigger/finalize settlement, adjust reward amounts per rank, issue or correct rewards through audited workflow.
- Explicit reset/close action for active period; never silently erase historical results or reward records.
- Prefer automated boundaries plus Author-controlled finalization over destructive manual clearing.
- Require confirmation for finalization/reset; record actor, timestamp, period, reason.
- Idempotent reward settlement.

Acceptance criteria:
- [ ] Each category has its own metric and ranking.
- [ ] Displayed month and metric definition visible.
- [ ] Only authorized Authors can manage/finalize monthly boards.
- [ ] Settlement is reproducible and cannot pay rewards twice.
- [ ] Author control panel reachable from Leaderboards page in one click.

### 5.25 Author Analytics Dashboard

**Priority: P2 — planned; not implemented in the supplied ZIP**

Author-only **Analytics menu within Author Studio** (linked from Author leaderboard management view). Single source of truth: surfaces **all insights supported by instrumented data**, clearly distinguishes observed from estimated, **never displays fabricated zero** for uninstrumented metrics — label as "not yet instrumented."

Initial analytics:
- **Chapter reads:** total and unique reads per chapter, date range and trend.
- **Most-read chapters:** ranked list and period comparison.
- **Average ratings:** chapter and novel averages, vote counts, changes over time.
- **Favorite reading hours:** distribution by hour; disclose timezone.
- **Reading completion:** completed chapters and rates where instrumented.
- **Reader engagement:** daily/weekly active readers and retention.
- **Community insights:** theory counts, likes, replies.
- **Challenge / reward insights:** participation, completion, Ember rewards.
- **Arcade insights:** plays and validated scores.
- **Gamification insights:** rank distribution, streak length distribution, Ember in circulation, daily check-in rate, monthly leaderboard participation.
- **Data coverage:** explicit section listing unavailable metrics with reason and delivery phase.

Privacy and correctness:
- Only authorized Authors; no private reading histories tied to identifiable users unless separately approved.
- Aggregated data by default; minimum group sizes where appropriate.
- Define "read," "unique read," "completed chapter," "favorite hour" explicitly.
- Avoid counting every refresh as meaningful read; use deduplication windows.
- Timezone-aware aggregation with visible timezone.
- Do not fabricate historical data.
- Expensive reports paginated, indexed, cached, or pre-aggregated.

Acceptance criteria:
- [ ] Author can select date range and inspect chapter reads and rating summaries.
- [ ] Favorite reading hours derived from recorded qualifying events with visible timezone.
- [ ] Dashboard labels missing instrumentation instead of misleading zeros.
- [ ] Dashboard surfaces ALL instrumented insights (gamification, challenge, arcade, community).
- [ ] Readers cannot access analytics through routes or direct database requests.

### 5.26 Shared economy, activity ledger, and data model

**Priority: P0 for secure implementation of the above systems**

Progress, check-in, challenge, and leaderboard systems share rewards and must use one consistent source of truth.

Recommended logical entities:
- `reader_activity_events`: validated events (chapter completion, challenge completion, eligible theory interactions)
- `reader_progress`: EXP total, level/rank derivation, current/longest streak, last qualifying reading date
- `badge_definitions`: stable key, title, description, optional asset path
- `user_badges`: user/badge award record, source event, timestamp
- `ember_ledger`: append-only credit/debit transactions with source type/ID, amount, timestamp, idempotency key
- `daily_checkins`: one record per user per eligible day
- `camp_challenges`: author-managed definitions and publication schedule
- `challenge_participation`: user status, progress, completion time, reward settlement status
- `leaderboard_periods`: month, category, state, finalization metadata
- `leaderboard_snapshots` or equivalent aggregates: reproducible period results
- `analytics_events` or pre-aggregated tables: qualifying reads, completion events, timestamps

Security requirements:
- Enable RLS on exposed tables with exact Reader/Author model.
- Constraints, unique indexes, trusted RPCs for one-per-day check-ins, unique badge awards, idempotent reward settlement.
- Never trust browser-submitted EXP, Ember, leaderboard totals, challenge completion, winner status.
- Do not expose service-role credentials.
- Keep transaction trail for corrections; never silently overwrite/delete economy history.
- Test unauthorized reads/writes and concurrent duplicates before release.

---

## 6. Visual and Interaction Design

### Art direction

- Illustrated, atmospheric, slightly quirky, mysterious, welcoming.
- Palette: midnight blues / forest greens, warm firelight, parchment neutrals, restrained accents.
- Expressive headings, readable body text.
- Layered scene composition, silhouettes, hand-crafted details, subtle environmental animation.
- Playful rather than corporate.
- No copyrighted show assets or imitation of protected artwork.

### Gamification visual identity

- Camp Rank badges follow one coherent art style matching the site's mysterious camp aesthetic: flame progression, owl motif for Night Owl, hollow sigil for higher tiers.
- Each badge combines a symbol with the rank name; reads clearly at 24–32 px (comments) and 64–96 px (profile).
- Badge files use kebab-case under `assets/badges/`.
- Until artwork is ready, show **text-only badge pill** with rank name in a neutral ring; never show broken image.
- Ember represented with small flame glyph; balance visible next to Camp Rank in profile header and Main Bar account chip.

### Interface principles

1. **Atmosphere without sacrificing clarity.** Visual effects must not reduce text contrast.
2. **Consistent components.** Reuse shared buttons, inputs, cards, badges, menus, dialogs, and empty states.
3. **Mobile-first navigation.** Nothing unreachable on narrow screens.
4. **Useful feedback.** Every save, upload, login, import, or delete shows visible result.
5. **Accessible motion.** Respect `prefers-reduced-motion`.
6. **Responsive images.** Optimized sizes and appropriate loading behavior.
7. **No dead controls.** Visible controls work or are explicitly marked unavailable.

---

## 7. Technical Requirements and Architecture

### Current stack

- HTML5
- CSS3
- JavaScript ES modules
- Supabase JavaScript client v2 loaded from `esm.sh`
- Supabase Auth and profile queries
- CSS / JavaScript parallax with background image and depth map
- Planned: shared loader animation, browser audio controls for `assets/sound/`, Supabase Realtime Presence for online-session counts, timezone-aware client clock, shared Settings dropdown, Camp Rank / Ember / Challenge / Leaderboard / Analytics systems (§5.22–§5.26)

### Proposed responsibilities

| Layer | Responsibility |
| --- | --- |
| Static frontend | Page layout, responsive UI, interaction states, navigation |
| Supabase Auth | Registration, login, session handling, logout |
| Supabase Postgres | Novels, chapters, world-building, theories, replies, notifications, preferences, bookmarks, reading history, EXP, Ember, badges, challenges, leaderboards, analytics events |
| Supabase Storage | Novel covers, profile pictures, map images, character art, location images, badge assets |
| Supabase RLS | Enforce ownership, visibility, permissions, reward/ranking integrity |
| Hosting platform | Serve frontend over HTTPS, deploy repository changes |
| Optional edge / server functions | Trusted admin operations, import processing, moderation, notification jobs, challenge validation, leaderboard settlement, analytics aggregation |

### Cloudflare deployment

Before changing hosting:
1. Confirm current live deployment provider and domain settings.
2. If Cloudflare Pages is selected, connect GitHub and configure project root / build settings for static HTML.
3. Confirm direct navigation to every `.html` page works.
4. Configure required environment values and safe deployment practices.
5. Test production domain and Supabase Auth redirect URLs.
6. Document repeatable deployment process.

Static frontend generally does not need a build command unless a build tool is introduced.

### Environment and secrets

- Publishable client key is for frontend use only when database and Storage are secured with RLS.
- Never expose service-role key, database password, private tokens, or server secrets in frontend files or Git history.
- Use environment variables / platform secrets for server-side credentials.
- Confirm Auth redirect URLs and allowed origins for local and production.

### Database entities to plan for

- `profiles`
- `novels`
- `chapters`
- `chapter_ratings` (unique `(chapter_id, user_id)`; rating 1–5)
- `arcade_scores`
- `arcade_saves`
- `arcade_player_stats`
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
- `support_reports`
- `user_preferences`
- `reader_activity_events`
- `reader_progress`
- `badge_definitions`
- `user_badges`
- `ember_ledger`
- `daily_checkins`
- `camp_challenges`
- `challenge_participation`
- `leaderboard_periods`
- `leaderboard_snapshots`
- `analytics_events`
- Realtime Presence channel/configuration for aggregate online sessions.

Each table uses stable IDs, timestamps, explicit relationships, indexes.

### Security rules

- Enable and test RLS on every user-facing table.
- Public users read only published content.
- Readers manage only content explicitly allowed.
- Readers update only own profile and preferences.
- Author privileges based on trusted role source.
- Do not trust role values from browser.
- Validate input and file uploads; limit size and content types.
- Render user content safely; prevent script injection.
- Confirm Storage policies.
- Validate all EXP, Ember, badge, challenge, and leaderboard writes through trusted RPCs or database functions — never trust the client.
- Test with Reader, Author, and unauthenticated sessions.

---

## 8. Non-Functional Requirements

### Performance
- Optimize images; avoid large scene assets on pages not needing them.
- Pause animation loops when scene hidden or page inactive.
- Avoid excessive database requests; load long lists incrementally.
- Responsive on mid-range mobile.

### Accessibility
- Semantic HTML with meaningful accessible names.
- Keyboard navigation and visible focus states.
- Sufficient color contrast.
- Do not rely on color alone.
- Reduced-motion behavior for parallax and dice animations.
- Form labels associated with inputs; errors/success announced to assistive tech.
- Badge and Ember displays include accessible text descriptions.

### Reliability
- Loading, empty, error, success states on data-driven pages.
- Prevent duplicate submissions.
- Confirm destructive actions.
- Preserve unsaved editor text on save failure.
- Graceful handling of missing Supabase data.
- Gamification and economy endpoints idempotent; no duplicate EXP, Ember, badges.

### Compatibility
- Support current major mobile and desktop browsers.
- Test narrow mobile, tablet, desktop widths.
- Verify Supabase Auth redirects, cookies, sessions, and navigation on production origin.

### Maintainability
- Reuse shared UI and auth utilities.
- Separate content data from presentation.
- Avoid duplicating navigation and permission logic.
- Document schema changes and deployment settings.
- Keep TODOs and feature status updated.

---

## 9. Delivery Plan and Current Progress

### Phase 0 — Audit and stabilization
- [x] Repository and initial static website structure.
- [x] Supabase email/password sign-up and sign-in client flow.
- [x] Profile read/update for nickname and bio.
- [x] Shared navigation and Author-only editor route guard.
- [x] Campfire welcome screen and parallax depth effect.
- [x] Glass Main Bar with top-bar / sidebar / compact navigation modes.
- [x] Supabase project URL and publishable client key configured.
- [x] `profiles` table created; profile save behavior confirmed.
- [x] Cloudflare Worker URL added to Supabase Auth Redirect URLs.
- [ ] Shared logo-led loading animation with error/reduced-motion states.
- [ ] Production sign-up, email verification, login, logout, session persistence verified end-to-end.
- [ ] RLS and Storage policies tested with Reader, Author, signed-out sessions.
- [ ] Canonical production domain and repeatable deployment workflow confirmed.

**Current exit status: PARTIALLY COMPLETE.**

### Phase 1 — Core story library and authoring
- [x] Novel library data loading in `js/novels.js`.
- [x] Novel detail and chapter-management workflow.
- [x] Novel create/edit/delete in source.
- [x] Chapter editor with metadata and word count.
- [x] Save-draft and publish actions in source.
- [x] Reader-facing chapter page and navigation.
- [ ] Chapter Ratings with five d20 icons; one current vote per reader; fractional fill; realtime aggregates.
- [ ] Weighted Novel Ratings with realtime updates and DB-enforced uniqueness / RLS.
- [x] Chapter import for TXT, DOCX, text-based PDF with review before draft creation.
- [ ] Database schema, RLS, published-only visibility, Storage bucket policies, cross-session persistence verified.
- [ ] Latest-published-chapter section on Campfire homepage verified.
- [ ] Chapter ordering, volume / arc grouping, deletion confirmation in live workflow verified.
- [ ] Unsaved-change protection and save failure recovery tested.

**Current exit status: IMPLEMENTED IN SOURCE, LIVE VERIFICATION REQUIRED.**

### Phase 2 — Author tools and world building
- [ ] Volume / arc organization and chapter reordering completed.
- [x] Characters management and reader pages (`characters.html`, `js/world.js`).
- [x] Maps, map image upload, responsive named markers (`maps.html`).
- [x] Locations management and linked lore (`locations.html`).
- [x] Novels sub-navigation under each page headline.
- [ ] `supabase/world-building.sql` run; RLS and `worldbuilding` Storage bucket verified.
- [ ] Novel cover / image upload through Supabase Storage verified and improved.

**Current exit status: NOT COMPLETE.**

### Phase 3 — Community investigation
- [x] Theory creation and listing.
- [x] Confirmed / Likely / Speculation / Wild Theory filters.
- [x] Theory detail pages and replies.
- [ ] Ownership rules, reporting, moderation, anti-spam.
- [ ] Persistence and RLS verified.
- [ ] Theory like events emitted for Top Theorist leaderboard.

**Current exit status: IMPLEMENTED IN SOURCE, LIVE VERIFICATION REQUIRED.**

### Phase 4 — Settings and notifications
- [x] Profile nickname / bio editing and save feedback.
- [ ] Avatar persistence through object-storage bucket.
- [ ] System / Light / Dark themes.
- [ ] English / Indonesian interface localization.
- [ ] Notification preferences and notification center.
- [x] Reading history and bookmarks (`js/reading.js`, `js/history.js`; tables `bookmarks`, `reading_progress`).
- [ ] Help / FAQ, support feedback, Community social links.
- [x] Global Settings gear dropdown available in place on every applicable page.
- [ ] Music and SFX enable/disable and volume controls backed by `assets/sound/`.
- [x] Persisted timezone selection and retro neon split-flap clock UI.

**Current exit status: PARTIAL.**

### Phase 4B — Camp Rank, rewards, challenges, leaderboards, and analytics
- [ ] EXP events, rank calculation, streak day boundary, Night Owl award rules defined.
- [ ] Camp Rank profile display and server-validated activity tracking.
- [ ] Daily Campfire check-in and append-only Ember ledger.
- [ ] `assets/badges/` created with 12-rank list and Night Owl naming convention.
- [ ] Dedicated **Camp Challenge** menu, Author CRUD, Reader flow, server-side completion validation, Ember rewards.
- [ ] Dedicated **Leaderboards** menu with Top Theorist, Top Reader, Top Arcade Player.
- [ ] Monthly archive, Author-controlled leaderboard management (reachable from Leaderboards page), idempotent badge/Ember rewards.
- [ ] Author Analytics Dashboard covering ALL instrumented insights with explicit "not yet instrumented" labels.
- [ ] RLS, abuse prevention, idempotency, privacy review, concurrency tests for every reward/ranking flow.

**Current exit status: NOT STARTED.**

### Phase 5 — Arcade
- [ ] Supabase-backed arcade score submissions and leaderboards with RLS and validated writes.
- [ ] Compact versioned Supabase save-game records and player stats.
- [ ] Animated dice rolling and session roll history.
- [ ] Simple playable browser games.
- [ ] Mobile input and reduced-motion behavior tested.
- [ ] Validated scores submitted to Top Arcade Player leaderboard and Author Analytics.

**Current exit status: NOT STARTED.**

### Phase 6 — Camp exploration, deployment and polish
- [ ] Wide-angle / distant-camera mode.
- [ ] FireWatcher inspection interaction and optional easter eggs.
- [ ] Scene assets and animation performance optimized.
- [x] Aggregate realtime online-reader count with stale-session cleanup.
- [ ] Accessibility, responsive, regression testing.
- [ ] Cloudflare Worker / Pages deployment, canonical domain, direct-page navigation, Supabase Auth redirects verified.
- [ ] README deployment instructions updated to match actual hosting setup.

**Current exit status: PARTIAL.**

---

## 10. Definition of Done

A feature is complete only when all relevant conditions are met:

- [ ] UI matches intended design; works on mobile and desktop.
- [ ] All visible controls work.
- [ ] Data persists where required.
- [ ] Loading, empty, success, error states handled.
- [ ] Reader and Author permissions enforced at backend.
- [ ] RLS and Storage policies tested with real role sessions.
- [ ] No secrets exposed in frontend.
- [ ] Keyboard navigation and reduced-motion behavior considered.
- [ ] No regressions in existing features.
- [ ] Feature tested in deployed environment, not only locally.
- [ ] PRD status table updated to reflect actual implementation.

---

## 11. Open Decisions

1. **Cloudflare:** Is Cloudflare Pages the intended permanent host, or should GitHub Pages remain active?
2. **Author assignment:** Which trusted administrative method grants the initial Author role and future changes?
3. **Chapter imports:** Which formats required in first release? File-size limits?
4. **Theory moderation:** Who can mark a theory as Confirmed? Can original poster change category after publishing?
5. **Notifications:** In-site only, or also email in first release?
6. **Map markers:** Popover, side panel, or dedicated location page?
7. **Support reports:** Email client or in-site tracking?
8. **Community accounts:** Require verified email for theory posting?
9. **Reading history:** Sync across devices? User able to delete?
10. **Localization:** Default language for new visitors?
11. **Audio assets:** Final filenames, formats, loop behavior for music and SFX.
12. **Online readers:** Unique users or active sessions? Include current visitor? Default proposal: active sessions, including current visitor, no identities exposed.
13. **Clock placement:** Where on shared site layout?
14. **Clock format:** 24-hour mandatory or user choice? Default proposal: 24-hour.
15. **EXP schedule:** Amounts per qualifying action; which actions eligible?
16. **Streak timezone:** Reader's timezone or platform-wide? Prevent retroactive timezone changes from granting extra days.
17. **Ember economy:** What will Ember unlock? Costs? Rewards expire? Keep undecided until first reward catalog designed.
18. **Challenge verification:** Which types auto-validated vs Author review?
19. **Monthly leaderboard settlement:** Timezone, tie-breakers, reward amounts per category?
20. **Analytics privacy:** Minimum aggregation threshold and retention period for reading-hour and engagement analytics?
21. **Reading completion definition:** What qualifies as chapter completion for Top Reader and streak eligibility?
22. **Camp Rank threshold check:** Confirm Lv 5 threshold for Camper is intentional, or shift first tier step to Lv 10 for a 1–10–20–…–100 pattern (11 tiers).
23. **Badge artwork timing:** When will custom badge art for 12 ranks + Night Owl be delivered? Ship with text-only pills or placeholder artwork until then?
24. **Leaderboard category exclusivity:** Can a user appear on multiple leaderboards simultaneously, or must they pick one at settlement?

---

## 12. Source Audit Notes

Update based on `Hollow-Night-Camp-main (10).zip` and implementation files:

- `index.html`, `js/login.js`: login / registration interface and form flow.
- `js/auth.js`: Supabase Auth, session observation, profile retrieval and updates.
- `js/shared.js`: page/session guard, Author role check, Author Mode state, Main Bar, editor three-dot menu.
- `home.html`, `js/home.js`, `js/parallax.js`: welcome screen, homepage interactions, depth-map parallax.
- `novels.html`, `novel.html`, `js/novels.js`: novel listing, details, author operations, chapter management.
- `editor.html`, `js/editor.js`: chapter metadata, body editor, word count, draft saving, publishing.
- `read.html`, `js/read.js`: reader-facing chapter display and navigation.
- `js/import.js`: TXT / DOCX / text-based PDF extraction with review step.
- `js/rating.js`, `css/rating.css`: d20 rating visuals and chapter/novel rating helpers.
- `js/status-widget.js`: timezone-aware retro flip clock and Supabase Realtime Presence online-reader count.
- `settings.html`: profile editor and avatar UI.
- `theories.html`, `js/theories.js`: theory list/detail, categories, posting, replies.
- `config/supabase.js`: Supabase project URL and publishable client key.
- `css/mainbar.css`, `assets/icons/`: glass navigation styling and icon assets.

### External progress noted on 2026-10-20

Cloudflare Worker URL `https://hollow-night-camp.kazualtr.workers.dev/` added to Supabase Auth Redirect URLs. Configuration progress — not proof of end-to-end production sign-in. README still references older GitHub Pages URL.

**Security note:** A client-side Author Mode switch or route guard is not sufficient authorization. Verify RLS and Storage policies reject unauthorized writes. Do not place service-role keys or private credentials in frontend files.

**Audit limitation:** Source-code and project-progress review, not a live penetration test. External dashboard state, production routing, deployed code parity, RLS behavior, and persistence must be verified separately.

<div align="center">

**HOLLOW NIGHT CAMP**  
*The fire is still burning. The woods are watching.*

</div>

### Feature requirements recorded on 2026-10-21

Planned only, not implemented in supplied ZIP: (1) custom logo-led loading animation, (2) separate Music and SFX controls with independent volumes under `assets/sound/`, (3) aggregate realtime online-reader count, (4) timezone-configurable retro neon split-flap clock, (5) global in-place Settings gear dropdown with synchronized gear/dropdown animation. Detailed acceptance criteria in §5.16–§5.21.

### Camp Rank / gamification requirements recorded on 2026-10-21

Planned only, not implemented in supplied ZIP: **12-tier Camp Rank** (Wanderer → Camper → Story Seeker → Clue Hunter → Night Reader → Theorist → Hollow Investigator → Fire Watcher → Hollow Watcher → Hollow Flame → The UnderReader → Hollow Legend), EXP and levels, three-day Night Owl streak badge, daily Campfire check-in and **Ember as the primary in-platform currency**, **dedicated Camp Challenge menu** with Author-managed challenges and Ember rewards, **dedicated Leaderboards menu** with Top Theorist / Top Reader / Top Arcade Player categories, monthly period settlement, Author-controlled leaderboard management, and **Author Analytics Dashboard** surfacing all instrumented insights. Custom badge art planned for `assets/badges/` with kebab-case naming. Requirements, controls, acceptance criteria, and data entities in §5.22–§5.26. Do not mark complete until implementation and backend policies verified.