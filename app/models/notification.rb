class Notification < ApplicationRecord
  belongs_to :user
  belongs_to :room
  belongs_to :message

  enum :kind, { mention: 0, thread_reply: 1, dm_message: 2 }

  scope :unread, -> { where(read_at: nil) }
  scope :newest_first, -> { order(created_at: :desc) }

  class << self
    def mark_read_for_room(user, room)
      where(user: user, room: room, read_at: nil)
        .where(kind: [ :mention, :dm_message ])
        .update_all(read_at: Time.current)
    end

    def mark_read_for_thread(user, parent_message)
      where(user: user, message: parent_message, kind: :thread_reply, read_at: nil)
        .update_all(read_at: Time.current)
    end

    def mark_all_read(user)
      where(user: user, read_at: nil).update_all(read_at: Time.current)
    end
  end
end
