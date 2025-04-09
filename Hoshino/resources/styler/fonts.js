/**
 * Applies text styling using Unicode or custom formatting for bot messages
 * @type {Object.<string, (text: string) => string>}
 */
const fonts = {
  /**
   * Applies sans-serif style (using Unicode characters)
   * @param {string} text - The text to style
   * @returns {string} Styled text
   */
  sans: (text) => {
      const charMap = {
          'a': '𝖺', 'b': '𝖻', 'c': '𝖼', 'd': '𝖽', 'e': '𝖾',
          'f': '𝖿', 'g': '𝗀', 'h': '𝗁', 'i': '𝗂', 'j': '𝗃',
          'k': '𝗄', 'l': '𝗅', 'm': '𝗆', 'n': '𝗇', 'o': '𝗈',
          'p': '𝗉', 'q': '𝗊', 'r': '𝗋', 's': '𝗌', 't': '𝗍',
          'u': '𝗎', 'v': '𝗏', 'w': '𝗐', 'x': '𝗑', 'y': '𝗒',
          'z': '𝗓',
          'A': '𝖠', 'B': '𝖡', 'C': '𝖢', 'D': '𝖣', 'E': '𝖤',
          'F': '𝖥', 'G': '𝖦', 'H': '𝖧', 'I': '𝖨', 'J': '𝖩',
          'K': '𝖪', 'L': '𝖫', 'M': '𝖬', 'N': '𝖭', 'O': '𝖮',
          'P': '𝖯', 'Q': '𝖰', 'R': '𝖱', 'S': '𝖲', 'T': '𝖳',
          'U': '𝖴', 'V': '𝖵', 'W': '𝖶', 'X': '𝖷', 'Y': '𝖸',
          'Z': '𝖹',
          '0': '𝟢', '1': '𝟣', '2': '𝟤', '3': '𝟥', '4': '𝟦',
          '5': '𝟧', '6': '𝟨', '7': '𝟩', '8': '𝟪', '9': '𝟫',
          ' ': ' ', 
          '.': '.', ',': ',', '!': '!', '?': '?', ':': ':', 
          '"': '"', "'": "'", '(': '(', ')': ')', '-': '-'
      };

      return text.split('').map(char => charMap[char] || char).join('');
  },

  /**
   * Applies bold style (using Unicode characters)
   * @param {string} text - The text to style
   * @returns {string} Styled text
   */
  bold: (text) => {
      const charMap = {
          'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲',
          'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷',
          'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼',
          'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁',
          'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆',
          'z': '𝘇',
          'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘',
          'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝',
          'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢',
          'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧',
          'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬',
          'Z': '𝗭',
          '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
          '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
      };

      return text.split('').map(char => charMap[char] || char).join('');
  },

  /**
   * Applies monospace style (using Unicode characters)
   * @param {string} text - The text to style
   * @returns {string} Styled text
   */
  mono: (text) => {
      const charMap = {
          'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎',
          'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓',
          'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘',
          'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝',
          'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢',
          'z': '𝚣',
          'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴',
          'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹',
          'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾',
          'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃',
          'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈',
          'Z': '𝚉',
          '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺',
          '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿'
      };

      return text.split('').map(char => charMap[char] || char).join('');
  },

  /**
   * Applies italic style (using Unicode characters)
   * @param {string} text - The text to style
   * @returns {string} Styled text
   */
  italic: (text) => {
      const charMap = {
          'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦',
          'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫',
          'k': '𝘬', 'l': '𝘭', 'm': '𝘮', 'n': '𝘯', 'o': '𝘰',
          'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵',
          'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺',
          'z': '𝘻',
          'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌',
          'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑',
          'K': '𝘒', 'L': '𝘓', 'M': '𝘔', 'N': '𝘕', 'O': '𝘖',
          'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛',
          'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠',
          'Z': '𝘡'
      };

      return text.split('').map(char => charMap[char] || char).join('');
  }
};

module.exports = fonts;