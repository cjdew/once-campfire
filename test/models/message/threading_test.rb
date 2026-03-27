require "test_helper"

class Message::ThreadingTest < ActiveSupport::TestCase
  setup do
    @room = rooms(:designers)
    @user = users(:david)
    @other_user = users(:jason)
    Current.user = @user
  end

  test "root message has no parent" do
    message = @room.messages.create!(body: "root message")
    assert_nil message.parent_message_id
    assert_not message.thread?
  end

  test "reply belongs to parent message" do
    parent = @room.messages.create!(body: "parent")
    reply = @room.messages.create!(body: "reply", parent_message_id: parent.id)
    assert reply.thread?
    assert_equal parent, reply.parent_message
  end

  test "parent has many replies" do
    parent = @room.messages.create!(body: "parent")
    reply1 = @room.messages.create!(body: "reply 1", parent_message_id: parent.id)
    reply2 = @room.messages.create!(body: "reply 2", parent_message_id: parent.id, creator: @other_user)
    assert_equal [reply1, reply2], parent.replies.order(:created_at).to_a
  end

  test "replies_count is maintained via counter cache" do
    parent = @room.messages.create!(body: "parent")
    assert_equal 0, parent.replies_count
    reply = @room.messages.create!(body: "reply", parent_message_id: parent.id)
    parent.reload
    assert_equal 1, parent.replies_count
    reply.destroy
    parent.reload
    assert_equal 0, parent.replies_count
  end

  test "root_messages scope excludes replies" do
    parent = @room.messages.create!(body: "parent")
    @room.messages.create!(body: "reply", parent_message_id: parent.id)
    root_only = @room.messages.root_messages
    assert_includes root_only, parent
    assert_equal root_only, root_only.where(parent_message_id: nil)
  end

  test "thread_participants returns users who replied" do
    parent = @room.messages.create!(body: "parent")
    @room.messages.create!(body: "reply 1", parent_message_id: parent.id, creator: @other_user)
    assert_includes parent.thread_participants, @other_user
    assert_not_includes parent.thread_participants, @user
  end

  test "destroying parent cascades to replies" do
    parent = @room.messages.create!(body: "parent")
    reply = @room.messages.create!(body: "reply", parent_message_id: parent.id)
    parent.destroy
    assert_not Message.exists?(reply.id)
  end
end
