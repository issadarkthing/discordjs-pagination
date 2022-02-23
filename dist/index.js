"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = void 0;
const discord_js_1 = require("discord.js");
const buttonList = [
    new discord_js_1.MessageButton().setCustomId("previous").setLabel("Previous").setStyle("PRIMARY"),
    new discord_js_1.MessageButton().setCustomId("select").setLabel("Select").setStyle("PRIMARY"),
    new discord_js_1.MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY"),
];
class Pagination {
    constructor(msg, pages, index = 0, timeout = 120000) {
        this.msg = msg;
        this.pages = pages;
        this.index = index;
        this.timeout = timeout;
        if (!pages)
            throw new Error("Pages are not given.");
    }
    setSelectText(text) {
        buttonList[1].setLabel(text);
    }
    setOnSelect(cb) {
        this.onSelect = cb;
    }
    async run() {
        return new Promise(async (resolve) => {
            let page = this.index;
            const row = new discord_js_1.MessageActionRow().addComponents(buttonList);
            const curPage = await this.msg.channel.send({
                embeds: [this.pages[page].setFooter({
                        text: `Page ${page + 1} / ${this.pages.length}`
                    })],
                components: [row],
            });
            const filter = (i) => {
                const validButton = buttonList.some(x => x.customId === i.customId);
                const isAuthor = i.user.id === this.msg.id;
                return validButton && isAuthor;
            };
            const collector = curPage.createMessageComponentCollector({
                filter,
                time: this.timeout,
            });
            collector.on("collect", async (i) => {
                switch (i.customId) {
                    case buttonList[0].customId:
                        page = page > 0 ? --page : this.pages.length - 1;
                        break;
                    case buttonList[1].customId:
                        this.onSelect && this.onSelect(page);
                        collector.stop();
                        resolve();
                        return;
                    case buttonList[2].customId:
                        page = page + 1 < this.pages.length ? ++page : 0;
                        break;
                    default:
                        break;
                }
                await i.deferUpdate();
                await i.editReply({
                    embeds: [this.pages[page].setFooter({
                            text: `Page ${page + 1} / ${this.pages.length}`
                        })],
                    components: [row],
                });
                collector.resetTimer();
            });
            collector.on("end", (_, reason) => {
                if (reason !== "messageDelete") {
                    curPage.delete().catch();
                }
            });
        });
    }
}
exports.Pagination = Pagination;
