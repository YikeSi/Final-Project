/*Start by setting up the canvas */
var margin = {t:10,r:10,b:10,l:10};
var width = document.getElementById('plot').clientWidth - margin.r - margin.l,
    height = document.getElementById('plot').clientHeight - margin.t - margin.b;

var canvas = d3.select('.canvas');
var plot = canvas
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//import data
queue()
    //.defer(d3.json,'data/bos_neighborhoods.json')
    .defer(d3.csv,'data/food_inspection.csv')
    .defer(d3.csv,'data/metadataCity.csv')
    .await(dataLoaded)

//lookup table
var failOrPassed =
{'Fail': 0,
    'Pass': 1};

//drawing two plots
function dataLoaded(err,inspection) {

    //buttons
    d3.selectAll('.btn').on('click', function () {
        var id = d3.select(this).attr('id');
        if (id == 'map') {
            plot.selectAll("*").remove();
            drawCities(inspection);
        } else {
            plot.selectAll("*").remove();
            drawOwner(inspection);
        }
    });

    /*---------------------------------------------plot-1-------------------------------------------------*/

    //colors
    var scaleColor = d3.scale.linear().domain([0.4,0.7]).range(['white','red'])
    function drawCities(inspection) {
        //nest data
        var nestedInspections = d3.nest()
            .key(function (d) {
                return d.City
            })
            .entries(inspection)

        //count fails and passes
        nestedInspections.forEach(function (city) {
            console.log(city)
            _fail = city.values.filter(function (inspection) {
                return failOrPassed[inspection.ViolStatus] == 0;
            })
            //console.log(_fail)
            _passed = city.values.filter(function (inspection) {
                return failOrPassed[inspection.ViolStatus] == 1;
            })
            sum_fail = _fail.length
            sum_passed = _passed.length
            city.sum_fail = sum_fail
            city.sum_passed = sum_passed
        })

        //new array
        var data = nestedInspections.map(function (d) {
            return {
                name: d.key,
                percentage: d.sum_fail / (d.sum_fail + d.sum_passed),
                total: d.sum_fail + d.sum_passed
            }
        })


        //console.log(data);
        //console.log(nestedInspections);

        //path generator
        var arcGenerator = d3.svg.arc()
            .innerRadius(270)
            .outerRadius(300);

        //pieLayout
        var pieLayout = d3.layout.pie().value(function (d) {
            return d.percentage
        })
            .padAngle(.02)

        //console.log(pieLayout(data));

        //drawing slices
        var pieChart = plot.append('g').attr('transform', 'translate(' + width / 2 + ',' + height/2 + ')')
        var slices = pieChart.selectAll('.violatecount')
            .data(pieLayout(data))
            .enter()
            .append('g')
            .attr('class', 'violatecount')
        slices.append('path')
            .attr('class', 'slices')
            .attr('d', arcGenerator)
            .on('mouseover', attachTooltip)
            .style('fill', function (d) {
                //console.log(d)
                return scaleColor(d.data.percentage)
            })

        //tooltips
        function attachTooltip(data) {
            //console.log(data)
            d3.selectAll('.slices')
                .on('mouseenter', function (d) {
                    var tooltip = d3.select('.custom-tooltip');
                    tooltip
                        .transition()
                        .style('opacity', 1);

                    console.log(d)

                    tooltip.select('#type').html(d.data.name);
                    tooltip.select('#value').html('conducted inspections' + ':' + d.data.total);
                    tooltip.select('#tag').html()
                    tooltip.select('#percentage').html(d3.format('%,')(d.data.percentage));
                })
                .on('mousemove', function () {
                    var xy = d3.mouse(canvas.node());
                    //console.log(xy);

                    var tooltip = d3.select('.custom-tooltip');

                    tooltip
                        .style('left', xy[0] + 50 + 'px')
                        .style('top', (xy[1] + 50) + 'px');

                })
                .on('mouseleave', function () {
                    var tooltip = d3.select('.custom-tooltip')
                        .transition()
                        .style('opacity', 0);
                })

        }
    }
    /*-------------------------------------plot2-----------------------------------------------------------*/
    function drawOwner(inspection) {
        //console.log(inspection)
        var nestedOwners = d3.nest()
            .key(function (d) {
                return d.NameLast + ' ' + d.NameFirst
            })
            .key(function (d) {
                return d.BusinessName
            })
            .sortKeys(d3.ascending)
            .key(function(d){
                return d.ViolStatus
            })
            .rollup(function(leaves){return leaves.length})
            .entries(inspection)
        //console.log(inspection)
        //.entries(inspection)
        //console.log(nestedOwners)

        nestedOwners.sort(function (a, b) {
            return b.values.length - a.values.length
        })
        //console.log(nestedOwners)
        var slicebyOwners = nestedOwners.slice(0, 23)
        //console.log(slicebyOwners)

        slicebyOwners.forEach(function (owners) {
            //console.log(owners)
            var F = [];
            var P = [];
            _fail = owners.values.forEach(function (restaurant) {
                //console.log(restaurant)
                fail = restaurant.values.filter(function(inspection){
                    //console.log(inspection)
                    if(inspection.key == 'Fail'){
                        F.push(inspection.values)
                    }else{P.push(inspection.values)};
                })


            })
            //console.log(F)
            //console.log(P)
            sum_fail = d3.sum(F,function(d){return d})
            sum_pass = d3.sum(P,function(d){return d})
            //console.log(sum_fail)
            //console.log(sum_pass)
            owners.sum_fail = sum_fail
            owners.sum_pass = sum_pass
        })
        //console.log(sum_fail)
        //console.log(_fail)
        //console.log(slicebyOwners)

        var data = slicebyOwners.map(function (d) {
            return {
                name: d.key,
                fail: d.sum_fail,
                pass: d.sum_pass,
                total: d.sum_fail + d.sum_pass,
                rank: d.values.length,
            }
        })
        //console.log(data)
        data.forEach(function (each) {
            //console.log(each)
            var arcGenerator = d3.svg.arc().innerRadius(10).outerRadius(20)
            var pieLayout = d3.layout.pie();
            pieLayout.value(function (d) {return d;})
            var GroupOwner = plot
                .selectAll('.pie-chart-group')
                .data(data)
                .enter()
                .append('g')
                .attr('class','pie-chart-group')
                .attr('transform', function (d, i) {
                    //console.log(d,i)
                    if (i < 6) {return 'translate(' + (width * i +600)/6 + ',' + height*.11 + ')'}
                    else if (i<12){return 'translate(' + (width * (i-6) +600) / 6 + ',' + height *.4 + ')'}
                    else if (i<18){return 'translate(' + (width * (i-12)+600) / 6 + ',' + height*.65 + ')'}
                    else{return 'translate(' + (width * (i-18) +600) / 6 + ',' + height*.9 + ')'}
                })
            var node = GroupOwner
                .append('circle')
                .attr('class','rank')
                .attr('r',function(d){return d.rank*10})
                .style('fill','grey')

            node.on('mouseover',MouseOver)

            GroupOwner
                .selectAll('.arc')
                .data(function(d){return pieLayout([d.fail, d.pass])})
                .enter()
                .append('path')
                .attr('class', 'arc')
                .attr('d', arcGenerator)
                .attr("fill", function (d, i) {
                    if (i == 0) {
                        return "red"
                    } else {
                        return "blue";
                    }
                })

            function MouseOver (d){
                node
                    .on('mouseenter', function (d) {
                        //console.log(d)
                        var tooltip = d3.select('.custom-tooltip');
                        tooltip
                            .transition()
                            .style('opacity', 1);

                        tooltip.select('#type').html(d.name);
                        tooltip.select('#value').html('resturants'+ ":" + d.rank);
                        tooltip.select('#tag').html('pass rate');
                        tooltip.select('#percentage').html(d3.format("%,")(d.pass/ d.total));
                    })
                    .on('mousemove', function () {
                        var xy = d3.mouse(canvas.node());
                        //console.log(xy);

                        var tooltip = d3.select('.custom-tooltip');

                        tooltip
                            .style('left', xy[0] + 50 + 'px')
                            .style('top', (xy[1] + 50) + 'px');

                    })
                    .on('mouseleave', function () {
                        var tooltip = d3.select('.custom-tooltip')
                            .transition()
                            .style('opacity', 0);
                    })
            }
        });
    }


}





