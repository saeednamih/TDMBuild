
var run_once_flag = true;

function tasksCtrl ($scope, $rootScope, AuthService, BreadCrumbsService,$timeout,$state) {

    if (run_once_flag) {

        // localStorage.setItem(AuthService.getUsername(), 10000);
        $rootScope.reload_interval = 5000;
        run_once_flag = false;
    }

    var tasksCtrl = this;
    tasksCtrl.pageDisplay = 'tasksTable';
    $rootScope.inter_flag = true;

    // tasksCtrl.openEntitiesExecStats = function (taskEntity) {
    //
    //     tasksCtrl.pageDisplay = 'taskHistory';
    // }

    tasksCtrl.openTasks = function (reload) {
        if (reload) {
            $state.reload();
        }
        tasksCtrl.tasksData = {
            openTask: tasksCtrl.openTask,
            openNewTask: tasksCtrl.openNewTask,
            openTaskHistory: tasksCtrl.openTaskHistory,
            openTaskSummary: tasksCtrl.openTaskSummary
        };
        tasksCtrl.pageDisplay = 'tasksTable';
        BreadCrumbsService.breadCrumbChange(1);
    };


    tasksCtrl.openEntitiesExecStats = function (taskExecId,type,fabricExecutionId,selectionMethod,refCount)
    {
        tasksCtrl.tasksData = {
            openTask: tasksCtrl.openTask,
            openNewTask: tasksCtrl.openNewTask,
            openTaskHistory: tasksCtrl.openTaskHistory,
            openTaskSummary: tasksCtrl.openTaskSummary,
            taskExecId:taskExecId,
            fabricExecutionId:fabricExecutionId,
            selectionMethod:selectionMethod,
            refCount : refCount,
            type: type
        };
        tasksCtrl.pageDisplay = 'taskStats';
        BreadCrumbsService.breadCrumbChange(3);

    }
    tasksCtrl.openTask = function(task,copy){
        tasksCtrl.taskData = {
            mode : "update",
            task : task,
            openTasks : tasksCtrl.openTasks,
            copy : copy
        };
        tasksCtrl.pageDisplay = 'task';
    };

    tasksCtrl.openTaskHistory = function(task, exec_id){
        tasksCtrl.taskData = {
            task : task,
            openTasks : tasksCtrl.openTasks,
            openTaskHistory: tasksCtrl.openTaskHistory,
            exec_id: exec_id,
            pageDisplay: 'taskHistory'

        };
        tasksCtrl.pageDisplay = 'taskSummary';
    };

    tasksCtrl.openTaskSummary = function(task){
        $timeout(function(){
            tasksCtrl.taskData = {
                task : task,
                openTaskHistory: tasksCtrl.openTaskHistory,
                pageDisplay: 'taskSummary'
            };
            tasksCtrl.pageDisplay = 'taskSummary';
        });
    };

    tasksCtrl.openNewTask = function(tasks,copyTask){
        tasksCtrl.taskData = {
            mode : "create",
            task : copyTask,
            openTasks : tasksCtrl.openTasks,
            tasks : tasks
        };
        tasksCtrl.pageDisplay = 'newTask';
    };

    BreadCrumbsService.breadCrumbChange(0);
    BreadCrumbsService.push({},'TASKS',function(){
        tasksCtrl.openTasks();
    });

    // if( !localStorage.getItem('reloadInterval')) {
      // localStorage.setItem('reloadInterval', 10000);
    // }
	// if( !localStorage.getItem(AuthService.getUsername())) {
      // localStorage.setItem(AuthService.getUsername(), 10000);
    // }
    var reload_interval = localStorage.getItem(AuthService.getUsername());

    function reloadPage(){
      if (!tasksCtrl.taskData || tasksCtrl.taskData.pageDisplay !== 'taskHistory' && 
        tasksCtrl.taskData.pageDisplay !== 'none') {
        return;
      }
      if (tasksCtrl.reloadTimeout) {
          $timeout.cancel(tasksCtrl.reloadTimeout)
      }
      tasksCtrl.reloadTimeout = $timeout(() => {
          reload_interval = localStorage.getItem(AuthService.getUsername());
          console.log('broadcasted');
          var pageDisplay = tasksCtrl.pageDisplay;
          tasksCtrl.pageDisplay = 'none';
          $timeout(function(){
            tasksCtrl.pageDisplay = pageDisplay;
          },300);
      }, 500);
    }

    $rootScope.$on('refreshPage', reloadPage);

    tasksCtrl.tasksData = {
        openTask : tasksCtrl.openTask,
        openNewTask : tasksCtrl.openNewTask,
        openTaskHistory : tasksCtrl.openTaskHistory,
        openTaskSummary: tasksCtrl.openTaskSummary
    };
    tasksCtrl.pageDisplay = 'tasksTable';

}

angular
    .module('TDM-FE')
    .controller('tasksCtrl' , tasksCtrl);