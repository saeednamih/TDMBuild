function tasksTableDirective($interval, TASK) {

    var template = "views/tasks/tasksTable.html";

    var controller = function ($scope, $compile, TDMService, $sessionStorage, DTColumnBuilder, DTOptionsBuilder, DTColumnDefBuilder, $q, BreadCrumbsService, AuthService, toastr, SweetAlert, $timeout) {
        var tasksTableCtrl = this;

        tasksTableCtrl.loadingTable = true;
        tasksTableCtrl.userRole = AuthService.getRole();
        tasksTableCtrl.username = AuthService.getUsername();
        tasksTableCtrl.prevRunningTasksId = "";
        TDMService.getTasks().then(function (response) {
            if (response.errorCode != 'SUCCESS') {
                //TODO show Error
                return;
            }
            tasksTableCtrl.tasksData = _.sortBy(response.result, function (value) {
                return new Date(value.task_last_updated_date);
            });
            tasksTableCtrl.tasksData.reverse();
            tasksTableCtrl.dtInstance = {};
            tasksTableCtrl.dtColumns = [];
            tasksTableCtrl.dtColumnDefs = [];
            tasksTableCtrl.headers = [
                {
                    column: 'task_title',
                    name: 'Task Title',
                    clickAble: true,
                    visible: true
                },
                {
                    column: 'task_type',
                    name: 'Task Type',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'version_ind',
                    name: 'Entity Versioning',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'be_name',
                    name: 'Business Entity Name',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'source_env_name',
                    name: 'Source Environment Name',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'environment_name',
                    name: 'Target Environment Name',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'selection_method',
                    name: 'Selection Method',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'number_of_entities_to_copy',
                    name: 'No. Of Entities',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'task_last_updated_by',
                    name: 'Updated By',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'task_last_updated_date',
                    name: 'Update Date',
                    clickAble: false,
                    type: 'date',
                    visible: true
                },
                {
                    column: 'task_status',
                    name: 'Task Status',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'task_execution_status',
                    name: 'Task Execution Status',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'scheduler',
                    name: 'Execution Timing',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'scheduling_end_date',
                    name: 'Scheduling End Date',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'retention_period_type',
                    name: 'Retention period type',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'retention_period_value',
                    name: 'Retention period value',
                    clickAble: false,
                    visible: true
                },
                {
                    column: 'refresh_reference_data',
                    name: 'Refresh Reference Data',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'sync_mode',
                    name: 'Override Sync Mode',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'operation_mode',
                    name: 'Operation Mode',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'replace_sequences',
                    name: 'Replace Sequence',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'selected_version_task_name',
                    name: 'Selected Version Task Name',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'selected_version_datetime',
                    name: 'Selected Version Datetime',
                    type: 'to_char_date',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'selected_ref_version_task_name',
                    name: 'Selected Reference Version Task Name',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'selected_ref_version_datetime',
                    name: 'Selected Reference Version Datetime',
                    type: 'to_char_date',
                    clickAble: false,
                    visible: false
                },
                {
                    column: 'processnames',
                    name: 'Post Execution Processes',
                    clickAble: false,
                    visible: false
                }
            ];
            if ($sessionStorage.taskTableHideColumns) {
                tasksTableCtrl.hideColumns = $sessionStorage.taskTableHideColumns;
            }
            else {
                tasksTableCtrl.hideColumns = [ 13, 14, 15, 16, 17 , 18 , 19 , 20, 21,22,23, 24, 25];
            }
            for (var i = 0; i < tasksTableCtrl.hideColumns.length; i++) {
                var hideColumn = DTColumnDefBuilder.newColumnDef(tasksTableCtrl.hideColumns[i])
                    .withOption('visible', false);
                //try to comment out the line below
                tasksTableCtrl.dtColumnDefs.push(hideColumn);
            }


            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="tasksTableCtrl.openTask(\'' + full.task_id + '\')">' + data + '</a>';
            };

            var selectionMethodColumn = function (data, type, full, meta) {
                switch (data) {
                    case 'L' :
                        return 'Entity List';
                    case 'P' :
                        return 'Parameters - selection based only on Parameters';
                    case 'PR' :
                        return 'Parameters- selection based on parameters with random selection';
                    case 'R' :
                        return 'Random selection';
                    case 'S' :
                        return 'Synthetic creation';
                    case 'ALL' :
                        return 'All';
                    case 'REF' :
                        return 'Reference only';
                    default :
                        return 'none';
                }
            };

            var changeToLocalDate = function (data, type, full, meta) {
                return moment(data).format('DD MMM YYYY, HH:mm')
            };

            var changeToLocalDateToChar = function (data, type, full, meta) {
                var ans = moment(data,"YYYYMMDDHHmmss").format('DD MMM YYYY, HH:mm');
                if (ans == "Invalid date"){
                    return "";
                }
                else{
                    return ans;
                }
            };

            tasksTableCtrl.chooseHoldActivate = function (row) {
                if (tasksTableCtrl.tasksData[row].onHold == true) {
                    tasksTableCtrl.activateTask(row);
                }
                else {

                    tasksTableCtrl.holdTask(row);
                }

            };

            var taskActions = function (data, type, full, meta) {
                let arraysEqual = (arr1, arr2) => {
                    if(arr1.length !== arr2.length) {
                        return false;
                    }
                    for(var i = arr1.length; i--;) {
                        if(arr1[i] !== arr2[i]) {
                            return false;
                        }
                    }

                    return true;
                };

                var canByRunByOtherTester = false;
                var createdTester = _.find(full.testers,{tester : full.task_created_by});
                if (createdTester){
                    var currentTester = _.find(full.testers,{tester : tasksTableCtrl.username});
                    if (currentTester && arraysEqual(currentTester.role_id,createdTester.role_id)){
                        canByRunByOtherTester = true;
                    }
                }
                var taskActions = '';
                if (full.task_status == "Active" &&
                    (tasksTableCtrl.userRole.type == 'admin' || full.owners.indexOf(tasksTableCtrl.username) >= 0 || tasksTableCtrl.username == full.task_created_by || 
                    canByRunByOtherTester)) {
                    tasksTableCtrl.tasksData[meta.row].disabled = false;
                    tasksTableCtrl.tasksData[meta.row].onHold = full.task_execution_status == 'onHold';
                    taskActions = taskActions + '<button style="margin-left: 3px;"  ng-class="(tasksTableCtrl.tasksData[' + meta.row + '].disabled == true || (tasksTableCtrl.tasksData[' + meta.row + '].onHold == true || tasksTableCtrl.tasksData[' + meta.row + '].executioncount !== 0)) ? \'executeStatesWhiteIcon\':\'executeStatesBlueIcon\'" title="Execute Task" ng-disabled="tasksTableCtrl.tasksData[' + meta.row + '].disabled == true || (tasksTableCtrl.tasksData[' + meta.row + '].onHold==true || tasksTableCtrl.tasksData[' + meta.row + '].executioncount !== 0)" class="btn buttonTaskAction btn-circle" type="button" ng-click="tasksTableCtrl.executeTask(' + meta.row +')"><i class="fa fa-play taskExecutionButton"></i> </button>';
                    taskActions = taskActions + '<button   ng-class="tasksTableCtrl.tasksData[' + meta.row + '].onHold==true ? \'executeStatsRedIcon\':\'executeStatsGreenIcon\'" style="margin-left: 3px;" title="{{tasksTableCtrl.tasksData[' + meta.row + '].onHold == false ?\'Hold Task\':\'Activate Task\'}}"  class="btn btn-circle buttonTaskAction" type="button" ng-click="tasksTableCtrl.chooseHoldActivate(' + meta.row + ')" ><i  class="fa fa-eject rotateEjectAwesome taskExecutionHoldButton" ></i> </button>';
                    // taskActions = taskActions +  '<a ng-if="tasksTableCtrl.tasksData[' + meta.row + '].onHold == true" style="margin-left: 3px;"  title="Activate Task" ng-click="tasksTableCtrl.activateTask(' + meta.row + ')"><span class="fa-stack fa-lg"><i style="color: green;" class="fa fa-circle-o fa-stack-2x"></i><i style="color: green;" class="fa fa-play fa-stack-1x"></i></span></a>';
                }
                if (full.task_status == "Active"){
                    taskActions = taskActions + '<button  style="margin-left: 3px;" title="Save As"  class="btn btn-circle buttonTaskAction" type="button" ng-click="tasksTableCtrl.saveAs(\'' + full.task_id + '\')" ><i  class="fa fa-floppy-o taskExecutionHoldButton" ></i> </button>';
                }
                taskActions = taskActions + '<button style="margin-left: 3px;" title="Task Execution History" class="btn btn-primary btn-circle buttonTaskAction" type="button" ng-click="tasksTableCtrl.taskExecutionSummary(\'' + full.task_id + '\')"><i class="fa fa-copy taskExecutionHistoryButton"></i></button>';

                return taskActions;
            };

            for (var i = 0; i < tasksTableCtrl.headers.length; i++) {
                if (tasksTableCtrl.headers[i].clickAble == true) {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (tasksTableCtrl.headers[i].type == 'date') {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else if (tasksTableCtrl.headers[i].type == 'to_char_date') {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(changeToLocalDateToChar));
                }
                else if (tasksTableCtrl.headers[i].column == 'selection_method') {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name).renderWith(selectionMethodColumn));
                }
                else {
                    tasksTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(tasksTableCtrl.headers[i].column).withTitle(tasksTableCtrl.headers[i].name));
                }
            }

            tasksTableCtrl.dtColumns.unshift(DTColumnBuilder.newColumn('taskActions').withTitle('').renderWith(taskActions));
            //try to comment out the line below

            var getTableData = function () {
                var deferred = $q.defer();
                angular.forEach(tasksTableCtrl.tasksData, function(task) {
                    if(task.load_entity && task.delete_before_load){
                        task.operation_mode = 'Delete and load entity ';
                    }
                    else if(task.load_entity && !task.delete_before_load){
                        task.operation_mode = 'Insert entity without delete';
                    }
                    else if(!task.load_entity && task.delete_before_load){
                        task.operation_mode = 'Delete entity without load';
                    }else{
                        task.operation_mode = '';
                    }
                });
                deferred.resolve(tasksTableCtrl.tasksData);
                return deferred.promise;
            };

            tasksTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [[11,'asc']])
                .withButtons([
                    {
                        extend: 'colvis',
                        text: 'Show/Hide columns',
                        columns: [7, 8, 9, 10, 11, 12, 13, 14, 15,16,17,18,19,20,21,22,23, 24, 25],
                        callback: function (columnIdx, visible) {
                            if (visible == true) {
                                var index = tasksTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index >= 0) {
                                    tasksTableCtrl.hideColumns.splice(index, 1);
                                }
                            }
                            else {
                                var index = tasksTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index < 0) {
                                    tasksTableCtrl.hideColumns.push(columnIdx);
                                }
                            }
                            $sessionStorage.taskTableHideColumns = tasksTableCtrl.hideColumns;
                        }
                    }
                ])
                .withOption("caseInsensitive", true)
                .withOption('search', {
                    "caseInsensitive": false
                })
                .withOption("fixedColumns", false);
                if (tasksTableCtrl.tasksData && tasksTableCtrl.tasksData.length > 0){
                    tasksTableCtrl.dtOptions.withLightColumnFilter({
                        1: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(1) >= 0 ? true : false)
                        },
                        2: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'task_type')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(2) >= 0 ? true : false)
                        },
                        3: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'version_ind')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(3) >= 0 ? true : false)
                        },
                        4: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'be_name')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(4) >= 0 ? true : false)
                        },
                        5: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'source_env_name')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(5) >= 0 ? true : false)
                        },
                        6: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'environment_name')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(6) >= 0 ? true : false)
                        },
                        7: {
                            type: 'select',
                            values: [
                                {
                                    value: "P",
                                    label: "Parameters"
                                },
                                {
                                    value: "R",
                                    label: "Random selection"
                                },
                                {
                                    value: "S",
                                    label: "Synthetic creation"
                                },
                                {
                                    value: "L",
                                    label: "Entity List"
                                },
                                {
                                    value: "ALL",
                                    label: "All"
                                },
                                {
                                    value: "REF",
                                    label: "Reference only"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(7) >= 0 ? true : false)
                        },
                        8: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(8) >= 0 ? true : false)
                        },
                        9: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'task_last_updated_by')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(9) >= 0 ? true : false)
                        },
                        10: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(10) >= 0 ? true : false)
                        },
                        11: {
                            type: 'select',
                            values: [
                                {
                                    value: "Inactive",
                                    label: "Inactive"
                                },
                                {
                                    value: "Active",
                                    label: "Active"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(11) >= 0 ? true : false)
                        },
                        12: {
                            type: 'select',
                            values: [
                                {
                                    value: "Active",
                                    label: "Active"
                                },
                                {
                                    value: "onHold",
                                    label: "onHold"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(12) >= 0 ? true : false)
                        },
                        13: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(13) >= 0 ? true : false)
                        },
                        14: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(14) >= 0 ? true : false)
                        },
                        15: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'retention_period_type')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(15) >= 0 ? true : false)
                        },
                        16: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(16) >= 0 ? true : false)
                        },
                        17: {
                            type: 'select',
                            values: [
                                {
                                    value: "true",
                                    label: "true"
                                },
                                {
                                    value: "false",
                                    label: "false"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(17) >= 0 ? true : false)
                        },
                        18: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'sync_mode')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(18) >= 0 ? true : false)
                        },
                        19: {
                            type: 'select',
                            values: [
                                {
                                    value: "Insert entity without delete",
                                    label: "Insert entity without delete"
                                },
                                {
                                    value: "Delete and load entity",
                                    label: "Delete and load entity"
                                },
                                {
                                    value: "Delete entity without load",
                                    label: "Delete entity without load"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(19) >= 0 ? true : false)
                        },
                        20: {
                            type: 'select',
                            values: [
                                {
                                    value: "true",
                                    label: "true"
                                },
                                {
                                    value: "false",
                                    label: "false"
                                }
                            ],
                            hidden: (tasksTableCtrl.hideColumns.indexOf(20) >= 0 ? true : false)
                        },
                        21: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'selected_version_task_name')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(21) >= 0 ? true : false)
                        },
                        22: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(22) >= 0 ? true : false)
                        },
                        23: {
                            type: 'select',
                            values: _.map(_.unique(_.map(tasksTableCtrl.tasksData, 'selected_ref_version_task_name')), function (el) {
                                return {value: el, label: el}
                            }),
                            hidden: (tasksTableCtrl.hideColumns.indexOf(23) >= 0 ? true : false)
                        },
                        24: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(24) >= 0 ? true : false)
                        },
                        25: {
                            type: 'text',
                            hidden: (tasksTableCtrl.hideColumns.indexOf(25) >= 0 ? true : false)
                        }
                    });
                }

            tasksTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(tasksTableCtrl.dtInstance)) {
                    tasksTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(tasksTableCtrl.dtInstance)) {
                    tasksTableCtrl.dtInstance = dtInstance;
                }
            };
            if (tasksTableCtrl.dtInstance.changeData != null)
                tasksTableCtrl.dtInstance.changeData(getTableData());

                $timeout(() => {
                    tasksTableCtrl.loadingTable = false;
                  });
           
        });


        tasksTableCtrl.openTask = function (taskId,copy) {
            if ($scope.content.openTask) {
                var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(taskId)});
                if (taskData) {
                    $scope.content.openTask(taskData,copy);
                    return;
                }
            }
            //TODO show error ??
        };

        tasksTableCtrl.openNewTask = function () {
            if ($scope.content.openNewTask) {
                $scope.content.openNewTask(tasksTableCtrl.tasksData);
                return;
            }
            //TODO show error ??
        };

        tasksTableCtrl.taskExecutionHistory = function (taskId) {
            if ($scope.content.openTaskHistory) {
                var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(taskId)});
                if (taskData) {
                    $scope.content.openTaskHistory(taskData);
                    BreadCrumbsService.push({title: taskData.task_title}, 'TASK_EXECUTION_HISTORY', function () {
                        $scope.content.openTaskHistory(taskData);
                    });
                    return;
                }
            }
        };

        tasksTableCtrl.taskExecutionSummary = function (taskId) {
            if ($scope.content.openTaskSummary) {
                var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(taskId)});
                if (taskData) {
                    $scope.content.openTaskSummary(taskData);
                    BreadCrumbsService.push({title: taskData.task_title}, 'TASK_EXECUTION_SUMMARY', function () {
                        $scope.content.openTaskSummary(taskData);
                    });
                    return;
                }
            }
        };


        tasksTableCtrl.executeTask = function (index) {
            let task = tasksTableCtrl.tasksData[index];
            let taskId = task.task_id;
            let testers = task.testers;
            let roles = task.roles || [];
            let owners = task.owners;
            let task_title = task.task_title;
            let task_created_by = task.task_created_by;

            let testerCanRunTask = () => {
                let canRun = false;

                if (!testers || !roles) return canRun;

                let loggedUser = tasksTableCtrl.username;

                for (i of testers) {
                    if (i.tester === loggedUser || i.tester === 'ALL') {
                      if (angular.isArray(i.role_id)) {
                          for (id of i.role_id) {
                              let foundRole = _.find(roles[0], {role_id: id});
                              if (foundRole && foundRole.allowed_test_conn_failure) {
                                  canRun = true;
                              }
                          }
                      }
                    }
                }

                return canRun;
            };

            let forced =
                tasksTableCtrl.userRole.type == 'admin' || (owners && owners.indexOf(tasksTableCtrl.username) >= 0)
                ||  testerCanRunTask() ? true : false;

            tasksTableCtrl.tasksData[index].disabled = true;

            TDMService.executeTask(taskId).then(function (response) {
                if (response.errorCode == 'SUCCESS') {
                    tasksTableCtrl.tasksData[index].executioncount = 1;
                    toastr.success("Task # " + task_title, " Successfully started");
                    tasksTableCtrl.dtInstance.reloadData(function (data) {
                    }, true);
                    tasksTableCtrl.taskExecutionSummary(taskId);
                }
                else {
                    if (!forced) {
                        toastr.error("Task # " + task_title, response.message);
                    } else {
                        SweetAlert.swal({
                                title: `${response.message}. Do you want to proceed with the task execution?`,
                                text: '',
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
                                    TDMService.executeTask(taskId, forced).then(function (response) {
                                        if (response.errorCode == 'SUCCESS') {
                                            tasksTableCtrl.tasksData[index].executioncount = 1;
                                            toastr.success("Task # " + task_title, " Successfully started");
                                            tasksTableCtrl.dtInstance.reloadData(function (data) {
                                            }, true);
                                            tasksTableCtrl.taskExecutionSummary(taskId);
                                        } else {
                                            if (!forced) {
                                                toastr.error("Task # " + task_title, response.message);
                                            }
                                        }
                                    })
                                }
                            });
                    }
                }
                tasksTableCtrl.tasksData[index].disabled = false;
            });
        };

        tasksTableCtrl.holdTask = function (index) {
            TDMService.holdTask(tasksTableCtrl.tasksData[index].task_id).then(function (response) {
                if (response.errorCode == 'SUCCESS') {
                    tasksTableCtrl.tasksData[index].task_execution_status = 'onHold';
                    toastr.success("Task # " + tasksTableCtrl.tasksData[index].task_title, " was Holded");
                    tasksTableCtrl.tasksData[index].onHold = true;
                    tasksTableCtrl.dtInstance.reloadData(function (data) {
                    }, true);
                }
                else {
                    toastr.error("Task # " + task_title, "Failed to hold");
                }
            });
        };

        $scope.getRunningTasks = function () {
            TDMService.getRunningTasks().then(function (response) {
                var sumRunning = 0;
                var sumAll = 0;

                if (response.errorCode == 'SUCCESS') {
                    tasksTableCtrl.tasksData = _.map(tasksTableCtrl.tasksData, function (task) {
                        task.executioncount = 0;
                        sumAll++;
                        return task;
                    });

                    for (var i = 0; i < response.result.length; i++) {
                        var task = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(response.result[i])});
                        if (task) {
                            sumRunning++;
                            task.executioncount = 1;
                        }
                    }

                    if (response.result.toString() !== tasksTableCtrl.prevRunningTasksId) {
                        tasksTableCtrl.prevRunningTasksId = response.result.toString();
                        if (tasksTableCtrl.dtInstance) {
                            tasksTableCtrl.dtInstance.reloadData(function (data) {
                            }, false);
                        }
                    }
                }
            });
        };
        tasksTableCtrl.activateTask = function (index) {
            TDMService.activateTask(tasksTableCtrl.tasksData[index].task_id).then(function (response) {
                if (response.errorCode == 'SUCCESS') {
                    tasksTableCtrl.tasksData[index].task_execution_status = 'Active';
                    toastr.success("Task # " + tasksTableCtrl.tasksData[index].task_title, " was activated");
                    tasksTableCtrl.tasksData[index].onHold = false;
                    tasksTableCtrl.dtInstance.reloadData(function (data) {
                    }, true);
                }
                else {
                    toastr.error("Task # " + task_title, "Failed to activate");
                }
            });
        }

        tasksTableCtrl.saveAs = function(task_id){
            console.log("Save As check");
            var taskData = _.find(tasksTableCtrl.tasksData, {task_id: parseInt(task_id)});
            if (!taskData){
                return;
            }
            TDMService.postGenericAPI('checkSaveTaskAs',{
                task_id : taskData.task_id,
                environment_id : taskData.environment_id,
                source_environment_id : taskData.source_environment_id,
                taskData : taskData
            }).then(function(response){
                if (response.errorCode == "FAIL"){
                    toastr.error(response.message, "The task cannot be copied.");
                    return;
                }
                tasksTableCtrl.openTask(taskData.task_id,true);
            });
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        link: function (scope, element) {
            var updateData = $interval(function () {
                scope.getRunningTasks();
            }, TASK.timeInterval);
            element.on('$destroy', function () {
                $interval.cancel(updateData);
            });
        },
        controller: controller,
        controllerAs: 'tasksTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('tasksTableDirective', tasksTableDirective);