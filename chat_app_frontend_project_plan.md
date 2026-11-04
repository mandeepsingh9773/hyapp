# WhatsApp-Like Frontend Chat Application --- Project Plan

## 1. Project Goal

Build a responsive, frontend-only chat application inspired by WhatsApp
Web.

-   Desktop: show the conversation sidebar and active chat side by side.
-   Mobile: show either the conversation list or the active chat as a
    full-screen view, with back navigation.
-   No backend, authentication, database, or real networking is
    required.
-   Use local mock JSON data and frontend logic to simulate chat
    behavior.

The goal is to demonstrate frontend architecture, UI implementation,
state management, interaction design, responsive behavior, and
engineering trade-offs.

## 2. Required Technology

  Area               Choice
  ------------------ --------------------------------------------------
  Framework          Next.js (App Router, static export, single route)
  Language           TypeScript
  Styling            Tailwind CSS v4
  State management   Redux Toolkit (RTK)
  Forms              React Hook Form
  Icons              Lucide React
  Testing            Vitest + React Testing Library (jsdom)
  Package manager    npm

Next.js is configured with `output: 'export'` and exactly one page
route (`/`); the application is served as a static single-page app.
Redux state is client-side only. There is no multi-route navigation ---
"routing" in the Next.js sense is limited to the single root route and
must not be used to implement deep links or history behavior unless
that constraint is revisited and approved.

Use Redux Toolkit for shared application state. Use React local state
for isolated, temporary UI state. Use React Hook Form for the message
composer and any structured forms.

## 3. Scope

### Core features --- must implement

#### A. Conversation sidebar

-   Display direct and group conversations.
-   Show avatar, name, and online status where relevant.
-   Show last-message preview and timestamp.
-   Show unread message count.
-   Search conversations.
-   Filter by All, Unread, and Groups.
-   Highlight the selected conversation.

#### B. Chat window

-   Display messages for the selected conversation.
-   Send text messages.
-   Simulate incoming messages.
-   Show message timestamps.
-   Show simulated sending/sent/delivered/read status for outgoing
    messages.
-   Show typing indicators.
-   Scroll to the latest message when appropriate.
-   Group messages by date.

#### C. Message interactions

-   Reply to a specific message.
-   Edit the current user's messages.
-   Delete messages.
-   Copy message content.
-   Add and remove emoji reactions.

#### D. Group conversations

-   Display group name, avatar, and member list.
-   Show member online status.
-   Add and remove members using mock/local functionality.

#### E. User experience

-   Responsive desktop, tablet, and mobile layouts.
-   Mobile conversation-list and active-chat views with back navigation.
-   Loading, empty, and relevant error states.
-   Search messages within the active conversation.
-   Keyboard behavior: Enter sends; Shift+Enter inserts a newline.
-   Light and dark themes.
-   Touch-accessible message actions; do not rely on hover on mobile.

### Explicitly deferred optional features

Do not implement these until every core feature above works: -
Virtualized message list for 10,000+ messages. - Infinite scrolling /
loading older messages. - LocalStorage or IndexedDB persistence. -
Offline message queue. - Attachment preview. - WebSocket-based
simulation. - Advanced optimistic update and rollback behavior.

## 4. Recommended Architecture

Use a feature-based structure and keep UI, state transitions, selectors,
and mock data concerns separate.

Next.js requires the page entry point at `src/app/page.tsx` and a root
layout at `src/app/layout.tsx`. Those are thin framework entry files
that only mount the application; all real application code lives under
the feature folders below. Shared application code lives under `src/`.

``` text
src/
  app/
    layout.tsx        (Next.js root layout: providers, fonts, globals)
    page.tsx          (single route '/' -> mounts <App />)
    globals.css       (Tailwind import + theme tokens)
    App.tsx           (top-level application composition, client)
    StoreProvider.tsx (client component that supplies the Redux store)
    store.ts
    hooks.ts
  features/
    conversations/
      components/
      conversationsSlice.ts
      selectors.ts
    messages/
      components/
      messagesSlice.ts
      selectors.ts
      utils/
    groups/
      components/
      groupsSlice.ts
    settings/
      components/
      settingsSlice.ts
  components/
    ui/
    layout/
  services/
    mockChatService.ts
    chatSimulation.ts
  data/
    users.ts
    conversations.ts
    messages.ts
  types/
    chat.ts
  tests/
```

This is a starting structure, not a requirement to create empty files
for every folder. Keep files together when splitting them would add no
value.

### Data flow

