/**
 * INSPINIA - Responsive Admin Theme
 *
 */


/**
 * pageTitle - Directive for set Page title - mata title
 */
function pageTitle($rootScope, $timeout) {
    return {
        link: function (scope, element) {
            var listener = function (event, toState, toParams, fromState, fromParams) {
                // Default title - load on Dashboard 1
                var title = 'TDM | Responsive Admin Theme';
                // Create your own title pattern
                if (toState.data && toState.data.pageTitle) title = 'TDM | ' + toState.data.pageTitle;
                $timeout(function () {
                    element.text(title);
                });
            };
            $rootScope.$on('$stateChangeStart', listener);
        }
    }
}

/**
 * sideNavigation - Directive for run metsiMenu on sidebar navigation
 */
function sideNavigation($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element) {
            // Call the metsiMenu plugin and plug it to sidebar navigation
            $timeout(function () {
                element.metisMenu();
            });
        }
    };
}

/**
 * iboxTools - Directive for iBox tools elements in right corner of ibox
 */
function iboxTools($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'views/common/ibox_tools.html',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            },
                // Function for close ibox
                $scope.closebox = function () {
                    var ibox = $element.closest('div.ibox');
                    ibox.remove();
                }
        }
    };
}

/**
 * iboxTools with full screen - Directive for iBox tools elements in right corner of ibox with full screen option
 */
function iboxToolsFullScreen($timeout) {
    return {
        restrict: 'A',
        scope: true,
        templateUrl: 'views/common/ibox_tools_full_screen.html',
        controller: function ($scope, $element) {
            // Function for collapse ibox
            $scope.showhide = function () {
                var ibox = $element.closest('div.ibox');
                var icon = $element.find('i:first');
                var content = ibox.find('div.ibox-content');
                content.slideToggle(200);
                // Toggle icon from up to down
                icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
                ibox.toggleClass('').toggleClass('border-bottom');
                $timeout(function () {
                    ibox.resize();
                    ibox.find('[id^=map-]').resize();
                }, 50);
            };
            // Function for close ibox
            $scope.closebox = function () {
                var ibox = $element.closest('div.ibox');
                ibox.remove();
            };
            // Function for full screen
            $scope.fullscreen = function () {
                var ibox = $element.closest('div.ibox');
                var button = $element.find('i.fa-expand');
                $('body').toggleClass('fullscreen-ibox-mode');
                button.toggleClass('fa-expand').toggleClass('fa-compress');
                ibox.toggleClass('fullscreen');
                setTimeout(function () {
                    $(window).trigger('resize');
                }, 100);
            }
        }
    };
}

/**
 * minimalizaSidebar - Directive for minimalize sidebar
 */
function minimalizaSidebar($timeout) {
    return {
        restrict: 'A',
        template: '<a class="navbar-minimalize minimalize-styl-2 btn btn-primary " href="" ng-click="minimalize()"><i class="fa fa-bars"></i></a>',
        scope: {
            parentController: '='
        },
        controller: function ($scope, $element) {
            $scope.minimalize = function () {
                $("body").toggleClass("mini-navbar");
                if (!$('body').hasClass('mini-navbar') || $('body').hasClass('body-small')) {
                    // Hide menu in order to smoothly turn on when maximize menu
                    $('#side-menu').hide();
                    // For smoothly turn on menu
                    setTimeout(
                        function () {
                            $('#side-menu').fadeIn(400);
                            $(window).trigger('resize');
                        }, 200);
                    $scope.parentController.showTooltip = false;
                } else if ($('body').hasClass('fixed-sidebar')) {
                    $('#side-menu').hide();
                    setTimeout(
                        function () {
                            $('#side-menu').fadeIn(400);
                            $(window).trigger('resize');
                        }, 100);
                } else {
                    // Remove all inline style from jquery fadeIn function to reset menu state
                    $('#side-menu').removeAttr('style');
                    $(window).trigger('resize');
                    $scope.parentController.showTooltip = true;
                }
            }
        }
    };
}


/**
 * show/hide element by role
 */
function roleHandler($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.currentUserRole.id > scope.role) {
                element.remove();
            }
        },
        controller: function ($scope, AuthService) {
            $scope.currentUserRole = AuthService.getRole();
        },
        scope: {
            role: '='
        }
    };
}


function icheck($timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function ($scope, element, $attrs, ngModel) {
            return $timeout(function () {
                var value;
                value = $attrs['value'];

                $scope.$watch($attrs['ngModel'], function (newValue) {
                    $(element).iCheck('update');
                });

                $scope.$watch($attrs['ngDisabled'], function (newValue) {
                    $(element).iCheck('update');
                });

                return $(element).iCheck({
                    checkboxClass: 'icheckbox_square-green',
                    radioClass: 'iradio_square-green'

                }).on('ifChanged', function (event) {
                    if ($(element).attr('type') === 'checkbox' && $attrs['ngModel']) {
                        $scope.$apply(function () {
                            return ngModel.$setViewValue(event.target.checked);
                        });
                    }
                    if ($(element).attr('type') === 'radio' && $attrs['ngModel']) {
                        return $scope.$apply(function () {
                            return ngModel.$setViewValue(value);
                        });
                    }
                });
            });
        }
    };
}

