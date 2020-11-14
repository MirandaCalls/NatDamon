var sqlite3 = require('sqlite3');
var util = require('util');
var fs = require('fs');
var path = require('path');

var db = new sqlite3.Database(path.join(__dirname, '../app.db'));
module.exports = {
    init: function() {
        var init_path = path.join(__dirname, 'schema.sql');
        var init_sql = fs.readFileSync(init_path, 'utf-8');
        this.exec(init_sql);
    },
    run: util.promisify(db.run.bind(db)),
    get: util.promisify(db.get.bind(db)),
	all: util.promisify(db.all.bind(db)),
	exec: util.promisify(db.exec.bind(db))
};