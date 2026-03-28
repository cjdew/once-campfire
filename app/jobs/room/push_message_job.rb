class Room::PushMessageJob < ApplicationJob
  def perform(room, message)
    creator = Notification::Creator.new(message)
    creator.create_mention_notifications
    creator.create_dm_notifications

    broadcast_unread_counts(room, message)

    Room::MessagePusher.new(room:, message:).push
    Room::OnesignalPusher.new(room:, message:).push
  end

  private
    def broadcast_unread_counts(room, message)
      room.memberships.visible.where.not(user: message.creator).each do |membership|
        ActionCable.server.broadcast(
          "user_#{membership.user_id}_unread_rooms",
          { roomId: room.id, count: membership.unread_count }
        )
      end
    end
end
