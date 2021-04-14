/**
 * Created by wael on 02/06/2017.
 */


function taskStatsDirective() {
    var template = "views/tasks/executionStats.html";

    var controller = function ($scope, $filter, TDMService, BreadCrumbsService, $element, $uibModal, toastr, $timeout, AuthService, $state, DTColumnBuilder, DTOptionsBuilder, $q, $compile, $rootScope) {
        var taskStatesCtrl = this;
        taskStatesCtrl.taskData = $scope.content.taskData;
        taskStatesCtrl.tab = 1;
        taskStatesCtrl.tasksExecID = $scope.$parent.$parent.tasks.tasksData.taskExecId;
        taskStatesCtrl.fabricExecID = $scope.$parent.$parent.tasks.tasksData.fabricExecutionId;

        taskStatesCtrl.type = $scope.$parent.$parent.tasks.tasksData.type;
        taskStatesCtrl.selectionMethod = $scope.$parent.$parent.tasks.tasksData.selectionMethod;
        taskStatesCtrl.refcount = $scope.$parent.$parent.tasks.tasksData.refCount;
        taskStatesCtrl.loadingTableFailedReferences = true;
        taskStatesCtrl.loadingTableFailedEntities = true;
        taskStatesCtrl.loadingTableCopiedEntities = true;
        taskStatesCtrl.loadingTableCopiedReferences = true;
        BreadCrumbsService.push({tasksExecID: taskStatesCtrl.tasksExecID}, 'STATISTICS', function () {

        });

        $scope.luTreeMenu = [];

        taskStatesCtrl.makeCopiedReferenceTable = function (isRoot,refreshData) {
            if (refreshData){
                if (taskStatesCtrl.dtInstancecReferences && taskStatesCtrl.dtInstancecReferences.reloadData) {
                    taskStatesCtrl.dtInstancecReferences.reloadData(function (data) {
                    }, false);
                    return;
                }
            }
            taskStatesCtrl.dtInstancecReferences = {};
            taskStatesCtrl.dtColumnscReferences = [];
            taskStatesCtrl.dtColumnDefscReferences = [];
            taskStatesCtrl.headerscReferences = [
                {
                    column: 'RerernceTableName',
                    name: 'Reference Table name',
                    clickAble: false
                }
            ];

            for (var i = 0; i < taskStatesCtrl.headerscReferences.length; i++) {
                taskStatesCtrl.dtColumnscReferences.push(DTColumnBuilder.newColumn(taskStatesCtrl.headerscReferences[i].column).withTitle(taskStatesCtrl.headerscReferences[i].name));
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskStatesCtrl.cReferences);
                return deferred.promise;
            };

            taskStatesCtrl.openStatsModal = (targetId) => {
                taskStatesCtrl.popUpTreeMenu = [];
                var taskExecutionId = taskStatesCtrl.tasksExecID;
                var luName = taskStatesCtrl.selectedLU.lu_name;
                var logicalUnitModalInstance = $uibModal.open({
                    template: `<task-stats-modal-directive
                                ng-if="targetId"
                                task-execution-id="taskExecutionId" 
                                target-id="targetId"
                                close="close"
                                update-popup="update"
                                lu-name="luName"></task-stats-modal-directive>`,
                    size: "modal-x-lg",
                    windowClass: 'staticsModal',
                    resolve: {},
                    controller: function ($scope, $uibModalInstance) {
                        $scope.taskExecutionId = taskExecutionId;
                        $scope.targetId = targetId;
                        $scope.luName = luName;

                        $scope.update = function(newTargetId, newLU){
                            $scope.targetId = null;
                            $timeout(function(){
                                $scope.targetId = newTargetId;
                                $scope.luName = newLU;
                            },100);
                        }

                        $scope.close = function () {
                            $uibModalInstance.close();
                        };

                    },
                    controllerAs: 'staticsModalCtrl'
                });
            };

            taskStatesCtrl.dtOptionscReferences = DTOptionsBuilder.fromFnPromise(function () {
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

            taskStatesCtrl.dtInstanceCallbackcReferences = function (dtInstance) {
                if (angular.isFunction(taskStatesCtrl.dtInstancecReferences)) {
                    taskStatesCtrl.dtInstancecReferences(dtInstance);
                } else if (angular.isDefined(taskStatesCtrl.dtInstancecReferences)) {
                    taskStatesCtrl.dtInstancecReferences = dtInstance;
                }
            };
            if (taskStatesCtrl.dtInstancecReferences.changeData != null)
                taskStatesCtrl.dtInstancecReferences.changeData(getTableData());

            taskStatesCtrl.loadingTableCopiedReferences = false;
        };

        taskStatesCtrl.makeCopiedEntitiesTable = function (isRoot, refreshData) {
            if (refreshData){
                if (taskStatesCtrl.dtInstancecEntities && taskStatesCtrl.dtInstancecEntities.reloadData) {
                    taskStatesCtrl.dtInstancecEntities.reloadData(function (data) {
                    }, false);
                    return;
                }
            }
            taskStatesCtrl.dtInstancecEntities = {};
            taskStatesCtrl.dtColumnscEntities = [];
            taskStatesCtrl.dtColumnDefscEntities = [];
            if (isRoot) {
                taskStatesCtrl.headerscEntities = [
                    {
                        column: 'sourceId',
                        name: 'Source id',
                        clickAble: true
                    },
                    {
                        column: 'targetId',
                        name: 'Target id',
                        clickAble: false
                    }
                ];
            } else {
                taskStatesCtrl.headerscEntities = [
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
                return `<a ng-click="taskStatesCtrl.openStatsModal('${full.targetId}')">  ${data} </a>`;
            }
            for (var i = 0; i < taskStatesCtrl.headerscEntities.length; i++) {
                if (taskStatesCtrl.headerscEntities[i].clickAble) {
                    taskStatesCtrl.dtColumnscEntities.push(DTColumnBuilder.newColumn(taskStatesCtrl.headerscEntities[i].column).withTitle(taskStatesCtrl.headerscEntities[i].name).renderWith(clickableCol));
                } else {
                    taskStatesCtrl.dtColumnscEntities.push(DTColumnBuilder.newColumn(taskStatesCtrl.headerscEntities[i].column).withTitle(taskStatesCtrl.headerscEntities[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskStatesCtrl.cEntities);
                return deferred.promise;
            };

            taskStatesCtrl.dtOptionscEntities = DTOptionsBuilder.fromFnPromise(function () {
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

            taskStatesCtrl.dtInstanceCallbackcEntities = function (dtInstance) {
                if (angular.isFunction(taskStatesCtrl.dtInstancecEntities)) {
                    taskStatesCtrl.dtInstancecEntities(dtInstance);
                } else if (angular.isDefined(taskStatesCtrl.dtInstancecEntities)) {
                    taskStatesCtrl.dtInstancecEntities = dtInstance;
                }
            };
            if (taskStatesCtrl.dtInstancecEntities.changeData != null)
                taskStatesCtrl.dtInstancecEntities.changeData(getTableData());

            taskStatesCtrl.loadingTableCopiedEntities = false;

            if (taskStatesCtrl.dtInstancecEntities && taskStatesCtrl.dtInstancecEntities.reloadData) {
                taskStatesCtrl.dtInstancecEntities.reloadData(function (data) {
                }, false);
            }
        }

        taskStatesCtrl.makeFailedReferenceTable = function (isRoot, refreshData) {
            if (refreshData){
                if (taskStatesCtrl.dtInstancefReferences && taskStatesCtrl.dtInstancefReferences.reloadData) {
                    taskStatesCtrl.dtInstancefReferences.reloadData(function (data) {
                    }, false);
                    return;
                }
            }
            taskStatesCtrl.dtInstancefReferences = {};
            taskStatesCtrl.dtColumnsfReferences = [];
            taskStatesCtrl.dtColumnDefsfReferences = [];
            taskStatesCtrl.headersfReferences = [
                {
                    column: 'RerernceTableName',
                    name: 'Reference Table name',
                    clickAble: false
                }
            ];

            for (var i = 0; i < taskStatesCtrl.headersfReferences.length; i++) {
                taskStatesCtrl.dtColumnsfReferences.push(DTColumnBuilder.newColumn(taskStatesCtrl.headersfReferences[i].column).withTitle(taskStatesCtrl.headersfReferences[i].name));
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskStatesCtrl.fReferences);
                return deferred.promise;
            };

            taskStatesCtrl.dtOptionsfReferences = DTOptionsBuilder.fromFnPromise(function () {
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

            taskStatesCtrl.dtInstanceCallbackfReferences = function (dtInstance) {
                if (angular.isFunction(taskStatesCtrl.dtInstancefReferences)) {
                    taskStatesCtrl.dtInstancefReferences(dtInstance);
                } else if (angular.isDefined(taskStatesCtrl.dtInstancefReferences)) {
                    taskStatesCtrl.dtInstancefReferences = dtInstance;
                }
            };
            if (taskStatesCtrl.dtInstancefReferences.changeData != null)
                taskStatesCtrl.dtInstancefReferences.changeData(getTableData());

            taskStatesCtrl.loadingTableFailedReferences = false;


        }

        taskStatesCtrl.makeFailedEntitiesTable = function (isRoot, refreshData) {
            if (refreshData){
                if (taskStatesCtrl.dtInstancefEntities && taskStatesCtrl.dtInstancefEntities.reloadData) {
                    taskStatesCtrl.dtInstancefEntities.reloadData(function (data) {
                    }, false);
                    return;
                }
            }
            taskStatesCtrl.dtInstancefEntities = {};
            taskStatesCtrl.dtColumnsfEntities = [];
            taskStatesCtrl.dtColumnDefsfEntities = [];
            if (!isRoot) {
                taskStatesCtrl.headersfEntities = [
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
                    },
    
                ];
            }
            else{
                taskStatesCtrl.headersfEntities = [
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
            }

            let clickableCol = (data, type, full) => {
                return `<a ng-click="taskStatesCtrl.openStatsModal('${full.targetId}')">  ${data} </a>`;
            }

            for (var i = 0; i < taskStatesCtrl.headersfEntities.length; i++) {
                if (taskStatesCtrl.headersfEntities[i].clickAble) {
                    taskStatesCtrl.dtColumnsfEntities.push(DTColumnBuilder.newColumn(taskStatesCtrl.headersfEntities[i].column).withTitle(taskStatesCtrl.headersfEntities[i].name).renderWith(clickableCol));
                } else {
                    taskStatesCtrl.dtColumnsfEntities.push(DTColumnBuilder.newColumn(taskStatesCtrl.headersfEntities[i].column).withTitle(taskStatesCtrl.headersfEntities[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskStatesCtrl.fEntities);
                return deferred.promise;
            };

            taskStatesCtrl.dtOptionsfEntities = DTOptionsBuilder.fromFnPromise(function () {
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
                    "caseInsensitive": false,
                    "dt" : function(){
                        console.log("search");
                    },
                });

            taskStatesCtrl.dtInstanceCallbackfEntities = function (dtInstance) {
                if (angular.isFunction(taskStatesCtrl.dtInstancefEntities)) {
                    taskStatesCtrl.dtInstancefEntities(dtInstance);
                } else if (angular.isDefined(taskStatesCtrl.dtInstancefEntities)) {
                    taskStatesCtrl.dtInstancefEntities = dtInstance;
                }
            };
            if (taskStatesCtrl.dtInstancefEntities.changeData != null)
                taskStatesCtrl.dtInstancefEntities.changeData(getTableData());

            taskStatesCtrl.loadingTableFailedEntities = false;

        };

        taskStatesCtrl.makeTables = function (isRoot,refreshData) {

            // taskHistoryTableCtrl.dtInstance.reloadData(function (data) {
            // }, false);

            taskStatesCtrl.makeCopiedReferenceTable(isRoot, refreshData);
            taskStatesCtrl.makeCopiedEntitiesTable(isRoot, refreshData);
            taskStatesCtrl.makeFailedReferenceTable(isRoot, refreshData);
            taskStatesCtrl.makeFailedEntitiesTable(isRoot, refreshData);
        }

        var body = {
            taskExecutionId: taskStatesCtrl.tasksExecID
        };

        if (taskStatesCtrl.type == "EXTRACT") {
            if (taskStatesCtrl.refcount > 0 && taskStatesCtrl.selectionMethod !== "REF") {
                body.fabricExecutionId = taskStatesCtrl.fabricExecID;
            } else if (taskStatesCtrl.refcount == 0 && taskStatesCtrl.selectionMethod !== "REF") {
                body.fabricExecutionId = taskStatesCtrl.fabricExecID;
                delete body.taskExecutionId;
            }
        }

        taskStatesCtrl.collapseNode = (item) => {
            TDMService.getLUChildren({
                taskExecutionId: taskStatesCtrl.tasksExecID,
                lu_name: item.lu_name
            }).then(response => {
                response.result.forEach(function(child) {
                    var found = _.find(item.children,{lu_name : child.lu_name});
                    if (!found){
                        if (!item.children){
                            item.children = [];
                        }
                        item.children.push({
                            lu_name: child.lu_name,
                            children: [],
                            collapsed: true,
                            hasChildren: child.count > 0,
                            errorInPath: false,
                            count: child.count
                        });
                    }
                });
            });
        };

        let getTDMStats = (body, isRoot, luName) => {
            if (!body.type){
                taskStatesCtrl.loadingTablesData = true;
            }
        TDMService.getTDMStats(body).then(function (response) {

                if (response.errorCode != 'SUCCESS') {
                    //TODO show Error
                    return;
                } else {
                    let tableData = response.result.data;

                    if (response.result.luTree) {
                        $scope.luTreeMenu = response.result.luTree;

                        if ($scope.luTreeMenu[0]) {
                            taskStatesCtrl.selectedLU = $scope.luTreeMenu[0];
                        }
                    }

                    if (tableData) {
                        if (tableData["Copied Reference per execution"]) {
                            if (!body.type){
                                taskStatesCtrl.totalCopiedReference = tableData["Copied Reference per execution"].NoOfEntities;
                            }
                            taskStatesCtrl.cReferences = tableData["Copied Reference per execution"].entitiesList;
                            taskStatesCtrl.cReferencesTitle = `${$filter('translate')('COPIED_REF_TABLES')}`;
                        }
                        if (tableData["Copied entities per execution"]) {
                            if (!body.type){
                                taskStatesCtrl.totalCopiedEntities = tableData["Copied entities per execution"].NoOfEntities;
                            }
                            taskStatesCtrl.cEntities = tableData["Copied entities per execution"].entitiesList;
                            taskStatesCtrl.cEntitiesTitle = isRoot ? $filter('translate')('COPIED_ENTITIES') : `${$filter('translate')('COPIED')} ${luName} ${$filter('translate')('LIST')}`;

                        }
                        if (tableData["Failed Reference per execution"]) {
                            if (!body.type){
                                taskStatesCtrl.totalFailedReference = tableData["Failed Reference per execution"].NoOfEntities;
                            }
                            taskStatesCtrl.fReferences = tableData["Failed Reference per execution"].entitiesList;
                            taskStatesCtrl.fReferencesTitle = `${$filter('translate')('FAILED_REF_TABLES')}`;

                        }
                        if (tableData["Failed entities per execution"]) {
                            if (!body.type){
                                taskStatesCtrl.totalFailedEntities = tableData["Failed entities per execution"].NoOfEntities;
                            }
                            taskStatesCtrl.fEntities = tableData["Failed entities per execution"].entitiesList;
                            taskStatesCtrl.fEntitiesTitle = isRoot ? $filter('translate')('FAILED_ENTITIES') : `${$filter('translate')('FAILED')} ${luName} ${$filter('translate')('LIST')}`;
                        }


                    } else {
                        taskStatesCtrl.totalCopiedReference = 0;
                        taskStatesCtrl.totalCopiedEntities = 0;
                        taskStatesCtrl.totalFailedReference = 0;
                        taskStatesCtrl.totalFailedEntities = 0;

                        taskStatesCtrl.fEntities = [];
                        taskStatesCtrl.fReferences = [];
                        taskStatesCtrl.cEntities = [];
                        taskStatesCtrl.cReferences = [];
                    }

                    taskStatesCtrl.makeTables(isRoot, body.type);

                }
                if (!body.type) {
                    taskStatesCtrl.loadingTablesData = false;
                }
            })

        };

        getTDMStats(body, true);
        

        taskStatesCtrl.updateTDMStats  = (item, entityId, type) => {
            getTDMStats({
                taskExecutionId: taskStatesCtrl.tasksExecID,
                lu_name: item.lu_name,
                entityId : entityId,
                type: type,
            }, item.isRoot, item.lu_name);
            taskStatesCtrl.selectedLU.selected = false;
            taskStatesCtrl.selectedLU = item;

            for (i of $scope.luTreeMenu) {
                i.selected = false;
                if (i.children) {
                    for (child of i.children) {
                        child.selected = false
                    }
                }
            }
        };
        taskStatesCtrl.openTab = function (tab) {
            taskStatesCtrl.tab = tab;
        };
        taskStatesCtrl.searchText = '';
        $element.on('search.dt', function(e, api) {
            if (taskStatesCtrl.searchText != api.oPreviousSearch.sSearch){
                taskStatesCtrl.searchText = api.oPreviousSearch.sSearch;
                if (taskStatesCtrl.searchTimeout){
                    $timeout.cancel(taskStatesCtrl.searchTimeout);
                }
                taskStatesCtrl.searchTimeout = $timeout(function(){
                    const dataMap = {
                        1: 'Copied entities per execution',
                        2: 'Failed entities per execution',
                        3: 'Copied Reference per execution',
                        4: 'Failed Reference per execution',
                    }
                    taskStatesCtrl.updateTDMStats(taskStatesCtrl.selectedLU,taskStatesCtrl.searchText,dataMap[taskStatesCtrl.tab]);
                },1000);
            }
        });
    }
    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        link: function(scope,element,attrs){
            element.on('$destroy', function(){
                angular.element('body').on('search.dt',null);
            });
        },
        controller: controller,
        controllerAs: 'taskStatesCtrl'
    };

}

angular
    .module('TDM-FE')
    .directive('taskStatsDirective', taskStatsDirective);