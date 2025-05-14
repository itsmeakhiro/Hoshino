import * as chat from "./system/handler/chat";
import FontSys from "../Hoshino/resources/styler/fonts";
import {
  HoshinoUser,
  HoshinoEXP,
  HoshinoQuest,
} from "../Hoshino/resources/plugins/level/utils";
import * as ccc from "./system/handler/chat";

declare global {
  var bot: import("events").EventEmitter;
  var Hoshino: HoshinoLia.GlobalHoshino;

  namespace HoshinoLia {
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
    export interface ChatInstance
      extends ReturnType<typeof chat.ChatContextor> {}
    type CC = typeof chat.ChatContextor;

    export interface ChatContextor extends CC {}

    export interface EntryObj {
      api: any;
      chat: ChatInstance;
      event: Event;
      args: string[];
      ChatContextor: ChatContextor;
      fonts: Fonts;
      styler: Styler;
      route: Route;
      replies: Map<string, RepliesArg>;
      HoshinoHM: typeof import("../Hoshino/resources/styler/hoshinohomemodular").default;
      hoshinoDB: import("../Hoshino/resources/plugins/database/utils");
      Inventory: typeof import("../Hoshino/resources/plugins/inventory/utils");
      HoshinoUser: typeof HoshinoUser;
      HoshinoQuest: typeof HoshinoQuest;
      HoshinoEXP: typeof HoshinoEXP;
      ChatResult: typeof ccc.ChatResult;
    }
    export type CommandContext = EntryObj;

    export type Fonts = typeof FontSys;

    export type Styler = typeof import("../Hoshino/resources/styler/styler");

    export interface Route {
      // chatbotMarin(message: string): Promise<string>;
    }

    export interface RepliesArg {
      callback: (
        entryObj: EntryObj & { ReplyData: HoshinoLia.RepliesArg }
      ) => void | Promise<void>;
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
      isWeb?: boolean;
      [key: string]: any;
    }

    export interface HoshinoUtils {
      /**
       * Removes 'web:' prefix from user ID
       * @param senderID - The user ID to clean
       * @returns - The cleaned user ID
       */
      cleanUserID(senderID: string): string;
      loadCommands(): Promise<void>;
      loadEvents(): Promise<void>;
    }

    export interface GlobalHoshino {
      config: typeof import("../settings.json");
      commands: Map<string, Command>;
      events: Map<string, any>;
      reacts: Map<string, any>;
      cooldowns: Map<string, Record<string, number>>;
      utils: HoshinoUtils;
      isLoading?: boolean;
    }
  }

  var utils: HoshinoLia.HoshinoUtils;
}

export {};
