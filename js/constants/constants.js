angular
    .module('TDM-FE')
    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    })
    .constant('USER_ROLES', {
        admin: 0,
        user: 1
    })
    .constant('BE_BASE_URL', {
        url: 'http://localhost:3000/api'
        // url : 'http://82.81.174.59:3000/api'
        //url : 'http://163.172.176.227:3000/api'
        //  url : 'http://localhost:3000/api'
    })
    .constant('FE_VERSION', {
        version: '7.0'
    })
    .constant('TASK', {
        timeInterval: 5000
    })
    .constant('LOGIN_BANNER', {
        enabled: false,
        text :`
        This system is for the use of authorized users only.

        Individuals using this computer system without authority, or in excess of their authority, are subject to having all of their activities on this system monitored and recorded by system personnel.

        In the course of monitoring individuals improperly using this system, or in the course of system maintenance, the activities of authorized users may also be monitored.
        
        Anyone using this system expressly consents to such monitoring and is advised that if such monitoring reveals possible evidence of criminal activity, system personnel may provide the evidence of such monitoring to law enforcement officials.
`
    })
    .constant('DASHBOARD', {
        display: false
    });
