function taskHistoryDirective($interval) {

    const template = "views/tasks/tasksHistoryTable.html";
    //var interval_runnning_flag = false;
    var taskId;
    var currentTaskId;

    var controller = function ($scope, $rootScope, BreadCrumbsService, $compile, $timeout, TDMService, AuthService,
        DTColumnBuilder, DTOptionsBuilder, DTColumnDefBuilder, $q, $sessionStorage, $http, toastr, $interval, $uibModal, ExcelService) {
        var taskHistoryTableCtrl = this;
        taskHistoryTableCtrl.taskData = $scope.content.task;
        taskHistoryTableCtrl.loadingTable = true;
        $rootScope.inter_flag = false;
        taskHistoryTableCtrl.userRole = AuthService.getRole();
        taskHistoryTableCtrl.username = AuthService.getUsername();
        taskHistoryTableCtrl.TDMReports = AuthService.getTDMReports();
        taskHistoryTableCtrl.enableStopExecution = false;

        if (taskHistoryTableCtrl.taskData.task_status == "Active" &&
            (taskHistoryTableCtrl.userRole.type == 'admin' || taskHistoryTableCtrl.taskData.owners.indexOf(taskHistoryTableCtrl.username) >= 0 || taskHistoryTableCtrl.username == taskHistoryTableCtrl.taskData.task_created_by )) {
            taskHistoryTableCtrl.enableStopExecution = true;
        }

        taskHistoryTableCtrl.disableAccessingStatistics = taskHistoryTableCtrl.taskData.disabled || taskHistoryTableCtrl.taskData.onHold || taskHistoryTableCtrl.taskData.executioncount ? true : false;

        TDMService.getTaskHistory($scope.content.exec_id).then(function (response) {
            if (response.errorCode != 'SUCCESS') {
                //TODO show Error
                return;
            }

            taskHistoryTableCtrl.taskType = "LOAD";
            if (response.result && response.result.length > 0){
                taskHistoryTableCtrl.taskType = response.result[0].task_type || "LOAD";
            }
            
            taskHistoryTableCtrl.runningExecutions = [];

            var pendingTasks = false;
            taskHistoryTableCtrl.taskHistoryData = _.filter(response.result, function (execution) {
                if (!execution.execution_status) {
                    return true;
                }
                if (execution.execution_status.toUpperCase() == 'RUNNING' || execution.execution_status.toUpperCase() == "EXECUTING"
                    || execution.execution_status.toUpperCase() == "STARTED" || execution.execution_status.toUpperCase() == "STARTEXECUTIONREQUESTED") {
                    taskHistoryTableCtrl.runningExecutions.push(execution);
                    taskHistoryTableCtrl.runningExecution = execution.task_execution_id;
                    return false;
                }
                else if (execution.execution_status.toUpperCase() == 'PENDING' || execution.execution_status.toUpperCase() == 'PAUSED') {
                    taskHistoryTableCtrl.runningExecution = execution.task_execution_id;
                }
                if (execution.execution_status.toUpperCase() == 'PENDING'){
                    pendingTasks = true;
                }
                return true;
            });

            if (taskHistoryTableCtrl.runningExecutions.length == 0){
                if (taskHistoryTableCtrl.ExtractRefStatsStarted){
                    $timeout.cancel(taskHistoryTableCtrl.ExtractRefStatsStarted);
                    taskHistoryTableCtrl.ExtractRefStatsStarted = null;
                }
            }

            if (pendingTasks && taskHistoryTableCtrl.runningExecutions.length == 0){
                $timeout(function () {
                    $rootScope.$broadcast('refreshPage', true);
                }, 10000);
            }

            taskHistoryTableCtrl.taskHistoryData = _.sortBy(taskHistoryTableCtrl.taskHistoryData, function (value) {
                return (value.task_execution_id * -1);
            });
            taskHistoryTableCtrl.executionIds = _.map(taskHistoryTableCtrl.runningExecutions, function (execution) {
                return {
                    name: execution.lu_name || execution.process_name,
                    etl_execution_id: execution.etl_execution_id,
                    etl_ip_address: execution.etl_ip_address,
                    fabric_execution_id : execution.fabric_execution_id,
                    task_execution_id : execution.task_execution_id
                }
            });

            taskHistoryTableCtrl.disableAccessingStatistics = taskHistoryTableCtrl.executionIds.length ? true : false;

            taskHistoryTableCtrl.reloadData = function () {
                taskHistoryTableCtrl.runningExecution = null;
                taskHistoryTableCtrl.runningExecutions = [];
                TDMService.getTaskHistory($scope.content.exec_id).then(function (response) {
                    if (response.errorCode != 'SUCCESS') {
                        //TODO show Error
                        return;
                    }
                    let pendingTasks = false;
                    taskHistoryTableCtrl.taskHistoryData = _.filter(response.result, function (execution) {
                        if (execution.execution_status.toUpperCase() == 'RUNNING' || execution.execution_status.toUpperCase() == "EXECUTING"
                            || execution.execution_status.toUpperCase() == "STARTED" || execution.execution_status.toUpperCase() == "STARTEXECUTIONREQUESTED") {
                            taskHistoryTableCtrl.runningExecution = execution.task_execution_id;
                            taskHistoryTableCtrl.runningExecutions.push(execution);
                            return false;
                        }
                        else if (execution.execution_status.toUpperCase() == 'PENDING' || execution.execution_status.toUpperCase() == 'PAUSED') {
                            taskHistoryTableCtrl.runningExecution = execution.task_execution_id;
                            // taskHistoryTableCtrl.runningExecutions.push(execution);
                        }
                        if (execution.execution_status.toUpperCase() == 'PENDING'){
                            pendingTasks = true;
                        }
                        return true;
                    });

                    if (pendingTasks && taskHistoryTableCtrl.runningExecutions.length == 0){
                        $timeout(function () {
                            $rootScope.$broadcast('refreshPage', true);
                        }, 10000);
                    }
                    taskHistoryTableCtrl.executionIds = _.map(taskHistoryTableCtrl.runningExecutions, function (execution) {
                        return {
                            name: execution.lu_name || execution.process_name,
                            etl_execution_id: execution.etl_execution_id,
                            etl_ip_address: execution.etl_ip_address,
                            fabric_execution_id : execution.fabric_execution_id,
                            task_execution_id : execution.task_execution_id
                        }
                    });
                    taskHistoryTableCtrl.taskHistoryData = _.sortBy(taskHistoryTableCtrl.taskHistoryData, function (value) {
                        return (value.task_execution_id * -1);
                    });
                    taskHistoryTableCtrl.dtInstance.reloadData(function (data) {
                    }, false);
                });
            };

            taskHistoryTableCtrl.stopExecution = function (executionId) {
                    if (taskHistoryTableCtrl.executionIds.length == 0){
                        return;
                    }
                    TDMService.postGenericAPI('cancelMigratWS',{
                        taskExecutionId : taskHistoryTableCtrl.executionIds[0].task_execution_id
                    }).then(function(response){
                        taskHistoryTableCtrl.executionIds = [];
                        $timeout(function () {
                            getTableData();
                            taskHistoryTableCtrl.reloadData();
                        }, 5000);
                    });
                // }
            };

            taskHistoryTableCtrl.startExtractRefStatsDetailed = function(type, lu_name){
                if (!taskHistoryTableCtrl.executionIds || taskHistoryTableCtrl.executionIds.length == 0){
                    return;
                }
                let stopInterval;
                var task_execution_id = taskHistoryTableCtrl.executionIds[0].task_execution_id;
                $uibModal.open({
                    templateUrl: 'views/tasks/taskHistoryRefModal.html',
                    windowTopClass : "taskHistoryRef",
                    controller: function ($scope, $uibModalInstance, TDMService) {
                        var taskHistoryRefCtrl = this;
                        taskHistoryRefCtrl.getExtractRefStats = function(){
                            TDMService.postGenericAPI('extractrefstats',{
                                taskExecutionId : task_execution_id,
                                type : 'D'
                            }).then(function(response){
                                taskHistoryRefCtrl.refDetailedData = _.map(response.result || [],function(refData){
                                    if (refData.number_of_records_to_process > 0){
                                        refData.percentageOfCompleted = refData.number_of_processed_records / (refData.number_of_records_to_process) * 100;
                                    }
                                    return refData;
                                }); 
                                taskHistoryRefCtrl.refDetailedData = _.filter(taskHistoryRefCtrl.refDetailedData,function(data){
                                    if (!(data && data.lu_name === lu_name)) {
                                        return false;
                                    }
                                    if (type == "failed"){
                                        if (data.execution_status == "failed"){
                                            return true;
                                        }
                                        return false;
                                    }
                                    if (type != "failed"){
                                        if (data.execution_status == "failed"){
                                            return false;
                                        }
                                        return true;
                                    }
                                });
                            });   
                        }
                        
                        stopInterval = $interval(function(){
                            taskHistoryRefCtrl.getExtractRefStats();
                        },10000);

                        taskHistoryRefCtrl.getExtractRefStats();

                        taskHistoryRefCtrl.close = function (){
                            $uibModalInstance.close();
                        };
                    },
                    controllerAs: 'taskHistoryRefCtrl'
                }).result.then(function () {
                    if (stopInterval){
                        $interval.cancel(stopInterval);
                    }
                }, function () {
                    if (stopInterval){
                        $interval.cancel(stopInterval);
                    }
                   });

            }

            taskHistoryTableCtrl.resumeExecution = function(migrateId,task_execution_id){
                if (task_execution_id){
                    TDMService.postGenericAPI('resumeMigratWS',{
                        taskExecutionId : task_execution_id,
                    }).then(function(response){
                        toastr.success("Task Execution # " + task_execution_id, " Successfully Resumed");
                        $timeout(function () {
                            $rootScope.$broadcast('refreshPage', true);
                        }, 5000);
                    });
                }
            }

            taskHistoryTableCtrl.setReloadInterval = function (reloadInterval) {

                var time = (reloadInterval * 1000);
                console.log("setting new reload interval: ", time);
                // localStorage.setItem(AuthService.getUsername(), time);
                $rootScope.reload_interval = time;
                taskHistoryTableCtrl.reload_interval = time;
            };

            //*************************************************************************

            var reload_interval = $rootScope.reload_interval;
            currentTaskId = taskHistoryTableCtrl.taskData.task_id;

            function reload_func() {
                TDMService.getTaskHistory($scope.content.exec_id).then(function (response) {
                    if (response.errorCode != 'SUCCESS') {
                        //TODO show Error
                        return;
                    }
                    taskHistoryTableCtrl.taskHistoryData = _.filter(response.result, function (execution) {
                        if (execution.execution_status.toUpperCase() == 'RUNNING' || execution.execution_status.toUpperCase() == "EXECUTING"
                            || execution.execution_status.toUpperCase() == "STARTED" || execution.execution_status.toUpperCase() == "STARTEXECUTIONREQUESTED") {
                            return false;
                        }
                        return true;
                    });
                    taskHistoryTableCtrl.taskHistoryData = _.sortBy(taskHistoryTableCtrl.taskHistoryData, function (value) {
                        return (value.task_execution_id * -1);
                    });
                    taskHistoryTableCtrl.dtInstance.reloadData(function (data) {
                    }, false);
                });

                $rootScope.$broadcast('refreshPage', true);
            }

            var intervalFunc = function () {
                clearInterval(interval);

                reload_interval = $rootScope.reload_interval;
                if ($rootScope.inter_flag) {

                    interval = setInterval(intervalFunc, reload_interval);
                }
                else {
                    reload_func();
                    interval = setInterval(intervalFunc, reload_interval);
                }
            };

            // if (!interval_runnning_flag) {
            //
            //      var interval = setInterval(intervalFunc, reload_interval);
            //      interval_runnning_flag = true;
            // }

            //*************************************************************************

            taskHistoryTableCtrl.reload_interval = $rootScope.reload_interval;

            taskHistoryTableCtrl.getExtractTaskRefData = function(task_execution_id,type,lu_name){
                return new Promise((function(resolve,reject) {
                    TDMService.postGenericAPI('extractrefstats',{
                        taskExecutionId : task_execution_id,
                        type : type
                    }).then(function(response){
                        if (type === 'D') {
                            if (response.result && response.result && response.result){
                                response.result = _.filter (response.result,function(row) {
                                    row['start_time(UTC)'] = row.start_time;
                                    row['end_time(UTC)'] = row.end_time;
                                    delete row.start_time;
                                    delete row.end_time;
                                    if (row && row.lu_name === lu_name) {
                                        return true;
                                    }
                                    return false;
                                });
                            }
                        }
                        else if (type === 'S'){
                            response.result = response.result[lu_name];
                        }
                        resolve(response);
                    }).catch(function(err) {
                        reject(err);
                    });
                }));
            };


            taskHistoryTableCtrl.downloadExtractReport = function(type,migrateId,logicalUnit,taskExecutionId){
                var types = [type,'H'];
                if (type == 'D'){
                    types.push('S');
                }
                if (migrateId != "null"){
                    TDMService.postGenericAPI('migrateStatusWs',{
                        migrateId : migrateId,
                        runModes : types
                    }).then(function(response){
                        if (type == 'S'){
                            var data = $scope.buildSummaryData(response.result,migrateId,logicalUnit);
                            var taskExecution = _.find(taskHistoryTableCtrl.taskHistoryData,{ task_execution_id:taskExecutionId.toString(), lu_name: logicalUnit});
                            if (taskExecution && (taskExecution.selection_method == "REF" || taskExecution.refcount > 0)){
                                return taskHistoryTableCtrl.getExtractTaskRefData(taskExecution.task_execution_id, type, logicalUnit).then(function(response){
                                    data = Object.assign(data,response.result);
                                    data.reference = true;
                                    $scope.buildHtml('summary',data);
                                });
                            }
                            else{
                                $scope.buildHtml('summary',data);
                            }
                        }
                        else if (type == 'D'){
                            var data = $scope.buildDetailedData(response.result,migrateId,logicalUnit);
                            var taskExecution = _.find(taskHistoryTableCtrl.taskHistoryData,{ task_execution_id:taskExecutionId.toString(), lu_name: logicalUnit});
                            if (taskExecution && (taskExecution.selection_method == "REF" || taskExecution.refcount > 0)){
                                return taskHistoryTableCtrl.getExtractTaskRefData(taskExecution.task_execution_id, type, logicalUnit).then(function(response){
                                    data = Object.assign(data,{refData : response.result});
                                    data.reference = true;
                                    $scope.buildHtml('detailed',data);
                                });
                            }
                            else{
                                $scope.buildHtml('detailed',data);
                            }
                        }
                    });
                } 
                else{
                    var taskExecution = _.find(taskHistoryTableCtrl.taskHistoryData,{ task_execution_id:taskExecutionId.toString(), lu_name: logicalUnit})
                    if (taskExecution && (taskExecution.selection_method == "REF" || taskExecution.refcount > 0)){
                        return taskHistoryTableCtrl.getExtractTaskRefData(taskExecution.task_execution_id, type, logicalUnit).then(function(response){
                            response.result.reference = true;
                            $scope.buildHtml(type == 'S' ? 'summary' : 'detailed',type == 'S' ? response.result : {refData : response.result});
                        });
                    }
                }  
            }

            $scope.buildDetailedData = function(detailedData,migrateId,logicalUnit){
                var data = {
                    migrateId : migrateId,
                    logicalUnit : logicalUnit,
                    userName : taskHistoryTableCtrl.username,
                    rows : [],
                    columns : [],
                    nodeList : []
                };
                if (detailedData && detailedData.S){
                    for (var i = 0;i < detailedData.S.results.length ; i++){
                        if (detailedData.S.results[i].columns.Level == "Cluster"){
                            data.status = detailedData.S.results[i].columns.Status;
                        }
                        if (detailedData.S.results[i].columns.Level == "Node"){
                            data.nodeList.push(detailedData.S.results[i].columns.Name);
                        }
                    }
                }
                if (detailedData && detailedData.H){
                    data.migrateCommand = detailedData.H["Migration Command"];
                }
                if (detailedData && detailedData.D){
                    data.columns = detailedData.D.columnsNames;
                    data.rows = _.map(detailedData.D.results,'columns');
                }
                return data;
            }

            $scope.buildHtml = function(title,data){
                $http({
                    method: 'GET',
                    url: '/views/staticHtmls/'+ title +'.html'
                  }).then(function successCallback(response) {
                        var htmlData = response.data;
                        htmlData = htmlData.replaceAll("{{migration}}",data.migrateId ? 'block' : 'none');
                        htmlData = htmlData.replaceAll("{{reference}}",data.reference ? 'block' : 'none');
                        htmlData = htmlData.replaceAll("{{migrateId}}",data.migrateId);
                        htmlData = htmlData.replaceAll("{{migrateCommand}}",data.migrateCommand);
                        htmlData = htmlData.replaceAll("{{status}}",data.status);
                        htmlData = htmlData.replaceAll("{{userName}}",data.userName);
                        htmlData = htmlData.replaceAll("{{logicalUnit}}",data.logicalUnit);
                        htmlData = htmlData.replaceAll("{{nodeList}}",data.nodeList);
                        htmlData = htmlData.replaceAll("{{numOfProcessedRefTables}}",data.numOfProcessedRefTables);
                        htmlData = htmlData.replaceAll("{{numOfFailedRefTables}}",data.numOfFailedRefTables);
                        htmlData = htmlData.replaceAll("{{numOfCopiedRefTables}}",data.numOfCopiedRefTables);
                        htmlData = htmlData.replaceAll("{{minStartExecutiobnDate}}",data.minStartExecutionDate);
                        htmlData = htmlData.replaceAll("{{maxEndExecutiobnDate}}",data.maxEndExecutionDate);
                        var rowData = '<tr>';
                        if (data.columns){
                            for (var i = 0;i < data.columns.length ; i++){
                                rowData = rowData  + '<th>' + data.columns[i] + '</th>';    
                            }
                            rowData = rowData + '</tr>';
                            for (var i = 0;i < data.rows.length ; i++){
                                rowData = rowData + '<tr>';
                                for (var j = 0;j < data.columns.length ; j++){
                                    rowData = rowData + '<th>' + data.rows[i][data.columns[j]] + '</th>';   
                                }
                                rowData = rowData + '</tr>';
                            }
                        }
                        else{
                            rowData = '<tr></tr>'
                        }
                        var rowDataRef = '<tr>';
                        if (data.refData && data.refData.length > 0){
                            var columns = [];
                            for (var key in data.refData[0]){
                                rowDataRef = rowDataRef  + '<th>' + key + '</th>';    
                                columns.push(key);
                            }
                            rowDataRef = rowDataRef + '</tr>';
                            for (var i = 0;i < data.refData.length ; i++){
                                rowDataRef = rowDataRef + '<tr>';
                                for (var j = 0;j < columns.length ; j++){
                                    rowDataRef = rowDataRef + '<th>' + data.refData[i][columns[j]] + '</th>';   
                                }
                                rowDataRef = rowDataRef + '</tr>';
                            }
                        }
                        else{
                            rowDataRef = '<tr></tr>'
                        }

                        htmlData = htmlData.replaceAll("{{dataRows}}",rowData);
                        htmlData = htmlData.replaceAll("{{dataRowsReference}}",rowDataRef);
                        $scope.downloadHtml(htmlData, title + ".html");
                    });
            }

            $scope.buildSummaryData = function(summaryData,migrateId,logicalUnit){
                var data = {
                    migrateId : migrateId == "null" ? null : migrateId,
                    logicalUnit : logicalUnit,
                    userName : taskHistoryTableCtrl.username,
                    rows : [],
                    columns : [],
                    nodeList : []
                };
                if (summaryData && summaryData.S){
                    data.columns = summaryData.S.columnsNames;
                    for (var i = 0;i < summaryData.S.results.length ; i++){
                        if (summaryData.S.results[i].columns.Level == "Cluster"){
                            data.status = summaryData.S.results[i].columns.Status;
                        }
                        if (summaryData.S.results[i].columns.Level == "Node"){
                            data.nodeList.push(summaryData.S.results[i].columns.Name);
                        }
                        data.rows.push(summaryData.S.results[i].columns);
                    }
                }
                if (summaryData && summaryData.H){
                    data.migrateCommand = summaryData.H["Migration Command"];
                }
                return data;
            }

            String.prototype.replaceAll = function(search, replacement) {
                var target = this;
                return target.replace(new RegExp(search, 'g'), replacement);
            };

            $scope.downloadHtml = function(htmlData,fileName){
                var element = document.createElement('a');
                element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(htmlData));
                element.setAttribute('download', fileName);
                element.style.display = 'none';

                document.body.appendChild(element);
              
                element.click();
              
                document.body.removeChild(element);
            }

            $scope.buildSummaryHtml = function(data){
                $http({
                    method: 'GET',
                    url: '/views/staticHtmls/summary.html'
                  }).then(function successCallback(response) {
                        var htmlData = response.data;
                        htmlData = htmlData.replaceAll("{{migrateId}}",data.migrateId);
                        htmlData = htmlData.replaceAll("{{migrateCommand}}",data.migrateCommand);
                        htmlData = htmlData.replaceAll("{{status}}",data.status);
                        htmlData = htmlData.replaceAll("{{userName}}",data.userName);
                        htmlData = htmlData.replaceAll("{{logicalUnit}}",data.logicalUnit);
                        htmlData = htmlData.replaceAll("{{nodeList}}",data.nodeList);
                        var rowData = '<tr>';
                        for (var i = 0;i < data.columns.length ; i++){
                            rowData = rowData  + '<th>' + data.columns[i] + '</th>';    
                        }
                        rowData = rowData + '</tr>';
                        for (var i = 0;i < data.rows.length ; i++){
                            rowData = rowData + '<tr>';
                            for (var j = 0;j < data.columns.length ; j++){
                                rowData = rowData + '<th>' + data.rows[i][data.columns[j]] + '</th>';   
                            }
                            rowData = rowData + '</tr>';
                        }
                        htmlData = htmlData.replaceAll("{{dataRows}}",rowData);
                        $scope.downloadHtml(htmlData,"summary_" + data.migrateId + ".html");
                    });
            };

            $scope.getMigrateStatusWs = function(){
                TDMService.postGenericAPI('migrateStatusWs',{
                    migrateId : _.map(taskHistoryTableCtrl.executionIds, 'fabric_execution_id'),
                    runModes : ['H','S']
                }).then(function(response){
                    taskHistoryTableCtrl.executionData = [];

                    let i = 0;
                    for (res of response.result) {
                        taskHistoryTableCtrl.migrationCommand = "";
                        if (res && res.H &&
                            res.H["Migration Command"]){
                            taskHistoryTableCtrl.migrationCommand = res.H["Migration Command"];
                        }
                        taskHistoryTableCtrl.clusterLevel = {};

                        if (res && res.S && res.S.results){
                            var clusterLevel = _.find(res.S.results,{columns : {Level : "Cluster"}});
                            if (clusterLevel) {
                                taskHistoryTableCtrl.clusterLevel = clusterLevel.columns;
                                if (taskHistoryTableCtrl.clusterLevel.Status == "DONE"){
                                    // taskHistoryTableCtrl.executionIds = [];
                                    $timeout(function () {
                                        getTableData();
                                        taskHistoryTableCtrl.reloadData();
                                    }, 5000);
                                    return;
                                }
                            }
                        }
                        else{
                            $timeout(function () {
                                getTableData();
                                taskHistoryTableCtrl.reloadData();
                            }, 5000);
                            return;
                        }
                        var added = (taskHistoryTableCtrl.taskType === 'LOAD' ? 
                            taskHistoryTableCtrl.clusterLevel.Succeeded : 
                            taskHistoryTableCtrl.clusterLevel.Added) || 0;
                        taskHistoryTableCtrl.executionData.push({
                            name : taskHistoryTableCtrl.executionIds && taskHistoryTableCtrl.executionIds[i] &&
                            taskHistoryTableCtrl.executionIds[i].name,
                            migrateID : taskHistoryTableCtrl.executionIds && taskHistoryTableCtrl.executionIds[i] &&
                            taskHistoryTableCtrl.executionIds[i].fabric_execution_id,
                            migrationCommand : taskHistoryTableCtrl.migrationCommand,
                            remainingDuration : taskHistoryTableCtrl.clusterLevel["Remaining dur."] || "00:00:00",
                            percentageOfCompleted : taskHistoryTableCtrl.clusterLevel["% Completed"],
                            added : added || 0,
                            failed : taskHistoryTableCtrl.clusterLevel.Failed || 0,
                            Updated : taskHistoryTableCtrl.clusterLevel.Updated || 0,
                            Unchanged : taskHistoryTableCtrl.clusterLevel.Unchanged || 0,
                            processed: (parseInt(added || 0) +
                                parseInt(taskHistoryTableCtrl.clusterLevel.Failed || 0) +
                                parseInt(taskHistoryTableCtrl.clusterLevel.Updated || 0) +
                                parseInt(taskHistoryTableCtrl.clusterLevel.Unchanged || 0))
                        });

                        i++;
                    }
                });
            };

            $scope.updateRunningExecutions = function () {

                if (taskHistoryTableCtrl.executionIds.length > 0) {
                    taskHistoryTableCtrl.disableAccessingStatistics = true;

                    if (taskHistoryTableCtrl.taskData.selection_method !== "REF"){
                        $scope.getMigrateStatusWs();
                    }

                    if (taskHistoryTableCtrl.taskData.selection_method == "REF" || taskHistoryTableCtrl.taskData.refcount > 0){
                        TDMService.postGenericAPI('extractrefstats',{
                            taskExecutionId : taskHistoryTableCtrl.executionIds[0].task_execution_id,
                            type : 'S',
                        }).then(function(response){
                            taskHistoryTableCtrl.executionRefData = [];
                            var executionsFinished = false;
                            for (key in response.result) {
                                let refExecution = response.result[key];
                                refExecution.lu_name = key;
                                refExecution.percentageOfCompleted = 0;
                                if (refExecution.totNumOfTablesToProcess > 0){
                                    refExecution.percentageOfCompleted  =
                                        refExecution.numOfProcessedRefTables /
                                        refExecution.totNumOfTablesToProcess * 100;

                                }
                                if (refExecution.percentageOfCompleted == 100) {
                                    executionsFinished = true;
                                }
                                taskHistoryTableCtrl.executionRefData.push(refExecution)
                            }
                            if (executionsFinished == true) {
                                $timeout(function () {
                                    getTableData();
                                    taskHistoryTableCtrl.reloadData();
                                }, 5000);
                            }
                        });
                    }
                    
                } else {
                    taskHistoryTableCtrl.disableAccessingStatistics = false;
                }
            };

            taskHistoryTableCtrl.dtInstance = {};
            taskHistoryTableCtrl.dtColumns = [];
            taskHistoryTableCtrl.dtColumnDefs = [];
            taskHistoryTableCtrl.headers = [
                {
                    column: 'source_env_name',
                    name: 'Source Environment Name',
                    clickAble: false
                },
                {
                    column: 'environment_name',
                    name: 'Target Environment Name',
                    clickAble: false
                },
                {
                    column: 'process_name',
                    name: 'Post Execution Process Name',
                    clickAble: false
                },
                {
                    column: 'lu_name',
                    name: 'Logical Unit Name',
                    clickAble: false
                },
                {
                    column: 'lu_parent_name',
                    name: 'Parent Logical Unit',
                    clickAble: false
                },
                {
                    column: 'task_executed_by',
                    name: 'Task Executed By',
                    clickAble: true
                },
                {
                    column: 'be_name',
                    name: 'Business Entity Name',
                    clickAble: false
                },
                {
                    column: 'product_name',
                    name: 'Product Name',
                    clickAble: false
                },
                {
                    column: 'product_version',
                    name: 'Product Version',
                    clickAble: false
                },
                {
                    column: 'num_of_processed_entities',
                    name: 'Total Number Of Processed Entities',
                    clickAble: false
                },
                {
                    column: 'num_of_copied_entities',
                    name: 'Number Of Copied Entities',
                    clickAble: false
                },
                {
                    column: 'num_of_failed_entities',
                    name: 'Number Of Failed Entities',
                    clickAble: false
                },
                {
                    column: 'num_of_processed_ref_tables',
                    name: 'Total Number Of Processed Reference Tables',
                    clickAble: false
                },
                {
                    column: 'num_of_copied_ref_tables',
                    name: 'Number Of Copied Reference Tables',
                    clickAble: false
                },
                {
                    column: 'num_of_failed_ref_tables',
                    name: 'Number Of Failed Reference Tables',
                    clickAble: false
                },
                {
                    column: 'version_expiration_date',
                    name: 'Version Expiration Date',
                    clickAble: false,
                    date: true
                },
                {
                    column: 'start_execution_time',
                    name: 'Start Execution Date',
                    clickAble: false,
                    date: true
                },
                {
                    column: 'end_execution_time',
                    name: 'End Execution Date',
                    clickAble: false,
                    date: true
                },
                {
                    column: 'execution_status',
                    name: 'Execution Status',
                    clickAble: false
                }
            ];

            taskHistoryTableCtrl.dtColumnDefs = [];
            if ($sessionStorage.taskHistoryTableHideColumns) {
                taskHistoryTableCtrl.hideColumns = $sessionStorage.taskHistoryTableHideColumns;
            }
            else {
                taskHistoryTableCtrl.hideColumns = [];
            }
            for (var i = 0; i < taskHistoryTableCtrl.hideColumns.length; i++) {
                var hideColumn = DTColumnDefBuilder.newColumnDef(taskHistoryTableCtrl.hideColumns[i])
                    .withOption('visible', false);
                //try to comment out the line below
                taskHistoryTableCtrl.dtColumnDefs.push(hideColumn);
            }


            var changeToLocalDate = function (data, type, full, meta) {
                if (data) {
                    return moment(data).format('DD MMM YYYY, HH:mm:ss');
                }
                return '';
            };

            taskHistoryTableCtrl.openEntitiesExecStats = function (taskExecId,type,fabricExecutionId,selectionMethod,refcount) {
                if (taskHistoryTableCtrl.disableAccessingStatistics) {
                    return;
                }
                $scope.$parent.$parent.$parent.tasks.openEntitiesExecStats(taskExecId,type,fabricExecutionId,selectionMethod,refcount);
                return;

            }

            taskHistoryTableCtrl.downloadSequenceReport = function(task_execution_id){
                TDMService.getGenericAPI('sequencereport/' + task_execution_id).then(function(response){
                });
            }

            taskHistoryTableCtrl.downloadErrorReport = function(lu_name, taskExecutionId){
                TDMService.getSummaryReport(taskExecutionId,lu_name).then(function (response) {
                    if (response.errorCode == "FAIL"){
                        return;
                    }
                    var workbook = ExcelService.buildSummaryExcel(response.result);
                    workbook.xlsx.writeBuffer()
                    .then(function(data) {
                        var fileName = `Summary_Report_EXECID_${taskExecutionId}_${lu_name}.xlsx`;
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
            }

            var taskHistoryActions = function (data, type, full, meta) {
                if (full.process_id) {
                    return '';
                }
                var pathfile = taskHistoryTableCtrl.TDMReports.replace("[etlIpAddress]",full.etl_ip_address);
                var etlExists = true;
                if (!full.etl_execution_id) {
                    etlExists = false;
                }
                var fileName = full.lu_name + '_Stats_Report_EXEID_' + full.etl_execution_id + '.csv';
                var seqName = full.lu_name + '_Sequences_Report_EXEID_'+ full.etl_execution_id + '.csv';
                // var errorName = full.lu_name + '_Error_Report_EXEID_'+ full.etl_execution_id + '.xls';
                taskHistoryTableCtrl.statsFile = pathfile + fileName;
                taskHistoryTableCtrl.seqFile = pathfile + seqName;
                // taskHistoryTableCtrl.errorFile = pathfile + errorName;
                var taskHistoryActions = "";

                if (full.execution_status && full.execution_status.toLowerCase() == "stopped" && (!taskHistoryTableCtrl.executionIds || taskHistoryTableCtrl.executionIds.length == 0)){
                    taskHistoryActions = taskHistoryActions + '<a ng-click="taskHistoryTableCtrl.resumeExecution(\'' + full.fabric_execution_id + '\',\'' + full.task_execution_id + '\')" style="margin-left: 5px;border-color: transparent;background-color: transparent; color: black;" type="button" title="Resume Execution"><i class="fa fa-play"></i> </a>';
                }
                if (taskHistoryTableCtrl.taskType != "EXTRACT"){
                    if (taskHistoryTableCtrl.runningExecution == full.task_execution_id) {
                        taskHistoryActions = taskHistoryActions = '<a  style="margin-left: 3px;border-color: transparent;background-color: transparent; color: grey;cursor: not-allowed;"  type="button" title="Download Statistics File"><i class="fa fa-download"></i> </a>';
                    }
                    else {
                        // taskHistoryActions = taskHistoryActions + '<a ng-click="taskHistoryTableCtrl.downloadExtractReport(\'S\',\'' + full.fabric_execution_id+'\',\'' + full.lu_name + '\',' + full.task_execution_id + ')"  target="_blank"  style="margin-left: 3px;border-color: transparent;background-color: transparent; color: black;" type="button" title="Download Statistics File"><i class="fa fa-download"></i> </a>';
                        // taskHistoryActions = taskHistoryActions + '<a href="' + taskHistoryTableCtrl.seqFile + '"  target="_blank" style="margin-left: 3px;border-color: transparent;background-color: transparent; color: black;" title="Download Sequence Report"><img style="width: 13px;" src="/img/download_seq.jpg"> </a>';
                        taskHistoryActions = taskHistoryActions + '<a ng-click="taskHistoryTableCtrl.downloadErrorReport(\'' + full.lu_name + '\',' + full.task_execution_id + ')"  style="margin-left: 3px;border-color: transparent;background-color: transparent; color: black;" title="Download Summary Report"><i class="fa fa-file-excel-o"> </i></a>';
                    }

                }
                else{
                    taskHistoryActions = taskHistoryActions + '<a ng-click="taskHistoryTableCtrl.downloadExtractReport(\'S\',\'' + full.fabric_execution_id+'\',\'' + full.lu_name + '\',' + full.task_execution_id + ')" style="margin-left: 5px;border-color: transparent;background-color: transparent; color: black;" type="button" title="Download Summary Report"><i class="fa fa-download"></i> </a>';
                    taskHistoryActions = taskHistoryActions + '<a ng-click="taskHistoryTableCtrl.downloadExtractReport(\'D\',\'' + full.fabric_execution_id+'\',\'' + full.lu_name + '\',' + full.task_execution_id + ')"  style="margin-left: 5px;border-color: transparent;background-color: transparent; color: black;" title="Download Detailed Report"><img style="width: 13px;" src="/img/download_seq.jpg"> </a>';
                }
                return taskHistoryActions;
            }

            for (var i = 0; i < taskHistoryTableCtrl.headers.length; i++) {
                if (taskHistoryTableCtrl.headers[i].date == true) {
                    taskHistoryTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskHistoryTableCtrl.headers[i].column).withTitle(taskHistoryTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    taskHistoryTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(taskHistoryTableCtrl.headers[i].column).withTitle(taskHistoryTableCtrl.headers[i].name));
                }
            }

            taskHistoryTableCtrl.dtColumns.push(DTColumnBuilder.newColumn('taskHistoryActions').withTitle('').renderWith(taskHistoryActions).withOption('width', '250'));

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(taskHistoryTableCtrl.taskHistoryData);
                return deferred.promise;
            };

            taskHistoryTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('paging', true)
                .withOption('scrollX', false)
                .withButtons([
                    {
                        extend: 'colvis',
                        text: 'Show/Hide columns',
                        columns: [6, 7, 8, 9, 10, 11, 12],
                        callback: function (columnIdx, visible) {
                            if (visible == true) {
                                var index = taskHistoryTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index >= 0) {
                                    taskHistoryTableCtrl.hideColumns.splice(index, 1);
                                }
                            }
                            else {
                                var index = taskHistoryTableCtrl.hideColumns.indexOf(columnIdx);
                                if (index < 0) {
                                    taskHistoryTableCtrl.hideColumns.push(columnIdx);
                                }
                            }
                            $sessionStorage.taskHistoryTableHideColumns = taskHistoryTableCtrl.hideColumns
                        }
                    }
                ]);

                if (taskHistoryTableCtrl.taskHistoryData && taskHistoryTableCtrl.taskHistoryData.length > 0){

                    const columns = [
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'source_env_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'environment_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'process_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'lu_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'lu_parent_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'task_executed_by')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'be_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'product_name')), function (el) {
                                return {value: el, label: el}
                            })
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'text'
                        },
                        {
                            type: 'select',
                            values: _.map(_.unique(_.map(taskHistoryTableCtrl.taskHistoryData, 'execution_status')), function (el) {
                                return {value: el, label: el}
                            })
                        }
                    ]
                    const lightColumnFilter = {};
                    columns.forEach((column, index) => {
                        let temp=angular.copy(column)
                        temp.hidden=taskHistoryTableCtrl.hideColumns.indexOf(index) >= 0 ? true : false
                        lightColumnFilter[index] = temp
                    });
                    taskHistoryTableCtrl.dtOptions.withLightColumnFilter(lightColumnFilter)
                }

            taskHistoryTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(taskHistoryTableCtrl.dtInstance)) {
                    taskHistoryTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(taskHistoryTableCtrl.dtInstance)) {
                    taskHistoryTableCtrl.dtInstance = dtInstance;
                }
            };
            if (taskHistoryTableCtrl.dtInstance.changeData != null)
                taskHistoryTableCtrl.dtInstance.changeData(getTableData());


                $timeout(() => {
                    taskHistoryTableCtrl.loadingTable = false;
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
            if (scope.updateRunningExecutions) {
                scope.updateRunningExecutions();
            }
            var updateData = $interval(function () {
                if (scope.updateRunningExecutions) {
                    scope.updateRunningExecutions();
                }
            }, 2000);

            element.on('$destroy', function () {
                $interval.cancel(updateData);
            });
        },
        controller: controller,
        controllerAs: 'taskHistoryTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('taskHistoryDirective', taskHistoryDirective);
