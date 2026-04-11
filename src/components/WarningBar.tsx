"use client";

interface Props {
  message: string;
  action?: string;
  onAction?: () => void;
}

export default function WarningBar({ message, action, onAction }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2 bg-warning/10 border border-warning/30 text-warning text-sm">
      <span>{message}</span>
      {action && onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1 rounded bg-warning/20 hover:bg-warning/30 text-warning text-xs font-semibold transition-colors cursor-pointer"
        >
          {action}
        </button>
      )}
    </div>
  );
}
