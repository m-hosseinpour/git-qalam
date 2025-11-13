import { Component, createSignal, createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { NotificationService } from '../components/Notification';
import TiptapEditor from './TiptapEditor';
import type { Note } from '../types';

interface NoteEditorProps {
  currentNote?: Note | null;
}

const NoteEditor: Component<NoteEditorProps> = (props) => {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [isSaving, setIsSaving] = createSignal(false);

  // Update local state when currentNote changes
  createEffect(() => {
    const note = props.currentNote;
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      // If no note is selected, show a default message
      setTitle('');
      setContent('# Select or Create a Note\n\nChoose an existing note from the list or create a new one to get started.');
    }
  });

  const saveNote = async () => {
    if (!props.currentNote) return;

    setIsSaving(true);
    try {
      const updatedNote: Note = {
        ...props.currentNote,
        title: title(),
        content: content(),
        updated_at: new Date().toISOString(),
      };

      await invoke('save_note', { note: updatedNote });
      NotificationService.show('Note saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save note:', error);
      NotificationService.show('Failed to save note. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save with debounce
  let debounceTimer: number;
  const debouncedSave = () => {
    if (!props.currentNote) return; // Don't save if no note is selected

    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      saveNote();
    }, 2000); // 2 second debounce
  };

  // Update content when editor changes
  const handleContentUpdate = (newContent: string) => {
    setContent(newContent);
    if (props.currentNote) {
      debouncedSave();
    }
  };

  return (
    <div class="note-editor">
      <div class="note-header">
        {props.currentNote ? (
          <>
            <input
              type="text"
              value={title()}
              onInput={(e) => {
                setTitle(e.currentTarget.value);
                if (props.currentNote) {
                  debouncedSave();
                }
              }}
              placeholder="Note title..."
              class="title-input"
            />
            <div class="note-actions">
              {isSaving() && <span class="spinner"></span>}
            </div>
          </>
        ) : (
          <h2>No Note Selected</h2>
        )}
      </div>

      <div class="note-content">
        {props.currentNote ? (
          <TiptapEditor
            content={content()}
            onUpdate={handleContentUpdate}
          />
        ) : (
          <div class="no-note-selected">
            <p>Select a note from the list to start editing, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;