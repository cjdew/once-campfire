class Room::PushMessageJob < ApplicationJob
  def perform(room, message)
    creator = Notification::Creator.new(message)
    creator.create_mention_notifications
    creator.create_dm_notifications

    Room::MessagePusher.new(room:, message:).push
    Room::OnesignalPusher.new(room:, message:).push
  end
end
