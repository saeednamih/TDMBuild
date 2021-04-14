function updateLogicalUnitsDirective (){

    var template = "views/businessEntities/updateLogicalUnit.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var updateLogicalUnitsCtrl = this;
        updateLogicalUnitsCtrl.logicalUnit = $scope.logicalUnits[$scope.logicalUnitIndex];

        updateLogicalUnitsCtrl.attachedLogicalUnits = angular.copy($scope.logicalUnits);
        updateLogicalUnitsCtrl.attachedLogicalUnits.splice($scope.logicalUnitIndex,1);
        updateLogicalUnitsCtrl.attachedLogicalUnits = _.map(updateLogicalUnitsCtrl.attachedLogicalUnits,function(lu){
            return {
                lu_id : lu.lu_id,
                lu_name : lu.lu_name
            }
        });

        TDMService.getGenericAPI('dataCenters').then(function(response){
            updateLogicalUnitsCtrl.dataCenters = _.unique(response.result.filter( item => item.status === 'ALIVE'),'dc');
        });

        updateLogicalUnitsCtrl.updateLogicalUnit = function(){
            if (updateLogicalUnitsCtrl.logicalUnit.last_executed_lu){
                delete updateLogicalUnitsCtrl.logicalUnit.lu_parent_name;
                delete updateLogicalUnitsCtrl.logicalUnit.lu_parent_id;
            }
            if (updateLogicalUnitsCtrl.logicalUnit.lu_parent_name){
                var temp = _.find(updateLogicalUnitsCtrl.attachedLogicalUnits,{lu_name : updateLogicalUnitsCtrl.logicalUnit.lu_parent_name});
                if (temp){
                    updateLogicalUnitsCtrl.logicalUnit.lu_parent_id = temp.lu_id;
                }
            }
            else {
                delete updateLogicalUnitsCtrl.logicalUnit.lu_parent_id;
            }
            TDMService.putLogicalUnit(updateLogicalUnitsCtrl.logicalUnit).then(function(response){
                if (response.errorCode == "SUCCESS") {
                    if (!updateLogicalUnitsCtrl.logicalUnit.lu_parent_name){
                        updateLogicalUnitsCtrl.logicalUnit.lu_parent_name = "";
                    }
                    $scope.logicalUnits[$scope.logicalUnitIndex] = updateLogicalUnitsCtrl.logicalUnit;
                    $scope.data.reloadData();
                    updateLogicalUnitsCtrl.close();
                    toastr.success("Logical unit updated successfully");
                }
                else{
                    updateLogicalUnitsCtrl.logicalUnitAlert = {
                        type: 'danger', msg: 'failed to Add Logical Units [' + response.message + ']'
                    }
                }
            });
        };

        updateLogicalUnitsCtrl.closeAlert = function () {
            delete updateLogicalUnitsCtrl.logicalUnitAlert;
        };

        updateLogicalUnitsCtrl.close = function(){
            $scope.data.close();
        }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            data: '=',
            logicalUnits : "=",
            logicalUnitIndex : "=",
        },
        controller: controller,
        controllerAs :'updateLogicalUnitsCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('updateLogicalUnitsDirective', updateLogicalUnitsDirective);