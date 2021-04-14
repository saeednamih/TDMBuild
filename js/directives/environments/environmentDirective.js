function environmentDirective() {

    var template = "views/environments/environment.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, SweetAlert, $timeout, AuthService, DTColumnBuilder, DTOptionsBuilder, $q, $compile, $uibModal, $http) {

        this._scope = $scope;

        var environmentCtrl = this;
        environmentCtrl.environmentData = $scope.content.environmentData;
        environmentCtrl.environmentDataOrig = angular.copy(environmentCtrl.environmentData);
        environmentCtrl.pageDisplay = 'environment';
        environmentCtrl.envTypes = ['Both','Source','Target'];

        environmentCtrl.syncModes = [
            {
                text: 'Do not Sync',
                value: 'OFF'
            },
            {
                text: 'Always Sync',
                value: 'FORCE'
            },
        ];

        if (!environmentCtrl.environmentData.allow_write && environmentCtrl.environmentData.allow_read) {
            environmentCtrl.envType = 'Source';
        } else if (environmentCtrl.environmentData.allow_write && !environmentCtrl.environmentData.allow_read) {
            environmentCtrl.envType = 'Target';
        } else if (environmentCtrl.environmentData.allow_write && environmentCtrl.environmentData.allow_read) {
            environmentCtrl.envType = 'Both';
        }

        if (environmentCtrl.environmentData.sync_mode === 'ON'){
            environmentCtrl.environmentData.sync_mode = null;
        }

        environmentCtrl.isFluxMode = AuthService.isFluxMode();

        var userRole = AuthService.getRole();
        environmentCtrl.showEnvironment = true;
        environmentCtrl.disableOwnersChange = (environmentCtrl.environmentData.environment_status == 'Inactive' || !AuthService.authorizedToEdit(0));

        environmentCtrl.envTypeChanged = function() {
            if (environmentCtrl.envType) {
                if (environmentCtrl.envType.toLowerCase() == 'target') {
                    environmentCtrl.environmentData.allow_write = true;
                    environmentCtrl.environmentData.allow_read = false;
                } else if (environmentCtrl.envType.toLowerCase() == 'source') {
                    // No TDM Source env name when Environment type is target
                    environmentCtrl.environmentData.allow_write = false;
                    environmentCtrl.environmentData.allow_read = true;
                } else if (environmentCtrl.envType.toLowerCase() == 'both') {
                    environmentCtrl.environmentData.allow_write = true;
                    environmentCtrl.environmentData.allow_read = true;
                }
            }
        };

        TDMService.getGenericAPI('getFabricEnvs').then(function(response){
            environmentCtrl.availableSourceEnvironments = _.filter(response.result,function(env){
                if (env == environmentCtrl.environmentData.fabric_environment_name){
                    return true;
                }
                if (_.findIndex($scope.content.environments,{fabric_environment_name : env,environment_status : 'Active'}) >= 0){
                    return false;
                }
                return true;
            });
            if (environmentCtrl.environmentData.fabric_environment_name && environmentCtrl.environmentData.fabric_environment_name != ""
                && environmentCtrl.availableSourceEnvironments.indexOf(environmentCtrl.environmentData.fabric_environment_name) < 0){
                toastr.error("TDM environment " + environmentCtrl.environmentData.fabric_environment_name + " is no longer valid", "Please update your Environment");
                environmentCtrl.environmentData.fabric_environment_name = null;
            }
        }).catch(function(err){
            toastr.error("Environment","Unable to get available Source Environment");
        });

        environmentCtrl.tabClicked = function (newTab) {

            if (environmentCtrl.roleForm) {
                if (environmentCtrl.roleForm.$dirty) {
                    environmentCtrl.askToSaveChanges('Role', newTab);
                }
            }
            else if (environmentCtrl.productForm) {
                if (environmentCtrl.productForm.$dirty) {
                    environmentCtrl.askToSaveChanges('Product', newTab);
                }
            }
            else if (environmentCtrl.globalForm) { // global
                if (environmentCtrl.globalForm.$dirty) {
                    environmentCtrl.askToSaveChanges('Global', newTab);
                }
            }

            environmentCtrl.activityPanel = 'Summary';
            return newTab;
        };

        environmentCtrl.askToSaveChanges = function (form, newTab) {
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
                                environmentCtrl.saveRoleChanges();
                                break;
                            }
                            case 'Product': {
                                environmentCtrl.saveProductChanges();
                                break;
                            }
                            case 'Global': {
                                environmentCtrl.saveGlobalChanges();
                                break;
                            }
                        }
                        swal("Saved!", "Your changes have been saved.", "success");

                    } else {
                        swal("Discard!", "Your changes have not been saved!", "error");
                    }
                    environmentCtrl.activityPanel = 'Summary';
                    environmentCtrl.newTab = newTab;
                });
        };

        environmentCtrl.barOptions = {
            scaleBeginAtZero: true,
            scaleShowGridLines: true,
            scaleGridLineColor: "rgba(0,0,0,.05)",
            scaleGridLineWidth: 1,
            barShowStroke: false,
            barStrokeWidth: 0
        };

        environmentCtrl.getSummaryData = function ($scope) {
            environmentCtrl.loadingSummary = true;
            TDMService.getEnvironmentSummary(environmentCtrl.environmentData.environment_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.summaryData = response.result;
                    environmentCtrl.summaryData.numberOfALLTesters.value = parseInt(environmentCtrl.summaryData.numberOfALLTesters.value);
                    environmentCtrl.summaryData.tasks.active = parseInt(environmentCtrl.summaryData.tasks.active);
                    environmentCtrl.summaryData.tasks.onHold = parseInt(environmentCtrl.summaryData.tasks.onhold);
                    if (environmentCtrl.summaryData.processedEntities.processedentities != null) {
                        environmentCtrl.summaryData.processedEntities.processedentities = parseInt(environmentCtrl.summaryData.processedEntities.processedentities);
                    }
                    else {
                        environmentCtrl.summaryData.processedEntities.processedentities = 0;
                    }
                    environmentCtrl.taskExecutionsBarData = {
                        labels: ['Failed', 'Pending', 'Paused', 'Stopped', 'Running', 'Completed'],
                        datasets: [
                            {
                                label: "Exection status",
                                fillColor: "rgba(26,179,148,0.5)",
                                strokeColor: "rgba(26,179,148,0.8)",
                                highlightFill: "rgba(26,179,148,0.75)",
                                highlightStroke: "rgba(26,179,148,1)",
                                data: [environmentCtrl.summaryData.taskExecutionStatus.failed,
                                    environmentCtrl.summaryData.taskExecutionStatus.pending,
                                    environmentCtrl.summaryData.taskExecutionStatus.paused,
                                    environmentCtrl.summaryData.taskExecutionStatus.stopped,
                                    environmentCtrl.summaryData.taskExecutionStatus.running,
                                    environmentCtrl.summaryData.taskExecutionStatus.completed]
                            }
                        ]
                    };
                    environmentCtrl.loadingSummary = false;
                    environmentCtrl.activityPanel = 'Summary';
                }
                else {
                    //error
                    environmentCtrl.loadingSummary = false;
                    environmentCtrl.activityPanel = 'Summary';
                }
            });

        };

        environmentCtrl.getSummaryData();

        TDMService.getEnvTaskCount(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.tasksCount = response.result;
            }
            else {
                environmentCtrl.tasksCount = true;
            }
        });

        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.dataCenters =  _.unique(response.result,'dc');
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "failed to get data centers");
            }
        });

        TDMService.getEnvironmentOwners(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.environmentData.owners = response.result;

                if (userRole.type == 'admin') {
                    environmentCtrl.environmentData.isOwner = true;
                }
                else {
                    var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                    environmentCtrl.environmentData.isOwner = ownerFound ? true : false;
                }

                environmentCtrl.disableChange = (environmentCtrl.environmentData.environment_status === 'Inactive' || !environmentCtrl.environmentData.isOwner);
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get owners : " + response.message);
                environmentCtrl.environmentData.owners = [];
            }
        });

        TDMService.getOwners().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.allOwners = response.result;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get owners: " + response.message);
                environmentCtrl.allOwners = [];
            }
        });

        environmentCtrl.saveChanges = function () {
            TDMService.updateEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "Updated Successfully");
                    $scope.content.openEnvironments();
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to Update : " + response.message);
                }
            });
        };

        environmentCtrl.deleteEnvironment = function () {
            if (environmentCtrl.tasksCount == true) {
                SweetAlert.swal({
                        title: "Environment will be deleted from all releated tasks. Are you sure?",
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
                            TDMService.deleteEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "deleted Successfully");
                                    $timeout(function () {
                                        $scope.content.openEnvironments();
                                    }, 400)
                                }
                                else {
                                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to delete");
                                }
                            });
                        }
                    });
            }
            else {
                TDMService.deleteEnvironment(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Environment # " + environmentCtrl.environmentData.environment_name, "deleted Successfully");
                        $timeout(function () {
                            $scope.content.openEnvironments();
                        }, 400)
                    }
                    else {
                        toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to delete");
                    }
                });
            }
        };

        BreadCrumbsService.breadCrumbChange(1);
        BreadCrumbsService.push({environmentID: environmentCtrl.environmentData.environment_name}, 'ENVIRONMENT_BREADCRUMB', function () {
            $scope.content.openEnvironment(environmentCtrl.environmentData);
        });

        environmentCtrl.openRolesManagement = function () {
            $scope.content.openRoles(environmentCtrl.environmentData);
        };

        environmentCtrl.openProducts = function () {
            $scope.content.openProducts(environmentCtrl.environmentData);
        };

        environmentCtrl.loadingTableRoles = true;
        TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                //TODO SUCCESS

                environmentCtrl.roles = _.sortBy(response.result, function (value) {
                    return new Date(value.role_creation_date);
                });
                environmentCtrl.roles.reverse();
                environmentCtrl.dtInstanceRoles = {};
                environmentCtrl.dtColumnsRoles = [];
                environmentCtrl.dtColumnDefsRoles = [];
                environmentCtrl.headersRoles = [
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
                    return '<a ng-click="environmentCtrl.openRole(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    return moment(data).format('D MMM YYYY, HH:mm')
                };


                for (var i = 0; i < environmentCtrl.headersRoles.length; i++) {
                    if (environmentCtrl.headersRoles[i].clickAble == true) {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersRoles[i].type == 'date') {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsRoles.push(DTColumnBuilder.newColumn(environmentCtrl.headersRoles[i].column).withTitle(environmentCtrl.headersRoles[i].name));
                    }
                }

                var getTableData = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.roles);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsRoles = DTOptionsBuilder.fromFnPromise(function () {
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

                environmentCtrl.dtInstanceCallbackRoles = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceRoles)) {
                        environmentCtrl.dtInstanceRoles(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceRoles)) {
                        environmentCtrl.dtInstanceRoles = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceRoles.changeData != null)
                    environmentCtrl.dtInstanceRoles.changeData(getTableData());

                environmentCtrl.loadingTableRoles = false;
            }
            else {
                //TODO ERROR
            }
        });

        TDMService.getEnvGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {

                environmentCtrl.globals = _.sortBy(response.result, function (value) {
                    return new Date(value.update_date);
                });
                environmentCtrl.globals.reverse();
                environmentCtrl.dtInstanceGlobals = {};
                environmentCtrl.dtColumnsGlobals = [];
                environmentCtrl.dtColumnDefsGlobals = [];
                environmentCtrl.headersGlobals = [
                    // {
                    // column: 'environment_id',
                    // name: 'ID',
                    // clickAble: true
                    // },
                    {
                        column: 'global_name',
                        name: 'Name',
                        clickAble: false,
                        clickAble: true
                    },
                    {
                        column: 'global_value',
                        name: 'Value',
                        clickAble: false
                    },
                    {
                        column: 'update_date',
                        name: 'Last Update date',
                        type: 'date',
                        clickAble: false
                    },
                    {
                        column: 'updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    return '<a ng-click="environmentCtrl.openGlobal(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    if (data)
                        return moment(data).format('D MMM YYYY, HH:mm');
                    return '';
                };

                for (var i = 0; i < environmentCtrl.headersGlobals.length; i++) {
                    if (environmentCtrl.headersGlobals[i].clickAble == true) {
                        environmentCtrl.dtColumnsGlobals.push(DTColumnBuilder.newColumn(environmentCtrl.headersGlobals[i].column).withTitle(environmentCtrl.headersGlobals[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersGlobals[i].type == 'date') {
                        environmentCtrl.dtColumnsGlobals.push(DTColumnBuilder.newColumn(environmentCtrl.headersGlobals[i].column).withTitle(environmentCtrl.headersGlobals[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsGlobals.push(DTColumnBuilder.newColumn(environmentCtrl.headersGlobals[i].column).withTitle(environmentCtrl.headersGlobals[i].name));
                    }
                }

                var getTableDataGlobals = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.globals);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsGlobals = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableDataGlobals();
                })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [environmentCtrl.headersGlobals.length - 2, 'desc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false);

                environmentCtrl.dtInstanceCallbackGlobals = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceGlobals)) {
                        environmentCtrl.dtInstanceGlobals(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceGlobals)) {
                        environmentCtrl.dtInstanceGlobals = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceGlobals.changeData != null)
                    environmentCtrl.dtInstanceGlobals.changeData(getTableDataGlobals());

                environmentCtrl.loadingTableGlobals = false;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get Globals");
            }
        });

        TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {

                environmentCtrl.products = _.sortBy(response.result, function (value) {
                    return new Date(value.creation_date);
                });
                environmentCtrl.products.reverse();
                environmentCtrl.dtInstanceProducts = {};
                environmentCtrl.dtColumnsProducts = [];
                environmentCtrl.dtColumnDefsProducts = [];
                environmentCtrl.headersProducts = [
                    {
                        column: 'product_name',
                        name: 'Name',
                        clickAble: true
                    },
                    {
                        column: 'data_center_name',
                        name: 'Data Center',
                        clickAble: false
                    },
                    {
                        column: 'product_version',
                        name: 'Version',
                        clickAble: false
                    },
                    {
                        column: 'created_by',
                        name: 'Created By',
                        clickAble: false
                    },
                    {
                        column: 'creation_date',
                        name: 'Creation Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'last_updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                    {
                        column: 'last_updated_date',
                        name: 'Update Date',
                        clickAble: false,
                        type: 'date'
                    },
                    {
                        column: 'status',
                        name: 'Status',
                        clickAble: false
                    }
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    return '<a ng-click="environmentCtrl.openProduct(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    if (data)
                        return moment(data).format('D MMM YYYY, HH:mm');
                    return '';
                };

                for (var i = 0; i < environmentCtrl.headersProducts.length; i++) {
                    if (environmentCtrl.headersProducts[i].clickAble == true) {
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersProducts[i].type == 'date') {
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsProducts.push(DTColumnBuilder.newColumn(environmentCtrl.headersProducts[i].column).withTitle(environmentCtrl.headersProducts[i].name));
                    }
                }

                var getTableDataProducts = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.products);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsProducts = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableDataProducts();
                })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [7, 'asc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false);

                environmentCtrl.dtInstanceCallbackProducts = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceProducts)) {
                        environmentCtrl.dtInstanceProducts(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceProducts)) {
                        environmentCtrl.dtInstanceProducts = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceProducts.changeData != null)
                    environmentCtrl.dtInstanceProducts.changeData(getTableDataProducts());

                environmentCtrl.loadingTableProducts = false;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Failed to get products");
            }
        });

        environmentCtrl.refreshBusnisEntities = function () {
            TDMService.getBusinessEntitiesForEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {

                var allBusinessEntities = response.result;
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.allBusinessEntities = allBusinessEntities;

                    TDMService.getAdmins().then(function (response) {
                        var admins = response.result;
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.allusers = admins;

                            TDMService.getEnvTesters(environmentCtrl.environmentData.environment_id).then(function (response) {

                                var testers = response.result;
                                if (response.errorCode == "SUCCESS") {
                                    environmentCtrl.allusers = testers.concat(environmentCtrl.allusers);

                                    TDMService.getEnvironmentOwners(environmentCtrl.environmentData.environment_id).then(function (response) {
                                        var owners = response.result;
                                        if (response.errorCode == "SUCCESS") {

                                            var ownersNewStructArray = [];
                                            owners.forEach(function (owner) {
                                                var anOwner = {};
                                                anOwner.uid = owner.user_id;
                                                ownersNewStructArray.push(anOwner);
                                            });

                                            environmentCtrl.allusers = ownersNewStructArray.concat(environmentCtrl.allusers); // put Testers and Owners in 1 array
                                        } else {
                                            toastr.error("Failed to get Environment Owners");
                                        }
                                    });

                                } else {
                                    toastr.error("Failed to get Environment Testers");
                                }
                            });
                        } else {
                            toastr.error("Failed to get all Admins");
                        }
                    });

                }
                else {
                    toastr.error("Failed to get Business Entities");
                }
            })
        };
        environmentCtrl.refreshBusnisEntities();

        TDMService.getEnvExclusionLists(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {

                environmentCtrl.exclusionLists = _.sortBy(response.result, function (value) {
                    return new Date(value.creation_date);
                });
                environmentCtrl.exclusionLists.reverse();
                environmentCtrl.dtInstanceExclusionLists = {};
                environmentCtrl.dtColumnsExclusionLists = [];
                environmentCtrl.dtColumnDefsExclusionLists = [];
                environmentCtrl.headersExclusionLists = [
                    {
                        column: 'exclusion_list',
                        name: 'Exclusion List',
                        clickAble: true
                    },
                    {
                        column: 'be_name',
                        name: 'Business Entity',
                        clickAble: false
                    },
                    {
                        column: 'requested_by',
                        name: 'Requested By',
                        clickAble: false
                    },
                    {
                        column: 'updated_by',
                        name: 'Updated By',
                        clickAble: false
                    },
                    {
                        column: 'update_date',
                        name: 'Update Date',
                        clickAble: false,
                        type: 'date'
                    }
                ];

                var clickAbleColumn = function (data, type, full, meta) {
                    if (data.length > 40) {
                        data = data.substring(0, 40) + '...';
                    }
                    return '<a ng-click="environmentCtrl.openExclusionList(' + meta.row + ')">' + data + '</a>';
                };

                var changeToLocalDate = function (data, type, full, meta) {
                    if (data)
                        return moment(data).format('D MMM YYYY, HH:mm');
                    return '';
                };

                for (var i = 0; i < environmentCtrl.headersExclusionLists.length; i++) {
                    if (environmentCtrl.headersExclusionLists[i].clickAble == true) {
                        environmentCtrl.dtColumnsExclusionLists.push(DTColumnBuilder.newColumn(environmentCtrl.headersExclusionLists[i].column).withTitle(environmentCtrl.headersExclusionLists[i].name).renderWith(clickAbleColumn));
                    }
                    else if (environmentCtrl.headersExclusionLists[i].type == 'date') {
                        environmentCtrl.dtColumnsExclusionLists.push(DTColumnBuilder.newColumn(environmentCtrl.headersExclusionLists[i].column).withTitle(environmentCtrl.headersExclusionLists[i].name).renderWith(changeToLocalDate));
                    }
                    else {
                        environmentCtrl.dtColumnsExclusionLists.push(DTColumnBuilder.newColumn(environmentCtrl.headersExclusionLists[i].column).withTitle(environmentCtrl.headersExclusionLists[i].name));
                    }
                }

                var getTableDataExclusionLists = function () {
                    var deferred = $q.defer();
                    deferred.resolve(environmentCtrl.exclusionLists);
                    return deferred.promise;
                };

                environmentCtrl.dtOptionsExclusionLists = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableDataExclusionLists();
                })
                    .withDOM('lTfgitp')
                    .withOption('createdRow', function (row) {
                        // Recompiling so we can bind Angular directive to the DT
                        $compile(angular.element(row).contents())($scope);
                    })
                    .withOption('scrollX', false)
                    .withOption('aaSorting', [4, 'asc'])
                    .withOption('lengthChange', false)
                    .withOption('paging', false)
                    .withOption('searching', false)
                    .withOption('info', false);

                environmentCtrl.dtInstanceCallbackExclusionLists = function (dtInstance) {
                    if (angular.isFunction(environmentCtrl.dtInstanceExclusionLists)) {
                        environmentCtrl.dtInstanceExclusionLists(dtInstance);
                    } else if (angular.isDefined(environmentCtrl.dtInstanceExclusionLists)) {
                        environmentCtrl.dtInstanceExclusionLists = dtInstance;
                    }
                };
                if (environmentCtrl.dtInstanceExclusionLists.changeData != null)
                    environmentCtrl.dtInstanceExclusionLists.changeData(getTableDataExclusionLists());

                environmentCtrl.loadingTableExclusionLists = false;
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Failed to get Exclusion Lists");
            }
        });


        TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.allTesters = response.result;
                environmentCtrl.allTesters.unshift({
                    user_id : -1,
                    username : "ALL"
                });
                _.remove(environmentCtrl.allTesters,function(tester){
                    if (_.find(environmentCtrl.environmentData.owners,{user_id: tester.user_id})){
                        return true;
                    }
                    return false;
                })
            }
            else {
                environmentCtrl.hideUsersInput = true;
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
            }
        });

        environmentCtrl.openRole = function (index) {
            environmentCtrl.roleData = angular.copy(environmentCtrl.roles[index]);
            environmentCtrl.disableChangeRole = (environmentCtrl.disableChange ||
            (environmentCtrl.roleData.role_status == 'Inactive' || !AuthService.authorizedToEdit(1) || !environmentCtrl.environmentData.isOwner));
            TDMService.getEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.roleData.role_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.testers = response.result;
                    if (!environmentCtrl.allTesters) {
                        environmentCtrl.allTesters = [];
                    }
                    environmentCtrl.allTestersRole = environmentCtrl.allTesters.concat(environmentCtrl.testers);
                }
                else {
                    environmentCtrl.hideUsersInput = true;
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to get Role Users : " + response.message);
                }
            });
            environmentCtrl.activityPanel = 'empty';
            $timeout(function () {
                environmentCtrl.activityPanel = 'Role';
            }, 200);
        };


        environmentCtrl.deleteRole = function () {
            TDMService.deleteEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData.role_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "deleted Successfully");
                    environmentCtrl.roleData.role_status = 'Inactive';
                    var currentRole = _.find(environmentCtrl.roles,{role_id : environmentCtrl.roleData.role_id});
                    if (currentRole){
                        currentRole.role_status = 'Inactive';
                    }
                    environmentCtrl.dtInstanceRoles.reloadData(function (data) {
                    }, true);
                    TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.allTesters = response.result;
                            environmentCtrl.allTesters.unshift({
                                user_id : -1,
                                username : "ALL"
                            });
                            _.remove(environmentCtrl.allTesters,function(tester){
                                if (_.find(environmentCtrl.environmentData.owners,{user_id: tester.user_id})){
                                    return true;
                                }
                                return false;
                            })
                        }
                        else {
                            environmentCtrl.hideUsersInput = true;
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to delete");
                }
            });
        };

        environmentCtrl.saveRoleChanges = function () {
            TDMService.postEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData.role_name, environmentCtrl.testers).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role Users # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.allTesters = response.result;
                            environmentCtrl.allTesters.unshift({
                                user_id : -1,
                                username : "ALL"
                            });
                            _.remove(environmentCtrl.allTesters,function(tester){
                                if (_.find(environmentCtrl.environmentData.owners,{user_id: tester.user_id})){
                                    return true;
                                }
                                return false;
                            })
                        }
                        else {
                            environmentCtrl.hideUsersInput = true;
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Role Users # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });

            TDMService.updateEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.roleData.role_id, environmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                    TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.roles = response.result;
                            environmentCtrl.dtInstanceRoles.reloadData(function (data) {
                            }, true);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                }
            });
        };

        environmentCtrl.openNewRole = function () {
            environmentCtrl.roleData = {
                allowed_test_conn_failure: false,
                allowed_creation_of_synthetic_data: false,
                allowed_delete_before_load: false,
                allowed_random_entity_selection: false,
                allowed_request_of_fresh_data: false,
                allowed_task_scheduling: false,
                allowed_replace_sequences: false,
                allowed_refresh_reference_data: false,
                allowed_entity_versioning: false,
                allowed_number_of_entities_to_copy: 0,
                allowed_number_of_entities_to_read: 0,
                role_description: "",
                role_name: "",
                allow_read : environmentCtrl.environmentDataOrig.allow_read ? true : false,
                allow_write : environmentCtrl.environmentDataOrig.allow_write ? true : false
            };
            environmentCtrl.activityPanel = 'newRole';
            environmentCtrl.testers = [];
            if (!environmentCtrl.allTesters) {
                environmentCtrl.allTesters = [];
            }
        };

        environmentCtrl.addNewRole = function () {
            if (_.find(environmentCtrl.roles, {role_name: environmentCtrl.roleData.role_name, role_status: 'Active'})) {
                return toastr.error("Role # " + environmentCtrl.roleData.role_name + " Already Exists");
            }
            TDMService.postEnvironmentRole(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.roleData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    TDMService.getEnvironmentRoles(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.roles = response.result;
                            environmentCtrl.dtInstanceRoles.reloadData(function (data) {
                            }, true);
                        }
                    });
                    toastr.success("Role # " + environmentCtrl.roleData.role_name, "Created Successfully");
                    environmentCtrl.getSummaryData();
                    TDMService.postEnvironmentRoleTesters(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                        response.result.id, environmentCtrl.roleData.role_name, environmentCtrl.testers).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Role Users # " + environmentCtrl.roleData.role_name, "Updated Successfully");
                            TDMService.getTesters(environmentCtrl.environmentData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    environmentCtrl.allTesters = response.result;
                                    environmentCtrl.allTesters.unshift({
                                        user_id : -1,
                                        username : "ALL"
                                    });
                                    _.remove(environmentCtrl.allTesters,function(tester){
                                        if (_.find(environmentCtrl.environmentData.owners,{user_id: tester.user_id})){
                                            return true;
                                        }
                                        return false;
                                    })
                                }
                                else {
                                    environmentCtrl.hideUsersInput = true;
                                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "failed to get All Testers : " + response.message);
                                }
                            });
                        }
                        else {
                            toastr.error("Role Users # " + environmentCtrl.roleData.role_name, "failed to Update : " + response.message);
                        }
                    });
                }
                else {
                    toastr.error("Role # " + environmentCtrl.roleData.role_name, "Unable to Create : " + response.message);
                }
            });
        };

        environmentCtrl.addNewGlobal = function () {

            environmentCtrl.globalData.update_date = new Date().toUTCString();
            environmentCtrl.globalData.updated_by = environmentCtrl.environmentData.environment_last_updated_by;

            console.log(environmentCtrl.globalData);

            if (_.find(environmentCtrl.globals, {global_name: environmentCtrl.globalData.global_name})) {
                return toastr.error("Global # " + environmentCtrl.globalData.global_name + " Already Exists");
            }
            TDMService.postEnvGlobal(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.globalData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    TDMService.getEnvGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.globals = response.result;
                            environmentCtrl.dtInstanceGlobals.reloadData(function (data) {
                            }, true);
                        }
                    });
                    toastr.success("Global # " + environmentCtrl.globalData.global_name, "Created Successfully");
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Global # " + environmentCtrl.roleData.role_name, "Unable to Create : " + response.message);
                }
            });
        };

        var addNewExclusionList = function () {

            console.log("add new exclusion list");
            TDMService.postEnvExclusionList(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("An Exclusion List was added successfully");
                    TDMService.getEnvExclusionLists(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {

                            environmentCtrl.exclusionLists = _.sortBy(response.result, function (value) {
                                return new Date(value.creation_date);
                            });
                            environmentCtrl.dtInstanceExclusionLists.reloadData(function (data) {
                            }, true);
                            environmentCtrl.getSummaryData();
                        }
                        else {
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Failed to get Exclusion Lists");
                        }
                    });
                }
                else {
                    toastr.error("Failed to add an Exclusion List" + response.message);
                }
            });
        };

        var saveExclusionList = function () {

            console.log("save exclusion list. id: " + environmentCtrl.exclusionListData.be_env_exclusion_list_id);
            TDMService.putEnvExclusionList(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData.be_env_exclusion_list_id, environmentCtrl.exclusionListData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("An Exclusion List was added successfully");
                    TDMService.getEnvExclusionLists(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {

                            environmentCtrl.exclusionLists = _.sortBy(response.result, function (value) {
                                return new Date(value.creation_date);
                            });
                            environmentCtrl.dtInstanceExclusionLists.reloadData(function (data) {
                            }, true);
                            environmentCtrl.getSummaryData();
                        }
                        else {
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Failed to get Exclusion Lists");
                        }
                    });
                }
                else {
                    toastr.error("Failed to add an Exclusion List" + response.message);
                }
            });
        };


        environmentCtrl.exclusionPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0,})?$");

        environmentCtrl.beIsSelected = false;

        environmentCtrl.onBeSelect = function () {
            environmentCtrl.beIsSelected = true;
        };

        environmentCtrl.validateExclusionListRequestedBy = function () {
            console.log("validating Exclusion List requested by: nev_id=" + environmentCtrl.environmentData.environment_id + "\n");
            console.log(environmentCtrl.exclusionListData);

            environmentCtrl.exclusionListRequestedByIsNotValid = false;

            TDMService.postEnvExclusionListValidateRequestedBy(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    if (response.result.length > 0) {
                        environmentCtrl.exclusionListRequestedByIsNotValid = true;
                    }
                }
                else {
                    toastr.error("Unable to execute Exclusion List Validation 1: " + response.message);
                }
            });
        };

        environmentCtrl.validateAndAddExclusionList = function () {
            console.log("validating Exclusion List ");

            environmentCtrl.patternFailed = false;
            environmentCtrl.exclusionListIsNotValid = false;

            //first remove space and new lines and validate pattern
            environmentCtrl.exclusionListData.exclusion_list = environmentCtrl.exclusionListData.exclusion_list.replace(/\s/g, '');
            environmentCtrl.exclusionListData.exclusion_list = environmentCtrl.exclusionListData.exclusion_list.replace(/\r?\n|\r/g, '');

            if (environmentCtrl.exclusionPattern.test(environmentCtrl.exclusionListData.exclusion_list)) {

                TDMService.postEnvExclusionListValidateList(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        if (response.result.length > 0) {
                            environmentCtrl.exclusionListIsNotValid = true;
                            environmentCtrl.existingExclusionListMembers = [];
                            for (var i = 0; i < response.result.length; i++) {
                                environmentCtrl.existingExclusionListMembers.push(response.result[i].unnest);
                            }
                        } else {
                            addNewExclusionList();
                        }
                    }
                    else {
                        toastr.error("Unable to execute Exclusion List Validation 2: " + response.message);
                    }
                });
            } else {
                environmentCtrl.patternFailed = true;
            }
        };

        environmentCtrl.validateAndSaveExclusionList = function () {
            console.log("validating Exclusion List ");

            environmentCtrl.patternFailed = false;
            environmentCtrl.exclusionListIsNotValid = false;

            //first remove space and new lines and validate pattern
            environmentCtrl.exclusionListData.exclusion_list = environmentCtrl.exclusionListData.exclusion_list.replace(/\s/g, '');
            environmentCtrl.exclusionListData.exclusion_list = environmentCtrl.exclusionListData.exclusion_list.replace(/\r?\n|\r/g, '');

            if (environmentCtrl.exclusionPattern.test(environmentCtrl.exclusionListData.exclusion_list)) {

                TDMService.postEnvExclusionListValidateListBeforeUpdate(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        if (response.result.length > 0) {
                            environmentCtrl.exclusionListIsNotValid = true;
                            environmentCtrl.existingExclusionListMembers = [];
                            for (var i = 0; i < response.result.length; i++) {
                                environmentCtrl.existingExclusionListMembers.push(response.result[i].unnest);
                            }
                        } else {
                            saveExclusionList();
                        }
                    }
                    else {
                        toastr.error("Unable to execute Exclusion List Validation 2: " + response.message);
                    }
                });
            } else {
                environmentCtrl.patternFailed = true;
            }
        };

        environmentCtrl.openExclusionList = function (index) {
            environmentCtrl.exclusionListRequestedByIsNotValid = false;
            environmentCtrl.disableChangeExclusionList = false;
            environmentCtrl.exclusionListIsNotValid = false;

            environmentCtrl.exclusionListData = angular.copy(environmentCtrl.exclusionLists[index]);

            environmentCtrl.disableChangeExclusionList = (environmentCtrl.disableChange ||
            (!AuthService.authorizedToEdit(1) || !environmentCtrl.environmentData.isOwner));
            environmentCtrl.activityPanel = 'empty';
            $timeout(function () {
                environmentCtrl.activityPanel = 'ExclusionList';
            }, 200);
        };

        environmentCtrl.deleteExclusionList = function () {
            TDMService.deleteEnvExclusionList(environmentCtrl.environmentData.environment_id, environmentCtrl.exclusionListData.be_env_exclusion_list_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {

                    toastr.success("Exclusion List deleted Successfully");
                    TDMService.getEnvExclusionLists(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {

                            environmentCtrl.exclusionLists = _.sortBy(response.result, function (value) {
                                return new Date(value.creation_date);
                            });
                            environmentCtrl.dtInstanceExclusionLists.reloadData(function (data) {
                            }, true);
                            environmentCtrl.getSummaryData();
                        }
                        else {
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Failed to get Exclusion Lists");
                        }
                    });

                }
                else {
                    toastr.error("Exclusion List failed to delete");
                }
            });
        };

        environmentCtrl.openNewExclusionList = function () {
            environmentCtrl.disableChangeExclusionList = false;
            environmentCtrl.exclusionListIsNotValid = false;


            environmentCtrl.exclusionListData = {};
            environmentCtrl.activityPanel = 'newExclusionList';
        };


        TDMService.getDataCenters().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                environmentCtrl.dataCenters = _.unique(_.filter(response.result, function (dc) {
                    if (dc.status == 'ALIVE') {
                        return true;
                    }
                    return false;
                }),'dc');
            }
            else {
                toastr.error("Environment # " + environmentCtrl.environmentData.environment_name, "Failed to get data centers");
            }
        });



        environmentCtrl.openProduct = function (index) {
            environmentCtrl.productData = angular.copy(environmentCtrl.products[index]);
            if (environmentCtrl.productData.product_id) {
                TDMService.getProductLogicalUnits(environmentCtrl.productData.product_id).then(function(response){
                    environmentCtrl.logicalUnitsForProduct = response.result;
                    environmentCtrl.dataCenterChanged();
                });
            }
            // if (environmentCtrl.environmentDataOrig.allow_write){
            //     if (environmentCtrl.productData.product_id) {
            //         // TDMService.getDbInterfacesByProductLUs(environmentCtrl.productData.product_id).then(function(response){
            //         //     if (response.errorCode == "SUCCESS") {
            //         //         var interfaces = response.result;
            //         //         _.each(interfaces, function (interface) {
            //         //             var foundInterface = _.find(environmentCtrl.productData.interfaces,{interface_name : interface.interface_name});
            //         //             if (foundInterface){
            //         //                 if (foundInterface.interface_type == interface.interface_type){
            //         //                     interface.db_host = foundInterface.db_host;
            //         //                     interface.db_port = foundInterface.db_port;
            //         //                     interface.db_user = foundInterface.db_user;
            //         //                     interface.db_password = foundInterface.db_password;
            //         //                     interface.db_schema = foundInterface.db_schema;
            //         //                     interface.env_product_interface_id = foundInterface.env_product_interface_id;
            //         //                     interface.db_connection_string = foundInterface.db_connection_string;
            //         //                     interface.status = (interface.db_connection_string != null || interface.db_host != null);
            //         //                     interface.update = true;
            //         //                 }
            //         //                 else{
            //         //                     interface.status = false;
            //         //                 }
            //         //             }
            //         //             else{
            //         //                 interface.deleted = true;
            //         //                 interface.status = false;
            //         //             }
            //         //             interface.interface_status = "Active";
            //         //         });
            //         //         environmentCtrl.productData.interfaces = interfaces;
            //         //     }
            //         //     else {
            //         //         toastr.error("Product # " + environmentCtrl.productData.product_id, "failed to get interfaces");
            //         //     }
            //         // });
            //     }
            // }
            // TDMService.getProductInterfaces(environmentCtrl.productData.product_id).then(function (response) {
            //     if (response.errorCode == "SUCCESS") {
            //         if (environmentCtrl.productData.status == 'Active') {
            //             for (var i = 0; i < response.result.length; i++) {
            //                 if (response.result[i].interface_status == 'Active' && !_.find(environmentCtrl.productData.interfaces, {interface_id: response.result[i].interface_id})) {
            //                     response.result[i].status = false;
            //                     environmentCtrl.productData.interfaces.push(response.result[i]);
            //                 }
            //             }
            //         }
            //     }
            //     _.each(environmentCtrl.productData.interfaces, function (interface) {
            //         interface.status = (interface.db_connection_string != null || interface.db_host != null);
            //         interface.update = true;
            //     });
            // });
            environmentCtrl.disableChangeProduct = (environmentCtrl.disableChange ||
            (environmentCtrl.productData.status == 'Inactive' || !AuthService.authorizedToEdit(1) || !environmentCtrl.environmentData.isOwner));
            environmentCtrl.activityPanel = 'empty';
            $timeout(function () {
                environmentCtrl.activityPanel = 'Product';
            }, 200);
        };

        environmentCtrl.openGlobal = function (index) {

            if (!environmentCtrl.environmentData.isOwner) return;

            TDMService.getAllGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {

                var envGlobals = response.result;
                if (response.errorCode == "SUCCESS") {

                    environmentCtrl.newEnvGlobals = envGlobals;
                    environmentCtrl.disableChangeGlobal = false;
                    environmentCtrl.globalData = angular.copy(environmentCtrl.globals[index]);
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                }
            })
            environmentCtrl.activityPanel = 'empty';
            $timeout(function () {
                environmentCtrl.activityPanel = 'Global';
            }, 200);
        };

        environmentCtrl.deleteProduct = function () {
            TDMService.deleteEnvProduct(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.productData.product_id).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_name, "deleted Successfully");
                    environmentCtrl.productData.status = 'Inactive';
                    var currentProduct = _.find(environmentCtrl.products,{product_id : environmentCtrl.productData.product_id});
                    if (currentProduct){
                        currentProduct.status = 'Inactive';
                    }
                    environmentCtrl.dtInstanceProducts.reloadData(function (data) {
                    }, true);
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Product # " + environmentCtrl.productData.product_name, "failed to delete");
                }
            });
        };

        environmentCtrl.deleteGlobal = function () {
            TDMService.deleteEnvGlobal(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name,
                environmentCtrl.globalData.global_name).then(function (response) {
                if (response.errorCode == "SUCCESS") {

                    toastr.success("Global # " + environmentCtrl.globalData.global_name, "deleted Successfully");
                    TDMService.getEnvGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {

                            environmentCtrl.globals = _.sortBy(response.result, function (value) {
                                return new Date(value.update_date);
                            });
                            environmentCtrl.globals.reverse();
                            environmentCtrl.dtInstanceGlobals.reloadData(function (data) {
                            }, true);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Global # " + environmentCtrl.globalData.global_name, "failed to delete");
                }
            });
        };

        environmentCtrl.saveProductChanges = function () {

            /*environmentCtrl.productData.interfaces = _.filter(environmentCtrl.productData.interfaces,function(interface){
             return (interface.env_product_interface_status == 'Active');
             });*/
            if (environmentCtrl.productData && environmentCtrl.productData.interfaces){
                _.remove(environmentCtrl.productData.interfaces,function(interface1){
                    if (interface1.deleted && !interface1.env_product_interface_id){
                        return true;
                    }
                    return false;
                });
            }
            TDMService.putEnvProduct(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.productData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_name, "Updated Successfully");
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.products = response.result;
                            environmentCtrl.dtInstanceProducts.reloadData(function (data) {
                            }, true);
                        }
                    });
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Product # " + environmentCtrl.productData.product_name, "failed to update");
                }
            });
        };

        environmentCtrl.saveGlobalChanges = function () {

            //update the global
            TDMService.putEnvGlobal(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.globalData).then(function (response) {
                if (response.errorCode == "SUCCESS") {

                    toastr.success("Global # " + environmentCtrl.globalData.global_name, "Updated Successfully");
                    if (response.errorCode == "SUCCESS") {

                        //get new global data(after update)
                        TDMService.getEnvGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {
                            if (response.errorCode == "SUCCESS") {

                                environmentCtrl.globals = _.sortBy(response.result, function (value) {
                                    return new Date(value.update_date);
                                });
                                environmentCtrl.globals.reverse();
                                environmentCtrl.dtInstanceGlobals.reloadData(function (data) {
                                }, true);
                            }
                        });
                    }
                    environmentCtrl.getSummaryData();
                }
                else {
                    toastr.error("Global # " + environmentCtrl.globalData.global_name, "failed to update");
                }
            });
        };


        environmentCtrl.openEnvProductInterfaceEdit = function (index) {
            var environmentDataOrig = environmentCtrl.environmentDataOrig;
            var dbInterfaceModalInstance = $uibModal.open({

                templateUrl: 'views/environments/environmentProductInterfaceModal.html',
                resolve: {
                    dbInterface: environmentCtrl.productData.interfaces[index],
                    disableChange: environmentCtrl.disableChangeProduct || environmentCtrl.productData.interfaces[index].env_product_interface_status == 'Inactive'
                },
                controller: function ($scope, $uibModalInstance, dbInterface , disableChange) {
                    var dbInterfaceCtrl = this;
                    dbInterfaceCtrl.dbInterfaceData = dbInterface;
                    if (environmentDataOrig.allow_read && environmentDataOrig.allow_write 
                        && !dbInterfaceCtrl.dbInterfaceData.db_host && !dbInterfaceCtrl.dbInterfaceData.db_connection_string){
                        TDMService.postGenericAPI('interfaceConnectionDetails',{
                            interfaceName : dbInterfaceCtrl.dbInterfaceData.interface_name,
                            environmentName: environmentDataOrig.fabric_environment_name
                        }).then(function(response){
                            console.log(response.result);
                            if (response.result && response.result.length > 0){
                                dbInterfaceCtrl.dbInterfaceData.db_host = response.result[0];
                                dbInterfaceCtrl.dbInterfaceData.db_port = parseInt(response.result[1]);
                                dbInterfaceCtrl.dbInterfaceData.db_user = response.result[3];
                                dbInterfaceCtrl.dbInterfaceData.db_password = response.result[4];
                                dbInterfaceCtrl.dbInterfaceData.db_schema = response.result[2];
                                TDMService.decryptInterfacePassword({'db_password':dbInterfaceCtrl.dbInterfaceData.db_password}).then(function (response) {
                                    if (response.errorCode == "FAIL" || !response.result) {
                                        console.log("Error decrypting password : " + response.message);
                                    } else {
                                        dbInterfaceCtrl.dbInterfaceData.db_password = response.result;
                                    }
                                    dbInterfaceCtrl.dbInterfaceData.passwordDecrypt = true;
                                });
                            }
                        });
                    }


                    if (!dbInterfaceCtrl.dbInterfaceData.passwordDecrypt && dbInterfaceCtrl.dbInterfaceData.db_password && dbInterfaceCtrl.dbInterfaceData.db_password != ""){
                        TDMService.decryptInterfacePassword({'db_password':dbInterfaceCtrl.dbInterfaceData.db_password}).then(function (response) {
                            if (response.errorCode == "FAIL" || !response.result) {
                                console.log("Error decrypting password : " + response.message);
                            } else {
                                dbInterfaceCtrl.dbInterfaceData.db_password = response.result;
                            }
                            dbInterfaceCtrl.dbInterfaceData.passwordDecrypt = true;
                        });
                    }
                    dbInterfaceCtrl.interfaceType = "1";
                    if (dbInterfaceCtrl.dbInterfaceData.db_connection_string != null) {
                        dbInterfaceCtrl.interfaceType = "0"
                    }
                    dbInterfaceCtrl.disableChange = disableChange;
                    dbInterfaceCtrl.saveDBInterface = function () {
                        if (dbInterfaceCtrl.interfaceType == "1") {
                            dbInterfaceCtrl.dbInterfaceData.db_connection_string = null;
                        }
                        else {
                            dbInterfaceCtrl.dbInterfaceData.db_host = null;
                            dbInterfaceCtrl.dbInterfaceData.db_port = null;
                            dbInterfaceCtrl.dbInterfaceData.db_schema = null;
                        }
                        if (dbInterfaceCtrl.dbInterfaceData.status == false) {
                            dbInterfaceCtrl.dbInterfaceData.newInterface = true;
                        }
                        dbInterfaceCtrl.dbInterfaceData.status = true;
                        dbInterfaceCtrl.dbInterfaceData.deleted = false;
                        $uibModalInstance.close(dbInterfaceCtrl.dbInterfaceData);
                    };

                    dbInterfaceCtrl.testDBInterfaceConn = function(){
                        var requestData = {
                            'interface_db_type':dbInterfaceCtrl.dbInterfaceData.interface_type,
                            'db_host':dbInterfaceCtrl.dbInterfaceData.db_host,
                            'db_port':dbInterfaceCtrl.dbInterfaceData.db_port,
                            'db_user':dbInterfaceCtrl.dbInterfaceData.db_user,
                            'db_password':dbInterfaceCtrl.dbInterfaceData.db_password,
                            'db_schema':dbInterfaceCtrl.dbInterfaceData.db_schema,
                            'db_connection_string':dbInterfaceCtrl.dbInterfaceData.db_connection_string
                        };
                        TDMService.testInterfaceDbConnection(requestData).then(function (response) {
                            if (response.errorCode == "FAIL" || !response.result) {
                                dbInterfaceCtrl.testDbConnSuccess = false;
                                dbInterfaceCtrl.testDBInterfaceConnResult = "Failed " + (response.message ? "[" + response.message + "]" : "");
                            } else {
                                dbInterfaceCtrl.testDbConnSuccess = true;
                                dbInterfaceCtrl.testDBInterfaceConnResult = "Success";
                            }
                            console.log("Connection Test Done.\n" + response.message);
                        });

                    };

                    dbInterfaceCtrl.close = function () {
                        $uibModalInstance.close();
                    };
                },
                controllerAs: 'dbInterfaceCtrl'
            });
        };

        environmentCtrl.openNewProduct = function () {
            environmentCtrl.disableChangeProduct = false;
            TDMService.getProductsWithLUs().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    var allProducts = response.result;
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        var envProducts = response.result;
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.newEnvProducts = _.reject(allProducts, function (product) {
                                for (var i = 0; i < envProducts.length; i++) {
                                    if (envProducts[i].product_id === product.product_id && envProducts[i].status === 'Active') {
                                        return true;
                                    }
                                }
                                return false;
                            });
                        }
                        else {
                            toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                        }
                    })
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                }
            });

            environmentCtrl.productData = {};
            environmentCtrl.activityPanel = 'newProduct';
        };

        environmentCtrl.openNewGlobal = function () {
            environmentCtrl.disableChangeGlobal = false;

            TDMService.getAllGlobals(environmentCtrl.environmentData.environment_id).then(function (response) {

                var envGlobals = response.result;
                if (response.errorCode == "SUCCESS") {
                    environmentCtrl.newEnvGlobals = envGlobals;
                }
                else {
                    toastr.error("Environment # " + environmentCtrl.environmentData.environment_id, "Faild to get new products");
                }
            })

            environmentCtrl.globalData = {};
            environmentCtrl.activityPanel = 'newGlobal';
        };

        environmentCtrl.dataCenterChanged = function(){
            if (environmentCtrl.productData.data_center_name){
                var dataCenter = _.find(environmentCtrl.dataCenters,{dc : environmentCtrl.productData.data_center_name});
                if (dataCenter){
                    environmentCtrl.addProductWarning = null;
                    if (environmentCtrl.logicalUnitsForProduct){
                        for (var i = 0;i < environmentCtrl.logicalUnitsForProduct.length ; i++){
                            if (environmentCtrl.logicalUnitsForProduct[i].lu_dc_name && environmentCtrl.logicalUnitsForProduct[i].lu_dc_name != "" &&
                            environmentCtrl.logicalUnitsForProduct[i].lu_dc_name !== dataCenter.dc){
                                environmentCtrl.addProductWarning = {
                                    dc_name : dataCenter.dc,
                                    lu_name : environmentCtrl.logicalUnitsForProduct[i].lu_name,
                                    lu_dc_name : environmentCtrl.logicalUnitsForProduct[i].lu_dc_name
                                }
                                break;
                            }
                        }
                    }
                }
            }
        };

        environmentCtrl.productChanged = function () {

            if (environmentCtrl.productData.product_id) {
                TDMService.getProductLogicalUnits(environmentCtrl.productData.product_id).then(function(response){
                    environmentCtrl.logicalUnitsForProduct = response.result;
                    environmentCtrl.dataCenterChanged();
                });
                var product = _.find(environmentCtrl.newEnvProducts, {product_id: environmentCtrl.productData.product_id});
                if (product) {
                    environmentCtrl.productData.product_versions = product.product_versions;
                }
                environmentCtrl.productData.lus = parseInt(product.lus);
                // if (!environmentCtrl.environmentDataOrig.allow_write && !environmentCtrl.adi_only){
                //     return;
                // }
                // TDMService.getDbInterfacesByProductLUs(environmentCtrl.productData.product_id).then(function(response){
                //     if (response.errorCode == "SUCCESS") {
                //         environmentCtrl.productData.interfaces = response.result;
                //         _.each(environmentCtrl.productData.interfaces, function (interface) {
                //             interface.status = false;
                //             interface.interface_status = "Active";
                //         });
                //     }
                //     else {
                //         toastr.error("Product # " + environmentCtrl.productData.product_id, "failed to get interfaces");
                //     }
                // });
            }
        };

        environmentCtrl.addProduct = function () {
            if (environmentCtrl.addProductInProgress == true) {
                return;
            }
            environmentCtrl.addProductInProgress = true;
            if (environmentCtrl.productData && environmentCtrl.productData.interfaces){
                _.remove(environmentCtrl.productData.interfaces,{deleted : true});
            }
            TDMService.postEnvProduct(environmentCtrl.environmentData.environment_id, environmentCtrl.environmentData.environment_name, environmentCtrl.productData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Product # " + environmentCtrl.productData.product_id, "Created Successfully");
                    TDMService.getEnvProducts(environmentCtrl.environmentData.environment_id).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            environmentCtrl.products = response.result;
                            environmentCtrl.dtInstanceProducts.reloadData(function (data) {
                            }, true);
                        }
                    });
                    environmentCtrl.addProductInProgress = false;
                    environmentCtrl.getSummaryData();
                }
                else {
                    environmentCtrl.addProductInProgress = false;
                    toastr.error("Product # " + environmentCtrl.productData.product_id, "Unable to Create : " + response.message);
                }
            });
        };

        environmentCtrl.openProductFullView = function () {
            environmentCtrl.productDataFullView = {
                product_id: environmentCtrl.productData.product_id,
                product_name: environmentCtrl.productData.product_name,
                product_status: environmentCtrl.productData.product_status,
                product_vendor: environmentCtrl.productData.product_vendor,
                product_versions: environmentCtrl.productData.product_versions,
                product_description: environmentCtrl.productData.product_description
            };
            $scope.content.openProduct(environmentCtrl.productDataFullView);
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'environmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('environmentDirective', environmentDirective);