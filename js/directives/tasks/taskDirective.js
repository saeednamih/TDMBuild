function taskDirective() {

    var template = "views/tasks/task.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, SweetAlert,
                               $uibModal, toastr, $timeout, AuthService, $state, DTOptionsBuilder, DTColumnBuilder, $q, $compile) {
        var taskCtrl = this;
        taskCtrl.schedulerOptions = {
            formInputClass: 'form-control cron-gen-input', // Form input class override
            formSelectClass: 'form-control cron-gen-select', // Select class override
            formRadioClass: 'cron-gen-radio', // Radio class override
            formCheckboxClass: 'cron-gen-checkbox', // Radio class override
            hideMinutesTab: false, // Whether to hide the minutes tab
            hideHourlyTab: false, // Whether to hide the hourly tab
            hideDailyTab: false, // Whether to hide the daily tab
            hideWeeklyTab: false, // Whether to hide the weekly tab
            hideMonthlyTab: false, // Whether to hide the monthly tab
            hideYearlyTab: false, // Whether to hide the yearly tab
            hideAdvancedTab: false, // Whether to hide the advanced tab
            use24HourTime: true, // Whether to show AM/PM on the time selectors
            hideSeconds: false // Whether to show/hide the seconds time picker
        };

        taskCtrl.taskData = angular.copy($scope.content.task);
        taskCtrl.copyTask = $scope.content.copy;
        if (taskCtrl.copyTask) {
            taskCtrl.taskData.task_title = taskCtrl.taskData.task_title + " Copy";
        }
        taskCtrl.isFluxMode = AuthService.isFluxMode();
        taskCtrl.retentionPeriod = AuthService.getRetentionPeriod();
        taskCtrl.taskData.reference = null;
        
        if (taskCtrl.taskData.sync_mode) {
            taskCtrl.taskData.request_of_fresh_data = true;
        }
        // if (!taskCtrl.taskData.version_ind && !taskCtrl.taskData.request_of_fresh_data){
        //     taskCtrl.taskData.sync_mode = 'OFF';
        // }

        if (taskCtrl.taskData.task_type === 'EXTRACT' && !taskCtrl.taskData.version_ind && !taskCtrl.taskData.retention_period_value) {
            taskCtrl.taskData.retention_period_value = 0;
        }
        if (taskCtrl.taskData.selection_method == "REF") {
            taskCtrl.taskData.reference = "refernceOnly";

        } else if (taskCtrl.taskData.refcount > 0) {
            taskCtrl.taskData.reference = "both";
        }
        if (taskCtrl.taskData.reference) {
            TDMService.getGenericAPI("task/refsTable/" + taskCtrl.taskData.task_id).then(function (response) {
                taskCtrl.taskData.refList = _.map(response.result, function (ref) {
                    ref.selected = true;
                    return ref;
                });
            });
        }

        taskCtrl.referenceDropDown = [
            {
                text: "None",
                value: null
            },
            {
                text: "Reference Only",
                value: "refernceOnly"
            },
            {
                text: "Both - reference and entities",
                value: "both"
            }
        ];

        taskCtrl.timeZoneOffset = AuthService.getTimeZone();

        _.remove(taskCtrl.retentionPeriod.availableOptions, function (period) {
            if (period.units > taskCtrl.retentionPeriod.maxRetentionPeriod) {
                return true;
            }
        });

        // taskCtrl.getEnvId = () => taskCtrl.taskData.task_type === 'LOAD' ? taskCtrl.taskData.environment_id : taskCtrl.taskData.source_environment_id;

        TDMService.getGenericAPI("task/" + taskCtrl.taskData.task_id + "/globals").then(function (response) {
            taskCtrl.taskData.globals = response.result;
        })


        taskCtrl.referenceChange = function () {
            if (taskCtrl.taskData.reference == 'refernceOnly') {
                taskCtrl.taskData.selectAllEntites = false;
            }
        };

        if (taskCtrl.taskData.scheduling_end_date) {
            var scheduling_end_date = new Date(taskCtrl.taskData.scheduling_end_date);
            taskCtrl.taskData.scheduling_end_date = new Date(scheduling_end_date - taskCtrl.timeZoneOffset * 60000);
            //var localTimeZone = scheduling_end_date.getTimezoneOffset();
            //scheduling_end_date = scheduling_end_date.getTime() + localTimeZone * 60000;
            //taskCtrl.taskData.selected_version_datetime = moment(version_datetime - taskCtrl.timeZoneOffset * 60000).format("YYYYMMDDHHmmss");

            taskCtrl.scheduleEndBy = "endBy"
        } else {
            taskCtrl.scheduleEndBy = "noEndBy"
        }

        taskCtrl.versionForLoadTo = new Date();
        taskCtrl.versionForLoadFrom = new Date();
        taskCtrl.versionForLoadFrom.setDate(taskCtrl.versionForLoadFrom.getDate() - 30);
        if (taskCtrl.taskData.retention_period_value) {
            taskCtrl.retention_period_type = _.find(taskCtrl.retentionPeriod.availableOptions, {name: taskCtrl.taskData.retention_period_type});
            taskCtrl.taskData.retention_period_value = parseFloat(taskCtrl.taskData.retention_period_value);
        } else if (taskCtrl.retentionPeriod && taskCtrl.retentionPeriod.defaultPeriod &&
            taskCtrl.retentionPeriod.defaultPeriod.unit) {
            var defaultRetintion = _.find(taskCtrl.retentionPeriod.availableOptions, {name: taskCtrl.retentionPeriod.defaultPeriod.unit});
            if (defaultRetintion) {
                taskCtrl.retention_period_type = defaultRetintion;
                taskCtrl.taskData.retention_period_type = taskCtrl.retention_period_type.name;
                if (taskCtrl.taskData.task_type == "EXTRACT" && taskCtrl.taskData.version_ind) {
                    taskCtrl.taskData.retention_period_value = taskCtrl.retentionPeriod.defaultPeriod.value;
                }

            }
        }

        taskCtrl.retentionPeriodTypeChanged = function () {
            taskCtrl.taskData.retention_period_type = taskCtrl.retention_period_type.name;
        }

        if (taskCtrl.taskData.delete_before_load && taskCtrl.taskData.load_entity) {
            taskCtrl.taskData.operationMode = 'delete_and_load_entity';
        } else if (!taskCtrl.taskData.delete_before_load && taskCtrl.taskData.load_entity) {
            taskCtrl.taskData.operationMode = 'insert_entity_without_delete';
        } else if (taskCtrl.taskData.delete_before_load && !taskCtrl.taskData.load_entity) {
            taskCtrl.taskData.operationMode = 'delete_without_load_entity';
        } else {
            taskCtrl.taskData.operationMode = 'insert_entity_without_delete';
        }

        taskCtrl.taskTitlePattern = "^((?!_).)*$";

        taskCtrl.step = 1;



        var userRole = AuthService.getRole();
        var username = AuthService.getUsername();


        taskCtrl.userRoleType = userRole.type;

        taskCtrl.entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){" + (taskCtrl.taskData.number_of_entities_to_copy - 1) + "})?$");
        taskCtrl.excultionPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0,})?$");
        taskCtrl.syntheticPattern = "^[a-zA-Z0-9._-]+$";

        taskCtrl.updateEntitiesPattern = function () {
            if (taskCtrl.taskData.number_of_entities_to_copy) {
                taskCtrl.entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){" + (taskCtrl.taskData.number_of_entities_to_copy - 1) + "})?$")
            }
        };


        TDMService.getTimeZone().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                taskCtrl.timeZoneMessage = 'Task execution time will be based on ' + response.result.current_setting + ' time zone'
            } else {
                taskCtrl.timeZoneMessage = 'Task execution time will be based on DB time zone'
            }
        });

        taskCtrl.disableChange = (taskCtrl.taskData.task_status == 'Inactive' || username != taskCtrl.taskData.task_created_by);

        if (taskCtrl.taskData.task_status == 'Active' && (taskCtrl.taskData.owners.indexOf(username) >= 0 || userRole.type == 'admin')) {
            taskCtrl.disableChange = false;
        }

        if (taskCtrl.copyTask) {
            taskCtrl.disableChange = false;
        }

        if (userRole.type == 'admin' || taskCtrl.disableChange) {
            TDMService.getEnvironments().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.allEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_write && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    taskCtrl.allSourceEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_read && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    taskCtrl.allSourceEnvironments = _.unique(taskCtrl.allSourceEnvironments, 'fabric_environment_name');
                } else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Environments for user");
                }
            });
            // TDMService.getGenericAPI('sourceEnvironments').then(function(response){
            //     if (response.errorCode == "SUCCESS") {
            //         taskCtrl.allSourceEnvironments = response.result;
            //         taskCtrl.allSourceEnvironments = _.filter(taskCtrl.allSourceEnvironments, function (env) {
            //             return env.environment_status === 'Active';
            //         });
            //     }
            //     else {
            //         toastr.error("Faild to get Source Environments for user " + AuthService.getUsername());
            //     }
            // });
        } else {
            TDMService.getEnvironmentsForUser().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.allEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_write && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    taskCtrl.allSourceEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_read && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    taskCtrl.allSourceEnvironments = _.unique(taskCtrl.allSourceEnvironments, 'fabric_environment_name');
                } else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Environments for user");
                }
            });
            // TDMService.getGenericAPI('sourceenvironmentsbyuser').then(function(response){
            //     if (response.errorCode == "SUCCESS") {
            //         taskCtrl.allSourceEnvironments = response.result;
            //         taskCtrl.allSourceEnvironments = _.filter(taskCtrl.allSourceEnvironments, function (env) {
            //             return env.environment_status === 'Active';
            //         });
            //     }
            //     else {
            //         toastr.error("Faild to get Source Environments for user " + AuthService.getUsername());
            //     }
            // });
        }

        taskCtrl.entitiesListChange = function () {
            if (taskCtrl.entitiesListChangeTimeout) {
                $timeout.cancel(taskCtrl.entitiesListChangeTimeout);
            }
            if (taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.taskData.version_ind && !taskCtrl.taskData.selectAllEntites) {
                taskCtrl.entitiesListChangeTimeout = $timeout(function () {
                    taskCtrl.getVersionsForLoad();
                }, 1000);
            }
        };

        taskCtrl.taskModeChange = function (init, task_type) {

            let clearNumberOfEntitiesToCopy = () => {
                if (taskCtrl.taskData.version_ind) {
                    taskCtrl.taskData.number_of_entities_to_copy = undefined;
                }
            }

            clearNumberOfEntitiesToCopy();

            if (task_type) {
                taskCtrl.taskData.source_environment_id = null;
                taskCtrl.taskData.environment_id = null;
                taskCtrl.taskData.source_env_name = null;
                taskCtrl.maxToCopy = null;
            }
            if (taskCtrl.taskData.version_ind && taskCtrl.taskData.task_type == 'LOAD') {
                taskCtrl.getAllLogicalUnitsForEnv(taskCtrl.taskData.source_environment_id, taskCtrl.taskData.environment_id, init);
                taskCtrl.logicalUnits = [];
                taskCtrl.logicalUnit = null;
                if (!init) {
                    taskCtrl.taskData.be_id = null;
                }
            } else if (taskCtrl.taskData.task_type == 'EXTRACT') {
                taskCtrl.getAllLogicalUnitsForEnv(taskCtrl.taskData.source_environment_id, taskCtrl.taskData.source_environment_id, init);
                taskCtrl.logicalUnits = [];
                taskCtrl.logicalUnit = null;
                if (!init) {
                    taskCtrl.taskData.be_id = null;
                }
                if (task_type && !taskCtrl.taskData.version_ind) {
                    taskCtrl.taskData.retention_period_value = 0;
                } else if (taskCtrl.taskData.version_ind && !taskCtrl.taskData.retention_period_value) {
                    if (taskCtrl.retentionPeriod && taskCtrl.retentionPeriod.defaultPeriod &&
                        taskCtrl.retentionPeriod.defaultPeriod.unit) {
                        var defaultRetintion = _.find(taskCtrl.retentionPeriod.availableOptions, {name: taskCtrl.retentionPeriod.defaultPeriod.unit});
                        if (defaultRetintion) {
                            taskCtrl.retention_period_type = defaultRetintion;
                            taskCtrl.taskData.retention_period_type = taskCtrl.retention_period_type.name;
                            if (taskCtrl.taskData.task_type == "EXTRACT" && taskCtrl.taskData.version_ind) {
                                taskCtrl.taskData.retention_period_value = taskCtrl.retentionPeriod.defaultPeriod.value;
                            }
                        }
                    }
                }
            } else {
                taskCtrl.taskData.selectAllEntites = false;
                taskCtrl.logicalUnit = null;
            }
            if (!taskCtrl.taskData.selectAllEntites) {
                taskCtrl.selectFieldType = "given";
            }
        };

        taskCtrl.getAllLogicalUnitsForEnv = function (source_environment_id, environment_id, init) {
            if (source_environment_id && environment_id) {
                taskCtrl.allSingleLogicalUnits = [];
                TDMService.getGenericAPI('sourceenvid/' + source_environment_id +
                    '/targetendid/' + environment_id + '/logicalUnits').then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.allSingleLogicalUnits = response.result;
                        _.remove(taskCtrl.allSingleLogicalUnits, {last_executed_lu: true});
                        if (init && taskCtrl.logicalUnits && taskCtrl.logicalUnits[0]) {
                            taskCtrl.logicalUnit = _.find(taskCtrl.allSingleLogicalUnits, {lu_id: taskCtrl.logicalUnits[0].lu_id});
                        }
                    } else {
                        toastr.error("Faild to get Logical units");
                    }
                });
            }
        }

        taskCtrl.sourceEnvironmentChange = function (getRoles, init) {
            var sourceEnv = _.find(taskCtrl.allSourceEnvironments, {environment_id: taskCtrl.taskData.source_environment_id});
            if (sourceEnv) {
                taskCtrl.taskData.source_env_name = sourceEnv.fabric_environment_name;
            }
            if (getRoles) {
                taskCtrl.environmentChange(init, taskCtrl.taskData.source_environment_id,true);
            }
        }

        taskCtrl.checkReferenceIfAllowed = function () {
            if ((!taskCtrl.userRole || !taskCtrl.userRole.allowed_refresh_reference_data) && 
                (!taskCtrl.sourceUserRole || !taskCtrl.sourceUserRole.allowed_refresh_reference_data)) {
                taskCtrl.taskData.reference = null;
            }
        }

        taskCtrl.environmentChange = function (init, environment_id, source) {

            if (userRole.type == 'admin') {
                taskCtrl.userRole = {};
                taskCtrl.userRole.allowed_random_entity_selection = true;
                taskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                taskCtrl.userRole.allowed_refresh_reference_data = true;
                taskCtrl.userRole.allowed_request_of_fresh_data = true;
                taskCtrl.userRole.allowed_delete_before_load = true;
                taskCtrl.userRole.allowed_task_scheduling = true;
                taskCtrl.userRole.allowed_replace_sequences = true;
                taskCtrl.maxToCopy = null;
                taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.taskData.number_of_entities_to_copy);
            } else {
                TDMService.getEnvironmentOwners(environment_id || taskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                        if (ownerFound) {
                            taskCtrl.userRole = {};
                            taskCtrl.userRole.allowed_random_entity_selection = true;
                            taskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                            taskCtrl.userRole.allowed_refresh_reference_data = true;
                            taskCtrl.userRole.allowed_request_of_fresh_data = true;
                            taskCtrl.userRole.allowed_delete_before_load = true;
                            taskCtrl.userRole.allowed_task_scheduling = true;
                            taskCtrl.userRole.allowed_replace_sequences = true;
                            taskCtrl.taskData.number_of_entities_to_copy = parseInt(taskCtrl.taskData.number_of_entities_to_copy);
                            if (environment_id) {
                                taskCtrl.sourceEnvOwner = true;
                            } else {
                                taskCtrl.targetEnvOwner = true;
                            }
                        } else {
                            if (environment_id) {
                                taskCtrl.sourceEnvOwner = false;
                            } else {
                                taskCtrl.targetEnvOwner = false;
                            }
                            TDMService.getRoleForUserInEnv(environment_id || taskCtrl.taskData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    if (!environment_id) {
                                        taskCtrl.userRole = response.result.userRole;
                                    } else {
                                        taskCtrl.sourceUserRole = response.result.userRole;
                                    }

                                    if ((taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.userRole.allowed_entity_versioning &&
                                        taskCtrl.sourceUserRole.allowed_entity_versioning) ||
                                        (taskCtrl.taskData.task_type == 'EXTRACT' &&
                                            taskCtrl.sourceUserRole.allowed_entity_versioning)) {
                                        taskCtrl.allowed_entity_versioning = true;
                                    } else {
                                        taskCtrl.allowed_entity_versioning = false;
                                        taskCtrl.taskData.version_ind = false;
                                    }

                                    taskCtrl.checkReferenceIfAllowed();


                                    var minRead = response.result.minRead;
                                    var minWrite = response.result.minWrite;
                                    if (minRead > -1 || minWrite > -1) {
                                        minWrite = parseInt(minWrite || "0");
                                        minRead = parseInt(minRead || "0");
                                        if (environment_id) {
                                            taskCtrl.sourceMaxToCopy = minRead;
                                            if (taskCtrl.maxToCopy > minRead) {
                                                taskCtrl.maxToCopy = minRead;
                                            } else if (!taskCtrl.maxToCopy) {
                                                taskCtrl.maxToCopy = minRead;
                                            }
                                        } else {
                                            taskCtrl.targetMaxToCopy = minWrite;
                                            if (taskCtrl.maxToCopy > minWrite) {
                                                taskCtrl.maxToCopy = minWrite;
                                            } else if (!taskCtrl.maxToCopy) {
                                                taskCtrl.maxToCopy = minWrite;
                                            }
                                        }
                                    }
                                } else {
                                    toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Role for user ");
                                }
                            });
                        }
                    } else {
                        toastr.error("Environment # " + environment_id || taskCtrl.taskData.environment_id, "failed to get owners : " + response.message);
                    }
                });
            }
            if ((!source || taskCtrl.taskData.task_type === 'EXTRACT' || (init && !source)) && (environment_id || taskCtrl.taskData.environment_id)) {
                TDMService.getBusinessEntitiesForEnvProducts(environment_id || taskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {

                        taskCtrl.businessEntities = response.result;
                    } else {
                        toastr.error("Task # " + taskCtrl.taskData.task_id, "Faild to get Business Entities");
                    }
                });
            }
            if (!init) {
                taskCtrl.taskData.be_id = undefined;
                taskCtrl.products = [];
            }
        };

        taskCtrl.updateParams = cb => {
            TDMService.getGenericAPI('businessentity/' + taskCtrl.taskData.be_id + '/sourceEnv/' + taskCtrl.taskData.source_env_name + '/parameters').then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    taskCtrl.parameters = response.result;

                    let parametersKeys = Object.keys(taskCtrl.parameters);
                    var chosenLUs = _.map(taskCtrl.logicalUnits,function(lu){
                        return lu.lu_name.toLowerCase();
                    });
                    
                    for (let i = 0; i < parametersKeys.length; i++) {
                        if (chosenLUs.indexOf(parametersKeys[i].split(".")[0].toLowerCase()) < 0){
                            delete taskCtrl.parameters[parametersKeys[i]];
                        }
                    }
                    
                    taskCtrl.parameters = _.map(taskCtrl.parameters, function (value, key) {
                        return {
                            param_name: key,
                            name: value.PARAM_NAME,
                            param_type: value.PARAM_TYPE,
                            valid_values: value['VALID_VALUES'],
                            min_value: value.PARAM_TYPE == 'number' ? parseFloat(value['MIN_VALUE']) : 0,
                            max_value: value.PARAM_TYPE == 'number' ? parseFloat(value['MAX_VALUE']) : 0
                        }
                    });

                    if (cb) {
                        cb.apply();
                    }
                } else {
                    toastr.error("Business entity # " + taskCtrl.taskData.be_id, "Failed to get business entity parametes");
                }
            });
        };

        taskCtrl.businessEntityChange = function (init) {

            if (!init) {
                if (taskCtrl.filter) {
                    if (taskCtrl.filter.group) {
                        taskCtrl.filter.group.rules = [];
                    }
                }
                taskCtrl.taskData.selection_param_value = null;
                taskCtrl.taskData.parameters = null;
            }
            var be = _.find(taskCtrl.businessEntities, {be_id: taskCtrl.taskData.be_id});
            if (be) {
                taskCtrl.taskData.be_name = be.be_name;
            }

            var environment_id = taskCtrl.taskData.task_type === 'EXTRACT' ? taskCtrl.taskData.source_environment_id : taskCtrl.taskData.environment_id
            if (environment_id && taskCtrl.taskData.be_id) {
                TDMService.getLogicalUnitsForBusinessEntityAndEnv(taskCtrl.taskData.be_id, environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.allLogicalUnits = response.result;
                        if (!init) {
                            taskCtrl.logicalUnits = [];
                            for (var i = 0; i < taskCtrl.allLogicalUnits.length; i++) {
                                taskCtrl.logicalUnits.push(taskCtrl.allLogicalUnits[i]);
                            }
                        } else {
                            var tempLus = [];
                            for (var i = 0; i < taskCtrl.logicalUnits.length; i++) {
                                var lu = _.find(taskCtrl.allLogicalUnits, {lu_name: taskCtrl.logicalUnits[i].lu_name});
                                if (lu) {
                                    tempLus.push(lu);
                                }
                            }
                            taskCtrl.logicalUnits = tempLus;
                        }
                    } else {
                        toastr.error("Business entity # " + taskCtrl.taskData.be_id, "Failed to get Logical units");
                    }
                });
                // if (taskCtrl.taskData.source_env_name && taskCtrl.taskData.be_id) {
                //     taskCtrl.updateParams();
                // }
            }

            if (taskCtrl.taskData.be_id) {
                TDMService.getBEPostExecutionProcess(taskCtrl.taskData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.allPostExecutionProcess = response.result;
                        taskCtrl.allPostExecutionProcessIds = _.map(response.result,'process_id');
                        if (!init) {
                            taskCtrl.postExecutionProcesses = taskCtrl.allPostExecutionProcessIds;
                        }
                    } else {
                        toastr.error("Business entity # " + taskCtrl.taskData.be_id, "Failed to get Post Execution Processes");
                    }
                });
            }
        };

        TDMService.getTaskLogicalUnits(taskCtrl.taskData.task_id).then(function (response) {
            taskCtrl.businessEntityChange(true);
            if (response.errorCode == "SUCCESS") {
                taskCtrl.logicalUnits = response.result;
                taskCtrl.allSingleLogicalUnits = response.result;
                _.remove(taskCtrl.allSingleLogicalUnits, {last_executed_lu: true});
                if (taskCtrl.allSingleLogicalUnits &&
                    !(taskCtrl.taskData.task_type == "LOAD" && !taskCtrl.taskData.version_ind)
                    && taskCtrl.logicalUnits[0]) {
                    taskCtrl.logicalUnit = _.find(taskCtrl.allSingleLogicalUnits, {lu_id: taskCtrl.logicalUnits[0].lu_id});
                }
            } else {
                toastr.error("Products # " + taskCtrl.taskData.task_id, "Failed to get Task Products");
            }
        });

        TDMService.getTaskPostExecutionProcesses(taskCtrl.taskData.task_id).then(function (response) {
        if (response.errorCode == "SUCCESS") {
                taskCtrl.postExecutionProcesses = _.map(response.result,v => parseInt(v.process_id));
            } else {
                toastr.error("Task # " + taskCtrl.taskData.task_id, "Failed to get Task Post Execution Processes");
            }
        });

        taskCtrl.environmentChange(true);

        taskCtrl.requestedEntities = {};
        if (taskCtrl.taskData.selection_method != "ALL") {
            if (taskCtrl.taskData.selection_method == 'L') {
                taskCtrl.selectFieldType = 'given';
                taskCtrl.requestedEntities.entities_list = taskCtrl.taskData.selection_param_value;
            } else if (taskCtrl.taskData.selection_method == 'R') {
                taskCtrl.selectFieldType = 'random';
            } else if (taskCtrl.taskData.selection_method == 'S') {
                taskCtrl.selectFieldType = 'synthetic';
                taskCtrl.requestedEntities.synthetic = taskCtrl.taskData.selection_param_value;
            } else if (taskCtrl.taskData.selection_method == 'P' || taskCtrl.taskData.selection_method == 'PR') {
                taskCtrl.selectFieldType = 'parameters';
                taskCtrl.filter = JSON.parse(taskCtrl.taskData.parameters);
                taskCtrl.requestedEntities.query_parameters = taskCtrl.taskData.selection_param_value;
                taskCtrl.requestedEntities.parameters = taskCtrl.taskData.parameters;
                if (taskCtrl.taskData.selection_method == 'PR') {
                    taskCtrl.parametersRandom = true;
                } else {
                    taskCtrl.parametersRandom = false;
                }
            }
        } else {
            taskCtrl.taskData.selectAllEntites = true;
            taskCtrl.selectFieldType = "given";
        }

        if (!taskCtrl.filter) {
            var data = '{"group": {"operator": "AND","rules": []}}';
            taskCtrl.filter = JSON.parse(data);
        }

        if (taskCtrl.taskData.scheduler == 'immediate') {
            taskCtrl.selectSchedule = 'immediate';
        } else {
            taskCtrl.selectSchedule = 'schedule';
            taskCtrl.scheduleData = taskCtrl.taskData.scheduler;
        }


        taskCtrl.saveTask = function () {
            if (!taskCtrl.taskData.selectAllEntites && taskCtrl.taskData.reference !== 'refernceOnly') {
                if (taskCtrl.selectFieldType == 'given') {
                    if (taskCtrl.requestedEntities && taskCtrl.taskData.entity_exclusion_list == taskCtrl.requestedEntities.entities_list) {
                        taskCtrl.errorList = true;
                        taskCtrl.step = 2;
                        taskCtrl.createTaskInProgress = false;
                        return;
                    }
                    taskCtrl.taskData.selection_method = 'L';
                    taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.entities_list;
                } else if (taskCtrl.selectFieldType == 'random') {
                    taskCtrl.taskData.selection_method = 'R';
                    taskCtrl.taskData.selection_param_value = null;
                } else if (taskCtrl.selectFieldType == 'synthetic') {
                    taskCtrl.taskData.selection_method = 'S';
                    taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.synthetic;
                } else {
                    if (!taskCtrl.requestedEntities.query_parameters || taskCtrl.requestedEntities.query_parameters == '()') {
                        taskCtrl.parametersError = true;
                        taskCtrl.step = 2;
                        return;
                    }
                    if (taskCtrl.parametersRandom == true) {
                        taskCtrl.taskData.selection_method = 'PR';
                    } else {
                        taskCtrl.taskData.selection_method = 'P';
                    }
                    taskCtrl.taskData.selection_param_value = taskCtrl.requestedEntities.query_parameters;
                    taskCtrl.taskData.parameters = taskCtrl.requestedEntities.parameters;
                }
            }

            if (taskCtrl.selectSchedule == 'immediate') {
                taskCtrl.taskData.scheduler = taskCtrl.selectSchedule;
            } else {
                taskCtrl.taskData.scheduler = taskCtrl.scheduleData;
                if (taskCtrl.scheduleEndBy !== "endBy") {
                    taskCtrl.taskData.scheduling_end_date = null;
                }
            }

            if (taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.taskData.version_ind) {
                taskCtrl.taskData.operationMode = 'delete_and_load_entity';
            }

            if (taskCtrl.taskData.operationMode == 'delete_and_load_entity') {
                taskCtrl.taskData.load_entity = true;
                taskCtrl.taskData.delete_before_load = true;
            } else if (taskCtrl.taskData.operationMode == 'insert_entity_without_delete') {
                taskCtrl.taskData.load_entity = true;
                taskCtrl.taskData.delete_before_load = false;
            } else if (taskCtrl.taskData.operationMode == 'delete_without_load_entity') {
                taskCtrl.taskData.load_entity = false;
                taskCtrl.taskData.delete_before_load = true;
            } else {
                taskCtrl.taskData.load_entity = true;
                taskCtrl.taskData.delete_before_load = false;
            }


            if (taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.taskData.version_ind && taskCtrl.taskData.reference !== "refernceOnly") {
                if (!taskCtrl.selectedVersionToLoad) {
                    taskCtrl.step = 2;
                    taskCtrl.createTaskInProgress = false;
                    return;
                } else {
                    var selectedVersionToLoad = _.find(taskCtrl.versionsForLoad, {fabric_execution_id: taskCtrl.selectedVersionToLoad});
                    if (selectedVersionToLoad) {
                        taskCtrl.taskData.selected_version_task_name = selectedVersionToLoad.version_name;
                        var version_datetime = new Date(selectedVersionToLoad.version_datetime);
                        var localTimeZone = version_datetime.getTimezoneOffset();
                        version_datetime = version_datetime.getTime() + localTimeZone * 60000;
                        taskCtrl.taskData.selected_version_datetime = moment(version_datetime - taskCtrl.timeZoneOffset * 60000).format("YYYYMMDDHHmmss");
                        taskCtrl.taskData.selected_version_task_exe_id = selectedVersionToLoad.task_execution_id;
                    } else {
                        taskCtrl.step = 2;
                        taskCtrl.createTaskInProgress = false;
                        return;
                    }
                }
            }

            if (taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.taskData.version_ind &&
                (taskCtrl.taskData.reference == "refernceOnly" || taskCtrl.taskData.reference == "both")) {
                if (!taskCtrl.taskData.refLoadVersions) {
                    taskCtrl.step = 6;
                    taskCtrl.createTaskInProgress = false;
                    return;
                } else {
                    var selectedVersionToLoad = _.find(taskCtrl.taskData.refLoadVersions, {task_execution_id: parseInt(taskCtrl.taskData.selectedRefVersionToLoad)});
                    if (selectedVersionToLoad) {
                        taskCtrl.taskData.selected_ref_version_task_name = selectedVersionToLoad.version_name;
                        var version_datetime = new Date(selectedVersionToLoad.version_datetime);
                        var localTimeZone = version_datetime.getTimezoneOffset();
                        version_datetime = version_datetime.getTime() + localTimeZone * 60000;
                        taskCtrl.taskData.selected_ref_version_datetime = moment(version_datetime - taskCtrl.timeZoneOffset * 60000).format("YYYYMMDDHHmmss");
                        taskCtrl.taskData.selected_ref_version_task_exe_id = selectedVersionToLoad.task_execution_id;
                    }
                }
            }

            if (!taskCtrl.taskData.request_of_fresh_data) {
                taskCtrl.taskData.sync_mode = null;
            }

            if (taskCtrl.taskData.task_type === 'EXTRACT') {
                taskCtrl.taskData.load_entity = false;
                taskCtrl.taskData.environment_id = taskCtrl.taskData.source_environment_id;
                if (!taskCtrl.taskData.version_ind && taskCtrl.taskData.request_of_fresh_data) {
                    taskCtrl.taskData.sync_mode = 'FORCE';
                }
                else {
                    delete taskCtrl.taskData.sync_mode;
                }
            }

            if (!(taskCtrl.taskData.task_type === 'EXTRACT' && taskCtrl.taskData.version_ind) && !taskCtrl.taskData.retention_period_value) {
                delete taskCtrl.taskData.retention_period_type;
                delete taskCtrl.taskData.retention_period_value;
            }

            // if (!(taskCtrl.taskData.task_type == 'LOAD' && !taskCtrl.taskData.version_ind)) {
            //     taskCtrl.logicalUnits = taskCtrl.logicalUnit;
            // }

            if (taskCtrl.taskData.selectAllEntites) {
                taskCtrl.taskData.selection_param_value = null;
            }


            if (!taskCtrl.taskData.selectAllEntites && !(taskCtrl.taskData.task_type === 'LOAD' && !taskCtrl.taskData.version_ind)
                && taskCtrl.taskData.reference !== 'refernceOnly') {
                taskCtrl.taskData.number_of_entities_to_copy = taskCtrl.requestedEntities.entities_list.split(",").length;
            }

            if (taskCtrl.taskData.globals && taskCtrl.taskData.globals.length == 0) {
                taskCtrl.taskData.task_globals = false;
            }
            if (!taskCtrl.taskData.reference) {
                taskCtrl.taskData.refList = [];
            }

            if (taskCtrl.taskData.refList && taskCtrl.taskData.refList.length > 0) {
                taskCtrl.taskData.refresh_reference_data = false;
            }
            if (taskCtrl.copyTask) {
                taskCtrl.taskData.copy = true;
            }

            if (!taskCtrl.taskData.version_ind){
                taskCtrl.taskData.selected_version_task_name = null;
                taskCtrl.taskData.selected_version_datetime = null;
                taskCtrl.taskData.selected_version_task_exe_id = null;
                taskCtrl.taskData.selected_ref_version_task_name = null;
                taskCtrl.taskData.selected_ref_version_datetime = null;
                taskCtrl.taskData.selected_ref_version_task_exe_id = null;
            }

            TDMService.updateTask(taskCtrl.taskData).then(function (response) {
                taskCtrl.taskData.copy = false;
                if (response.errorCode == "SUCCESS") {
                    TDMService.postTaskLogicalUnits(response.result.id, taskCtrl.taskData.task_title, {logicalUnits: taskCtrl.logicalUnits}).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Task # " + taskCtrl.taskData.task_title, " Is Updated Successfully");
                            $timeout(function () {
                                $state.go('tasks', {}, {reload: true})
                            }, 300);
                        } else {
                            toastr.error("Task # " + taskCtrl.taskData.task_id, " Failed to Update : " + response.message);
                        }
                    });
                    if (taskCtrl.postExecutionProcesses.length > 0) {
                        TDMService.postTaskPostExecutionProcess(
                            response.result.id, 
                            taskCtrl.taskData.task_title, 
                            {postexecutionprocesses :_.filter(taskCtrl.allPostExecutionProcess, v => taskCtrl.postExecutionProcesses.indexOf(v.process_id) >= 0)}).then(function (response) {
                            if (response.errorCode !== "SUCCESS") {
                                toastr.error("Task # " + createTaskResult.id, " Failed to Update Post Execution Processes: " + response.message);
                            }
                        });
                        
                    }
                } else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, " Failed to Update : " + response.message);
                }
            });
        };

        taskCtrl.deleteTask = function () {
            TDMService.deleteTask(taskCtrl.taskData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    toastr.success("Task # " + taskCtrl.taskData.task_id, "deleted Successfully");
                    $timeout(function () {
                        $scope.content.openTasks(true);
                    }, 400)
                } else {
                    toastr.error("Task # " + taskCtrl.taskData.task_id, "failed to delete");
                }
            });
        };

        function buildSubQuery(rule) {
            var field = "\"" + rule.field + "\"";
            let condition = rule.condition;
            var data = "'" + rule.data + "'";
            if (rule.type == "number") {
                field = field + "::numeric[] ";
                data = rule.data;
            }
            if (rule.condition === 'Is null' || rule.condition === 'Is not null') {
                return "( " + field + " " + condition + " )";
            } else {
                return "( " + data + " " + condition + " ANY(" + field + ") )";
            }
        }

        function computed(group) {
            if (!group) return "";
            for (var str = "(", i = 0; i < group.rules.length; i++) {
                if (group.rules[i].group) {
                    if (i == group.rules.length - 1) {
                        str += computed(group.rules[i].group);
                    } else {
                        str += computed(group.rules[i].group) + " " + group.rules[i].group.operator + " ";
                    }
                } else {
                    var data;
                    if (group.rules[i].data === undefined
                        && group.rules[i].condition != "Is null"
                        && group.rules[i].condition != "Is not null") {
                        return;
                    }
                    if (group.rules[i].type == 'real') {
                        if (group.rules[i].data.toLocaleString().indexOf('.') <= 0) {
                            data = group.rules[i].data.toFixed(1);
                        } else {
                            data = group.rules[i].data;
                        }
                    } else if (group.rules[i].type == 'integer') {
                        data = Math.floor(group.rules[i].data);
                    } else if (group.rules[i].type == 'combo') {
                        if (group.rules[i].validValues.indexOf(group.rules[i].data) < 0
                            && group.rules[i].condition != "Is null"
                            && group.rules[i].condition != "Is not null") {
                            return;
                        }
                        data = group.rules[i].data;
                    } else {
                        data = group.rules[i].data;
                    }
                    if (data == undefined) {
                        data = '';
                    }
                    if (i == group.rules.length - 1) {
                        str += buildSubQuery(group.rules[i]);
                    } else {
                        str += buildSubQuery(group.rules[i]);
                        str += " " + group.rules[i].operator + " ";
                    }
                }
            }
            return str + ")";
        }

        taskCtrl.parametersCount = 0;
        $scope.getEntitesCount = function () {
            if (taskCtrl.requestedEntities.query_parameters == "()") {
                taskCtrl.parametersCount = 0;
                return;
            }
            if (!taskCtrl.requestedEntities.query_parameters) {
                taskCtrl.parametersCount = 0;
                return;
            }
            taskCtrl.parametersError = false;
            var data = {
                query: taskCtrl.requestedEntities.query_parameters,
                envId: taskCtrl.taskData.environment_id,
                beId: taskCtrl.taskData.be_id
            };
            if (taskCtrl.taskData.source_env_name) {
                taskCtrl.parametersCount = "inprogress";
                TDMService.postGenericAPI('businessentity/' + taskCtrl.taskData.be_id + '/sourceEnv/' + taskCtrl.taskData.source_env_name + '/analysiscount', {where: taskCtrl.requestedEntities.query_parameters}).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        taskCtrl.parametersCount = response.result;
                    } else {
                        taskCtrl.parametersCount = 0;
                    }
                });
            }
        }
        $scope.$watch('taskCtrl.filter', function (newValue) {
            if (taskCtrl.analysisCountTimeout) {
                $timeout.cancel(taskCtrl.analysisCountTimeout);
            }
            taskCtrl.analysisCountTimeout = $timeout(function () {
                if (taskCtrl.taskData.be_id) {
                    var checkRule = function (rule) {
                        if (rule.group) {
                            return checkGroup(rule.group);
                        } else {
                            if (rule.condition === "" || rule.data === "" || rule.field === "") {
                                return false;
                            }
                            return true;
                        }
                    };
                    var checkGroup = function (group) {
                        if (group.operator == "") {
                            return false;
                        }
                        for (var i = 0; i < group.rules.length; i++) {
                            if (checkRule(group.rules[i]) == false) {
                                return false;
                            }
                        }
                        return true;
                    };
                    if (newValue && checkGroup(newValue.group) == true) {
                        taskCtrl.requestedEntities.parameters = JSON.stringify(newValue);
                        var query = {
                            query: computed(newValue.group)
                        };
                        taskCtrl.requestedEntities.query_parameters = query.query;
                    }
                }
            }, 500);
        }, true);

        taskCtrl.checkMigrateStatus = function () {
            if (!taskCtrl.requestedEntities.entities_list || !taskCtrl.selectedVersionToLoad) {
                taskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                $scope.requestedEntitiesForm.submitted = true;
                return;
            }
            var selectedVersionToLoad = _.find(taskCtrl.versionsForLoad, {fabric_execution_id: taskCtrl.selectedVersionToLoad});
            var taskExecutionId = "";
            var luNames = "";
            if (selectedVersionToLoad) {
                taskExecutionId = selectedVersionToLoad.task_execution_id;
                luNames = selectedVersionToLoad.lu_name;
            }
            var version_datetime = new Date(selectedVersionToLoad.version_datetime);
            var localTimeZone = version_datetime.getTimezoneOffset();
            version_datetime = version_datetime.getTime() + localTimeZone * 60000;
            TDMService.postGenericAPI('checkMigrateStatusForEntitiesList', {
                entitlesList: taskCtrl.requestedEntities.entities_list,
                taskExecutionId: taskExecutionId,
                luList: luNames,
            }).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    var failedEntities = [];
                    for (var key in response.result) {
                        if (response.result[key] == "false") {
                            failedEntities.push(key);
                        }
                    }
                    if (failedEntities.length > 0) {
                        toastr.error("Entities " + failedEntities + " were not migrated successfully into the TDM storage by the selected version. Please remove them from the Entities List or select another version ");
                    } else {
                        taskCtrl.requestedEntitiesNext($scope.requestedEntitiesForm, true);
                    }
                } else {
                    toastr.error("Failed to check Migrate Status For Entites List");
                }
            });
        }

        taskCtrl.getStepsArray = function () {
            var stepsArray = [];
            stepsArray.push(1);
            if (taskCtrl.taskData.reference != null) {
                stepsArray.push(6);
            }
            if (!(taskCtrl.taskData.task_type == 'EXTRACT' && taskCtrl.taskData.selectAllEntites) && taskCtrl.taskData.reference !== 'refernceOnly') {
                stepsArray.push(2);
            }
            if (taskCtrl.taskData.task_globals) {
                stepsArray.push(5);
            }
            if (((taskCtrl.taskData.task_type == 'LOAD' && !taskCtrl.taskData.version_ind) ||
                (taskCtrl.taskData.task_type == 'EXTRACT' && !taskCtrl.taskData.version_ind 
                    && ((taskCtrl.sourceUserRole && taskCtrl.sourceUserRole.allowed_request_of_fresh_data) 
                    || (taskCtrl.userRole && taskCtrl.userRole.allowed_request_of_fresh_data)))) &&
                taskCtrl.taskData.reference !== 'refernceOnly') {
                stepsArray.push(3);
            }
            stepsArray.push(4);
            return stepsArray;
        }

        taskCtrl.openStep = function (step, type) {
            if (!(taskCtrl.userRoleType == 'admin' || taskCtrl.sourceEnvOwner && taskCtrl.targetEnvOwner)) {
                taskCtrl.taskData.selectAllEntites = false;
            }
            if (taskCtrl.step == 2 && taskCtrl.taskData.task_type == 'LOAD'
                && taskCtrl.taskData.version_ind && !taskCtrl.taskData.selectAllEntites) {
                if (type == 'back' && taskCtrl.taskData.reference != null) {
                    return taskCtrl.step = 6;
                }
                if (step == 1) {
                    return taskCtrl.step = 1;
                }
                taskCtrl.checkMigrateStatus();
                return;
            }
            var arraySteps = taskCtrl.getStepsArray();
            var nextStep = step;
            var currentIndex = arraySteps.indexOf(taskCtrl.step);
            var nextIndex = arraySteps.indexOf(step);
            if (nextIndex < currentIndex && nextIndex >= 0) {
                nextStep = arraySteps[nextIndex];
                taskCtrl.step = nextStep;
                return;
            }
            if (type == 'next') {
                if (currentIndex == arraySteps.length - 1) {
                    console.log("there is no next")
                    return;
                }
                nextStep = arraySteps[currentIndex + 1];
            } else if (type == 'back') {
                if (currentIndex == 0) {
                    console.log("there is no back")
                    return;
                }
                nextStep = arraySteps[currentIndex - 1];
                taskCtrl.step = nextStep;
                return;
            }
            // if (taskCtrl.step == 5){
            //     return taskCtrl.step = step;
            // }
            // if (step < taskCtrl.step || taskCtrl.disableChange == true) {
            //     if (taskCtrl.taskData.task_type == 'LOAD' && !taskCtrl.taskData.version_ind){
            //         return taskCtrl.step = step;
            //     }
            //     else if (taskCtrl.taskData.task_type == 'EXTRACT'){
            //         if (taskCtrl.taskData.selectAllEntites || taskCtrl.taskData.reference == 'refernceOnly'){
            //             return taskCtrl.step = 1;
            //         }
            //     }
            //     if (taskCtrl.step == 4){
            //         if (taskCtrl.taskData.task_globals){
            //             return taskCtrl.step = 5;
            //         }
            //         return taskCtrl.step = 2;
            //     }
            //     else{
            //         return taskCtrl.step = 1;
            //     }
            // }
            if (taskCtrl.step == 1) {
                if (!$scope.generalForm.$valid){
                    taskCtrl.generalForm = $scope.generalForm;
                    $scope.generalForm.submitted = true;
                    return;
                }
                taskCtrl.generalNext($scope.generalForm,nextStep);
                return;
            } else if (taskCtrl.step == 2) {
                if (!$scope.requestedEntitiesForm.$valid){
                    taskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                    $scope.requestedEntitiesForm.submitted = true;
                    return;
                }
                taskCtrl.requestedEntitiesNext($scope.requestedEntitiesForm, false, nextStep);
                $scope.requestedEntitiesForm.submitted = true;
                return;
            } else if (taskCtrl.step == 3 && !$scope.requestParametersForm.$valid) {
                taskCtrl.requestParametersForm = $scope.requestParametersForm;
                $scope.requestParametersForm.submitted = true;
                return;
            } else if (taskCtrl.step == 4 && !$scope.executionTimingForm.$valid) {
                taskCtrl.executionTimingForm = $scope.executionTimingForm;
                $scope.executionTimingForm.submitted = true;
                return;
            } else if (taskCtrl.step == 6) {
                taskCtrl.referenceNext(nextStep);
                return;
            } else if (taskCtrl.step == 5) {
                taskCtrl.globalsNext(nextStep);
                return;
            }
            taskCtrl.step = nextStep;

            if (taskCtrl.step == 1) {
                $scope.generalForm.submitted = true;
            } else if (taskCtrl.step == 2) {
                $scope.getEntitesCount();
                taskCtrl.updateParams(() => {
                    console.log('parameters loaded');
                });
                $scope.requestedEntitiesForm.submitted = true;
            } else if (taskCtrl.step == 3) {
                $scope.requestParametersForm.submitted = true;
            } else if (taskCtrl.step == 4) {
                $scope.executionTimingForm.submitted = true;
            }
        };

        taskCtrl.generalNext = function (form, nextStep) {
            // gap can happen in at least 2 LUs
            if (taskCtrl.isFluxMode) {
                $scope.generalForm.taskLogicalUnit.$setValidity('gap', true);
                $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', true);

                /**
                 * Checks if the given logical unit name has been selected
                 * @param lu_name
                 * @returns {*}
                 */
                let isSelectedLU = (lu_name) => {
                    return _.find(taskCtrl.logicalUnits, {lu_name: lu_name})
                };

                let checkGap = lu => {
                    if (lu.lu_parent_name && !isSelectedLU(lu.lu_parent_name)) {
                        /**
                         * If a logical unit has a parent and it has not being selected
                         * then this is the only chance that we might have a gap.
                         * The gap will occur if the lu parent name that is missing
                         * has a parent which is not missing. This will generate a gap.
                         */

                        const luParent = _.find(taskCtrl.allLogicalUnits, {lu_name: lu.lu_parent_name});
                        if (luParent) {
                            if (luParent.lu_parent_name && isSelectedLU(luParent.lu_parent_name)) {
                                $scope.generalForm.taskLogicalUnit.$setValidity('gap', false);
                                taskCtrl.missingUnitInGap = luParent.lu_name;
                            }
                        }
                    }
                };

                let checkIfRootIsMissing = () => {
                    $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', true);
                    taskCtrl.missingRootLU = [];

                    // check if there is lu which has a parent that does not have a parent (root)
                    for (lu of taskCtrl.logicalUnits) {
                        if (lu.lu_parent_name) {
                            const luParent = _.find(taskCtrl.allLogicalUnits, {lu_name: lu.lu_parent_name});
                            if (luParent) {
                                // if lu has a parent that does not have a parent which is missing then root is missing
                                if (!luParent.lu_parent_name && !isSelectedLU(luParent.lu_name)) {
                                    $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', false);
                                    taskCtrl.missingRootLU .push(luParent.lu_name);
                                }
                            }
                        }
                    }
                };
                if (taskCtrl.logicalUnits && taskCtrl.logicalUnits.length > 0){
                    taskCtrl.logicalUnits.forEach(lu => {
                        if (taskCtrl.taskData.reference !== 'refernceOnly'){
                            checkGap(lu);
                            checkIfRootIsMissing(lu);
                        }
                    })
                }

            }


            if (form.$valid || taskCtrl.disableChange == true) {
                let cb = () => {
                    taskCtrl.step = nextStep || 2;
                    if (!(taskCtrl.userRoleType == 'admin' || taskCtrl.sourceEnvOwner && taskCtrl.targetEnvOwner)) {
                        taskCtrl.taskData.selectAllEntites = false;
                    }
                    var sourceEnv = _.find(taskCtrl.allSourceEnvironments, {environment_id: taskCtrl.taskData.source_environment_id});
                    if (sourceEnv) {
                        taskCtrl.taskData.source_env_name = sourceEnv.fabric_environment_name;
                    }
                    if (taskCtrl.taskData.selectAllEntites) {
                        taskCtrl.requestedEntities.entities_list = undefined;
                        if (taskCtrl.taskData.task_type == "EXTRACT") {
                            if (taskCtrl.taskData.version_ind || !taskCtrl.taskData.version_ind && (
                                (!taskCtrl.userRole ||!taskCtrl.userRole.allowed_request_of_fresh_data) &&
                                (!taskCtrl.sourceUserRole || !taskCtrl.sourceUserRole.allowed_request_of_fresh_data)
                                )){
                                    taskCtrl.step = nextStep || 4;
                            }
                            else {
                                taskCtrl.step = nextStep || 3;
                            }
                        }
                    }
                    if (taskCtrl.taskData.reference != null) {
                        taskCtrl.step = nextStep || 6;
                    }
                };
                if (taskCtrl.taskData.task_type === 'LOAD') {
                    taskCtrl.updateParams(cb);
                }
                else{
                    cb.apply();
                }
            } else {
                form.submitted = true;
            }
            taskCtrl.generalForm = form;
        };

        
        taskCtrl.submitForm=function(step,nextStep){
            const steps = taskCtrl.getStepsArray();
            if (step === nextStep){
                return;
            }
            if (steps.indexOf(step) > steps.indexOf(nextStep)){
                taskCtrl.openStep(nextStep);
                return;
            }
            switch(step){
                case 1:
                    $scope.generalForm.$setSubmitted();
                    taskCtrl.generalNext($scope.generalForm,nextStep);
                break;
                case 2:
                    $scope.requestedEntitiesForm.$setSubmitted();
                    taskCtrl.requestedEntitiesNext($scope.requestedEntitiesForm, undefined, nextStep);
                break;
                case 3:
                    $scope.requestParametersForm.$setSubmitted();
                    taskCtrl.requestParametersNext($scope.requestParametersForm);
                break;
                case 4:
                    $scope.executionTimingForm.$setSubmitted();
                    taskCtrl.executionTimingFinish($scope.executionTimingForm)
                break;
                case 5:
                    $scope.AddGlobalForm.$setSubmitted();
                    taskCtrl.globalsNext(nextStep)
                break;
                case 6:
                    $scope.ReferenceForm.$setSubmitted();
                    taskCtrl.referenceNext(nextStep)
                break;
            }
        }

        taskCtrl.referenceNext = function (nextStep) {
            if (_.filter(taskCtrl.taskData.refList, {selected: true}).length == 0) {
                taskCtrl.referenceTabError = 'Please Select Reference Table';
                return;
            }
            taskCtrl.referenceTabError = '';
            if (taskCtrl.taskData.reference !== 'refernceOnly') {
                if (taskCtrl.taskData.task_type == "EXTRACT" && taskCtrl.taskData.selectAllEntites) {
                    return taskCtrl.step = nextStep || 4;
                }
                return taskCtrl.step = nextStep || 2;
            } else if (taskCtrl.taskData.task_globals) {
                taskCtrl.step = nextStep || 5;
            } else {
                taskCtrl.step = nextStep || 4;
            }
        }

        taskCtrl.requestedEntitiesNext = function (form, migrated, nextStep) {
            if (taskCtrl.taskData.task_type === 'LOAD'
                && taskCtrl.taskData.version_ind && !taskCtrl.taskData.selectAllEntites && !migrated) {
                taskCtrl.checkMigrateStatus();
                return;
            }

            if (taskCtrl.isFluxMode &&
                taskCtrl.taskData.task_type === 'LOAD' && !taskCtrl.taskData.version_ind &&
                (taskCtrl.selectFieldType === 'synthetic' || taskCtrl.selectFieldType === 'parameters')
            ) {

                $scope.LUsMissingParent = [];

                for (lu of taskCtrl.logicalUnits) {
                    if (lu.lu_parent_name && !_.find(taskCtrl.logicalUnits, {lu_name: lu.lu_parent_name})) {
                        $scope.LUsMissingParent.push(lu.lu_name);
                    }
                }
                $scope.requestedEntitiesForm.$setValidity('missingParent', true);

                if ($scope.LUsMissingParent.length > 0) {
                    $scope.requestedEntitiesForm.$setValidity('missingParent', false);
                    return;
                }
            }

            if (taskCtrl.selectFieldType === 'given' && taskCtrl.requestedEntities && typeof taskCtrl.requestedEntities.entities_list === 'string'
                && taskCtrl.taskData.entity_exclusion_list == taskCtrl.requestedEntities.entities_list) {
                taskCtrl.errorList = true;
                if (!form.$valid) {
                    form.submitted = true;
                    taskCtrl.requestedEntitiesForm = form;
                }
                return;
            }

            taskCtrl.enititesListNotPassedExclusionList = false;
            taskCtrl.enititesListFailedPatternTest = false;

            if (taskCtrl.taskData.task_type === "LOAD" && !taskCtrl.taskData.version_ind &&
                taskCtrl.requestedEntities.entities_list && typeof taskCtrl.taskData.entity_exclusion_list === 'string'
                && taskCtrl.requestedEntities.entities_list.length > 0) {
                taskCtrl.taskData.entity_exclusion_list = taskCtrl.taskData.entity_exclusion_list.replace(/\s/g, ''); //remove spaces
                taskCtrl.taskData.entity_exclusion_list = taskCtrl.taskData.entity_exclusion_list.replace(/\r?\n|\r/g, ''); //remove new lines
                if (!taskCtrl.entitiesPattern.test(taskCtrl.taskData.entity_exclusion_list)) {
                    taskCtrl.enititesExclusionListPatternTest = true;
                }

            }


            //check if the current "entities List" includes anything from the exclusion list we defined before.
            if (taskCtrl.selectFieldType == 'given' && typeof taskCtrl.requestedEntities.entities_list === 'string' && taskCtrl.requestedEntities.entities_list.length > 0) {
                taskCtrl.requestedEntities.entities_list = taskCtrl.requestedEntities.entities_list.replace(/\s/g, ''); //remove spaces
                taskCtrl.requestedEntities.entities_list = taskCtrl.requestedEntities.entities_list.replace(/\r?\n|\r/g, ''); //remove new lines
                var entitiesPattern = taskCtrl.entitiesPattern;
                if (!(taskCtrl.taskData.task_type == "LOAD" && !taskCtrl.taskData.version_ind)) {
                    entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0," + ((taskCtrl.maxToCopy || 1000000000) - 1) + "})?$")
                }
                if (entitiesPattern.test(taskCtrl.requestedEntities.entities_list)) {
                    if (taskCtrl.taskData.task_type == "LOAD" && !taskCtrl.taskData.version_ind) {
                        //validate against exclusion list. As we are using same exclusion list validation method, we prepare object for validation that contains the names that the BackEnd Expects.
                        var dataForValidation = {};
                        dataForValidation.exclusion_list = taskCtrl.requestedEntities.entities_list;
                        dataForValidation.be_id = taskCtrl.taskData.be_id;

                        TDMService.postEnvExclusionListValidateList(taskCtrl.taskData.environment_id, dataForValidation).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                if (response.result.length > 0) {
                                    taskCtrl.enititesListNotPassedExclusionList = true;
                                    taskCtrl.existingEntitiesInExclusionListMembers = [];
                                    for (var i = 0; i < response.result.length; i++) {
                                        taskCtrl.existingEntitiesInExclusionListMembers.push(response.result[i].unnest);
                                    }
                                    return;
                                } else {//No exclusions found, continue to step 3.
                                    taskCtrl.errorList = false;
                                    if (form.$valid || taskCtrl.disableChange == true) {
                                        if (taskCtrl.taskData.task_globals) {
                                            taskCtrl.step = nextStep || 5;
                                        } else {
                                            taskCtrl.step = nextStep || 3;
                                        }
                                    } else {
                                        form.submitted = true;
                                    }
                                    taskCtrl.requestedEntitiesForm = form;
                                }
                            } else {
                                toastr.error("Unable to execute validation against Exclusion List" + response.message);
                            }
                        });
                    } else {
                        taskCtrl.errorList = false;
                        if (form.$valid || taskCtrl.disableChange == true) {
                            if (taskCtrl.taskData.task_globals) {
                                taskCtrl.step = nextStep || 5;
                            }  else if ((taskCtrl.taskData.task_type == "EXTRACT" ||
                                taskCtrl.taskData.task_type == "LOAD") && taskCtrl.taskData.version_ind) {
                                taskCtrl.step = nextStep || 4;
                            }  else if (taskCtrl.taskData.task_type == "EXTRACT" && 
                                        !taskCtrl.taskData.version_ind && (
                                            (!taskCtrl.userRole ||!taskCtrl.userRole.allowed_request_of_fresh_data) &&
                                            (!taskCtrl.sourceUserRole || !taskCtrl.sourceUserRole.allowed_request_of_fresh_data )
                                    )) {
                                taskCtrl.step = nextStep || 4;
                            } else {
                                taskCtrl.step = nextStep || 3;
                            }
                        } else {
                            form.submitted = true;
                        }
                        taskCtrl.requestedEntitiesForm = form;
                    }
                } else { //pattern validation didn't pass
                    taskCtrl.enititesListFailedPatternTest = true;
                }
            } else if (taskCtrl.selectFieldType == 'synthetic' && taskCtrl.requestedEntities.synthetic) {
                var dataForValidation = {};
                dataForValidation.exclusion_list = taskCtrl.requestedEntities.synthetic;
                dataForValidation.be_id = taskCtrl.taskData.be_id;
                TDMService.postEnvExclusionListValidateList(taskCtrl.taskData.environment_id, dataForValidation).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        if (response.result.length > 0) {
                            taskCtrl.enititesListNotPassedExclusionList = true;
                            taskCtrl.existingEntitiesInExclusionListMembers = [];
                            for (var i = 0; i < response.result.length; i++) {
                                taskCtrl.existingEntitiesInExclusionListMembers.push(response.result[i].unnest);
                            }
                            return;
                        } else {//No exclusions found, continue to step 3.
                            taskCtrl.errorList = false;
                            if (form.$valid || taskCtrl.disableChange == true) {
                                if (taskCtrl.taskData.task_globals) {
                                    taskCtrl.step = nextStep || 5;
                                } else {
                                    taskCtrl.step = nextStep || 3;
                                }
                            } else {
                                form.submitted = true;
                            }
                            taskCtrl.requestedEntitiesForm = form;
                        }
                    } else {
                        toastr.error("Unable to execute validation against Exclusion List" + response.message);
                    }
                });
            } else {//continue to step 3.
                taskCtrl.errorList = false;
                if (form.$valid || taskCtrl.disableChange == true) {
                    if (taskCtrl.taskData.task_globals) {
                        taskCtrl.step = nextStep || 5;
                    } else if ((taskCtrl.taskData.task_type == "EXTRACT" ||
                        taskCtrl.taskData.task_type == "LOAD") && taskCtrl.taskData.version_ind) {
                        taskCtrl.step = nextStep || 4;
                    }  else if (taskCtrl.taskData.task_type == "EXTRACT" && 
                                !taskCtrl.taskData.version_ind && (
                                    (!taskCtrl.userRole ||!taskCtrl.userRole.allowed_request_of_fresh_data) &&
                                    (!taskCtrl.sourceUserRole || !taskCtrl.sourceUserRole.allowed_request_of_fresh_data )
                            )) {
                        taskCtrl.step = nextStep || 4;
                    } else {
                        taskCtrl.step = nextStep || 3;
                    }
                } else {
                    form.submitted = true;
                }
                taskCtrl.requestedEntitiesForm = form;
            }

            
        };

        taskCtrl.globalsNext = function (nextStep) {
            if (taskCtrl.taskData.task_type == 'LOAD' && taskCtrl.taskData.version_ind || taskCtrl.taskData.task_type == 'EXTRACT') {
                taskCtrl.step = nextStep || 4;
            } else {
                taskCtrl.step = nextStep || 3;
            }
        };

        
        taskCtrl.initReferenceForm = (ReferenceForm) => {
            $scope.ReferenceForm = ReferenceForm;
        }
        taskCtrl.requestParametersNext = function (form) {
            if (form.$valid || taskCtrl.disableChange == true) {
                taskCtrl.step = 4;
            } else {
                form.submitted = true;
            }
            taskCtrl.requestParametersForm = form;
        };

        taskCtrl.executionTimingFinish = function (form) {
            if (form.$valid || taskCtrl.disableChange == true) {
                if (!$scope.generalForm.$valid) {
                    taskCtrl.step = 1;
                    return;
                } else if (taskCtrl.taskData.reference && _.filter(taskCtrl.taskData.refList, {selected: true}).length == 0) {
                    taskCtrl.step = 6;
                    return;
                } else if (taskCtrl.taskData.reference !== 'refernceOnly' && !$scope.requestedEntitiesForm.$valid) {
                    taskCtrl.step = 2;
                    return;
                } else if (!$scope.requestParametersForm.$valid) {
                    taskCtrl.step = 3;
                    return;
                }
                taskCtrl.saveTask();
            } else {
                form.submitted = true;
            }
            taskCtrl.executionTimingForm = form;
        };

        taskCtrl.cronTabConfig = {
            allowMultiple: true
        };
        
        taskCtrl.toggleVersion = function(task_execution_id) {
            taskCtrl.versionsToggle[task_execution_id] = !taskCtrl.versionsToggle[task_execution_id];
            if (taskCtrl.dtInstanceVersions && taskCtrl.dtInstanceVersions.reloadData) {
                taskCtrl.dtInstanceVersions.reloadData(function () {

                });
            }
        }

        taskCtrl.versionsToggle = {};
        taskCtrl.versionsForLoad = [];
        taskCtrl.dtInstanceVersions = {};
        taskCtrl.dtColumnsVersions = [];
        taskCtrl.dtColumnDefsVersions = [];
        taskCtrl.headersVersions = [
            {
                column: 'collapse',
                name: '',
                clickAble: false
            },
            {
                column: 'actions',
                name: '',
                clickAble: false
            },
            {
                column: 'version_name',
                name: 'Version Name',
                clickAble: true
            },
            {
                column: 'task_id',
                name: 'Task Id',
                clickAble: false
            },
            {
                column: 'task_last_updated_by',
                name: 'Last Updated By',
                clickAble: false
            },
            {
                column: 'version_type',
                name: 'Version Type',
                clickAble: false
            },
            {
                column: 'version_datetime',
                name: 'Date Time',
                type: 'date',
                clickAble: false
            },
            {
                column: 'lu_name',
                name: 'Logical Unit Name',
                clickAble: false
            },
            {
                column: 'number_of_extracted_entities',
                name: 'Number of Extracted Entities',
                clickAble: false
            },
            {
                column: 'rootIndicator',
                name: 'Root LU',
                clickAble: false
            },
        ];

        var changeToLocalDate = function (data, type, full, meta) {
            return moment(data).format('DD MMM YYYY, HH:mm')
        };


        var renderSelectionColumn = function (data, type, full, meta) {
            if (full.isRoot) {
                return '<input icheck type="radio" ng-value="\'' + full.fabric_execution_id + '\'" name="versionsTableSelection" ng-model="taskCtrl.selectedVersionToLoad">';
            }
            return '';
        };
        var renderCollapseColumn = function (data, type, full, meta) {
            if (full.isRoot) {
                return '<a class="toggleVersions ' + (taskCtrl.versionsToggle[full.task_execution_id] ? 'active' : '')  + '" ng-click="taskCtrl.toggleVersion(' + full.task_execution_id + ')"><i class="fa arrow"></i> </a>';
            }
            return '';
        };

        for (var i = 0; i < taskCtrl.headersVersions.length; i++) {
            if (taskCtrl.headersVersions[i].column == 'actions') {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).renderWith(renderSelectionColumn).notSortable());
            } else if (taskCtrl.headersVersions[i].column == 'collapse') {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).renderWith(renderCollapseColumn).notSortable());
            } else if (taskCtrl.headersVersions[i].type == 'date') {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).renderWith(changeToLocalDate).notSortable());
            } else if (taskCtrl.headersVersions[i].column == 'task_id') {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).notSortable());
            } else if (taskCtrl.headersVersions[i].column == 'version_name') {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).notSortable());
            } else if (taskCtrl.headersVersions[i].column == 'rootIndicator' ) {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).notSortable().notVisible());
            
            }else {
                taskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(taskCtrl.headersVersions[i].column).withTitle(taskCtrl.headersVersions[i].name).notSortable());
            }
        }
        
        var getTableDataVersions = function () {
            var deferred = $q.defer();
            var versionsForLoad = [];   
            taskCtrl.groupedSelections = new Set();
            var rootLUs = _.filter(taskCtrl.logicalUnits,{lu_parent_name : null});
            taskCtrl.versionsForLoad.forEach(function(versionForLoad) {
                if (_.find(rootLUs,{lu_name: versionForLoad.lu_name})){
                    versionForLoad.rootIndicator = true;
                }
                else {
                    versionForLoad.rootIndicator = false;
                }
                if (versionForLoad.rootIndicator && _.findIndex(versionsForLoad,{task_execution_id : versionForLoad.task_execution_id,isRoot: true}) < 0) {
                    versionForLoad.isRoot = true;
                    versionForLoad.rootIndicator = true;
                    versionsForLoad.push(versionForLoad);
                    return;
                }
                if (taskCtrl.versionsToggle[versionForLoad.task_execution_id]) {
                    versionForLoad.isRoot = false;
                    versionsForLoad.push(versionForLoad);
                }
            }); 
            // var groupedVersions = _.groupBy(taskCtrl.versionsForLoad,'task_execution_id');
            // for (var key in groupedVersions){
            //     var rootVersionForLoad = _.find(groupedVersions[key],{root_indicator : 'YY'});
            //     if (rootVersionForLoad) {
            //         rootVersionForLoad.lu_names = [rootVersionForLoad.lu_name];
            //         versionsForLoad.push(rootVersionForLoad);
            //         rootVersionForLoad.extract_entities_per_lu = [rootVersionForLoad.number_of_extracted_entities];
            //         for(var i = 0;i < groupedVersions[key].length ; i++){
            //             var versionForLoad = groupedVersions[key][i];
            //             if (versionForLoad.root_indicator !== 'YY'){
            //                 rootVersionForLoad.lu_names.push(versionForLoad.lu_name);
            //                 rootVersionForLoad.extract_entities_per_lu.push(versionForLoad.number_of_extracted_entities);
            //             }
            //         }
            //         rootVersionForLoad.lu_names = rootVersionForLoad.lu_names.toString();
            //         rootVersionForLoad.extract_entities_per_lu = rootVersionForLoad.extract_entities_per_lu.toString();    
            //     }
            //     else {
            //         for (var i = 0;i < groupedVersions[key].length; i++) {
            //             var versionForLoadTemp = groupedVersions[key][i]; 
            //             versionForLoadTemp.lu_names = ([versionForLoadTemp.lu_name]).toString();
            //             versionForLoadTemp.extract_entities_per_lu = ([versionForLoadTemp.number_of_extracted_entities]).toString();
            //         }
            //         versionsForLoad = versionsForLoad.concat(groupedVersions[key]);
            //     }
            // }
            // if (taskCtrl.taskData.selected_version_task_exe_id) {
            //     var selectedVersion = _.find(versionsForLoad, {task_execution_id: taskCtrl.taskData.selected_version_task_exe_id});
            //     if (selectedVersion) {
            //         taskCtrl.selectedVersionToLoad = selectedVersion.fabric_execution_id;
            //     }                            
            // }
            if (!taskCtrl.selectedVersionToLoad && taskCtrl.taskData.selected_version_task_exe_id) {
                var selectedVersion = _.find(taskCtrl.versionsForLoad, {rootIndicator : true, task_execution_id: taskCtrl.taskData.selected_version_task_exe_id});
                if (selectedVersion) {
                    taskCtrl.selectedVersionToLoad = selectedVersion.fabric_execution_id;
                }                            
            }
            console.log(versionsForLoad);
            deferred.resolve(versionsForLoad);
            return deferred.promise;
        };

        taskCtrl.dtOptionsVersions = DTOptionsBuilder.fromFnPromise(function () {
            return getTableDataVersions();
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
            .withOption("order",  [[ 6, "desc" ],[9, "desc"]])
            .withOption('search', {
                "caseInsensitive": false
            });

        taskCtrl.dtOptionsVersions.withLightColumnFilter({
            2: {
                type: 'text'
            },
            3: {
                type: 'text'
            },
            4: {
                type: 'text'
            },
            5: {
                type: 'text'
            },
            6: {
                type: 'text'
            },
            7: {
                type: 'text'
            },
            8: {
                type: 'text'
            }
        });

        taskCtrl.getVersionsForLoad = function () {
            var entitiesPassed = true;
            if (taskCtrl.requestedEntities.entities_list && taskCtrl.maxToCopy) {
                var entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0," + ((taskCtrl.maxToCopy || 1000000000) - 1) + "})?$");
                entitiesPassed = entitiesPattern.test(taskCtrl.requestedEntities.entities_list);
                taskCtrl.enititesListFailedPatternTest = false;
            }
            if (taskCtrl.versionForLoadFrom && taskCtrl.versionForLoadTo &&
                taskCtrl.logicalUnits && taskCtrl.taskData.source_env_name
                && (taskCtrl.taskData.selectAllEntites ||
                    (taskCtrl.requestedEntities.entities_list && entitiesPassed))) {
                taskCtrl.loadingTableVersions = true;
                var from = new Date(taskCtrl.versionForLoadFrom);
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                var to = new Date(taskCtrl.versionForLoadTo);
                to.setHours(23);
                to.setMinutes(59);
                to.setSeconds(59);
                TDMService.postGenericAPI('tasks/versionsForLoad', {
                    fromDate: from,
                    toDate: to,
                    entitiesList: taskCtrl.taskData.selectAllEntites ? [] : taskCtrl.requestedEntities.entities_list,
                    lu_list: taskCtrl.logicalUnits,
                    source_env_name: taskCtrl.taskData.source_env_name,
                    be_id : taskCtrl.taskData.be_id,
                }).then(function (response) {
                    if (response.errorCode == "SUCCESS") {

                        let overrideRootIndicators = data => {
                            var executionIdsSet = new Set();

                            for (item of data) {
                                if (!executionIdsSet.has(item.task_execution_id) && item.root_indicator == 'Y') {
                                    item.root_indicator = 'YY';
                                    executionIdsSet.add(item.task_execution_id);
                                }
                            }
                        };

                        let makeRootLUsOnTopForEachExecution = data => {
                        };

                        // to make the selection icon on top of every execution group
                        makeRootLUsOnTopForEachExecution(response.result);
                        // in order to allow only one selection icon
                        overrideRootIndicators(response.result);
                        
                        taskCtrl.versionsForLoad = response.result;
                        taskCtrl.versionsForLoad = _.sortBy(taskCtrl.versionsForLoad, version =>  -1 * new Date(version.version_datetime));

                        $timeout(function () {
                            if (taskCtrl.dtInstanceVersions && taskCtrl.dtInstanceVersions.reloadData) {
                                taskCtrl.dtInstanceVersions.reloadData(function () {

                                });
                            }
                        }, 100);

                        taskCtrl.loadingTableVersions = false;

                    } else {
                        toastr.error("New Task # Failed to get Versions for Load");
                    }
                });
            } else if (!taskCtrl.requestedEntities.entities_list && !taskCtrl.taskData.selectAllEntites) {
                taskCtrl.versionsForLoad = [];
                if (taskCtrl.dtInstanceVersions && taskCtrl.dtInstanceVersions.reloadData) {
                    taskCtrl.dtInstanceVersions.reloadData(function () {

                    });
                }
            } else if (!entitiesPassed) {
                taskCtrl.enititesListFailedPatternTest = true;
            }
        };


        if (taskCtrl.taskData.task_type == 'EXTRACT' || taskCtrl.taskData.task_type == "LOAD" && taskCtrl.taskData.version_ind) {
            taskCtrl.taskModeChange(true);
        }

        taskCtrl.sourceEnvironmentChange(true, true);

        taskCtrl.requestParametersPrev = function () {
            if (taskCtrl.taskData.task_globals) {
                taskCtrl.step = 5;
            } else {
                taskCtrl.step = 2;
            }
        }

        BreadCrumbsService.push({task_id: taskCtrl.taskData.task_title}, 'TASK_BREADCRUMB', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'taskCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('taskDirective', taskDirective);
