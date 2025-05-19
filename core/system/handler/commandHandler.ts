export default async function commandHandler({
  api,
  chat,
  args,
  restrictCooldown,
  restrictWebPermissions,
  fonts,
  command,
  hasPrefix,
  commandName,
  entryObj,
  ...extra
}: HoshinoLia.CommandContext) {
  const event = entryObj.event as Extract<
    HoshinoLia.EntryObj["event"],
    { body: string }
  >;
  if (!("body" in event)) {
    return;
  }
  const { prefix, developer } = global.Hoshino.config;

  const senderID = event.senderID;
  const admins = global.Hoshino.config.admin || [];
  const moderators = global.Hoshino.config.moderator || [];

  if (
    !restrictWebPermissions(
      event,
      senderID,
      developer,
      admins,
      moderators,
      command
    )
  ) {
    await chat.reply(
      fonts.sans(
        "Web users cannot access developer, admin, or moderator functions."
      )
    );
    return;
  }

  function hasPermission(type: "admin" | "moderator") {
    return (
      developer?.includes(senderID) ||
      (type === "admin"
        ? admins.includes(senderID)
        : moderators.includes(senderID) || admins.includes(senderID))
    );
  }

  const isAdmin = hasPermission("admin");
  const isModerator = hasPermission("moderator");

  function antiNSFW(name: string) {
    const nsfwKeywords = ["18+", "nsfw", "porn", "hentai", "lewd"];
    return nsfwKeywords.some((word) => name.includes(word));
  }

  if (antiNSFW(commandName)) {
    await chat.reply(
      fonts.sans("Warning: NSFW content is not allowed on Hoshino.")
    );
    return;
  }

  let needPrefix = command?.manifest?.config?.prefix ?? true;

  if (command && (!needPrefix || (needPrefix && hasPrefix))) {
    const cooldownCheck = restrictCooldown(
      senderID,
      commandName,
      command.manifest?.cooldown ?? 5
    );
    if (!cooldownCheck.allowed) {
      await chat.reply(
        fonts.sans(
          `Please wait ${cooldownCheck.remaining} seconds before using "${commandName}" again.`
        )
      );
      return;
    }

    if (
      command.manifest?.config?.privateOnly &&
      event.threadID !== event.senderID
    ) {
      await chat.reply(
        fonts.sans("This command can only be used in private chats.")
      );
      return;
    }

    if (command.manifest.config?.admin && !isAdmin) {
      await chat.reply(
        fonts.sans("This command is restricted to administrators.")
      );
      return;
    }

    if (command.manifest.config?.moderator && !isModerator) {
      await chat.reply(fonts.sans("This command is restricted to moderators."));
      return;
    }

    try {
      const result = await command.deploy({
        ...entryObj,
        event,
      });
      if (result && typeof result === "object" && result.status === "success") {
        return;
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Error executing command "${commandName}":`, err);
        await chat.reply(
          fonts.sans("Sorry, an error occurred. Please try again.")
        );
      }
    }
    return;
  } else if (hasPrefix && !command) {
    await chat.reply(
      fonts.sans(
        `Unknown command: "${commandName}". Use "${prefix}help" to view available commands.`
      )
    );
    return;
  }

  if (!hasPrefix) {
    if (event.isWeb && event.body.trim() && event.type !== "message_reply") {
      await chat.reply(
        fonts.sans(
          `Please use the prefix "${prefix}" to invoke a command (e.g., ${prefix}help).`
        )
      );
      return;
    }
  }
}
