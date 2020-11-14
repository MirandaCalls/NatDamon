import RangePicker from './rangepicker.js';

document.addEventListener('DOMContentLoaded', async () => {
    Chart.defaults.global.defaultFontColor = '#fff';
    var speedchart, pingchart;
    var rangepicker_link = document.querySelector('.dropdown-link');
    var picker = new RangePicker(rangepicker_link, async (range) => {
        if (speedchart || pingchart) {
            speedchart.destroy();
            pingchart.destroy();
        }

        var islarge = range.stop.diff(range.start, 'days') > 1;

        var params = new URLSearchParams({
            start: range.start.toISOString(),
            stop: range.stop.toISOString()
        }).toString();

        var res = await fetch('/api/datasets/speed?' + params);
        var data = await res.json();
        speedchart = renderTimeSeries('speedChart', islarge, [
            {
                label: 'Download',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                data: data.download      
            },
            {
                label: 'Upload',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgb(54, 162, 235)',
                data: data.upload      
            },
        ]);

        res = await fetch('/api/datasets/ping?' + params);
        var data = await res.json();
        pingchart = renderTimeSeries('pingChart', islarge, [
            {
                label: 'Latency',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                data: data.latency    
            },
        ]);
    });
    picker.applyNewRange();

    var d_link = document.getElementById('speedchart_download');
    d_link.addEventListener('click', buildChartImageUrl);
    var p_link = document.getElementById('pingchart_download');
    p_link.addEventListener('click', buildChartImageUrl);
});

function renderTimeSeries(chartId, largeRange, datasets) {
    var context = document.getElementById(chartId).getContext('2d');
    return new Chart(context, {
        type: 'line',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: largeRange ? 'day' : 'hour',
                        distribution: 'linear'
                    }
                }]
            }
        }
    });
}

function buildChartImageUrl(evt) {
    var link = evt.currentTarget;
    var chart_id = link.dataset.id;
    var chart = document.getElementById(chart_id);

    var img_url = chart.toDataURL("image/jpg");
    link.href = img_url;
}