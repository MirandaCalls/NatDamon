class ModelSpeedlog {
    constructor(db) {
        this.db = db;
    }
    async addSpeedLog(downloadBits, uploadBits, logtime) {
        await this.db.run(`
            INSERT INTO
                Speedlogs (download_bits, upload_bits, logtime)
            VALUES
                (?, ?, ?)
        `, downloadBits, uploadBits, logtime);
    }
    async getSpeedlogs(startTime, stopTime) {
        return await this.db.all(`
            SELECT
                *
            FROM
                Speedlogs
            WHERE
                logtime >= ?
            AND
                logtime <= ?
            ORDER BY logtime ASC
        `, startTime, stopTime);
    }
}

module.exports = ModelSpeedlog;