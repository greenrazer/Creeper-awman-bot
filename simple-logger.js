class SimpleLogger {
  static info(str){
    console.log(`[INFO] ${str}`);
  }

  static err(err){
    console.error("[ERR][ERR][ERR][ERR][ERR][ERR]");
    console.error(err);
    console.error("[/ERR][/ERR][/ERR][/ERR][/ERR][/ERR]");
  }

  static warn(str) {
    console.log(`[WARN] ${str}`);
  }
}

module.exports = SimpleLogger;