module Message::Broadcasts
  include ActionView::RecordIdentifier

  def broadcast_create
    if thread?
      # Append reply to thread sidebar
      broadcast_append_to parent_message, :thread_replies,
        target: dom_id(parent_message, :thread_replies)
      # Update reply badge on parent in main timeline
      reloaded_parent = parent_message.reload
      reloaded_parent.broadcast_replace_to room, :messages,
        target: dom_id(reloaded_parent, :reply_badge),
        partial: "messages/reply_badge",
        locals: { message: reloaded_parent }
    else
      broadcast_append_to room, :messages, target: [ room, :messages ]
    end
    ActionCable.server.broadcast("unread_rooms", { roomId: room.id })
  end

  def broadcast_remove
    if thread?
      broadcast_remove_to parent_message, :thread_replies
      reloaded_parent = parent_message.reload
      reloaded_parent.broadcast_replace_to room, :messages,
        target: dom_id(reloaded_parent, :reply_badge),
        partial: "messages/reply_badge",
        locals: { message: reloaded_parent }
    else
      if replies_count > 0
        broadcast_action_to self, :thread_replies,
          action: :remove, target: dom_id(self, :thread_sidebar)
      end
      broadcast_remove_to room, :messages
    end
  end

end
