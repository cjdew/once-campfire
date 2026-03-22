import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { url: String }

  async toggle(event) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.urlValue) return

    const token = document.querySelector('meta[name="csrf-token"]')?.content

    const response = await fetch(this.urlValue, {
      method: "PATCH",
      headers: {
        "Accept": "text/vnd.turbo-stream.html",
        "X-CSRF-Token": token
      }
    })

    if (response.ok) {
      const html = await response.text()
      Turbo.renderStreamMessage(html)
    }
  }
}
