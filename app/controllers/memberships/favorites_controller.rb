class Memberships::FavoritesController < ApplicationController
  before_action :set_membership

  def update
    @membership.update!(favorited: !@membership.favorited)
  end

  private
    def set_membership
      @membership = Current.user.memberships.find(params[:membership_id])
    end
end
