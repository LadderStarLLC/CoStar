'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Loader2, Send } from 'lucide-react';
import { useState, FormEvent, useRef } from 'react';

interface RichTextEditorProps {
  onSend: (content: string, previewText: string) => void | Promise<void>;
  disabled?: boolean;
}

export default function RichTextEditor({ onSend, disabled }: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitMessageRef = useRef<() => void>();

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[28px] max-h-28 overflow-y-auto px-3 py-2 text-sm leading-5 text-slate-100 placeholder:text-slate-500 [&_*]:!my-0 [&_*]:!text-slate-100',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          if (submitMessageRef.current) {
            submitMessageRef.current();
          }
          return true;
        }
        return false;
      }
    },
  });

  const submitMessage = async () => {
    if (!editor || editor.isEmpty || disabled || isSubmitting) return;

    const draft = editor.getJSON();
    const content = JSON.stringify(draft);
    const previewText = editor.getText().slice(0, 100);

    setIsSubmitting(true);
    editor.commands.clearContent();
    try {
      await onSend(content, previewText);
    } catch (error) {
      editor.commands.setContent(draft);
    } finally {
      setIsSubmitting(false);
    }
  };

  submitMessageRef.current = submitMessage;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submitMessage();
  };

  if (!editor) {
    return <div className="h-11 animate-pulse rounded-full border border-white/10 bg-slate-800/50" />;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-end gap-2 rounded-2xl border bg-slate-800/80 px-2 py-1.5 transition-colors ${isFocused ? 'border-amber-500/50' : 'border-white/10'}`}
    >
      <div className="min-w-0 flex-1 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} disabled={disabled} />
      </div>
      <button
        type="submit"
        disabled={disabled || isSubmitting || editor.isEmpty}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-slate-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
        title="Send"
        aria-label="Send message"
      >
        {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      </button>
    </form>
  );
}
