function LoginCtrl ($rootScope,$state,AuthService,AUTH_EVENTS,FE_VERSION,$sessionStorage, TDMService, LOGIN_BANNER){
    var loginCtrl = this;
    loginCtrl.banner = LOGIN_BANNER;
    loginCtrl.version = FE_VERSION.version;
    loginCtrl.currentYear =  new Date().getFullYear();
    loginCtrl.init = function(){
        AuthService.clearSession();
    };

    $sessionStorage.taskTableHideColumns = null;
    $sessionStorage.taskHistoryTableHideColumns = null;

    loginCtrl.login = function(){
        var request = {
            username : loginCtrl.username,
            password : loginCtrl.password
        };
        AuthService.login(request).then(function(response){
            if (response.errorCode == "SUCCESS"){
                // only if the login succeeded then go to main
                $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                TDMService.getSupportedDbTypes().then(function (response) {
                    if (response.errorCode == "SUCCESS") {
                        //TODO Success
                        TDMService.saveDBTypes(response.result);
                    }
                    else {
                        //TODO error message
                    }
                });
                $state.go('dashboard');
            }
            else {
                loginCtrl.errorMessage = response.message;
            }
        });
    };

    loginCtrl.init();
}

angular
    .module('TDM-FE')
    .controller('LoginCtrl' , LoginCtrl);