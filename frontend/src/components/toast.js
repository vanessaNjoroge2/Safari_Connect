let toastFn = null;

export function setToastHandler(handler) {
  toastFn = handler;
}

export function showToast(message, type = 'success') {
  if (toastFn) {
    toastFn(message, type);
  }
}
