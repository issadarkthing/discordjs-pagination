import {
  ActionRowBuilder,
  Message,
  EmbedBuilder,
  ButtonBuilder,
  MessageComponentInteraction,
  CommandInteraction,
  ButtonStyle,
} from "discord.js";

const cancelButton = new ButtonBuilder()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle(ButtonStyle.Danger);

export interface PaginationOptions {
  index?: number;
  timeout?: number;
  userID?: string;
}

export class Pagination {
  private buttonList = [
    new ButtonBuilder()
      .setCustomId("previous")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("select")
      .setLabel("Select")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary),
  ];
  onSelect?: (index: number) => void;
  noSelect = false;

  constructor(
    private i: CommandInteraction,
    private pages: EmbedBuilder[],
    private options?: PaginationOptions,
  ) {
    if (pages.length === 0) throw new Error("Pages requires at least 1 embed");
  }

  setNoSelect(select: boolean) {
    this.noSelect = select;
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

      if (this.noSelect) {
        this.buttonList.splice(1, 1);
      }

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(this.buttonList);

      const curPage = await this.i.editReply({
        embeds: [this.pages[page].setFooter({ 
          text: `Page ${page + 1} / ${this.pages.length}` 
        })],
        components: [row],
      }) as Message<boolean>;

      const filter = (i: MessageComponentInteraction) => {
        if (!i.isButton()) return false;
        //@ts-ignore
        const validButton = this.buttonList.some(x => x.data.custom_id === i.customId);
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
          case "previous":
            page = page > 0 ? --page : this.pages.length - 1;
            break;
          case "select":
            this.onSelect && this.onSelect(page);
            collector.stop();
            return;
          case "next":
            page = page + 1 < this.pages.length ? ++page : 0;
            break;
          //@ts-ignore
          case cancelButton.data.custom_id:
            collector.stop();
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
          this.i.editReply({ content: "\u200b", embeds: [], components: [] })
            .then(() => resolve());
        }
      });
    })

  }
}
