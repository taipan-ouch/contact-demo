/* jshint globalstrict: true*/
"use strict";

var contactPathModule = angular.module('contactPath.services', []);

contactPathModule.value('version', '0.1');
contactPathModule.value('localStorage', window.localStorage);


var contactBean = function (localStorage, $rootScope) {
    var self = this;

    self.save = function (contact) {
        if(!contact.hasOwnProperty('id')) {
            var highest = 1;

            for(var i = 0; i < self.contacts.length; i++) {
                if(self.contacts[i].id > highest) {
                    highest = self.contacts[i].id;
                }
            }
            contact.id = ++highest;
        }

        self.contacts.push(contact);

        var sortFunc = function(left, right) {
            var sort = 0;

            if(left.name && right.name) {
                var left_lc = left.name.toLowerCase();
                var right_lc = right.name.toLowerCase();
                sort = left_lc > right_lc ? 1 : left_lc < right_lc ? -1 : 0;
            }

            return sort;
        };

        self.contacts.sort(sortFunc);

        return contact.id;
    };

    self.update = function(contact) {
        for(var i = 0; i < self.contacts.length; i++) {
            if(self.contacts[i].id === contact.id) {
                if(contact.name) {
                    self.contacts[i].name = contact.name;
                }
                if(contact.phone) {
                    self.contacts[i].phone = contact.phone;
                }

                if(contact.email) {
                    self.contacts[i].email = contact.email;
                }
            }
        }

        return contact.id;
    };

    self.get = function (id) {
        for(var i = 0; i < self.contacts.length; i++) {
            if(self.contacts[i].id === id) {
                return self.contacts[i];
            }
        }
    };

    self.remove = function (id) {
        for(var i = 0; i < self.contacts.length; i++) {
            if(self.contacts[i].id === id) {
                self.contacts.splice(i, 1);
            }
        }
    };

    self.genContactLists = function () {
        var current;
        var i = -1;
        var contactLists = [];

        var contactFunc = function(contact) {
            if(contact.name) {
                if(contact.name.charAt(0).toUpperCase() !== current) {
                    current = contact.name.charAt(0).toUpperCase();
                    i++;
                    contactLists[i] = {};
                    contactLists[i].name = current;
                    contactLists[i].contacts = [];
                }
                contactLists[i].contacts.push(contact);
            }
        };

        self.contacts.forEach(contactFunc);
    };

    self.flush = function () {
        self.contacts = [];
    };

    function createPersistentProperty(localName, storageName, Type) {
        var json = localStorage[storageName];

        self[localName] = json ? JSON.parse(json) : new Type;

        var watchExpr = function() {
            return self[localName];
        };

        var func2 = function(value) {
            if(value) {
                localStorage[storageName] = JSON.stringify(value);
                self.contactLists = self.genContactLists();
            }
        };

        $rootScope.$watch(watchExpr, func2, true);
    }

    createPersistentProperty('contacts', 'cpContactLists', Array);

    if(self.contacts.length === 0 ) {
        self.save({is: 1, name: 'Noonan Tim', phone: '7204801003', email: 'tim.noonan@me.com'});
    }
};

contactPathModule.service('contacts', contactBean);