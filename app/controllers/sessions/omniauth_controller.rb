class Sessions::OmniauthController < ApplicationController
  allow_unauthenticated_access only: %i[create failure]
  skip_before_action :verify_authenticity_token, only: :create

  def create
    auth = request.env["omniauth.auth"]
    unless auth
      redirect_to new_session_url, alert: "Authentication failed."
      return
    end

    email = (auth.info.email || "").downcase.strip
    if email.blank?
      redirect_to new_session_url, alert: "No email address in SSO response."
      return
    end

    user = User.active.find_by("LOWER(email_address) = ?", email)
    unless user
      redirect_to new_session_url, alert: "No account found for #{email}. Contact an administrator."
      return
    end

    start_new_session_for(user)

    # Store the API-scoped access token for the documents API (canvas-bot JWT validation).
    # OmniAuth provides the token via credentials.token when we request the api:// scope.
    if auth.credentials&.token.present?
      session[:entra_access_token] = auth.credentials.token
    end

    redirect_to post_authenticating_url
  end

  def failure
    message = params[:message] || "unknown error"
    redirect_to new_session_url, alert: "SSO failed: #{message}"
  end
end
