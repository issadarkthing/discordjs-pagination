import { Message, MessageEmbed } from "discord.js";
export declare class Pagination {
    private msg;
    private pages;
    private index;
    private timeout;
    onSelect?: (index: number) => void;
    constructor(msg: Message, pages: MessageEmbed[], index?: number, timeout?: number);
    setSelectText(text: string): void;
    setOnSelect(cb: (index: number) => void): void;
    run(): Promise<void>;
}
