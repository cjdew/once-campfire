class NotificationsController < ApplicationController
  before_action :set_notifications, only: :index

  def index
    render layout: false
  end

  def mark_all_read
    Notification.mark_all_read(Current.user)
    head :ok
  end

  private
    def set_notifications
      @notifications = Notification
        .where(user: Current.user)
        .newest_first
        .includes(:room, :message, message: :creator)
        .limit(50)
      @unread_count = Notification.where(user: Current.user).unread.count
    end
end
