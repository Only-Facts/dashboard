interface WidgetEditorActionsProps {
  busy: boolean;
  canSave: boolean;
  onClose: () => void;
}

export default function WidgetEditorActions({ busy, canSave, onClose }: WidgetEditorActionsProps) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
      <button type="button" onClick={onClose} disabled={busy}
        className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-40">
        Cancel
      </button>
      <button type="submit" disabled={busy || !canSave}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40">
        {busy ? "Saving…" : "Save widget"}
      </button>
    </div>
  );
}
