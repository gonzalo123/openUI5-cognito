Authenticate OpenUI5 applications and Lumen backend with Amazon Cognito and JWT  
======

Today I want to create an OpenUI5 boilerplate that plays with Lumen backends. Simple, isn't it? We only need to create a Lumen API server and connect our OpenUI5 application with this API server. But today I also want to create a Login also. The typical user/password input form. I don't want to build it from scratch (a user database, oauth provider or something like that). Since this days I'm involved with Amazon AWS projects I want to try Amazon Cognito.

Cognito has a great javaScript SDK. In fact we can do all the authentication flow (create users, validate passwords, change password, multifactor authentication, ...) with Cognito. To create this project first I've create the following steps within Amazon AWS Cognito Console: Create a user pool with required attributes (email only in this example), without MFA and only allow administrators to create users. I've also created a App client inside this pool, so I've got a UserPoolId and a ClientId.

Let's start with the OpenUI5 application. I've created an small application with one route called "home". To handle the login process I will work in Component.js init function. The idea is check the cognito session. If there's an active one (that's means a Json Web Token stored in the local storage) we'll display to "home" route and if there isn't we'll show login one.

```js
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

            /* *** */
        });
    }
);
```

To encapsulate the cognito operations I've create a model called cognito.js. It's not perfect, but it allows me to abstract cognito stuff in the OpenUI5 application.

```js
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
```

The login route has the following xml view:

```xml
<core:View
        xmlns:core="sap.ui.core"
        xmlns:f="sap.ui.layout.form"
        xmlns="sap.m"
        controllerName="app.controller.Login"
>
    <Image class="bg"></Image>
    <VBox class="sapUiSmallMargin loginForm">
        <f:SimpleForm visible="{= ${/flow} === 'login' }">
            <f:toolbar>
                <Toolbar>
                    <Title text="{i18n>Login_Title}" level="H4" titleStyle="H4"/>
                </Toolbar>
            </f:toolbar>
            <f:content>
                <Label text="{i18n>Login_user}"/>
                <Input placeholder="{i18n>Login_userPlaceholder}" value="{/user}"/>
                <Label text="{i18n>Login_pass}"/>
                <Input type="Password" placeholder="{i18n>Login_passPlaceholder}" value="{/pass}"/>
                <Button type="Accept" text="{i18n>OK}" press="loginPressHandle"/>
            </f:content>
        </f:SimpleForm>
        
        <f:SimpleForm visible="{= ${/flow} === 'PasswordReset' }">
            <f:toolbar>
                <Toolbar>
                    <Title text="{i18n>Login_PasswordReset}" level="H4" titleStyle="H4"/>
                </Toolbar>
            </f:toolbar>
            <f:content>
                <Label text="{i18n>Login_verificationCode}"/>
                <Input type="Number" placeholder="{i18n>Login_verificationCodePlaceholder}" value="{/verificationCode}"/>
                <Label text="{i18n>Login_newpass}"/>
                <Input type="Password" placeholder="{i18n>Login_newpassPlaceholder}" value="{/newPass}"/>
                <Button type="Accept" text="{i18n>OK}" press="newPassVerificationPressHandle"/>
            </f:content>
        </f:SimpleForm>
        
        <f:SimpleForm visible="{= ${/flow} === 'newPasswordRequired' }">
            <f:toolbar>
                <Toolbar>
                    <Title text="{i18n>Login_PasswordReset}" level="H4" titleStyle="H4"/>
                </Toolbar>
            </f:toolbar>
            <f:content>
                <Label text="{i18n>Login_newpass}"/>
                <Input type="Password" placeholder="{i18n>Login_newpassPlaceholder}" value="{/newPass}"/>
                <Button type="Accept" text="{i18n>OK}" press="newPassPressHandle"/>
            </f:content>
        </f:SimpleForm>
    </VBox>
</core:View>
```

It has three different stages: "login", "PasswordReset" and "newPasswordRequired" 
"login" is the main one. In this stage the user can input his login credentials. If credentials are OK then we'll display home route.
The first time a user log in in the application with the password provided by the administrator, Cognito will force to change the password. Then We'll show newPasswordRequired flow. I'm not going to explain each step. We developers prefer code than texts. That's the code:

```js
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
```

The home route is the main one. It asumes that there's an active Cognito session enabled.

