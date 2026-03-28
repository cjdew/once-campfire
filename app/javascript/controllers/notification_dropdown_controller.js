import { Controller } from "@hotwired/stimulus"
import { cable } from "@hotwired/turbo-rails"
import { ignoringBriefDisconnects } from "helpers/dom_helpers"

export default class extends Controller {
  static targets = [ "panel", "badge" ]

  async connect() {
    this.channel ??= await cable.subscribeTo({ channel: "NotificationsChannel" }, {
      received: this.#received.bind(this)
    })
  }

  disconnect() {
    ignoringBriefDisconnects(this.element, () => {
      this.channel?.unsubscribe()
      this.channel = null
    })
  }

  toggle() {
    if (this.panelTarget.classList.contains("notifications-dropdown--open")) {
      this.close()
    } else {
      this.open()
    }
  }

  async open() {
    const response = await fetch("/notifications", {
      headers: { "Accept": "text/html" }
    })
    const html = await response.text()
    this.panelTarget.innerHTML = html
    this.panelTarget.classList.add("notifications-dropdown--open")
  }

  close() {
    this.panelTarget.classList.remove("notifications-dropdown--open")
  }

  closeOnClickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.close()
    }
  }

  #received({ type, unread_count }) {
    if (type === "new_notification") {
      // Update badge visibility
      if (this.hasBadgeTarget) {
        this.badgeTarget.style.display = unread_count > 0 ? "" : "none"
      }
      // If dropdown is open, refresh it
      if (this.panelTarget.classList.contains("notifications-dropdown--open")) {
        this.open()
      }
    }
  }
}
