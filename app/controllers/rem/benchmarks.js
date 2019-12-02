import Controller from '@ember/controller';
import { observer } from '@ember/object';

export default Controller.extend({
    queryParams: ['epoch'],
    epoch: null,
    interval: "N/A",
    num_results: 0,

    chartData: observer('epoch', function() {
        this.send('getChartData');
    }),

    init: function() {
        this._super();

        this.epochs = false;

        this.chart_options = {
            responsive: true,
            spanGaps: false,
            title: {
                display: true,
                text: 'CPU Benchmark (lower is better)'
            },
            tooltips: {
                mode: 'index',
                intersect: true,
                itemSort: function(i0, i1) {
                    let v0 = i0.yLabel;
                    let v1 = i1.yLabel;
                    return (v0 < v1) ? -1 : (v0 > v1) ? 1 : 0;
                }
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: false,
                    scaleLabel: {
                        display: true,
                        labelString: 'Time'
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Exec. time (ms)'
                    }
                }]
            }
        };

        this.send('getEpochs');
    },
    generateColor: function() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    actions: {
        getEpochs() {
            fetch('//52.0.126.177/epochs')
            .then((res) => res.json())
            .then((data) => {
                if(!this.get('epoch')) { this.set('epoch', data[0]); }
                this.set('epochs', data);
            });
        },
        getChartData() {
            fetch('//52.0.126.177/benchmarks/' + this.get('epoch'))
            .then((res) => res.json())
            .then((data) => {
                this.set('interval', data.interval);
                const benchmarks = data.benchmarks || [];
                let chart_data = {labels: [], datasets: [], fill: false};
                let timeline = [];
                let producers = [];

                for(let i=0; i<benchmarks.length; i++) {
                    if(!timeline.includes(benchmarks[i].timestamp)) {
                        timeline.push(benchmarks[i].timestamp);
                    }
                }

                timeline.sort();

                for(let i=0; i<benchmarks.length; i++) {
                    let entry = benchmarks[i];

                    if(!producers.includes(entry.producer)){
                        producers.push(entry.producer);
                    }
                }

                for(let i=0; i<producers.length; i++) {
                    let color = this.generateColor();
                    let producer_timeline = [];

                    timeline_loop:
                    for(let k=0; k<timeline.length; k++) {
                        let timestamp = timeline[k];

                        // if producer has a an entry on this day
                        for(let b=0; b<benchmarks.length; b++) {
                            let benchmark = benchmarks[b];

                            if(benchmark.producer == producers[i]) {

                                if(benchmark.timestamp == timestamp) {
                                    producer_timeline.push(benchmark.mean_ms);
                                    continue timeline_loop;
                                }
                            }
                        }

                        producer_timeline.push(null);
                    }

                    chart_data.datasets.push({
                        label: producers[i],
                        backgroundColor: color,
                        borderColor: color,
                        data: producer_timeline,
                        fill: false,
                    });
                }

                chart_data.labels = timeline;
                this.set('chart_data', chart_data);
                this.set('num_results', benchmarks.length);
            });
        },
        updateEpoch(value) {
            this.preserveScrollPosition = true;
            this.set('epoch', value);
        },
        toggle() {
            let chart_data = this.get('chart_data');

            chart_data.datasets.forEach(function(ds) {
                ds.hidden = !ds.hidden;
            });

            this.set('chart_data', chart_data);
            this.notifyPropertyChange('chart_data');
        }
    }
});