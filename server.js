const Discord = require("discord.js");
const DiscordAuth = require("./auth/discord-auth");
const csv = require('csv-parser');
const fs = require('fs');
const LyricsChecker = require("./lyrics-checker");
const AudioHandler = require("./audio-handler");
const SimpleLogger = require("./simple-logger");

const ROW_LENGTH = 2;
const LYRIC = 0;
const FILENAME = 1;

let lyricsChecker;
let audioHandler;

let ServerInfo = new Map();

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(DiscordAuth.botToken);

bot.on('ready', function () {
  SimpleLogger.info('Discord bot connected.');
  SimpleLogger.info('Logged in as: ');
  SimpleLogger.info(bot.user.username + ' - (' + bot.user.id + ')');
});

// if bot sees a message in chat
bot.on('message', async (message) => {
  const vc = message.member.voiceChannel;
  if(!vc) {
    return;
  }
  const id = AudioHandler.idFromVoiceChannel(vc);
  const words = message.content.split(" ");
  switch (words[0]){
    case "!cbStart":
      if(!ServerInfo.has(id) || !ServerInfo.get(id)["audioHandler"].isStarted(vc)){
        ServerInfo.set(id, {
          "lyricsChecker": new LyricsChecker(),
          "audioHandler": new AudioHandler()
        });
        try {
          await loadSong(words[1], id);
          await ServerInfo.get(id)["audioHandler"].start(vc);
        }
        catch(err) {
          message.reply(`error playing song ${words[1]}`);
          SimpleLogger.err(err);
        }
      }
      break;
    case "!cbStop":
      if(ServerInfo.get(id)["audioHandler"].isStarted(vc)){
        ServerInfo.get(id)["audioHandler"].stop(vc);
      }
      break;
    default:
      if(!ServerInfo.has(id)){
        return;
      }

      if(ServerInfo.get(id)["audioHandler"].isStarted(vc)){
        let toPlay = [];
        for(let word of words) {
          toPlay.push(ServerInfo.get(id)["lyricsChecker"].currWordPos);
          if(!ServerInfo.get(id)["lyricsChecker"].isNextWord(word)){
            if(ServerInfo.get(id)["lyricsChecker"].currAt > 0){
              SimpleLogger.info(`Text To Speech ${message.content}`);
              ServerInfo.get(id)["lyricsChecker"].reset();
            }
            return;
          }
        }
        await ServerInfo.get(id)["audioHandler"].addToQueue(vc, toPlay);
      }
      break;
  }
});

function loadSong(songName, id) {
  return new Promise((resolve, reject) => {
    SimpleLogger.info(`Loading ${songName}`);
    const filestream = fs.createReadStream(`./songs/${songName}/lyricfile`)
      .on('error', (err) => {
        reject(err);
      });
    filestream.pipe(csv({headers: false}))
      .on('data', (row) => {
        if(Object.keys(row).length != ROW_LENGTH){
          reject(new Error("Invalid lyric file (maybe extra/missing comma?)"));
        }
        if (!fs.existsSync(`./songs/${songName}/audio/${row[FILENAME]}`)) {
          reject(new Error(`${row[FILENAME]} does not exist.`));
        }
        ServerInfo.get(id)["lyricsChecker"].addNextWord(row[LYRIC]);
        ServerInfo.get(id)["audioHandler"].addNextFilename(`./songs/${songName}/audio/${row[FILENAME]}`);
      })
      .on('end', () => {
        if(ServerInfo.get(id)["lyricsChecker"].totalLyrics === 0){
          reject(new Error("No lyrics in lyricfile (place lyrics in ./songs/<SONG_NAME_FOLDER>/lyricfile)"));
        }
        SimpleLogger.info(`Finished Loading ${songName}`);
        resolve();
      });
  });
}