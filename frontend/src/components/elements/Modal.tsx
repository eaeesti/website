"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { classes } from "@/utils/react";
import { buttonClasses } from "./Button";

export interface ModalData {
  title: string;
  description?: string;
  icon: "success" | "error";
}

const ICONS = {
  success: { Icon: CheckIcon, className: "bg-green-100 text-green-600" },
  error: { Icon: XMarkIcon, className: "bg-red-100 text-red-600" },
};

/** A small confirmation dialog with one close button (from Anneta Targalt). */
export default function Modal({
  open,
  data,
  onClose,
  closeText,
}: {
  open: boolean;
  data: ModalData;
  onClose: () => void;
  closeText: string;
}) {
  const { Icon, className } = ICONS[data.icon];
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-500/75 transition duration-300 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex min-h-full items-end justify-center p-4 sm:items-center">
        <DialogPanel
          transition
          className="w-full max-w-sm rounded-lg bg-white px-4 pt-5 pb-4 text-center shadow-xl transition duration-300 data-closed:translate-y-4 data-closed:opacity-0 sm:p-6 sm:data-closed:translate-y-0 sm:data-closed:scale-95"
        >
          <div
            className={classes(
              "mx-auto mb-3 flex size-12 items-center justify-center rounded-full",
              className,
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle
            as="h3"
            className="text-base font-semibold text-slate-900"
          >
            {data.title}
          </DialogTitle>
          {data.description && (
            <p className="mt-2 text-sm text-slate-500">{data.description}</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className={buttonClasses("primary", "md", "mt-5 w-full sm:mt-6")}
          >
            {closeText}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
