use gimark_lib::{NotesState, run};
use std::collections::HashMap;

fn main() {
    // Initialize global state
    let notes_state = NotesState {
        notes: std::sync::Mutex::new(HashMap::new()),
    };

    tauri::Builder::default()
        .manage(notes_state)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}