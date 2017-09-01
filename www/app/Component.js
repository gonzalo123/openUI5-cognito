sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "app/model/models",
        "app/model/cognito"
    ], function (UIComponent, Device, models, cognito) {
        "use strict";

        return UIComponent.extend("app.Component", {

            metadata: {
                manifest: "json"
            },

            init: function () {
                UIComponent.prototype.init.apply(this, arguments);
                this.setModel(models.createDeviceModel(), "device");
                this.getRouter().initialize();

                var targets = this.getTargets();
                cognito.hasSession(function (err) {
                    if (err) {
                        targets.display("login");
                        return;
                    }
                    targets.display("home");
                });
            },

            destroy: function () {
                UIComponent.prototype.destroy.apply(this, arguments);
            },

            getContentDensityClass: function () {
                if (this._sContentDensityClass === undefined) {
                    if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
                        this._sContentDensityClass = "";
                    } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
                        this._sContentDensityClass = "sapUiSizeCompact";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    }
                }
                return this._sContentDensityClass;
            }
        });
    }
);