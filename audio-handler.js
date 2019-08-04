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
  constructor(googleTTSClient){
    this.posToFilename = new Map();
    this.idToData= new Map();
    this.numFiles = 0;
    this.googleTTSClient = googleTTSClient;
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
        throw "Is adding a file that does not exist."
      }

      // const readStream = fs.createReadStream(this.posToFilename.get(num));
      // this.pushQueue(data, readStream, PlayType.STREAM, 1411);
      this.pushQueue(data, this.posToFilename.get(num), PlayType.FILENAME, 1411);
    }

    if(!data["isPlaying"]) {
      this.play(voiceChannel);
    }
  }

  async addTTSToQueue(voiceChannel, sentence) {
    if(!this.isStarted(voiceChannel)){
      return;
    }

    const request = {
      input: {text: sentence},
      // Select the language and SSML Voice Gender (optional)
      voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
      // Select the type of audio encoding
      audioConfig: {audioEncoding: 'LINEAR16'},
    };

    const audioData = (await this.googleTTSClient.synthesizeSpeech(request))[0].audioContent;

    const id = AudioHandler.idFromVoiceChannel(voiceChannel);

    const data = this.idToData.get(id);

    const writeFile = util.promisify(fs.writeFile);
    await writeFile(`./temp_audio/${id}.wav`, audioData, 'binary');

    this.pushQueue(data, `./temp_audio/${id}.wav`, PlayType.FILENAME, 384);
    // this.pushQueue(data, streamifier.createReadStream(audioData), PlayType.FILENAME, 384);

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
          dispatcher = data["connection"].playFile(currQueue[QueueParts.DATA], {bitrate:currQueue[QueueParts.BITRATE]});
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

  pushQueue(queueWrapper, data, type = PlayType.FILENAME, bitrate = 1411){
    queueWrapper["queue"].push([data,type,bitrate]);
  }
}

module.exports = AudioHandler;