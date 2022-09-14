import { Client, EmbedBuilder } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { config } from "dotenv";
import { Pagination } from "..";

config();

const client = new Client({
  intents: ["Guilds", "GuildMessages"],
});

const testCommand = new SlashCommandBuilder()
  .setName("test")
  .setDescription("testing command for button handling")
  .toJSON();

const rest = new REST({ version: "9" }).setToken(process.env.BOT_TOKEN!);

client.on("ready", () => {
  rest.put(Routes
    .applicationGuildCommands(
      client.user!.id, 
      process.env.GUILD_ID!
    ),
      { body: [testCommand] },
    )
    .then(() => console.log("registered application commands"))
    .catch(err => console.log(err));
})

client.on("interactionCreate", async i => {

  if (i.isCommand()) {

    await i.reply("Test");

    const embed1 = new EmbedBuilder()
      .setColor("Random")
      .setDescription("alpha");

    const embed2 = new EmbedBuilder()
      .setColor("Random")
      .setDescription("beta");

    let pagination = new Pagination(i, [embed1, embed2]);
    pagination.addCancelButton();
    await pagination.run();

    pagination = new Pagination(i, [embed1, embed2]);
    pagination.addCancelButton();
    await pagination.run();
  }

})

client.login(process.env.BOT_TOKEN).then(() => console.log(`bot is up`));


