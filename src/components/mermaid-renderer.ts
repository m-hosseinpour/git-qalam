import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import mermaid from 'mermaid';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',  // Allow HTML content in diagrams
});

// Custom Node for Mermaid diagrams
export const renderMermaid = () => {
  return Node.create({
    name: 'mermaid',

    group: 'block',

    content: 'text*',

    marks: '',

    code: true,

    defining: true,

    addAttributes() {
      return {
        chart: {
          default: null,
          parseHTML: element => element.getAttribute('data-chart'),
          renderHTML: attributes => {
            if (!attributes.chart) {
              return {};
            }
            return { 'data-chart': attributes.chart };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'pre[data-mermaid]',
          preserveWhitespace: 'full',
        },
        {
          tag: 'div[data-mermaid]',
          preserveWhitespace: 'full',
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      return [
        'div',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          'data-mermaid': '',
          'class': 'mermaid-diagram'
        }),
        node.content.firstChild ? node.content.firstChild.text : '',
      ];
    },

    addCommands() {
      return {
        setMermaid: options => ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: 'text',
                text: options?.chart || '',
              }
            ],
          });
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('mermaid-renderer'),
          state: {
            init: () => DecorationSet.empty,
            apply: (tr, set) => {
              // Adjust decoration positions to account for changes
              set = set.map(tr.mapping, tr.doc);
              // Add new decorations for mermaid blocks
              const decorations: Decoration[] = [];

              tr.doc.descendants((node, pos) => {
                if (node.type.name === this.name) {
                  const widget = document.createElement('div');
                  widget.className = 'mermaid-container';
                  widget.style.display = 'flex';
                  widget.style.justifyContent = 'center';
                  widget.style.alignItems = 'center';
                  widget.style.minHeight = '100px';
                  widget.style.padding = '10px';
                  widget.style.backgroundColor = '#f8f9fa';
                  widget.style.border = '1px solid #dee2e6';
                  widget.style.borderRadius = '4px';
                  widget.style.margin = '10px 0';

                  // Create loading indicator
                  const loading = document.createElement('div');
                  loading.textContent = 'Rendering Mermaid diagram...';
                  loading.style.color = '#6c757d';
                  loading.style.fontStyle = 'italic';
                  widget.appendChild(loading);

                  // Schedule rendering after DOM update
                  setTimeout(() => {
                    const code = node.textContent;
                    if (code) {
                      mermaid.mermaidAPI.render('mermaid-' + Date.now(), code, (svgCode) => {
                        widget.innerHTML = svgCode;
                      }).catch(error => {
                        console.error('Error rendering Mermaid diagram:', error);
                        widget.innerHTML = `<div class="mermaid-error">Error rendering diagram: ${error.message}</div>`;
                      });
                    } else {
                      widget.innerHTML = '<div class="mermaid-error">Empty Mermaid diagram</div>';
                    }
                  }, 0);

                  const deco = Decoration.widget(pos + 1, widget, {
                    id: Math.random(),
                  });
                  decorations.push(deco);
                }
              });

              return DecorationSet.create(tr.doc, decorations);
            }
          },
          props: {
            decorations: state => this.getState(state),
          }
        })
      ];
    },
  });
};