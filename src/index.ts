import {
  MessageActionRow,
  Message,
  MessageEmbed,
  MessageButton,
  MessageComponentInteraction,
} from "discord.js";

const buttonList = [
  new MessageButton().setCustomId("previous").setLabel("Previous").setStyle("PRIMARY"),
  new MessageButton().setCustomId("select").setLabel("Select").setStyle("PRIMARY"),
  new MessageButton().setCustomId("next").setLabel("Next").setStyle("PRIMARY"),
  new MessageButton().setCustomId("cancel").setLabel("Cancel").setStyle("DANGER"),
];

export class Pagination {
  private cancelButton = false;
  onSelect?: (index: number) => void;

  constructor(
    private msg: Message,
    private pages: MessageEmbed[],
    private index = 0,
    private timeout = 120000,
  ) {
    if (!pages) throw new Error("Pages are not given.");
  }

  setSelectText(text: string) {
    buttonList[1].setLabel(text);
  }

  setOnSelect(cb: (index: number) => void) {
    this.onSelect = cb;
  }

  addCancelButton() {
    this.cancelButton = true;
  }

  async run() {

    return new Promise<void>(async (resolve) => {
      let page = this.index;
      const row = new MessageActionRow().addComponents(buttonList);

      const curPage = await this.msg.channel.send({
        embeds: [this.pages[page].setFooter({ 
          text: `Page ${page + 1} / ${this.pages.length}` 
        })],
        components: [row],
      });

      const filter = (i: MessageComponentInteraction) => {
        const validButton = buttonList.some(x => x.customId === i.customId);
        const isAuthor = i.user.id === this.msg.author.id;
        return validButton && isAuthor;
      }

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
          case buttonList[3].customId:
            if (this.cancelButton) {
              collector.stop();
              resolve();
              return;
            }
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
          curPage.delete().catch();
        }
      });
    })

  }
}
