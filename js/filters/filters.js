angular
    .module('TDM-FE').filter('getAvailableLogicalUnits', function () {
    return function (logicalUnits,chosen,lu_name) {
        var available = _.filter(logicalUnits,function(logicalUnit){
            if (lu_name && lu_name === logicalUnit.logical_unit){
                return true;
            }
            var found = _.find(chosen, { lu_name : logicalUnit.logical_unit});
            if (found){
                return false;
            }
            return true;
        });
        return available;
    }
}).filter('getAvailableParentLogicalUnits', function () {
    return function (logicalUnits,chosen,currentIndex) {
        available = _.filter(logicalUnits,function(logicalUnit){
            if (logicalUnit.lu_id){
                return true;
            }
            if (chosen[currentIndex].lu_name &&  chosen[currentIndex].lu_name === logicalUnit.logical_unit){
                return false;
            }
            var found = _.find(chosen, { lu_name : logicalUnit.logical_unit});
            if (found){
                return true;
            }
            return false;
        });
        return available;
    }
}).filter('checkIfLogicalUnitIsParent', function () {
    return function (logicalUnits,index) {
        if (index >= logicalUnits.length){
            return false;
        }
        if (_.findIndex(logicalUnits,{lu_parent_id : logicalUnits[index].lu_id.toString()}) >= 0){
            return false;
        }
        return true;
    }
}).filter('atLeastOneInterface', function () {
    return function (interfaces) {
        var ans = 0;
        for (var i = 0; i < interfaces.length ; i++){
            if (!interfaces[i].deleted){
                ans++;
            }
        }
        return (ans > 1);
    }
});
