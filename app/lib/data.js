
/*
* Library for data handling
*
*/

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

//Module container
const lib = {};

// data folder base directory 
lib.baseDir = path.join(__dirname, './../.data/');

// write data to a file
lib.create = (dir, filename, data) => {
  return new Promise( (resolve, reject) => {
    // Open file with write permission
    fs.open(lib.baseDir + dir + '/' + filename + '.json', 'wx', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string type
        let stringData = JSON.stringify(data);

        // write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                resolve();
              } else {
                reject('Error closing file');
              }
            })
          } else {
            reject('Error writing to file');
          }
        });
      } else {
        reject('Could not open file. File already existed.');
      }
    });  
  });
};

// read content for a file
lib.read = async (dir, filename) => {
  return new Promise( (resolve, reject) => {
    fs.readFile(lib.baseDir + dir + '/' + filename + '.json', 'utf-8', (err, data) => {
      if (!err && data) {
        let parsedData = helpers.parseJSONObject(data);
        resolve(parsedData);
      } else {
        resolve(null);
      }
    });  
  });
};

// update file content
lib.update = (dir, filename, data) => {
  return new Promise( (resolve, reject) => {
    // Open file with write permission
    fs.open(lib.baseDir + dir + '/' + filename + '.json', 'r+', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string type
        let stringData = JSON.stringify(data);

        // Truncate file content
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    resolve();
                  } else {
                    reject('Error closing existing file');
                  }
                })
              } else {
                reject('Error writing to file');
              }
            });
          } else {
            reject('Error truncating file')
          }
        });

        
      } else {
        reject('Could not open file. File may not exist.');
      }
    });
  });
};


// delete file
lib.delete = (dir, filename) => {
  return new Promise( (resolve, reject) => {
    // unlink the file from filesystem
    fs.unlink(lib.baseDir + dir + '/' + filename + '.json', (err) => {
      if (!err) {
        resolve(true);
      } else {
        resolve(false);
      }
    });  
  });
};

// list all items in a directory
lib.list = (dir) => {
  return new Promise( (resolve, reject) => {
    fs.readdir(lib.baseDir + dir +  '/', (err, data) => {
      if (!err) {
        if (data && data.length > 0) {
          let trimmedFilenames = [];
          data.forEach( fileName => {
            trimmedFilenames.push(fileName.replace('.json', ''));
          });

          resolve(trimmedFilenames);  
        } else {
          resolve([]);
        }
      } else {
        reject(err);
      }
    });  
  });  
};

// Export lib module
module.exports = lib;