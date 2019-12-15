import Controller from '@ember/controller';
import { htmlSafe } from '@ember/template';
import { observer } from '@ember/object';
import { set } from '@ember/object';
import "chartjs-chart-box-and-violin-plot";

export default Controller.extend({
    queryParams: ['epoch'],
    epoch: null,
    interval: "N/A",

    chartData: observer('epoch', function() {
        this.send('getChartData');
    }),

    init: function() {
        this._super();

        this.epochs = false;

        this.line_chart_options = {
            responsive: true,
            spanGaps: false,
            legend: {
                display: false
            },
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

        this.box_chart_options = {
            responsive: true,
            legend: {
                display: false
            },
            title: {
                display: true,
                text: 'CPU Benchmark (low and short is better)'
            },
            tooltips: {
                mode: 'nearest',
                position: 'average',
                intersect: false,
                displayColors: false,
                callbacks: {
                    title: function(tooltipItem, data) {
                        return data['datasets'][tooltipItem[0]['datasetIndex']].label;
                    },
                    label: function() {
                        return '';
                    },
                    afterLabel: function(tooltipItem, data) {
                        let stats = data['datasets'][tooltipItem['datasetIndex']].data[0].__stats;
                        //var dataset = data['datasets'][0];
                        //var percent = Math.round((dataset['data'][tooltipItem['index']] / dataset["_meta"][0]['total']) * 100)
                        return `min: ${stats.min}\nmax: ${stats.max}\nmedian: ${stats.median}\nq1: ${stats.q1.toFixed(4)}\nq3: ${stats.q3.toFixed(4)}`;
                    }
                },
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
    },
    generateColor: function() {
        var o = Math.round, r = Math.random, s = 255;
        return o(r()*s) + ',' + o(r()*s) + ',' + o(r()*s);
    },
    actions: {
        getEpochs() {
            fetch('https://api.eon.llc/v1/benchmarks/epochs')
            .then((res) => res.json())
            .then((data) => {
                if(!this.get('epoch')) { this.set('epoch', data[0]); }
                this.set('epochs', data);
            });
        },
        getChartData() {
            fetch('https://api.eon.llc/v1/benchmarks/benchmarks?epoch=' + this.get('epoch'))
            .then((res) => res.json())
            .then((data) => {
                this.set('interval', data.interval);
                const benchmarks = data.benchmarks || [];
                let line_chart_data = this.get('line_chart_data') || {labels: [], datasets: [], fill: false};
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

                    if(this.get('line_chart_data')) {
                        for(let d=0; d<line_chart_data.datasets.length; d++) {
                            if(line_chart_data.datasets[d].label === producers[i]) {
                                line_chart_data.datasets[d].data = producer_timeline;
                            }
                        }
                    } else {
                        line_chart_data.datasets.push({
                            label: producers[i],
                            hidden: false,
                            marker: htmlSafe("background-color: " + color),
                            backgroundColor: 'rgba('+color+', 0.7)',
                            borderColor: 'rgba('+color+', 1)',
                            data: producer_timeline,
                            fill: false,
                        });
                    }
                }

                line_chart_data.labels = timeline;

                let box_chart_data = JSON.parse(JSON.stringify(line_chart_data));

                for(let i=0; i<box_chart_data.datasets.length; i++) {
                    box_chart_data.datasets[i].data = [ [...box_chart_data.datasets[i].data] ];
                    box_chart_data.labels = [ [...box_chart_data.labels] ];
                }

                this.set('box_chart_data', box_chart_data);
                this.set('line_chart_data', line_chart_data);
                this.set('num_results', line_chart_data.datasets.filter(ds => !ds.hidden).reduce((a, b) => a + b.data.length, 0));
                this.notifyPropertyChange('box_chart_data');
                this.notifyPropertyChange('line_chart_data');

            });
        },
        updateEpoch(value) {
            this.preserveScrollPosition = true;
            this.set('epoch', value);
        },
        toggle(target) {
            let line_chart_data = this.get('line_chart_data');
            let box_chart_data = this.get('box_chart_data');

            line_chart_data.datasets.forEach(function(ds) {
                if(target) {
                    if(target === ds.label){ set(ds, "hidden", !ds.hidden); }
                } else {
                    set(ds, "hidden", !ds.hidden);
                }
            });

            box_chart_data.datasets.forEach(function(ds) {
                if(target) {
                    if(target === ds.label){ set(ds, "hidden", !ds.hidden); }
                } else {
                    set(ds, "hidden", !ds.hidden);
                }
            });

            this.set('num_results', line_chart_data.datasets.filter(ds => !ds.hidden).reduce((a, b) => a + b.data.length, 0));
            this.set('line_chart_data', line_chart_data);
            this.set('box_chart_data', box_chart_data);
            this.notifyPropertyChange('box_chart_data');
            this.notifyPropertyChange('line_chart_data');
        }
    }
});