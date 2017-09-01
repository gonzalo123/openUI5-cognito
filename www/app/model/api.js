sap.ui.define([
    "sap/m/MessageToast",
    "app/model/cognito"
], function (MessageToast, cognito) {
    "use strict";

    var backend = "";

    return {
        post: function (uri, params, cb) {
            params = params || {};
            params._jwt = cognito.getJwt();
            sap.ui.core.BusyIndicator.show(1000);

            jQuery.ajax({
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(params),
                url: backend + uri,
                cache: false,
                dataType: "json",
                async: true,
                success: function (data, textStatus, jqXHR) {
                    sap.ui.core.BusyIndicator.hide();
                    cb(data);
                },
                error: function (data, textStatus, jqXHR) {
                    sap.ui.core.BusyIndicator.hide();
                    switch (data.status) {
                        case 403: // Forbidden
                            MessageToast.show('Auth error');
                            break;
                        default:
                            console.log('Error', data);
                    }
                }
            });
        },

        get: function (uri, params, cb) {
            params = params || {};
            params._jwt = cognito.getJwt();
            sap.ui.core.BusyIndicator.show(1000);

            jQuery.ajax({
                type: "GET",
                contentType: "application/json",
                data: params,
                url: backend + uri,
                cache: false,
                dataType: "json",
                async: true,
                success: function (data, textStatus, jqXHR) {
                    sap.ui.core.BusyIndicator.hide();
                    cb(data);
                },
                error: function (data, textStatus, jqXHR) {
                    sap.ui.core.BusyIndicator.hide();
                    switch (data.status) {
                        case 403: // Forbidden
                            MessageToast.show('Auth error');
                            break;
                        default:
                            console.log('Error', data);
                    }
                }
            });
        }
    };
});