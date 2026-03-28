import { Controller } from "@hotwired/stimulus"
import { cable } from "@hotwired/turbo-rails"
import { ignoringBriefDisconnects } from "helpers/dom_helpers"

export default class extends Controller {
  static targets = [ "badge" ]

  async connect() {
    // Grab the panel and move it to body to escape #nav's stacking context
    this.panel = this.element.querySelector("[data-notification-panel]")
    if (this.panel) {
      document.body.appendChild(this.panel)
    }

    this.boundCloseOnClickOutside = this.closeOnClickOutside.bind(this)
    document.addEventListener("click", this.boundCloseOnClickOutside)

    this.channel ??= await cable.subscribeTo({ channel: "NotificationsChannel" }, {
      received: this.#received.bind(this)
    })
  }

  disconnect() {
    document.removeEventListener("click", this.boundCloseOnClickOutside)

    if (this.panel && this.panel.parentNode === document.body) {
      this.panel.remove()
    }

    ignoringBriefDisconnects(this.element, () => {
      this.channel?.unsubscribe()
      this.channel = null
    })
  }

  toggle(event) {
    event.stopPropagation()
    if (this.panel.classList.contains("notifications-dropdown--open")) {
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
    this.panel.innerHTML = html
    this.#positionPanel()
    this.panel.classList.add("notifications-dropdown--open")
  }

  #positionPanel() {
    const rect = this.element.getBoundingClientRect()
    this.panel.style.top = `${rect.bottom + 4}px`
    this.panel.style.right = `${window.innerWidth - rect.right}px`
  }

  close() {
    this.panel.classList.remove("notifications-dropdown--open")
  }

  closeOnClickOutside(event) {
    if (!this.element.contains(event.target) && !this.panel.contains(event.target)) {
      this.close()
    }
  }

  #received({ type, unread_count }) {
    if (type === "new_notification") {
      if (this.hasBadgeTarget) {
        this.badgeTarget.style.display = unread_count > 0 ? "" : "none"
      }
      if (this.panel.classList.contains("notifications-dropdown--open")) {
        this.open()
      }
    }
  }
}
