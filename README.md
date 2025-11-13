# GitQalam - Git-Powered Note-Taking Application

GitQalam is a cross-platform note-taking application built with Tauri 2.0, featuring a Rust backend and SolidJS frontend. The application uses Git for storage and synchronization, providing full version control for your notes. It supports RTL languages and includes rich text editing capabilities.

## Features

### Core Functionality
- **Rich Text Editing**: Tiptap editor with real-time preview
- **Markdown Support**: Full Markdown rendering with syntax highlighting
- **Mermaid Diagrams**: Support for ` ```mermaid ` code blocks with interactive SVG rendering
- **LaTeX Math**: Math rendering using KaTeX for inline and block equations
- **Git Storage**: Automatic synchronization with Git repositories
- **Auto-Save**: Automatic saving with debouncing to prevent data loss
- **Conflict Resolution**: Intelligent conflict resolution with user-friendly UI

### UI/UX Features
- **RTL Support**: Full Right-to-Left language support (Persian/Arabic)
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Interface**: Clean, minimal, fast interface
- **Touch Optimization**: Mobile-optimized touch targets and UI density

## Architecture

### Technical Stack
- **Backend**: Rust with Tauri 2.0
- **Frontend**: SolidJS with TypeScript
- **Editor**: Tiptap (ProseMirror-based)
- **Git Operations**: Rust backend using `git2` crate
- **Markdown Processing**: `comrak` crate for secure conversion

## Prerequisites

- Rust (with rustup)
- Node.js (v18+)
- System dependencies for Tauri:
  - Linux: webkit2gtk-4.1, librsvg2-dev, pkg-config, libssl-dev
  - macOS: Xcode Command Line Tools
  - Windows: Visual Studio Build Tools

## Installation and Running

1. Clone the repository:
   ```bash
   git clone git@github.com:m-hosseinpour/git-qalam.git
   cd git-qalam
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run tauri dev
   ```

4. Build for production:
   ```bash
   npm run tauri build
   ```

## Configuration

The application supports GitHub integration with secure token storage. You can configure this through the in-app settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

This project was implemented with the help of Qwen Code, an AI-powered code assistant that helped with the development process.