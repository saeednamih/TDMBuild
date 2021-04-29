angular.module("TDM-FE").service("Session", function () {
  this.create = function (userAuthenticated) {
    this.userAuthenticated = userAuthenticated;
  };
  this.destroy = function () {
    this.userAuthenticated = null;
  };
});

angular
  .module("TDM-FE")

  .factory("TDMService", function (Restangular, $sessionStorage, $rootScope) {

    var invokeFabricWebServiceWrapper = (path, body, method) => {
      return new Promise((resolve,reject) => {
        window.k2api.invokeFabricWebService(path, body, method).then(resp => {
          resolve(resp);
        }).catch(err => {
          reject(err);
        }).finally(() =>{
          $rootScope.$apply();  
        })
      });
    };

    var deleteRoleFromPermissionGroup = (role) => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "wsDeletePermissionGroupMapping",
          {role: role},
          "DELETE"
        );
      }
    }

    var getUsersByPermssionGroups = (permissionGroup) => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return new Promise((resolve, reject) => {
          invokeFabricWebServiceWrapper(
            "/wsGetUsersByPermissionGroup",
            {
              permissionGroup
            },
            "GET"
          ).then(response => {
            response.result = _.map(response.result || [],user => {
              return {
                "uid": user,
                "user_id": user,
                "displayName": user,
                "username": user,
              }; 
            });
            resolve(response);
          }).catch(err => {
            reject(err);
        });
      });
    }
  }

    var attachRoleToPermissionGroup = (permission_group, role ,description) => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "wsAddPermissionGroupMapping",
          {
            permission_group,
            role,
            description,
          },
          "POST"
        );
      }
    }

    var getFabricRoles = (role) => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "wsGetFabricRoles",
          {role: role},
          "GET"
        );
      }
    }

    var getUserRole = () => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "wsGetUserPermissionGroup",
          null,
          "GET"
        );
      }
    };

    var getPermissionGroups = () => {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "wsGetPermissionGroupMappings",
          null,
          "GET"
        );
      }
    };

    var getSupportedDbTypes = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "supportedDbTypes",
          null,
          "GET"
        );
      } else {
        return Restangular.all("supportedDbTypes").get("");
      }
    };

    var saveDBTypes = function (DBTypes) {
      $sessionStorage.supportedDbTypes = DBTypes;
    };

    var getDBTypes = function () {
      return $sessionStorage.supportedDbTypes;
    };

    var getEnvironments = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("environments", null, "get");
      } else {
        return Restangular.all("environments").get("");
      }
    };

    var getEnvironment = function (id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${id}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", id).get("");
      }
    };

    var getProducts = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("products", null, "get");
      } else {
        return Restangular.all("products").get("");
      }
    };

    var getProductsWithLUs = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "productsWithLUs",
          null,
          "GET"
        );
      } else {
        return Restangular.all("productsWithLUs").get("");
      }
    };

    var getProduct = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}`,
          null,
          "get"
        );
      } else {
        return Restangular.one("product", productId).get("");
      }
    };

    var updateEnvironment = function (environmentId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentId}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("environment", environmentId).customPUT(data);
      }
    };

    var addEnvironment = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("environment", data, "POST");
      } else {
        return Restangular.all("environment").post(data);
      }
    };

    var deleteEnvironment = function (environmentID, environmentName) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/envname/${environmentName}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("envname", environmentName)
          .customDELETE("");
      }
    };

    var updateProduct = function (productId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("product", productId).customPUT(data);
      }
    };

    var createProduct = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("product", data, "POST");
      } else {
        return Restangular.all("product").post(data);
      }
    };

    var deleteProduct = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("product", productId).customDELETE("");
      }
    };

    var createDataCenter = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`datacenter`, data, "POST");
      } else {
        return Restangular.all("datacenter").post(data);
      }
    };

    var getDataCenters = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("dataCenters", null, "get");
      } else {
        return Restangular.all("datacenters").get("");
      }
    };

    var updateDataCenter = function (data_center_id, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `dataCenters/${data_center_id}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("datacenter", data_center_id).customPUT(data);
      }
    };

    var deleteDataCenter = function (data_center_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `dataCenters/${data_center_id}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("datacenter", data_center_id).customDELETE("");
      }
    };

    var getProductInterfaces = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/interfaces`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("product", productId).all("interfaces").get("");
      }
    };

    var postProductInterface = function (productId, productName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/productname/${productName}/interface`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("product", productId)
          .one("productname", productName)
          .all("interface")
          .post(data);
      }
    };

    var putProductInterface = function (
      productId,
      productName,
      interface_id,
      data
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/productname/${productName}/interface/${interface_id}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("product", productId)
          .one("productname", productName)
          .one("interface", interface_id)
          .customPUT(data);
      }
    };

    var deleteProductInterface = function (
      productId,
      productName,
      interface_id,
      interface_name,
      interfacesCount,
      envCount
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/productname/${productName}/interface/${interface_id}/interfacename/${interface_name}/envcount/${envCount}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("product", productId)
          .one("productname", productName)
          .one("interface", interface_id)
          .one("interfacename", interface_name)
          .one("interfacecount", interfacesCount)
          .one("envcount", envCount)
          .customDELETE("");
      }
    };

    var getLogicalUnits = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("logicalunits", null, "GET");
      } else {
        return Restangular.all("logicalunits").get("");
      }
    };

    var getProductLogicalUnits = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/logicalunits`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("product", productId)
          .all("logicalunits")
          .get("");
      }
    };

    var getBELogicalUnits = function (beId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/logicalunits`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .all("logicalunits")
          .get("");
      }
    };

    var getLogicalUnitsWithoutProduct = function (beId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `logicalunitswithoutproduct`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("logicalunitswithoutproduct").get("");
      }
    };

    var postLogicalUnits = function (beId, beName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/bename/${beName}/logicalunits`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .one("bename", beName)
          .all("logicalunits")
          .post(data);
      }
    };

    var putLogicalUnit = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${data.be_id}/logicalunit/${data.lu_id}`,
          {logicalUnit: data},
          "PUT"
        );
      } else {
        return Restangular.one("businessentity", data.be_id)
          .one("logicalunit", data.lu_id)
          .customPUT(data);
      }
    };

    var putLogicalUnits = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${data.be_id}/logicalunits`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("businessentity", data.be_id)
          .all("logicalunits")
          .customPUT(data);
      }
    };

    var deleteLogicalUnit = function (beId, beName, luId, luName) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/bename/${beName}/logicalunit/${luId}/luname/${luName}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .one("bename", beName)
          .one("logicalunit", luId)
          .one("luname", luName)
          .customDELETE("");
      }
    };

    var getBusinessEntities = function (productId, lu_name) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "businessentities",
          null,
          "get"
        );
      } else {
        return Restangular.all("businessentities").get("");
      }
    };

    var createBusinessEntity = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          "businessentity",
          data,
          "POST"
        );
      } else {
        return Restangular.all("businessentity").post(data);
      }
    };

    var updateBusinessEntity = function (beId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("businessentity", beId).customPUT(data);
      }
    };

    var deleteBusinessEntity = function (beId, beName) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("businessentity", beId).customDELETE("");
      }
    };

    var getTasks = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("tasks", null, "GET");
      } else {
        return Restangular.all("tasks").get("");
      }
    };

    var createTask = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper("task", data, "POST");
      } else {
        return Restangular.all("task").post(data);
      }
    };

    var updateTask = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${data.task_id}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("task", data.task_id).customPUT(data);
      }
    };

    var deleteTask = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${data.task_id}/taskname/${data.task_title}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("task", data.task_id)
          .one("taskname", data.task_title)
          .customDELETE("");
      }
    };

    var getEnvironmentRoles = function (environmentID) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/roles`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .all("roles")
          .get("");
      }
    };

    var postEnvironmentRole = function (environmentID, environmentName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/envname/${environmentName}/role`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("envname", environmentName)
          .all("role")
          .post(data);
      }
    };

    var updateEnvironmentRole = function (
      environmentID,
      environmentName,
      roleID,
      data
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/envname/${environmentName}/role/${roleID}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("envname", environmentName)
          .one("role", roleID)
          .customPUT(data);
      }
    };

    var deleteEnvironmentRole = function (
      environmentID,
      environmentName,
      roleID,
      roleName
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/envname/${environmentName}/role/${roleID}/rolename/${roleName}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("envname", environmentName)
          .one("role", roleID)
          .one("rolename", roleName)
          .customDELETE("");
      }
    };

    var getTesters = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/testers`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("testers").get("");
      }
    };

    var getOwners = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`owners`, null, "GET");
      } else {
        return Restangular.all("owners").get("");
      }
    };

    var getProductsForBusinessEntityAndEnv = function (be_id, environment_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${be_id}/environment/${environment_id}/products`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", be_id)
          .one("environment", environment_id)
          .all("products")
          .get("");
      }
    };

    var getLogicalUnitsForBusinessEntityAndEnv = function (
      be_id,
      environment_id
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${be_id}/environment/${environment_id}/logicalunits`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", be_id)
          .one("environment", environment_id)
          .all("logicalunits")
          .get("");
      }
    };

    var getTaskProducts = function (task_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/products`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", task_id).all("products").get("");
      }
    };

    var getTaskLogicalUnits = function (task_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/logicalunits`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", task_id).all("logicalunits").get("");
      }
    };

    var getTaskPostExecutionProcesses = function (task_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/postexecutionprocess`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", task_id)
          .all("postexecutionprocess")
          .get("");
      }
    };

    var postTaskProducts = function (taskId, taskName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/taskname/${taskName}/products`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("task", taskId)
          .one("taskname", taskName)
          .all("products")
          .post(data);
      }
    };

    var postTaskLogicalUnits = function (taskId, taskName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${taskId}/taskname/${taskName}/logicalUnits`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("task", taskId)
          .one("taskname", taskName)
          .all("logicalUnits")
          .post(data);
      }
    };

    var postTaskPostExecutionProcess = function (taskId, taskName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${taskId}/taskname/${taskName}/postexecutionprocesses`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("task", taskId)
          .one("taskname", taskName)
          .all("postexecutionprocesses")
          .post(data);
      }
    };

    var getRoleForUserInEnv = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/userRole`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("userRole").get("");
      }
    };

    var getEnvProducts = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/products`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("products").get("");
      }
    };

    var getEnvGlobals = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/globals`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("globals").get("");
      }
    };

    var getAllGlobals = function (envId, envName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/getAllGlobals`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("getAllGlobals")
          .get("");
      }
    };

    var postEnvProduct = function (envId, envName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/product`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .all("product")
          .post(data);
      }
    };

    var postEnvGlobal = function (envId, envName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/global`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .all("global")
          .post(data);
      }
    };

    var putEnvGlobal = function (envId, envName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/global`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .all("global")
          .customPUT(data);
      }
    };

    var deleteEnvGlobal = function (envId, envName, global_name) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/global/${global_name}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .one("global", global_name)
          .customDELETE("");
      }
    };

    var putEnvProduct = function (envId, envName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/product`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .all("product")
          .customPUT(data);
      }
    };

    var deleteEnvProduct = function (envId, envName, productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envname/${envName}/product/${productId}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("envname", envName)
          .one("product", productId)
          .customDELETE("");
      }
    };

    var getEnvironmentRoleTesters = function (environmentID, roleID) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/role/${roleID}/users`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("role", roleID)
          .all("users")
          .get("");
      }
    };

    var postEnvironmentRoleTesters = function (
      environmentID,
      environmentName,
      roleID,
      roleName,
      data
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/envname/${environmentName}/role/${roleID}/rolename/${roleName}/users`,
          {users: data},
          "POST"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .one("envname", environmentName)
          .one("role", roleID)
          .one("rolename", roleName)
          .all("users")
          .post(data);
      }
    };

    var getEnvironmentOwners = function (environmentID) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${environmentID}/owners`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", environmentID)
          .all("owners")
          .get("");
      }
    };

    var getEnvironmentsForUser = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environmentsbyuser`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("environmentsbyuser").get("");
      }
    };

    var getBusinessEntityParameters = function (beID) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beID}/parameters`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", beID)
          .all("parameters")
          .get("");
      }
    };

    var getAnalysisCount = function (beID, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beID}/analysiscount`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("businessentity", beID)
          .all("analysiscount")
          .post(data);
      }
    };

    var getSummaryTaskHistory = function (taskId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${taskId}/summary`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", taskId).all("summary").get("");
      }
    };

    var getTaskHistory = function (taskId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${taskId}/history`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", taskId).all("history").get("");
      }
    };

    var getActivities = function (interval) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `activities/${interval}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("activities", interval).get("");
      }
    };

    var getNumOfTasksPerMonth = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numoftaskspermonth`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("numoftaskspermonth").get("");
      }
    };

    var getNumOfCopiedEntitiesPerMonth = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numofcopiedentitiespermonth`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("numofcopiedentitiespermonth").get("");
      }
    };

    var getNumOfTaskExecutionsPerMonth = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numoftaskexecutionspermonth`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("numoftaskexecutionspermonth").get("");
      }
    };

    var getNumOfProcessedEntitiesPerEnv = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numofprocessedentitiesperenv`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("numofprocessedentitiesperenv").get("");
      }
    };

    var getNumOfTasksPerEnv = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numoftasksperenv`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("numoftasksperenv").get("");
      }
    };

    var getBusinessEntitiesForEnvProducts = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/businessEntitiesForEnvProducts`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("businessEntitiesForEnvProducts")
          .get("");
      }
    };

    var executeTask = function (taskID, forced) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${taskID}/forced/${forced || false}/startTask`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("task", taskID)
          .one("forced", forced || false)
          .all("startTask")
          .get("");
      }
    };

    var getProductEnvCount = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `product/${productId}/envcount`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("product", productId).all("envcount").get("");
      }
    };

    var getEnvTaskCount = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/taskCount`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("taskCount").get("");
      }
    };

    var getTasksExecutionsStatus = function (interval) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `tasksExecutionsStatus/${interval}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("tasksExecutionsStatus", interval).get("");
      }
    };

    var getTasksPerBE = function (interval) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `tasksPerBE/${interval}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("tasksPerBE", interval).get("");
      }
    };

    var getDataCenterEnvironmentCount = function (data_center_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `datacenter/${data_center_id}/envcount`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("datacenter", data_center_id)
          .all("envcount")
          .get("");
      }
    };

    var holdTask = function (task_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/holdTask`,
          null,
          "PUT"
        );
      } else {
        return Restangular.one("task", task_id).all("holdTask").customPUT("");
      }
    };
    var activateTask = function (task_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/${task_id}/activateTask`,
          null,
          "PUT"
        );
      } else {
        return Restangular.one("task", task_id)
          .all("activateTask")
          .customPUT("");
      }
    };

    var getBEProductCount = function (be_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${be_id}/productCount`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", be_id)
          .all("productCount")
          .get("");
      }
    };

    var getEnvironmentSummary = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/summary/Month`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("summary")
          .all("Month")
          .get("");
      }
    };

    var getTaskMonitor = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `task/summary/Month`,
          data,
          "POST"
        );
      } else {
        return Restangular.all("task").all("monitor").post(data);
      }
    };

    var stopExecution = function (execution) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `taskexecution/stopexecution`,
          execution,
          "POST"
        );
      } else {
        return Restangular.all("taskexecution")
          .all("stopexecution")
          .post(execution);
      }
    };

    var getTimeZone = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`dbtimezone`, null, "GET");
      } else {
        return Restangular.all("dbtimezone").get("");
      }
    };

    var getNumProcessedCopiedFailedEntities = function (interval) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numofprocessedcopiedfailedentities/${interval}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one(
          "numofprocessedcopiedfailedentities",
          interval
        ).get("");
      }
    };

    var getNumCopiedFailedEntitiesPerLU = function (interval) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `numofcopiedfailedentitiesperlu/${interval}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("numofcopiedfailedentitiesperlu", interval).get(
          ""
        );
      }
    };

    var deleteTaskForBE = function (be_id) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${be_id}/task`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("businessentity", be_id)
          .all("task")
          .customDELETE("");
      }
    };

    var getEnvExclusionLists = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/exclusionLists`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("exclusionLists")
          .get("");
      }
    };

    var getEnvExclusionList = function (envId, elId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/exclusionLists/${elId}`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("exclusionLists", elId)
          .get("");
      }
    };

    var postEnvExclusionList = function (envId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/exclusionLists/`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("exclusionLists")
          .post(data);
      }
    };

    var putEnvExclusionList = function (envId, elId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/exclusionLists/${elId}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("exclusionLists", elId)
          .customPUT(data);
      }
    };

    var deleteEnvExclusionList = function (envId, elId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/exclusionLists/${elId}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("environment", envId)
          .one("exclusionLists", elId)
          .customDELETE("");
      }
    };

    var postEnvExclusionListValidateRequestedBy = function (envId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/validateRequestedBy`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("validateRequestedBy")
          .post(data);
      }
    };

    var postEnvExclusionListValidateList = function (envId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/validateList`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("validateList")
          .post(data);
      }
    };

    var postEnvExclusionListValidateListBeforeUpdate = function (envId, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/validateListBeforeUpdate`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("environment", envId)
          .all("validateListBeforeUpdate")
          .post(data);
      }
    };

    var getEnvTesters = function (envId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/${envId}/envTesters`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("environment", envId).all("envTesters").get("");
      }
    };

    var getAdmins = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`getAdmins`, null, "GET");
      } else {
        return Restangular.all("getAdmins").get("");
      }
    };

    var getTDMStats = function (body) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`taskStats`, body, "POST");
      } else {
        return Restangular.all("taskStats").post(body);
      }
    };

    var getLuTree = function (body) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return new Promise((resolve,reject) => {
           invokeFabricWebServiceWrapper(`wsGetTaskExeStatsForEntity`, body, "GET").then(resp => {
              if (resp && resp.errorCode === 'FAIL') {
                return reject({
                  errorCode: "FAIL",
                  message: resp.message
                });
              }
              var data = (resp && resp.result !== undefined) ? resp.result : [];
              var treeIterateWithMap = function(current,rootLU){
                current.lu_name = current.luName;
                current.lu_status = current.luStatus || 'completed';
                delete current.entityStatus;
                delete current.luStatus;
                delete current.luName;
                current.collapsed = true;
                if (!current.isRoot){
                    current.parentRootLuName = rootLU;
                }
                current.count = current.children && current.children.length || 0;
                current.hasChildren = current.children && current.children.length > 0 || false;
                if (!current.children || current.children.length == 0){
                    if (current.isRoot){
                        current.lu_status = current.luStatus || 'completed';
                    }
                    current.children = [];
                    return;
                }
                for (var i = 0, len = current.children.length; i < len; i++) {
                    treeIterateWithMap(current.children[i],rootLU);
                }
              };
              var tree = [];
              for (var key in data){
                  data[key].isRoot = true;
                  data[key].errorInPath = data[key].luStatus === 'failed';
                  tree.push(data[key]);
                  treeIterateWithMap(data[key],data[key].luName);
              }
              resolve({
                  errorCode: "SUCCESS",
                  message: null,
                  result: tree
              });
           }).catch(err => {
             reject({
              errorCode: "FAIL",
                message: err
            });
           });
        });
        // return invokeFabricWebServiceWrapper(`luTree`, body, "POST");
      } else {
        return Restangular.all("luTree").post(body);
      }
    };

    var getLUChildren = function (body) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`luChildren`, body, "POST");
      } else {
        return Restangular.all("luChildren").post(body);
      }
    };

    var getRunningTasks = function () {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(`runningTasks`, null, "GET");
      } else {
        return Restangular.all("runningTasks").get("");
      }
    };

    var getDbInterfacesByProductLUs = function (productId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `environment/product/${productId}/dbInterfaces`,
          null,
          "GET"
        );
      } else {
        return Restangular.all("environment")
          .one("product", productId)
          .all("dbInterfaces")
          .get("");
      }
    };

    var testInterfaceDbConnection = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `testDbConnection`,
          data,
          "POST"
        );
      } else {
        return Restangular.all("testDbConnection").post(data);
      }
    };

    var postExecutionProcess = function (beId, beName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/bename/${beName}/postexecutionprocess`,
          data,
          "POST"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .one("bename", beName)
          .all("postexecutionprocess")
          .post(data);
      }
    };

    var putExecutionProcess = function (beId, beName, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/bename/${beName}/postexecutionprocess/${data.process_id}`,
          data,
          "PUT"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .one("bename", beName)
          .one("postexecutionprocess", data.process_id)
          .customPUT(data);
      }
    };

    var deleteExecutionProcess = function (
      beId,
      beName,
      process_id,
      process_name
    ) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/bename/${beName}/postexecutionprocess/${process_id}/${process_name}`,
          null,
          "DELETE"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .one("bename", beName)
          .one("postexecutionprocess", process_id)
          .all(process_name)
          .customDELETE("");
      }
    };

    var getBEPostExecutionProcess = function (beId) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `businessentity/${beId}/postexecutionprocess`,
          null,
          "GET"
        );
      } else {
        return Restangular.one("businessentity", beId)
          .all("postexecutionprocess")
          .get("");
      }
    };

    var testInterfaceDbConnection = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `testDbConnection`,
          data,
          "POST"
        );
      } else {
        return Restangular.all("testDbConnection").post(data);
      }
    };

    var decryptInterfacePassword = function (data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `decryptInterfacePassword`,
          data,
          "POST"
        );
      } else {
        return Restangular.all("decryptInterfacePassword").post(data);
      }
    };

    var getSummaryReport = function (executionId, luName) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(
          `wsExecutionSummaryReport`,
          {
            i_taskExecutionId: executionId,
            i_luName: luName,
          },
          "GET"
        );
      } else {
        return Restangular.one("taskSummaryReport", executionId)
          .one("luName", luName)
          .get("");
      }
    };

    var getGenericAPI = function (url) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(url, null, "GET");
      } else {
        return Restangular.all(url).get("");
      }
    };

    var postGenericAPI = function (url, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(url, data, "POST");
      } else {
        return Restangular.all(url).post(data);
      }
    };

    var putGenericAPI = function (url, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(url, data, "PUT");
      } else {
        return Restangular.all(url).customPUT(data);
      }
    };

    var deleteGenericAPI = function (url, data) {
      if (window.k2api && window.k2api.invokeFabricWebService) {
        return invokeFabricWebServiceWrapper(url, data, "DELETE");
      } else {
        return Restangular.all(url).customDELETE(data);
      }
    };

    return {
      deleteGenericAPI: deleteGenericAPI,
      putGenericAPI: putGenericAPI,
      postGenericAPI: postGenericAPI,
      getGenericAPI: getGenericAPI,
      decryptInterfacePassword: decryptInterfacePassword,
      getSummaryReport: getSummaryReport,
      testInterfaceDbConnection: testInterfaceDbConnection,
      getDbInterfacesByProductLUs: getDbInterfacesByProductLUs,
      getSupportedDbTypes: getSupportedDbTypes,
      saveDBTypes: saveDBTypes,
      getDBTypes: getDBTypes,
      getEnvironments: getEnvironments,
      getEnvironment: getEnvironment,
      getProducts: getProducts,
      getProductsWithLUs: getProductsWithLUs,
      getProduct: getProduct,
      updateEnvironment: updateEnvironment,
      addEnvironment: addEnvironment,
      deleteEnvironment: deleteEnvironment,
      updateProduct: updateProduct,
      createProduct: createProduct,
      deleteProduct: deleteProduct,
      createDataCenter: createDataCenter,
      getDataCenters: getDataCenters,
      updateDataCenter: updateDataCenter,
      deleteDataCenter: deleteDataCenter,
      getProductInterfaces: getProductInterfaces,
      postProductInterface: postProductInterface,
      putProductInterface: putProductInterface,
      deleteProductInterface: deleteProductInterface,
      getLogicalUnits: getLogicalUnits,
      getProductLogicalUnits: getProductLogicalUnits,
      getBELogicalUnits: getBELogicalUnits,
      getLogicalUnitsWithoutProduct: getLogicalUnitsWithoutProduct,
      postLogicalUnits: postLogicalUnits,
      putLogicalUnit: putLogicalUnit,
      putLogicalUnits: putLogicalUnits,
      deleteLogicalUnit: deleteLogicalUnit,
      getBusinessEntities: getBusinessEntities,
      createBusinessEntity: createBusinessEntity,
      updateBusinessEntity: updateBusinessEntity,
      deleteBusinessEntity: deleteBusinessEntity,
      getTasks: getTasks,
      createTask: createTask,
      updateTask: updateTask,
      deleteTask: deleteTask,
      getEnvironmentRoles: getEnvironmentRoles,
      postEnvironmentRole: postEnvironmentRole,
      updateEnvironmentRole: updateEnvironmentRole,
      deleteEnvironmentRole: deleteEnvironmentRole,
      getTesters: getTesters,
      getOwners: getOwners,
      getEnvironmentRoleTesters: getEnvironmentRoleTesters,
      postEnvironmentRoleTesters: postEnvironmentRoleTesters,
      getProductsForBusinessEntityAndEnv: getProductsForBusinessEntityAndEnv,
      getLogicalUnitsForBusinessEntityAndEnv: getLogicalUnitsForBusinessEntityAndEnv,
      getTaskProducts: getTaskProducts,
      getTaskLogicalUnits: getTaskLogicalUnits,
      getTaskPostExecutionProcesses: getTaskPostExecutionProcesses,
      postTaskProducts: postTaskProducts,
      postTaskLogicalUnits: postTaskLogicalUnits,
      postTaskPostExecutionProcess: postTaskPostExecutionProcess,
      getRoleForUserInEnv: getRoleForUserInEnv,
      getEnvProducts: getEnvProducts,
      getEnvGlobals: getEnvGlobals,
      postEnvProduct: postEnvProduct,
      postEnvGlobal: postEnvGlobal,
      getAllGlobals: getAllGlobals,
      putEnvProduct: putEnvProduct,
      putEnvGlobal: putEnvGlobal,
      deleteEnvGlobal: deleteEnvGlobal,
      deleteEnvProduct: deleteEnvProduct,
      getEnvironmentOwners: getEnvironmentOwners,
      getEnvironmentsForUser: getEnvironmentsForUser,
      getBusinessEntityParameters: getBusinessEntityParameters,
      getAnalysisCount: getAnalysisCount,
      getTaskHistory: getTaskHistory,
      getSummaryTaskHistory: getSummaryTaskHistory,
      getActivities: getActivities,
      getNumOfTasksPerMonth: getNumOfTasksPerMonth,
      getNumOfCopiedEntitiesPerMonth: getNumOfCopiedEntitiesPerMonth,
      getNumOfTaskExecutionsPerMonth: getNumOfTaskExecutionsPerMonth,
      getNumOfProcessedEntitiesPerEnv: getNumOfProcessedEntitiesPerEnv,
      getNumOfTasksPerEnv: getNumOfTasksPerEnv,
      getBusinessEntitiesForEnvProducts: getBusinessEntitiesForEnvProducts,
      executeTask: executeTask,
      getProductEnvCount: getProductEnvCount,
      getEnvTaskCount: getEnvTaskCount,
      getTasksExecutionsStatus: getTasksExecutionsStatus,
      getTasksPerBE: getTasksPerBE,
      getDataCenterEnvironmentCount: getDataCenterEnvironmentCount,
      holdTask: holdTask,
      activateTask: activateTask,
      getBEProductCount: getBEProductCount,
      getEnvironmentSummary: getEnvironmentSummary,
      getTaskMonitor: getTaskMonitor,
      stopExecution: stopExecution,
      getTimeZone: getTimeZone,
      getNumProcessedCopiedFailedEntities: getNumProcessedCopiedFailedEntities,
      getNumCopiedFailedEntitiesPerLU: getNumCopiedFailedEntitiesPerLU,
      deleteTaskForBE: deleteTaskForBE,
      getEnvExclusionLists: getEnvExclusionLists,
      getEnvExclusionList: getEnvExclusionList,
      postEnvExclusionList: postEnvExclusionList,
      putEnvExclusionList: putEnvExclusionList,
      deleteEnvExclusionList: deleteEnvExclusionList,
      postEnvExclusionListValidateRequestedBy: postEnvExclusionListValidateRequestedBy,
      postEnvExclusionListValidateList: postEnvExclusionListValidateList,
      postEnvExclusionListValidateListBeforeUpdate: postEnvExclusionListValidateListBeforeUpdate,
      getEnvTesters: getEnvTesters,
      getAdmins: getAdmins,
      getTDMStats: getTDMStats,
      getLuTree: getLuTree,
      getLUChildren: getLUChildren,
      getRunningTasks: getRunningTasks,
      postExecutionProcess: postExecutionProcess,
      putExecutionProcess: putExecutionProcess,
      deleteExecutionProcess: deleteExecutionProcess,
      getBEPostExecutionProcess: getBEPostExecutionProcess,
      getUserRole: getUserRole,
      deleteRoleFromPermissionGroup: deleteRoleFromPermissionGroup,
      getUsersByPermssionGroups: getUsersByPermssionGroups,
      getFabricRoles: getFabricRoles,
      attachRoleToPermissionGroup: attachRoleToPermissionGroup,
      getPermissionGroups: getPermissionGroups,
    };
  })
  .factory(
    "AuthService",
    function (Restangular, $sessionStorage, USER_ROLES, Session,TDMService,$rootScope) {
      var userAuth = null;
      TDMService.getUserRole().then((resp) => {
        if (resp.errorCode !== 'SUCCESS' || !resp.result || ['admin','owner','tester'].indexOf(resp.result) < 0) {
          return;
        }
        $rootScope.allowed = true;
        const roleObj = {
          type: resp.result,
          id: resp.result === 'admin' ? 0 : 1,
        }
        userAuth = {
          accessToken: "tdm-WS",
          userName: "Admin",
          displayName: "Admin",
          userRole: roleObj,
          userID: "admin",
          tdmReprotsUrl: "http://[etlIpAddress]:3510/tdm_reports/",
          fluxMode: true,
          retentionPeriod: {
            maxRetentionPeriod: 90,
            defaultPeriod: {
              unit: "Days",
              value: 5,
            },
            availableOptions: [
              {
                name: "Minutes",
                units: 0.0006944444444444445,
              },
              {
                name: "Hours",
                units: 0.041666666666666664,
              },
              {
                name: "Days",
                units: 1,
              },
              {
                name: "Weeks",
                units: 7,
              },
              {
                name: "Years",
                units: 365,
              },
            ],
          },
          timezone: 0,
        };
        $sessionStorage.userAuthenticated = userAuth;
        Session.create(userAuth);
      }).catch(err => {

      });
      var getDisplayName = function () {
        if (userAuth && userAuth.displayName) return userAuth.displayName;
        return "Unknown User";
      };

      var getUsername = function () {
        if (userAuth && userAuth.userName) return userAuth.userName;
        return "Unknown User";
      };

      var getTDMReports = function () {
        return (
          (userAuth && userAuth.tdmReprotsUrl) ||
          "http://[etlIpAddress]:3210/tdm_reports/"
        );
      };

      var isAuthenticated = function () {
        if (Session && Session.userAuthenticated)
          return !!Session.userAuthenticated;
        return false;
      };

      var isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
          authorizedRoles = [authorizedRoles];
        }
        return (
          isAuthenticated() &&
          authorizedRoles.indexOf(
            USER_ROLES[Session.userAuthenticated.userRole.type]
          ) !== -1
        );
      };

      var getRole = function () {
        console.log(222);
        return userAuth.userRole;
      };

      var getUserId = function () {
        return userAuth.userID;
      };

      var authorizedToEdit = function (role) {
        if (USER_ROLES[userAuth.userRole.type] <= role) {
          return true;
        }
      };

      var isFluxMode = function () {
        return userAuth && userAuth.fluxMode == true;
      };

      var getRetentionPeriod = function () {
        return userAuth.retentionPeriod;
      };

      var getTimeZone = function () {
        return userAuth.timezone;
      };

      return {
        isFluxMode: isFluxMode,
        isAuthenticated: isAuthenticated,
        isAuthorized: isAuthorized,
        getUsername: getUsername,
        getRole: getRole,
        authorizedToEdit: authorizedToEdit,
        getUserId: getUserId,
        getDisplayName: getDisplayName,
        getTDMReports: getTDMReports,
        getRetentionPeriod: getRetentionPeriod,
        getTimeZone: getTimeZone,
      };
    }
  )
  .factory("BreadCrumbsService", function () {
    var data = [];
    var currentID = 0;
    return {
      push: function (translationData, name, callback) {
        data.push({
          click: currentID,
          translationData: translationData,
          name: name,
          callback: callback,
        });
        currentID++;
      },
      getAll: function () {
        return data;
      },
      init: function () {
        data = [];
        currentID = 0;
      },
      breadCrumbChange: function (click) {
        _.remove(data, function (n) {
          if (n.click > click) {
            currentID--;
            return true;
          }
          return false;
        });
      },
    };
  });
