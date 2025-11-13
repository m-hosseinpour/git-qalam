import { Component, createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/extension-bubble-menu';
import { FloatingMenu } from '@tiptap/extension-floating-menu';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { CodeBlock } from '@tiptap/extension-code-block';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import { renderMermaid } from './mermaid-renderer';
import { renderMath } from './math-renderer';

// Define the NoteEditor component
const TiptapEditor: Component<{
  content: string;
  onUpdate: (content: string) => void;
}> = (props) => {
  const [editor, setEditor] = createSignal<Editor | null>(null);
  const [previewHtml, setPreviewHtml] = createSignal<string>('');

  const lowlight = createLowlight(common);

  onMount(() => {
    const tiptapEditor = new Editor({
      content: props.content,
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Write your note here...',
        }),
        CodeBlock,
        CodeBlockLowlight.configure({
          lowlight,
        }),
        // Custom extensions for mermaid and math
        renderMermaid(),
        renderMath(),
        Markdown.configure({
          html: false, // Disable HTML tags
          transformPastedText: true,
          transformCopiedText: true,
        })
      ],
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        props.onUpdate(html);
        setPreviewHtml(html);
      },
    });

    setEditor(tiptapEditor);
    setPreviewHtml(tiptapEditor.getHTML());
  });

  // Clean up editor on unmount
  onCleanup(() => {
    const ed = editor();
    if (ed) {
      ed.destroy();
    }
  });

  // Update editor content when props change
  createEffect(() => {
    const ed = editor();
    if (ed && ed.getHTML() !== props.content) {
      ed.commands.setContent(props.content, false);
    }
  });

  return (
    <div class="editor-container">
      <div class="editor-section">
        <h3>Editor</h3>
        <div class="tiptap-container">
          <div ref={(ref) => {
            if (editor() && ref && !ref.firstChild) {
              ref.appendChild(editor()!.view.dom);
            }
          }} class="tiptap-editor" />

          {editor() && (
            <>
              <BubbleMenu editor={editor()!} tippyOptions={{ duration: 100 }}>
                <button
                  onClick={() => editor()?.chain().focus().toggleBold().run()}
                  class={editor()?.isActive('bold') ? 'is-active' : ''}
                >
                  Bold
                </button>
                <button
                  onClick={() => editor()?.chain().focus().toggleItalic().run()}
                  class={editor()?.isActive('italic') ? 'is-active' : ''}
                >
                  Italic
                </button>
                <button
                  onClick={() => editor()?.chain().focus().toggleStrike().run()}
                  class={editor()?.isActive('strike') ? 'is-active' : ''}
                >
                  Strike
                </button>
              </BubbleMenu>

              <FloatingMenu editor={editor()!} tippyOptions={{ duration: 100 }}>
                <button
                  onClick={() => editor()?.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  H1
                </button>
                <button
                  onClick={() => editor()?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  H2
                </button>
                <button
                  onClick={() => editor()?.chain().focus().toggleBulletList().run()}
                >
                  Bullet List
                </button>
              </FloatingMenu>
            </>
          )}
        </div>
      </div>

      <div class="preview-section">
        <h3>Preview</h3>
        <div
          class="preview-content"
          innerHTML={previewHtml()}
        />
      </div>
    </div>
  );
};

export default TiptapEditor;