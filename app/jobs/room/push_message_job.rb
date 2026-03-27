class Room::PushMessageJob < ApplicationJob
  def perform(room, message)
    Room::MessagePusher.new(room:, message:).push
    Room::OnesignalPusher.new(room:, message:).push
  end
end
