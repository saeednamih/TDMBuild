function newSourceEnvironmentDirective (){

    var template = "views/soruceEnvrionments/newSourceEnvironment.html";

    var controller = function ($scope,TDMService,BreadCrumbsService,toastr,$timeout) {
        var newSourceEnvironmentCtrl = this;

        newSourceEnvironmentCtrl.environmentData = {};
        newSourceEnvironmentCtrl.environments = $scope.content.environments;

        TDMService.getGenericAPI('k2view/sourceEnvironments').then(function(response){
            newSourceEnvironmentCtrl.availableSourceEnvironments = _.filter(response.result,function(env){
                if (_.findIndex(newSourceEnvironmentCtrl.environments,{source_environment_name : env,environment_status : 'Active'}) >= 0){
                    return false;
                }
                return true;
            });
        }).catch(function(err){
            toastr.error("New Source Environment","Unable to get available Source Environment");
        });

        newSourceEnvironmentCtrl.addEnvironment = function(){
            if (_.find(newSourceEnvironmentCtrl.environments, {source_environment_name: newSourceEnvironmentCtrl.environmentData.source_environment_name,environment_status : 'Active'})) {
                return toastr.error("Source Environment # " + newSourceEnvironmentCtrl.environmentData.source_environment_name + " Already Exists");
            }
            TDMService.postGenericAPI('sourceEnvironment',newSourceEnvironmentCtrl.environmentData).then(function(response){
                    if (response.errorCode == "SUCCESS") {
                        toastr.success("Source Environment # " + newSourceEnvironmentCtrl.environmentData.source_environment_name,"Created Successfully");
                        $timeout(function(){
                            $scope.content.openEnvironment(response.result);
                        },300);
                    }
                    else{
                        toastr.error("Source Environment # " + newSourceEnvironmentCtrl.environmentData.source_environment_name,"Unable to Create : " + response.message);
                    }
            });
        };

        BreadCrumbsService.push({},'NEW_SOURCE_ENVIRONMENT',function(){

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'newSourceEnvironmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newSourceEnvironmentDirective', newSourceEnvironmentDirective);