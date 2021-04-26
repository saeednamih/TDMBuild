function permissionGroupsCtrl ($scope,BreadCrumbsService){
    var permissionGroupsCtrl = this;
    permissionGroupsCtrl.pageDisplay = 'permissionGroupsTable';

    permissionGroupsCtrl.openPermissionGroups = function(){
        permissionGroupsCtrl.productsData = {
            openProduct : permissionGroupsCtrl.openProduct,
            openNewProduct : permissionGroupsCtrl.openNewProduct
        };
        permissionGroupsCtrl.pageDisplay = 'permissionGroupsTable';
        BreadCrumbsService.breadCrumbChange(1);
    };

    permissionGroupsCtrl.openProduct = function(productData){
        BreadCrumbsService.breadCrumbChange(1);
        permissionGroupsCtrl.productData = {
            productData : productData,
            openProducts : permissionGroupsCtrl.openProducts
        };
        permissionGroupsCtrl.pageDisplay = 'product';
    };

    permissionGroupsCtrl.openNewProduct = function(productData){
        permissionGroupsCtrl.newProductData = {
            openProduct : permissionGroupsCtrl.openProduct,
            productData : productData
        };
        permissionGroupsCtrl.pageDisplay = 'newProduct';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'PERMISSION_GROUPS',function(){
        permissionGroupsCtrl.openProducts();
    });

    permissionGroupsCtrl.productsData = {
        openProduct : permissionGroupsCtrl.openProduct,
        openNewProduct : permissionGroupsCtrl.openNewProduct
    };
    permissionGroupsCtrl.pageDisplay = 'permissionGroupsTable';
}

angular
    .module('TDM-FE')
    .controller('permissionGroupsCtrl' , permissionGroupsCtrl);