class CreateNotifications < ActiveRecord::Migration[8.0]
  def change
    create_table :notifications do |t|
      t.references :user, null: false, foreign_key: true
      t.references :room, null: false, foreign_key: true
      t.references :message, null: false, foreign_key: true
      t.integer :kind, null: false
      t.datetime :read_at

      t.datetime :created_at, null: false
    end

    add_index :notifications, [:user_id, :read_at, :created_at]
    add_index :notifications, [:user_id, :room_id, :read_at]
    add_index :notifications, [:message_id, :user_id], unique: true
  end
end
