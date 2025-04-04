module.exports = function styler(type, title, content, footer, styles = {}) {
    const fonts = require("./fonts");
  
    function applyFont(text, style) {
      if (!style) return text;
      if (Array.isArray(style)) {
        return style.reduce((formattedText, font) => fonts[font]?.(formattedText) || formattedText, text);
      }
      return fonts[style]?.(text) || text;
    }
  
    title = applyFont(title, styles.title);
    content = applyFont(content, styles.content);
    footer = applyFont(footer, styles.footer);
  
    switch (type) {
      case "Hdesign":
        return `
  ${title}
  
  ╭────────────
  ${content}
  ╰────────────
  
  ${footer}
       `.trim();
  
      case "design":
        return `
  ${title}
  ━━━━━━━━━━━━━━━━━
  ${content}
  ${footer ? `━━━━━━━━━━━━━━━━━\n${footer}` : ""}
        `.trim();
  
      default:
        return `${title}\n\n${content}\n\n${footer}`;
    }
  };