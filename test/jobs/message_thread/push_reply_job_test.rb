require "test_helper"

class MessageThread::PushReplyJobTest < ActiveJob::TestCase
  setup do
    @room = rooms(:watercooler)
    @author = users(:david)
    @replier = users(:jason)
    Current.user = @author
    @parent = @room.messages.create!(body: "parent message")
    Current.user = @replier
    @reply = @room.messages.create!(body: "a reply", parent_message_id: @parent.id)
  end

  test "notifies parent author" do
    job = MessageThread::PushReplyJob.new
    recipients = extract_recipients(job, @room, @reply)
    assert_includes recipients, @author
  end

  test "does not notify the reply sender" do
    job = MessageThread::PushReplyJob.new
    recipients = extract_recipients(job, @room, @reply)
    assert_not_includes recipients, @replier
  end

  test "notifies thread participants" do
    third_user = users(:jz)
    Current.user = third_user
    @room.messages.create!(body: "another reply", parent_message_id: @parent.id)

    Current.user = @replier
    new_reply = @room.messages.create!(body: "yet another reply", parent_message_id: @parent.id)

    job = MessageThread::PushReplyJob.new
    recipients = extract_recipients(job, @room, new_reply)
    assert_includes recipients, @author
    assert_includes recipients, third_user
  end

  private

  def extract_recipients(job, room, message)
    parent = message.parent_message
    recipients = Set.new
    recipients << parent.creator
    recipients.merge(parent.thread_participants)
    recipients.merge(message.mentionees)
    recipients.delete(message.creator)
    recipients.to_a
  end
end
