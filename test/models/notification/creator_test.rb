require "test_helper"

class Notification::CreatorTest < ActiveSupport::TestCase
  test "creates mention notifications for mentioned users" do
    message = messages(:first)
    message.stubs(:mentionees).returns(User.where(id: users(:david).id))

    Notification::Creator.new(message).create_mention_notifications

    notification = Notification.find_by(user: users(:david), message: message)
    assert notification.present?
    assert notification.mention?
    assert_equal message.room, notification.room
  end

  test "does not create mention notification for the message creator" do
    message = messages(:first) # creator is jason
    message.stubs(:mentionees).returns(User.where(id: [users(:jason).id, users(:david).id]))

    Notification::Creator.new(message).create_mention_notifications

    assert_nil Notification.find_by(user: users(:jason), message: message)
    assert Notification.find_by(user: users(:david), message: message).present?
  end

  test "creates dm_message notifications for DM rooms" do
    room = rooms(:david_and_jason)
    message = Message.create!(room: room, creator: users(:david), client_message_id: "test-dm-1")

    Notification::Creator.new(message).create_dm_notifications

    assert Notification.find_by(user: users(:jason), message: message, kind: :dm_message).present?
    assert_nil Notification.find_by(user: users(:david), message: message)
  end

  test "creates thread_reply notifications for thread participants" do
    parent = messages(:fourth) # room: watercooler, creator: jz
    reply = Message.create!(room: rooms(:watercooler), creator: users(:david), parent_message: parent, client_message_id: "test-reply-1")

    recipients = Set.new
    recipients << parent.creator # jz
    recipients.delete(reply.creator) # david (the replier)

    Notification::Creator.new(reply).create_thread_reply_notifications(recipients)

    notification = Notification.find_by(user: users(:jz), message: parent, kind: :thread_reply)
    assert notification.present?
    assert_nil Notification.find_by(user: users(:david), message: parent)
  end

  test "skips duplicate notifications gracefully" do
    message = messages(:first)
    message.stubs(:mentionees).returns(User.where(id: users(:david).id))

    Notification::Creator.new(message).create_mention_notifications
    # Second call should not raise
    Notification::Creator.new(message).create_mention_notifications

    assert_equal 1, Notification.where(user: users(:david), message: message).count
  end
end
