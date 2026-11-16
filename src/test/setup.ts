declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Tell React that act() is in use, so it flushes client renders inside act.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// jsdom has no showModal or close on <dialog>, so give it the part of the behaviour the tests need.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.removeAttribute('open')
}

export {}
