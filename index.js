const path = require('path');
const util = require('util');
const fs = require('fs');

const yargs = require('yargs');

const {version} = require('./package.json');

const argv = yargs
    .usage('Usage: node $0 [option...]')
    .help('help')
    .alias('help', 'h')
    .version(version)
    .alias('version', 'v')
    .options({
        'output': {
            alias: 'o',
            describe: 'Path for output folder',
            demandOption: true,
            type: "string"
        },
        'input': {
            alias: 'i',
            describe: 'Path for input folder',
            demandOption: true,
            type: "string"
        }
    })
    .argv

const config = {
    paths: {
        input: path.normalize(path.join(__dirname, argv.input)),
        output: path.normalize(path.join(__dirname, argv.output))
    }
}

const asyncDelDir = util.promisify(fs.rmdir);
const asyncCreateDir = util.promisify(fs.mkdir);

const base = config.paths.input;

function copyFileNew(el) {
    const oldPath = el.href;
    const newPath = path.join(config.paths.output, el.firstSym, el.el);

    fs.copyFile(oldPath, newPath, (err) => {
        if (err) { console.error(err); }
    })
}

function getFiles(pathIn) {
    fs.readdir(pathIn, (err, files) => {
        files.forEach(el => {
            let localBase = path.join(pathIn, el);
            fs.stat(localBase, (err, status) => {
                if (status) {
                    if (status.isDirectory()) {
                        getFiles(localBase)
                    } else {
                        const firstSym = path.parse(localBase).name[0].toUpperCase();
                        const dirname = `${argv.output}/${firstSym}`;
                        
                        // fs.exists(dirname, (e) => {
                        //     if (e) {
                        //         copyFileNew({el, href: localBase, firstSym})
                        //     } else {
                                fs.mkdir(dirname, (err) => {
                                    // if (!err) {
                                    //     copyFileNew({el, href: localBase, firstSym})
                                    // } else {
                                        copyFileNew({el, href: localBase, firstSym})
                                    // }
                                })
                        //     }
                        // })
                    }
                }
            })
        })
    });
}

fs.exists(base, (e) => {
    if (e) {
        
        fs.rmdir(config.paths.output, {recursive: true}, (err) => {
            if (!err) {
                fs.mkdir(argv.output, (err) => {
                    if (!err) {
                        getFiles(base);
                    }
                })
            }
        })

        // let filesForReplace = getFiles(base);

        // if (!filesForReplace.length) {
        //     console.warn('input folder is empty!');
        //     return
        // }

        // (async () => {
        //     await asyncDelDir(config.paths.output, { recursive: true });
        //     await asyncCreateDir(argv.output);

        //     let newDirName = filesForReplace.map(el => el.firstSym);
        //     newDirName.forEach(el => {
        //         const dirname = `${argv.output}/${el}`;

        //         if (!fs.existsSync(dirname)) {
        //             fs.mkdirSync(dirname)
        //         }
                
        //     })

        //     await copyFiles(filesForReplace);
        //     // deleteDir(config.paths.input);
        // })()

    } else {
        console.log('input folder is absent!');
        return
    }
})

// npm start -- -i src -o dist