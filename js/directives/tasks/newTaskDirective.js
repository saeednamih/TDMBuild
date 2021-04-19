function newTaskDirective() {

    var template = "views/tasks/newTask.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, $timeout,
                               AuthService, $state, DTOptionsBuilder, DTColumnBuilder, $q, $compile) {
        var newTaskCtrl = this;

        newTaskCtrl.schedulerOptions = {
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
        newTaskCtrl.tasks = $scope.content.tasks;
        newTaskCtrl.isFluxMode = AuthService.isFluxMode();
        newTaskCtrl.retentionPeriod = AuthService.getRetentionPeriod();

        newTaskCtrl.timeZoneOffset = AuthService.getTimeZone();

        _.remove(newTaskCtrl.retentionPeriod.availableOptions, function (period) {
            if (period.units > newTaskCtrl.retentionPeriod.maxRetentionPeriod) {
                return true;
            }
        });

        newTaskCtrl.referenceDropDown = [
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

        newTaskCtrl.step = 1;

        newTaskCtrl.taskData = {
            globals: [],
            reference: null
        };
        newTaskCtrl.versionForLoadTo = new Date();
        newTaskCtrl.versionForLoadFrom = new Date();
        newTaskCtrl.versionForLoadFrom.setDate(newTaskCtrl.versionForLoadFrom.getDate() - 30);

        if (newTaskCtrl.retentionPeriod && newTaskCtrl.retentionPeriod.defaultPeriod &&
            newTaskCtrl.retentionPeriod.defaultPeriod.unit) {
            var defaultRetintion = _.find(newTaskCtrl.retentionPeriod.availableOptions, {name: newTaskCtrl.retentionPeriod.defaultPeriod.unit});
            if (defaultRetintion) {
                newTaskCtrl.retention_period_type = defaultRetintion;
                newTaskCtrl.taskData.retention_period_type = newTaskCtrl.retention_period_type.name;
                newTaskCtrl.taskData.retention_period_value = newTaskCtrl.retentionPeriod.defaultPeriod.value;
            }
        }

        newTaskCtrl.retentionPeriodTypeChanged = function () {
            newTaskCtrl.taskData.retention_period_type = newTaskCtrl.retention_period_type.name;
        }

        newTaskCtrl.taskData.task_type = 'LOAD';

        newTaskCtrl.param = {};

        newTaskCtrl.requestedEntities = {};

        newTaskCtrl.selectFieldType = 'given';

        newTaskCtrl.taskTitlePattern = "^((?!_).)*$";

        newTaskCtrl.entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0,})?$");
        newTaskCtrl.excultionPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0,})?$");
        newTaskCtrl.syntheticPattern = "^[a-zA-Z0-9._-]+$";

        newTaskCtrl.updateEntitiesPattern = function () {
            if (newTaskCtrl.taskData.number_of_entities_to_copy) {
                newTaskCtrl.entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){" + (newTaskCtrl.taskData.number_of_entities_to_copy - 1) + "})?$")
            }
        };

        var userRole = AuthService.getRole();
        console.log(userRole.type);
        newTaskCtrl.userRoleType = userRole.type;
        TDMService.getTimeZone().then(function (response) {
            if (response.errorCode == "SUCCESS") {
                newTaskCtrl.timeZoneMessage = 'Task execution time will be based on ' + response.result.current_setting + ' time zone'
            } else {
                newTaskCtrl.timeZoneMessage = 'Task execution time will be based on DB time zone'
            }
        });

        if (userRole.type == 'admin') {
            TDMService.getEnvironments().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.allEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_write && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    newTaskCtrl.allSourceEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_read && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                } else {
                    toastr.error("Faild to get Environments for user " + AuthService.getUsername());
                }
            });
        } else {
            TDMService.getEnvironmentsForUser().then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.allEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_write && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    newTaskCtrl.allSourceEnvironments = _.filter(angular.copy(response.result), function (env) {
                        if (env.allow_read && env.environment_status === 'Active') {
                            return true;
                        }
                        return false;
                    });
                    newTaskCtrl.allSourceEnvironments = _.unique(newTaskCtrl.allSourceEnvironments, 'fabric_environment_name');
                } else {
                    toastr.error("Faild to get Target Environments for user " + AuthService.getUsername());
                }
            });
        }

        newTaskCtrl.entitiesListChange = function () {
            if (newTaskCtrl.entitiesListChangeTimeout) {
                $timeout.cancel(newTaskCtrl.entitiesListChangeTimeout);
            }
            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind && !newTaskCtrl.taskData.selectAllEntites) {
                newTaskCtrl.entitiesListChangeTimeout = $timeout(function () {
                    newTaskCtrl.getVersionsForLoad();
                }, 1000);
            }
        };

        newTaskCtrl.referenceChange = function () {
            if (newTaskCtrl.taskData.reference == 'refernceOnly') {
                newTaskCtrl.taskData.selectAllEntites = false;
            }
        };

        newTaskCtrl.taskModeChange = function (task_type) {

            let clearNumberOfEntitiesToCopy = () => {
                if (newTaskCtrl.taskData.version_ind) {
                    newTaskCtrl.taskData.number_of_entities_to_copy = undefined;
                }
            }

            clearNumberOfEntitiesToCopy();

            if (task_type) {
                newTaskCtrl.taskData.source_environment_id = null;
                newTaskCtrl.taskData.environment_id = null;
                newTaskCtrl.taskData.source_env_name = null;
                newTaskCtrl.maxToCopy = null;
            }
            if (newTaskCtrl.taskData.version_ind && newTaskCtrl.taskData.task_type == 'LOAD') {
                newTaskCtrl.getAllLogicalUnitsForEnv(newTaskCtrl.taskData.source_environment_id, newTaskCtrl.taskData.environment_id);
                newTaskCtrl.logicalUnits = [];
                newTaskCtrl.logicalUnit = null;
                newTaskCtrl.taskData.be_id = null;
            } else if (newTaskCtrl.taskData.task_type == 'EXTRACT') {
                newTaskCtrl.getAllLogicalUnitsForEnv(newTaskCtrl.taskData.source_environment_id, newTaskCtrl.taskData.source_environment_id);
                newTaskCtrl.logicalUnits = [];
                newTaskCtrl.logicalUnit = null;
                newTaskCtrl.taskData.be_id = null;
                if (task_type && !newTaskCtrl.taskData.version_ind) {
                    newTaskCtrl.taskData.retention_period_value = 0;
                } else if (newTaskCtrl.taskData.version_ind && !newTaskCtrl.taskData.retention_period_value) {
                    if (newTaskCtrl.retentionPeriod && newTaskCtrl.retentionPeriod.defaultPeriod &&
                        newTaskCtrl.retentionPeriod.defaultPeriod.unit) {
                        var defaultRetintion = _.find(newTaskCtrl.retentionPeriod.availableOptions, {name: newTaskCtrl.retentionPeriod.defaultPeriod.unit});
                        if (defaultRetintion) {
                            newTaskCtrl.retention_period_type = defaultRetintion;
                            newTaskCtrl.taskData.retention_period_type = newTaskCtrl.retention_period_type.name;
                            newTaskCtrl.taskData.retention_period_value = newTaskCtrl.retentionPeriod.defaultPeriod.value;
                        }
                    }
                }
            } else {
                newTaskCtrl.taskData.selectAllEntites = false;
                newTaskCtrl.logicalUnit = null;
            }
            if (!newTaskCtrl.taskData.selectAllEntites) {
                newTaskCtrl.selectFieldType = "given";
            }
        }

        newTaskCtrl.getAllLogicalUnitsForEnv = function (source_environment_id, environment_id) {
            if (source_environment_id && environment_id) {
                newTaskCtrl.allSingleLogicalUnits = [];
                TDMService.getGenericAPI('sourceenvid/' + source_environment_id +
                    '/targetendid/' + environment_id + '/logicalUnits').then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.allSingleLogicalUnits = response.result;
                        _.remove(newTaskCtrl.allSingleLogicalUnits, {last_executed_lu: true});
                    } else {
                        toastr.error("Faild to get Logical units");
                    }
                });
            }
        };

        // newTaskCtrl.getEnvId = () => newTaskCtrl.taskData.task_type == 'LOAD' ? newTaskCtrl.taskData.environment_id : newTaskCtrl.taskData.source_environment_id;

        newTaskCtrl.sourceEnvironmentChange = function (getRoles) {
            var sourceEnv = _.find(newTaskCtrl.allSourceEnvironments, {environment_id: newTaskCtrl.taskData.source_environment_id});
            if (sourceEnv) {
                newTaskCtrl.taskData.source_env_name = sourceEnv.fabric_environment_name;
            }
            if (getRoles) {
                newTaskCtrl.environmentChange(newTaskCtrl.taskData.source_environment_id, true);
            }
        }

        newTaskCtrl.checkReferenceIfAllowed = function () {
            if ((!newTaskCtrl.userRole || !newTaskCtrl.userRole.allowed_refresh_reference_data) && 
                (!newTaskCtrl.sourceUserRole || !newTaskCtrl.sourceUserRole.allowed_refresh_reference_data)) {
                newTaskCtrl.taskData.reference = null;
            }
        }

        newTaskCtrl.environmentChange = function (environment_id,source) {

            if (userRole.type == 'admin') {
                newTaskCtrl.userRole = {};
                newTaskCtrl.userRole.allowed_random_entity_selection = true;
                newTaskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                newTaskCtrl.userRole.allowed_refresh_reference_data = true;
                newTaskCtrl.userRole.allowed_request_of_fresh_data = true;
                newTaskCtrl.userRole.allowed_delete_before_load = true;
                newTaskCtrl.userRole.allowed_task_scheduling = true;
                newTaskCtrl.userRole.allowed_replace_sequences = true;
            } else {
                TDMService.getEnvironmentOwners(environment_id || newTaskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        var ownerFound = _.find(response.result, {user_id: AuthService.getUserId()});
                        if (ownerFound) {
                            newTaskCtrl.userRole = {};
                            newTaskCtrl.userRole.allowed_random_entity_selection = true;
                            newTaskCtrl.userRole.allowed_creation_of_synthetic_data = true;
                            newTaskCtrl.userRole.allowed_refresh_reference_data = true;
                            newTaskCtrl.userRole.allowed_request_of_fresh_data = true;
                            newTaskCtrl.userRole.allowed_delete_before_load = true;
                            newTaskCtrl.userRole.allowed_task_scheduling = true;
                            newTaskCtrl.userRole.allowed_replace_sequences = true;
                            if (environment_id) {
                                newTaskCtrl.sourceEnvOwner = true;
                            } else {
                                newTaskCtrl.targetEnvOwner = true;
                            }
                        } else {
                            if (environment_id) {
                                newTaskCtrl.sourceEnvOwner = false;
                            } else {
                                newTaskCtrl.targetEnvOwner = false;
                            }
                            TDMService.getRoleForUserInEnv(environment_id || newTaskCtrl.taskData.environment_id).then(function (response) {
                                if (response.errorCode == "SUCCESS") {
                                    if (!environment_id) {
                                        newTaskCtrl.userRole = response.result.userRole;
                                    } else {
                                        newTaskCtrl.sourceUserRole = response.result.userRole;
                                    }

                                    if ((newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.userRole.allowed_entity_versioning &&
                                        newTaskCtrl.sourceUserRole.allowed_entity_versioning) ||
                                        (newTaskCtrl.taskData.task_type == 'EXTRACT' &&
                                            newTaskCtrl.sourceUserRole.allowed_entity_versioning)) {
                                        newTaskCtrl.allowed_entity_versioning = true;
                                    } else {
                                        newTaskCtrl.allowed_entity_versioning = false;
                                        newTaskCtrl.taskData.version_ind = false;
                                    }

                                    newTaskCtrl.checkReferenceIfAllowed();

                                    var minRead = response.result.minRead;
                                    var minWrite = response.result.minWrite;
                                    if (minRead > -1 || minWrite > -1) {
                                        minWrite = parseInt(minWrite || "0");
                                        minRead = parseInt(minRead || "0");
                                        if (environment_id) {
                                            newTaskCtrl.sourceMaxToCopy = minRead;
                                            if (newTaskCtrl.maxToCopy > minRead) {
                                                newTaskCtrl.maxToCopy = minRead;
                                            } else if (!newTaskCtrl.maxToCopy) {
                                                newTaskCtrl.maxToCopy = minRead;
                                            }
                                        } else {
                                            newTaskCtrl.targetMaxToCopy = minWrite;
                                            if (newTaskCtrl.maxToCopy > minWrite) {
                                                newTaskCtrl.maxToCopy = minWrite;
                                            } else if (!newTaskCtrl.maxToCopy) {
                                                newTaskCtrl.maxToCopy = minWrite;
                                            }
                                        }
                                    }
                                } else {
                                    toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Faild to get Role for user ");
                                }
                            });
                        }
                    } else {
                        toastr.error("Environment # " + newTaskCtrl.taskData.environment_id, "failed to get owners : " + response.message);
                    }
                });
            }
            if ((!source || newTaskCtrl.taskData.task_type === 'EXTRACT' ) && (environment_id || newTaskCtrl.taskData.environment_id)) {
                TDMService.getBusinessEntitiesForEnvProducts(environment_id || newTaskCtrl.taskData.environment_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.businessEntities = response.result;
                    } else {
                        toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Faild to get Business Entities");
                    }
                });
            }
            newTaskCtrl.taskData.be_id = undefined;
            newTaskCtrl.products = [];
        };

        newTaskCtrl.updateParams = cb => {
            TDMService.getGenericAPI('businessentity/' + newTaskCtrl.taskData.be_id + '/sourceEnv/' + newTaskCtrl.taskData.source_env_name + '/parameters').then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.parameters = response.result;

                    let parametersKeys = Object.keys(newTaskCtrl.parameters);

                    var chosenLUs = _.map(newTaskCtrl.logicalUnits,function(lu){
                        return lu.lu_name.toLowerCase();
                    });
                    
                    for (let i = 0; i < parametersKeys.length; i++) {
                        if (chosenLUs.indexOf(parametersKeys[i].split(".")[0].toLowerCase()) < 0){
                            delete newTaskCtrl.parameters[parametersKeys[i]];
                        }
                    }
                    newTaskCtrl.parameters = _.map(newTaskCtrl.parameters, function (value, key) {
                        var type = "number";
                        if (value.PARAM_TYPE !== 'number') {
                            type = value.PARAM_TYPE;
                        }
                        return {
                            param_name: key,
                            name: value.PARAM_NAME,
                            param_type: value.PARAM_TYPE,
                            valid_values: value['VALID_VALUES'],
                            min_value: value.PARAM_TYPE == 'number' ? parseFloat(value['MIN_VALUE']) : 0,
                            max_value: value.PARAM_TYPE == 'number' ? parseFloat(value['MAX_VALUE']) : 0
                        }
                    });
                    console.log(1111);
                    if (cb) {
                        cb.apply();
                    }

                } else {
                    toastr.error("Business entity # " + newTaskCtrl.taskData.be_id, "Failed to get business entity parametes");
                }
            });
        };

        newTaskCtrl.businessEntityChange = function () {

            newTaskCtrl.taskData.selection_param_value = null;
            newTaskCtrl.taskData.parameters = null;
            if (newTaskCtrl.filter) {
                if (newTaskCtrl.filter.group) {
                    newTaskCtrl.filter.group.rules = [];
                }
            }
            var be = _.find(newTaskCtrl.businessEntities, {be_id: newTaskCtrl.taskData.be_id});
            if (be) {
                newTaskCtrl.be_name = be.be_name;
            }

            var environmentId = newTaskCtrl.taskData.task_type === 'EXTRACT' ? newTaskCtrl.taskData.source_environment_id : newTaskCtrl.taskData.environment_id;
            if (environmentId && newTaskCtrl.taskData.be_id) {
                TDMService.getLogicalUnitsForBusinessEntityAndEnv(newTaskCtrl.taskData.be_id, environmentId).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.logicalUnits = [];
                        newTaskCtrl.allLogicalUnits = response.result;
                        for (var i = 0; i < newTaskCtrl.allLogicalUnits.length; i++) {
                            newTaskCtrl.logicalUnits.push(newTaskCtrl.allLogicalUnits[i]);
                        }
                        // newTaskCtrl.logicalUnits = _.map(newTaskCtrl.allLogicalUnits,'lu_id');
                    } else {
                        toastr.error("Business entity # " + newTaskCtrl.taskData.be_id, "Failed to get products");
                    }
                });

                // if (newTaskCtrl.taskData.source_env_name) {
                //     newTaskCtrl.updateParams();
                // }
            }
            
            if (newTaskCtrl.taskData.be_id) {
                TDMService.getBEPostExecutionProcess(newTaskCtrl.taskData.be_id).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        newTaskCtrl.postExecutionProcesses = [];
                        newTaskCtrl.allPostExecutionProcess = response.result;
                        newTaskCtrl.allPostExecutionProcessIds = _.map(response.result,'process_id');
                        newTaskCtrl.postExecutionProcesses = newTaskCtrl.allPostExecutionProcessIds;
                    } else {
                        toastr.error("Business entity # " + newTaskCtrl.taskData.be_id, "Failed to get Post Execution Processes");
                    }
                });
            }
        };

        newTaskCtrl.selectSchedule = 'immediate';

        newTaskCtrl.addTask = function () {
            if (newTaskCtrl.createTaskInProgress == true) {
                return;
            }
            newTaskCtrl.createTaskInProgress = true;

            if (!newTaskCtrl.taskData.selectAllEntites && newTaskCtrl.taskData.reference !== 'refernceOnly') {
                if (newTaskCtrl.selectFieldType == 'given') {
                    if (newTaskCtrl.requestedEntities && newTaskCtrl.taskData.entity_exclusion_list == newTaskCtrl.requestedEntities.entities_list) {
                        newTaskCtrl.errorList = true;
                        newTaskCtrl.step = 2;
                        newTaskCtrl.createTaskInProgress = false;
                        return;
                    }
                    newTaskCtrl.taskData.selection_method = 'L';
                    newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.entities_list;
                } else if (newTaskCtrl.selectFieldType == 'random') {
                    newTaskCtrl.taskData.selection_method = 'R';
                    newTaskCtrl.taskData.selection_param_value = null;
                } else if (newTaskCtrl.selectFieldType == 'synthetic') {
                    newTaskCtrl.taskData.selection_method = 'S';
                    newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.synthetic;
                } else {
                    if (!newTaskCtrl.requestedEntities.query_parameters || newTaskCtrl.requestedEntities.query_parameters == '()') {
                        newTaskCtrl.parametersError = true;
                        newTaskCtrl.step = 2;
                        newTaskCtrl.createTaskInProgress = false;
                        return;
                    }

                    if (newTaskCtrl.parametersRandom == true) {
                        newTaskCtrl.taskData.selection_method = 'PR';
                    } else {
                        newTaskCtrl.taskData.selection_method = 'P';
                    }
                    newTaskCtrl.taskData.selection_param_value = newTaskCtrl.requestedEntities.query_parameters;
                    newTaskCtrl.taskData.parameters = newTaskCtrl.requestedEntities.parameters;
                }
            }


            if (newTaskCtrl.selectSchedule == 'immediate') {
                newTaskCtrl.taskData.scheduler = newTaskCtrl.selectSchedule;
                newTaskCtrl.taskData.scheduling_end_date = null;
            } else {
                newTaskCtrl.taskData.scheduler = newTaskCtrl.scheduleData;
                if (newTaskCtrl.scheduleEndBy !== "endBy") {
                    newTaskCtrl.taskData.scheduling_end_date = null;
                }
            }
            if (_.find(newTaskCtrl.tasks, {task_title: newTaskCtrl.taskData.task_title, task_status: 'Active'})) {
                newTaskCtrl.createTaskInProgress = false;
                return toastr.error("Task # " + newTaskCtrl.taskData.task_title + " Already Exists");
            }

            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind) {
                newTaskCtrl.taskData.operationMode = 'delete_and_load_entity';
            }

            if (newTaskCtrl.taskData.operationMode == 'delete_and_load_entity') {
                newTaskCtrl.taskData.load_entity = true;
                newTaskCtrl.taskData.delete_before_load = true;
            } else if (newTaskCtrl.taskData.operationMode == 'insert_entity_without_delete') {
                newTaskCtrl.taskData.load_entity = true;
                newTaskCtrl.taskData.delete_before_load = false;
            } else if (newTaskCtrl.taskData.operationMode == 'delete_without_load_entity') {
                newTaskCtrl.taskData.load_entity = false;
                newTaskCtrl.taskData.delete_before_load = true;
            } else {
                newTaskCtrl.taskData.load_entity = true;
                newTaskCtrl.taskData.delete_before_load = false;
            }

            // if (newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind){

            // }

            if (!newTaskCtrl.taskData.request_of_fresh_data) {
                newTaskCtrl.taskData.sync_mode = null;
            }

            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind && newTaskCtrl.taskData.reference !== "refernceOnly") {
                if (!newTaskCtrl.selectedVersionToLoad && newTaskCtrl.taskData.reference !== "refernceOnly") {
                    newTaskCtrl.step = 2;
                    newTaskCtrl.createTaskInProgress = false;
                    return;
                } else {
                    var selectedVersionToLoad = _.find(newTaskCtrl.versionsForLoad, {fabric_execution_id: newTaskCtrl.selectedVersionToLoad});
                    if (selectedVersionToLoad) {
                        newTaskCtrl.taskData.selected_version_task_name = selectedVersionToLoad.version_name;
                        var version_datetime = new Date(selectedVersionToLoad.version_datetime);
                        var localTimeZone = version_datetime.getTimezoneOffset();
                        version_datetime = version_datetime.getTime() + localTimeZone * 60000;
                        newTaskCtrl.taskData.selected_version_datetime = moment(version_datetime - newTaskCtrl.timeZoneOffset * 60000).format("YYYYMMDDHHmmss");
                        newTaskCtrl.taskData.selected_version_task_exe_id = selectedVersionToLoad.task_execution_id;
                    }
                }
            }

            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind &&
                (newTaskCtrl.taskData.reference == "refernceOnly" || newTaskCtrl.taskData.reference == "both")) {
                if (!newTaskCtrl.taskData.refLoadVersions) {
                    newTaskCtrl.step = 6;
                    newTaskCtrl.createTaskInProgress = false;
                    return;
                } else {
                    var selectedVersionToLoad = _.find(newTaskCtrl.taskData.refLoadVersions, {task_execution_id: newTaskCtrl.taskData.selectedRefVersionToLoad});
                    if (selectedVersionToLoad) {
                        newTaskCtrl.taskData.selected_ref_version_task_name = selectedVersionToLoad.version_name;
                        var version_datetime = new Date(selectedVersionToLoad.version_datetime);
                        var localTimeZone = version_datetime.getTimezoneOffset();
                        version_datetime = version_datetime.getTime() + localTimeZone * 60000;
                        newTaskCtrl.taskData.selected_ref_version_datetime = moment(version_datetime - newTaskCtrl.timeZoneOffset * 60000).format("YYYYMMDDHHmmss");
                        newTaskCtrl.taskData.selected_ref_version_task_exe_id = selectedVersionToLoad.task_execution_id;
                    }
                }
            }

            if (newTaskCtrl.taskData.task_type == 'EXTRACT') {
                newTaskCtrl.taskData.load_entity = false;
                newTaskCtrl.taskData.environment_id = newTaskCtrl.taskData.source_environment_id;
            }

            if (!(newTaskCtrl.taskData.task_type == 'EXTRACT' && newTaskCtrl.taskData.version_ind) && !newTaskCtrl.taskData.retention_period_value) {
                delete newTaskCtrl.taskData.retention_period_type;
                delete newTaskCtrl.taskData.retention_period_value;
            }

            // if (!(newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind)){
            //     newTaskCtrl.logicalUnits = [newTaskCtrl.logicalUnit];
            // }

            if (!newTaskCtrl.taskData.selectAllEntites && !(newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind)
                && newTaskCtrl.taskData.reference !== 'refernceOnly') {
                newTaskCtrl.taskData.number_of_entities_to_copy = newTaskCtrl.requestedEntities.entities_list.split(",").length;
            }

            if (newTaskCtrl.taskData.globals && newTaskCtrl.taskData.globals.length == 0) {
                newTaskCtrl.taskData.task_globals = false;
            }

            if (!newTaskCtrl.taskData.reference) {
                newTaskCtrl.taskData.refList = [];
            }

            if (newTaskCtrl.taskData.refList && newTaskCtrl.taskData.refList.length > 0) {
                newTaskCtrl.taskData.refresh_reference_data = false;
            }

            if (newTaskCtrl.taskData.task_type == 'EXTRACT') {
                if (!newTaskCtrl.taskData.version_ind && newTaskCtrl.taskData.request_of_fresh_data) {
                    newTaskCtrl.taskData.sync_mode = 'FORCE';
                }
                else {
                    delete newTaskCtrl.taskData.sync_mode;
                }
            }


            TDMService.createTask(newTaskCtrl.taskData).then(function (response) {
                if (response.errorCode == "SUCCESS") {

                    var createTaskResult = response.result;
                    TDMService.postTaskLogicalUnits(response.result.id, newTaskCtrl.taskData.task_title, {logicalUnits: newTaskCtrl.logicalUnits}).then(function (response) {
                        if (response.errorCode == "SUCCESS") {
                            toastr.success("Task # " + createTaskResult.id, " Is Created Successfully");
                        } else {
                            toastr.error("Task # " + createTaskResult.id, " Failed to Update : " + response.message);
                        }
                        $timeout(function () {
                            $state.go('tasks', {}, {reload: true});
                        }, 300);
                    });
                    if (newTaskCtrl.postExecutionProcesses.length > 0) {
                        TDMService.postTaskPostExecutionProcess(
                            response.result.id, 
                            newTaskCtrl.taskData.task_title, 
                            {postexecutionprocesses : _.filter(newTaskCtrl.allPostExecutionProcess, v => newTaskCtrl.postExecutionProcesses.indexOf(v.process_id) >= 0)}).then(function (response) {
                            if (response.errorCode !== "SUCCESS") {
                                toastr.error("Task # " + createTaskResult.id, " Failed to Update Post Execution Processes: " + response.message);
                            }
                        });
                        
                    }
                } else {
                    toastr.error("Task # " + newTaskCtrl.taskData.task_id, "Unable to Create : " + response.message);
                    newTaskCtrl.createTaskInProgress = false;
                }
            });
        };

        var data = '{"group": {"operator": "AND","rules": []}}';


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

        newTaskCtrl.filter = JSON.parse(data);
        newTaskCtrl.parametersCount = 0;

        $scope.getEntitesCount = function () {
            if (newTaskCtrl.requestedEntities.query_parameters == "()") {
                newTaskCtrl.parametersCount = 0;
                return;
            }
            if (!newTaskCtrl.requestedEntities.query_parameters) {
                newTaskCtrl.parametersCount = 0;
                return;
            }
            newTaskCtrl.parametersError = false;
            var data = {
                query: newTaskCtrl.requestedEntities.query_parameters,
                source_env_name: newTaskCtrl.taskData.source_env_name,
                beId: newTaskCtrl.taskData.be_id
            };
            newTaskCtrl.parametersCount = "inprogress";
            TDMService.postGenericAPI('businessentity/' + newTaskCtrl.taskData.be_id + '/sourceEnv/' + newTaskCtrl.taskData.source_env_name + '/analysiscount', {where: newTaskCtrl.requestedEntities.query_parameters}).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    newTaskCtrl.parametersCount = response.result;
                } else {
                    newTaskCtrl.parametersCount = 0;
                }
            });
        };

        $scope.$watch('newTaskCtrl.filter', function (newValue) {
            if (newTaskCtrl.analysisCountTimeout) {
                $timeout.cancel(newTaskCtrl.analysisCountTimeout);
            }
            newTaskCtrl.analysisCountTimeout = $timeout(function () {
                if (newTaskCtrl.taskData.be_id) {
                    var checkRule = function (rule) {
                        if (rule.group) {
                            return checkGroup(rule.group);
                        } else {
                            if (rule.condition === "" || rule.data === null || rule.field === "") {
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

                    if (checkGroup(newValue.group) == true) {
                        newTaskCtrl.requestedEntities.parameters = JSON.stringify(newValue);
                        var query = {
                            query: computed(newValue.group)
                        };
                        newTaskCtrl.requestedEntities.query_parameters = query.query;
                    }
                }
            }, 500);
        }, true);

        newTaskCtrl.checkMigrateStatus = function () {
            if (!newTaskCtrl.requestedEntities.entities_list || !newTaskCtrl.selectedVersionToLoad) {
                newTaskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                $scope.requestedEntitiesForm.submitted = true;
                return;
            }
            var selectedVersionToLoad = _.find(newTaskCtrl.versionsForLoad, {fabric_execution_id: newTaskCtrl.selectedVersionToLoad});
            var taskExecutionId = "";
            var luNames = "";
            if (selectedVersionToLoad) {
                taskExecutionId = selectedVersionToLoad.task_execution_id;
                luNames = selectedVersionToLoad.lu_names;
            }
            var version_datetime = new Date(selectedVersionToLoad.version_datetime);
            var localTimeZone = version_datetime.getTimezoneOffset();
            version_datetime = version_datetime.getTime() + localTimeZone * 60000;
            TDMService.postGenericAPI('checkMigrateStatusForEntitiesList', {
                entitlesList: newTaskCtrl.requestedEntities.entities_list,
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
                        newTaskCtrl.requestedEntitiesNext($scope.requestedEntitiesForm, true);
                    }
                } else {
                    toastr.error("Failed to check Migrate Status For Entites List");
                }
            });
        }


        newTaskCtrl.getStepsArray = function () {
            var stepsArray = [];
            stepsArray.push(1);
            if (newTaskCtrl.taskData.reference != null) {
                stepsArray.push(6);
            }
            if (!(newTaskCtrl.taskData.task_type == 'EXTRACT' && newTaskCtrl.taskData.selectAllEntites) && newTaskCtrl.taskData.reference !== 'refernceOnly') {
                stepsArray.push(2);
            }
            if (newTaskCtrl.taskData.task_globals) {
                stepsArray.push(5);
            }
            if (((newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind) ||
                (newTaskCtrl.taskData.task_type == 'EXTRACT' && !newTaskCtrl.taskData.version_ind 
                    && ((newTaskCtrl.sourceUserRole && newTaskCtrl.sourceUserRole.allowed_request_of_fresh_data) 
                    || (newTaskCtrl.userRole && newTaskCtrl.userRole.allowed_request_of_fresh_data)))) &&
                newTaskCtrl.taskData.reference !== 'refernceOnly') {
                stepsArray.push(3);
            }
            stepsArray.push(4);
            return stepsArray;
        }

        newTaskCtrl.openStep = function (step, type) {
            if (!(newTaskCtrl.userRoleType == 'admin' || newTaskCtrl.sourceEnvOwner && newTaskCtrl.targetEnvOwner)) {
                newTaskCtrl.taskData.selectAllEntites = false;
            }
            if (newTaskCtrl.step == 2 && newTaskCtrl.taskData.task_type == 'LOAD'
                && newTaskCtrl.taskData.version_ind && !newTaskCtrl.taskData.selectAllEntites) {
                if (type == 'back' && newTaskCtrl.taskData.reference != null) {
                    return newTaskCtrl.step = 6;
                }
                if (step == 1) {
                    return newTaskCtrl.step = 1;
                }
                newTaskCtrl.checkMigrateStatus();
                return;
            }
            var arraySteps = newTaskCtrl.getStepsArray();
            var nextStep = step;
            var currentIndex = arraySteps.indexOf(newTaskCtrl.step);
            var nextIndex = arraySteps.indexOf(step);
            if (nextIndex < currentIndex && nextIndex >= 0) {
                nextStep = arraySteps[nextIndex];
                newTaskCtrl.step = nextStep;
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
                newTaskCtrl.step = nextStep;
                return;
            }
            // if (newTaskCtrl.step == 5){
            //     return newTaskCtrl.step = step;
            // }
            // if (arraySteps.indexOf(step) < arraySteps.indexOf(newTaskCtrl.step)) {
            //     if (newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind){
            //         return newTaskCtrl.step = step;
            //     }
            //     else if (newTaskCtrl.taskData.task_type == 'EXTRACT'){
            //         if (newTaskCtrl.taskData.selectAllEntites || newTaskCtrl.taskData.reference == 'refernceOnly'){
            //             return newTaskCtrl.step = 1;
            //         }
            //     }
            //     if (newTaskCtrl.step == 4){
            //         if (newTaskCtrl.taskData.task_globals){
            //             return newTaskCtrl.step = 5;
            //         }
            //         return newTaskCtrl.step = 2;
            //     }
            //     else{
            //         return newTaskCtrl.step = 1;
            //     }
            // }
            if (newTaskCtrl.step == 1) {
                if (!$scope.generalForm.$valid){
                    newTaskCtrl.generalForm = $scope.generalForm;
                    $scope.generalForm.submitted = true;
                    return;
                }
                newTaskCtrl.generalNext($scope.generalForm,nextStep);
                return;
            } else if (newTaskCtrl.step == 2) {
                if (!$scope.requestedEntitiesForm.$valid){
                    newTaskCtrl.requestedEntitiesForm = $scope.requestedEntitiesForm;
                    $scope.requestedEntitiesForm.submitted = true;
                    return;
                }
                newTaskCtrl.requestedEntitiesNext($scope.requestedEntitiesForm, false, nextStep);
                $scope.requestedEntitiesForm.submitted = true;
                return;
            } else if (newTaskCtrl.step == 3 && !$scope.requestParametersForm.$valid) {
                newTaskCtrl.requestParametersForm = $scope.requestParametersForm;
                $scope.requestParametersForm.submitted = true;
                return;
            } else if (newTaskCtrl.step == 4 && !$scope.executionTimingForm.$valid) {
                newTaskCtrl.executionTimingForm = $scope.executionTimingForm;
                $scope.executionTimingForm.submitted = true;
                return;
            } else if (newTaskCtrl.step == 6) {
                newTaskCtrl.referenceNext(nextStep);
                return;
            }
            newTaskCtrl.step = nextStep;

            if (newTaskCtrl.step == 1) {
                $scope.generalForm.submitted = true;
            } else if (newTaskCtrl.step == 2) {
                $scope.requestedEntitiesForm.submitted = true;
            } else if (newTaskCtrl.step == 3) {
                $scope.requestParametersForm.submitted = true;
            } else if (newTaskCtrl.step == 4) {
                $scope.executionTimingForm.submitted = true;
            }
        };

        newTaskCtrl.generalNext = function (form, nextStep) {
            // gap can happen in at least 2 LUs
            if (newTaskCtrl.isFluxMode) {
                $scope.generalForm.taskLogicalUnit.$setValidity('gap', true);
                $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', true);

                /**
                 * Checks if the given logical unit name has been selected
                 * @param lu_name
                 * @returns {*}
                 */
                let isSelectedLU = (lu_name) => {
                    return _.find(newTaskCtrl.logicalUnits, {lu_name: lu_name})
                };

                let checkGap = lu => {
                    if (lu.lu_parent_name && !isSelectedLU(lu.lu_parent_name)) {
                        /**
                         * If a logical unit has a parent and it has not being selected
                         * then this is the only chance that we might have a gap.
                         * The gap will occur if the lu parent name that is missing
                         * has a parent which is not missing. This will generate a gap.
                         */

                        const luParent = _.find(newTaskCtrl.allLogicalUnits, {lu_name: lu.lu_parent_name});
                        if (luParent) {
                            if (luParent.lu_parent_name && isSelectedLU(luParent.lu_parent_name)) {
                                $scope.generalForm.taskLogicalUnit.$setValidity('gap', false);
                                newTaskCtrl.missingUnitInGap = luParent.lu_name;
                            }
                        }
                    }
                };

                let checkIfRootIsMissing = () => {
                    $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', true);
                    newTaskCtrl.missingRootLU = [];

                    // check if there is lu which has a parent that does not have a parent (root)
                    for (lu of newTaskCtrl.logicalUnits) {
                        if (lu.lu_parent_name) {
                            const luParent = _.find(newTaskCtrl.allLogicalUnits, {lu_name: lu.lu_parent_name});
                            if (luParent) {
                                // if lu has a parent that does not have a parent which is missing then root is missing
                                if (!luParent.lu_parent_name && !isSelectedLU(luParent.lu_name)) {
                                    $scope.generalForm.taskLogicalUnit.$setValidity('missingParent', false);
                                    newTaskCtrl.missingRootLU.push(luParent.lu_name);
                                }
                            }
                        }
                    }
                };
                if (newTaskCtrl.logicalUnits && newTaskCtrl.logicalUnits.length > 0){
                    newTaskCtrl.logicalUnits.forEach(lu => {
                        if (newTaskCtrl.taskData.reference !== 'refernceOnly'){
                            checkGap(lu);
                            checkIfRootIsMissing(lu);
                        }
                    })
                }

            }


            if (form.$valid) {
                let cb = () => {
                    newTaskCtrl.step = nextStep || 2;
                    if (!(newTaskCtrl.userRoleType == 'admin' || newTaskCtrl.sourceEnvOwner && newTaskCtrl.targetEnvOwner)) {
                        newTaskCtrl.taskData.selectAllEntites = false;
                    }
                    var sourceEnv = _.find(newTaskCtrl.allSourceEnvironments, {environment_id: newTaskCtrl.taskData.source_environment_id});
                    if (sourceEnv) {
                        newTaskCtrl.taskData.source_env_name = sourceEnv.fabric_environment_name;
                    }
                    if (newTaskCtrl.taskData.selectAllEntites) {
                        newTaskCtrl.requestedEntities.entities_list = undefined;
                        if (newTaskCtrl.taskData.task_type == "EXTRACT") {
                            if (newTaskCtrl.taskData.version_ind || !newTaskCtrl.taskData.version_ind && (
                                (!newTaskCtrl.userRole ||!newTaskCtrl.userRole.allowed_request_of_fresh_data) &&
                                (!newTaskCtrl.sourceUserRole || !newTaskCtrl.sourceUserRole.allowed_request_of_fresh_data)
                                )){
                                    newTaskCtrl.step = nextStep || 4;
                            }
                            else {
                                newTaskCtrl.step = nextStep || 3;
                            }
                        }
                    }
                    if (newTaskCtrl.taskData.reference != null) {
                        newTaskCtrl.step = nextStep || 6;
                    }
                }
                if (newTaskCtrl.taskData.task_type === 'LOAD') {
                    newTaskCtrl.updateParams(cb);
                }
                else{
                    cb.apply();
                }
            } else {
                form.submitted = true;
            }
            newTaskCtrl.generalForm = form;
        };

        newTaskCtrl.referenceNext = function (nextStep) {
            if (_.filter(newTaskCtrl.taskData.refList, {selected: true}).length == 0) {
                newTaskCtrl.referenceTabError = 'Please Select Reference Table';
                return;
            }
            newTaskCtrl.referenceTabError = '';
            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind && !_.find(newTaskCtrl.taskData.refLoadVersions, {task_execution_id: newTaskCtrl.taskData.selectedRefVersionToLoad})) {
                return;
            }
            if (newTaskCtrl.taskData.reference !== 'refernceOnly') {
                if (newTaskCtrl.taskData.task_type == "EXTRACT" && newTaskCtrl.taskData.selectAllEntites) {
                    return newTaskCtrl.step = nextStep || 4;
                }
                return newTaskCtrl.step = nextStep || 2;
            } else if (newTaskCtrl.taskData.task_globals) {
                return newTaskCtrl.step = nextStep || 5;
            } else {
                return newTaskCtrl.step = nextStep || 4;
            }
        }

        newTaskCtrl.requestedEntitiesNext = function (form, migrated, nextStep) {
            if (newTaskCtrl.taskData.task_type == 'LOAD'
                && newTaskCtrl.taskData.version_ind && !newTaskCtrl.taskData.selectAllEntites && !migrated) {
                newTaskCtrl.checkMigrateStatus();
                return;
            }

            if (newTaskCtrl.isFluxMode &&
                newTaskCtrl.taskData.task_type == 'LOAD' && !newTaskCtrl.taskData.version_ind &&
                (newTaskCtrl.selectFieldType == 'synthetic' || newTaskCtrl.selectFieldType == 'parameters')
            ) {

                $scope.LUsMissingParent = [];

                for (lu of newTaskCtrl.logicalUnits) {
                    if (lu.lu_parent_name && !_.find(newTaskCtrl.logicalUnits, {lu_name: lu.lu_parent_name})) {
                        $scope.LUsMissingParent.push(lu.lu_name);
                    }
                }
                $scope.requestedEntitiesForm.$setValidity('missingParent', true);

                if ($scope.LUsMissingParent.length > 0) {
                    $scope.requestedEntitiesForm.$setValidity('missingParent', false);
                    return;
                }
            }

            if (newTaskCtrl.selectFieldType == 'given' && newTaskCtrl.requestedEntities && typeof newTaskCtrl.requestedEntities.entities_list === 'string'
                && newTaskCtrl.taskData.entity_exclusion_list == newTaskCtrl.requestedEntities.entities_list) {
                newTaskCtrl.errorList = true;
                if (!form.$valid) {
                    form.submitted = true;
                    newTaskCtrl.requestedEntitiesForm = form;
                }
                return;
            }

            newTaskCtrl.enititesListNotPassedExclusionList = false;
            newTaskCtrl.enititesListFailedPatternTest = false;

            if (newTaskCtrl.taskData.task_type == "LOAD" && !newTaskCtrl.taskData.version_ind && newTaskCtrl.requestedEntities.entities_list &&
                typeof newTaskCtrl.taskData.entity_exclusion_list === 'string' && newTaskCtrl.requestedEntities.entities_list.length > 0) {
                newTaskCtrl.taskData.entity_exclusion_list = newTaskCtrl.taskData.entity_exclusion_list.replace(/\s/g, ''); //remove spaces
                newTaskCtrl.taskData.entity_exclusion_list = newTaskCtrl.taskData.entity_exclusion_list.replace(/\r?\n|\r/g, ''); //remove new lines
                if (!newTaskCtrl.entitiesPattern.test(newTaskCtrl.taskData.entity_exclusion_list)) {
                    newTaskCtrl.enititesExclusionListPatternTest = true;
                }
            }

            //check if the current "entities List" includes anything from the exclusion list we defined before.
            if (newTaskCtrl.selectFieldType == 'given' && typeof newTaskCtrl.requestedEntities.entities_list === 'string' && newTaskCtrl.requestedEntities.entities_list.length > 0) {
                newTaskCtrl.requestedEntities.entities_list = newTaskCtrl.requestedEntities.entities_list.replace(/\s/g, ''); //remove spaces
                newTaskCtrl.requestedEntities.entities_list = newTaskCtrl.requestedEntities.entities_list.replace(/\r?\n|\r/g, ''); //remove new lines
                var entitiesPattern = newTaskCtrl.entitiesPattern;
                if (!(newTaskCtrl.taskData.task_type == "LOAD" && !newTaskCtrl.taskData.version_ind)) {
                    entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0," + ((newTaskCtrl.maxToCopy || 1000000000) - 1) + "})?$");
                }

                if (entitiesPattern.test(newTaskCtrl.requestedEntities.entities_list)) {
                    if (newTaskCtrl.taskData.task_type == "LOAD" && !newTaskCtrl.taskData.version_ind) {
                        //validate against exclusion list. As we are using same exclusion list validation method, we prepare object for validation that contains the names that the BackEnd Expects.
                        var dataForValidation = {};
                        dataForValidation.exclusion_list = newTaskCtrl.requestedEntities.entities_list;
                        dataForValidation.be_id = newTaskCtrl.taskData.be_id;

                        TDMService.postEnvExclusionListValidateList(newTaskCtrl.taskData.environment_id, dataForValidation).then(function (response) {
                            if (response.errorCode == "SUCCESS") {
                                if (response.result.length > 0) {
                                    newTaskCtrl.enititesListNotPassedExclusionList = true;
                                    newTaskCtrl.existingEntitiesInExclusionListMembers = [];
                                    for (var i = 0; i < response.result.length; i++) {
                                        newTaskCtrl.existingEntitiesInExclusionListMembers.push(response.result[i].unnest);
                                    }
                                    return;
                                } else {//No exclusions found, continue to step 3.
                                    newTaskCtrl.errorList = false;
                                    if (form.$valid || newTaskCtrl.disableChange == true) {
                                        if (newTaskCtrl.taskData.task_globals) {
                                            newTaskCtrl.step = nextStep || 5;
                                        } else {
                                            newTaskCtrl.step = nextStep || 3;
                                        }

                                    } else {
                                        form.submitted = true;
                                    }
                                    newTaskCtrl.requestedEntitiesForm = form;
                                }
                            } else {
                                toastr.error("Unable to execute validation against Exclusion List" + response.message);
                            }
                        });
                    } else {
                        newTaskCtrl.errorList = false;
                        if (form.$valid || newTaskCtrl.disableChange == true) {
                            if (newTaskCtrl.taskData.task_globals) {
                                newTaskCtrl.step = 5;
                            }  else if ((newTaskCtrl.taskData.task_type == "EXTRACT" ||
                                newTaskCtrl.taskData.task_type == "LOAD") && newTaskCtrl.taskData.version_ind) {
                                newTaskCtrl.step = 4;
                            }  else if (newTaskCtrl.taskData.task_type == "EXTRACT" && 
                                        !newTaskCtrl.taskData.version_ind && (
                                            (!newTaskCtrl.userRole ||!newTaskCtrl.userRole.allowed_request_of_fresh_data) &&
                                            (!newTaskCtrl.sourceUserRole || !newTaskCtrl.sourceUserRole.allowed_request_of_fresh_data )
                                    )) {
                                newTaskCtrl.step = nextStep || 4;
                            } else {
                                newTaskCtrl.step = nextStep || 3;
                            }
                        } else {
                            form.submitted = true;
                        }
                        newTaskCtrl.requestedEntitiesForm = form;
                    }
                } else { //pattern validation didn't pass
                    newTaskCtrl.enititesListFailedPatternTest = true;
                }
            } else if (newTaskCtrl.selectFieldType == 'synthetic' && newTaskCtrl.requestedEntities.synthetic) {
                var dataForValidation = {};
                dataForValidation.exclusion_list = newTaskCtrl.requestedEntities.synthetic;
                dataForValidation.be_id = newTaskCtrl.taskData.be_id;
                TDMService.postEnvExclusionListValidateList(newTaskCtrl.taskData.environment_id, dataForValidation).then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        if (response.result.length > 0) {
                            newTaskCtrl.enititesListNotPassedExclusionList = true;
                            newTaskCtrl.existingEntitiesInExclusionListMembers = [];
                            for (var i = 0; i < response.result.length; i++) {
                                newTaskCtrl.existingEntitiesInExclusionListMembers.push(response.result[i].unnest);
                            }
                            return;
                        } else {//No exclusions found, continue to step 3.
                            newTaskCtrl.errorList = false;
                            if (form.$valid || newTaskCtrl.disableChange == true) {
                                if (newTaskCtrl.taskData.task_globals) {
                                    newTaskCtrl.step = nextStep || 5;
                                } else {
                                    newTaskCtrl.step = nextStep || 3;
                                }
                            } else {
                                form.submitted = true;
                            }
                            newTaskCtrl.requestedEntitiesForm = form;
                        }
                    } else {
                        toastr.error("Unable to execute validation against Exclusion List" + response.message);
                    }
                });
            } else {//continue to step 3.
                newTaskCtrl.errorList = false;
                if (form.$valid || newTaskCtrl.disableChange == true) {
                    if (newTaskCtrl.taskData.task_globals) {
                        newTaskCtrl.step = 5;
                    } else if ((newTaskCtrl.taskData.task_type == "EXTRACT" ||
                        newTaskCtrl.taskData.task_type == "LOAD") && newTaskCtrl.taskData.version_ind) {
                        newTaskCtrl.step = 4;
                    }  else if (newTaskCtrl.taskData.task_type == "EXTRACT" && 
                                !newTaskCtrl.taskData.version_ind && (
                                    (!newTaskCtrl.userRole ||!newTaskCtrl.userRole.allowed_request_of_fresh_data) &&
                                    (!newTaskCtrl.sourceUserRole || !newTaskCtrl.sourceUserRole.allowed_request_of_fresh_data )
                            )) {
                        newTaskCtrl.step = nextStep || 4;
                    } else {
                        newTaskCtrl.step = nextStep || 3;
                    }
                } else {
                    form.submitted = true;
                }
                newTaskCtrl.requestedEntitiesForm = form;
            }

        };

        newTaskCtrl.globalsNext = function () {
            if (newTaskCtrl.taskData.task_type == 'LOAD' && newTaskCtrl.taskData.version_ind || newTaskCtrl.taskData.task_type == 'EXTRACT') {
                newTaskCtrl.openStep(4, 'next');
            } else {
                newTaskCtrl.openStep(3, 'next');
            }
        };

        newTaskCtrl.requestParametersNext = function (form) {
            if (form.$valid) {
                newTaskCtrl.step = 4;
            } else {
                form.submitted = true;
            }
            newTaskCtrl.requestParametersForm = form;
        };

        newTaskCtrl.executionTimingFinish = function (form) {
            if (form.$valid) {
                if (!$scope.generalForm.$valid) {
                    newTaskCtrl.step = 1;
                    return;
                } else if (newTaskCtrl.taskData.reference && _.filter(newTaskCtrl.taskData.refList, {selected: true}).length == 0) {
                    newTaskCtrl.step = 6;
                    return;
                } else if (newTaskCtrl.taskData.reference !== 'refernceOnly' && !$scope.requestedEntitiesForm.$valid) {
                    newTaskCtrl.step = 2;
                    return;
                } else if (!$scope.requestParametersForm.$valid) {
                    newTaskCtrl.step = 3;
                    return;
                }
                newTaskCtrl.addTask();
            } else {
                form.submitted = true;
            }
            newTaskCtrl.executionTimingForm = form;
        };


        newTaskCtrl.cronTabConfig = {
            allowMultiple: true
        };

        newTaskCtrl.toggleVersion = function(task_execution_id) {
            newTaskCtrl.versionsToggle[task_execution_id] = !newTaskCtrl.versionsToggle[task_execution_id];
            if (newTaskCtrl.dtInstanceVersions && newTaskCtrl.dtInstanceVersions.reloadData) {
                newTaskCtrl.dtInstanceVersions.reloadData(function () {

                });
            }
        }

        newTaskCtrl.versionsToggle = {};
        newTaskCtrl.versionsForLoad = [];
        newTaskCtrl.dtInstanceVersions = {};
        newTaskCtrl.dtColumnsVersions = [];
        newTaskCtrl.dtColumnDefsVersions = [];
        newTaskCtrl.headersVersions = [
            {
                column: 'collapse',
                name: '',
                clickAble: false
            },
            {
                column: 'actions',
                name: '',
                clickAble: false,
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
                return '<input icheck type="radio" ng-value="\'' + full.fabric_execution_id + '\'" name="versionsTableSelection" ng-model="newTaskCtrl.selectedVersionToLoad">';
            }
            return '';
        };

        var renderCollapseColumn = function (data, type, full, meta) {
            if (full.isRoot) {
                return '<a class="toggleVersions ' + (newTaskCtrl.versionsToggle[full.task_execution_id] ? 'active' : '')  + '" ng-click="newTaskCtrl.toggleVersion(' + full.task_execution_id + ')"><i class="fa arrow"></i> </a>';
            }
            return '';
        };

        for (var i = 0; i < newTaskCtrl.headersVersions.length; i++) {
            if (newTaskCtrl.headersVersions[i].column == 'actions') {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).renderWith(renderSelectionColumn).notSortable());
            } else if (newTaskCtrl.headersVersions[i].column == 'collapse') {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).renderWith(renderCollapseColumn).notSortable());
            } else if (newTaskCtrl.headersVersions[i].type == 'date') {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).renderWith(changeToLocalDate).notSortable());
            } else if (newTaskCtrl.headersVersions[i].column == 'task_id') {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).notSortable());
            } else if (newTaskCtrl.headersVersions[i].column == 'version_name') {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).notSortable());
            } else if (newTaskCtrl.headersVersions[i].column == 'rootIndicator' ) {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).notSortable().notVisible());
            }else {
                newTaskCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(newTaskCtrl.headersVersions[i].column).withTitle(newTaskCtrl.headersVersions[i].name).notSortable());
            }
        }

        var getTableDataVersions = function () {
            var deferred = $q.defer();
            var versionsForLoad = [];  
            var rootLUs = _.filter(newTaskCtrl.logicalUnits,{lu_parent_name : null});
            newTaskCtrl.versionsForLoad.forEach(function(versionForLoad) {
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
                if (newTaskCtrl.versionsToggle[versionForLoad.task_execution_id]) {
                    versionForLoad.isRoot = false;
                    versionsForLoad.push(versionForLoad);
                }
            }); 
            // var groupedVersions = _.groupBy(newTaskCtrl.versionsForLoad,'task_execution_id');
            // for (var key in groupedVersions){
            //     var rootVersionForLoad = _.find(groupedVersions[key],{root_indicator : 'YY'});
            //     if (rootVersionForLoad){
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
            // if (newTaskCtrl.taskData.selected_version_task_exe_id) {
            //     var selectedVersion = _.find(versionsForLoad, {task_execution_id: newTaskCtrl.taskData.selected_version_task_exe_id});
            //     if (selectedVersion) {
            //         newTaskCtrl.selectedVersionToLoad = selectedVersion.fabric_execution_id;
            //     }                            
            // }
            console.log(versionsForLoad);
            deferred.resolve(versionsForLoad);
            return deferred.promise;
        };

        newTaskCtrl.dtOptionsVersions = DTOptionsBuilder.fromFnPromise(function () {
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

        newTaskCtrl.dtOptionsVersions.withLightColumnFilter({
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

        newTaskCtrl.getVersionsForLoad = function () {
            var entitiesPassed = true;

            if (newTaskCtrl.requestedEntities.entities_list && newTaskCtrl.maxToCopy) {
                var entitiesPattern = new RegExp("^((\\w|-)+(?:,(\\w|-)+){0," + ((newTaskCtrl.maxToCopy || 1000000000) - 1) + "})?$");
                entitiesPassed = entitiesPattern.test(newTaskCtrl.requestedEntities.entities_list);
                newTaskCtrl.enititesListFailedPatternTest = false;
            }
            if (newTaskCtrl.versionForLoadFrom && newTaskCtrl.versionForLoadTo &&
                newTaskCtrl.logicalUnits && newTaskCtrl.taskData.source_env_name
                && (newTaskCtrl.taskData.selectAllEntites ||
                    (newTaskCtrl.requestedEntities.entities_list && entitiesPassed))) {
                newTaskCtrl.loadingTableVersions = true;
                var from = new Date(newTaskCtrl.versionForLoadFrom);
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                var to = new Date(newTaskCtrl.versionForLoadTo);
                to.setHours(23);
                to.setMinutes(59);
                to.setSeconds(59);

                TDMService.postGenericAPI('tasks/versionsForLoad', {
                    fromDate: from,
                    toDate: to,
                    entitiesList: newTaskCtrl.taskData.selectAllEntites ? [] : newTaskCtrl.requestedEntities.entities_list,
                    lu_list: newTaskCtrl.logicalUnits,
                    source_env_name: newTaskCtrl.taskData.source_env_name,
                    be_id : newTaskCtrl.taskData.be_id,
                }).then(function (response) {
                      
                      if (response.errorCode == "SUCCESS") {

                        let overrideRootIndicators = data => {
                            executionIdsSet = new Set();

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

                        newTaskCtrl.versionsForLoad = response.result;

                        newTaskCtrl.versionsForLoad = _.sortBy(newTaskCtrl.versionsForLoad, version => -1 * new Date(version.version_datetime));

                        $timeout(function () {
                            if (newTaskCtrl.dtInstanceVersions && newTaskCtrl.dtInstanceVersions.reloadData) {
                                newTaskCtrl.dtInstanceVersions.reloadData(function () {
                                });
                            }
                        }, 100);

                        newTaskCtrl.loadingTableVersions = false;

                    } else {
                        toastr.error("New Task # Failed to get Versions for Load");
                    }
                });
            } else if (!newTaskCtrl.requestedEntities.entities_list && !newTaskCtrl.taskData.selectAllEntites) {
                newTaskCtrl.versionsForLoad = [];
                if (newTaskCtrl.dtInstanceVersions && newTaskCtrl.dtInstanceVersions.reloadData) {
                    newTaskCtrl.dtInstanceVersions.reloadData(function () {

                    });
                }
            } else if (!entitiesPassed) {
                newTaskCtrl.enititesListFailedPatternTest = true;
            }
        };


        newTaskCtrl.requestParametersPrev = function () {
            if (newTaskCtrl.taskData.task_globals) {
                newTaskCtrl.step = 5;
            } else {
                newTaskCtrl.step = 2;
            }
        }

        BreadCrumbsService.push({}, 'NEW_TASK', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'newTaskCtrl'
    };
}

function queryBuilder($compile) {
    return {
        restrict: 'E',
        scope: {
            group: '=',
            params: '=',
            disablechange: '=',
            lastindex: '=',
            form: '=',
            index: '='
        },
        templateUrl: 'views/tasks/queryBuilderDirective.html',
        compile: function (element, attrs) {
            var content, directive;
            content = element.contents().remove();
            return function (scope, element, attrs) {

                scope.operators = [
                    {name: 'AND'},
                    {name: 'OR'}
                ];

                scope.conditions = [
                    {
                        name: '=',
                        id: '='
                    },
                    {
                        name: '<>',
                        id: '<>'
                    },
                    {
                        name: '<',
                        id: '>'
                    },
                    {
                        name: '<=',
                        id: '>='
                    },
                    {
                        name: '>',
                        id: '<'
                    },
                    {
                        name: '>=',
                        id: '<='
                    },
                    {
                        name: 'Is null',
                        id: 'Is null'
                    },
                    {
                        name: 'Is not null',
                        id: 'Is not null'
                    }
                ];

                scope.comboConditions = [
                    {name: '='},
                    {name: '<>'},
                    {
                        name: 'Is null',
                        id: 'Is null'
                    },
                    {
                        name: 'Is not null',
                        id: 'Is not null'
                    }
                ];

                scope.changeParam = function (rule, field) {
                    rule.data = undefined;
                    scope.data = undefined;
                    var param = _.find(scope.params, {param_name: field});
                    if (param) {
                        rule.type = param.param_type;
                        if (rule.type == 'integer' || rule.type == 'real' || rule.type == 'number') {
                            rule.min = parseFloat(param.min_value);
                            rule.max = parseFloat(param.max_value);
                        } else {
                            rule.validValues = param.valid_values
                        }
                    }
                    rule.field = field;
                };

                scope.changeCondition = function (rule, condition) {
                    rule.condition = condition;
                };

                scope.changeData = function (rule, data) {
                    if (data === undefined) {
                        rule.data = undefined;
                        return;
                    }
                    rule.data = data;
                };

                scope.addCondition = function () {
                    scope.group.rules.push({
                        condition: '',
                        field: '',
                        data: undefined,
                        operator: 'AND'
                    });
                };

                scope.disableIfNull = function (rule, condition) {

                    if (condition === "Is null" || condition === "Is not null") {

                        rule.disableThird = true;
                        rule.data = undefined;
                    } else {
                        rule.disableThird = false;
                    }
                }

                scope.removeCondition = function (index) {
                    scope.group.rules.splice(index, 1);
                };

                scope.addGroup = function () {
                    scope.group.rules.push({
                        group: {
                            operator: 'AND',
                            rules: []
                        }
                    });
                };

                scope.removeGroup = function () {
                    "group" in scope.$parent && scope.$parent.group.rules.splice(scope.$parent.$index, 1);
                };

                directive || (directive = $compile(content));

                element.append(directive(scope, function ($compile) {
                    return $compile;
                }));
            }
        }
    };
}

angular
    .module('TDM-FE')
    .directive('newTaskDirective', newTaskDirective)
    .directive('queryBuilder', ['$compile', queryBuilder]);
