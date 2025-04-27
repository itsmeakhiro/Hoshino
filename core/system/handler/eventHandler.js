/**
 *
 * @param {HoshinoLia.CommandContext} param0
 * @returns
 */
export default async function eventHandler({ ...entryObj }) {
  const { event, chat, fonts, api } = entryObj;
  // WARNING THIS IS UNUSED AND EVERYTHING IS IN LISTENER

  try {
    if (!event) {
      // log("ERROR", "No event data provided");
      return;
    }

    for (const { manifest, onEvent } of global.Hoshino.events.values()) {
      if (event && manifest.name) {
        const args = event.body?.split(" ");

        try {
          await onEvent({
            ...entryObj,
            args,
          });
        } catch (err) {
          console.error(`Error handling event ${manifest.name}:`, err);
        }
      }
    }
  } catch (err) {
    console.error("Error in eventHandler:", err);
  }
}
