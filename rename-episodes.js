/*
  script to iterate through media files and change the subs files
  to be the same as the media files
*/
 
// dependencies
const fs = require('fs');
const chalk = require('chalk');
const extensions = require('./extens.json');

// vars
let path = process.cwd(),
mediaSelector, 
subSelector;

// init
(function init (path) {
  console.log(chalk.yellow(`${`Folder: ${path}`}`));
  return dirList(path);
})(path);

// list all dir files' names
function dirList(path) {
  fs.readdir(path, (err, files) => {
    if (err) throw err;
    files.some((file) => {
      if (file.match(/(\.\w+\d?)$/gi)) {
        const ext = file.match(/(\.\w+\d?)$/gi)[0];
        if (extensions['media'][ext]) {
          mediaSelector = ext;
        } else if (extensions['subs'][ext]) {
          subSelector = ext;
        }  
      }
    });
    return filterFiles(files, mediaSelector, subSelector);
  });

}

// filter only files that is any mediaSelector as provided
// and subSelector files
function filterFiles(files, mediaSelector, subSelector) {
  const mediaFiltered = [];
  const subFiltered = [];

  files.forEach((file) => {
    if (file.includes(`${mediaSelector}`)) {
      mediaFiltered.push(file.replace(`${mediaSelector}`, `${subSelector}`));
    } else if (file.includes(`${subSelector}`)) {
      subFiltered.push(file);
    }
  });  
  return matchFiles(mediaFiltered, subFiltered);
}

// match episodes number for both file names returning
// an object that has the old names as keys and new names
// as values
function matchFiles(mediaFiles, subFiles) {
  const mediaNames = mediaFiles.reduce((mediaNames, currentName) => {
    let number = extractEpisodesNumber(currentName);
    mediaNames[number] = currentName;
    return mediaNames;
  }, {});

  const renameFiles = subFiles.reduce((subFiles, currentName) => {
    let number = extractEpisodesNumber(currentName);
    subFiles[currentName] = mediaNames[number];
    return subFiles;
  }, {});  
  return renameAllFiles(renameFiles);
}

// episode number extraction
function extractEpisodesNumber(currentName) {
  let number;
  if (/\[?s?\d+?e(\d+)/gi.test(currentName)) {
    number = parseInt(/\[?s?\d+?e(\d+)/gi.exec(currentName)[1]);      
  } else if (/\[?\d+x?(\d+)/g.test(currentName)) {
    number = parseInt(/\[?\d+x?(\d+)/g.exec(currentName)[1]);
  } else {
    number = currentName.match(/\d+/g);
  }
  return number;
}

// rename each file as the old name is an object key 
// and the new name is its value
function renameAllFiles(filesObject) {
  let counter = 0;
  Object.keys(filesObject).forEach((subName) => {    
    if (filesObject[subName] && subName) {      
      fs.rename(`${path}\\${subName}`, `${path}\\${filesObject[subName]}`, (err, _) => {
        if (err) throw err;
        counter += 1;
        console.log(`${chalk.yellow('Renamed:')} ${chalk.green(`${filesObject[subName]}`)}`);
        
        if (counter === Object.keys(filesObject).length) {
          console.log(`${chalk.yellow(counter)} ${chalk.blue(`Files Renamed!`)}`)
        }
      });
    }
  });
}



      

