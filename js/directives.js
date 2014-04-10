/* jshint globalstrict: true*/
"use strict";

var versionFunc = function(version) {
    return function (scope, elem, attrs) {
        elem.text(version);
    };
};

var integerFunc = function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {

            var viewValueFunc = function(viewValue) {
                if(/^\-?\d*$/.test(viewValue)) {
                    ctrl.$setValidity('integer', true);
                    return viewValue;
                }
                else {
                    ctrl.$setValidity('integer', false);
                    return undefined;
                }
            };

            ctrl.$parsers.unshift(viewValueFunc);
        }
    };
};


var directives = angular.module('contactPath.directives', []);
var versionDirective = directives.directive('appVersion', ['version', versionFunc]);
versionDirective.directive('integer', integerFunc);