function permissionGroupsTableDirective(){

    var template = "views/permissionGroups/permissionGroupsTable.html";

    var controller = function ($scope,$compile,TDMService,DTColumnBuilder,DTOptionsBuilder,$q, $timeout) {
        var permissionGroupsTableCtrl = this;

        permissionGroupsTableCtrl.loadingTable = true;

        TDMService.getPermissionGroups().then(function(response){
            if (response.errorCode != 'SUCCESS'){
                //TODO show Error
                return;
            }
            permissionGroupsTableCtrl.permissionGroupsData = response.result;
            permissionGroupsTableCtrl.dtInstance = {};
            permissionGroupsTableCtrl.dtColumns = [];
            permissionGroupsTableCtrl.dtColumnDefs = [];
            permissionGroupsTableCtrl.headers = [
                {
                    column : 'permission_group',
                    name : 'Permission Group',
                    clickAble : true
                },
                {
                    column : 'fabric_role',
                    name : 'Role',
                    clickAble : false
                },
                {
                    column : 'description',
                    name : 'Description',
                    clickAble : false
                },
                {
                    column : 'creation_date',
                    name : 'Creation Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'created_by',
                    name : 'Created By',
                    clickAble : false
                },
                {
                    column : 'update_date',
                    name : 'Last Update Date',
                    clickAble : false,
                    type: 'date'
                },
                {
                    column : 'updated_by',
                    name : 'Updated By',
                    clickAble : false
                }
            ];

            var changeToLocalDate = function(data, type, full, meta){
                return moment(data).format('DD MMM YYYY, HH:mm')
            };

            for (var i = 0; i <  permissionGroupsTableCtrl.headers.length ; i++) {
                if (permissionGroupsTableCtrl.headers[i].type == 'date'){
                    permissionGroupsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(permissionGroupsTableCtrl.headers[i].column).withTitle(permissionGroupsTableCtrl.headers[i].name).renderWith(changeToLocalDate));
                }
                else {
                    permissionGroupsTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(permissionGroupsTableCtrl.headers[i].column).withTitle(permissionGroupsTableCtrl.headers[i].name));
                }
            }

            var getTableData = function () {
                var deferred = $q.defer();
                deferred.resolve(permissionGroupsTableCtrl.permissionGroupsData);
                return deferred.promise;
            };

            permissionGroupsTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                    return getTableData();
                })
                .withDOM('<"html5buttons"B>lTfgitp')
                .withOption('createdRow', function (row) {
                    // Recompiling so we can bind Angular directive to the DT
                    $compile(angular.element(row).contents())($scope);
                })
                .withOption('scrollX', false)
                .withOption('aaSorting', [5, 'asc'])
                .withButtons([
                ])
                .withOption('search',{
                    "caseInsensitive": false
                });

                if (permissionGroupsTableCtrl.productsData && permissionGroupsTableCtrl.productsData.length > 0){
                    permissionGroupsTableCtrl.dtOptions.withLightColumnFilter({
                            0 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(permissionGroupsTableCtrl.productsData, 'permission_group')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            1 : {
                                type: 'select',
                                values: _.map(_.unique(_.map(permissionGroupsTableCtrl.productsData, 'fabric_role')),function(el){
                                    return {value : el,label :el}
                                })
                            },
                            2 : {
                                type: 'text'
                            },
                            3 : {
                                type: 'text'
                            },
                            4 : {
                                type: 'text'
                            },
                            5 : {
                                type: 'text'
                            },
                            6 : {
                                type: 'text'
                            },
                    })
                }

            permissionGroupsTableCtrl.dtInstanceCallback = function (dtInstance) {
                if (angular.isFunction(permissionGroupsTableCtrl.dtInstance)) {
                    permissionGroupsTableCtrl.dtInstance(dtInstance);
                } else if (angular.isDefined(permissionGroupsTableCtrl.dtInstance)) {
                    permissionGroupsTableCtrl.dtInstance = dtInstance;
                }
            };
            if (permissionGroupsTableCtrl.dtInstance.changeData != null)
                permissionGroupsTableCtrl.dtInstance.changeData(getTableData());
                $timeout(() => {
                    permissionGroupsTableCtrl.loadingTable = false;
                  });
       
        });


        permissionGroupsTableCtrl.openProduct = function(productID){
            if ($scope.content.openProduct) {
                var productData = _.find(permissionGroupsTableCtrl.productsData, {product_id: productID});
                if (productData) {
                    $scope.content.openProduct(productData);
                    return;
                }
            }
            //TODO show error ??
        };

        permissionGroupsTableCtrl.openNewProduct = function(){
            if ($scope.content.openNewProduct) {
                $scope.content.openNewProduct(permissionGroupsTableCtrl.productsData);
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
        controllerAs :'permissionGroupsTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('permissionGroupsTableDirective', permissionGroupsTableDirective);