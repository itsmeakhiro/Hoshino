declare namespace HoshinoLia {
  export interface CmdCommand {
    name: string;
    aliases: string[];
    version: string;
    developer?: string;
    description: string;
    cooldown: number;
    usage: string || string[];
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
    hoshinoDB: import("./")
  }
}