```xml
<mvc:View
        controllerName="app.controller.Home"
        xmlns="sap.m"
        xmlns:mvc="sap.ui.core.mvc"
        xmlns:semantic="sap.m.semantic">
    <semantic:FullscreenPage
            id="page"
            semanticRuleSet="Optimized"
            showNavButton="false"
            title="{i18n>loggedUser}: {/userName}">
        <semantic:content>
            <Panel width="auto" class="sapUiResponsiveMargin" accessibleRole="Region">
                <headerToolbar>
                    <Toolbar height="3rem">
                        <Title text="Title"/>
                    </Toolbar>
                </headerToolbar>
                <content>
                    <Text text="Lorem ipsum dolor st amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat"/>
                    <Button text="{i18n>Hello}" icon="sap-icon://hello-world" press="helloPress"/>
                </content>
            </Panel>
        </semantic:content>
        <semantic:customFooterContent>
            <Button text="{i18n>LogOff}" icon="sap-icon://visits" press="onLogOffPress"/>
        </semantic:customFooterContent>
    </semantic:FullscreenPage>
</mvc:View>
```

It shows the Cognito login name. It alos has a simple logff button and also one button that calls to the backend.

```js
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
```

To handle ajax requests I've create an api model. This model injects jwt inside every request.

```js
sap.ui.define([
    "sap/m/MessageToast",
    "app/model/cognito"
], function (MessageToast, cognito) {
    "use strict";

    var backend = "";

    return {
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
```

That's the frontend. Now it's time to backend. Our Backend will be a simple Lumen server.

```php
use App\Http\Middleware;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Laravel\Lumen\Application;

(new Dotenv\Dotenv(__DIR__ . "/../env/"))->load();

$app = new Application();

$app->singleton(ExceptionHandler::class, App\Exceptions\Handler::class);

$app->routeMiddleware([
    'cognito' => Middleware\AuthCognitoMiddleware::class,
]);

$app->register(App\Providers\RedisServiceProvider::class);

$app->group([
    'middleware' => 'cognito',
    'namespace'  => 'App\Http\Controllers',
], function (Application $app) {
    $app->get("/api/hi", "DemoController@hi");
});

$app->run();
```

As you can see I've created a middelware to handle the authentication. This middleware will check the jwt provided by the frontend. We will use "spomky-labs/jose" library to validate the token. 

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Jose\Factory\JWKFactory;
use Jose\Loader;
use Monolog\Logger;
use Symfony\Component\Cache\Adapter\RedisAdapter;

class AuthCognitoMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $payload = $this->getPayload($request->get('_jwt'), $this->getJwtWebKeys());
            config([
                "userInfo" => [
                    'username' => $payload['cognito:username'],
                    'email'    => $payload['email'],
                ],
            ]);
        } catch (\Exception $e) {
            $log = app(Logger::class);
            $log->alert($e->getMessage());

            return response('Token Error', 403);
        }

        return $next($request);
    }

    private function getJwtWebKeys()
    {
        $url      = sprintf(
            'https://cognito-idp.%s.amazonaws.com/%s/.well-known/jwks.json',
            getenv('AWS_REGION'),
            getenv('AWS_COGNITO_POOL')
        );
        $cacheKey = sprintf('JWKFactory-Content-%s', hash('sha512', $url));

        $cache = app(RedisAdapter::class);

        $item = $cache->getItem($cacheKey);
        if (!$item->isHit()) {
            $item->set($this->getContent($url));
            $item->expiresAfter((int)getenv("TTL_JWK_CACHE"));
            $cache->save($item);
        }

        return JWKFactory::createFromJKU($url, false, $cache);
    }

    private function getPayload($accessToken, $jwtWebKeys)
    {
        $loader  = new Loader();
        $jwt     = $loader->loadAndVerifySignatureUsingKeySet($accessToken, $jwtWebKeys, ['RS256']);
        $payload = $jwt->getPayload();

        return $payload;
    }

    private function getContent($url)
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_URL            => $url,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $content = curl_exec($ch);
        curl_close($ch);

        return $content;
    }
}
```

To validate jwt Cognito tokens we need to obtain JwtWebKeys from this url

```
https://cognito-idp.[my_aws_region].amazonaws.com/[my_aws_cognito_pool]/.well-known/jwks.json
```

That means that we need to fetch this url within every backend request, and that's not cool. spomky-labs/jose allows us to use a cache to avoid fetch the request again and again. This cache is an instance of something that implementes the interface Psr\Cache\CacheItemPoolInterface. I'm not going to create a Cache from scratch. I'm not crazy. I'll use symfony/cache here with a Redis adapter

And basically that's all.