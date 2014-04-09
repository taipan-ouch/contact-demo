/* jshint globalstrict: true*/
"use strict";

var scope = function($rootScope)
{
    $rootScope.search = "";
};

var routeProvider = function($routeProvider)
{
    $routeProvider.when('/', {templateUrl:'partials/add.html', controller:AddCtrl});
    $routeProvider.when('/view/:id', {templateUrl:'partials/view.html', controller:ViewCtrl});
    $routeProvider.when('/edit/:id', {templateUrl:'partials/edit.html', controller:EditCtrl});
    $routeProvider.otherwise({redirectTo:'/'});
};

var contactPathModule = angular.module('contactPath',
    ['ngRoute', 'contactPath.filters', 'contactPath.services', 'contactPath.directives']);

var obj = contactPathModule.run(scope);
obj.config(['$routeProvider', routeProvider]);


var AddCtrl = function($scope, $location, contacts)
{
    $scope.contactData = {};

    $scope.save = function(contactData) {
        var id = contacts.save({name:contactData.name, phone:contactData.phone, email:contactData.email});
        $location.path('/view/' + id);
    };
};

var ViewCtrl = function($scope, contacts, $routeParams)
{
    $scope.contacts = contacts.get($routeParams.id);
};

var EditCtrl = function($scope, $routeParams, $location, contacts)
{
    $scope.contact = contacts.get($routeParams.id);

    $scope.update = function(contactData) {
        var id = contacts.update({id:contactData.id, name:contactData.name,
            phone:contactData.phone, email:contactData.email});
        $location.path('/view/' + id);
    };

    $scope.delete = function(id) {
        contacts.remove(id);
        $location.path('/');
    };

};

var SearchCtrl = function($scope, contacts)
{
    $scope.contacts = contacts.contacts;
};

var ListCtrl = function($scope, contacts)
{
    $scope.contactLists = contacts.contactLists;

    var getContactsList = function ()
    {
        return contacts.contactLists;
    };

    var setContactsLists = function(value)
    {
        if(value) {
            $scope.contactLists = contacts.contactLists;
        }
    };

    $scope.$watch (getContactsList, setContactsLists);
};