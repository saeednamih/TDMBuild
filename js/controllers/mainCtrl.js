function MainCtrl($scope,$rootScope, $state, TDMService, BreadCrumbsService, $timeout, AuthService,FE_VERSION,DASHBOARD) {
    var mainCtrl = this;
    mainCtrl.helloText = 'Welcome To TDM';
    mainCtrl.displayDashboard = DASHBOARD.display;
    mainCtrl.descriptionText = '';

    mainCtrl.state = $state.current.name;
    mainCtrl.environmentID = null;
    mainCtrl.version = FE_VERSION.version;
    mainCtrl.currentYear =  new Date().getFullYear();
    mainCtrl.username = AuthService.getDisplayName();

    mainCtrl.showTooltip = true;

    mainCtrl.stateGo = function (state) {
        $state.go(state);
    };
    $rootScope.interval = 'Month';
    mainCtrl.changeInterval = function(){
        $scope.$broadcast('intervalChanged',{interval : mainCtrl.interval});
    };

    mainCtrl.refreshPage = function(){
        console.log('reload page');
        $scope.$broadcast('refreshPage',true);
    };

    mainCtrl.openEnvironments = function () {
        $timeout(function () {
            $state.go("environments");
        });
    };

    mainCtrl.openCreateProduct = function () {
        $timeout(function () {
            $state.go("newProduct");
        });
    };

    mainCtrl.openCreateDataCenter = function () {
        $timeout(function () {
            $state.go("newDataCenter");
        });
    };

    mainCtrl.openMain = function () {
        $state.go("dashboard")
    };

    mainCtrl.updateBreadCrumb = function (breadCrumb) {
        BreadCrumbsService.breadCrumbChange(breadCrumb.click);
        breadCrumb.callback(breadCrumb);
    };

    BreadCrumbsService.init();
    mainCtrl.BreadCrumbs = BreadCrumbsService.getAll();

    BreadCrumbsService.push({},'HOME',function(){
        mainCtrl.openMain()
    });
}

angular
    .module('TDM-FE')
    .controller('MainCtrl', MainCtrl);