class MessageThread::ReplyPusher
  attr_reader :room, :message, :recipients

  def initialize(room:, message:, recipients:)
    @room, @message, @recipients = room, message, recipients
  end

  def push
    payload = {
      title: room.name,
      body: "#{message.creator.name} replied in thread: #{message.plain_text_body}",
      path: Rails.application.routes.url_helpers.room_path(room, thread: message.parent_message_id)
    }

    subscriptions = Push::Subscription
      .joins(user: :memberships)
      .merge(Membership.visible.disconnected.where(room: room))
      .where(user: recipients)

    Rails.configuration.x.web_push_pool.queue(payload, subscriptions)
  end
end
