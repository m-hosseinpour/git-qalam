import { Component, onMount, createSignal } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import NotificationProvider from './components/Notification';
import type { Note } from './types';
import { NotificationService } from './components/Notification';
import './index.css';

const App: Component = () => {
  const [greeting, setGreeting] = createSignal('');
  const [dir, setDir] = createSignal<'ltr' | 'rtl'>('ltr');
  const [currentNote, setCurrentNote] = createSignal<Note | null>(null);

  // Function to update RTL based on language
  const updateRTL = (isRTL: boolean) => {
    setDir(isRTL ? 'rtl' : 'ltr');
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  };

  // Initialize RTL based on system language or user preference
  onMount(() => {
    // Set RTL if user's language is Arabic or Persian
    const userLang = navigator.language;
    if (userLang.startsWith('ar') || userLang.startsWith('fa')) {
      updateRTL(true);
    }

    // Example of calling a Tauri command
    invoke<string>('greet', { name: 'Tauri' })
      .then(setGreeting)
      .catch(error => {
        console.error('Error calling greet command:', error);
        NotificationService.show('Failed to initialize app', 'error');
      });
  });

  const handleSelectNote = (note: Note) => {
    setCurrentNote(note);
  };

  return (
    <div class="app" dir={dir()}>
      <header>
        <h1>GitQalam - Notes App</h1>
        <button
          class="btn btn-secondary"
          onClick={() => updateRTL(dir() === 'ltr' ? true : false)}
        >
          {dir() === 'ltr' ? 'RTL Mode' : 'LTR Mode'}
        </button>
      </header>

      <div class="note-list-container">
        <NoteList
          onSelectNote={handleSelectNote}
          currentNoteId={currentNote()?.id}
        />
        <NoteEditor currentNote={currentNote()} />
      </div>

      <NotificationProvider />
    </div>
  );
};

export default App;