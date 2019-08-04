# CREEPER AW MAN, Discord Bot 
[This][examplevideo] but real.

[examplevideo]: https://www.youtube.com/watch?v=9Py1W5u4zIo

## Using
1. Type `!cbStart <song name>` in discord, and the bot will join your current voice channel.
2. Type the lyrics into chat and the bot will play them, but get it wrong and you will have to start from the begining
3. Type `!cbStop` at anytime to close the bot on your voice channel

## Developing
1. Clone the repository.
2. Add your google auth file by following [this][beforeyoubegingoogleapi] tutorial up to getting the auth json file.
3. Change the name of the json file you got in the last step to `google-auth.json` and put it in your `auth/` directory.
4. Create a discord application and bot [here][discordapp]
  1. Click on new application.
  
   ![new application][newapp]

  2. Type in a name.
  3. Click on bot in the menu.
  
   ![bot in menu][menubot]

  4. Click on new bot.
  
   ![make new bot][newbot]

  5. Under token click copy, paste it into a new json in `auth` called `discord-auth.json` with the key `botToken`.
  
   ![click copy here][tokencopy]

  6. Go to the oauth tab.

   ![the oauth tab][menuoauth]

  7. Create a link, and copy it.

   ![creating a link][createlink]

  8. Paste it in the web browser, and add it to any discord server you are an admin of.
5. `npm run` will run the bot and it will be useable on any server you added it on.

[beforeyoubegingoogleapi]: https://github.com/googleapis/nodejs-text-to-speech#before-you-begin
[discordapp]: https://discordapp.com/developers/applications/
[newapp]: ./README_images/newapp.png
[menubot]: ./README_images/bot.png
[newbot]: ./README_images/newbot.png
[tokencopy]: ./README_images/copykey.png
[menuoauth]: ./README_images/oauth.png
[createlink]: ./README_images/getlink.png

## To add your own song
1. Create a folder in the `songs` titled `<your song name>`.
2. Inside that folder create new file called `lyricfile` and a folder called `audio`.
3. Slice up the song into individual `.wav` files that each hold a lyric inside of them.
4. Each line in the lyricfile should be in the format of `<lyric>,<corresponding .wav file name>`

### Song creation example

- `songs`
  - `testsong`
    - `audio`
      - `file1.wav` File with person saying "hello".
      - `file2.wav` File with person saying "world".
    - `lyricfile`

`lyricfile` should look like this:
```
hello,file1.wav
world,file2.wav
```