``` text
React Components
      |
      v
Typed Redux Hooks / Dispatch
      |
      v
Redux Toolkit Slices and Actions
      |
      +------ Selectors ------> Derived UI data
      |
      v
Mock service / simulation
      |
      v
Local mock data
```

-   Components render data and dispatch user-intent actions.
-   Redux slices own shared state transitions.
-   Selectors derive filtered conversations, latest-message previews,
    unread counts (if derived), and date-grouped messages.
-   Mock services provide initial data and controlled asynchronous
    simulations.
-   Do not put mock data access or timer logic inside message bubbles.

## 5. Redux Toolkit State Plan

Use `configureStore`, `createSlice`, typed `RootState` / `AppDispatch`,
and typed selector/dispatch hooks.

Suggested state domains:

### Conversations slice

-   Conversation records.
-   Selected conversation ID.
-   Conversation search query.
-   Active conversation filter: `all | unread | groups`.

### Messages slice

-   Messages grouped/indexed by conversation ID.
-   Message-level status.
-   Reply references.
-   Reactions.
-   Editing/deletion state if shared across components.

### Groups slice (optional separate slice)

-   Group metadata and member changes.
-   It is also acceptable to keep group data in the conversations slice
    if that is simpler and avoids duplicated state.

### Settings slice

-   Theme: `light | dark`.

Do not put every transient UI value in Redux. Keep menu visibility,
hover state, and isolated input state local unless multiple components
need them.

### Derived data --- prefer selectors

Do not store duplicate values when they can be derived: - Filtered
conversation list. - Latest message preview. - Date-grouped messages. -
Message-search results. - Unread count, if the chosen read-state model
supports deriving it reliably.

Choose one unread-count strategy: 1. Store a conversation unread count
and update it through defined actions; or 2. Derive it from incoming
messages' read state.

Do not maintain both independently.

## 6. Core Data Models

Define TypeScript types before implementing the UI.

### User

-   `id`
-   `displayName`
-   `avatarUrl`
-   `isOnline`
-   Optional `lastSeenAt`

### Conversation

-   `id`
-   `type: 'direct' | 'group'`
-   `title` (or derive from the other participant for direct chats)
-   `avatarUrl`
-   `participantIds`
-   `updatedAt`

### Message

-   `id`
-   `conversationId`
-   `senderId`
-   `text`
-   `createdAt`
-   Optional `updatedAt`
-   `status` (define a union such as
    `sending | sent | delivered | read | failed`)
-   Optional `replyToMessageId`
-   Reactions

### Reaction

-   `emoji`
-   `userIds` or an equivalent representation that identifies who
    reacted.

Use stable IDs. Editing must preserve a message's ID and original
creation timestamp. Define a consistent deletion policy so replies do
not point to missing messages; a deleted-message placeholder is a
suitable approach.

## 7. Phase-by-Phase Implementation Plan

Implement in this order. Do not move to optional features while core
functionality is incomplete.

### Phase 1 --- Setup and data foundation

-   Create React + TypeScript project.
-   Configure Tailwind, Redux Toolkit, React Hook Form, Lucide, Vitest,
    and React Testing Library.
-   Define user, conversation, message, and reaction types.
-   Create mock JSON/TypeScript seed data with several direct and group
    conversations.
-   Configure the Redux store and typed hooks.

**Exit criteria:** App starts; seed data loads into Redux; types and
store are usable.

### Phase 2 --- Responsive application shell

-   Build desktop two-column layout.
-   Build mobile conversation-list view.
-   Build mobile full-screen chat view and back navigation.
-   Establish independent scrolling for sidebar and message history.
-   Add basic light/dark theme tokens and theme switching.

**Exit criteria:** Layout works at desktop, tablet, and mobile widths;
selecting/back navigation works.

### Phase 3 --- Conversation sidebar

-   Build sidebar header and avatar/profile area.
-   Build conversation items.
-   Display last-message preview, timestamp, online status, and unread
    badge.
-   Implement conversation search.
-   Implement All, Unread, and Groups filters.
-   Highlight selected conversation.

**Exit criteria:** Search and filters work together; sidebar previews
reflect Redux state.

### Phase 4 --- Chat display and sending

-   Build chat header.
-   Render incoming and outgoing message bubbles.
-   Group messages by date.
-   Build message composer using React Hook Form.
-   Send messages through a Redux action.
-   Update latest-message preview and conversation ordering.
-   Show timestamps and outgoing message status.
-   Implement initial scroll-to-latest behavior.

**Exit criteria:** User can open a conversation, view history, send a
message, and see the sidebar update.

### Phase 5 --- Message interactions

