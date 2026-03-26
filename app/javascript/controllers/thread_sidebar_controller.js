import { Controller } from "@hotwired/stimulus"

// Manages the thread sidebar panel: open, close, fetch content, keyboard shortcuts
export default class extends Controller {
  static targets = ["panel", "replies"]
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

  get panel() {
    return this.hasPanelTarget ? this.panelTarget : this.element
  }

  async open({ params: { messageId } }) {
    if (!messageId) return

    this.panel.classList.add("thread-sidebar--open")
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
        this.panel.innerHTML = await response.text()
        this.formatMessages()
        this.observeNewReplies()
        this.scrollToBottom()
      }
    } catch (error) {
      console.error("Failed to load thread:", error)
    }
  }

  close() {
    if (this._observer) { this._observer.disconnect(); this._observer = null }
    this.panel.classList.remove("thread-sidebar--open")
    this.currentMessageId = null

    // Remove thread param from URL
    const url = new URL(window.location)
    url.searchParams.delete("thread")
    url.searchParams.delete("highlight")
    history.replaceState(null, "", url)

    // Clear content after animation
    setTimeout(() => {
      if (!this.panel.classList.contains("thread-sidebar--open")) {
        this.panel.innerHTML = ""
      }
    }, 300)
  }

  handleKeydown(event) {
    if (event.key === "Escape" && this.panel.classList.contains("thread-sidebar--open")) {
      this.close()
    }
  }

  scrollToBottom() {
    const replies = this.panel.querySelector(".thread-sidebar__replies")
    if (replies) {
      replies.scrollTop = replies.scrollHeight
    }

    // Highlight a specific reply if requested
    const params = new URLSearchParams(window.location.search)
    const highlightId = params.get("highlight")
    if (highlightId) {
      const target = this.panel.querySelector(`#message_${highlightId}`)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" })
        target.classList.add("message--highlighted")
      }
    }
  }

  observeNewReplies() {
    if (this._observer) this._observer.disconnect()
    const repliesContainer = this.panel.querySelector(".thread-sidebar__replies")
    if (!repliesContainer) return

    this._observer = new MutationObserver(() => {
      this.formatMessages()
      this.scrollToBottom()
    })
    this._observer.observe(repliesContainer, { childList: true })
  }

  formatMessages() {
    const userId = document.querySelector('meta[name="current-user-id"]')?.content
    this.panel.querySelectorAll(".message").forEach(msg => {
      msg.classList.add("message--formatted")
      if (userId && msg.dataset.userId == userId) {
        msg.classList.add("message--me")
      }
    })
  }

  // Called when thread composer form submits
  submitReply(event) {
    // Only submit on Enter without Shift
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const form = this.panel.querySelector(".thread-composer")
      if (form) form.requestSubmit()
    }
  }
}
