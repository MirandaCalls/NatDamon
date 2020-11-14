#!/usr/bin/env node
var promisify = require('util').promisify;
var bcrypt = require('bcryptjs');
var prompt = require('prompt');
var fs = require('fs');
var csv = require('csvtojson');
var moment = require('moment');

var promptGetAsync = promisify(prompt.get);
var fsStatAsync = promisify(fs.stat);

var utilities = require('../lib/utilities');
var ModelConfig = require('../models/ModelConfig');
var ModelSpeedlog = require('../models/ModelSpeedlog');

var database = require('../lib/database');
var config = new ModelConfig(database);

main().catch(onError);

async function main() {
    await utilities.printCliTitle();

    var args = require('minimist')(process.argv.slice(2), {
        boolean: ["help", "h", "setPasscode"],
        string: ["importSpeedlogs"]
    });

    if (args.h || args.help) {
        printHelp();
        return;
    }

    var initialized = await config.doesTableExist();
    if (!initialized) {
        database.init();
        config.insertConfigValues({
            cron_pingtest: '*/5 * * * *',
            cron_speedtest: '0 */4 * * *',
            passcode_hash: ''
        });
        console.log("Initialized database.");
    }

    var passcode_hash = await config.getPasscodeHash();
    if ('' === passcode_hash || args.setPasscode) {
        await setPasscode();
    }

    if (args.importSpeedlogs) {
        await importSpeedlogs(args.import);
    }
    console.log("Completed setup utility.");
}

function onError(error) {
    process.exitCode = 1;
    console.error(error);
}

function printHelp() {
	console.log("setup.js usage:");
	console.log("");
	console.log("--help, -h                  print this help");
	console.log("--import={FILEPATH}         read file from {FILEPATH}");
	console.log("");
	console.log("");
}

async function setPasscode() {
    var schema = {
        properties: {
            passcode: {
                message: "Choose a passcode to sign into Nat Damon",
                hidden: true
            }
        }
    };

    prompt.start();
    var vals = await promptGetAsync(schema);

    var hashed = await bcrypt.hash(vals.passcode, 8);
    config.updateConfig({
        passcode_hash: hashed
    });
    console.log("Passcode saved. Log into Nat Damon using the username 'admin'.");
    console.log();
}

async function importSpeedlogs(filepath) {
    try {
        await fsStatAsync(filepath);
    } catch(error) {
        throw new Error('File does not exist: ' + filepath);
    }

    var readstream = fs.createReadStream(filepath);
    var records = await csv().fromStream(readstream);
    
    var entry = records[0];
    if (!entry.download_bits || !entry.upload_bits || !entry.logtime) {
        throw new Error("CSV headers required: download_bits, upload_bits, logtime");
    }

    var imports = [];
    var speedlogs = new ModelSpeedlog(database);
    for (entry of records) {
        let time = moment(entry.logtime);
        imports.push(speedlogs.addSpeedLog(entry.download_bits, entry.upload_bits, time.valueOf()));
    }

    await Promise.all(imports);

    //Import data 
    console.log("Imported log data from: " + filepath);
}