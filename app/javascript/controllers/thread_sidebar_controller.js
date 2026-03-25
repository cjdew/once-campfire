import { Controller } from "@hotwired/stimulus"

// Manages the thread sidebar panel: open, close, fetch content, keyboard shortcuts
export default class extends Controller {
  static targets = ["replies"]
  static values = { roomId: Number }

  connect() {
    this.handleKeydown = this.handleKeydown.bind(this)
    document.addEventListener("keydown", this.handleKeydown)

    // Auto-open thread from URL param
    const params = new URLSearchParams(window.location.search)
    const threadId = params.get("thread")
    if (threadId) {
      this.open({ params: { messageId: threadId } })
    }
  }

  disconnect() {
    document.removeEventListener("keydown", this.handleKeydown)
  }

  async open({ params: { messageId } }) {
    if (!messageId) return

    this.element.classList.add("thread-sidebar--open")
    this.currentMessageId = messageId

    // Update URL
    const url = new URL(window.location)
    url.searchParams.set("thread", messageId)
    history.replaceState(null, "", url)

    // Fetch thread content
    try {
      const response = await fetch(`/rooms/${this.roomIdValue}/messages/${messageId}/thread`, {
        headers: {
          "Accept": "text/html",
          "X-Requested-With": "XMLHttpRequest"
        }
      })
      if (response.ok) {
        this.element.innerHTML = await response.text()
        this.scrollToBottom()
      }
    } catch (error) {
      console.error("Failed to load thread:", error)
    }
  }

  close() {
    this.element.classList.remove("thread-sidebar--open")
    this.currentMessageId = null

    // Remove thread param from URL
    const url = new URL(window.location)
    url.searchParams.delete("thread")
    url.searchParams.delete("highlight")
    history.replaceState(null, "", url)

    // Clear content after animation
    setTimeout(() => {
      if (!this.element.classList.contains("thread-sidebar--open")) {
        this.element.innerHTML = ""
      }
    }, 300)
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.element.classList.contains("thread-sidebar--open")) {
      this.close()
    }
  }

  scrollToBottom() {
    const replies = this.element.querySelector(".thread-sidebar__replies")
    if (replies) {
      replies.scrollTop = replies.scrollHeight
    }

    // Highlight a specific reply if requested
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get("highlight")
    if (highlightId) {
      const target = this.element.querySelector(`#message_${highlightId}`)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" })
        target.classList.add("message--highlighted")
      }
    }
  }

  // Called when thread composer form submits
  submitReply(event) {
    // Only submit on Enter without Shift
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const form = this.element.querySelector(".thread-composer")
      if (form) form.requestSubmit()
    }
  }
}
