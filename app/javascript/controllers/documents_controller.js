import { Controller } from "@hotwired/stimulus"
import { marked } from "marked"
import DOMPurify from "dompurify"

export default class extends Controller {
  static targets = ["dropdown", "list", "titleInput", "submitBtn", "icon"]
  static values = { roomId: Number, apiBase: { type: String, default: "/api/bot" } }

  connect() {
    this.token = document.querySelector('meta[name="entra-token"]')?.content || ""
    this.userName = document.querySelector('meta[name="current-user-name"]')?.content || ""
    this.open = false
    // Preview sidebar lives outside the controller scope (in <body>)
    this.sidebar = document.getElementById("doc-sidebar")
    this.handleKeydown = (e) => { if (e.key === "Escape") { this.closePreview(); this.close() } }
    this.handleClickOutside = (e) => {
      if (this.open && !this.element.contains(e.target) && !this.sidebar?.contains(e.target)) this.close()
    }
    document.addEventListener("keydown", this.handleKeydown)
    document.addEventListener("click", this.handleClickOutside)
  }

  disconnect() {
    document.removeEventListener("keydown", this.handleKeydown)
    document.removeEventListener("click", this.handleClickOutside)
  }

  toggle() {
    this.open = !this.open
    this.dropdownTarget.classList.toggle("documents-dropdown--open", this.open)
    if (this.open) this.loadDocuments()
  }

  close() {
    this.open = false
    this.dropdownTarget.classList.remove("documents-dropdown--open")
  }

  async loadDocuments() {
    this.listTarget.innerHTML = '<div class="documents-loading">Loading...</div>'
    try {
      const resp = await this.apiFetch(`/rooms/${this.roomIdValue}/documents`)
      if (!resp.ok) {
        if (resp.status === 401) return this.handleAuthError()
        throw new Error(`${resp.status}`)
      }
      const data = await resp.json()
      this.renderList(data.documents)
      this.updateIcon(data.documents.length > 0)
    } catch (err) {
      this.listTarget.innerHTML = '<div class="documents-error">Couldn\'t load documents. Try again.</div>'
      console.error("Documents load error:", err)
    }
  }

  renderList(docs) {
    if (docs.length === 0) {
      this.listTarget.innerHTML = '<div class="documents-empty">No documents yet. Create the first one.</div>'
      return
    }
    this.listTarget.innerHTML = docs.map(doc => `
      <button class="documents-item" data-action="click->documents#openPreview"
              data-doc-id="${doc.id}" data-doc-url="${this.escapeAttr(doc.url)}"
              data-msg-id="${doc.campfireMsgId || ""}">
        <span class="documents-item__title">${this.escapeHtml(doc.title)}</span>
        <span class="documents-item__meta">${this.relativeTime(doc.updatedAt)}</span>
      </button>
    `).join("")
  }

  async openPreview(event) {
    const btn = event.currentTarget
    const docId = btn.dataset.docId
    const docUrl = btn.dataset.docUrl
    const msgId = btn.dataset.msgId

    this.close()
    if (!this.sidebar) return

    const titleEl = this.sidebar.querySelector(".doc-sidebar__title")
    const metaEl = this.sidebar.querySelector(".doc-sidebar__meta")
    const contentEl = this.sidebar.querySelector(".doc-sidebar__content")
    const actionsEl = this.sidebar.querySelector(".doc-sidebar__actions")

    this.sidebar.classList.add("doc-sidebar--open")
    contentEl.innerHTML = '<div class="documents-loading">Loading preview...</div>'

    try {
      const resp = await this.apiFetch(`/rooms/${this.roomIdValue}/documents/${docId}/preview`)
      if (!resp.ok) throw new Error(`${resp.status}`)

      const { document } = await resp.json()
      titleEl.textContent = document.title
      metaEl.textContent = [
        document.updatedBy ? `Last edited by ${document.updatedBy}` : "",
        document.updatedAt ? this.relativeTime(document.updatedAt) : "",
      ].filter(Boolean).join(", ")

      const rawHtml = marked.parse(document.text || "")
      contentEl.innerHTML = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ["h1","h2","h3","h4","h5","h6","p","a","ul","ol","li",
                       "code","pre","blockquote","em","strong","img","table",
                       "thead","tbody","tr","th","td","br","hr"],
        ALLOWED_ATTR: ["href","src","alt","title"],
        ALLOW_DATA_ATTR: false,
      })

