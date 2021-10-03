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
    // .option('input', {
    //     alias: 'i',
    //     describe: 'Path for input folder',
    //     required: true,
    //     type: "string"
    // })
    // .option('output', {
    //     alias: 'o',
    //     describe: 'Path for input folder',
    //     required: true,
    //     type: "string"
    // })
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

// const readDir = util.promisify(fs.readdir)

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

function deleteDir (path) {
    fs.rmdirSync(path, { recursive: true })
}

if (!fs.existsSync(base)) {
    console.log('input folder is absent!');
    return
}

let array = [];

const readDir = (base) => {
    const files = fs.readdirSync(base);

    files.forEach(el => {
        let localBase = path.join(base, el);
        let state = fs.statSync(localBase)

        if (state.isDirectory()) {
            readDir(localBase)
        } else {
            let firstSym = path.parse(localBase).name[0].toUpperCase();
            array.push({el, href: localBase, firstSym})
        }
    })
}

readDir(base);

if (!array.length) {
    console.warn('input folder is empty!');
    return
}

deleteDir(config.paths.output);

fs.mkdir(argv.output, () => {

    let newDirName = array.map(el => el.firstSym);
    // console.warn(newDirName);
    // console.warn(config.paths.output);
    newDirName.forEach(el => {
        // const dirname = path.join(argv.output, el)
        const dirname = `${argv.output}/${el}`;
        if (!fs.existsSync(dirname)) {
            // console.warn('создаем: ', dirname);
            fs.mkdirSync(dirname)
        }
    })

    copyFiles(array);
    // deleteDir(config.paths.input);
})

