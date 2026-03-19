module EntraToken
  extend ActiveSupport::Concern

  included do
    helper_method :current_user_entra_token
  end

  private

  def current_user_entra_token
    # Populated by Sessions::OmniauthController#create after OIDC login.
    # Returns empty string when user logged in via email/password (no SSO).
    session[:entra_access_token] || ""
  end
end
