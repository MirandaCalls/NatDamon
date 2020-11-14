class ModelPinglog {
    constructor(db) {
        this.db = db;
    }
    async addPinglog(packetCount, packetLoss, latency, logtime) {
        await this.db.run(`
            INSERT INTO
                Pinglogs (packet_count, packet_loss, latency, logtime)
            VALUES
                (?, ?, ?, ?)
        `, packetCount, packetLoss, latency, logtime);
    }
    async getPinglogs(startTime, stopTime) {
        return await this.db.all(`
            SELECT
                *
            FROM
                Pinglogs
            WHERE
                logtime >= ?
            AND
                logtime <= ?
            ORDER BY logtime ASC
        `, startTime, stopTime);
    }
}

module.exports = ModelPinglog;