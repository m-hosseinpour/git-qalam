use tauri::State;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::collections::HashMap;
use tauri_plugin_http::reqwest;
use crate::git_operations::GitOperations;

// Define the data structures
#[derive(Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct GitHubAuthResponse {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub expires_in: u64,
    pub interval: u64,
}

#[derive(Serialize, Deserialize)]
pub struct GitHubTokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub scope: String,
}

#[derive(Serialize, Deserialize)]
pub struct ConflictResolution {
    pub note_id: String,
    pub resolution_type: String, // "keep_mine", "use_theirs", "merge"
    pub content: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct GitConfig {
    pub repo_path: String,
    pub github_token: String,
    pub remote_url: String,
}

// Global state to hold notes
pub struct NotesState {
    pub notes: Mutex<HashMap<String, Note>>,
}

// Tauri commands
#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn save_note(note: Note, store: tauri::State<'_, NotesState>) -> Result<(), String> {
    let mut notes = store.notes.lock().unwrap();
    notes.insert(note.id.clone(), note);
    Ok(())
}

#[tauri::command]
pub fn load_note(note_id: String, store: tauri::State<'_, NotesState>) -> Result<Option<Note>, String> {
    let notes = store.notes.lock().unwrap();
    Ok(notes.get(&note_id).cloned())
}

#[tauri::command]
pub fn list_notes(store: tauri::State<'_, NotesState>) -> Result<Vec<Note>, String> {
    let notes = store.notes.lock().unwrap();
    Ok(notes.values().cloned().collect())
}

#[tauri::command]
pub fn delete_note(note_id: String, store: tauri::State<'_, NotesState>) -> Result<(), String> {
    let mut notes = store.notes.lock().unwrap();
    notes.remove(&note_id);
    Ok(())
}

#[tauri::command]
pub async fn authenticate_with_github() -> Result<GitHubAuthResponse, String> {
    // GitHub Device Flow: Step 1 - Request device and user verification codes
    let client = reqwest::Client::new();
    let params = [
        ("client_id", "YOUR_CLIENT_ID_HERE"), // This should be your GitHub OAuth App client ID
        ("scope", "repo"),
    ];

    let response = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let auth_data: GitHubAuthResponse = response
            .json()
            .await
            .map_err(|e| e.to_string())?;

        Ok(auth_data)
    } else {
        Err(format!("GitHub auth request failed: {}", response.status()))
    }
}

#[tauri::command]
pub async fn poll_github_token(device_code: String) -> Result<GitHubTokenResponse, String> {
    // GitHub Device Flow: Step 2 - Poll for access token
    let client = reqwest::Client::new();
    let params = [
        ("client_id", "YOUR_CLIENT_ID_HERE"), // This should be your GitHub OAuth App client ID
        ("device_code", device_code.as_str()),
        ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
    ];

    let response = client
        .post("https://github.com/login/oauth/access_token")
        .header("Accept", "application/json")
        .form(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        let token_data: GitHubTokenResponse = response
            .json()
            .await
            .map_err(|e| e.to_string())?;

        Ok(token_data)
    } else {
        let text = response.text().await.map_err(|e| e.to_string())?;
        Err(format!("Token polling failed: {}", text))
    }
}

#[tauri::command]
pub async fn get_github_token(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let store = app_handle.store("settings.json").map_err(|e| e.to_string())?;
    let token: Option<String> = store.get("github_token").cloned();
    Ok(token)
}

#[tauri::command]
pub async fn set_github_token(app_handle: tauri::AppHandle, token: String) -> Result<(), String> {
    let mut store = app_handle.store("settings.json").map_err(|e| e.to_string())?;
    store.insert("github_token".to_string(), token.into()).map_err(|e| e.to_string())?;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn delete_github_token(app_handle: tauri::AppHandle) -> Result<(), String> {
    let mut store = app_handle.store("settings.json").map_err(|e| e.to_string())?;
    store.insert("github_token".to_string(), serde_json::Value::Null).map_err(|e| e.to_string())?;
    store.save().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn sync_notes_with_github() -> Result<(), String> {
    // This will be implemented to sync notes with GitHub
    // For now, returning Ok
    Ok(())
}

#[tauri::command]
pub async fn resolve_conflict(resolution: ConflictResolution) -> Result<(), String> {
    // This will be implemented to handle git conflicts
    // For now, returning Ok
    Ok(())
}

#[tauri::command]
pub async fn initialize_git_repo(repo_path: String) -> Result<(), String> {
    GitOperations::init_repo(&repo_path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clone_git_repo(git_config: GitConfig) -> Result<(), String> {
    GitOperations::clone_repo(&git_config.remote_url, &git_config.repo_path, &git_config.github_token)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn add_git_files(repo_path: String, file_paths: Vec<String>) -> Result<(), String> {
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| e.to_string())?;

    GitOperations::add_files(&repo, &file_paths.iter().map(|s| s.as_str()).collect::<Vec<_>>())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn commit_git_changes(repo_path: String, message: String) -> Result<String, String> {
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| e.to_string())?;

    let commit_id = GitOperations::commit_changes(&repo, &message)
        .map_err(|e| e.to_string())?;

    Ok(commit_id.to_string())
}

#[tauri::command]
pub async fn push_git_changes(git_config: GitConfig) -> Result<(), String> {
    let repo = git2::Repository::open(&git_config.repo_path)
        .map_err(|e| e.to_string())?;

    GitOperations::push_to_remote(&repo, &git_config.github_token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn pull_git_changes(git_config: GitConfig) -> Result<(), String> {
    let repo = git2::Repository::open(&git_config.repo_path)
        .map_err(|e| e.to_string())?;

    GitOperations::pull_from_remote(&repo, &git_config.github_token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_git_conflicts(repo_path: String) -> Result<bool, String> {
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| e.to_string())?;

    GitOperations::check_for_conflicts(&repo)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_conflicted_files(repo_path: String) -> Result<Vec<String>, String> {
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| e.to_string())?;

    GitOperations::get_conflicted_files(&repo)
        .map_err(|e| e.to_string())
}