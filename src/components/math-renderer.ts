import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import katex from 'katex';

// Custom Node for LaTeX math
export const renderMath = () => {
  return Node.create({
    name: 'math',

    group: 'inline',

    inline: true,

    atom: true,

    addAttributes() {
      return {
        content: {
          default: '',
          parseHTML: element => element.textContent || '',
          renderHTML: attributes => {
            return {};
          },
        },
        display: {
          default: false,
          parseHTML: element => element.getAttribute('data-display') === 'true',
          renderHTML: attributes => {
            return {
              'data-display': attributes.display,
            };
          },
        },
      };
    },

    parseHTML() {
      return [
        {
          tag: 'span[data-math]',
        },
      ];
    },

    renderHTML({ node, HTMLAttributes }) {
      const content = node.textContent;
      let mathElement;

      try {
        mathElement = katex.renderToString(content, {
          displayMode: false, // We'll handle display mode differently
          throwOnError: false,
        });
      } catch (error) {
        // If KaTeX fails to render, fall back to LaTeX code
        mathElement = `<span class="katex-error">${content}</span>`;
      }

      return [
        'span',
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          'data-math': '',
          'class': 'math-node',
        }),
        mathElement,
      ];
    },

    addCommands() {
      return {
        setMath: options => ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
            content: [
              {
                type: 'text',
                text: options?.content || '',
              }
            ],
          });
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey('math-renderer'),
          state: {
            init: () => DecorationSet.empty,
            apply: (tr, set) => {
              set = set.map(tr.mapping, tr.doc);
              const decorations: Decoration[] = [];

              tr.doc.descendants((node, pos) => {
                if (node.type.name === this.name) {
                  const widget = document.createElement('span');
                  widget.className = 'math-container';

                  const content = node.textContent;
                  if (content) {
                    try {
                      // Check if it's an inline or block math
                      const isDisplay = content.startsWith('\\[') && content.endsWith('\\]') ||
                                       content.startsWith('$$') && content.endsWith('$$');
                      const cleanContent = content.replace(/^(\$\$|\\\[)/, '').replace(/(\$\$|\\\])$/, '');

                      katex.render(cleanContent, widget, {
                        displayMode: isDisplay,
                        throwOnError: false,
                      });
                    } catch (error) {
                      widget.textContent = content;
                      widget.className += ' katex-error';
                    }
                  }

                  const deco = Decoration.widget(pos + 1, widget, {
                    id: Math.random(),
                    side: 1,
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