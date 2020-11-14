document.addEventListener('DOMContentLoaded', async () => {
    var res = await fetch('/api/config');
    var config = await res.json();

    var speed_select = document.getElementById('speed_select');
    speed_select.value = config.cron_speedtest;
    var ping_select = document.getElementById('ping_select');
    ping_select.value = config.cron_pingtest;

    document.getElementById('save_button').addEventListener('click', updateConfig);
});

async function updateConfig() {
    var save_button = document.getElementById('save_button');
    save_button.classList.add('disabled');

    var speed_select = document.getElementById('speed_select');
    var ping_select = document.getElementById('ping_select');
    await fetch('/api/config', {
        method: 'put',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cron_speedtest: speed_select.value,
            cron_pingtest: ping_select.value
        })
    });
    setTimeout(() => {
        save_button.classList.remove('disabled');
    }, 1000);
}