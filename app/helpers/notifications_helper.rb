module NotificationsHelper
  def notification_path_for(notification)
    case notification.kind
    when "mention", "dm_message"
      room_path(notification.room, message_id: notification.message_id)
    when "thread_reply"
      room_path(notification.room, message_id: notification.message_id, anchor: "thread")
    end
  end

  def notification_kind_label(notification)
    case notification.kind
    when "mention" then "@mention"
    when "thread_reply" then "thread reply"
    when "dm_message" then "DM"
    end
  end

  def notification_context_text(notification)
    case notification.kind
    when "mention"
      "in ##{notification.room.name}"
    when "thread_reply"
      "replied in ##{notification.room.name}"
    when "dm_message"
      ""
    end
  end
end
