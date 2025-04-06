declare namespace HoshinoLia {
  export interface CommandManifest {
    name: string;
    aliases?: string[];
    version?: string;
    author?: string;
    developer?: string;
    description: string;
    category?: string;
    cooldown?: number;
    usage?: string;
    config?: {
      prefix?: boolean;
      admin?: boolean;
      moderator?: boolean;
      developer?: boolean;
      privateOnly?: boolean;
    };
  }

  export interface Command {
    manifest: CommandManifest;
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

  export interface Mention {
    id: string;
    fromIndex?: number;
    tag: string;
  }

  export interface StrictMessageForm {
    body?: string;
    attachment?: any[] | any;
    location?: {
      latitude: number;
      longitude: number;
    };
    mentions?: Mention[];
    [key: string]: any;
  }

  export type MessageForm = string | StrictMessageForm;
  export interface Chat {
    send(message: MessageForm, goal?: string, noStyle?: boolean): Promise<any>;
    reply(message: MessageForm, goal?: string): Promise<any>;
  }

  export interface EntryObj {
    api: any;
    chat: Chat;
    event: Event;
    args: string[];
    fonts: Fonts;
    styler: Styler;
    route: Route;
    replies: Map<string, RepliesArg>;
    HoshinoHM: typeof import("../Hoshino/resources/styler/hoshinohomemodular");
    hoshinoDB: import("../Hoshino/resources/plugins/database/utils");
    LevelSystem: typeof import("../Hoshino/resources/plugins/level/utils");
    BalanceHandler: typeof import("../Hoshino/resources/plugins/balance/utils");
    Inventory: typeof import("../Hoshino/resources/plugins/inventory/utils");
    BankHandler: typeof import("../Hoshino/resources/plugins/bank/utils");
  }
  export type CommandContext = EntryObj;

  export interface Fonts {
    sans(text: string): string;
    bold(text: string): string;
    monospace(text: string): string;
  }

  export interface Styler {
    (
      type: string,
      title: string,
      content: string,
      footer: string,
      styles?: any
    ): string;
  }

  export interface Route {
    // chatbotMarin(message: string): Promise<string>;
  }

  export interface RepliesArg {
    callback: (
      entryObj: EntryObj & { ReplyData: TokitoLia.RepliesArg }
    ) => void;
    [key: string]: any;
  }

  export interface Event {
    body: string;
    senderID: string;
    threadID: string;
    messageID: string;
    type: string;
    messageReply?: {
      messageID: string;
      senderID: string;
    };
    [key: string]: any;
  }

  export interface GlobalHoshino {
    // config: {
    //   prefix: string;
    //   maintenance: boolean;
    //   developer: string[];
    //   moderator: string[];
    //   admin: string[];
    // };
    config: typeof import("../settings.json");
    commands: Map<string, Command>;
    events: Map<string, any>;
    cooldowns: Map<string, Record<string, number>>;
    utils: any;
  }
}

declare namespace globalThis {
  var bot: import("events").EventEmitter;
  var Hoshino: HoshinoLia.GlobalHoshino;
}
