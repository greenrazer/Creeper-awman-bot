const fs = require('fs');
const util = require('util');
const SimpleLogger = require("./simple-logger");
const streamifier = require("streamifier");

const PlayType = {
  FILENAME: 0,
  STREAM: 1,
}

const QueueParts = {
  DATA: 0,
  TYPE: 1,
  BITRATE: 2,
}

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
        throw new Error("Is adding a file that does not exist.");
      }

      this.pushQueue(data, this.posToFilename.get(num), PlayType.FILENAME, 1411);
    }

    if(!data["isPlaying"]) {
      this.play(voiceChannel);
    }
  }

  async play(voiceChannel) {
    const data = this.idToData.get(AudioHandler.idFromVoiceChannel(voiceChannel));
    if(data["queue"].length > 0){
      data["isPlaying"] = true;
      const currQueue = data["queue"].shift();

      let dispatcher;
      switch(currQueue[QueueParts.TYPE]) {
        case PlayType.FILENAME:
          dispatcher = data["connection"].playFile(currQueue[QueueParts.DATA]);
          break;
        case PlayType.STREAM:
          dispatcher = data["connection"].playArbitraryInput(currQueue[QueueParts.DATA], {bitrate:currQueue[QueueParts.BITRATE]});
          break;
        default:
          throw new Error("Invalid PlayType");
      }

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

  pushQueue(queueWrapper, data, type = PlayType.FILENAME, bitrate = null){
    queueWrapper["queue"].push([data,type,bitrate]);
  }
}

module.exports = AudioHandler;