/*
  script to iterate through media files and change the subs files
  to be the same as the media files
*/

// dependencies
const fs = require('fs');
const chalk = require('chalk');
const extensions = require('./extens.json');
const { join } = require('path');

// vars
const path = process.cwd();

// init
(async function init(path) {
  try {
    console.log(chalk.yellow(`${`Folder: ${path}`}`));
    const { mediaFiles, subFiles } = await dirList(path);
    const episodes = matchEpisodes(mediaFiles, subFiles);
    const renamedFilesNumber = renameFiles(episodes);
    console.log(
      `${chalk.blue('Renamed')}: ${chalk.green(`${renamedFilesNumber} files!`)}`
    );
  } catch (error) {
    console.error(chalk.red(error));
  }
})(path);

// list all dir files' names
function dirList(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, allDirFiles) => {
      if (err) reject(err);
      const { mediaFiles, subFiles } = extractFilesWithExtensions(allDirFiles);
      if (mediaFiles && subFiles) {
        resolve({ mediaFiles, subFiles });
      }
      reject('No supported files!');
    });
  });
}

// Extrect files with media and subtitles extensions
function extractFilesWithExtensions(allDirFiles) {
  const mediaFiles = [];
  const subFiles = [];
  allDirFiles.forEach(file => {
    // Match with the extension after the dot
    if (file.match(/(\.\w+\d?)$/gi)) {
      const ext = file.match(/(\.\w+\d?)$/gi)[0];
      if (extensions['media'][ext]) {
        mediaFiles.push({
          media: file,
          mediaExt: ext
        });
      } else if (extensions['subs'][ext]) {
        subFiles.push({
          subtitle: file,
          subExt: ext
        });
      }
    }
  });
  return { mediaFiles, subFiles };
}

// Check Episode numbers
// episode number extraction
function extractEpisodesNumber(currentName) {
  let number;
  if (/\[?s?\d+?e(\d+)/gi.test(currentName)) {
    number = parseInt(/\[?s?\d+?e(\d+)/gi.exec(currentName)[1]);
  } else if (/\[?\d+x(\d+)/gi.test(currentName)) {
    number = parseInt(/\[?\d+x?(\d+)/gi.exec(currentName)[1]);
  } else if (/\.\d(\d+)\./.exec(currentName)) {
    number = parseInt(/\.\d(\d+)\./.exec(currentName)[1]);
  } else {
    number = parseInt(/\d(\d+)/.exec(currentName)[1]);
  }
  return number;
}

// Match
function matchEpisodes(mediaFiles, subFiles) {
  /*
   * iterate through both the media files objects
   * and subtitles objects to match their episode
   * numbers and add them to a new object (episodes)
   * to its data attribute
   */
  const episodes = { data: {} };
  mediaFiles.forEach(mediaFile => {
    const mediaName = mediaFile.media;
    const mediaNum = extractEpisodesNumber(mediaName);
    episodes.data[mediaNum] = mediaFile;
  });

  subFiles.forEach(subFile => {
    const subName = subFile.subtitle;
    const subtitleExt = subFile.subExt;
    const subNum = extractEpisodesNumber(subName);
    const episode = episodes.data[subNum];
    if (episode) {
      episode['subtitle'] = subName;
      episode['subtitleExt'] = subtitleExt;
    }
  });
  return episodes;
}

// Rename all sub files to their media files
function renameFiles(episodesOb) {
  // counter for renamed subtitles
  let counter = 0;
  const episodes = episodesOb.data;
  for (const episode in episodes) {
    if (episodes[episode].media && episodes[episode].subtitle) {
      const currentEpisode = episodes[episode];
      const mediaExt = currentEpisode.mediaExt;
      const subExt = currentEpisode.subtitleExt;
      const oldName = currentEpisode.subtitle;
      const newName = currentEpisode.media.replace(mediaExt, subExt);
      const oldPath = join(path, oldName);
      const newPath = join(path, newName);
      fs.renameSync(oldPath, newPath);
      console.log(`${chalk.blue('Renamed')}: ${chalk.yellow(`${oldPath}`)}`);
      counter += 1;
    } else {
      console.log('Extras!');
    }
  }
  return counter;
}