-   Reply to a message and show reply context.
-   Edit the current user's message and show an edited indicator.
-   Delete a message using the chosen deletion policy.
-   Copy message content and show success/failure feedback.
-   Add/remove emoji reactions.
-   Search messages in the active conversation.
-   Add keyboard and touch-accessible message actions.

**Exit criteria:** Every required message action works and does not
corrupt message/reply state.

### Phase 6 --- Simulated chat behavior and groups

-   Simulate incoming messages using controlled timers.
-   Simulate typing indicators.
-   Simulate outgoing status transitions.
-   Update unread state when messages arrive in inactive conversations.
-   Mark messages/conversations read when opened, according to the
    chosen model.
-   Display group details and members.
-   Add/remove group members locally.
-   Clean up timers when the conversation changes or components unmount.

**Exit criteria:** The app demonstrates believable local chat behavior
without a backend.

### Phase 7 --- UX completion, tests, and documentation

-   Complete loading, empty, and relevant error states.
-   Verify light/dark theme.
-   Verify responsive behavior and mobile keyboard usability.
-   Test scroll behavior when user is at bottom versus reading older
    messages.
-   Add unit tests for selectors and state transitions.
-   Add component interaction tests for critical flows.
-   Remove console errors and fix visual defects.
-   Write README with setup, architecture, mock-data explanation,
    assumptions, and trade-offs.

**Exit criteria:** All core requirements are implemented, tested,
documented, and usable on desktop and mobile.

## 8. Interaction Rules to Implement

### Send message

1.  Reject empty/whitespace-only text.
2.  Create a stable message ID and timestamp.
3.  Add the message to the active conversation through Redux.
4.  Update conversation activity and preview.
5.  Clear the composer after successful local submission.
6.  Simulate status transitions separately.

### Incoming message

1.  Simulation chooses a known conversation and participant.
2.  Add the incoming message to that conversation.
3.  Update conversation activity.
4.  Increment unread state only when the conversation is not active,
    according to the chosen rules.
5.  Show typing indicator before the message where appropriate.

### Scroll behavior

-   On opening a conversation, show the latest messages.
-   After the user's own send, scroll to the bottom.
-   If an incoming message arrives and the user is already near the
    bottom, follow it.
-   If the user is reading older messages, preserve their position and
    optionally show a new-message indicator.

### Reply/edit/delete

-   A reply stores the referenced message ID, not a separate copy of the
    entire message.
-   Editing preserves message ID and creation timestamp; update
    `updatedAt`.
-   Deletion must not leave broken reply references. Prefer a
    deleted-message placeholder.

### Timers

-   Keep simulation timers outside presentational components.
-   Clear timers when no longer needed.
-   Prevent delayed callbacks from updating the wrong conversation.

## 9. Testing Checklist

### Selector/unit tests

-   Conversation search.
-   All/Unread/Groups filters.
-   Latest-message selection.
-   Date grouping.
-   Message search.
-   Unread count logic.

### Redux tests

-   Send message.
-   Receive message.
-   Edit message.
-   Delete message.
-   Add/remove reaction.
-   Mark conversation read.
-   Update group members.
-   Update message status.

### Component interaction tests

-   Select conversation.
-   Search/filter conversations.
-   Send valid message.
-   Reject whitespace-only message.
-   Reply/edit/delete message.
-   Copy message feedback.
-   Add reaction.
-   Mobile back navigation.
-   Theme toggle.

Use fake timers for simulation tests where appropriate.

## 10. Engineering Trade-offs and Constraints

-   No backend, authentication, database, real network delivery, or
    cross-device synchronization.
-   In-memory state is sufficient for the core version.
-   Do not add persistence until core features are complete.
-   Do not add routing unless deep links or browser-history behavior
    become necessary.
-   Do not add virtualization for a small mock dataset.
-   Do not introduce a UI library unless it materially speeds up
    implementation without compromising the design.
-   Avoid duplicating derived data in Redux.
-   Avoid premature memoization and abstraction.
-   Keep mock behavior deterministic enough to test and demonstrate
    reliably.

## 11. Definition of Done

The core application is complete when:

-   [ ] Desktop shows sidebar and active chat together.
-   [ ] Mobile switches between conversation list and full-screen chat.
-   [ ] Conversation list shows avatars, status, preview, timestamp, and
    unread count.
-   [ ] Search and All/Unread/Groups filters work.
-   [ ] Messages render with timestamps and date separators.
-   [ ] User can send text messages.
-   [ ] Incoming messages and typing are simulated.
-   [ ] Outgoing status indicators update through simulation.
-   [ ] Reply, edit, delete, copy, and reactions work.
-   [ ] Message search works.
-   [ ] Group details and mock member management work.
-   [ ] Scroll behavior respects whether the user is reading older
    messages.
