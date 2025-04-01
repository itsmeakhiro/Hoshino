declare namespace HoshinoLia {
  export interface CmdCommand {
    name: string;
    aliases: string[];
    version: string;
    developer?: string;
    description: string;
    cooldown: number;
    usage: string;
    config: {
      prefix: boolean;
      admin: boolean;
      moderator: boolean;
      developer: boolean;
      privateOnly: boolean;
    };
  }

  export interface Command {
    command: CmdCommand;
    deploy(ctx: EntryObj): Promise<any> | any;
    style?: {
      type: string;
      title: string;
      footer: string;
    };
    font?: {
      title?: string | string[];
      content?: string | string[];
      footer?: string | string[];
    };
  }

  export interface Chat {
    send(message: string, goal?: string, noStyle?: boolean): Promise<any>;
    reply(message: string, goal?: string): Promise<any>;
  };

  export interface EntryObj {
    api: any;
    chat: Chat;
    event: Event;
    args: string[];
    fonts: Fonts;
    styler: Styler;
    replies: Map<string, RepliesArg>;
    hoshinoDB: import("../Hoshino/resources/database/utils");
    LevelSystem: typeof import("../Hoshino/resources/level/utils");
    BalanceHandler: typeof import("../Hoshino/resources/balance/utils");
    BankHandler: typeof import("../Hoshino/resources/bank/utils");
    Inventory: typeof import("../Hoshino/resources/inventory/utils");
  };

  export type CommandText = EntryObj;

  export interface Styler {
    (
      type: string,
      title: string,
      content: string,
      footer: string,
      styles?: any
    ): string;
  };

  export interface RepliesArg {
    callback: (
      entryObj: EntryObj & {
        ReplyData: HoshinoLia.RepliesArg
      }
    ) => void [key: string]: any
  }

  export interface Event {
    body: string;
    senderID: string;
    threadID: string;
    messageID: string;
    type: string
    messagwReply?: {
      messageID: string;
      senderID: string
    };
    [key: string]: any;
  }

  export interface GlobalHoshino {
    config {
      prefix: string;
      maintenance: boolean;
      developer: string[];
      moderator: string[];
      admin: string[];
    };
     commands: Map<string, command>;
     event: Map<string, any>;
     cooldowns: Map<string, Record<string, number>>;
     utils: any;
  }

  declare namespace globalThis {
    var bot: import("events").EventEmitter;
    var Hoshino: HoshinoLia.GlobalHoshino;
  }
}