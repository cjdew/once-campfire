import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static classes = [ "collapsed" ]

  static values = {
    storageKey: { type: String, default: "campfire:sidebar-collapsed" }
  }

  connect() {
    if (localStorage.getItem(this.storageKeyValue) === "true") {
      this.element.classList.add(this.collapsedClass)
    }
  }

  toggle() {
    this.element.classList.toggle(this.collapsedClass)
    this.#persist()
  }

  expand() {
    this.element.classList.remove(this.collapsedClass)
    this.#persist()
  }

  expandBeforeNavigate(event) {
    if (this.element.classList.contains(this.collapsedClass)) {
      this.element.classList.remove(this.collapsedClass)
      localStorage.setItem(this.storageKeyValue, "false")
    }
  }

  #persist() {
    const collapsed = this.element.classList.contains(this.collapsedClass)
    localStorage.setItem(this.storageKeyValue, collapsed)
  }
}
