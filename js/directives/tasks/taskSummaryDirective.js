function taskSummaryDirective() {

    const template = "views/tasks/taskSummary.html";
    //var interval_runnning_flag = false;
    var taskId;
    var currentTaskId;

    var controller = function ($scope, $rootScope, BreadCrumbsService, $compile, $timeout, TDMService, AuthService,
                               DTColumnBuilder, DTOptionsBuilder, DTColumnDefBuilder, $q, $sessionStorage, ExcelService, toastr, $interval, $uibModal) {
        var taskSummaryCtrl = this;
        var updateData = function(){
            if ($scope.content.pageDisplay !== 'taskSummary'){
                return;
            };
            TDMService.getSummaryTaskHistory(taskSummaryCtrl.taskData.task_id).then(function (response) {
                if (response.errorCode != 'SUCCESS') {
                    //TODO show Error
                    return;
                }
                var foundRunning = _.find(response.result,function(exec) {
                    if (exec.execution_status !== 'completed' && exec.execution_status !== 'failed') {
                        return true;
                    }
                    return false;
                });
                response.result.sort((a, b) => {
                    if (a.task_execution_id < b.task_execution_id) {
                        return 1;
                    }
                    if (a.task_execution_id > b.task_execution_id) {
                        return -1;
                    }
                    return 0;
                });

                taskSummaryCtrl.taskHistoryData = response.result;
                if (taskSummaryCtrl.dtInstance && taskSummaryCtrl.dtInstance.reloadData){
                    taskSummaryCtrl.dtInstance.reloadData(function (data) {
                    }, false);
                }

                if (!foundRunning){
                    $interval.cancel(taskSummaryCtrl.stopInterval);
                }
            });
        };
        taskSummaryCtrl.taskData = $scope.content.task;

        taskSummaryCtrl.stopInterval = $interval(function(){
            updateData();
        },7000);

        taskSummaryCtrl.loadingTable = true;
        // taskSummaryCtrl.userRole = AuthService.getRole();
        //taskSummaryCtrl.username = AuthService.getUsername();
        //taskSummaryCtrl.TDMReports = AuthService.getTDMReports();

        // BreadCrumbsService.breadCrumbChange(2);

        taskSummaryCtrl.openTask = function (exec_id) {
            $scope.content.exec_id = exec_id;
            if ($scope.content.openTaskHistory) {
                if (taskSummaryCtrl.taskData) {
                   // $scope.content.openTaskHistory(taskSummaryCtrl.taskData, exec_id);
                    var breadCrumb = 'TASK_EXECUTION_HISTORY';
                    var breadCrumbs = BreadCrumbsService.getAll();
                    if (breadCrumbs[breadCrumbs.length-1].name === breadCrumb) {
                        return;;
                    }
                    BreadCrumbsService.push({
                        execId: exec_id,
                        title: taskSummaryCtrl.taskData.task_title
                    }, breadCrumb, function () {
                        $scope.content.openTaskHistory(taskSummaryCtrl.taskData, exec_id);
                    });

                    $scope.content.pageDisplay = 'taskHistory';
                    return;
                }
            }
        }

        taskSummaryCtrl.moveToHistoryIfRunningTask = execs => {
            if (!execs) {
                return;
            }
            for (execution of execs) {
                if (execution.execution_status.toLowerCase() == 'running' || execution.execution_status.toLowerCase() == 'pending') {
                    taskSummaryCtrl.openTask(execution.task_execution_id);
                    break;
                }
            }
        };

        var buildTable = function(){

        };

        TDMService.getSummaryTaskHistory(taskSummaryCtrl.taskData.task_id).then(function (response) {
            if (response.errorCode != 'SUCCESS') {
                //TODO show Error
                return;
            }

            response.result.sort((a, b) => {
                    if (a.task_execution_id < b.task_execution_id) {
                        return 1;
                    }
                    if (a.task_execution_id > b.task_execution_id) {
                        return -1;
                    }
                    return 0;
                }
            )

            taskSummaryCtrl.moveToHistoryIfRunningTask(response.result);

            taskSummaryCtrl.taskHistoryData = response.result;

            currentTaskId = taskSummaryCtrl.taskData.task_id;

            taskSummaryCtrl.dtInstance = {};
            taskSummaryCtrl.dtColumns = [];
            taskSummaryCtrl.headers = [
                {
                    column: 'task_execution_id',
                    name: 'Task Execution Id',
                    clickable: true
                },
                {
                    column: 'execution_status',
                    name: 'Execution Status',
                    clickable: false
                },
                {
                    column: 'source_env_name',
                    name: 'Source Environment Name',
                    clickable: false
                },
                {
                    column: 'environment_name',
                    name: 'Target Environment Name',
                    clickable: false
                },
                {
                    column: 'task_executed_by',
                    name: 'Task Executed By',
                    clickable: false
                },
                {
                    column: 'be_name',
                    name: 'Business Entity Name',
                    clickable: false
                },
                {
                    column: 'tot_num_of_processed_root_entities',
                    name: 'Total Number Of Processed Entities',
                    clickable: false
                },
                {
                    column: 'tot_num_of_copied_root_entities',
                    name: 'Number Of Copied Entities',
                    clickable: false
                },
                {
                    column: 'tot_num_of_failed_root_entities',
                    name: 'Number Of Failed Entities',
                    clickable: false
                },
                {
                    column: 'tot_num_of_processed_ref_tables',
                    name: 'Total Number Of Processed Reference Tables',
                    clickable: false
                },
                {
                    column: 'tot_num_of_copied_ref_tables',
                    name: 'Number Of Copied Reference Tables',
                    clickable: false
                },
                {
                    column: 'tot_num_of_failed_ref_tables',
                    name: 'Number Of Failed Reference Tables',
                    clickable: false
                },
                {
                    column: 'tot_num_of_processed_post_executions',
                    name: 'Total Number Of Processed Post Executions',
                    clickable: false
                },
                {
                    column: 'tot_num_of_succeeded_post_executions',
                    name: 'Total Number Of Succeeded Post Executions',
                    clickable: false
                },
                {
                    column: 'tot_num_of_failed_post_executions',
                    name: 'Total Number Of Failed Post Executions',
                    clickable: false
                }
            ];

            taskSummaryCtrl.dtColumnDefs = [];

            if ($sessionStorage.taskSummaryTableHideColumns) {
                taskSummaryCtrl.hideColumns = $sessionStorage.taskSummaryTableHideColumns;
            }
            else {
                taskSummaryCtrl.hideColumns = [];
            }
            for (var i = 0; i < taskSummaryCtrl.hideColumns.length; i++) {
                var hideColumn = DTColumnDefBuilder.newColumnDef(taskSummaryCtrl.hideColumns[i])
                    .withOption('visible', false);
                //try to comment out the line below
                taskSummaryCtrl.dtColumnDefs.push(hideColumn);
            }

            var changeToLocalDate = function (data, type, full, meta) {
                if (data) {
                    return moment(data).format('DD MMM YYYY, HH:mm:ss');
                }
                return '';
            };

            var taskHistoryActions = function (data, type, full, meta) {
                return '<a ng-click="taskSummaryCtrl.downloadSummaryReport(\'' + full.task_execution_id + '\')"  style="margin-left: 5px;border-color: transparent;background-color: transparent; color: black;" title="Download Summary Report"><i class="fa fa-file-excel-o"></i> </a>';
            };


            var clickableCol = (data, type, full) => '<a ng-click="taskSummaryCtrl.openTask(\'' + full.task_execution_id + '\')">' + data + '</a>';

            for (var i = 0; i < taskSummaryCtrl.headers.length; i++) {
                if (taskSummaryCtrl.headers[i].clickable) {
                    taskSummaryCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskSummaryCtrl.headers[i].column).withTitle(taskSummaryCtrl.headers[i].name).renderWith(clickableCol));
                } else if (taskSummaryCtrl.headers[i].date == true) {
                    taskSummaryCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskSummaryCtrl.headers[i].column).withTitle(taskSummaryCtrl.headers[i].name).renderWith(changeToLocalDate));
                } else {
                    taskSummaryCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskSummaryCtrl.headers[i].column).withTitle(taskSummaryCtrl.headers[i].name));
                }
            }

            taskSummaryCtrl.dtColumns.unshift(DTColumnBuilder.newColumn('taskHistoryActions').withTitle('').renderWith(taskHistoryActions).withOption('width', '50'));

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskSummaryCtrl.taskHistoryData);
                return deferred.promise;
            };

            taskSummaryCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('paging', true)
                .withOption('order', [0, 'desc'])
                .withOption('scrollX', false)
                .withButtons([
                    {
                        extend: 'colvis',
                        text: 'Show/Hide columns',
                        columns: [ 10, 11, 12, 13, 14, 15],
                        callback: function (columnIdx, visible) {
                            if (visible == true) {
                                var index = taskSummaryCtrl.hideColumns.indexOf(columnIdx);
                                if (index >= 0) {
                                    taskSummaryCtrl.hideColumns.splice(index, 1);
                                }
                            }
                            else {
                                var index = taskSummaryCtrl.hideColumns.indexOf(columnIdx);
                                if (index < 0) {
                                    taskSummaryCtrl.hideColumns.push(columnIdx);
                                }
                            }
                            $sessionStorage.taskSummaryTableHideColumns = taskSummaryCtrl.hideColumns
                        }
                    }
                ]);

            taskSummaryCtrl.downloadSummaryReport = function (execId) {
                TDMService.getSummaryReport(execId, 'ALL').then(function (response) {
                    if (response.errorCode == "FAIL"){
                        return;
                    }
                    var workbook = ExcelService.buildSummaryExcel(response.result);
                    workbook.xlsx.writeBuffer()
                    .then(function(data) {
                        var fileName = `${taskSummaryCtrl.taskData.task_title}_Summary_Execution_Report_EXECID_${execId}.xlsx`;
                        var a = document.createElement('a');
                        document.body.appendChild(a);
                        a.style = 'display: none';
                        var file = new Blob([data], {type: 'application/vnd.ms-excel'});
                        var fileURL = (window.URL || window.webkitURL).createObjectURL(file);
                        a.href = fileURL;
                        a.download = fileName;
                        a.click();
                        (window.URL || window.webkitURL).revokeObjectURL(file);
                    });
                });
            };

            taskSummaryCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(taskSummaryCtrl.dtInstance)) {
                    taskSummaryCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(taskSummaryCtrl.dtInstance)) {
                    taskSummaryCtrl.dtInstance = dtInstance;
                }
            };
            if (taskSummaryCtrl.dtInstance.changeData != null)
                taskSummaryCtrl.dtInstance.changeData(getTableData());

                $timeout(() => {
                    taskSummaryCtrl.loadingTable = false;
                  });

           
        });


    };

    return {
        restrict: "EA",
        templateUrl: template,
        scope: {
            content: '='
        },
        link: function (scope, element, attr) {

        },
        controller: controller,
        controllerAs: 'taskSummaryCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('taskSummaryDirective', taskSummaryDirective);
