// chat: the default panel and the heart of the app. the real streaming
// chat against jabby (via bro's /api/chat proxy), multi-thread, with
// the collapsed "what bro did" trace. see BRO_PLAN.md §8.1.

import { ChatPanel } from "./_shell/ChatPanel";

export default function ChatRoute() {
  return <ChatPanel />;
}
