use git2::{Repository, IndexAddOption, Signature, Oid};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
pub struct GitConfig {
    pub repo_path: String,
    pub github_token: String,
    pub remote_url: String,  // e.g., "https://github.com/username/repo.git"
}

pub struct GitOperations;

impl GitOperations {
    pub fn init_repo(repo_path: &str) -> Result<Repository, git2::Error> {
        Repository::init(repo_path)
    }

    pub fn clone_repo(remote_url: &str, local_path: &str, github_token: &str) -> Result<Repository, git2::Error> {
        let mut builder = git2::build::RepoBuilder::new();
        
        // Set up authentication with GitHub token
        builder.fetch_options(git2::FetchOptions::new().remote_callbacks({
            let mut callbacks = git2::RemoteCallbacks::new();
            let token = github_token.to_string();
            callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
                git2::Cred::userpass_plaintext("x-oauth-basic", &token)
            });
            callbacks
        }));

        builder.clone(remote_url, Path::new(local_path))
    }

    pub fn add_files(repo: &Repository, file_paths: &[&str]) -> Result<(), git2::Error> {
        let mut index = repo.index()?;
        
        for file_path in file_paths {
            index.add_path(Path::new(file_path))?;
        }
        
        index.write()?;
        Ok(())
    }

    pub fn commit_changes(repo: &Repository, message: &str) -> Result<Oid, git2::Error> {
        let mut index = repo.index()?;
        let tree_id = index.write_tree()?;
        let tree = repo.find_tree(tree_id)?;

        // Get the HEAD commit
        let head_commit = repo.head()?.peel_to_commit()?;

        // Create a commit signature
        let signature = Signature::now("Gimark", "gimark@example.com")?;

        // Commit the changes
        let commit_id = repo.commit(
            Some("HEAD"),  // Update HEAD
            &signature,    // Author
            &signature,    // Committer
            message,       // Message
            &tree,         // Tree
            &[&head_commit], // Parents
        )?;

        Ok(commit_id)
    }

    pub fn push_to_remote(repo: &Repository, github_token: &str) -> Result<(), git2::Error> {
        let mut remote = repo.find_remote("origin")?;
        
        remote.push(
            &["refs/heads/main:refs/heads/main"], 
            Some(git2::PushOptions::new().remote_callbacks({
                let mut callbacks = git2::RemoteCallbacks::new();
                let token = github_token.to_string();
                callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
                    git2::Cred::userpass_plaintext("x-oauth-basic", &token)
                });
                callbacks
            }))
        )?;
        
        Ok(())
    }

    pub fn pull_from_remote(repo: &Repository, github_token: &str) -> Result<(), git2::Error> {
        let mut remote = repo.find_remote("origin")?;
        
        remote.fetch(
            &["refs/heads/main:refs/remotes/origin/main"], 
            Some(git2::FetchOptions::new().remote_callbacks({
                let mut callbacks = git2::RemoteCallbacks::new();
                let token = github_token.to_string();
                callbacks.credentials(move |_url, _username_from_url, _allowed_types| {
                    git2::Cred::userpass_plaintext("x-oauth-basic", &token)
                });
                callbacks
            })),
            None
        )?;
        
        // Merge the fetched changes
        let fetch_head = repo.find_reference("FETCH_HEAD")?;
        let fetch_commit = repo.reference_to_annotated_commit(&fetch_head)?;
        
        // Perform the merge
        let analysis = repo.merge_analysis(&[&fetch_commit])?;
        
        if analysis.0.is_fast_forward() {
            // Fast-forward merge
            let refname = "refs/heads/main";
            match repo.find_reference(refname) {
                Ok(mut r) => {
                    r.set_target(fetch_commit.id(), "Fast-forward")?;
                    repo.set_head(refname)?;
                    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;
                }
                Err(_) => {
                    // If the branch doesn't exist, set it
                    repo.reference(refname, fetch_commit.id(), true, "Fast-forward")?;
                    repo.set_head(refname)?;
                    repo.checkout_head(Some(git2::build::CheckoutBuilder::default().force()))?;
                }
            }
        } else if analysis.0.is_normal() {
            // Handle normal merge (which might involve conflicts)
            let head_commit = repo.reference_to_annotated_commit(&repo.head()?)?;
            let merge_trees = repo.merge_commits(&head_commit, &fetch_commit, None)?;
            
            // For now, we'll just write the merge result to the index
            let mut index = repo.index()?;
            index.read_tree(&merge_trees)?;
            index.write()?;
            
            // If there are conflicts, this would need to be handled differently
            // For now, just commit the merge
            let tree_id = index.write_tree()?;
            let tree = repo.find_tree(tree_id)?;
            
            let signature = Signature::now("Gimark", "gimark@example.com")?;
            repo.commit(
                Some("HEAD"),
                &signature,
                &signature,
                &format!("Merge remote changes"),
                &tree,
                &[&head_commit, &fetch_commit],
            )?;
            
            repo.checkout_head(Some(git2::build::CheckoutBuilder::default()))?;
        }
        
        Ok(())
    }

    pub fn check_for_conflicts(repo: &Repository) -> Result<bool, git2::Error> {
        let index = repo.index()?;
        Ok(index.has_conflicts())
    }

    pub fn get_conflicted_files(repo: &Repository) -> Result<Vec<String>, git2::Error> {
        let mut index = repo.index()?;
        let mut conflicted_files = Vec::new();
        
        if let Some(mut conflicts) = index.conflicts()? {
            while let Some(conflict) = conflicts.next()? {
                if let Some(our_path) = conflict.our.and_then(|entry| entry.path) {
                    conflicted_files.push(our_path.to_string_lossy().to_string());
                }
            }
        }
        
        Ok(conflicted_files)
    }
}