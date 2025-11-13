import { Component, createSignal, createEffect, onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { NotificationService } from '../components/Notification';
import type { Note } from '../types';

interface NoteListProps {
  onSelectNote: (note: Note) => void;
  currentNoteId?: string;
}

const NoteList: Component<NoteListProps> = (props) => {
  const [notes, setNotes] = createSignal<Note[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [newNoteTitle, setNewNoteTitle] = createSignal('');
  const [searchQuery, setSearchQuery] = createSignal('');

  onMount(async () => {
    await loadNotes();
  });

  // Reload notes when needed
  createEffect(async () => {
    await loadNotes();
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      const noteList: Note[] = await invoke('list_notes');
      setNotes(noteList);
    } catch (error) {
      console.error('Failed to load notes:', error);
      NotificationService.show('Failed to load notes. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createNewNote = async () => {
    if (!newNoteTitle().trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle(),
      content: '# New Note\n\nStart writing your note here...',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await invoke('save_note', { note: newNote });
      setNotes([newNote, ...notes()]); // Add to the top of the list
      setNewNoteTitle('');
      props.onSelectNote(newNote); // Select the new note
      NotificationService.show('Note created successfully', 'success');
    } catch (error) {
      console.error('Failed to create note:', error);
      NotificationService.show('Failed to create note. Please try again.', 'error');
    }
  };

  const deleteNote = async (noteId: string, e: Event) => {
    e.stopPropagation(); // Prevent selecting the note when deleting

    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await invoke('delete_note', { noteId });
        setNotes(notes().filter(note => note.id !== noteId));

        // If the deleted note was the current one, select another
        if (props.currentNoteId === noteId && notes().length > 1) {
          const otherNote = notes().find(note => note.id !== noteId);
          if (otherNote) {
            props.onSelectNote(otherNote);
          }
        }
        NotificationService.show('Note deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete note:', error);
        NotificationService.show('Failed to delete note. Please try again.', 'error');
      }
    }
  };

  // Filter notes based on search query
  const filteredNotes = () => {
    if (!searchQuery()) return notes();

    return notes().filter(note =>
      note.title.toLowerCase().includes(searchQuery().toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery().toLowerCase())
    );
  };

  return (
    <div class="note-list">
      <h2>Notes</h2>

      <div class="new-note-form">
        <input
          type="text"
          value={newNoteTitle()}
          onInput={(e) => setNewNoteTitle(e.currentTarget.value)}
          placeholder="New note title..."
          class="input-field"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              createNewNote();
            }
          }}
        />
        <button class="btn" onClick={createNewNote}>Add Note</button>
      </div>

      <input
        type="text"
        value={searchQuery()}
        onInput={(e) => setSearchQuery(e.currentTarget.value)}
        placeholder="Search notes..."
        class="input-field search-field"
      />

      {loading() ? (
        <div class="loading">Loading notes...</div>
      ) : (
        <ul class="notes-list">
          {filteredNotes().length === 0 ? (
            <li class="no-notes">No notes found</li>
          ) : (
            filteredNotes().map((note) => (
              <li
                key={note.id}
                class={`note-item ${props.currentNoteId === note.id ? 'selected' : ''}`}
                onClick={() => props.onSelectNote(note)}
              >
                <div class="note-info">
                  <h3>{note.title}</h3>
                  <p class="note-date">{new Date(note.updated_at).toLocaleString()}</p>
                </div>
                <button
                  class="delete-btn"
                  onClick={(e) => deleteNote(note.id, e)}
                  aria-label="Delete note"
                >
                  ×
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default NoteList;