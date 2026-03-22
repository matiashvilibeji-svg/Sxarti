# Agent 6: Conversations Inbox + Settings Page

## Mission

Build the Conversations inbox (split-screen chat interface with real-time updates) and the Settings page (tabbed configuration). All UI in Georgian.

## YOUR Files (create these)

- `src/app/(dashboard)/conversations/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- `src/components/chat/conversation-list.tsx`
- `src/components/chat/conversation-item.tsx`
- `src/components/chat/chat-view.tsx`
- `src/components/chat/message-bubble.tsx`
- `src/components/chat/chat-input.tsx`
- `src/components/chat/platform-badge.tsx`
- `src/components/chat/status-badge.tsx`
- `src/components/chat/index.ts` — barrel export

## Stitch MCP — Fetch Designs First

Use `mcp__stitch__get_screen` with project_id `12084308622143530029`:

- Conversations Inbox: screen_id `dc45b98dd5d3443cb01b1cccb36bea8c`
- Settings: screen_id `dd07670d3cd744778eded9f8b1c0e1f7`

## Functional Requirements

### Conversations Page (`/dashboard/conversations`)

- **Split-screen layout**: conversation list (left panel) + chat view (right panel)
- **Conversation List** (left):
  - Each item shows: customer name, last message preview (truncated), platform badge (Messenger/Instagram icon), status badge (active/handoff/completed), relative timestamp
  - Sort by `last_message_at` descending
  - Filter by status
  - Search by customer name
  - Selected item highlighted
- **Chat View** (right):
  - Full message history, scrollable
  - **Message bubbles** styled differently by sender:
    - customer → left-aligned, gray
    - bot → right-aligned, primary color
    - human → right-aligned, different color (indicates human takeover)
  - Timestamp under each message
- **"აკონტროლე" (Take Over) button**:
  - Sets conversation `status = 'handoff'`
  - Shows text input for human operator to type messages
  - Sends as `sender = 'human'`
- **"ბოტს გადაეცი" (Release to Bot) button**:
  - Sets conversation `status = 'active'`
  - Hides human input
- **Real-time updates**: Use Supabase Realtime to subscribe to new messages on the active conversation
- **Empty state**: "საუბრები ჯერ არ არის" (No conversations yet) with illustration

### Settings Page (`/dashboard/settings`)

- **Tabbed layout** using shadcn/ui Tabs component

**Tab 1: პროფილი (Profile)**

- Business name (edit)
- Logo upload (to Supabase Storage)
- Contact info

**Tab 2: ბოტი (Bot)**

- Bot persona name input
- Tone selector: formal / friendly / casual (radio or select)
- Working hours configuration (JSON or structured inputs)
- Payment details (BOG IBAN, TBC account, instructions)

**Tab 3: კავშირები (Connections)**

- Facebook page: connect/disconnect button (OAuth flow)
- Instagram: connect/disconnect button
- Show connected account name when connected

**Tab 4: შეტყობინებები (Notifications)**

- WhatsApp phone number input
- Telegram setup instructions + chat_id input
- Notification preferences checkboxes (new order, handoff, low stock, daily summary)

**Tab 5: FAQ**

- CRUD list of Q&A pairs
- Add: question + answer inputs → save to `faqs` table
- Edit inline
- Delete with confirmation

**Tab 6: გამოწერა (Subscription)**

- Current plan display (Starter/Business/Premium)
- Usage meter: conversations this month / limit
- Plan comparison table
- "განახლება" (Upgrade) button (placeholder, no payment flow)

## Supabase Realtime Setup (for Conversations)

```typescript
const channel = supabase
  .channel("messages")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `conversation_id=eq.${activeConversationId}`,
    },
    (payload) => {
      // Append new message to chat view
    },
  )
  .subscribe();
```

## Georgian UI Text Reference

- საუბრები = Conversations
- პარამეტრები = Settings
- აკონტროლე = Take over
- ბოტს გადაეცი = Release to bot
- პროფილი = Profile
- ბოტი = Bot
- კავშირები = Connections
- შეტყობინებები = Notifications
- გამოწერა = Subscription
- შენახვა = Save
- გაუქმება = Cancel

## DO NOT Touch

- Any file outside `src/app/(dashboard)/conversations/`, `src/app/(dashboard)/settings/`, `src/components/chat/`
- `src/components/ui/*` — Agent 1
- `src/lib/supabase/*` — Agent 1

## Completion

1. Run `npm run build` — must pass
2. Commit: "feat: add conversations inbox with realtime chat and settings page"
3. Output DONE
