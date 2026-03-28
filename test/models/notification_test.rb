require "test_helper"

class NotificationTest < ActiveSupport::TestCase
  test "kind enum values" do
    notification = Notification.new(
      user: users(:david),
      room: rooms(:designers),
      message: messages(:first),
      kind: :mention
    )
    assert notification.mention?

    notification.kind = :thread_reply
    assert notification.thread_reply?

    notification.kind = :dm_message
    assert notification.dm_message?
  end

  test "unread scope returns notifications with nil read_at" do
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:second), kind: :mention, read_at: Time.current)

    assert_equal 1, Notification.unread.where(user: users(:david)).count
  end

  test "mark_read_for_room marks matching notifications as read" do
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)
    Notification.create!(user: users(:david), room: rooms(:watercooler), message: messages(:fourth), kind: :mention)

    Notification.mark_read_for_room(users(:david), rooms(:designers))

    assert Notification.find_by(user: users(:david), room: rooms(:designers)).read_at.present?
    assert_nil Notification.find_by(user: users(:david), room: rooms(:watercooler)).read_at
  end

  test "mark_read_for_thread marks thread_reply notifications for parent message" do
    parent = messages(:fourth)
    Notification.create!(user: users(:david), room: rooms(:watercooler), message: parent, kind: :thread_reply)
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)

    Notification.mark_read_for_thread(users(:david), parent)

    assert Notification.find_by(user: users(:david), message: parent, kind: :thread_reply).read_at.present?
    assert_nil Notification.find_by(user: users(:david), message: messages(:first)).read_at
  end

  test "mark_all_read marks all unread notifications for user" do
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)
    Notification.create!(user: users(:david), room: rooms(:watercooler), message: messages(:fourth), kind: :thread_reply)

    Notification.mark_all_read(users(:david))

    assert Notification.where(user: users(:david), read_at: nil).none?
  end

  test "prevents duplicate notification for same message and user" do
    Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)

    assert_raises(ActiveRecord::RecordNotUnique) do
      Notification.create!(user: users(:david), room: rooms(:designers), message: messages(:first), kind: :mention)
    end
  end
end
