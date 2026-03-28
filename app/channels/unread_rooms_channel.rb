class UnreadRoomsChannel < ApplicationCable::Channel
  def subscribed
    stream_from "unread_rooms"
    stream_from "user_#{current_user.id}_unread_rooms"
  end
end
