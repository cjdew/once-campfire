import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [ "body" ]
  static values = { key: String }

  connect() {
    if (localStorage.getItem(this.keyValue) === "true") {
      this.#collapse()
    }
  }

  toggle() {
    this.element.classList.toggle("sidebar__section--collapsed")
    this.#persist()
    this.#updateUnreadVisibility()
  }

  stopPropagation(event) {
    event.stopPropagation()
  }

  #collapse() {
    this.element.classList.add("sidebar__section--collapsed")
    this.#updateUnreadVisibility()
  }

  #updateUnreadVisibility() {
    const collapsed = this.element.classList.contains("sidebar__section--collapsed")
    if (!this.hasBodyTarget) return

    this.bodyTarget.querySelectorAll(".room, .direct, .sidebar__room-wrapper").forEach(el => {
      const link = el.querySelector(".unread") || (el.classList.contains("unread") ? el : null)
      if (collapsed) {
        el.style.display = link ? "" : "none"
      } else {
        el.style.display = ""
      }
    })
  }

  #persist() {
    const collapsed = this.element.classList.contains("sidebar__section--collapsed")
    localStorage.setItem(this.keyValue, collapsed)
  }
}
