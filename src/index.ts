import {
  MessageActionRow,
  Message,
  MessageEmbed,
  MessageButton,
  MessageComponentInteraction,
  CommandInteraction,
} from "discord.js";

const cancelButton = new MessageButton()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle("DANGER");

export interface PaginationOptions {
  index?: number;
  timeout?: number;
  userID?: string;
}

export class Pagination {
  private buttonList = [
    new MessageButton().setCustomId("previous").setLabel("Previous").setStyle("PRIMARY"),
    new MessageButton().setCustomId("select").setLabel("Select").setStyle("PRIMARY"),
    new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY"),
  ];
  onSelect?: (index: number) => void;

  constructor(
    private i: CommandInteraction,
    private pages: MessageEmbed[],
    private options?: PaginationOptions,
  ) {
    if (pages.length === 0) throw new Error("Pages requires at least 1 embed");
  }

  setSelectText(text: string) {
    this.buttonList[1].setLabel(text);
    return this;
  }

  setOnSelect(cb: (index: number) => void) {
    this.onSelect = cb;
    return this;
  }

  addCancelButton() {
    this.buttonList.push(cancelButton);
    return this;
  }

  async run() {

    return new Promise<void>(async (resolve) => {
      let page = this.options?.index ?? 0;

      const row = new MessageActionRow()
        .addComponents(this.buttonList);

      const curPage = await this.i.editReply({
        embeds: [this.pages[page].setFooter({ 
          text: `Page ${page + 1} / ${this.pages.length}` 
        })],
        components: [row],
      }) as Message<boolean>;

      const filter = (i: MessageComponentInteraction) => {
        const validButton = this.buttonList.some(x => x.customId === i.customId);
        const target = this.options?.userID || this.i.user.id;
        const isTarget = i.user.id === target;
        return validButton && isTarget;
      }

      const collector = curPage.createMessageComponentCollector({
        filter,
        time: this.options?.timeout || 60_000,
      });

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case this.buttonList[0].customId:
            page = page > 0 ? --page : this.pages.length - 1;
            break;
          case this.buttonList[1].customId:
            this.onSelect && this.onSelect(page);
            collector.stop();
            resolve();
            return;
          case this.buttonList[2].customId:
            page = page + 1 < this.pages.length ? ++page : 0;
            break;
          case cancelButton.customId:
            collector.stop();
            resolve();
            return;
          default:
            break;
        }

        try { await i.deferUpdate(); } catch {}
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
          this.i.editReply({ content: "\u200b", embeds: [], components: [] });
        }
      });
    })

  }
}
