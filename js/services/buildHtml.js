angular.module('TDM-FE')


    .factory('TDMService', function (Restangular, $sessionStorage) {

        

        return {
            deleteGenericAPI : deleteGenericAPI,
            putGenericAPI : putGenericAPI,
        }
    })