function referenceTask (){

    var template = "views/tasks/referenceTask.html";

    var controller = function ($scope,TDMService,$timeout) {
        var referenceTaskCtrl = this;
        console.log($scope.taskData);
        //var logicalUnits = $scope.logicalUnits;
        // if (!($scope.taskData.task_type == 'LOAD' && !$scope.taskData.version_ind)){
        //     logicalUnits = [$scope.logicalUnit];
        // }
        var prevRefs = [];
        if ($scope.taskData && $scope.taskData.refList){
            prevRefs = _.filter($scope.taskData.refList,{selected : true});
        }
        referenceTaskCtrl.toDate = new Date();
        referenceTaskCtrl.fromDate = new Date();
        referenceTaskCtrl.fromDate.setDate(referenceTaskCtrl.fromDate.getDate() - 30);
        referenceTaskCtrl.timeRange = {
            fromDate : referenceTaskCtrl.fromDate,
            toDate : referenceTaskCtrl.toDate
        };
        referenceTaskCtrl.reloadVersionsTable = {};
        $scope.taskData.refList = null;

        TDMService.postGenericAPI('task/getReferenceTaskTable',{
            task_type : $scope.taskData.task_type,
            version_ind : $scope.taskData.version_ind,
            logicalUnits : _.map($scope.logicalUnits,'lu_name')
        }).then(function(response){
            $scope.taskData.refList = _.map(response.result,function(refTable){
                refTable.lu_name = refTable.logical_unit_name || refTable.lu_name;
                refTable.logical_unit_name = refTable.lu_name;
                refTable.ref_table_name = refTable.reference_table_name || refTable.ref_table_name;
                refTable.reference_table_name = refTable.ref_table_name;
                if(_.find(prevRefs,{
                    lu_name : refTable.logical_unit_name,
                    interface_name: refTable.interface_name,
                    schema_name : refTable.schema_name, 
                    ref_table_name : refTable.reference_table_name
                })){
                    refTable.selected = true;
                }
                return refTable;
            });
            referenceTaskCtrl.getVersionsData();
        });

        referenceTaskCtrl.getVersionsData = function(){
            if ($scope.taskData.task_type == 'LOAD' && $scope.taskData.version_ind){
                if (_.filter($scope.taskData.refList,{selected: true}).length > 0){
                    if(referenceTaskCtrl.versionsTimeout){
                        $timeout.cancel(referenceTaskCtrl.versionsTimeout);
                    }
                    referenceTaskCtrl.versionsTimeout = $timeout(function(){
                        referenceTaskCtrl.loadingVersions = true;
                        var from = new Date(referenceTaskCtrl.timeRange.fromDate);
                        from.setHours(0);
                        from.setMinutes(0);
                        from.setSeconds(0);
                        var to = new Date(referenceTaskCtrl.timeRange.toDate);
                        to.setHours(23);
                        to.setMinutes(59);
                        to.setSeconds(59);
                        TDMService.postGenericAPI('task/getVersionReferenceTaskTable',{
                            source_env_name : $scope.taskData.source_env_name,
                            fromDate : from,
                            toDate : to,
                            lu_list : _.map($scope.logicalUnits, 'lu_name'),
                            refList : _.map(_.filter($scope.taskData.refList,{selected: true}),'reference_table_name')
                        }).then(function(response){
                            $scope.taskData.refLoadVersions = response.result;
                            referenceTaskCtrl.refVersions = _.sortBy(response.result, function(version){
                                return -1 * new Date(version.version_datetime);
                            });
                            $timeout(function(){
                                if (referenceTaskCtrl.reloadVersionsTable.dtInstanceVersions && referenceTaskCtrl.reloadVersionsTable.dtInstanceVersions.reloadData){
                                    referenceTaskCtrl.reloadVersionsTable.dtInstanceVersions.reloadData(function(){
        
                                    });
                                }
                            },100);
                            if ($scope.taskData.selected_ref_version_task_exe_id){
                                var selectedRefVersion = _.find(referenceTaskCtrl.refVersions,{task_execution_id : $scope.taskData.selected_ref_version_task_exe_id});
                                if (selectedRefVersion){    
                                    $scope.taskData.selectedRefVersionToLoad = selectedRefVersion.task_execution_id;
                                }
                                $scope.taskData.selected_ref_version_task_exe_id = null;
                            }
                            referenceTaskCtrl.loadingVersions = false;
                        });
                    },300);
                }
            }
        }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            taskData: '=',
            logicalUnits: '=',
            logicalUnit: '=',
        },
        controller: controller,
        controllerAs :'referenceTaskCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('referenceTask', referenceTask);