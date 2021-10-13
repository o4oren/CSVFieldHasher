const {app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require("fs");
const csv = require('fast-csv');
const crypto = require('crypto')
const {ipcMain} = require('electron');

const HASH_SECRET = process.env.hash_secret ? process.env.hash_secret : "my_secret";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            devTools: !app.isPackaged,
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // listen to events
    ipcMain.on('select-file', (event, arg) => {
        let i;
        let count = 0;
        let headers = [];
        fs.createReadStream(arg)
            .pipe(csv.parse({headers: true, trim: true}))
            .on('headers', h => headers = h)
            .on('error', e => event.reply('select-file-reply', {
                    error: e,
                    count: count
                })
            )
            .on('data', function(chunk) {
                count++;

            })
            .on('end', () => event.reply('select-file-reply', {
                    error: null,
                    count: count -1,
                    file: arg,
                    headers: headers
                })
            );
    });

    ipcMain.on('process-file', (event, arg) => {
        console.log(arg);
        const parsedSrcFile = path.parse(arg.srcFile);

        let dstFile;
        if (arg.dstFile == null) {
            dstFile = path.join(parsedSrcFile.dir, parsedSrcFile.name + "_hashed" + parsedSrcFile.ext);
        }

        try {
            const outputStream = fs.createWriteStream(dstFile);
            let processedLinesCount = -1;
            fs.createReadStream(arg.srcFile)
                .pipe(csv.parse({headers: true, trim: true}))
                .on('error', error => console.error(error))
                .on('data', data => {
                    let row = Object.entries(data).map(([header, value],) => {
                        return header === arg.header ? hashValue(value) : value;
                    });
                    outputStream.write(row + '\n');
                    processedLinesCount++;
                    if(processedLinesCount % 100 == 0) {
                        mainWindow.webContents.send('processed-lines', processedLinesCount);
                    }
                })
                .on('end', rowCount => {
                    console.log(`Parsed ${rowCount} rows`);
                    outputStream.end();
                    mainWindow.webContents.send('processed-lines', processedLinesCount);
                    event.reply('file-processing-done', {
                        success: true,
                        processedLines: rowCount - 1,
                        filePath: dstFile
                    })
                });
        } catch (err) {
            event.reply('file-processing-done', {
                success: false,
                error: err
            })
        }
    });
};

function hashValue(value) {
    const shasum = crypto.createHash('sha1')
    shasum.update(HASH_SECRET + value);
    return shasum.digest('hex').substr(0, 12);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
