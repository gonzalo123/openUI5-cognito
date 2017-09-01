<?php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Http\Middleware;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Laravel\Lumen\Application;

(new Dotenv\Dotenv(__DIR__ . "/../env/"))->load();

$app = new Application();

$app->singleton(ExceptionHandler::class, App\Exceptions\Handler::class);

$app->routeMiddleware([
    'cognito' => Middleware\AuthCognitoMiddleware::class,
]);

$app->register(App\Providers\LogServiceProvider::class);
$app->register(App\Providers\RedisServiceProvider::class);

$app->group([
    'middleware' => 'cognito',
    'namespace'  => 'App\Http\Controllers',
], function (Application $app) {
    $app->get("/api/hi", "DemoController@hi");
});

$app->run();