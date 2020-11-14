#!/usr/bin/env node
var http = require('http');
var express = require('express');
var moment = require('moment');
var basicAuth = require('express-basic-auth');
var bcrypt = require('bcryptjs');

var utilities = require('../lib/utilities');
var logMessage = utilities.logMessage;

var ModelSpeedlog = require('../models/ModelSpeedlog');
var ModelPinglog = require('../models/ModelPinglog');
var ModelConfig = require('../models/ModelConfig');

var database = require('../lib/database');
var config = new ModelConfig(database);

main().catch(onError);

async function main() {
    utilities.printCliTitle();

    var ready = await config.doesTableExist();
    if (!ready) {
        console.log("Database not initialized. Run setup.js to set up Nat Damon.");
        console.log();
        return;
    }

    var args = require('minimist')(process.argv.slice(2));
    var port = args.port ? args.port : 8080;

    const app = express();
    app.use(basicAuth({
        authorizer: authorizeRequest,
        authorizeAsync: true,
        challenge: true
    }));

    app.use(express.json());
    app.use(express.static('public'));
    app.use(appRouter());

    const server = http.createServer(app);
    server.on('listening', () => {
        console.debug('Listening on port http://localhost:' + port);
    });
    server.on('error', (err) => {
        console.error(err);
    });
    server.listen(port);
}

function onError(error) {
    process.exitCode = 1;
    console.error(error);
    logMessage('server.js exited due to an error.');
}

async function authorizeRequest(username, password, callback) {
    if (username !== 'admin') {
        callback(null, false);
    }

    var passcode_hash = await config.getPasscodeHash();
    if (await bcrypt.compare(password, passcode_hash)) {
        callback(null, true);
    } else {
        callback(null, false);
    }
}

function appRouter() {
    var router = express.Router();
    router.get('/api/datasets/ping', async (req, res) => {
        var data = await getPingDataset(req.query.start, req.query.stop);
        res.send(data);
    });
    router.get('/api/datasets/speed', async (req, res) => {
        var data = await getSpeedlogDataset(req.query.start, req.query.stop);
        res.send(data);
    });
    router.get('/api/config', async (req, res) => {
        var schedule = await config.getCronSchedule();
        res.send(schedule);
    });
    router.put('/api/config', async (req, res) => {
        config.updateConfig(req.body);
        res.send();
    });
    return router;
}

async function getPingDataset(startStr, stopStr) {
    var pinglogs = new ModelPinglog(database);
    var start_time = moment(startStr);
    var stop_time = moment(stopStr);

    var logs = await pinglogs.getPinglogs(start_time.valueOf(), stop_time.valueOf());
    return {
        latency: logs.map((log) => {
            return {
                x: log.logtime,
                y: log.latency
            }
        })
    };
}

async function getSpeedlogDataset(startStr, stopStr) {
    var speedlogs = new ModelSpeedlog(database);
    var start_time = moment(startStr);
    var stop_time = moment(stopStr);

    var logs = await speedlogs.getSpeedlogs(start_time.valueOf(), stop_time.valueOf());
    return {
        download: logs.map((log) => {
            return {
                x: log.logtime,
                y: log.download_bits/1e6
            }
        }),
        upload: logs.map((log) => {
            return {
                x: log.logtime,
                y: log.upload_bits/1e6
            }
        })
    };
}