      if (document.truncated) {
        contentEl.innerHTML += `<p class="documents-truncated"><a href="${this.escapeAttr(docUrl)}" target="_blank">Continue reading in Outline &rarr;</a></p>`
      }

      actionsEl.innerHTML = `
        <a href="${this.escapeAttr(docUrl)}" target="_blank" class="btn btn--reversed documents-btn">Open in Outline</a>
        ${msgId ? `<button class="btn documents-btn" onclick="document.getElementById('message_${msgId}')?.scrollIntoView({behavior:'smooth',block:'center'});this.closest('.doc-sidebar').classList.remove('doc-sidebar--open')">Go to message</button>` : ""}
      `
    } catch (err) {
      contentEl.innerHTML = '<div class="documents-error">Couldn\'t load preview.</div>'
      console.error("Preview error:", err)
    }
  }

  closePreview() {
    this.sidebar?.classList.remove("doc-sidebar--open")
  }

  showCreateForm() {
    this.titleInputTarget.closest(".documents-dropdown__footer").classList.add("documents-create--open")
    this.titleInputTarget.focus()
  }

  onTitleInput() {
    this.submitBtnTarget.disabled = !this.titleInputTarget.value.trim()
  }

  async createDocument(event) {
    event.preventDefault()
    const title = this.titleInputTarget.value.trim()
    if (!title) return
    this.titleInputTarget.disabled = true
    this.submitBtnTarget.disabled = true
    this.submitBtnTarget.textContent = "Creating..."
    try {
      const resp = await this.apiFetch(`/rooms/${this.roomIdValue}/documents`, {
        method: "POST",
        body: JSON.stringify({ title }),
      })
      if (!resp.ok) {
        if (resp.status === 401) return this.handleAuthError()
        throw new Error(`${resp.status}`)
      }
      this.showToast(`"${title}" created`)
      this.titleInputTarget.value = ""
      this.submitBtnTarget.disabled = true
      this.titleInputTarget.closest(".documents-dropdown__footer").classList.remove("documents-create--open")
      this.loadDocuments()
    } catch (err) {
      this.showToast("Failed to create document", true)
      console.error("Create document error:", err)
    } finally {
      this.titleInputTarget.disabled = false
      this.submitBtnTarget.textContent = "Create"
    }
  }

  showToast(message, isError = false) {
    const existing = document.getElementById("doc-toast")
    if (existing) existing.remove()
    const toast = document.createElement("div")
    toast.id = "doc-toast"
    toast.className = `doc-toast ${isError ? "doc-toast--error" : "doc-toast--success"}`
    toast.textContent = message
    document.body.appendChild(toast)
    requestAnimationFrame(() => toast.classList.add("doc-toast--visible"))
    setTimeout(() => {
      toast.classList.remove("doc-toast--visible")
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }

  scrollToMessage(event) {
    const msgId = event.currentTarget.dataset.msgId
    if (!msgId) return
    const msgEl = document.getElementById(`message_${msgId}`)
    if (msgEl) {
      msgEl.scrollIntoView({ behavior: "smooth", block: "center" })
      msgEl.classList.add("message--highlighted")
      setTimeout(() => msgEl.classList.remove("message--highlighted"), 2000)
    }
    this.closePreview()
  }

  async apiFetch(path, opts = {}) {
    return fetch(`${this.apiBaseValue}${path}`, {
      headers: {
        "Content-Type": "application/json",
        "x-auth-token": this.token,
        "x-user-name": this.userName,
        ...opts.headers,
      },
      ...opts,
    })
  }

  handleAuthError() {
    if (confirm("Your session has expired. Reload the page?")) window.location.reload()
  }

  updateIcon(hasDocs) {
    if (this.hasIconTarget) this.iconTarget.classList.toggle("documents-icon--active", hasDocs)
  }

  escapeHtml(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }

  escapeAttr(str) {
    return (str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
  }

  relativeTime(isoStr) {
    if (!isoStr) return ""
    const diff = Date.now() - new Date(isoStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }
}
