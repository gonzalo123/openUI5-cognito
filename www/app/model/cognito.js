sap.ui.define([
        "app/conf/env"
    ], function (env) {
        "use strict";

        AWSCognito.config.region = env.region;

        var poolData = {
            UserPoolId: env.UserPoolId,
            ClientId: env.ClientId
        };

        var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
        var jwt;

        var cognito = {
            getJwt: function () {
                return jwt;
            },

            hasSession: function (cbk) {
                var cognitoUser = cognito.getCurrentUser();
                if (cognitoUser != null) {
                    cognitoUser.getSession(function (err, session) {
                        if (err) {
                            cbk(err);
                            return;
                        }
                        if (session.isValid()) {
                            jwt = session.idToken.getJwtToken();
                            cbk(false, session)
                        } else {
                            cbk(true);
                        }
                    });
                } else {
                    cbk(true);
                }
            },

            getCurrentUser: function () {
                return userPool.getCurrentUser();
            },

            signOut: function () {
                var currentUser = cognito.getCurrentUser();
                if (currentUser) {
                    currentUser.signOut()
                }
            },

            getUsername: function () {
                var currentUser = cognito.getCurrentUser();
                return (currentUser) ? currentUser.username : undefined;
            },

            getUserData: function (user) {
                return {
                    Username: user,
                    Pool: userPool
                };
            },

            getCognitoUser: function (user) {
                return new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(cognito.getUserData(user));
            },

            authenticateUser: function (user, pass, cbk) {
                var authenticationData = {
                    Username: user,
                    Password: pass
                };

                var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
                var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(cognito.getUserData(user));

                cognitoUser.authenticateUser(authenticationDetails, cbk);

                return cognitoUser;
            }
        };

        return cognito;
    }
);