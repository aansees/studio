import { env } from "../lib/env"
import { flushDueProjectChatRooms } from "../lib/services/project-chat"

let isFlushing = false
let stopped = false

async function flushPendingRooms() {
  if (isFlushing || stopped) {
    return
  }

  isFlushing = true
  try {
    const result = await flushDueProjectChatRooms({ force: true })
    if (result.messages > 0) {
      console.info(
        `chat-worker flushed ${result.messages} messages across ${result.rooms} rooms`,
      )
    }
  } catch (error) {
    console.error("chat-worker flush failed", error)
  } finally {
    isFlushing = false
  }
}

console.info(
  `chat-worker started with ${env.CHAT_AUTO_FLUSH_INTERVAL_MS}ms interval`,
)

void flushPendingRooms()

const interval = setInterval(() => {
  void flushPendingRooms()
}, env.CHAT_AUTO_FLUSH_INTERVAL_MS)

function shutdown() {
  stopped = true
  clearInterval(interval)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
