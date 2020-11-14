class ModelConfig {
    constructor(db) {
        this.db = db;
    }

    async getPasscodeHash() {
        var row = await this.db.get(`
            SELECT
                *
            FROM
                Config
            WHERE
                name = "passcode_hash"
        `);
        if (!row) {
            return '';
        }
        return row.value;
    }

    async getCronSchedule() {
        var rows = await this.db.all(`
            SELECT
                *
            FROM
                Config
            WHERE
                name = "cron_pingtest"
            OR
                name = "cron_speedtest"
        `);
        var crons = {};
        for (let row of rows) {
            crons[row.name] = row.value;
        }
        return crons;
    }

    async doesTableExist() {
        var result = await this.db.get(`
            SELECT name FROM sqlite_master WHERE type='table' AND name='Config'
        `);
        if (!result) {
            return false;
        }
        return true;
    }

    async insertConfigValues(config) {
        var sql = `
            INSERT INTO
                Config (name, value)
            VALUES
        `;

        var row_sql = [];
        var values = [];
        for (let name in config) {
            let value = config[name];

            row_sql.push("(?, ?)");
            values.push(name, value);
        }
        sql += row_sql.join(',');

        await this.db.run(sql, values);
    }

    updateConfig(config) {
        var sql = `
            UPDATE
                Config
            SET
                value = ?
            WHERE
                name = ?
        `;

        for (let name in config) {
            let new_value = config[name];
            this.db.run(sql, new_value, name);
        }
    }
}

module.exports = ModelConfig;