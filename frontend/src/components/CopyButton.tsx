"use client";

import { useState } from "react";
import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

interface CopyButtonProps {
  text: string;
  ariaLabel?: string;
}

export function CopyButton({ text, ariaLabel }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      toast.error("Copy failed; please try again.");
    }
  };

  const Icon = copied ? ClipboardDocumentCheckIcon : ClipboardDocumentIcon;

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={ariaLabel ?? "Copy"}
      className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100"
    >
      <Icon className="mr-1 h-4 w-4" />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
