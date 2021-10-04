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

function copyFiles(list) {
    list.forEach(el => {
        const oldPath = el.href;
        const newPath = path.join(config.paths.output, el.firstSym, el.el);

        fs.copyFile(oldPath, newPath, (err) => {
            if (err) {console.error(err);}
        })
    })
}

function getFiles(pathMy) {
    let list = [];

    getFilesInOneDir(pathMy);

    function getFilesInOneDir(pathIn) {
        let files = fs.readdirSync(pathIn);
    
        files.forEach(el => {
            let localBase = path.join(pathIn, el);
            let state = fs.statSync(localBase)
    
            if (state.isDirectory()) {
                getFilesInOneDir(localBase)
            } else {
                let firstSym = path.parse(localBase).name[0].toUpperCase();
                list.push({el, href: localBase, firstSym})
            }
        })
    }

    return list;
}

if (!fs.existsSync(base)) {
    console.log('input folder is absent!');
    return
}

let filesForReplace = getFiles(base);

if (!filesForReplace.length) {
    console.warn('input folder is empty!');
    return
}

(async () => {
    await asyncDelDir(config.paths.output, { recursive: true });
    await asyncCreateDir(argv.output);

    let newDirName = filesForReplace.map(el => el.firstSym);
    newDirName.forEach(el => {
        const dirname = `${argv.output}/${el}`;
        if (!fs.existsSync(dirname)) {
            fs.mkdirSync(dirname)
        }
    })

    await copyFiles(filesForReplace);
    // deleteDir(config.paths.input);
})()