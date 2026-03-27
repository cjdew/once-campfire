import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { favorited: Boolean }

  connect() {
    this.element.addEventListener("contextmenu", this.#showMenu)
  }

  disconnect() {
    this.element.removeEventListener("contextmenu", this.#showMenu)
    this.#removeMenu()
  }

  #showMenu = (event) => {
    event.preventDefault()
    this.#removeMenu()

    const menu = document.createElement("div")
    menu.classList.add("sidebar__context-menu", "border", "shadow", "border-radius")
    menu.style.position = "fixed"
    menu.style.left = `${event.clientX}px`
    menu.style.top = `${event.clientY}px`
    menu.style.zIndex = "100"

    const label = this.favoritedValue ? "Unfavorite" : "Favorite"
    const icon = this.favoritedValue ? "&#9733;" : "&#9734;"

    menu.innerHTML = `<button class="btn sidebar__context-menu-item">${icon} ${label}</button>`
    menu.querySelector("button").addEventListener("click", () => {
      this.#removeMenu()
      this.element.querySelector("[data-action*='favorite#toggle']")?.click()
    })

    document.body.appendChild(menu)
    this._menu = menu

    this._closeHandler = (e) => {
      if (!menu.contains(e.target)) this.#removeMenu()
    }
    this._escHandler = (e) => {
      if (e.key === "Escape") this.#removeMenu()
    }

    setTimeout(() => {
      document.addEventListener("click", this._closeHandler)
      document.addEventListener("keydown", this._escHandler)
    }, 0)
  }

  #removeMenu() {
    if (this._menu) {
      this._menu.remove()
      this._menu = null
      document.removeEventListener("click", this._closeHandler)
      document.removeEventListener("keydown", this._escHandler)
    }
  }
}
