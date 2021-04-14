function sourceEnvironmentDirective() {

    var template = "views/soruceEnvrionments/sourceEnvironment.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, SweetAlert, $timeout, AuthService, DTColumnBuilder, DTOptionsBuilder, $q, $compile, $uibModal, $http) {

        this._scope = $scope;

        var sourceEnvironmentCtrl = this;
        sourceEnvironmentCtrl.environmentData = $scope.content.environmentData;
        sourceEnvironmentCtrl.pageDisplay = 'environment';

        $scope.userRole = AuthService.getRole();
        sourceEnvironmentCtrl.showEnvironment = true;
        sourceEnvironmentCtrl.disableOwnersChange = (sourceEnvironmentCtrl.environmentData.environment_status == 'Inactive' || !AuthService.authorizedToEdit(0));


        sourceEnvironmentCtrl.tabClicked = function (newTab) {

            if (sourceEnvironmentCtrl.roleForm) {
                if (sourceEnvironmentCtrl.roleForm.$dirty) {
                    sourceEnvironmentCtrl.askToSaveChanges('Role', newTab);
                }
            }

            sourceEnvironmentCtrl.activityPanel = 'newRole';
            return newTab;
        };

        sourceEnvironmentCtrl.askToSaveChanges = function (form, newTab) {
            swal({
                    title: "You have unsaved changes.",
                    text: "Do you want to save changes before close?",
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
                        switch (form) {

                            case 'Role': {
                                sourceEnvironmentCtrl.saveRoleChanges();
                                break;
                            }
                        }
                        swal("Saved!", "Your changes have been saved.", "success");

                    } else {
                        swal("Discard!", "Your changes have not been saved!", "error");
                    }
                    sourceEnvironmentCtrl.activityPanel = 'empty';
                    sourceEnvironmentCtrl.newTab = newTab;
                });
        };

        sourceEnvironmentCtrl.getSummaryData = function(){
            sourceEnvironmentCtrl.activityPanel = 'empty';
        }

        sourceEnvironmentCtrl.saveChanges = function () {
            TDMService.putGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id, sourceEnvironmentCtrl.environmentData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "Updated Successfully");
                    $scope.content.openEnvironments();
                }
                else {
                    toastr.error("Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to Update : " + response.message);
                }
            });
        };

        var deleteEnvironmentTemp = function(){
            TDMService.deleteGenericAPI('sourceEnvironment/'+ sourceEnvironmentCtrl.environmentData.source_environment_id +'/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "deleted Successfully");
                    $timeout(function () {
                        $scope.content.openEnvironments();
                    }, 400)
                }
                else {
                    toastr.error("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to delete");
                }
            });
        };

        sourceEnvironmentCtrl.deleteEnvironment = function () {
            if (sourceEnvironmentCtrl.tasksCount == true) {
                SweetAlert.swal({
                        title: "Source Environment will be deleted from all releated tasks. Are you sure?",
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
                            deleteEnvironmentTemp();
                        }
                    });
            }
            else {
                deleteEnvironmentTemp();
            }
        };

        BreadCrumbsService.breadCrumbChange(1);
        BreadCrumbsService.push({environmentID: sourceEnvironmentCtrl.environmentData.source_environment_name}, 'SOURCE_ENVIRONMENT_BREADCRUMB', function () {
            $scope.content.openEnvironment(sourceEnvironmentCtrl.environmentData);
        });

        sourceEnvironmentCtrl.openRolesManagement = function () {
            $scope.content.openRoles(sourceEnvironmentCtrl.environmentData);
        };


        sourceEnvironmentCtrl.loadingTableRoles = true;
        TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/roles').then(function (response) {
            if (response.errorCode == "SUCCESS") {
                //TODO SUCCESS

                sourceEnvironmentCtrl.roles = _.sortBy(response.result, function (value) {
                    return new Date(value.role_creation_date);
                });
                sourceEnvironmentCtrl.roles.reverse();
                sourceEnvironmentCtrl.dtInstanceRoles = {};
                sourceEnvironmentCtrl.dtColumnsRoles = [];
                sourceEnvironmentCtrl.dtColumnDefsRoles = [];
                sourceEnvironmentCtrl.headersRoles = [
                    {
                        column: 'role_name',
                        name: 'Name',
                        clickAble: true
                    },
                    {
                        column: 'role_description',
                        name: 'Description',
                        clickAble: false
                    },
                    {
                        column: 'role_creation_date',
                        name: 'Creation Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'role_created_by',
                        name: 'Created By',
                        clickAble: false
                    },
                    {
                        column: 'role_last_updated_date',
                        name: 'Last Update Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'role_last_updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                    {
                        column: 'role_status',
                        name: 'Status',
                        clickAble: false
                    }
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    return '<a ng-click="sourceEnvironmentCtrl.openRole(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    return moment(data).format('D MMM YYYY, HH:mm')
                };


                for (var i = 0; i < sourceEnvironmentCtrl.headersRoles.length; i++) {
                    if (sourceEnvironmentCtrl.headersRoles[i].clickAble == true) {
                        sourceEnvironmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(sourceEnvironmentCtrl.headersRoles[i].column).withTitle(sourceEnvironmentCtrl.headersRoles[i].name).renderWith(clickAbleColumn));
                    }
                    else if (sourceEnvironmentCtrl.headersRoles[i].type == 'date') {
                        sourceEnvironmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(sourceEnvironmentCtrl.headersRoles[i].column).withTitle(sourceEnvironmentCtrl.headersRoles[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        sourceEnvironmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(sourceEnvironmentCtrl.headersRoles[i].column).withTitle(sourceEnvironmentCtrl.headersRoles[i].name));
                    }
                }

                var getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(sourceEnvironmentCtrl.roles);
                    return deferred.promise;
                };

                sourceEnvironmentCtrl.dtOptionsRoles = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [6, 'asc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false)
                    .withOption("caseInsensitive", true)
                    .withOption('search', {
                        "caseInsensitive": false
                    });

                sourceEnvironmentCtrl.dtInstanceCallbackRoles = function (dtInstance) {
                    if (angular.isFunction(sourceEnvironmentCtrl.dtInstanceRoles)) {
                        sourceEnvironmentCtrl.dtInstanceRoles(dtInstance);
                    } else if (angular.isDefined(sourceEnvironmentCtrl.dtInstanceRoles)) {
                        sourceEnvironmentCtrl.dtInstanceRoles = dtInstance;
                    }
                };
                if (sourceEnvironmentCtrl.dtInstanceRoles.changeData != null)
                    sourceEnvironmentCtrl.dtInstanceRoles.changeData(getTableData());

                sourceEnvironmentCtrl.loadingTableRoles = false;
            }
            else {
                //TODO ERROR
            }
        });
        TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/users').then(function (response) {
            if (response.errorCode == "SUCCESS") {
                sourceEnvironmentCtrl.allTesters = response.result;
                sourceEnvironmentCtrl.openRole(0);
            }
            else {
                sourceEnvironmentCtrl.hideUsersInput = true;
                toastr.error("Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to get All Testers : " + response.message);
            }
        });

        sourceEnvironmentCtrl.openRole = function (index) {
            sourceEnvironmentCtrl.roleData = angular.copy(sourceEnvironmentCtrl.roles[index]);
            sourceEnvironmentCtrl.roleData.indexInRoles = index;
            sourceEnvironmentCtrl.roleData.role_type = sourceEnvironmentCtrl.roleData.role_type == 'ALL';
            sourceEnvironmentCtrl.disableChangeRole = (sourceEnvironmentCtrl.disableChange ||
            (sourceEnvironmentCtrl.roleData.role_status == 'Inactive' || !AuthService.authorizedToEdit(1)));
            TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + 
            '/role/' + sourceEnvironmentCtrl.roleData.role_id + '/users').then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    sourceEnvironmentCtrl.testers = response.result;
                    if (!sourceEnvironmentCtrl.allTesters) {
                        sourceEnvironmentCtrl.allTesters = [];
                    }
                    sourceEnvironmentCtrl.allTestersRole = sourceEnvironmentCtrl.allTesters.concat(sourceEnvironmentCtrl.testers);
                    sourceEnvironmentCtrl.allTestersRole.unshift({
                        user_id : -1,
                        username : "ALL"
                    });
                }
                else {
                    sourceEnvironmentCtrl.hideUsersInput = true;
                    toastr.error("Role # " + sourceEnvironmentCtrl.roleData.role_name, "failed to get Role Users : " + response.message);
                }
            });
            sourceEnvironmentCtrl.activityPanel = 'empty';
            $timeout(function () {
                sourceEnvironmentCtrl.activityPanel = 'Role';
            }, 200);
        };


        sourceEnvironmentCtrl.deleteRole = function () {
            TDMService.deleteGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + 
            '/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name + 
            '/role/' + sourceEnvironmentCtrl.roleData.role_id + 
            '/rolename/' + sourceEnvironmentCtrl.roleData.role_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + sourceEnvironmentCtrl.roleData.role_name, "deleted Successfully");
                    sourceEnvironmentCtrl.roleData.role_status = 'Inactive';
                    sourceEnvironmentCtrl.roles[sourceEnvironmentCtrl.roleData.indexInRoles].role_status = 'Inactive';
                    sourceEnvironmentCtrl.dtInstanceRoles.reloadData(function (data) {
                    }, true);
                    TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/testers').then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            sourceEnvironmentCtrl.allTesters = response.result;
                        }
                        else {
                            sourceEnvironmentCtrl.hideUsersInput = true;
                            toastr.error("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    sourceEnvironmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role # " + sourceEnvironmentCtrl.roleData.role_name, "failed to delete");
                }
            });
        };

        sourceEnvironmentCtrl.saveRoleChanges = function () {

            TDMService.postGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + 
                    '/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name + 
                    '/role/' + sourceEnvironmentCtrl.roleData.role_id + 
                    '/rolename/' + sourceEnvironmentCtrl.roleData.role_name + 
                    '/users',sourceEnvironmentCtrl.testers).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role Users # " + sourceEnvironmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/testers').then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            sourceEnvironmentCtrl.allTesters = response.result;
                        }
                        else {
                            sourceEnvironmentCtrl.hideUsersInput = true;
                            toastr.error("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    sourceEnvironmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role Users # " + sourceEnvironmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });
            if (sourceEnvironmentCtrl.testers.length > 0){
                sourceEnvironmentCtrl.roleData.role_type = 'SPECIFIC';
            }
            else{
                if (sourceEnvironmentCtrl.roleData.role_type){
                    sourceEnvironmentCtrl.roleData.role_type = 'ALL';
                }
                else{
                    sourceEnvironmentCtrl.roleData.role_type = 'SPECIFIC';
                }
            }
            TDMService.putGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + 
            '/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name + 
            '/role/' + sourceEnvironmentCtrl.roleData.role_id,sourceEnvironmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + sourceEnvironmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/roles').then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            sourceEnvironmentCtrl.roles = response.result;
                            sourceEnvironmentCtrl.dtInstanceRoles.reloadData(function (data) {
                            }, true);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + sourceEnvironmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });
        };

        sourceEnvironmentCtrl.openNewRole = function () {
            deleteEnvironmentTemp();

            sourceEnvironmentCtrl.roleData = {
                allowed_creation_of_synthetic_data: false,
                allowed_delete_before_load: false,
                allowed_random_entity_selection: false,
                allowed_request_of_fresh_data: false,
                allowed_task_scheduling: false,
                allowed_replace_sequences: false,
                allowed_refresh_reference_data: false,
                allowed_number_of_entities_to_copy: 0,
                role_description: "",
                role_name: "",
                role_type: false
            };
            sourceEnvironmentCtrl.activityPanel = 'newRole';
            sourceEnvironmentCtrl.testers = [];
            if (!sourceEnvironmentCtrl.allTesters) {
                sourceEnvironmentCtrl.allTesters = [];
            }
        };

        sourceEnvironmentCtrl.addNewRole = function () {
            if (_.find(sourceEnvironmentCtrl.roles, {role_name: sourceEnvironmentCtrl.roleData.role_name, role_status: 'Active'})) {
                return toastr.error("Role # " + sourceEnvironmentCtrl.roleData.role_name + " Already Exists");
            }
            TDMService.postGenericAPI('sourceEnvironment/' + 
                sourceEnvironmentCtrl.environmentData.source_environment_id + 
                '/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name + '/role' ,
                sourceEnvironmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/roles').then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            sourceEnvironmentCtrl.roles = response.result;
                            sourceEnvironmentCtrl.dtInstanceRoles.reloadData(function (data) {
                            }, true);
                        }
                    });
                    toastr.success("Role # " + sourceEnvironmentCtrl.roleData.role_name, "Created Successfully");
                    sourceEnvironmentCtrl.getSummaryData();
                    TDMService.postGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + 
                    '/envname/' + sourceEnvironmentCtrl.environmentData.source_environment_name + 
                    '/role/' + response.result.id + '/rolename/' + sourceEnvironmentCtrl.roleData.role_name + 
                    '/users',sourceEnvironmentCtrl.testers).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Role Users # " + sourceEnvironmentCtrl.roleData.role_name, "Updated Successfully");
                            TDMService.getGenericAPI('sourceEnvironment/' + sourceEnvironmentCtrl.environmentData.source_environment_id + '/testers').then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    sourceEnvironmentCtrl.allTesters = response.result;
                                }
                                else {
                                    sourceEnvironmentCtrl.hideUsersInput = true;
                                    toastr.error("Source Environment # " + sourceEnvironmentCtrl.environmentData.source_environment_name, "failed to get All Testers : " + response.message);
                                }
                            });
                        }
                        else {
                            toastr.error("Role Users # " + sourceEnvironmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + sourceEnvironmentCtrl.roleData.role_name, "Unable to Create : " + response.message);
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
        controllerAs: 'sourceEnvironmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('sourceEnvironmentDirective', sourceEnvironmentDirective);