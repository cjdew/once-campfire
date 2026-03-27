class MessageThread::PushReplyJob < ApplicationJob
  queue_as :default

  def perform(room, message)
    parent = message.parent_message
    recipients = Set.new

    recipients << parent.creator
    recipients.merge(parent.thread_participants)
    recipients.merge(message.mentionees)
    recipients.delete(message.creator)

    return if recipients.empty?

    MessageThread::ReplyPusher.new(
      room: room,
      message: message,
      recipients: recipients.to_a
    ).push
  end
end
