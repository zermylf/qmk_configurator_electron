import * as temp from 'temp';
import * as path from 'path';
import * as selector from './modules/selector';
import {https} from 'follow-redirects';
import * as fs from 'fs';
import {remote} from 'electron';
import log from 'electron-log';

temp.track();

/**
 * Download keymap from API before initiating programmer selection
 * @param {string} url URL from compiler API for file download
 * @param {string} keyboard Name of keyboard
 * @param {string} filename Name of file to save download to
 * @module window.Bridge
 * @returns void
 */
export function flashURL(url, keyboard, filename) {
  console.log(url, keyboard, filename);
  temp.mkdir('qmkconfigurator', function(err, dirPath) {
    window.tempFolder = dirPath;
    window.Bridge.statusAppend('----STARTING URL FLASHING PROCEDURES----');
    window.inputPath = path.join(dirPath, filename);
    const inputPath = window.inputPath;
    console.log(inputPath);
    const pipeFile = fs.createWriteStream(inputPath);
    https
      .get(url, function(response) {
        response.pipe(pipeFile);
        pipeFile.on('finish', function() {
          console.log('finish downloads');
          selector.routes(keyboard);
          pipeFile.close();
        });
      })
      .on('error', function(err) {
        // Handle errors
        log.error(err);
        fs.unlink(inputPath); // Delete the file async. (But we don't check the result)
      });
  });
}

/**
 * Flash a custom file
 * @returns void
 */
export function flashFile() {
  window.Bridge.statusAppend('----STARTING FILE FLASHING PROCEDURES----');
  const {dialog} = remote;
  dialog
    .showOpenDialog({
      filters: [{name: '.bin, .hex', extensions: ['bin', 'hex']}],
      properties: ['openFile'],
    })
    .then(({canceled, filePaths}) => {
      if (canceled) {
        window.Bridge.statusAppend('Flash Cancelled');
        return;
      }
      if (filePaths.length === 1) {
        console.log(filePaths);
        window.inputPath = filePaths[0];
        selector.routes();
      }
    });
}
