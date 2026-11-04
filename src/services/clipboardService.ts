export type CopyResult = "copied" | "failed";

async function writeWithClipboardApi(text: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return false;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function copyTextToClipboard(text: string): Promise<CopyResult> {
  if (await writeWithClipboardApi(text)) return "copied";

  try {
    if (typeof document === "undefined") return "failed";
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok ? "copied" : "failed";
  } catch {
    return "failed";
  }
}
