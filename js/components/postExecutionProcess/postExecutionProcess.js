function postExecutionProcess (){

    var template = "js/components/postExecutionProcess/postExecutionProcess.html";

    var controller = function ($scope,TDMService,AuthService,toastr,$timeout) {
        var postExecutionProcessCtrl = this;
        postExecutionProcessCtrl.description = null;
        if ($scope.postExecutionProcess){
            postExecutionProcessCtrl.processName = $scope.postExecutionProcess.process_name;
            postExecutionProcessCtrl.executionOrder = $scope.postExecutionProcess.execution_order;
            postExecutionProcessCtrl.description = $scope.postExecutionProcess.process_description;
        }
        
        TDMService.getGenericAPI('postexecutionprocesses').then(function(response){
            postExecutionProcessCtrl.processNames = _.filter(Object.keys(response.result),processName => {
                if ($scope.data && $scope.data.postExecutionData && _.findIndex($scope.data.postExecutionData,{process_name: processName}) >= 0){
                    return false;
                }
                return true;
            });
            if ($scope.postExecutionProcess){
                postExecutionProcessCtrl.processName = $scope.postExecutionProcess.process_name;
                if (postExecutionProcessCtrl.processNames.indexOf($scope.postExecutionProcess.process_name) < 0){
                    postExecutionProcessCtrl.processNames.push($scope.postExecutionProcess.process_name);
                }
            }
        }).catch(function(err){
            if ($scope.postExecutionProcess){
                postExecutionProcessCtrl.processName = $scope.postExecutionProcess.process_name;
            }
        });
        
        postExecutionProcessCtrl.postExecutionProcessChange = function(){
            var dataToSend = {
                process_id : $scope.postExecutionProcess ? $scope.postExecutionProcess.process_id : undefined,
                process_name: postExecutionProcessCtrl.processName,
                execution_order: postExecutionProcessCtrl.executionOrder,
                process_description: postExecutionProcessCtrl.description,
                be_id: $scope.data.beId,
            }
            var apiToCall = TDMService.postExecutionProcess;
            if ($scope.postExecutionProcess){
                apiToCall = TDMService.putExecutionProcess;
            }
            apiToCall($scope.data.beId, $scope.data.beName, dataToSend).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    if ($scope.postExecutionProcess){
                        var index = _.findIndex($scope.data.postExecutionData,{process_id : $scope.postExecutionProcess.process_id});
                        if(index >= 0){
                            $scope.data.postExecutionData[index] = dataToSend;
                        }
                    }
                    else{
                        let temp =angular.copy(dataToSend)
                        temp.process_id= response.result.id;
                        $scope.data.postExecutionData.push(temp);
                    }
                    $scope.data.reloadData();
                    $scope.data.close();
                    toastr.success("Entity Group Query added successfully");
                }
                else {
                    if (response.message.indexOf('duplicate key value violates unique constraint "tdm_be_post_exe_process') >= 0) {
                        postExecutionProcessCtrl.alert = {
                            type: 'danger', msg: `Failed to add the Post Execution Process. The ${dataToSend.process_name} is already defined for the Business Entity. Please set a different Post Execution Process.`
                        }
                    }
                    else {
                        postExecutionProcessCtrl.alert = {
                            type: 'danger', msg: 'Failed to Add Post Execution Process [' + response.message + ']'
                        }
                    }
                }
            });
        };


        // postExecutionProcessCtrl.closeAlert = function () {
        //     delete postExecutionProcessCtrl.alert;
        // };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            data: '=',
            postExecutionProcess: "="
        },
        controller: controller,
        controllerAs :'postExecutionProcessCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('postExecutionProcess', postExecutionProcess);
