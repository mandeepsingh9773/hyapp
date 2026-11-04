# HyApp — WhatsApp-like Chat Frontend

A responsive, frontend-only chat application inspired by WhatsApp Web. It
ships as a static Next.js single-page export with no backend, authentication,
database, or real networking. Chat behavior is simulated locally with mock
data and timers.

- **Desktop / tablet:** conversation sidebar and active chat side by side.
- **Mobile:** conversation list and full-screen chat with back navigation.

---

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
```

### Scripts

| Command             | Purpose                                                 |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server (webpack).                 |
| `npm run build`     | Production build with static export (`out/`).           |
| `npm start`         | Serve the production build.                             |
| `npm run lint`      | ESLint via `eslint-config-next`.                        |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`).                 |
| `npm test`          | Run the Vitest + React Testing Library suite once.      |
| `npm run test:watch`| Run Vitest in watch mode.                               |

### Stack

Next.js 16 (App Router, `output: 'export'`, single route `/`) · TypeScript ·
Tailwind CSS v4 · Redux Toolkit · React Hook Form · Lucide React · Vitest +
React Testing Library (jsdom).

---

## Architecture

Feature-based structure that separates UI, state transitions, selectors, mock
data, and simulation. The rule of thumb is **single responsibility first**: each
module has one reason to change.

```
src/
  app/                      Next.js entry + app composition + Redux wiring
    layout.tsx              Root layout (providers, global CSS)
    page.tsx                Single route "/" -> <App />
    App.tsx                 Top-level composition (client)
    StoreProvider.tsx       Supplies the Redux store
    store.ts                configureStore + RootState/AppDispatch
    hooks.ts                Typed useAppDispatch/useAppSelector/useAppStore
    chatListeners.ts        Listener middleware (status transitions, unread)
    ThemeSync.tsx           Applies light/dark class to <html>
    ViewportSync.tsx        Syncs app height to window.visualViewport
  features/
    conversations/
      conversationsSlice.ts Load/ready/error status, selection, search, filter
      selectors.ts          Filtered list, previews, unread counts (derived)
      components/           Sidebar header, search, filter tabs, list, item,
                            loading skeleton
    messages/
      messagesSlice.ts      Send/edit/delete/react/receive/status/fail/retry
      messageInteractionSlice.ts  Reply/edit/search UI intent
      typingSlice.ts        Typing indicators
      selectors.ts          Date grouping, reply refs, search segments
      utils/                ID creation, display text, date format, scroll math
      components/           Chat header, list, bubble, actions, reactions,
                            composer, search, date separator, skeleton
    groups/                 Group member add/remove (local overlay)
    settings/               Theme + simulation toggle
  components/layout/        AppShell, ConversationPane, ChatPane, ChatSimulation,
                            ChatHydration, ThemeToggle
  services/                 Non-React logic
    mockChatService.ts      Chooses simulated incoming messages
    chatSimulation.ts       Timer helpers + delays + failure predicate
    chatHydration.ts        Simulated async seed loading
    clipboardService.ts     Copy abstraction with graceful failure
    userDirectory.ts        User lookup
  data/                     Seed data (users, conversations, messages, time)
  types/chat.ts             Shared TypeScript models
  tests/                    Vitest suites and shared render helper
```

### Data flow

```
Components → typed dispatch → Redux slices → selectors → derived UI
                                  ↓
                       listener middleware / mock services / timers
                                  ↓
                             local mock data
```

- Components render data and dispatch user intent.
- Slices own shared state transitions.
- Selectors derive filtered lists, previews, unread counts, date grouping, and
  search matches; derived values are never stored separately.
- Services provide seed data and controlled asynchronous behavior. Services
  never render JSX or dispatch; dispatch lives in components/listeners.

---

## Mock data and simulation

All data lives in `src/data/` and is imported into slice initial state.

- **Users** (`users.ts`): current user plus five contacts with online status.
- **Conversations** (`conversations.ts`): three direct and two group chats.
- **Messages** (`messages.ts`): history with timestamps relative to "now",
  including unread, edited, and deleted examples.
- **Relative time** (`relativeTime.ts`): `minutesAgo`/`hoursAgo` helpers keep
  the seed data plausible whenever the app is opened.

### Loading state

On first mount `ChatHydration` dispatches `startLoading`; `chatHydration.ts`
resolves the seed data after a short delay (`HYDRATION_DELAY_MS`), so the
sidebar shows skeleton rows before conversations appear. A failure resolves to
an error outcome and the sidebar offers a **Retry** action, which transitions
back to `loading` and runs hydration again.

### Simulated behavior (`components/layout/ChatSimulation.tsx`)

