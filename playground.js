/**
 * Created by swarnavallabhaneni on 24/03/15.
 */

var numericLineChartSpec = {
    "height": 75, "width": 450, "padding": "auto",
    "data": [
        {"name": "table"}
    ],
    "scales": [
        {"range": "category10", "name": "color", "type": "ordinal"},
        {"range": "height", "name": "y", "domain": [0, 100], "type": "linear", "nice": true},
        {"range": "width", "name": "x", "domain": {"data": "table", "field": "data.x"}, "type": "linear", "nice": true}
    ],
    "axes": [
        {"scale": "x", "type": "x", "orient": "bottom", "ticks": 5},
        {"scale": "y", "type": "y", "orient": "left", "ticks": 5}
    ],
    "marks": [
        {
            "type": "line",
            "from": {"data": "table"},
            "properties": {
                "enter": {
                    "stroke": {"value": "steelblue"},
                    "y": {"scale": "y", "field": "data.y"},
                    "x": {"scale": "x", "field": "data.x"}
                }
            }
        }
    ]
};

var ordinalLineChartSpec = {
    "height": 75, "width": 450, "padding": "auto",
    "data": [
        {"name": "table"}
    ],
    "scales": [
        {"name": "x", "padding": 1, "points": true, "domain": {"data": "table", "field": "data.x"}, "range": "width", "type": "ordinal"},
        {"range": "height", "name": "y", "domain": [0, 100], "type": "linear", "nice": true}
    ],
    "axes": [
        {"scale": "x", "type": "x", "orient": "bottom"},
        {"scale": "y", "type": "y", "orient": "left", "ticks": 5}
    ],
    "marks": [
        {
            "type": "line",
            "from": {"data": "table"},
            "properties": {
                "enter": {
                    "stroke": {"fill": "steelblue"},
                    "y": {"scale": "y", "field": "data.y"},
                    "x": {"scale": "x", "field": "data.x"}}
            }
        }
    ]};


function pnorm(z) {
    // Algorithm AS66 Applied Statistics (1973) vol22 no.3
    // Computes P(Z<z)
    z = parseFloat(z);
    upper = false;
    ltone = 7.0;
    utzero = 18.66;
    con = 1.28;
    a1 = 0.398942280444;
    a2 = 0.399903438504;
    a3 = 5.75885480458;
    a4 = 29.8213557808;
    a5 = 2.62433121679;
    a6 = 48.6959930692;
    a7 = 5.92885724438;
    b1 = 0.398942280385;
    b2 = 3.8052e-8;
    b3 = 1.00000615302;
    b4 = 3.98064794e-4;
    b5 = 1.986153813664;
    b6 = 0.151679116635;
    b7 = 5.29330324926;
    b8 = 4.8385912808;
    b9 = 15.1508972451;
    b10 = 0.742380924027;
    b11 = 30.789933034;
    b12 = 3.99019417011;

    if (z < 0) {
        upper = !upper;
        z = -z;
    }
    if (z <= ltone || upper && z <= utzero) {
        y = 0.5 * z * z;
        if (z > con) {
            alnorm = b1 * Math.exp(-y) / (z - b2 + b3 / (z + b4 + b5 / (z - b6 + b7 / (z + b8 - b9 / (z + b10 + b11 / (z + b12))))));
        }
        else {
            alnorm = 0.5 - z * (a1 - a2 * y / (y + a3 - a4 / (y + a5 + a6 / (y + a7))));
        }
    }
    else {
        alnorm = 0;
    }
    if (!upper) alnorm = 1 - alnorm;
    return (alnorm);
}


function slug(str) {
    var $slug = '';
    var trimmed = $.trim(str);
    $slug = trimmed.replace(/[^a-z0-9-_]/gi, '-').
        replace(/-+/g, '-').
        replace(/^-|-$/g, '');
    return $slug.toLowerCase();
}


function getFeatureList(json) {
    var features = [];
    $.each(json['model'], function(i, model) {
        $.each(model['cluster-conditions'], function(_, c) {
            if (features.indexOf(c['variable']) == -1){
                features.push(c['variable']);
            }
        });
        $.each(model['equation']['rankedFeatures'], function(_, feature) {
            if (features.indexOf(feature) == -1) {
                features.push(feature);
            }
        })
    });
    return features;
}


function populateFeatureTable(json, elem){
    var features = getFeatureList(json);
    var metaData = json['meta-data'];
    var defaults = json['defaults'];

    var html = '', valueHTML = '';
    var featureDefault, units, featureMeta, rounding;
    $.each(features, function(i, feature) {
        featureMeta = metaData[feature];
        if (featureMeta['sType'] == "numeric") {
            units = featureMeta['units'];
            if (units == 'time' || units == 'percent') {
                rounding = 2;
            } else {
                rounding = 0
            }
            featureDefault = (parseFloat(defaults[feature]) / parseFloat(featureMeta['resDivisor'])).toFixed(rounding);
            valueHTML = '<div class="form-group variable-value"><input type="text" class="form-control" id="'
            + feature + '-values" placeholder="' + featureDefault + '"> ' + featureMeta['resUnit'] + '</div>';
        } else {
            featureDefault = defaults[feature];
            valueHTML = '<div class="form-group variable-value"><select class="form-control" id="' + feature + '-values">';
            $.each(featureMeta['uniqueValues'], function(_, value) {
                valueHTML += '<option';
                if (value == featureDefault) {
                    valueHTML += ' selected="selected"'
                }
                valueHTML += '>' + value + '</option>';
            });
            valueHTML += '</select></div>';
        }

        html += "<tr><td>" + i +
        "</td><td id='" + feature + "'>" + feature +
        "</td><td>" + featureDefault + " " + featureMeta['resUnit'] +
        "</td><td>" + valueHTML +
        "</td><td>" + '<div class="chart" id="' + slug(feature) + '-chart"></div>' + "</td></tr>";
    });
    elem.append(html);
    return features;
}


