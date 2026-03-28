import { Controller } from "@hotwired/stimulus"
import { cable } from "@hotwired/turbo-rails"
import { ignoringBriefDisconnects } from "helpers/dom_helpers"

export default class extends Controller {
  static targets = [ "room" ]
  static classes = [ "unread" ]

  #disconnected = true

  async connect() {
    this.channel ??= await cable.subscribeTo({ channel: "UnreadRoomsChannel" }, {
      connected: this.#channelConnected.bind(this),
      disconnected: this.#channelDisconnected.bind(this),
      received: this.#unread.bind(this)
    })
  }

  disconnect() {
    ignoringBriefDisconnects(this.element, () => {
      this.channel?.unsubscribe()
      this.channel = null
    })
  }

  loaded() {
    this.read({ detail: { roomId: Current.room.id } })
  }

  read({ detail: { roomId } }) {
    const room = this.#findRoomTarget(roomId)

    if (room) {
      room.classList.remove(this.unreadClass)
      this.#updatePill(room, 0)
      this.dispatch("read", { detail: { targetId: roomId } })
    }
  }

  #channelConnected() {
    if (this.#disconnected) {
      this.#disconnected = false
      this.element.reload()
    }
  }

  #channelDisconnected() {
    this.#disconnected = true
  }

  #unread({ roomId, count }) {
    const unreadRoom = this.#findRoomTarget(roomId)

    if (unreadRoom) {
      if (Current.room.id != roomId) {
        unreadRoom.classList.add(this.unreadClass)
        if (count !== undefined) {
          this.#updatePill(unreadRoom, count)
        }
      }

      this.dispatch("unread", { detail: { targetId: unreadRoom.id } })
    }
  }

  #updatePill(roomElement, count) {
    let pill = roomElement.querySelector("[data-unread-pill]")

    if (count > 0) {
      const display = count > 99 ? "99+" : count
      if (pill) {
        pill.textContent = display
      } else {
        pill = document.createElement("span")
        pill.setAttribute("data-unread-pill", "")
        pill.className = "unread-pill"
        pill.textContent = display
        // Insert pill inside the room link, after the text
        const link = roomElement.querySelector("a")
        if (link) link.appendChild(pill)
      }
    } else if (pill) {
      pill.remove()
    }
  }

  #findRoomTarget(roomId) {
    return this.roomTargets.find(roomTarget => roomTarget.dataset.roomId == roomId)
  }
}
