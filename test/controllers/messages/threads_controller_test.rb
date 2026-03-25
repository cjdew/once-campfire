require "test_helper"

class Messages::ThreadsControllerTest < ActionDispatch::IntegrationTest
  setup do
    host! "once.campfire.test"
    sign_in :david
    @room = rooms(:watercooler)
    Current.user = users(:david)
    @parent = @room.messages.create!(body: "parent message")
  end

  test "show renders thread sidebar for parent message" do
    reply = @room.messages.create!(body: "a reply", parent_message_id: @parent.id)
    get room_message_thread_path(@room, @parent)
    assert_response :success
    assert_includes response.body, "parent message"
    assert_includes response.body, "a reply"
  end

  test "show resolves to parent when given a reply message" do
    reply = @room.messages.create!(body: "a reply", parent_message_id: @parent.id)
    get room_message_thread_path(@room, reply)
    assert_response :success
    assert_includes response.body, "parent message"
  end

  test "show works for message with no replies" do
    get room_message_thread_path(@room, @parent)
    assert_response :success
    assert_includes response.body, "parent message"
  end
end