function makeAndUpdateChart(json, variable) {
    var chartData;
    var chartName = '#' + slug(variable) + "-chart";

    var currentValues = getValuesInForm(json);
    var currentZScore = get_scores(currentValues, json);
    var chartSpec;

    var variableDetails = json['meta-data'][variable];

    var varType = variableDetails['sType'];
    var variableRange;
    var pScore = pnorm(currentZScore) * 100;

    // Initializing charts to constant pScores

    var divisor;

    if (varType == 'numeric') {
        chartSpec = numericLineChartSpec;
        var stats = variableDetails['stats'];
        divisor = parseFloat(variableDetails['resDivisor']);
        variableRange = [parseFloat(stats['5%']) / divisor, parseFloat(stats['95%']) / divisor];
        chartData = new Array(101);
        var increment = (variableRange[1] - variableRange[0]) / 100;
        for (var i = 0; i < 101; i++) {
            chartData[i] = {'x': variableRange[0] + i * increment, 'y': pScore};
        }
    } else {
        chartSpec = ordinalLineChartSpec;
        variableRange = variableDetails['uniqueValues'];
        var length = variableRange.length;
        chartData = new Array(length);
        for (i = 0; i < length; i++) {
            var level = variableRange[i];
            chartData[i] = {'x': level, 'y': pScore};
        }
    }

    length = chartData.length;

    for (i = 0; i < length; i++) {
        currentValues[variable] = chartData[i]['x'];
        if (varType == 'numeric') {
            currentValues[variable] *= divisor
        }
        chartData[i]['y'] = scoreModel(currentValues, json);
    }
    chartData.sort(function (a, b) {return (a.x < b.x) ? -1 : ((a.x > b.x) ? 1 : 0)});
    bindDataAndRenderChart(chartSpec, chartName, chartData);
}


function bindDataAndRenderChart(spec, element, dataJSON) {
    vg.parse.spec(spec, function (chart) {
        var userChart = chart({el: element, renderer: 'canvas'});
        userChart.data({table: dataJSON});
        userChart.update();
    });
}



function buildCharts(json) {
    var featureList = getFeatureList(json);
    $.each(featureList, function(_, variableName) {
        makeAndUpdateChart(json, variableName);
    })
}


function addListenersToModelForms(form, json) {
    updateScore(json);
    buildCharts(json);
    form.change(function() {
        updateScore(json);
        buildCharts(json);
    })
}


function getValuesInForm(json) {
    var xValues = {}, value;

    $('.variable-value :input').each(function () {
        var $this = $(this);
        var variableName = $this.attr('id').replace('-values', '');
        if ($this.val() == '') {
            value = json['defaults'][variableName];
        } else {
            value = $this.val();
            if (json['meta-data'][variableName]['sType'] == 'numeric') {
                value = parseFloat(value) * parseFloat(json['meta-data'][variableName]['resDivisor']);
            }
        }
        xValues[variableName] = value;
    });

    return xValues;
}


function get_cluster_equation(model, xValues) {
    var clusterFound = false;
    var clusterCount = model.length;
    var cluster = 0;
    var conditionsPresent, conditionsMet;
    var range, value;
    while (clusterFound == false) {
        conditionsPresent = model[cluster]['cluster-conditions'].length;
        conditionsMet = 0;

        $.each(model[cluster]['cluster-conditions'], function(_, c) {
            range = c['range'];
            value = xValues[c['variable']];
            if (c['condition'] == '<=' && value <= range[0]) {
                conditionsMet += 1;
            } else if (c['condition'] == '>' && value > range[0]) {
                conditionsMet += 1;
            } else if (c['condition'] == 'in' && range.indexOf(value) >= 0) {
                conditionsMet += 1;
            } else if (c['condition'] == 'not in' && range.indexOf(value) == -1) {
                conditionsMet += 1;
            }
        });

        if (conditionsMet == conditionsPresent || cluster == clusterCount - 1) {
            clusterFound = true;
        } else {
            cluster += 1;
        }
    }

    var equation = model[cluster]['equation'];

    return equation
}


function get_scores(xValues, json) {
    var equation = get_cluster_equation(json['model'], xValues);
    var score = equation['intercept'];
    $.each(equation['rankedFeatures'], function(_, feature) {
        var value = xValues[feature];
        if (json['meta-data'][feature]['sType'] == 'numeric') {
            score += value * parseFloat(equation[feature]['beta']['linear'])
            + value * value * parseFloat(equation[feature]['beta']['square']);
        } else {
            if (!(value in equation[feature]['constants'])) {
                value = json['defaults'][feature];
            }
            score += parseFloat(equation[feature]['constants'][value]);
        }
    });
    return score;
}


function scoreModel(xValues, json) {
    var zScore = get_scores(xValues, json);
    return pnorm(zScore) * 100;
}


function updateScore(json) {
    // Calculates and updates score on the top
    var newScore = scoreModel(getValuesInForm(json), json);
    $('#probability').html(newScore.toFixed(2) + "%");
}
