sap.ui.define([
        "app/controller/BaseController",
        "sap/ui/model/json/JSONModel",
        "sap/m/MessageToast",
        "app/model/cognito",
        "app/model/api"
    ], function (BaseController, JSONModel, MessageToast, cognito, api) {
        "use strict";

        return BaseController.extend("app.controller.Home", {
            model: {
                userName: ""
            },

            onInit: function () {
                this.model.userName = cognito.getUsername();
                this.getView().setModel(new JSONModel(this.model));
            },

            helloPress: function () {
                api.get("/api/hi", {}, function (data) {
                    MessageToast.show("Hello user " + data.userInfo.username + " (" + data.userInfo.email + ")");
                });
            },

            onLogOffPress: function () {
                cognito.signOut();
                this.getOwnerComponent().getTargets().display("login");
            }
        });
    }
);