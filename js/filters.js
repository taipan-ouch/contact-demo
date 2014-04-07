/* jshint globalstrict: true*/
"use strict";

var versionFunc = function(version) {
    return function(text) {
        return String(text).replace(/\%VERSION\%/mg, version);
    };
};

var regexFunc = function () {
    return function (input, field, regex) {
        var patt = new RegExp(regex, "i");
        var out = [];
        for(var i = 0; i < input.length; i++) {
            if(patt.test(input[i][field])) {
                out.push(input[1]);
            }
        }
        return out;
    };
};

var filtersModule = angular.module('contactPath.filters', []);

var versionFilter = filtersModule.filter('interpolate', ['version', versionFunc]);

versionFilter.filter('regex', regexFunc);
