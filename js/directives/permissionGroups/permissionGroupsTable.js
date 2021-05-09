function permissionGroupsTableDirective(){

    var template = "views/permissionGroups/permissionGroupsTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q, $timeout, toastr, $uibModal) {
        var permissionGroupsTableCtrl = this;

        permissionGroupsTableCtrl.loadingTable = true;
        permissionGroupsTableCtrl.initTable = () => {
            permissionGroupsTableCtrl.dtInstance = {};
            permissionGroupsTableCtrl.dtColumns = [];
            permissionGroupsTableCtrl.dtColumnDefs = [];
            permissionGroupsTableCtrl.headers = [
                {
                    column : 'permission_group',
                    name : 'Permission Group',
                    clickAble : true
                },
                {
                    column : 'fabric_role',
                    name : 'Fabric Role',
                    clickAble : false
                },
                {
                    column : 'description',
                    name : 'Description',
                    clickAble : false
                },
                {
                    column : 'creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'update_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'updated_by',
                    name : 'Updated By',
                    clickAble : false
                }
            ];

            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };

            var permissionGruopActions = function (data, type, full, meta) {
                const actions = `
                    <div class="col-lg-6">
                    <img "
                    style="cursor:pointer"
                    uib-tooltip="Delete Role" 
                    tooltip-placement="top" 
                    tooltip-append-to-body="true"
                    mwl-confirm="" 
                    message="Role ${full.fabric_role} will be removed. Users which associated to ${full.fabric_role} will not be able to login To TDM. Are you sure you want to delete the this Role?" 
                    confirm-text="Yes <i class='glyphicon glyphicon-ok'</i>" 
                    cancel-text="No <i class='glyphicon glyphicon-remove'></i>" 
                    placement="right" 
                    on-confirm="permissionGroupsTableCtrl.deletePermisionGroup('${full.fabric_role}')" 
                    on-cancel="cancelClicked = true" 
                    confirm-button-type="danger" 
                    cancel-button-type="default" 
                    role-handler="" 
                    role="0"
                    src="icons/delete-icon.svg"
                    alt="delete"
                </img>
                    </div>
                    <div class="col-lg-6">
                        <img
                             src="icons/edit.svg"
                             alt="edit"
                            uib-tooltip="Edit Permission Group Mapping" 
                            tooltip-append-to-body="true"
                            tooltip-placement="top" 
                            role-handler="" role="0" 
                            ng-click="permissionGroupsTableCtrl.openNewPermissionGroupModal('${full.fabric_role}')">
                    </div>
                    `;
                return actions;
            };

            for (var i = 0; i <  permissionGroupsTableCtrl.headers.length ; i++) {
                if (permissionGroupsTableCtrl.headers[i].type == 'date'){
                    permissionGroupsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(permissionGroupsTableCtrl.headers[i].column).withTitle(permissionGroupsTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    permissionGroupsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(permissionGroupsTableCtrl.headers[i].column).withTitle(permissionGroupsTableCtrl.headers[i].name));
                }
            }

            permissionGroupsTableCtrl.dtColumns.unshift(DTColumnBuilder.newColumn('permissionGruopActions').withTitle('').renderWith(permissionGruopActions));
            
            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(permissionGroupsTableCtrl.permissionGroupsData);
                return deferred.promise;
            };

            permissionGroupsTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [5, 'asc'])
                .withButtons([
                ])
                .withOption('search',{
                    "caseInsensitive": false
                });

                if (permissionGroupsTableCtrl.productsData && permissionGroupsTableCtrl.productsData.length > 0){
                    permissionGroupsTableCtrl.dtOptions.withLightColumnFilter({
                            0 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(permissionGroupsTableCtrl.productsData, 'permission_group')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            1 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(permissionGroupsTableCtrl.productsData, 'fabric_role')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            2 : {
                                type: 'text'
                            },
                            3 : {
                                type: 'text'
                            },
                            4 : {
                                type: 'text'
                            },
                            5 : {
                                type: 'text'
                            },
                            6 : {
                                type: 'text'
                            },
                    })
                }

            permissionGroupsTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(permissionGroupsTableCtrl.dtInstance)) {
                    permissionGroupsTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(permissionGroupsTableCtrl.dtInstance)) {
                    permissionGroupsTableCtrl.dtInstance = dtInstance;
                }
            };
            if (permissionGroupsTableCtrl.dtInstance.changeData != null)
                permissionGroupsTableCtrl.dtInstance.changeData(getTableData());
                $timeout(() => {
                    permissionGroupsTableCtrl.loadingTable = false;
                  });
       
        };

        permissionGroupsTableCtrl.getData = () => {
            TDMService.getPermissionGroups().then((response) => {
                if (response.errorCode != 'SUCCESS'){
                    //TODO show Error
                    return;
                }
                permissionGroupsTableCtrl.permissionGroupsData = response.result;
                if (permissionGroupsTableCtrl.dtInstance) {
                    permissionGroupsTableCtrl.dtInstance.reloadData(function(data){}, true);
                }
                else {
                    permissionGroupsTableCtrl.initTable();
                }
            });
        };

        permissionGroupsTableCtrl.getData();

        permissionGroupsTableCtrl.deletePermisionGroup = (fabric_role) => {
            console.log('delete permission group,' +  fabric_role);
            TDMService.deleteRoleFromPermissionGroup(fabric_role).then((response) => {
                if (response.errorCode == "SUCCESS") {
                    const index = _.findIndex(permissionGroupsTableCtrl.permissionGroupsData,{fabric_role: fabric_role});
                    if (index >= 0){
                        permissionGroupsTableCtrl.permissionGroupsData.splice(index, 1);
                        permissionGroupsTableCtrl.dtInstance.reloadData(function(data){}, true);
                    }
                }
                else {
                    toastr.error(`Unable to remove Role ${fabric_role}, err=[${response.message}]`);

                }
            });
        };


        permissionGroupsTableCtrl.openNewPermissionGroupModal = (fabric_role) => {
            let row = null;
            if (fabric_role){
                row = _.find(permissionGroupsTableCtrl.permissionGroupsData , {fabric_role : fabric_role})
            }
            $uibModal.open({
                templateUrl: 'views/permissionGroups/newPermissionGroup.html',
                resolve : {
                    attachedRoles : () => {
                        return _.map(permissionGroupsTableCtrl.permissionGroupsData,'fabric_role') || [];
                    },
                    oldRecord : () => {
                        return row;
                    },
                },
                controller: function ($scope, $uibModalInstance,TDMService, toastr, attachedRoles, oldRecord) {

                    var newPermisionGroupCtrl = this;
                    if (oldRecord) {
                        newPermisionGroupCtrl.edit = true;
                        newPermisionGroupCtrl.permissionGroup = oldRecord.permission_group;
                        newPermisionGroupCtrl.fabricRole = oldRecord.fabric_role;
                        newPermisionGroupCtrl.description = oldRecord.description;
                    }
                    newPermisionGroupCtrl.permissionGroups = [
                        {
                            name: 'Admin',
                            value: 'admin',
                        },
                        {
                            name: 'Owner',
                            value: 'owner',
                        },
                        {
                            name: 'Tester',
                            value: 'tester',
                        }
                    ];

                    TDMService.getFabricRoles().then(response => {
                        if (response.errorCode === 'SUCCESS') {
                            newPermisionGroupCtrl.fabricRoles = _.filter(response.result,role => {
                                return attachedRoles.indexOf(role) < 0 || (newPermisionGroupCtrl.edit && role === oldRecord.fabric_role);
                            });
                        }else {
                            toastr.error(`Unable to get Fabric Roles, err=[${err.message}]`);
                        }
                    }).catch(err => {
                        toastr.error(`Unable to get Fabric Roles, err=[${err.message}]`);
                    });

                    newPermisionGroupCtrl.attachRoleToPermissionGroup = () => {
                        if (newPermisionGroupCtrl.edit) {
                            TDMService.updateRoleToPermissionGroup(
                                newPermisionGroupCtrl.permissionGroup,
                                oldRecord.fabric_role,
                                newPermisionGroupCtrl.fabricRole,
                                newPermisionGroupCtrl.description || '').then((response) => {
                                    if (response.errorCode === 'SUCCESS') {
                                        $uibModalInstance.close(true);
                                        toastr.success(`Updated Mapping Fabric Role and Permission Group Successfully`);
                                    }else {
                                        toastr.error(`Unable to update Fabric Role to Permission Group, err=[${err.message}]`);
                                    }
                                }).catch(err => {
                                    toastr.error(`Unable to update Fabric Role to Permission Group, err=[${err.message}]`);
                                });
                        }
                        else {
                            TDMService.attachRoleToPermissionGroup(
                                newPermisionGroupCtrl.permissionGroup,
                                newPermisionGroupCtrl.fabricRole,
                                newPermisionGroupCtrl.description || '').then((response) => {
                                    if (response.errorCode === 'SUCCESS') {
                                        $uibModalInstance.close(true);
                                        toastr.success(`Successfully Added new Mapping`);
                                    }else {
                                        toastr.error(`Unable to attach Fabric Role to Permission Group, err=[${err.message}]`);
                                    }
                                }).catch(err => {
                                    toastr.error(`Unable to attach Fabric Role to Permission Group, err=[${err.message}]`);
                                });
                        }
                    };

                    newPermisionGroupCtrl.close = function (){
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'newPermisionGroupCtrl'
            }).result.then(function (result) {
                if (result){
                    permissionGroupsTableCtrl.getData();
                }
            });
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'permissionGroupsTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('permissionGroupsTableDirective', permissionGroupsTableDirective);