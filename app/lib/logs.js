/*
 * Library for storing and rotating logs
 *
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// container
const logs = {};

// data folder base directory 
logs.baseDir = path.join(__dirname, './../.logs/');


// Append a string to a file
logs.append = (file, str, callback) => {
  // Opening the file
  fs.open(logs.baseDir + file + '.log', 'a', (err, fileDescriptor) => {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, str + "\n", (err) => {
        if (!err) {
          fs.close(fileDescriptor, (err) => {
            if (!err) {
              callback(false);  
            } else {
              callback('Error closing file');
            }
          });
        } else {
          callback('Error appending a file');   
        }
      });
    } else {
      callback('Could not open file for appending');
    }
  });
};

// List all the logs
logs.list = (includeCompressedLogs, callback) => {
  fs.readdir(logs.baseDir, (err, data) => {
    if (!err && data) {
      let trimmedFileNames = [];
      data.forEach((fileName) => {
        // add .log filename
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        // Add on the compressed file .gz files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });

      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

// Compress the content of a file into .fz.b64 file
logs.compress = (logId, newFileId, callback) => {
  let sourceFile = logId + '.log';
  let destFile = newFileId + '.gz.b64';

  // Read the source file
  fs.readFile(logs.baseDir + sourceFile, 'utf-8', (err, inputString) => {
    if (!err && inputString) {
      // Compress
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          // Send the data to destination file
          fs.open(logs.baseDir + destFile,'wx', (err, fileDescriptor) => {
            if (!err && fileDescriptor) {
              // write to destination file
              fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                if (!err) {
                  // close file
                  fs.close(fileDescriptor, (err) => {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(err);
                    }
                  });
                } else {
                  callback(err);
                }
              });
            } else {
              callback(err);
            }
          });
        } else {
          callback(err);
        }
      });
    } else {
      callback(err);
    }
  });
};

logs.decompress = (fileId, callback) => {
  let fileName = fileId + '.gz.b64';

  // Read the source file
  fs.readFile(logs.baseDir + fileName, 'utf-8', (err, string) => {
    if (!err && string) {
      // Decompress data
      let inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err) {
          str = outputBuffer.toString();
          callback(false, str); 
        } else {
          callback(err);
        }
      });

    } else {
      callback(err);
    }
  });
};

logs.truncate = (logId, callback) => {
  fs.truncate(logs.baseDir + logId + '.log', 0, (err) => {
    if (!err) {
      callback(false);
    } else {
      callback(err);
    }
  });
};

// Export the module
module.exports = logs;