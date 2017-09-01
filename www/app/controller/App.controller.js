sap.ui.define([
        "app/controller/BaseController",
        "sap/ui/model/json/JSONModel"
    ], function (BaseController, JSONModel) {
        "use strict";

        return BaseController.extend("app.controller.App", {

            onInit: function () {
                var oViewModel,
                    iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

                oViewModel = new JSONModel({
                    busy: true,
                    delay: 0
                });
                this.setModel(oViewModel, "appView");

                oViewModel.setProperty("/busy", false);
                oViewModel.setProperty("/delay", iOriginalBusyDelay);

                this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
            }
        });
    }
);