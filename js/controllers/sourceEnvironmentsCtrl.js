function sourceEnvironmentsCtrl ($scope,BreadCrumbsService){
    var sourceEnvironmentsCtrl = this;
    sourceEnvironmentsCtrl.pageDisplay = 'environmentsTable';

    sourceEnvironmentsCtrl.openEnvironments = function(){
        sourceEnvironmentsCtrl.environmentsData = {
            openEnvironment : sourceEnvironmentsCtrl.openEnvironment,
            openNewEnvironment : sourceEnvironmentsCtrl.openNewEnvironment
        };
        sourceEnvironmentsCtrl.pageDisplay = 'environmentsTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    sourceEnvironmentsCtrl.openEnvironment = function(environmentData){
        sourceEnvironmentsCtrl.environmentData = {
            environmentData : environmentData,
            openEnvironments : sourceEnvironmentsCtrl.openEnvironments,
            openEnvironment : sourceEnvironmentsCtrl.openEnvironment
        };
        sourceEnvironmentsCtrl.pageDisplay = 'environment';
    };

    sourceEnvironmentsCtrl.openNewEnvironment = function(environments){
        sourceEnvironmentsCtrl.newEnvironmentData = {
            environments: environments,
            openEnvironment : sourceEnvironmentsCtrl.openEnvironment,
            openEnvironments : sourceEnvironmentsCtrl.openEnvironments
        };
        sourceEnvironmentsCtrl.pageDisplay = 'newEnvironment';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'SOURCE_ENVIRONMENTS',function(){
        sourceEnvironmentsCtrl.openEnvironments();
    });

    sourceEnvironmentsCtrl.environmentsData = {
        openEnvironment : sourceEnvironmentsCtrl.openEnvironment,
        openNewEnvironment : sourceEnvironmentsCtrl.openNewEnvironment
    };
    sourceEnvironmentsCtrl.pageDisplay = 'environmentsTable';
}

angular
    .module('TDM-FE')
    .controller('sourceEnvironmentsCtrl' , sourceEnvironmentsCtrl);