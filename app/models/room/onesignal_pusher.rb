class Room::OnesignalPusher
  ONESIGNAL_API_URL = "https://api.onesignal.com/notifications".freeze

  attr_reader :room, :message

  def initialize(room:, message:)
    @room = room
    @message = message
  end

  def push
    return unless self.class.enabled?

    emails = recipient_emails
    return if emails.empty?

    payload = build_payload(emails)
    send_notification(payload)
  end

  def self.enabled?
    ENV["ONESIGNAL_APP_ID"].present? && ENV["ONESIGNAL_API_KEY"].present?
  end

  private

  def recipient_emails
    room.memberships
      .visible
      .disconnected
      .involved_in_everything
      .where.not(user: message.creator)
      .joins(:user)
      .pluck("users.email_address")
      .map(&:downcase)
  end

  def build_payload(emails)
    title, body = if room.direct?
      [message.creator.name, message.plain_text_body]
    else
      [room.name, "#{message.creator.name}: #{message.plain_text_body}"]
    end

    {
      app_id: ENV["ONESIGNAL_APP_ID"],
      include_aliases: { external_id: emails },
      target_channel: "push",
      headings: { en: title },
      contents: { en: body.truncate(200) },
      url: "https://#{ENV.fetch('CAMPFIRE_DOMAIN', 'localhost:3000')}#{Rails.application.routes.url_helpers.room_path(room)}"
    }
  end

  def send_notification(payload)
    uri = URI(ONESIGNAL_API_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["Authorization"] = "Key #{ENV['ONESIGNAL_API_KEY']}"
    request.body = payload.to_json

    response = http.request(request)
    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.warn "[OneSignal] Push failed (#{response.code}): #{response.body}"
    end
  rescue => e
    Rails.logger.warn "[OneSignal] Push error: #{e.message}"
  end
end
