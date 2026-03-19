# Entra ID (Azure AD) OIDC configuration for SSO.
# Requires OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET env vars.
# When these are unset, OmniAuth is not configured and the SSO button is hidden.

if ENV["OIDC_CLIENT_ID"].present? && ENV["OIDC_CLIENT_SECRET"].present?
  Rails.application.config.middleware.use OmniAuth::Builder do
    provider :openid_connect,
      name: :entra_id,
      scope: %i[openid profile email],
      response_type: :code,
      issuer: ENV.fetch("OIDC_ISSUER", "https://login.microsoftonline.com/#{ENV['ENTRA_TENANT_ID'] || 'common'}/v2.0"),
      discovery: true,
      client_options: {
        identifier: ENV["OIDC_CLIENT_ID"],
        secret: ENV["OIDC_CLIENT_SECRET"],
        redirect_uri: ENV.fetch("CAMPFIRE_OIDC_REDIRECT_URI", "https://#{ENV.fetch('CAMPFIRE_DOMAIN', 'localhost:3000')}/auth/oidc/callback"),
        scheme: ENV.fetch("CAMPFIRE_DOMAIN", nil) ? "https" : "http",
        host: ENV.fetch("CAMPFIRE_DOMAIN", "localhost"),
        port: ENV.fetch("CAMPFIRE_DOMAIN", nil) ? 443 : 3000
      },
      # Request an access token scoped to our API (for canvas-bot JWT validation)
      extra_authorize_params: {
        scope: "openid profile email api://#{ENV['OIDC_CLIENT_ID']}/access_as_user"
      }
  end

  OmniAuth.config.allowed_request_methods = [:post]
  OmniAuth.config.silence_get_warning = true
end
