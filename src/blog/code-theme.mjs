// Warm monochrome Shiki theme for blog code blocks.
// Tokens differ by weight, style and gray level instead of hue; every color is >= 4.5:1 on #efeeeb.
const ink = '#121212';
const graphite = '#373734';
const muted = '#5f5d58';

export const warmMonochrome = {
  name: 'warm-monochrome',
  type: 'light',
  colors: {
    'editor.background': '#efeeeb',
    'editor.foreground': ink,
  },
  tokenColors: [
    { settings: { foreground: ink } },
    { scope: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'], settings: { foreground: muted, fontStyle: 'italic' } },
    { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control', 'keyword.operator.word'], settings: { foreground: ink, fontStyle: 'bold' } },
    { scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'], settings: { foreground: graphite } },
    { scope: ['constant', 'constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: graphite } },
    { scope: ['entity.name.function', 'support.function', 'meta.function-call'], settings: { foreground: ink } },
    { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: ink, fontStyle: 'italic' } },
    { scope: ['variable.parameter'], settings: { foreground: graphite } },
    { scope: ['punctuation', 'keyword.operator'], settings: { foreground: graphite } },
    { scope: ['markup.inserted'], settings: { foreground: ink } },
    { scope: ['markup.deleted'], settings: { foreground: muted } },
  ],
};
