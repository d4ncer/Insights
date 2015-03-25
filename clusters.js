/**
 * Created by swarnavallabhaneni on 25/03/15.
 */


function populateClusters(json, body) {
    var models = json['model'];
    var length = models.length;
    var meta = json['meta-data'];

    var headlineHTML = 'We found ' + length + ' clusters in your data.';
    body.find('.cluster-headline').html(headlineHTML);

    var $table = body.find('.table');

    $.each(models, function(i, m) {
        var clusterConditions = m['cluster-conditions'];
        clusterConditions.sort(function (a, b) {return parseFloat(a['id'] - b['id'])});

        var leaf = clusterConditions[clusterConditions.length - 1];

        var modelHTML = '<tr>';

        modelHTML += '<td>' + (i + 1) + '</td>'; // cluster number
        modelHTML += '<td>' + leaf.size + '</td>'; // leaf size
        modelHTML += '<td>' + (parseFloat(leaf.meanY) * 100).toFixed(0) + ' %</td>'; // leaf y-bar

        var clusterDefHTML = '<td><ol>';
        $.each(clusterConditions, function(_, c) {
            clusterDefHTML += '<li>' + c['variable'] + ' <b>' + c['condition'] + '</b> ';
            var featureMeta = meta[c['variable']];
            if (featureMeta['sType'] == 'numeric') {
                console.log(c['variable'], c['range'][0], featureMeta['resDivisor']);
                clusterDefHTML += (parseFloat(c['range'][0]) / parseFloat(featureMeta['resDivisor'])).toFixed(1) + ' '
                + featureMeta['resUnit']
            } else {
                clusterDefHTML += '<ol>';
                $.each(c['range'], function(_, value) {
                    clusterDefHTML += '<li>' + value + '</li>';
                });
                clusterDefHTML += '</ol>';
            }
            clusterDefHTML += '</li>'
        });
        clusterDefHTML += '</ol></td>';
        modelHTML += clusterDefHTML;

        var featureHTML = '<td><ol>';
        $.each(m['equation']['rankedFeatures'], function(i, feature) {
            if (i < 4) {
                featureHTML += '<li>' + feature + '</li>';
            }
        });

        featureHTML += '</ol></td>';
        modelHTML += featureHTML;

        modelHTML += '</tr';

        $table.append(modelHTML);
    });

}