class AddLastReadMessageIdToMemberships < ActiveRecord::Migration[8.0]
  def change
    add_column :memberships, :last_read_message_id, :bigint
    add_foreign_key :memberships, :messages, column: :last_read_message_id, on_delete: :nullify
    add_index :memberships, :last_read_message_id
  end
end
