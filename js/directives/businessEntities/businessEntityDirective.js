function businessEntityDirective() {

    var template = "views/businessEntities/businessEntity.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, SweetAlert, $uibModal, toastr, $timeout, AuthService,DTColumnBuilder,DTOptionsBuilder,$q,$compile) {
        var businessEntityCtrl = this;
        businessEntityCtrl.businessEntityData = $scope.content.businessEntity;

        businessEntityCtrl.disableChange = (businessEntityCtrl.businessEntityData.be_status == 'Inactive' || !AuthService.authorizedToEdit(0));

        TDMService.getBEProductCount(businessEntityCtrl.businessEntityData.be_id).then(function(response){
            if (response.errorCode == "SUCCESS") {
                businessEntityCtrl.productCount = response.result;
            }
            else {
                businessEntityCtrl.productCount = 0;
            }
        });

        businessEntityCtrl.saveChanges = function () {
            TDMService.updateBusinessEntity(businessEntityCtrl.businessEntityData.be_id, businessEntityCtrl.businessEntityData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "Updated Successfully");
                    $timeout(function () {
                        $scope.content.openBusinessEntities();
                    }, 400)
                }
                else {
                    toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to Update : " + response.message);
                }
            });
        };

        businessEntityCtrl.deleteBusinessEntity = function () {
            if (businessEntityCtrl.productCount > 0) {
                SweetAlert.swal({
                        title: "Business Entity " + businessEntityCtrl.businessEntityData.be_name +" will be removed from related products. Active tasks which associated to " +
                        " " + businessEntityCtrl.businessEntityData.be_name + " will be set to Inactive. Are you sure to want to delete the BE?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        confirmButtonText: "No",
                        cancelButtonText: "Yes",
                        closeOnConfirm: true,
                        closeOnCancel: true,
                        animation: "false",
                        customClass: "animated fadeInUp"
                    },
                    function (isConfirm) {
                        if (!isConfirm) {
                            TDMService.deleteBusinessEntity(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "deleted Successfully");
                                    $timeout(function () {
                                        $scope.content.openBusinessEntities();
                                    }, 400)
                                }
                                else {
                                    toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to delete");
                                }
                            });
                        }
                    });
            }
            else{
                TDMService.deleteBusinessEntity(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "deleted Successfully");
                        $timeout(function () {
                            $scope.content.openBusinessEntities();
                        }, 400)
                    }
                    else {
                        toastr.error("Business Entity # " + businessEntityCtrl.businessEntityData.be_name, "failed to delete");
                    }
                });
            }
        };

        businessEntityCtrl.addLogicalUnit = function () {
            var logicalUnitModalInstance = $uibModal.open({

                // templateUrl: 'views/businessEntities/logicalUnitModal.html',
                template: '<new-logical-units-directive data="logicalUnitCtrl.data" logical-units="logicalUnitCtrl.logicalUnits"></new-logical-units-directive>',
                size : "modal-lg",
                windowClass : 'LogicalUnitWindow',
                resolve: {
                    beId: businessEntityCtrl.businessEntityData.be_id,
                    beName: function () {
                        return businessEntityCtrl.businessEntityData.be_name;
                    },
                },
                controller: function ($scope, $uibModalInstance, TDMService, beId, beName) {
                    var logicalUnitCtrl = this;
                    logicalUnitCtrl.logicalUnits =  businessEntityCtrl.logicalUnitsData;
                    logicalUnitCtrl.beId = beId;
                    logicalUnitCtrl.beName = beName;
                    logicalUnitCtrl.close = function () {
                        $uibModalInstance.close();
                    };


                    logicalUnitCtrl.data = {
                        close : logicalUnitCtrl.close,
                        beId :beId,
                        beName :beName,
                        reloadData : function(){
                            businessEntityCtrl.dtInstance.reloadData(function(data){}, true);
                        }
                    }
                    return;

                },
                controllerAs: 'logicalUnitCtrl'
            });
        };

        businessEntityCtrl.PostExecutionProcessActions = function (add,index) {
            $uibModal.open({

                // templateUrl: 'views/businessEntities/logicalUnitModal.html',
                template: '<post-execution-process data="data" post-execution-process="postExecutionData"></post-execution-process>',
                size : "modal-lg",
                windowClass : 'LogicalUnitWindow',
                resolve: {
                    beId: businessEntityCtrl.businessEntityData.be_id,
                    beName: function () {
                        return businessEntityCtrl.businessEntityData.be_name;
                    },
                    postExecutionData: function(){
                        if (!add) {
                            return businessEntityCtrl.postExecutionData[index];
                        }
                        return null;
                    },
                },
                controller: function ($scope, $uibModalInstance, beId, beName, postExecutionData) {
                    $scope.beId = beId;
                    $scope.beName = beName;
                    $scope.postExecutionData = postExecutionData;
                    $scope.close = function () {
                        $uibModalInstance.close();
                    };


                    $scope.data = {
                        close : $scope.close,
                        beId :beId,
                        beName :beName,
                        postExecutionData: businessEntityCtrl.postExecutionData,
                        reloadData : function(){
                            businessEntityCtrl.dtInstancePE.reloadData(function(data){}, true);
                        }
                    }
                    return;

                }
            });
        };

        businessEntityCtrl.updateLogicalUnit = function(index){
            var logicalUnitModalInstance = $uibModal.open({

                // templateUrl: 'views/businessEntities/logicalUnitModal.html',
                template: '<update-logical-units-directive data="logicalUnitCtrl.data" logical-units="logicalUnitCtrl.logicalUnits" logical-unit-index="logicalUnitCtrl.logicalUnitIndex"></update-logical-units-directive>',
                size : "modal-lg",
                resolve: {
                    beId: businessEntityCtrl.businessEntityData.be_id,
                    beName: function () {
                        return businessEntityCtrl.businessEntityData.be_name;
                    },
                },
                controller: function ($scope, $uibModalInstance, TDMService, beId, beName) {
                    var logicalUnitCtrl = this;
                    logicalUnitCtrl.logicalUnits =  businessEntityCtrl.logicalUnitsData;
                    logicalUnitCtrl.logicalUnitIndex =  index;
                    logicalUnitCtrl.close = function () {
                        $uibModalInstance.close();
                    };
                    logicalUnitCtrl.data = {
                        close : logicalUnitCtrl.close,
                        reloadData : function(){
                            businessEntityCtrl.dtInstance.reloadData(function(data){}, true);
                        }
                    }
                    return;

                },
                controllerAs: 'logicalUnitCtrl'
            });
        }

        businessEntityCtrl.removeLogicalUnitErrorMessage = function(index){
            toastr.error('LU appears as Parent LU – can’t be removed');
        }

        businessEntityCtrl.removeLogicalUnit = function (index) {
            TDMService.getLogicalUnits().then(function (response) {
                var luToRemove = businessEntityCtrl.logicalUnitsData[index];
                if (response.errorCode == "SUCCESS") {
                    var childLU = _.find(response.result, {lu_parent_id: luToRemove.lu_id});
                    if (!childLU) {
                        childLU = _.find(businessEntityCtrl.logicalUnitsData, {lu_parent_id: luToRemove.lu_id});
                    }
                    if (!childLU) {
                        TDMService.deleteLogicalUnit(businessEntityCtrl.businessEntityData.be_id, businessEntityCtrl.businessEntityData.be_name, luToRemove.lu_id, luToRemove.lu_name).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                businessEntityCtrl.logicalUnitsData.splice(index, 1);
                                businessEntityCtrl.dtInstance.reloadData(function(data){}, true);
                                if (businessEntityCtrl.logicalUnitsData.length == 0){
                                    TDMService.deleteTaskForBE(businessEntityCtrl.businessEntityData.be_id).then(function(response){

                                    });
                                }
                            }
                            else {
                                toastr.error("Logical Unit " + businessEntityCtrl.logicalUnitsData[index].lu_name, "Failed to delete : " + response.message);
                            }
                        })
                    } else {
                        toastr.error("Logical Unit " + businessEntityCtrl.logicalUnitsData[index].lu_name + " is a parent for lu " + childLU.lu_name);
                    }
                }
                else {
                    toastr.error("Failed to delete logical Unit  " + luToRemove.lu_name);
                }
            });
        };

        businessEntityCtrl.loadingTable = true;
        TDMService.getBELogicalUnits(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                businessEntityCtrl.logicalUnitsData = response.result;
                if (response.errorCode != 'SUCCESS'){
                    //TODO show Error
                    return;
                }
                businessEntityCtrl.dtInstance = {};
                businessEntityCtrl.dtColumns = [];
                businessEntityCtrl.dtColumnDefs = [];
                businessEntityCtrl.headers = [
                    {
                        column : 'lu_name',
                        name : 'Name'
                    },
                    {
                        column : 'lu_description',
                        name : 'Description'
                    },
                    {
                        column : 'lu_parent_name',
                        name : 'Parent LU'
                    },
                    {
                        column : 'product_name',
                        name : 'Product Name',
                        clickAble : false
                    },
                    {
                        column : 'lu_dc_name',
                        name : 'Data Center',
                        clickAble : false
                    }
                ];

                if (!businessEntityCtrl.disableChange){
                    businessEntityCtrl.headers.unshift({
                        column : 'actions',
                        name : ''
                    })
                }

                var actionsColumn = function(data, type, full, meta){
                    return '' +
                        '<div class="col-lg-6"><button type="button" uib-tooltip="Edit Logical Unit" tooltip-placement="right"' +
                        'class="btn btn-circle btn-primary" role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ng-click="businessEntityCtrl.updateLogicalUnit('+meta.row+')"><i class="fa fa-pencil" aria-hidden="true"></i></button></div>' +
                        '<div class="col-lg-6">' +
                        '<button type="button" ng-show="!(businessEntityCtrl.logicalUnitsData | checkIfLogicalUnitIsParent:' + meta.row + ')" uib-tooltip="Delete Logical Unit" tooltip-placement="right"' +
                        'class="btn btn-circle btn-danger" ng-click="businessEntityCtrl.removeLogicalUnitErrorMessage('+ meta.row +')"' +
                        'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ><i class="fa fa-trash" aria-hidden="true"></i></button>'+
                        '<button type="button" ng-show="businessEntityCtrl.logicalUnitsData | checkIfLogicalUnitIsParent:' + meta.row + '" uib-tooltip="Delete Logical Unit" tooltip-placement="right"' +
                        'class="btn btn-circle btn-danger" mwl-confirm ' +
                        'message="{{businessEntityCtrl.logicalUnitsData['+ meta.row +'].product_id == \'-1\' ? \' LU must be linked to a BE to enable its execution using the TDM GUI. Are you sure you want to delete this LU?\' : ' +
                        '\'Logical unit '+ businessEntityCtrl.logicalUnitsData[meta.row].lu_name + ' will be removed from related products. Active tasks which associated to '+ businessEntityCtrl.logicalUnitsData[meta.row].lu_name+ ' may be set to Inactive. Are you sure you want to delete the this LU?\'}}" ' +
                        'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="right" ' +
                        'on-confirm="businessEntityCtrl.removeLogicalUnit('+meta.row+')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                        'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ><i class="fa fa-trash" aria-hidden="true"></i></button></div>' +
                        '';
                };

                for (var i = 0; i <  businessEntityCtrl.headers.length ; i++) {
                    if (businessEntityCtrl.headers[i].column == 'actions') {
                        businessEntityCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntityCtrl.headers[i].column).withTitle(businessEntityCtrl.headers[i].name).renderWith(actionsColumn));
                    }
                    else {
                        businessEntityCtrl.dtColumns.push(DTColumnBuilder.newColumn(businessEntityCtrl.headers[i].column).withTitle(businessEntityCtrl.headers[i].name));
                    }
                }

                businessEntityCtrl.getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(businessEntityCtrl.logicalUnitsData);
                    return deferred.promise;
                };

                businessEntityCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                        return businessEntityCtrl.getTableData();
                    })
                    .withDOM('<"html5buttons"B>lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withButtons([
                    ])
                    .withOption("caseInsensitive",true)
                    .withOption('search',{
                        "caseInsensitive": false
                    });

                    if (businessEntityCtrl.logicalUnitsData && businessEntityCtrl.logicalUnitsData.length > 0){
                        businessEntityCtrl.dtOptions.withLightColumnFilter({
                            1 : {
                                type: 'text'
                            },
                            2 : {
                                type: 'text'
                            },
                            3 : {
                                type: 'select',
                                values: _.map(_.filter(_.unique(_.map(businessEntityCtrl.logicalUnitsData, 'lu_parent_name')),function(el2){
                                    if (el2 && el2 != null && el2 != ""){
                                        return true;
                                    }
                                    return false;
                                }),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            4 : {
                                type: 'select',
                                values: _.map(_.filter(_.unique(_.map(businessEntityCtrl.logicalUnitsData, 'product_name')),function(el2){
                                    if (el2 && el2 != null && el2 != ""){
                                        return true;
                                    }
                                    return false;
                                }),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            5 : {
                                type: 'select',
                                values: _.map(_.filter(_.unique(_.map(businessEntityCtrl.logicalUnitsData, 'lu_dc_name')),function(el2){
                                    if (el2 && el2 != null && el2 != ""){
                                        return true;
                                    }
                                    return false;
                                }),function(el){
                                    return {value : el,label :el}
                                })
                            }
                        });
                    }

                businessEntityCtrl.dtInstanceCallback = function (dtInstance) {
                    if (angular.isFunction(businessEntityCtrl.dtInstance)) {
                        businessEntityCtrl.dtInstance(dtInstance);
                    } else if (angular.isDefined(businessEntityCtrl.dtInstance)) {
                        businessEntityCtrl.dtInstance = dtInstance;
                    }
                };
                if (businessEntityCtrl.dtInstance.changeData != null)
                    businessEntityCtrl.dtInstance.changeData(businessEntityCtrl.getTableData());

                    
                    $timeout(() => {
                        businessEntityCtrl.loadingTable = false;
                      });
                    
               
            }
            else {
                toastr.error("Business entity # " + businessEntityCtrl.businessEntityData.be_name, "Failed to get Logical Units");
            }
        });


        businessEntityCtrl.removePostExecutionProcess = function (index) {
            var postExecutionProcessToRemove = businessEntityCtrl.postExecutionData[index];
            TDMService.deleteExecutionProcess(businessEntityCtrl.businessEntityData.be_id, businessEntityCtrl.businessEntityData.be_name, postExecutionProcessToRemove.process_id, postExecutionProcessToRemove.process_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    businessEntityCtrl.postExecutionData.splice(index, 1);
                    businessEntityCtrl.dtInstancePE.reloadData(function(data){}, true);
                }
                else {
                    toastr.error("Post Execution Process " + businessEntityCtrl.postExecutionData[index].process_name, "Failed to delete : " + response.message);
                }
            });
        };

        businessEntityCtrl.loadingTablePE = true;
        TDMService.getBEPostExecutionProcess(businessEntityCtrl.businessEntityData.be_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {

                businessEntityCtrl.postExecutionData = response.result;
                if (response.errorCode != 'SUCCESS'){
                    //TODO show Error
                    return;
                }
                businessEntityCtrl.dtInstancePE = {};
                businessEntityCtrl.dtColumnsPE = [];
                businessEntityCtrl.dtColumnDefsPE = [];
                businessEntityCtrl.headersPE = [
                    {
                        column : 'process_name',
                        name : 'Process Name'
                    },
                    {
                        column : 'execution_order',
                        name : 'Execution Order'
                    },
                    {
                        column : 'process_description',
                        name : 'Description'
                    },
                ];

                if (!businessEntityCtrl.disableChange){
                    businessEntityCtrl.headersPE.unshift({
                        column : 'actions',
                        name : ''
                    })
                }

                var actionsColumnPE = function(data, type, full, meta){
                    return '' +
                        '<div class="col-lg-6"><button type="button" uib-tooltip="Edit Post Execution Process" tooltip-placement="top"' +
                        'class="btn btn-circle btn-primary" role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ng-click="businessEntityCtrl.PostExecutionProcessActions(false, ' + meta.row + ')"><i class="fa fa-pencil" aria-hidden="true"></i></button></div>' +
                        '<div class="col-lg-6">' +
                        '<button type="button" uib-tooltip="Delete Entity Group Query" tooltip-placement="right"' +
                        'class="btn btn-circle btn-danger" mwl-confirm ' +
                        'message="Process name '+ businessEntityCtrl.postExecutionData[meta.row].process_name + ' will be removed from the Business Entity. Active tasks which associated to '+ businessEntityCtrl.postExecutionData[meta.row].process_name + ' will be set to Inactive. Are you sure that you want to delete this process?" ' +
                        'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="right" ' +
                        'on-confirm="businessEntityCtrl.removePostExecutionProcess('+ meta.row +')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                        'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange"><i class="fa fa-trash" aria-hidden="true"></i></button><div>' +
                        '';
                };

                // return '' +
                // '<div class="col-lg-6"><button type="button" uib-tooltip="Edit Entity Selection Query" tooltip-placement="top"' +
                // 'class="btn btn-circle btn-primary" role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange" ng-click="businessEntityCtrl.EntitySelectionQueryActions(false, ' + meta.row + ')"><i class="fa fa-pencil" aria-hidden="true"></i></button></div>' +
                // '<div class="col-lg-6">' +
                // '<button type="button" uib-tooltip="Delete Entity Selection Query" tooltip-placement="top"' +
                // 'class="btn btn-circle btn-danger" mwl-confirm ' +
                // 'message="Entity Selection Query ['+ businessEntityCtrl.entitySelectionData[meta.row].entity_selection_name + '] will be removed from related Entities Selection Queries. Active tasks which associated to ['+ businessEntityCtrl.entitySelectionData[meta.row].entity_selection_name + '] may be set to Inactive. Are you sure you want to delete the this Entity Selection Query?" ' +
                // 'confirm-text="Yes <i class=\'glyphicon glyphicon-ok\'</i>" cancel-text="No <i class=\'glyphicon glyphicon-remove\'></i>"  placement="" ' +
                // 'on-confirm="businessEntityCtrl.removeEntitySelectionQuery('+ meta.row +')" on-cancel="cancelClicked = true" confirm-button-type="danger" cancel-button-type="default"' +
                // 'role-handler="" role="0" ng-if="!businessEntityCtrl.disableChange"><i class="fa fa-trash" aria-hidden="true"></i></button><div>' +
                // '';

                for (var i = 0; i <  businessEntityCtrl.headersPE.length ; i++) {
                    if (businessEntityCtrl.headersPE[i].column == 'actions') {
                        businessEntityCtrl.dtColumnsPE.push(DTColumnBuilder.newColumn(businessEntityCtrl.headersPE[i].column).withTitle(businessEntityCtrl.headersPE[i].name).renderWith(actionsColumnPE));
                    }
                    else {
                        businessEntityCtrl.dtColumnsPE.push(DTColumnBuilder.newColumn(businessEntityCtrl.headersPE[i].column).withTitle(businessEntityCtrl.headersPE[i].name));
                    }
                }

                businessEntityCtrl.getTableDataPE = function () {
                    var deferred = $q.defer();
                    deferred.resolve(businessEntityCtrl.postExecutionData);
                    return deferred.promise;
                };

                businessEntityCtrl.dtOptionsPE = DTOptionsBuilder.fromFnPromise(function () {
                        return businessEntityCtrl.getTableDataPE();
                    })
                    .withDOM('<"html5buttons"B>lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withButtons([
                    ])
                    .withOption("caseInsensitive",true)
                    .withOption('search',{
                        "caseInsensitive": false
                    });

                if (businessEntityCtrl.postExecutionData && businessEntityCtrl.postExecutionData.length > 0){
                    businessEntityCtrl.dtOptionsPE.withLightColumnFilter({
                        1 : {
                            type: 'text'
                        },
                        2 : {
                            type: 'text'
                        },
                        3 : {
                            type: 'text'
                        }
                    });
                }

                businessEntityCtrl.dtInstanceCallbackPE = function (dtInstance) {
                    if (angular.isFunction(businessEntityCtrl.dtInstancePE)) {
                        businessEntityCtrl.dtInstancePE(dtInstance);
                    } else if (angular.isDefined(businessEntityCtrl.dtInstancePE)) {
                        businessEntityCtrl.dtInstancePE = dtInstance;
                    }
                };
                if (businessEntityCtrl.dtInstancePE.changeData != null)
                    businessEntityCtrl.dtInstancePE.changeData(businessEntityCtrl.getTableDataPE());

                    $timeout(() => {
                        businessEntityCtrl.loadingTablePE = false;
                      });
             
            }
            else {
                toastr.error("Business entity # " + businessEntityCtrl.businessEntityData.be_name, "Failed to get Entities Group Query");
            }
        });

        BreadCrumbsService.push({be_name: businessEntityCtrl.businessEntityData.be_name}, 'BUSINESS_ENTITY_BREADCRUMB', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'businessEntityCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('businessEntityDirective', businessEntityDirective);