-   [ ] Light and dark themes work.
-   [ ] Relevant loading, empty, and error states exist.
-   [ ] Keyboard and touch interactions are usable.
-   [ ] Important selectors, Redux actions, and interactions have tests.
-   [ ] README documents setup, architecture, assumptions, and
    trade-offs.

## 12. Development Workflow and Engineering Principles

This section governs **how** the work is done. It applies in addition to the technical specification above and takes precedence where the two touch on process.

### 12.1 SOLID principles --- single responsibility first

The **first SOLID principle (Single Responsibility)** is the primary rule for file and module design: every module has exactly one reason to change.

Ownership table --- each concern lives in exactly one place:

| Concern                     | Lives in                          | Must NOT contain                          |
| --------------------------- | --------------------------------- | ----------------------------------------- |
| Rendering / presentation    | Components                        | Mock data access, timers, business logic  |
| Shared state transitions    | Redux slices                      | Rendering, direct mock access             |
| Derived/calculated data     | Selectors                         | Stored duplicates of derivable state      |
| Mock data + simulation      | Services (`mockChatService`, etc.)| JSX, Redux dispatch in presentational code|
| Type definitions            | `types/`                          | Runtime logic                             |

- If a component needs a timer, business rule, or mock access, that concern is moved out to a service, slice, or selector --- never inlined.
- When splitting a file would not add value, keep it together; SRP is about responsibility, not file count.
- If a later principle (OCP, LSP, ISP, DIP) genuinely applies, raise it explicitly for discussion rather than silently applying it.

### 12.2 Interview before every phase

Before writing any code for a phase, conduct a focused interview with the user covering the real decision forks: data shapes, UI behavior, edge cases, naming, file organization, and scope trims.

- Do not silently take consequential decisions alone.
- For each question, present concrete options with a recommendation so the user can decide.
- Record the agreed decisions and carry them into the phase.

### 12.3 One phase at a time with a handoff report

Do not implement all phases in a single pass. After finishing each phase, stop and provide a report containing:

1. **What I did** --- the phase goal and its outcome.
2. **Features added** --- the user-facing or behavioral capabilities delivered.
3. **Decisions made** --- key choices, assumptions, and rejected alternatives.
4. **Files added/modified** --- each path, why it exists, and the single responsibility it owns.
5. **SRP notes** --- any files split or merged, and why.
6. **Checklist** --- completed items from §11 Definition of Done plus the tests to run.

Then wait for review and approval before starting the next phase.

### 12.4 Approval gate

- No phase starts without a completed interview (§12.2).
- No phase starts until the previous phase's handoff report (§12.3) has been reviewed and approved.
- The cadence is: **Interview → confirm decisions → implement → report → review → approve → next phase.**

### 12.5 Session continuity

If starting a new session, read **§12 and §13** before doing anything. Section 12 defines the workflow and engineering principles; Section 13 defines how the assistant is expected to operate. Together they let any new session recover how this project is being built without re-deriving the process.

## 13. Instructions for an LLM Assisting With Implementation

Use this document as the implementation specification. This section and Section 12 are both binding; Section 12 governs process and Section 13 governs operating instructions.

0.  Follow the workflow in Section 12: interview before every phase, implement one phase at a time, and produce a handoff report after each phase. Do not proceed without approval.
1.  Do not generate the entire application in one response.
2.  Work phase by phase in the order defined above.
3.  Before implementing a phase, interview the user on the real decision forks, then explain its goal, affected files, data flow, and important decisions.
4.  Do not silently change the agreed architecture or replace Redux
    Toolkit with another state library.
5.  Use Next.js (TypeScript, App Router, static export, single route),
    Tailwind CSS v4, Redux Toolkit, React Hook Form, Lucide, and Vitest
    with React Testing Library.
6.  Do not add backend code or introduce a backend dependency.
7.  Do not implement optional features until the core Definition of Done
    is satisfied.
8.  Explain code and trade-offs; do not encourage blind copy-pasting.
9.  After each phase, provide the handoff report and checklist defined in Sections 12.3 and 12.4.
10. Keep mock data, simulation logic, Redux state transitions,
    selectors, and UI responsibilities separated, in accordance with
    the single-responsibility-first rule in Section 12.1.
11. Prefer the simplest design that satisfies the requirement; avoid
    overengineering.
12. If a requirement is ambiguous, state the assumption and ask before
    making a consequential architectural change.

**Start with Phase 1 only. Do not proceed to Phase 2 until Phase 1 is
reviewed and approved.**
