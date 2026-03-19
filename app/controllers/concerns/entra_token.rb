module EntraToken
  extend ActiveSupport::Concern

  included do
    helper_method :current_user_entra_token
  end

  private

  def current_user_entra_token
    # TODO: Replace with real token extraction when OIDC is configured.
    # Real implementation will read from session[:entra_access_token]
    # populated by the OmniAuth OIDC callback.
    session[:entra_access_token] || ""
  end
end
