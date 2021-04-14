function centersDataTableDirective(){

    var template = "views/dataCenters/dataCentersTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q,$timeout) {
        var dataCentersTableCtrl = this;

        dataCentersTableCtrl.loadingTable = true;

        TDMService.getDataCenters().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }
            dataCentersTableCtrl.dataCentersData = response.result;
            dataCentersTableCtrl.dtInstance = {};
            dataCentersTableCtrl.dtColumns = [];
            dataCentersTableCtrl.dtColumnDefs = [];
            dataCentersTableCtrl.headers = [
                {
                    column : 'dc',
                    name : 'Name',
                    clickAble : true
                },
                {
                    column : 'effective_ip',
                    name : 'IP Address',
                    clickAble : true
                },
                {
                    column : 'node_id',
                    name : 'Node Id',
                    clickAble : true
                },
                {
                    column : 'notes',
                    name : 'Description',
                    clickAble : false
                },
                {
                    column : 'status',
                    name : 'Status',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="dataCentersTableCtrl.openDataCenter(\'' + full.data_center_id + '\')">' + data + '</a>';
            };

            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };


            for (var i = 0; i <  dataCentersTableCtrl.headers.length ; i++) {
                if (dataCentersTableCtrl.headers[i].type == 'date'){
                    dataCentersTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(dataCentersTableCtrl.headers[i].column).withTitle(dataCentersTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else{
                    dataCentersTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(dataCentersTableCtrl.headers[i].column).withTitle(dataCentersTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(dataCentersTableCtrl.dataCentersData);
                return deferred.promise;
            };

            dataCentersTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withButtons([
                ])
                .withOption('search',{
                    "caseInsensitive": true,
                    "useWildcards" : false
                });
                
                if (dataCentersTableCtrl.dataCentersData && dataCentersTableCtrl.dataCentersData.length > 0){
                    dataCentersTableCtrl.dtOptions.withLightColumnFilter({
                            0 : {
                                type: 'text'
                            },
                            1 : {
                                type: 'text'
                            },
                            2 : {
                                type: 'text'
                            },
                            3 : {
                                type: 'text'
                            },
                            4 : {
                                type: 'text'
                            }
                    });
                }

            dataCentersTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(dataCentersTableCtrl.dtInstance)) {
                    dataCentersTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(dataCentersTableCtrl.dtInstance)) {
                    dataCentersTableCtrl.dtInstance = dtInstance;
                }
            };
            if (dataCentersTableCtrl.dtInstance.changeData != null)
                dataCentersTableCtrl.dtInstance.changeData(getTableData());

                $timeout(() => {
                    dataCentersTableCtrl.loadingTable = false;
                  });
          
        });

        dataCentersTableCtrl.openDataCenter = function(data_center_id){
            if ($scope.content.openDataCenter) {
                var dataCenterData = _.find(dataCentersTableCtrl.dataCentersData, {data_center_id: data_center_id});
                if (dataCenterData) {
                    $scope.content.openDataCenter(dataCenterData);
                    return;
                }
            }
            //TODO show error ??
        };

        dataCentersTableCtrl.openNewDataCenter = function(){
            if ($scope.content.openNewDataCenter) {
                $scope.content.openNewDataCenter(dataCentersTableCtrl.dataCentersData);
                return;
            }
            //TODO show error ??
        }
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '='
        },
        controller: controller,
        controllerAs :'dataCentersTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('centersDataTableDirective', centersDataTableDirective);