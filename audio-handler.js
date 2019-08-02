const fs = require('fs');
const SimpleLogger = require("./simple-logger");

class AudioHandler {
  constructor(){
    this.posToFilename = new Map();
    this.idToData= new Map();
    this.numFiles = 0;
  }

  addNextFilename(filename) {
    this.posToFilename.set(this.numFiles++, filename);
  }

  static idFromVoiceChannel(voiceChannel) {
    return voiceChannel.name + voiceChannel.guild.id;
  }

  isStarted(voiceChannel) {
    return this.idToData.has(AudioHandler.idFromVoiceChannel(voiceChannel));
  }

  async start(voiceChannel){
    const connection = await voiceChannel.join().catch(console.error);
    const id = AudioHandler.idFromVoiceChannel(voiceChannel);
    this.idToData.set(id, {"connection": connection, "queue": [], "isPlaying":false, "dispatcher": null});
  }

  stop(voiceChannel) {
    const id = AudioHandler.idFromVoiceChannel(voiceChannel);
    const data = this.idToData.get(id);
    if(data["dispatcher"]){data["dispatcher"].end();}
    voiceChannel.leave();
    this.idToData.delete(id);
  }

  addToQueue(voiceChannel, nums) {
    if(!this.isStarted(voiceChannel)){
      return;
    }
    const data = this.idToData.get(AudioHandler.idFromVoiceChannel(voiceChannel));
    for(let num of nums) {
      if(!this.posToFilename.has(num)){
        throw "Is Adding a file that does not exist."
      }
      // const readStream = fs.createReadStream(this.posToFilename.get(num));
      // data["queue"].push(readStream);
      data["queue"].push(this.posToFilename.get(num));
    }
    if(!data["isPlaying"]) {
      this.play(voiceChannel);
    }
  }

  async play(voiceChannel) {
    const data = this.idToData.get(AudioHandler.idFromVoiceChannel(voiceChannel));
    if(data["queue"].length > 0){
      data["isPlaying"] = true;
      // const dispatcher = data["connection"].playConvertedStream(data["queue"].shift());
      const dispatcher = data["connection"].playFile(data["queue"].shift());
      dispatcher.on("end", () => {
        this.play(voiceChannel);
      });
      dispatcher.on("error", (err) => {
        SimpleLogger.err(err);
      });
      data["dispatcher"] = dispatcher;
    }
    else {
      data["isPlaying"] = false;
    }
  }
}

module.exports = AudioHandler;