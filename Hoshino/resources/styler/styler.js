const fs = require("fs-extra");
const path = require("path");
const fonts = require("./fonts");

const DESIGNS_FILE = path.join(__dirname, "./plugin/designs.json");

/**
 * Ensures the designs file exists (empty by default)
 */
function initializeDesignsFile() {
  if (!fs.existsSync(DESIGNS_FILE)) {
    fs.writeFileSync(DESIGNS_FILE, JSON.stringify({}, null, 2));
  }
}

/**
 * Loads designs from the JSON file
 * @returns {Object} Designs object
 */
function loadDesigns() {
  initializeDesignsFile();
  try {
    return JSON.parse(fs.readFileSync(DESIGNS_FILE, "utf-8"));
  } catch (error) {
    console.error("Error loading designs:", error);
    return {};
  }
}

/**
 * Saves a new design to the JSON file
 * @param {string} name - Name of the design
 * @param {string} template - Design template
 * @returns {boolean} Success status
 */
function saveDesign(name, template) {
  const designs = loadDesigns();
  designs[name] = template;
  try {
    fs.writeFileSync(DESIGNS_FILE, JSON.stringify(designs, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving design:", error);
    return false;
  }
}

/**
 * Applies font styling to text, including autobold for **text**
 * @param {string} text - Text to style
 * @param {string|string[]} style - Font style(s) to apply
 * @returns {string} Styled text
 */
function applyFont(text, style) {
  if (!text) return "";

  let styledText = text.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
    return fonts.bold ? fonts.bold(p1) : `**${p1}**`;
  });

  if (style) {
    if (Array.isArray(style)) {
      return style.reduce(
        (formattedText, font) => fonts[font]?.(formattedText) || formattedText,
        styledText
      );
    }
    return fonts[style]?.(styledText) || styledText;
  }

  return styledText;
}

/**
 * Styles text using a design from the JSON file
 * @param {string} type - Design name
 * @param {string} title - Title text
 * @param {string} content - Main content
 * @param {string} footer - Footer text
 * @param {Object} styles - Font styles for each section
 * @returns {string} Formatted text
 */
module.exports = function styler(type, title, content, footer, styles = {}) {
  title = applyFont(title || "", styles.title);
  content = applyFont(content || "", styles.content);
  footer = applyFont(footer || "", styles.footer);

  const designs = loadDesigns();

  const template = designs[type];

  if (!template) {
    return `${title}\n${content}${footer ? `\n${footer}` : ""}`.trim();
  }

  return template
    .replace("{title}", title)
    .replace("{content}", content)
    .replace("{footer}", footer)
    .trim();
};

/**
 * Adds a new design to the JSON file
 * @param {string} name - Name of the design
 * @param {string} template - Template string with {title}, {content}, {footer} placeholders
 * @returns {boolean} Success status
 */
module.exports.addDesign = function (name, template) {
  if (!name || !template || typeof template !== "string") {
    throw new Error("Name and template must be valid strings");
  }
  if (!template.includes("{title}") || !template.includes("{content}")) {
    throw new Error("Template must include {title} and {content} placeholders");
  }
  return saveDesign(name, template);
};

module.exports.applyFont = applyFont;
