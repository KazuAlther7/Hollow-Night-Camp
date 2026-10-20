# Hollow Night Camp — Product Requirements Document

> **Document type:** Product Requirements Document (PRD)  
> **Product:** Hollow Night Camp  
> **Document status:** Working specification  
> **Audit basis:** `Hollow-Night-Camp-main (5).zip` supplied on 2026-10-20, cross-checked against the current project conversation  
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
| Chapter import from TXT / DOCX / text-based PDF | **DONE in source / VERIFY** | `js/import.js` parses supported formats (5 MB limit), presents review flow and creates draft content. Scanned PDFs/OCR are not supported. |
| Latest Chapter section | **PARTIAL / VERIFY** | Homepage author controls/status are present, but confirm a complete reader-facing latest-published-chapter section is wired to live chapter data. |
| Volumes / arcs and chapter list | **PARTIAL / VERIFY** | Volume metadata and chapter management exist in the editor/novel workflow; verify full grouping/reordering experience. |
| Theories page | **NOT STARTED** | `theories.html` remains a heading and introductory placeholder. |
| Theory posts, replies and cloud persistence | **NOT STARTED** | No complete discussion workflow is present in the supplied source. |
| Theory categories and moderation | **NOT STARTED** | Confirmed / Likely / Speculation / Wild Theory filters and moderation are not implemented. |
| Corners Arcade | **NOT STARTED** | `arcade.html` remains a “Coming soon” placeholder. |
| D&D-style dice roll and games | **NOT STARTED** | No playable dice simulation or arcade game is present. |
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
5. **Settings** — user preferences and support.
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

### 5.8 Import chapters from PDF / DOC / DOCX

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

### 5.9 World building: characters, maps, and locations

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

### 5.10 Theories and investigation board

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

### 5.11 Corners Arcade

**Priority: P2**

The Arcade page should contain playable games rather than a “Coming soon” placeholder.

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

### 5.12 Settings

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

### 5.13 Notifications center

**Priority: P2**

- Bell icon remains visible in the Main Bar.
- Clicking it opens a notification panel or page.
- Show relevant updates such as newly published novels or chapters and site announcements.
- Support read / unread states and a mark-as-read action.
- Show a clear empty state.
- Respect the user's notification preferences.
- Do not show a permanent unread indicator when there are no unread notifications.
- Notification delivery method and whether email notifications are included must be decided separately; the initial requirement is an in-site notification center.

### 5.14 Language and localization

**Priority: P2**

- Provide English and Indonesian.
- Keep interface text in translation resources rather than scattering hard-coded strings across scripts.
- Persist the selected language.
- Use the selected language consistently across navigation, settings, error messages, and core workflows.
- Novel content remains in the language chosen by the Author; changing interface language should not automatically translate story content.

### 5.15 Latest Chapter

**Priority: P1**

- Show the latest **published** chapter on the homepage.
- Include chapter title, parent novel, publication/update date, and a link to read.
- Determine “latest” from a reliable publication timestamp or chapter ordering rule.
- Do not show drafts.
- Show a designed empty state if no published chapters exist.

---

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
- [x] Add chapter import flow for TXT, DOCX and text-based PDF, with review before draft creation.
- [ ] Verify database schema, RLS, published-only Reader visibility, Storage bucket policies and cross-session persistence.
- [ ] Verify complete latest-published-chapter display on the Campfire homepage.
- [ ] Verify chapter ordering, volume / arc grouping and deletion confirmation in the live workflow.
- [ ] Test unsaved-change protection and save failure recovery.

**Current exit status: IMPLEMENTED IN SOURCE, LIVE VERIFICATION REQUIRED.** This phase is substantially further along than the earlier PRD audit indicated.

### Phase 2 — Author tools and world building
- [ ] Complete volume / arc organization and chapter reordering.
- [ ] Add dedicated Characters management and reader pages.
- [ ] Add Maps, map image upload and responsive named markers.
- [ ] Add Locations management and linked lore records.
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
- [ ] Implement reading history and bookmarks.
- [ ] Add Help / FAQ, support feedback and Community social links.

**Current exit status: PARTIAL.** Profile basics work; remaining account preferences and utilities are outstanding.

### Phase 5 — Arcade
- [ ] Implement animated dice rolling and session roll history.
- [ ] Add simple playable browser games.
- [ ] Test mobile input and reduced-motion behavior.

**Current exit status: NOT STARTED.** Arcade remains a placeholder.

### Phase 6 — Camp exploration, deployment and polish
- [ ] Add wide-angle / distant-camera mode.
- [ ] Add FireWatcher inspection interaction and optional easter eggs.
- [ ] Optimize scene assets and animation performance.
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

---

## 12. Source Audit Notes

This update was based on the supplied `Hollow-Night-Camp-main (5).zip` and relevant implementation files:

- `index.html` and `js/login.js`: login / registration interface and form flow.
- `js/auth.js`: Supabase Auth, session observation, profile retrieval and profile updates.
- `js/shared.js`: page/session guard, Author role check, Author Mode state, Main Bar and editor three-dot menu.
- `home.html`, `js/home.js`, `js/parallax.js`: welcome screen, homepage interactions and depth-map parallax.
- `novels.html`, `novel.html`, `js/novels.js`: novel listing, novel details, author novel operations and chapter-management workflow.
- `editor.html`, `js/editor.js`: chapter metadata, body editor, word count, draft saving and publishing.
- `read.html`, `js/read.js`: reader-facing chapter display and chapter navigation.
- `js/import.js`: TXT / DOCX / text-based PDF extraction, review step and draft import.
- `settings.html`: profile editor and avatar UI.
- `theories.html` and `arcade.html`: these remain placeholders.
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
