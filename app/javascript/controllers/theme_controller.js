import { Controller } from "@hotwired/stimulus"

// Three-way theme toggle: Light / Dark / System
// Persists choice to localStorage, sets data-theme on <html>
export default class extends Controller {
  static targets = ["lightBtn", "darkBtn", "systemBtn"]
  static values = { current: { type: String, default: "system" } }

  connect() {
    this.currentValue = localStorage.getItem("campfire:theme") || "system"
    this.apply()

    this.turboLoadHandler = () => this.apply()
    document.addEventListener("turbo:load", this.turboLoadHandler)

    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    this.mediaHandler = () => { if (this.currentValue === "system") this.updateMeta() }
    this.mediaQuery.addEventListener("change", this.mediaHandler)
  }

  disconnect() {
    document.removeEventListener("turbo:load", this.turboLoadHandler)
    this.mediaQuery.removeEventListener("change", this.mediaHandler)
  }

  select(event) {
    this.currentValue = event.params.theme
    localStorage.setItem("campfire:theme", this.currentValue)
    this.apply()
  }

  apply() {
    const html = document.documentElement
    if (this.currentValue === "light" || this.currentValue === "dark") {
      html.setAttribute("data-theme", this.currentValue)
    } else {
      html.removeAttribute("data-theme")
    }
    this.updateMeta()
    this.updateButtons()
  }

  updateMeta() {
    const isDark = this.currentValue === "dark" ||
      (this.currentValue === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute("content", isDark ? "#0b1326" : "#f8fafb")
  }

  updateButtons() {
    const buttons = {
      light: this.hasLightBtnTarget ? this.lightBtnTarget : null,
      dark: this.hasDarkBtnTarget ? this.darkBtnTarget : null,
      system: this.hasSystemBtnTarget ? this.systemBtnTarget : null,
    }
    for (const [theme, btn] of Object.entries(buttons)) {
      if (!btn) continue
      const isActive = this.currentValue === theme
      btn.setAttribute("aria-checked", isActive)
      btn.classList.toggle("theme-toggle--active", isActive)
    }
  }
}
