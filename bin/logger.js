#!/usr/bin/env node
var exec = require('child_process').exec;
var util = require('util');
var ping = require('ping');
var csv = require('csvtojson');
var CronJob = require('cron').CronJob;
var AsyncLock = require('async-lock');

var execAsync = util.promisify(exec);

var utilities = require('../lib/utilities');
var logMessage = utilities.logMessage;

var ModelPinglog = require('../models/ModelPinglog');
var ModelSpeedlog = require('../models/ModelSpeedlog');
var ModelConfig = require('../models/ModelConfig');

var lock = new AsyncLock();
var database = require('../lib/database');
var config = new ModelConfig(database);

main().catch(onError);

async function main() {
    await utilities.printCliTitle();

    var ready = await config.doesTableExist();
    if (!ready) {
        console.log("Database not initialized. Run setup.js to set up Nat Damon.");
        console.log();
        return;
    }

    var crons = {};
    updateConfiguration(crons, true);
    setInterval(() => {
        updateConfiguration(crons);
    }, 30000);
}

function onError(error) {
    process.exitCode = 1;
    console.error(error);
    logMessage('logger.js exited due to an error.');
}

async function updateConfiguration(crons, initialize = false) {
    var schedule = await config.getCronSchedule();
    if (Object.keys(schedule).length !== 2) {
        logMessage('Cron configuration required.')
        return;
    }

    if (initialize) {
        // Runs on the initial logger startup
        startCrons(schedule, crons);
        return;
    }

    if (hasCronScheduleChanged(schedule, crons)) {
        crons.ping.stop();
        crons.speed.stop();
        startCrons(schedule, crons);
    }
}

function startCrons(schedule, crons) {
    crons.ping = new CronJob(schedule.cron_pingtest, () => {
        lock.acquire('test', runPingtest);
    });
    crons.ping.start();

    crons.speed = new CronJob(schedule.cron_speedtest, () => {
        lock.acquire('test', runSpeedtest);
    });
    crons.speed.start();

    logMessage('Loaded cron configuration and started.');
}

function hasCronScheduleChanged(schedule, crons) {
    var ping_schedule = crons.ping.cronTime.source;
    var speed_schedule = crons.speed.cronTime.source;
    if (
           ping_schedule != schedule.cron_pingtest
        || speed_schedule != schedule.cron_speedtest
    ) {
        return true;
    }

    return false;
}

async function runPingtest() {
    var time = new Date();
    var packets = 10;
    var host = 'www.google.com';
    var res = await ping.promise.probe(host, {
        extra: ['-c', packets]
    });
    
    var pinglogs = new ModelPinglog(database);
    await pinglogs.addPinglog(packets, res.packetLoss, res.avg, time.getTime());
    logMessage('Ran pingtest.');
}

async function runSpeedtest() {
    var time = new Date();
    var result = await execAsync('speedtest-cli --csv');
    var data = await csv({noheader: true}).fromString(result.stdout);
    data = data[0];

    var speedlogs = new ModelSpeedlog(database);
    await speedlogs.addSpeedLog(
        parseFloat(data.field7), parseFloat(data.field8), time.getTime()
    );
    logMessage('Ran speedtest.');
}