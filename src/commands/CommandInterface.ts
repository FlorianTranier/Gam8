import { Message, ReactionEmoji } from "discord.js";

export default interface CommandInterface {

  supportCommand(p: { command: string }): Promise<boolean>

  exec(p: { args: string[], context: Message | undefined }): Promise<void>

}