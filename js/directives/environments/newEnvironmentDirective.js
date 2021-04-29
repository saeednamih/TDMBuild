function newEnvironmentDirective() {

    var template = "views/environments/newEnvironment.html";

    var controller = function ($scope, TDMService, BreadCrumbsService, toastr, $timeout, AuthService) {
        var newEnvironmentCtrl = this;
        newEnvironmentCtrl.envTypes = ['Both' , 'Source', 'Target'];
        newEnvironmentCtrl.syncModes = [
            {
                text: 'Do not Sync',
                value: 'OFF'
            },
            {
                text: 'Always Sync',
                value: 'FORCE'
            },
        ];
        newEnvironmentCtrl.environments = $scope.content.environments;

        newEnvironmentCtrl.envType = 'Target';
        newEnvironmentCtrl.environmentData = {
            allow_write: true
        }

        newEnvironmentCtrl.envTypeChanged = function () {
            if (newEnvironmentCtrl.envType) {
                if (newEnvironmentCtrl.envType.toLowerCase() == 'target') {
                        newEnvironmentCtrl.environmentData.allow_write = true;
                        newEnvironmentCtrl.environmentData.allow_read = false;
                } else if (newEnvironmentCtrl.envType.toLowerCase() == 'source') {
                    newEnvironmentCtrl.environmentData.allow_write = false;
                    newEnvironmentCtrl.environmentData.allow_read = true;
                }
                else if (newEnvironmentCtrl.envType.toLowerCase() == 'both') {
                    newEnvironmentCtrl.environmentData.allow_write = true;
                    newEnvironmentCtrl.environmentData.allow_read = true;
                }
            }
        };


        TDMService.getGenericAPI('getFabricEnvs').then(function (response) {
            newEnvironmentCtrl.availableSourceEnvironments = _.filter(response.result, function (env) {
                if (_.findIndex(newEnvironmentCtrl.environments, {
                    fabric_environment_name: env,
                    environment_status: 'Active'
                }) >= 0) {
                    return false;
                }
                return true;
            });
        }).catch(function (err) {
            toastr.error("New Environment", "Unable to get available Source Environment");
        });

        TDMService.getUsersByPermssionGroups('owner').then(function (response) {
            if (response.errorCode == "SUCCESS") {
                newEnvironmentCtrl.allOwners = response.result;
            } else {
                toastr.error("New Environment", "failed to get owners: " + response.message);
                newEnvironmentCtrl.allOwners = [];
            }
        });

        newEnvironmentCtrl.addEnvironment = function () {
            if (!newEnvironmentCtrl.environmentData.allow_write && 
                !newEnvironmentCtrl.environmentData.allow_read) {
                return toastr.error("Environment must be Target or Source Environment");
            }
            if (_.find(newEnvironmentCtrl.environments, {
                environment_name: newEnvironmentCtrl.environmentData.environment_name,
                environment_status: 'Active'
            })) {
                return toastr.error("Environment # " + newEnvironmentCtrl.environmentData.environment_name + " Already Exists");
            }
            newEnvironmentCtrl.environmentData.fabric_environment_name = newEnvironmentCtrl.environmentData.environment_name;
            TDMService.addEnvironment(newEnvironmentCtrl.environmentData).then(function (response) {
                if (response.errorCode == "SUCCESS") {
                    TDMService.getEnvironment(response.result.id).then(function (response) {
                        $timeout(function () {
                            response.result[0].owners = [];
                            response.result[0].user_name = null;
                            $scope.content.openEnvironment(response.result[0]);
                        }, 300);
                    });
                    toastr.success("Environment # " + newEnvironmentCtrl.environmentData.environment_name, "Created Successfully");
                } else {
                    toastr.error("Environment # " + newEnvironmentCtrl.environmentData.environment_name, "Unable to Create : " + response.message);
                }
            });
        };

        BreadCrumbsService.push({}, 'NEW_ENVIRONMENT', function () {

        });
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs: 'newEnvironmentCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('newEnvironmentDirective', newEnvironmentDirective);