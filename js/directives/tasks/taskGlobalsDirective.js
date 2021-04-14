function taskGlobals() {

    var template = "views/tasks/taskGlobals.html";

    var controller = function ($scope, TDMService, $timeout,DTOptionsBuilder , DTColumnBuilder, $q, $uibModal, $compile) {
        var taskGlobals = this;
        taskGlobals.dtInstance = {};
        taskGlobals.dtColumns = [];
        taskGlobals.dtColumnDefs = [];
        taskGlobals.globals = $scope.data;
        taskGlobals.headers = [
            {
                column : 'global_name',
                name : 'Global Name'
            },
            {
                column : 'global_value',
                name : 'Global Value'
            },
            {
                column : 'actions',
                name : ''
            },
        ];

        var renderSelectionColumn = function(data, type, full, meta){
            return '<div class="col-lg-6">' + 
            '<button type="button" uib-tooltip="Edit Global" tooltip-placement="top" class="btn btn-circle btn-primary" ' + 
            'ng-click="taskGlobals.editGlobal(taskGlobals.globals[' + meta.row + '])"><i class="fa fa-pencil" aria-hidden="true"></i></button>' +
            '</div>' + 
            '<div class="col-lg-6"><button type="button" uib-tooltip="Delete Global" tooltip-placement="top" class="btn btn-circle btn-danger" ' + 
            'ng-click="taskGlobals.removeGlobal(\'' + full.global_name +'\')"><i class="fa fa-trash" aria-hidden="true"></i></button>' +
            '</div>'; 
            
        };

        for (var i = 0; i <  taskGlobals.headers.length ; i++) {
            if (taskGlobals.headers[i].column == 'actions'){
                taskGlobals.dtColumns.push(DTColumnBuilder.newColumn(taskGlobals.headers[i].column).withTitle(taskGlobals.headers[i].name).renderWith(renderSelectionColumn).withOption('width', '200'));
            }
            else{
                taskGlobals.dtColumns.push(DTColumnBuilder.newColumn(taskGlobals.headers[i].column).withTitle(taskGlobals.headers[i].name));
            }
        }

        var getTableData = function () {
            var deferred = $q.defer();
            deferred.resolve(taskGlobals.globals);
            return deferred.promise;
        };

        taskGlobals.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
            .withDOM('<"html5buttons"B>lTfgitp')
            .withOption('createdRow', function (row) {
                // Recompiling so we can bind Angular directive to the DT
                $compile(angular.element(row).contents())($scope);
            })
            .withOption('scrollX', false)
            .withOption('lengthChange', false)
            .withOption('paging', false)
            .withButtons([])
            .withOption("caseInsensitive", true)
            .withOption('search',{
                "caseInsensitive": false
            });

            taskGlobals.dtOptions.withLightColumnFilter({
                0: {
                    type: 'text'
                },
                1: {
                    type: 'text'
                }
            });

            taskGlobals.removeGlobal = function(globalName){
                var index = _.findIndex(taskGlobals.globals,{global_name : globalName});
                if (index >= 0){
                    taskGlobals.globals.splice(index,1);
                    $timeout(function(){
                        if (taskGlobals.dtInstance && taskGlobals.dtInstance.reloadData){
                            taskGlobals.dtInstance.reloadData(function(){
    
                            });
                        }
                    },100);
                }
            };

            taskGlobals.editGlobal = function(globalName){
                taskGlobals.addGlobals(true,globalName);
            }

            taskGlobals.addGlobals = function(edit,global){
                $uibModal.open({

                    templateUrl: 'views/tasks/addGlobal.html',
                    windowTopClass : "taskGlobals",
                    resolve: {
                        globals: function () {
                            return taskGlobals.globals;
                        }
                    },
                    controller: function ($scope, $uibModalInstance, TDMService, globals) {
                        var addGlobalCtrl = this;
                        addGlobalCtrl.edit = edit;
                        addGlobalCtrl.data = {

                        };
                        if (!edit) {
                            TDMService.getAllGlobals(0).then(function(response){
                                addGlobalCtrl.globals = _.filter(response.result, function(global){
                                    return _.findIndex(globals,{global_name : global}) < 0;
                                });
                            });
                        }
                        else {
                            addGlobalCtrl.data = global;
                            addGlobalCtrl.globals = [{
                                globalName : global.global_name
                            }];
                        }

                        addGlobalCtrl.addNewGlobal = function(){
                            $uibModalInstance.close(addGlobalCtrl.data);
                        };

                        addGlobalCtrl.close = function () {
                            $uibModalInstance.close();
                        };
                    },
                    controllerAs: 'addGlobalCtrl'
                }).result.then(function (global) {
                    if (global && global.global_name && global.global_value){
                        var origGlobal = _.find(taskGlobals.globals,{global_name : global.global_name});
                        if (origGlobal){
                            origGlobal.global_value = global.global_value;
                        }
                        else{
                            taskGlobals.globals.push(global);
                        }
                        $timeout(function(){
                            if (taskGlobals.dtInstance && taskGlobals.dtInstance.reloadData){
                                taskGlobals.dtInstance.reloadData(function(){

                                });
                            }
                        },100);
                    }
                });
            }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            data: '='
        },
        controller: controller,
        controllerAs: 'taskGlobals'
    };
}


angular
    .module('TDM-FE')
    .directive('taskGlobals', taskGlobals)