function treeMenuPopup() {
    return {
        scope: {
            treeMenuPopup: '=treeMenuPopup'
        },
        template: '<li ng-repeat="item in treeMenuPopup track by $index" style="padding-bottom: 10px"><tree-menu-item-popup></tree-menu-item-popup></li>',
        link: function (scope, elem) {
        }
    }
}

function treeMenuItemPopup($rootScope, $compile) {
    return {
        template: '<div style="cursor: pointer;padding-top:5px" ng-style="item.selected && {\'background-color\':\'rgba(208, 235, 255, 0.7)\'}">' +
            '<i ng-click="collapse(item)" class="fa fa-caret-right" ng-if="item.children"></i>' +
            '<i ng-if="item.isRoot && item.luStatus == \'failed\'" style="text-align: center;color: white;background: red;padding: 5px;width: 22px;border-radius: 50px;" class="fa fa-exclamation"></i>' +
            '<span ng-click="updateTable(item, treeMenu)" ng-style="getCss(item)"ng-bind="item.luName"></span></div>',
        link: function (scope, element) {
            if (angular.isArray(scope.item.children)) {
                element.append($compile('<ul style="list-style: none;" ng-if="collapsed" tree-menu-popup="item.children"></ul>')(scope));

            }
            scope.getCss = item => {
                let res = {};

                if (item.luStatus == 'failed') {
                    res.color = 'red';
                }

                res['margin-left'] = item.hasChildren ? '10px' : '15px';

                return res;

            };
            scope.collapse = function (item) {
                scope.collapsed = !scope.collapsed;
                // $rootScope.$broadcast('showRootLUChildren', {item: item});
            };
            scope.updateTable = function (item, treeMenu) {
                $rootScope.$broadcast('updatePopUpTable', {item: item});
                item.selected = true;
            };
        }
    }
}


function treeMenu() {
    return {
        scope: {
            treeMenu: '=treeMenu'
        },
        template: '<li ng-repeat="item in treeMenu track by $index" style="padding-bottom: 10px"><tree-menu-item></tree-menu-item></li>',
        link: function (scope, elem) {
        }
    }
}

treeMenuItem().$inject = ['$compile'];

function treeMenuItem($rootScope, $compile) {
    return {
        template: '<div style="cursor: pointer;padding-top:5px" ng-style="item.selected && {\'background-color\':\'rgba(208, 235, 255, 0.7)\'}"><i ng-click="collapse(item)" class="fa fa-caret-right" ng-if="item.hasChildren"></i><span ng-click="updateTable(item, treeMenu)" ng-style="getCss(item)"ng-bind="item.lu_name"></span></div>',
        link: function (scope, element) {
            if (angular.isArray(scope.item.children)) {
                element.append($compile('<ul style="list-style: none;" ng-if="collapsed" tree-menu="item.children"></ul>')(scope));

            }
            scope.getCss = item => {
                let res = {};

                if (item.lu_status == 'failed') {
                    res.color = 'red';
                }

                res['margin-left'] = item.hasChildren ? '10px' : '15px';

                return res;

            };
            scope.collapse = function (item) {
                scope.collapsed = !scope.collapsed;
                $rootScope.$broadcast('showRootLUChildren', {item: item});
            };
            scope.updateTable = function (item, treeMenu) {
                $rootScope.$broadcast('updateTDMStats', {item: item});
                item.selected = true;
            };
        }
    }
}

/**
 *
 * Pass all functions into module
 */
angular
    .module('TDM-FE')
    .directive('pageTitle', pageTitle)
    .directive('sideNavigation', sideNavigation)
    .directive('iboxTools', iboxTools)
    .directive('minimalizaSidebar', minimalizaSidebar)
    .directive('iboxToolsFullScreen', iboxToolsFullScreen)
    .directive('roleHandler', roleHandler)
    .directive('icheck', icheck)
    .directive('treeMenu', treeMenu)
    .directive('treeMenuPopup', treeMenuPopup)
    .directive('treeMenuItem', treeMenuItem)
    .directive('treeMenuItemPopup', treeMenuItemPopup)
    .directive('autoFocus', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element) {
                $timeout(function () {
                    $element[0].focus();
                }, 2000);
            }
        }
    }])
    .filter('customOptionsFilter', function () {
        return function (logicalUnits, be) {
            if (!logicalUnits) {
                return [];
            }
            if (!be) {
                return logicalUnits;
            }
            return _.filter(logicalUnits, function (lu) {
                if (be.be_id == lu.be_id) {
                    return true;
                }
                return false;
            })
        }
    });

