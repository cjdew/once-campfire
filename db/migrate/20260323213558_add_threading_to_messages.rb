class AddThreadingToMessages < ActiveRecord::Migration[8.0]
  def up
    add_column :messages, :parent_message_id, :integer, null: true
    add_column :messages, :replies_count, :integer, default: 0, null: false
    add_index :messages, :parent_message_id
  end

  def down
    remove_index :messages, :parent_message_id
    remove_column :messages, :replies_count
    remove_column :messages, :parent_message_id
  end
end
