import { Controller } from "@hotwired/stimulus"

// Opens the message actions <details> on hover (desktop only).
// Attaches mouseenter/mouseleave to the parent .message element
// so the toolbar appears when hovering anywhere on the message row.
export default class extends Controller {
  static targets = [ "details" ]

  connect() {
    this.supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    if (!this.supportsHover) return

    this.messageEl = this.element.closest(".message")
    if (!this.messageEl) return

    this._open = this.open.bind(this)
    this._close = this.close.bind(this)
    this.messageEl.addEventListener("mouseenter", this._open)
    this.messageEl.addEventListener("mouseleave", this._close)
  }

  disconnect() {
    if (this.messageEl) {
      this.messageEl.removeEventListener("mouseenter", this._open)
      this.messageEl.removeEventListener("mouseleave", this._close)
    }
  }

  open() {
    if (this.hasDetailsTarget) {
      this.detailsTarget.open = true
    }
  }

  close() {
    if (this.hasDetailsTarget) {
      this.detailsTarget.open = false
    }
  }
}
