function referenceTaskTable() {

    var templateUrl = "views/tasks/referenceTaskTable.html";

    var controller = function ($scope, TDMService, $timeout,DTOptionsBuilder , DTColumnBuilder, $q, toastr, $compile) {
        var referenceTaskTableCtrl = this;
        referenceTaskTableCtrl.dtInstance = {};
        referenceTaskTableCtrl.dtColumns = [];
        referenceTaskTableCtrl.dtColumnDefs = [];
        referenceTaskTableCtrl.data = $scope.data;
        referenceTaskTableCtrl.headers = [
            {
                column : 'actions',
                name : ''
            },
            {
                column : 'logical_unit_name',
                name : 'LU Name'
            },
            {
                column : 'interface_name',
                name : 'Source Interface Name'
            },
            {
                column : 'schema_name',
                name : 'Schema Name'
            },
            {
                column : 'reference_table_name',
                name : 'Reference Table Name'
            }
        ];

        var renderSelectionColumn = function(data, type, full, meta){
            return '<input icheck type="checkbox" ng-change="referenceTaskTableCtrl.selectionChange(referenceTaskTableCtrl.data[' + meta.row +'])" name="referenceTableSelection" ng-model="referenceTaskTableCtrl.data[' + meta.row +'].selected" ng-value="referenceTaskTableCtrl.data[' + meta.row +'].selected">'

        };

        for (var i = 0; i < referenceTaskTableCtrl.headers.length ; i++) {
            if (referenceTaskTableCtrl.headers[i].column == 'actions'){
                referenceTaskTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(referenceTaskTableCtrl.headers[i].column).withTitle(referenceTaskTableCtrl.headers[i].name).renderWith(renderSelectionColumn).withOption('width', '200'));
            }
            else{
                referenceTaskTableCtrl.dtColumns.push(DTColumnBuilder.newColumn(referenceTaskTableCtrl.headers[i].column).withTitle(referenceTaskTableCtrl.headers[i].name));
            }
        }

        var getTableData = function () {
            var deferred = $q.defer();
            deferred.resolve(referenceTaskTableCtrl.data);
            return deferred.promise;
        };

        referenceTaskTableCtrl.dtOptions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableData();
            })
            .withDOM('<"html5buttons"B>lTfgitp')
            .withOption('createdRow', function (row) {
                // Recompiling so we can bind Angular directive to the DT
                $compile(angular.element(row).contents())($scope);
            })
            .withOption('scrollX', false)
            .withOption('lengthChange', false)
            .withOption('paging', false)
            .withButtons([])
            .withOption("caseInsensitive", true)
            .withOption('search',{
                "caseInsensitive": false
            })
            .withOption('order', [1, 'asc']);
        ;

            referenceTaskTableCtrl.dtOptions.withLightColumnFilter({
                1: {
                    type: 'text'
                },
                2: {
                    type: 'text'
                },
                3: {
                    type: 'text'
                },
                4: {
                    type: 'text'
                }
            });

            referenceTaskTableCtrl.selectionChange = function(refTable){
                if (refTable.selected && _.countBy(referenceTaskTableCtrl.data,{
                    interface_name : refTable.interface_name,
                    schema_name : refTable.schema_name,
                    reference_table_name : refTable.reference_table_name,
                    selected : true
                }).true > 1){
                    $timeout(function(){
                        refTable.selected = false;
                    })
                    toastr.error(refTable.schema_name + "." + refTable.reference_table_name, "Duplicate table selected:");
                    return;
                }
                $scope.getVersions();
            };

            referenceTaskTableCtrl.selectReference = function(value){
                referenceTaskTableCtrl.data.forEach(function(el){
                    el.selected = value;
                });
            }
    };

    return {
        restrict: "E",
        templateUrl: templateUrl,
        scope: {
            data: '=',
            getVersions: '='
        },
        controller: controller,
        controllerAs: 'referenceTaskTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('referenceTaskTable', referenceTaskTable)