class AddFavoritedToMemberships < ActiveRecord::Migration[8.0]
  def change
    add_column :memberships, :favorited, :boolean, default: false, null: false
    add_index :memberships, [:user_id, :favorited]
  end
end
