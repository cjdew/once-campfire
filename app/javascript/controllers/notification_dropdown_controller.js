import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "panel", "badge" ]

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
}
