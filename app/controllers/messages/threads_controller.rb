class Messages::ThreadsController < ApplicationController
  include RoomScoped
  before_action :set_parent_message

  layout false

  def show
    @replies = @parent_message.replies.includes(:creator, :rich_text_body).order(:created_at)
    Notification.mark_read_for_thread(Current.user, @parent_message)
  end

  private

  def set_parent_message
    message = @room.messages.find(params[:message_id])
    @parent_message = message.thread? ? message.parent_message : message
  end
end
