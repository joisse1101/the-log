declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Tell React that act() is in use, so it flushes client renders inside act.
globalThis.IS_REACT_ACT_ENVIRONMENT = true

export {}
