class Notification::Creator
  def initialize(message)
    @message = message
  end

  def create_mention_notifications
    @message.mentionees.where.not(id: @message.creator_id).find_each do |user|
      create_notification(user: user, kind: :mention, message: @message)
    end
  end

  def create_dm_notifications
    return unless @message.room.direct?

    @message.room.memberships.visible.where.not(user: @message.creator).includes(:user).find_each do |membership|
      create_notification(user: membership.user, kind: :dm_message, message: @message)
    end
  end

  def create_thread_reply_notifications(recipients)
    recipients.each do |user|
      create_notification(user: user, kind: :thread_reply, message: @message.parent_message)
    end
  end

  private
    def create_notification(user:, kind:, message:)
      notification = Notification.create!(
        user: user,
        room: @message.room,
        message: message,
        kind: kind
      )
      broadcast_notification(notification)
    rescue ActiveRecord::RecordNotUnique
      # Already notified for this message — skip
    rescue => e
      Rails.logger.error("[Notification::Creator] Failed to create notification: #{e.message}")
    end

    def broadcast_notification(notification)
      ActionCable.server.broadcast(
        "user_#{notification.user_id}_notifications",
        { type: "new_notification", unread_count: Notification.where(user_id: notification.user_id).unread.count }
      )
    end
end
