const Discord = require("discord.js");
const auth = require("./auth");
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

// Initialize Discord Bot
var bot = new Discord.Client();
bot.login(auth.discordBotToken);

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
  const words = message.content.split(" ");
  switch (words[0]){
    case "!cbStart":
      if(audioHandler == null || !audioHandler.isStarted(vc)){
        lyricsChecker = new LyricsChecker();
        audioHandler = new AudioHandler();
        try {
          await loadSong(words[1]);
          await audioHandler.start(vc);
        }
        catch(err) {
          message.reply(`error playing song ${words[1]}`);
          SimpleLogger.err(err);
        }
      }
      break;
    case "!cbStop":
      if(audioHandler.isStarted(vc)){
        audioHandler.stop(vc);
      }
      break;
    default:
      if(audioHandler.isStarted(vc)){
        let toPlay = [];
        for(let word of words) {
          toPlay.push(lyricsChecker.currWordPos);
          if(!lyricsChecker.isNextWord(word)){
            if(lyricsChecker.currAt > 0){
              SimpleLogger.info("am playing tts" + message.content);
              lyricsChecker.reset();
            }
            return;
          }
        }
        audioHandler.addToQueue(vc, toPlay);
      }
      break;
  }
});

function loadSong(songName) {
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
        lyricsChecker.addNextWord(row[LYRIC]);
        audioHandler.addNextFilename(`./songs/${songName}/audio/${row[FILENAME]}`);
      })
      .on('end', () => {
        if(lyricsChecker.totalLyrics === 0){
          reject(new Error("No lyrics in lyricfile (place lyrics in ./songs/<SONG_NAME_FOLDER>/lyricfile)"));
        }
        SimpleLogger.info(`Finished Loading ${songName}`);
        resolve();
      });
  });
}