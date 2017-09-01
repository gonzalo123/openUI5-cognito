sap.ui.define([
        "app/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "app/model/cognito"
    ], function (BaseController, JSONModel, MessageToast, cognito) {
        "use strict";

        var cognitoUser;
        return BaseController.extend("app.controller.Login", {
            model: {
                user: "",
                pass: "",
                flow: "login",
                verificationCode: undefined,
                newPass: undefined
            },

            onInit: function () {
                this.getView().setModel(new JSONModel(this.model));
            },

            newPassPressHandle: function () {
                var that = this;
                var targets = this.getOwnerComponent().getTargets();
                var attributesData = {};
                sap.ui.core.BusyIndicator.show();
                cognitoUser.completeNewPasswordChallenge(this.model.newPass, attributesData, {
                    onFailure: function (err) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(err.message);
                    },
                    onSuccess: function (data) {
                        sap.ui.core.BusyIndicator.hide();
                        that.getModel().setProperty("/flow", "login");
                        targets.display("home");
                    }
                })
            },

            newPassVerificationPressHandle: function () {
                var that = this;
                var targets = this.getOwnerComponent().getTargets();
                sap.ui.core.BusyIndicator.show();
                cognito.getCognitoUser(this.model.user).confirmPassword(this.model.verificationCode, this.model.newPass, {
                    onFailure: function (err) {
                        sap.ui.core.BusyIndicator.hide();
                        MessageToast.show(err);
                    },
                    onSuccess: function (result) {
                        sap.ui.core.BusyIndicator.hide();
                        that.getModel().setProperty("/flow", "PasswordReset");
                        targets.display("home");
                    }
                });
            },

            loginPressHandle: function () {
                var that = this;
                var targets = this.getOwnerComponent().getTargets();
                sap.ui.core.BusyIndicator.show();
                cognitoUser = cognito.authenticateUser(this.model.user, this.model.pass, {
                    onSuccess: function (result) {
                        sap.ui.core.BusyIndicator.hide();
                        targets.display("home");
                    },

                    onFailure: function (err) {
                        sap.ui.core.BusyIndicator.hide();
                        switch (err.code) {
                            case "PasswordResetRequiredException":
                                that.getModel().setProperty("/flow", "PasswordReset");
                                break;
                            default:
                                MessageToast.show(err.message);
                        }
                    },

                    newPasswordRequired: function (userAttributes, requiredAttributes) {
                        sap.ui.core.BusyIndicator.hide();
                        that.getModel().setProperty("/flow", "newPasswordRequired");
                    }
                });
            }
        });
    }
);