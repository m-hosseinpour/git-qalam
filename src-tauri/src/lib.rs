#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_fs::FsExt;
use tauri_plugin_store::StoreExt;

mod git_operations;
mod commands;
use commands::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_store::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            save_note,
            load_note,
            list_notes,
            authenticate_with_github,
            poll_github_token,
            get_github_token,
            set_github_token,
            delete_github_token,
            sync_notes_with_github,
            resolve_conflict,
            initialize_git_repo,
            clone_git_repo,
            add_git_files,
            commit_git_changes,
            push_git_changes,
            pull_git_changes,
            check_git_conflicts,
            get_conflicted_files,
            delete_note
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}