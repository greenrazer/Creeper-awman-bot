class LyricsChecker {

  constructor(){
    this.posToLyric = new Map();
    this.numLyrics = 0;
    this.reset();
  }

  fromDict(posToLyric, numLyrics){
    this.posToLyric = posToLyric;
    this.numLyrics = numLyrics;
    this.reset();
  }

  addNextWord(word) {
    this.posToLyric.set(this.numLyrics++, word);
  }

  reset() {
    this.currAt = 0;
  }

  isNextWord(word) {
    if(this.toLyric(this.currAt) === word) {
      this.currAt++;
      return true;
    }
    else {
      return false;
    }
  }

  toLyric(word){
    return this.posToLyric.get(word);
  }

  get currWordPos() {
    return this.currAt;
  }

  get totalLyrics() {
    return this.numLyrics;
  }
}

module.exports = LyricsChecker;