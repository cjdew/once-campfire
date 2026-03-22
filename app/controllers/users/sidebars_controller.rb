class Users::SidebarsController < ApplicationController
  DIRECT_PLACEHOLDERS = 20

  def show
    all_memberships = Current.user.memberships.visible.with_ordered_room

    @channel_memberships = sort_with_favorites(
      all_memberships.reject { |m| m.room.direct? }
    )
    @direct_memberships = sort_with_favorites(
      all_memberships.select { |m| m.room.direct? }
    )

    @direct_placeholder_users = find_direct_placeholder_users
  end

  private
    def sort_with_favorites(memberships)
      favorited, regular = memberships.partition(&:favorited?)
      favorited.sort_by { |m| (m.room.name || "").downcase } +
        regular.sort_by { |m| m.room.direct? ? m.room.updated_at.to_i * -1 : (m.room.name || "").downcase }
    end

    def find_direct_placeholder_users
      exclude_user_ids = user_ids_already_in_direct_rooms_with_current_user.including(Current.user.id)
      User.active.where.not(id: exclude_user_ids).order(:created_at).limit(DIRECT_PLACEHOLDERS - exclude_user_ids.count)
    end

    def user_ids_already_in_direct_rooms_with_current_user
      Membership.where(room_id: Current.user.rooms.directs.pluck(:id)).pluck(:user_id).uniq
    end
end
