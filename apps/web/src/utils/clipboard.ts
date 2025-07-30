/**
 * Fallback for HTTP contexts where `navigator.clipboard` is not available.
 */
const copyToClipboardFallback = (text: string) => {
  let textArea;
  try {
    textArea = document.createElement("textarea");
    textArea.setAttribute("aria-hidden", "true");
    textArea.style.opacity = "0";
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.readOnly = true;
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand("copy");
  } finally {
    textArea?.remove();
  }
};

export const copyToClipboard = async (text: string) => {
  if (typeof navigator.clipboard?.writeText === "function") {
    return navigator.clipboard.writeText(text);
  }
  return copyToClipboardFallback(text);
};
