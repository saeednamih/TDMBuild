function newLogicalUnitsDirective (){

    var template = "views/businessEntities/newLogicalUnits.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var newLogicalUnitsCtrl = this;

        newLogicalUnitsCtrl.attachedLogicalUnits = $scope.logicalUnits;
        
        TDMService.getGenericAPI('dataCenters').then(function(response){
            newLogicalUnitsCtrl.dataCenters = _.unique(response.result.filter( item => item.status === 'ALIVE'),'dc');
        });

        TDMService.getLogicalUnits().then(function (response) {
            newLogicalUnitsCtrl.logicalUnits = _.map(response.result,function(lu){
                return {
                    logical_unit : lu
                }
            });
            _.remove(newLogicalUnitsCtrl.logicalUnits,function(logicalUnit){
                if (_.find(newLogicalUnitsCtrl.attachedLogicalUnits,{lu_name : logicalUnit.logical_unit})){
                    return true;
                }
                return false;
            });
            for (var i = 0;i < newLogicalUnitsCtrl.logicalUnits.length ; i++){
                newLogicalUnitsCtrl.parentLogicalUnits.push({
                    logical_unit : newLogicalUnitsCtrl.logicalUnits[i].logical_unit
                })
            }
        });

        

        newLogicalUnitsCtrl.parentLogicalUnits = _.map(newLogicalUnitsCtrl.attachedLogicalUnits,function(logicalUnit){
            return {
                logical_unit : logicalUnit.lu_name,
                lu_id : logicalUnit.lu_id
            }
        });
        newLogicalUnitsCtrl.newLogicalUnits = [
            {
            }
        ];
        

        newLogicalUnitsCtrl.addLogicalUnit = function(){
            newLogicalUnitsCtrl.newLogicalUnits.push({

            });
        };

        newLogicalUnitsCtrl.addLogicalUnits = function(){
            if (newLogicalUnitsCtrl.chooseOption == 'all'){
                if (newLogicalUnitsCtrl.logicalUnits.length == 0){
                    newLogicalUnitsCtrl.logicalUnitAlert = {
                        type: 'danger', msg: 'There are no Logical Units to add'
                    }
                    return;
                }
                newLogicalUnitsCtrl.newLogicalUnits = _.map(newLogicalUnitsCtrl.logicalUnits,function(lu){
                    return {
                        lu_name : lu.logical_unit,
                        lu_description : lu.logical_unit
                    }
                });
            }

            newLogicalUnitsCtrl.newLogicalUnits = _.map(newLogicalUnitsCtrl.newLogicalUnits,function(lu){
                if (lu.last_executed_lu){
                    delete lu.lu_parent;
                }
                else{
                    lu.last_executed_lu = false;
                }
                return lu;
            });
            TDMService.postLogicalUnits($scope.data.beId, $scope.data.beName, { logicalUnits:  newLogicalUnitsCtrl.newLogicalUnits}).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    for (var i = 0;i < response.result.length ; i++){
                        var logicalUnit = response.result[i];
                        newLogicalUnitsCtrl.attachedLogicalUnits.push({
                            lu_dc_name : logicalUnit.lu_dc_name || "",
                            lu_id : logicalUnit.lu_id,
                            lu_name : logicalUnit.lu_name,
                            lu_description : logicalUnit.lu_description || null,
                            be_id : $scope.data.beId,
                            lu_parent_id : logicalUnit && logicalUnit.lu_parent && logicalUnit.lu_parent.lu_id,
                            lu_parent_name :  logicalUnit && logicalUnit.lu_parent && logicalUnit.lu_parent.logical_unit || "",
                            product_name : "",
                            last_executed_lu : logicalUnit.last_executed_lu,
                            execution_plan_name : 'ep' + logicalUnit.lu_name
                        });
                    }
                    $scope.data.reloadData();
                    newLogicalUnitsCtrl.close();
                    toastr.success("Logical units added successfully");
                }
                else {
                    newLogicalUnitsCtrl.logicalUnitAlert = {
                        type: 'danger', msg: 'failed to Add Logical Units [' + response.message + ']'
                    }
                }
            });
        };

        newLogicalUnitsCtrl.deleteLogicalUnit = function(index){
            newLogicalUnitsCtrl.newLogicalUnits.splice(index,1);
        };

        newLogicalUnitsCtrl.closeAlert = function () {
            delete newLogicalUnitsCtrl.logicalUnitAlert;
        };

        newLogicalUnitsCtrl.close = function(){
            $scope.data.close();
        }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            data: '=',
            logicalUnits : "="
        },
        controller: controller,
        controllerAs :'newLogicalUnitsCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newLogicalUnitsDirective', newLogicalUnitsDirective);