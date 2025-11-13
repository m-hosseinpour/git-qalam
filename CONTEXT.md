# GitQalam - Cross-Platform Note-Taking Application

## Project Overview
GitQalam is a cross-platform note-taking application built with Tauri 2.0, featuring a Rust backend and SolidJS frontend. The application is inspired by NotesHub and designed to run on Linux, Windows, macOS, Android, and iOS.

## Features

### Core Functionality
- **Rich Text Editing**: Tiptap editor with real-time preview
- **Markdown Support**: Full Markdown rendering with syntax highlighting
- **Mermaid Diagrams**: Support for ` ```mermaid ` code blocks with interactive SVG rendering
- **LaTeX Math**: Math rendering using KaTeX for inline and block equations
- **GitHub Sync**: Automatic synchronization with GitHub repositories
- **Auto-Save**: Automatic saving with debouncing to prevent data loss
- **Conflict Resolution**: Intelligent conflict resolution with user-friendly UI

### UI/UX Features
- **RTL Support**: Full Right-to-Left language support (Persian/Arabic)
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Interface**: Clean, minimal, fast interface
- **Touch Optimization**: Mobile-optimized touch targets and UI density

### Technical Architecture
- **Backend**: Rust with Tauri 2.0
- **Frontend**: SolidJS with TypeScript
- **Editor**: Tiptap (ProseMirror-based)
- **Git Operations**: Rust backend using `git2` crate
- **Markdown Processing**: `comrak` crate for secure conversion

### GitHub Integration
- **Authentication**: Device Authorization Flow
- **Secure Storage**: Tauri's secure storage APIs for tokens
- **Sync Operations**: Full Git operations (clone, commit, push, pull, fetch)
- **Conflict Handling**: Smart conflict resolution with manual override options

## Project Structure
```
gitqalam/
├── src/                    # SolidJS frontend source
│   ├── components/         # UI components
│   │   ├── NoteList.tsx    # Note listing component
│   │   ├── NoteEditor.tsx  # Editor component
│   │   ├── TiptapEditor.tsx # Tiptap editor wrapper
│   │   ├── GitHubAuth.tsx  # GitHub auth UI
│   │   ├── Notification.tsx # Notification system
│   │   └── ConflictResolutionModal.tsx # Conflict resolution UI
│   ├── types.ts            # Type definitions
│   ├── App.tsx             # Main application component
│   ├── index.tsx           # Entry point
│   └── index.css           # Global styles (with RTL support)
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── lib.rs          # Tauri library entry
│   │   ├── main.rs         # Main application entry
│   │   ├── commands.rs     # Tauri commands
│   │   └── git_operations.rs # Git operations
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── public/
├── package.json
├── vite.config.ts          # Vite configuration
└── index.html
```

## Dependencies

### Frontend Dependencies
- SolidJS (v1.8.0+)
- Tiptap ecosystem (all extensions)
- KaTeX for math rendering
- Mermaid for diagram rendering
- Tauri API packages

### Backend Dependencies
- Tauri 2.9.3
- git2 crate for Git operations
- comrak for Markdown processing
- serde for serialization

## Configuration

### Tauri Configuration
- Window size: 900x650
- Security: CSP disabled (for development)
- Features: All default Tauri plugins enabled

### GitHub Authentication
- Uses GitHub Device Flow
- Requires client ID (placeholder in code)
- Secure token storage

## Building and Running

### Prerequisites
- Rust (with rustup)
- Node.js (v18+)
- System dependencies for Tauri:
  - Linux: webkit2gtk-4.1, librsvg2-dev, pkg-config, libssl-dev
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools

### Running Development Server
```bash
cd gitqalam
npm install
npm run tauri dev
```

### Building for Production
```bash
npm run tauri build
```

## Key Components

### 1. Note Editor
- Uses Tiptap with real-time preview
- Handles Mermaid diagram rendering
- Implements LaTeX math rendering
- Supports all Markdown features

### 2. GitHub Integration
- Device authorization flow implementation
- Git operations (clone, commit, push, pull)
- Conflict detection and resolution

### 3. User Interface
- RTL-aware layout using logical CSS properties
- Responsive design for all screen sizes
- Mobile-optimized touch targets
- Notification system

### 4. Data Management
- Note CRUD operations
- Auto-save with debouncing
- Secure token storage
- Conflict resolution UI

## Security Considerations
- Secure token storage using Tauri's secure storage
- Input sanitization through comrak
- Proper OAuth 2.0 flow for GitHub authentication

## Mobile Support
- Responsive layout for mobile screens
- Touch-optimized UI elements
- Proper UI density for mobile
- Tested on Android platform (theoretical)

## Performance Optimizations
- Debounced auto-save to minimize Git operations
- Client-side Markdown processing
- Optimized rendering with SolidJS
- Efficient Git operations in Rust

## Limitations
- Requires system dependencies for building
- GitHub API rate limits apply
- Mobile builds require platform-specific SDKs

## Future Enhancements
- Offline-first capabilities
- Local storage options
- Theme customization
- Advanced search functionality
- Notebook organization
- Export functionality