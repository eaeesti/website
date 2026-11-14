"use client";

import { useState, type ReactNode } from "react";
import Modal, { type ModalData } from "./Modal";
import { useUiText } from "./UiText";

/**
 * An email address that copies itself when clicked and says so, instead of
 * a mailto: link, which often opens a mail app people don't use. The page
 * shows the address with "[ät]" in place of "@" (see Email.tsx); the
 * address itself is in the page's data, for the copy.
 */
export default function CopyEmail({
  address,
  className,
  children,
}: {
  address: string;
  className?: string;
  children: ReactNode;
}) {
  const texts = useUiText();
  const [open, setOpen] = useState(false);
  // Kept after closing, so the dialog doesn't go blank while it fades out.
  const [modal, setModal] = useState<ModalData>({ icon: "success", title: "" });

  async function copy() {
    try {
      await writeToClipboard(address);
      setModal({
        icon: "success",
        title: texts.emailCopied,
        description: address,
      });
    } catch {
      setModal({ icon: "error", title: texts.error, description: address });
    }
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {children}
      </button>
      <Modal
        open={open}
        data={modal}
        onClose={() => setOpen(false)}
        closeText={texts.close}
      />
    </>
  );
}

/**
 * Copies text with the Clipboard API, or, where that's refused (plain http,
 * some older browsers), with a selected text field and the copy command.
 */
async function writeToClipboard(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    // Fall through to the older way.
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copying isn't allowed");
}
