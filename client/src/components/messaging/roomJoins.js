// roomJoins: joins a conversation's socket room once, however many views show it (the Messaging page and the
// docked chat window can show the same conversation). The last view to close it sends the single "leave";
// without the count, one view's "leave" would cut typing events off from the other.
const rooms = new WeakMap(); // socket -> Map(conversationId -> { count, join })

// Session 13: conversation:join on open, conversation:leave when the last view closes. Returns the release function.
export function joinConversation(socket, conversationId) {
  const id = String(conversationId);
  if (!rooms.has(socket)) rooms.set(socket, new Map());
  const joined = rooms.get(socket);

  let entry = joined.get(id);
  if (!entry) {
    const join = () => socket.emit('conversation:join', id);
    entry = { count: 0, join };
    joined.set(id, entry);
    join();
    socket.on('connect', join); // rooms are lost when the socket reconnects
  }
  entry.count += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.count -= 1;
    if (entry.count > 0) return;
    joined.delete(id);
    socket.off('connect', entry.join);
    socket.emit('conversation:leave', id);
  };
}