- Waits until conversations are `ready`.
- On a randomized delay, shows a typing indicator for a random conversation and
  participant, then delivers a message after `TYPING_DURATION_MS`.
- Timers live in a `SimulationTimers` wrapper and are cleared on unmount or when
  the feature is toggled off.
- Incoming messages in the selected conversation are marked read; others
  increase the derived unread count.

### Outgoing status transitions (`app/chatListeners.ts`)

After a send, listener middleware schedules `sent → delivered → read` via
`updateMessageStatus` at the delays in `chatSimulation.ts`. The same listener
touches the conversation's `updatedAt` so the sidebar reorders.

### Send failure + retry

Sends may simulate failure (see `shouldFailSend`). A message containing the
sentinel token `#fail` (or a small random chance) is marked `failed` after
`FAILURE_DELAY_MS`. The bubble shows “Not sent” with a **Retry** action that
dispatches `retryMessage`, returning it to `sent` and restarting status
transitions. This gives a real, testable error path without a backend.

### Scroll behavior

- Opening a conversation jumps to the latest message.
- The user’s own sends always scroll to the bottom.
- Incoming messages follow only when the user is within `NEAR_BOTTOM_THRESHOLD_PX`
  of the bottom; otherwise the position is preserved and a **New messages**
  pill appears that jumps to the latest.
- Scroll math lives in `features/messages/utils/scroll.ts` so it is unit-testable.

---

## State model

- **conversations:** items, load `status` (`idle | loading | ready | error`),
  selected id, search query, active filter (`all | unread | groups`).
- **messages:** `byConversation` + `byId` indexes, status, replies, reactions,
  soft deletion, read state.
- **messageInteraction:** reply/edit targets, in-conversation search state.
- **typing:** who is typing in which conversation.
- **groups:** locally added/removed members layered over seed participants.
- **settings:** theme and activity-simulation toggle.

Unread counts are **derived** from each message’s `readBy` set; there is no
stored counter to keep in sync.

### Deletion policy

Deleting soft-deletes a message (`deletedAt`), clears its text and reactions, and
renders a placeholder. Replies keep pointing at the ID, so no reply is broken.

---

## Responsive and theming

- Two-column layout on `md+`; single-column switch on mobile with a back button.
- Fluid height uses `100dvh` plus a `--app-height` custom property updated from
  `window.visualViewport` so the composer stays visible above the on-screen
  keyboard on mobile browsers.
- Light/dark themes use CSS variables in `globals.css`; `ThemeSync` toggles the
  `dark` class on `<html>`. Message action controls are always visible on touch
  (`max-md:opacity-100`) rather than hover-only.

---

## Testing

```bash
npm test
```

Coverage highlights:

- **Selectors:** conversation search, All/Unread/Groups filters, latest message,
  date grouping, message search, unread derivation, scroll math.
- **Redux transitions:** send, receive, edit, delete, reactions, mark read, group
  members, status updates, send failure/retry, loading state machine.
- **Component interactions:** select conversation, search/filter, send,
  whitespace rejection, reply/edit/delete, copy success/failure, reactions,
  message search, mobile back, theme toggle, group member management, typing,
  scroll-follow vs. preserved position, and loading/error states.

Shared rendering helpers live in `src/tests/renderApp.tsx`.

---

## Assumptions and trade-offs

- **No persistence.** In-memory Redux state only; a refresh resets to seed data.
  Persistence (localStorage/IndexedDB) was explicitly deferred.
- **No routing.** The app is a single route; mobile “navigation” is local state,
  not browser history/deep links.
- **No virtualization or infinite scroll.** The mock dataset is small; adding
  them early would add complexity without benefit.
- **Simulated loading and failures.** Seed hydration and send failure are
  deterministic-enough simulations to exercise loading/error UI without a
  backend.
- **Images.** Avatars are remote DiceBear URLs rendered with `<img>` (static
  export, no Next Image optimization).
- **Timers.** Status-transition timers are owned by listener middleware rather
  than components; the simulation loop owns its own cancellable timers and
  clears them on unmount.
- **Derived data stays derived.** Previews, unread counts, grouped messages, and
  search results are computed in selectors.

### Decision log (Phase 7)

- Smart scroll: follow-if-at-bottom, else preserve position + jump pill.
- Async hydration with skeletons for a real loading state and retryable error.
- Deterministic `#fail` token plus small random chance for send failures, with
  inline retry.
- `100dvh` + `visualViewport` sync for mobile keyboard usability.
- Cleaned up a duplicate `"use client"` directive and hardened scroll for
  non-browser environments in tests.
