import { useEffect, useRef } from "react";
import { useWidgetEditor } from "../hooks/useWidgetEditor";
import type { WidgetEditorProps } from "../types/widgetEditor";
import WidgetEditorActions from "./widget-editor/WidgetEditorActions";
import WidgetEditorFields from "./widget-editor/WidgetEditorFields";

export default function WidgetEditor({ services, widget, onSave, onClose }: WidgetEditorProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useWidgetEditor({ services, widget, onSave, onClose });

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="widget-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!editor.busy) onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(94vw,34rem)] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70"
    >
      <form onSubmit={editor.submit} className="p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 id="widget-editor-title" className="text-xl font-semibold">{widget ? "Edit widget" : "Add widget"}</h2>
            <p className="mt-1 text-sm text-slate-400">Configure the data and refresh interval for this instance.</p>
          </div>
          <button type="button" onClick={onClose} disabled={editor.busy} aria-label="Close widget editor"
            className="rounded-md border border-slate-700 px-2.5 py-1.5 text-sm hover:bg-slate-800 disabled:opacity-40">✕</button>
        </header>

        {editor.connectedServices.length === 0 ? (
          <p className="mt-6 text-sm text-slate-300">Connect at least one service before adding a widget.</p>
        ) : (
          <div className="mt-6 space-y-4">
            <WidgetEditorFields
              services={editor.connectedServices}
              selected={editor.selected}
              service={editor.service}
              type={editor.type}
              title={editor.title}
              config={editor.config}
              refreshSeconds={editor.refreshSeconds}
              busy={editor.busy}
              onChoose={editor.choose}
              onTitleChange={editor.setTitle}
              onConfigChange={editor.updateConfig}
              onRefreshChange={editor.setRefreshSeconds}
            />

            {editor.error && <p role="alert" className="rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-200">{editor.error}</p>}
            <WidgetEditorActions busy={editor.busy} canSave={Boolean(editor.selected)} onClose={onClose} />
          </div>
        )}
      </form>
    </dialog>
  );
}
