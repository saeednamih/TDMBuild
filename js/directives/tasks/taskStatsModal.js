function taskStatsModalDirective(TDMService, $filter, DTColumnBuilder, DTOptionsBuilder, $q, $compile) {
    return {
        templateUrl: 'views/tasks/taskStatsModal.html',
        controllerAs: 'taskStatsModalCtrl',
        controller: function ($scope) {
            let taskStatsModalCtrl = this;

            taskStatsModalCtrl.openTab = function (tabId) {
                taskStatsModalCtrl.tab = tabId;
            };

            taskStatsModalCtrl.updatePopup = function (targetId) {
                $scope.updatePopup(targetId, taskStatsModalCtrl.selectedLU.lu_name);
            };

            taskStatsModalCtrl.refreshTable = (node) => {
                var targetId = node.targetId;
                var parentTargetId = node.parentTargetId;
                var luName = node.lu_name;
                var isRoot = node.isRoot;
                var hasBrothers = node.brothers && node.brothers.length > 1 || false;
                let body = {
                    taskExecutionId: $scope.taskExecutionId,
                    parentTargetId: isRoot || !hasBrothers ? undefined : parentTargetId,
                    targetId: isRoot || !hasBrothers ? targetId : undefined,
                    lu_name: luName
                }
                taskStatsModalCtrl.errorFailedReason = null;
                taskStatsModalCtrl.loadingTables = true;
                TDMService.getTDMStats(body).then(res => {

                    let tableData = res.result.data;
                    if (!node.hasBrothers){
                        taskStatsModalCtrl.errorFailedReason = tableData && tableData["Failed entities per execution"] &&
                        tableData["Failed entities per execution"].entitiesList && 
                        tableData["Failed entities per execution"].entitiesList.length > 0 &&
                        tableData["Failed entities per execution"].entitiesList[0].errorMsg || undefined;
                    }
                    taskStatsModalCtrl.makeTables = (isRoot) => {
                        taskStatsModalCtrl.makeCopiedEntitiesTable(isRoot);
                        taskStatsModalCtrl.makeFailedEntitiesTable(isRoot);
                    };

                    taskStatsModalCtrl.makeCopiedEntitiesTable = function (isRoot) {
                        taskStatsModalCtrl.dtInstancecEntities = {};
                        taskStatsModalCtrl.dtColumnscEntities = [];
                        taskStatsModalCtrl.dtColumnDefscEntities = [];
                        if (isRoot) {
                            taskStatsModalCtrl.headerscEntities = [
                                {
                                    column: 'sourceId',
                                    name: 'Source id',
                                    clickAble: true
                                },
                                {
                                    column: 'targetId',
                                    name: 'Target id',
                                    clickAble: false
                                },
                                {
                                    column: 'copyEntityStatus',
                                    name: 'Copy Entity Status',
                                    clickAble: false
                                },
                                {
                                    column: 'copyHierarchyStatus',
                                    name: 'Copy Hierarchy Data Status',
                                    clickAble: false
                                },
                            ];
                        } else {
                            taskStatsModalCtrl.headerscEntities = [
                                {
                                    column: 'sourceId',
                                    name: 'Source id',
                                    clickAble: true
                                },
                                {
                                    column: 'targetId',
                                    name: 'Target id',
                                    clickAble: false
                                },
                                {
                                    column: 'parentLuName',
                                    name: 'Parent LU Name',
                                    clickAble: false
                                },
                                {
                                    column: 'parentSourceId',
                                    name: 'Parent Source ID',
                                    clickAble: false
                                },
                                {
                                    column: 'parentTargetId',
                                    name: 'Parent Target ID',
                                    clickAble: false
                                }
                            ];
                        }

                        let clickableCol = (data, type, full) => {
                            return `<a ng-click="taskStatsModalCtrl.updatePopup('${full.targetId}')">  ${data} </a>`;
                        }
                        for (var i = 0; i < taskStatsModalCtrl.headerscEntities.length; i++) {
                            if (taskStatsModalCtrl.headerscEntities[i].clickAble) {
                                taskStatsModalCtrl.dtColumnscEntities.push(DTColumnBuilder.newColumn(taskStatsModalCtrl.headerscEntities[i].column).withTitle(taskStatsModalCtrl.headerscEntities[i].name).renderWith(clickableCol));
                            } else {
                                taskStatsModalCtrl.dtColumnscEntities.push(DTColumnBuilder.newColumn(taskStatsModalCtrl.headerscEntities[i].column).withTitle(taskStatsModalCtrl.headerscEntities[i].name));
                            }
                        }

                        var getTableData = function () {
                            var deferred = $q.defer();
                            deferred.resolve(taskStatsModalCtrl.cEntities);
                            return deferred.promise;
                        };

                        taskStatsModalCtrl.dtOptionscEntities = DTOptionsBuilder.fromFnPromise(function () {
                            return getTableData();
                        })
                            .withDOM('lTfgitp')
                            .withOption('createdRow', function (row) {
                                // Recompiling so we can bind Angular directive to the DT
                                $compile(angular.element(row).contents())($scope);
                            })
                            .withOption('scrollX', false)
                            .withOption('lengthChange', true)
                            .withOption('paging', true)
                            .withOption('searching', true)
                            .withOption('info', true)
                            .withOption("caseInsensitive", true)
                            .withOption('search', {
                                "caseInsensitive": false
                            });

                        taskStatsModalCtrl.dtInstanceCallbackcEntities = function (dtInstance) {
                            if (angular.isFunction(taskStatsModalCtrl.dtInstancecEntities)) {
                                taskStatsModalCtrl.dtInstancecEntities(dtInstance);
                            } else if (angular.isDefined(taskStatsModalCtrl.dtInstancecEntities)) {
                                taskStatsModalCtrl.dtInstancecEntities = dtInstance;
                            }
                        };
                        if (taskStatsModalCtrl.dtInstancecEntities.changeData != null)
                            taskStatsModalCtrl.dtInstancecEntities.changeData(getTableData());

                        taskStatsModalCtrl.loadingTableCopiedEntities = false;

                        if (taskStatsModalCtrl.dtInstancecEntities && taskStatsModalCtrl.dtInstancecEntities.reloadData) {
                            taskStatsModalCtrl.dtInstancecEntities.reloadData(function (data) {
                            }, false);
                        }
                    }

                    taskStatsModalCtrl.makeFailedEntitiesTable = function (isRoot) {
                        taskStatsModalCtrl.dtInstancefEntities = {};
                        taskStatsModalCtrl.dtColumnsfEntities = [];
                        taskStatsModalCtrl.dtColumnDefsfEntities = [];
                        if (isRoot) {
                            taskStatsModalCtrl.headersfEntities = [
                                {
                                    column: 'sourceId',
                                    name: 'Source id',
                                    clickAble: true
                                },
                                {
                                    column: 'targetId',
                                    name: 'Target id',
                                    clickAble: false
                                },
                                {
                                    column: 'copyEntityStatus',
                                    name: 'Copy Entity Status',
                                    clickAble: false
                                },
                                {
                                    column: 'copyHierarchyStatus',
                                    name: 'Copy Hierarchy Data Status',
                                    clickAble: false
                                },
                            ];
                        } else {
                            taskStatsModalCtrl.headersfEntities = [
                                {
                                    column: 'sourceId',
                                    name: 'Source id',
                                    clickAble: true
                                },
                                {
                                    column: 'targetId',
                                    name: 'Target id',
                                    clickAble: false
                                },
                                {
                                    column: 'parentLuName',
                                    name: 'Parent LU Name',
                                    clickAble: false
                                },
                                {
                                    column: 'parentSourceId',
                                    name: 'Parent Source ID',
                                    clickAble: false
                                },
                                {
                                    column: 'parentTargetId',
                                    name: 'Parent Target ID',
                                    clickAble: false
                                },
                                {
                                    column: 'copyEntityStatus',
                                    name: 'Copy Entity Status',
                                    clickAble: false
                                },
                                {
                                    column: 'copyHierarchyStatus',
                                    name: 'Copy Hierarchy Data Status',
                                    clickAble: false
                                }
                            ];
                        }

                        let clickableCol = (data, type, full) => {
                            return `<a ng-click="taskStatsModalCtrl.updatePopup('${full.targetId}')">  ${data} </a>`;
                        }

                        for (var i = 0; i < taskStatsModalCtrl.headersfEntities.length; i++) {
                            if (taskStatsModalCtrl.headersfEntities[i].clickAble) {
                                taskStatsModalCtrl.dtColumnsfEntities.push(DTColumnBuilder.newColumn(taskStatsModalCtrl.headersfEntities[i].column).withTitle(taskStatsModalCtrl.headersfEntities[i].name).renderWith(clickableCol));
                            } else {
                                taskStatsModalCtrl.dtColumnsfEntities.push(DTColumnBuilder.newColumn(taskStatsModalCtrl.headersfEntities[i].column).withTitle(taskStatsModalCtrl.headersfEntities[i].name));
                            }
                        }

                        var getTableData = function () {
                            var deferred = $q.defer();
                            deferred.resolve(taskStatsModalCtrl.fEntities);
                            return deferred.promise;
                        };

                        taskStatsModalCtrl.dtOptionsfEntities = DTOptionsBuilder.fromFnPromise(function () {
                            return getTableData();
                        })
                            .withDOM('lTfgitp')
                            .withOption('createdRow', function (row) {
                                // Recompiling so we can bind Angular directive to the DT
                                $compile(angular.element(row).contents())($scope);
                            })
                            .withOption('scrollX', false)
                            .withOption('lengthChange', true)
                            .withOption('paging', true)
                            .withOption('searching', true)
                            .withOption('info', true)
                            .withOption("caseInsensitive", true)
                            .withOption('search', {
                                "caseInsensitive": false
                            });

                        taskStatsModalCtrl.dtInstanceCallbackfEntities = function (dtInstance) {
                            if (angular.isFunction(taskStatsModalCtrl.dtInstancefEntities)) {
                                taskStatsModalCtrl.dtInstancefEntities(dtInstance);
                            } else if (angular.isDefined(taskStatsModalCtrl.dtInstancefEntities)) {
                                taskStatsModalCtrl.dtInstancefEntities = dtInstance;
                            }
                        };
                        if (taskStatsModalCtrl.dtInstancefEntities.changeData != null)
                            taskStatsModalCtrl.dtInstancefEntities.changeData(getTableData());

                        taskStatsModalCtrl.loadingTableFailedEntities = false;

                    };

                    if (tableData) {
                        if (tableData["Copied entities per execution"]) {
                            taskStatsModalCtrl.totalCopiedEntities = tableData["Copied entities per execution"].NoOfEntities;
                            taskStatsModalCtrl.cEntities = tableData["Copied entities per execution"].entitiesList;
                            taskStatsModalCtrl.cEntitiesTitle = `${$filter('translate')('COPIED')} ${$filter('translate')('LIST')}`
                        }
                        if (tableData["Failed entities per execution"]) {
                            taskStatsModalCtrl.totalFailedEntities = tableData["Failed entities per execution"].NoOfEntities;
                            taskStatsModalCtrl.fEntities = tableData["Failed entities per execution"].entitiesList;
                            taskStatsModalCtrl.fEntities = taskStatsModalCtrl.fEntities;
                            taskStatsModalCtrl.fEntitiesTitle = `${$filter('translate')('FAILED')} ${$filter('translate')('LIST')}`
                        }

                    } else {
                        taskStatsModalCtrl.totalCopiedEntities = 0;
                        taskStatsModalCtrl.totalFailedEntities = 0;

                        taskStatsModalCtrl.fEntities = [];
                        taskStatsModalCtrl.cEntities = [];
                    }

                    taskStatsModalCtrl.makeTables(isRoot);
                    taskStatsModalCtrl.loadingTables = false;
                    if (!taskStatsModalCtrl.tab) {
                        taskStatsModalCtrl.tab = 1;
                    }
                })
            };
            taskStatsModalCtrl.updateTDMStats = function (item) {
                taskStatsModalCtrl.selectedLU = item;
                item.collapsed = false;
                $scope.luTreeMenu.forEach(function (root) {
                    if (item.isRoot) {
                        root.collapsed = false;
                    } else {
                        if (item.parentRootLuName !== root.lu_name) {
                            root.collapsed = true;
                        }
                    }
                });

                // unmark all items in lutree menu to select only selected item
                for (i of $scope.luTreeMenu) {
                    i.selected = false;
                    if (i.children) {
                        for (child of i.children) {
                            child.selected = false
                        }
                    }
                }

                taskStatsModalCtrl.refreshTable(item);
            };

            var updateTree = function(element) {
                if(!element.children || element.children.length == 0){
                    return;
                } 
                var i;
                for(i = 0;i < element.children.length; i++){
                    updateTree(element.children[i]);
               }
               if (element.children && element.children.length > 1){
                   var newChildren = [];
                   var groupByLU = _.groupBy(element.children,'lu_name');
                   for(var key in groupByLU) {
                        var newChild = groupByLU[key][0];
                        newChild.brothers = groupByLU[key];
                        newChildren.push(newChild);
                   }
                   element.children = newChildren;
               }
            };

            var searchTree = function (element, lu_name, target_id) {
                if(element.lu_name == lu_name && element.targetId == target_id){
                    element.selected = true;
                    return element;
                }else if (element.children != null){
                     var i;
                     var result = null;
                     for(i = 0; result == null && i < element.children.length; i++){
                        result = searchTree(element.children[i], lu_name, target_id);
                        if (result){
                            element.collapsed = false;
                        }
                    }
                    return result;
                }
                return false;
            }

            TDMService.getLuTree({
                targetId: $scope.targetId,
                luName: $scope.luName,
                taskExecutionId: $scope.taskExecutionId
            }).then(response => {
                var result = null;
                for(var i = 0;i < response.result.length; i++){
                    result = searchTree(response.result[i], $scope.luName, $scope.targetId);
                    updateTree(response.result[i]);
                }
                
                $scope.luTreeMenu = response.result;
                if (result) {
                    taskStatsModalCtrl.updateTDMStats(result);
                }
            });
        },
        scope: {
            taskExecutionId: '=',
            targetId: '=',
            luName: '=',
            updatePopup: '=',
            close: '='
        }
    }
}

angular
    .module('TDM-FE')
    .directive('taskStatsModalDirective', taskStatsModalDirective);