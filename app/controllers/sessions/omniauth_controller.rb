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
      # Auto-create account if arriving via a valid invite link
      origin = request.env["omniauth.origin"].to_s
      join_code = origin[%r{/join/([^/?]+)}, 1]

      if join_code.present? && Current.account.join_code == join_code
        name = auth.info.name.presence || email.split("@").first
        user = User.create!(name: name, email_address: email, password: SecureRandom.hex(32))
      else
        redirect_to new_session_url, alert: "No account found for #{email}. Contact an administrator."
        return
      end
    end

    start_new_session_for(user)
    redirect_to post_authenticating_url
  end

  def failure
    message = params[:message] || "unknown error"
    redirect_to new_session_url, alert: "SSO failed: #{message}"
  end
end
