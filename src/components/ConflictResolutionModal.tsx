import { Component, createSignal, createEffect } from 'solid-js';
import { invoke } from '@tauri-apps/api/tauri';
import type { ConflictResolution } from '../types';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  localContent: string;
  remoteContent: string;
}

const ConflictResolutionModal: Component<ConflictModalProps> = (props) => {
  const [localContent, setLocalContent] = createSignal(props.localContent);
  const [remoteContent, setRemoteContent] = createSignal(props.remoteContent);
  const [mergedContent, setMergedContent] = createSignal('');
  const [resolutionType, setResolutionType] = createSignal<'keep_mine' | 'use_theirs' | 'merge'>('merge');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  // Set merged content to local by default
  createEffect(() => {
    if (props.localContent) {
      setMergedContent(props.localContent);
    }
  });

  const handleResolution = async () => {
    setLoading(true);
    setError('');
    
    try {
      const resolution: ConflictResolution = {
        note_id: props.noteId,
        resolution_type: resolutionType(),
        content: resolutionType() === 'merge' ? mergedContent() : undefined
      };
      
      await invoke('resolve_conflict', { resolution });
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while resolving the conflict');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {props.isOpen && (
        <div class="conflict-modal" onClick={props.onClose}>
          <div class="conflict-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Conflict Detected</h2>
            <p>A conflict was detected in this note. Please resolve it:</p>
            
            <div class="conflict-options">
              <button 
                class={`btn ${resolutionType() === 'keep_mine' ? 'btn-secondary' : ''}`}
                onClick={() => {
                  setResolutionType('keep_mine');
                  setMergedContent(localContent());
                }}
              >
                Keep Mine
              </button>
              <button 
                class={`btn ${resolutionType() === 'use_theirs' ? 'btn-secondary' : ''}`}
                onClick={() => {
                  setResolutionType('use_theirs');
                  setMergedContent(remoteContent());
                }}
              >
                Use Theirs
              </button>
              <button 
                class={`btn ${resolutionType() === 'merge' ? 'btn-secondary' : ''}`}
                onClick={() => setResolutionType('merge')}
              >
                Merge Manually
              </button>
            </div>
            
            {resolutionType() === 'merge' && (
              <div class="merge-section">
                <h3>Your Changes:</h3>
                <div class="conflict-preview">
                  <pre>{localContent()}</pre>
                </div>
                
                <h3>Their Changes:</h3>
                <div class="conflict-preview">
                  <pre>{remoteContent()}</pre>
                </div>
                
                <h3>Merged Content:</h3>
                <textarea
                  value={mergedContent()}
                  onInput={(e) => setMergedContent(e.currentTarget.value)}
                  class="merge-textarea"
                  rows={10}
                />
              </div>
            )}
            
            {error() && (
              <div class="error-message">
                Error: {error()}
              </div>
            )}
            
            <div class="modal-actions">
              <button 
                class="btn btn-secondary" 
                onClick={props.onClose}
                disabled={loading()}
              >
                Cancel
              </button>
              <button 
                class="btn" 
                onClick={handleResolution}
                disabled={loading()}
              >
                {loading() ? 'Resolving...' : 'Resolve Conflict'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConflictResolutionModal;