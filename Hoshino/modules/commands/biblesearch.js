/**
 * @type {HoshinoLia.Command}
 */

const command = {
  manifest: {
    name: "biblesearch",
    aliases: ["verse"],
    version: "1.0.0",
    developer: "Francis Loyd Raval",
    description:
      "A Bible Verse searcher in which showcases the word of Jesus Christ.",
    category: "religion",
    usage: "biblesearch [ bible ver ] [ verse ]",
    config: {
      admin: false,
      moderator: false,
      privateOnly: false,
    },
  },
  async deploy({ chat, args }) {
    if (args.length < 2) {
      return chat.reply(
        "Please provide a bible ver (e.g., KJV, NIV) and a verse."
      );
    }

    const bible = args[0];
    const reference = args.slice(1).join(" ");

    try {
      const { data } = await chat.req("https://api.biblesupersearch.com/api", {
        reference,
        bible,
      });

      if (data.results && data.results.length > 0) {
        const verseData = data.results[0].verses[bible.toLowerCase()];
        const chapter = Object.keys(verseData)[0];
        const verse = Object.keys(verseData[chapter])[0];
        const text = verseData[chapter][verse].text;
        chat.reply(`${bible} ${reference}: ${text}`);
      } else {
        chat.reply("No verse found.");
      }
    } catch (error) {
      chat.reply(
        `Error fetching verse: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
};

export default command;
