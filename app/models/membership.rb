class Membership < ApplicationRecord
  include Connectable

  belongs_to :room
  belongs_to :user
  belongs_to :last_read_message, class_name: "Message", optional: true

  after_destroy_commit { user.reset_remote_connections }

  enum :involvement, %w[ invisible nothing mentions everything ].index_by(&:itself), prefix: :involved_in

  scope :with_ordered_room, -> { includes(:room).joins(:room).order("LOWER(rooms.name)") }
  scope :without_direct_rooms, -> { joins(:room).where.not(room: { type: "Rooms::Direct" }) }

  scope :visible,    -> { where.not(involvement: :invisible) }
  scope :unread,     -> { where.not(unread_at: nil) }
  scope :favorited,  -> { where(favorited: true) }

  def mark_read
    latest = room.messages.root_messages.order(:id).last
    update!(unread_at: nil, last_read_message_id: latest&.id)
  end

  def read
    update!(unread_at: nil)
  end

  def unread?
    unread_at.present?
  end

  def unread_count
    if last_read_message_id.present?
      room.messages.root_messages.where("messages.id > ?", last_read_message_id).count
    else
      room.messages.root_messages.count
    end
  end
end
