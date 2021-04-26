function referenceVersionsTaskTable() {

    var templateUrl = "views/tasks/referenceVersionsTaskTable.html";

    var controller = function ($scope, TDMService, $timeout,DTOptionsBuilder , DTColumnBuilder, $q, $uibModal, $compile) {
        var referenceVersionsTaskTableCtrl = this;
        referenceVersionsTaskTableCtrl.dtColumnsVersions = [];
        referenceVersionsTaskTableCtrl.dtColumnDefsVersions = [];
        $scope.reloadVersionsTable.dtInstanceVersions = {};
        referenceVersionsTaskTableCtrl.groupedSelections = new Set();

        referenceVersionsTaskTableCtrl.headersVersions = [
            {
                column : 'actions',
                name : '',
                clickAble : false
            },
            {
                column : 'lu_name',
                name : 'LU Name',
                clickAble : true
            },
            {
                column : 'version_name',
                name : 'Version Name',
                clickAble : true
            },
            {
                column : 'task_id',
                name : 'Task Id',
                clickAble : false
            },
            {
                column : 'task_last_updated_by',
                name : 'Last Updated By',
                clickAble : false
            },
            {
                column : 'version_type',
                name : 'Version Type',
                clickAble : false
            },
            {
                column : 'version_datetime',
                name : 'Date Time',
                type: 'date',
                clickAble : false
            }
        ];

        var changeToLocalDate = function (data, type, full, meta) {
            return moment(data).format('DD MMM YYYY, HH:mm')
        };


        var renderSelectionColumn = function(data, type, full, meta){
            var selectionIcon = '<input icheck type="radio" ng-value="'+ full.task_execution_id + '" name="referenceVersionsTableSelection" ng-model="selectedVersion.selectedRefVersionToLoad">'
                     if(!referenceVersionsTaskTableCtrl.groupedSelections){
                        referenceVersionsTaskTableCtrl.groupedSelections.add(full.task_execution_id);
            }
            if(!full.task_execution_id){
                return selectionIcon;
            }
            if (!referenceVersionsTaskTableCtrl.groupedSelections.has(full.task_execution_id)) {

                referenceVersionsTaskTableCtrl.groupedSelections.add(full.task_execution_id);
                return selectionIcon;
            } else {
                return '';
            } 
        };

        for (var i = 0; i <  referenceVersionsTaskTableCtrl.headersVersions.length ; i++) {
            if (referenceVersionsTaskTableCtrl.headersVersions[i].column == 'actions'){
                referenceVersionsTaskTableCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(referenceVersionsTaskTableCtrl.headersVersions[i].column).withTitle(referenceVersionsTaskTableCtrl.headersVersions[i].name).renderWith(renderSelectionColumn));
            }
            else if (referenceVersionsTaskTableCtrl.headersVersions[i].type == 'date') {
                referenceVersionsTaskTableCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(referenceVersionsTaskTableCtrl.headersVersions[i].column).withTitle(referenceVersionsTaskTableCtrl.headersVersions[i].name).renderWith(changeToLocalDate));
            }
            else {
                referenceVersionsTaskTableCtrl.dtColumnsVersions.push(DTColumnBuilder.newColumn(referenceVersionsTaskTableCtrl.headersVersions[i].column).withTitle(referenceVersionsTaskTableCtrl.headersVersions[i].name));
            }
        }

        var getTableDataVersions = function () {
            var deferred = $q.defer();
            referenceVersionsTaskTableCtrl.groupedSelections = new Set();
            deferred.resolve($scope.versionsList || []);
            return deferred.promise;
        };

        referenceVersionsTaskTableCtrl.dtOptionsVersions = DTOptionsBuilder.fromFnPromise(function () {
                return getTableDataVersions();
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
            });

            referenceVersionsTaskTableCtrl.dtOptionsVersions.withLightColumnFilter({
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
                },
                5: {
                    type: 'text'
                },
                6: {
                    type: 'text'
                }
            });


        // referenceVersionsTaskTableCtrl.getVersionsForLoad = function(){
        //     if (referenceVersionsTaskTableCtrl.versionForLoadFrom && referenceVersionsTaskTableCtrl.versionForLoadTo && 
        //         referenceVersionsTaskTableCtrl.logicalUnit.lu_name && referenceVersionsTaskTableCtrl.taskData.source_env_name 
        //         && (referenceVersionsTaskTableCtrl.taskData.selectAllEntites || 
        //             (referenceVersionsTaskTableCtrl.requestedEntities.entities_list && entitiesPassed))){
        //         referenceVersionsTaskTableCtrl.loadingTableVersions = true;
        //         var from = new Date(referenceVersionsTaskTableCtrl.versionForLoadFrom);
        //         from.setHours(0);
        //         from.setMinutes(0);
        //         from.setSeconds(0);
        //         var to = new Date(referenceVersionsTaskTableCtrl.versionForLoadTo);
        //         to.setHours(23);
        //         to.setMinutes(59);
        //         to.setSeconds(59);
        //         TDMService.postGenericAPI('tasks/getVersionReferenceTaskTable',{
        //             fromDate : from,
        //             toDate : to,
        //             refList : _.map(_.filter($scope.refList,{selected : true}),'reference_table_name'),
        //             source_env_name : referenceVersionsTaskTableCtrl.taskData.source_env_name
        //         }).then(function (response) {
        //             if (response.errorCode == "SUCCESS") {
        //                 referenceVersionsTaskTableCtrl.versionsForLoad = response.result;
        //                 referenceVersionsTaskTableCtrl.versionsForLoad = _.sortBy(referenceVersionsTaskTableCtrl.versionsForLoad, function(version){
        //                     return -1 * new Date(version.version_datetime);
        //                 });
        //                 $timeout(function(){
        //                     if (referenceVersionsTaskTableCtrl.dtInstanceVersions && referenceVersionsTaskTableCtrl.dtInstanceVersions.reloadData){
        //                         referenceVersionsTaskTableCtrl.dtInstanceVersions.reloadData(function(){
    
        //                         });
        //                     }
        //                 },100);

        //                 referenceVersionsTaskTableCtrl.loadingTableVersions = false;

        //             }
        //             else {
        //                 toastr.error("New Task # Failed to get Versions for Load");
        //             }
        //         });
        //     }
        //     else if (!referenceVersionsTaskTableCtrl.requestedEntities.entities_list && !referenceVersionsTaskTableCtrl.taskData.selectAllEntites){
        //         referenceVersionsTaskTableCtrl.versionsForLoad = [];
        //         if (referenceVersionsTaskTableCtrl.dtInstanceVersions && referenceVersionsTaskTableCtrl.dtInstanceVersions.reloadData){
        //             referenceVersionsTaskTableCtrl.dtInstanceVersions.reloadData(function(){

        //             });
        //         }
        //     }
        //     else if (!entitiesPassed){
        //         referenceVersionsTaskTableCtrl.enititesListFailedPatternTest = true;
        //     }
        // };
    };

    return {
        restrict: "E",
        templateUrl: templateUrl,
        scope: {
            versionsList: '=',
            loading : "=",
            timeRange : '=',
            getVersions : '=',
            selectedVersion : "=",
            reloadVersionsTable : "="
        },
        controller: controller,
        controllerAs: 'referenceVersionsTaskTableCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('referenceVersionsTaskTable', referenceVersionsTaskTable)