(function () {

    var myConnector = tableau.makeConnector();

    myConnector.getColumnHeaders = function () {
        _retrieveJsonData(0, function (tableData) {
            var headers = tableData.headers;
            var fieldNames = [];
            var fieldTypes = [];

            for (var fieldName in headers) {
                if (headers.hasOwnProperty(fieldName)) {
                    fieldNames.push(fieldName);
                    fieldTypes.push(headers[fieldName]);
                }
            }
            tableau.headersCallback(fieldNames, fieldTypes); // tell tableau about the fields and their types
        });
    };

    myConnector.getTableData = function (lastRecordToken) {
        _retrieveJsonData(1, function (tableData) {
            var rowData = tableData.rowData;
            tableau.dataCallback(rowData, rowData.length.toString(), false);
        });
    };

    tableau.registerConnector(myConnector);
})();

function _retrieveJsonData(mode, retrieveDataCallback) {
    var conData = JSON.parse(tableau.connectionData);
    $.ajax({
        url: conData.config.qRisottoUrl + '/v1/doc/' + conData.config.appId + '/hypercube/json',
        type: "POST",
        data: JSON.stringify(JSON.parse(conData.config.qHyperCubeDef)),
        contentType: "application/json",
        complete: function (data, status) {
            conData.jsonString = JSON.stringify(data.responseJSON);
            tableau.connectionData = JSON.stringify(conData);
            _retrieveJsonDataPost(conData.jsonString, retrieveDataCallback);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            tableau.abortWithError("q-risotto Error:\n" + textStatus + "\n" + errorThrown);
        }
    });
}

function _retrieveJsonDataPost(jsonString, retrieveDataCallback) {
    try {
        window.cachedTableData = _jsToTable(JSON.parse(jsonString));
    } catch (e) {
        tableau.abortWithError("unable to parse json data");
        return;
    }
    retrieveDataCallback(window.cachedTableData);
}

// Takes a hierarchical javascript object and tries to turn it into a table
// Returns an object with headers and the row level data
function _jsToTable(objectBlob) {
    var rowData = _flattenData(objectBlob);
    var headers = _extractHeaders(rowData);
    return {
        "headers": headers,
        "rowData": rowData
    };
}

// Given an object:
//   - finds the longest array in the object
//   - flattens each element in that array so it is a single object with many properties
// If there is no array that is a descendent of the original object, this wraps
// the input in a single element array.
function _flattenData(objectBlob) {
    // first find the longest array
    var longestArray = _findLongestArray(objectBlob, []);
    if (!longestArray || longestArray.length == 0) {
        // if no array found, just wrap the entire object blob in an array
        longestArray = [objectBlob];
    }
    for (var ii = 0; ii < longestArray.length; ++ii) {
        _flattenObject(longestArray[ii]);
    }
    return longestArray;
}

// Given an object with hierarchical properties, flattens it so all the properties
// sit on the base object.
function _flattenObject(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && typeof obj[key] == 'object') {
            var subObj = obj[key];
            _flattenObject(subObj);
            for (var k in subObj) {
                if (subObj.hasOwnProperty(k)) {
                    obj[key + '_' + k] = subObj[k];
                }
            }
            delete obj[key];
        }
    }
}

// Finds the longest array that is a descendent of the given object
function _findLongestArray(obj, bestSoFar) {
    if (!obj) {
        // skip null/undefined objects
        return bestSoFar;
    }

    // if an array, just return the longer one
    if (obj.constructor === Array) {
        // I think I can simplify this line to
        // return obj;
        // and trust that the caller will deal with taking the longer array
        return (obj.length > bestSoFar.length) ? obj : bestSoFar;
    }
    if (typeof obj != "object") {
        return bestSoFar;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var subBest = _findLongestArray(obj[key], bestSoFar);
            if (subBest.length > bestSoFar.length) {
                bestSoFar = subBest;
            }
        }
    }
    return bestSoFar;
}

// Given an array of js objects, returns a map from data column name to data type
function _extractHeaders(rowData) {
    var toRet = {};
    for (var row = 0; row < rowData.length; ++row) {
        var rowLine = rowData[row];
        for (var key in rowLine) {
            if (rowLine.hasOwnProperty(key)) {
                if (!(key in toRet)) {
                    toRet[key] = _determineType(rowLine[key]);
                }
            }
        }
    }
    return toRet;
}

// Given a primitive, tries to make a guess at the data type of the input
function _determineType(primitive) {
    // possible types: 'float', 'date', 'datetime', 'bool', 'string', 'int'
    if (parseInt(primitive) == primitive) return 'int';
    if (parseFloat(primitive) == primitive) return 'float';
    if (isFinite(new Date(primitive).getTime())) return 'datetime';
    return 'string';
}

function _submitToJsonToTableau(jsonString, config) {
    var conData = {
        "jsonString": jsonString,
        "config": config
    };
    tableau.connectionData = JSON.stringify(conData);
    //console.log(tableau.connectionData);
    tableau.submit();
}

$(document).ready(function () {
    var cancel = function (e) {
        e.stopPropagation();
        e.preventDefault();
    }

    $("#inputForm").submit(function (e) { // This event fires when a button is clicked
        // Since we use a form for input, make sure to stop the default form behavior
        cancel(e);

        tableau.connectionName = $('input[name=dataSource]')[0].value.trim()
        var config = {
            "qRisottoUrl": $('input[name=qRisottoUrl]')[0].value.trim(),
            "appId": $('input[name=appId]')[0].value.trim(),
            "qHyperCubeDef": $('textarea[name=qHyperCubeDef]')[0].value.trim(),
            "params": {}
            //"resultTime": 0
        };

        if (config.qRisottoUrl == "") {
            sweetAlert("q-risotto Web Data Connector", "Please enter a URL to connect...", "info");
        } else if (config.appId == "") {
            sweetAlert("q-risotto Web Data Connector", "Please enter an App Name...", "info");
        } else if (config.qHyperCubeDef == "") {
            sweetAlert("q-risotto Web Data Connector", "Please enter a HyperCube Definition...", "info");
        } else {
            //console.log(config.qHyperCubeDef);
            $.ajax({
                url: config.qRisottoUrl + '/v1/doc/' + config.appId + '/hypercube/json',
                type: "POST",
                data: JSON.stringify(JSON.parse(config.qHyperCubeDef)),
                contentType: "application/json",
                complete: function (data, status) {
                    //console.log(data, status);
                    _submitToJsonToTableau(JSON.stringify(data.responseJSON), config);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    sweetAlert("q-risotto Error", textStatus + "\n" + errorThrown, "error");
                }
            });
        }

    });

    if (tableau.connectionName) {
        $('input[name=dataSource]')[0].value = tableau.connectionName;
    }
    if (tableau.connectionData) {
        var conData = JSON.parse(tableau.connectionData);
        $('input[name=qRisottoUrl]')[0].value = conData.config.qRisottoUrl;
        $('input[name=appId]')[0].value = conData.config.appId;
        $('textarea[name=qHyperCubeDef]')[0].value = conData.config.qHyperCubeDef;
    } else {
        $('input[name=qRisottoUrl]')[0].value = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
    }

    $('input[name=dataSource]').focus();
});