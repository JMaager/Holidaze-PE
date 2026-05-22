import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children?: ReactNode;
  actions?: ReactNode;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  actions,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ) ?? dialogRef.current;

    focusTarget?.focus();

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:max-h-[80vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <h4 id={titleId} className="text-lg font-semibold text-gray-900">
          {title}
        </h4>
        {description && (
          <p id={descriptionId} className="mt-2 text-sm text-gray-600">
            {description}
          </p>
        )}

        {children}

        <div className="mt-5 flex justify-end gap-2">{actions}</div>
      </div>

      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="sr-only"
      >
        Close
      </button>
    </div>
  );
}
