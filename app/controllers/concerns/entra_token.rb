module EntraToken
  extend ActiveSupport::Concern

  included do
    helper_method :current_user_entra_token
  end

  private

  def current_user_entra_token
    # Prefer Entra access token from OIDC login; fall back to admin token
    # so the documents API works for email/password sessions too.
    session[:entra_access_token].presence || ENV["CANVAS_BOT_ADMIN_TOKEN"] || ""
  end
end
