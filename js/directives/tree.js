function tree (){

    var template = "views/tree.html";

    var controller = function ($scope) {
        var treeCtrl = this;
        treeCtrl.collapse = function(item){
            item.collapsed = !item.collapsed;
            if (!item.collapsed && $scope.collapse) {
                $scope.collapse(item);
            }
        };

        treeCtrl.updateTable = function(item){
            $scope.updateTable(item);
            item.selected = true;
        };
    };

    return {
        restrict: "E",
        templateUrl: template,
        scope: {
            content: '=',
            collapse: '=',
            updateTable: '=',
            selectedLu: '=',
        },
        controller: controller,
        controllerAs :'treeCtrl'
    };
}


angular
    .module('TDM-FE')
    .directive('tree', tree);