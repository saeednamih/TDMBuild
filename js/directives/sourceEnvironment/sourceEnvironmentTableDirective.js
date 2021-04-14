function sourceEnvironmentsTableDirective(){

    var template = "views/soruceEnvrionments/sourceEnvironmentsTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q,$timeout) {
        var sourceEnvironmentsTableCtrl = this;

        sourceEnvironmentsTableCtrl.loadingTable = true;

        TDMService.getGenericAPI('sourceEnvironments').then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }

            sourceEnvironmentsTableCtrl.environmentsData =_.sortBy(response.result, function(value) {
                return new Date(value.environment_creation_date);
            });
            sourceEnvironmentsTableCtrl.environmentsData.reverse();
            sourceEnvironmentsTableCtrl.dtInstance = {};
            sourceEnvironmentsTableCtrl.dtColumns = [];
            sourceEnvironmentsTableCtrl.dtColumnDefs = [];
            sourceEnvironmentsTableCtrl.headers = [
                {
                    column : 'source_environment_name',
                    name : 'Name',
                    clickAble : true
                },
                {
                    column : 'environment_point_of_contact_first_name',
                    name : 'Contact First Name',
                    clickAble : false
                },
                {
                    column : 'environment_point_of_contact_last_name',
                    name : 'Contact Last Name',
                    clickAble : false
                },
                {
                    column : 'environment_point_of_contact_email',
                    name : 'Contact Email',
                    clickAble : false
                },
                {
                    column : 'environment_creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'environment_created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'environment_last_updated_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'environment_last_updated_by',
                    name : 'Updated By',
                    clickAble : false
                },
                {
                    column : 'environment_status',
                    name : 'Status',
                    clickAble : false
                }
            ];

            var clickAbleColumn = function (data, type, full, meta) {
                return '<a ng-click="sourceEnvironmentsTableCtrl.openEnvironment(' + full.source_environment_id + ')">' + data + '</a>';
            };

            var changeToLocalDate = function(data, type, full, meta){
                if (data)
                    return moment(data).format('DD MMM YYYY, HH:mm');
                return '';
            };

            for (var i = 0; i <  sourceEnvironmentsTableCtrl.headers.length ; i++) {
                if (sourceEnvironmentsTableCtrl.headers[i].clickAble == true) {
                    sourceEnvironmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(sourceEnvironmentsTableCtrl.headers[i].column).withTitle(sourceEnvironmentsTableCtrl.headers[i].name).renderWith(clickAbleColumn));
                }
                else if (sourceEnvironmentsTableCtrl.headers[i].type == 'date'){
                    sourceEnvironmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(sourceEnvironmentsTableCtrl.headers[i].column).withTitle(sourceEnvironmentsTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    sourceEnvironmentsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(sourceEnvironmentsTableCtrl.headers[i].column).withTitle(sourceEnvironmentsTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(sourceEnvironmentsTableCtrl.environmentsData);
                return deferred.promise;
            };

            sourceEnvironmentsTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withOption('aaSorting', [8, 'asc'])
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withButtons([
                ])
                .withOption("caseInsensitive",true)
                .withOption('search',{
                    "caseInsensitive": false
                });
                
                if (sourceEnvironmentsTableCtrl.environmentsData && sourceEnvironmentsTableCtrl.environmentsData.length > 0){
                    sourceEnvironmentsTableCtrl.dtOptions
                    .withLightColumnFilter({
                            0 : {
                                type: 'text'
                            },
                            1 : {
                                type: 'text'
                            },
                            2 : {
                                type: 'text'
                            },
                            3 :{
                                type: 'text'
                            },
                            4 : {
                                type: 'text'
                            },
                            5 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(sourceEnvironmentsTableCtrl.environmentsData, 'environment_created_by')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            6 : {
                                type: 'text'
                            },
                            7 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(sourceEnvironmentsTableCtrl.environmentsData, 'environment_last_updated_by')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            8 : {
                                type: 'select',
                                values: [
                                    {
                                        value : "Inactive",
                                        label : "Inactive"
                                    },
                                    {
                                        value : "Active",
                                        label : "Active"
                                    }
                                ]
                            }
                    });
                }

            sourceEnvironmentsTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(sourceEnvironmentsTableCtrl.dtInstance)) {
                    sourceEnvironmentsTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(sourceEnvironmentsTableCtrl.dtInstance)) {
                    sourceEnvironmentsTableCtrl.dtInstance = dtInstance;
                }
            };
            if (sourceEnvironmentsTableCtrl.dtInstance.changeData != null)
                sourceEnvironmentsTableCtrl.dtInstance.changeData(getTableData());

                $timeout(() => {
                    sourceEnvironmentsTableCtrl.loadingTable = false;
                  });
            
        });


        sourceEnvironmentsTableCtrl.openEnvironment = function(environmentID){
            if ($scope.content.openEnvironment) {
                var environmentData = _.find(sourceEnvironmentsTableCtrl.environmentsData, {source_environment_id: environmentID});
                if (environmentData) {
                    $scope.content.openEnvironment(environmentData);
                    return;
                }
            }
            //TODO show error ??
        };

        sourceEnvironmentsTableCtrl.openNewEnvironment = function(){
            if ($scope.content.openNewEnvironment) {
                    $scope.content.openNewEnvironment(sourceEnvironmentsTableCtrl.environmentsData);
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
        controllerAs :'sourceEnvironmentsTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('sourceEnvironmentsTableDirective', sourceEnvironmentsTableDirective);