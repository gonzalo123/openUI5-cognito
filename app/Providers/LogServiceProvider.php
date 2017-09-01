<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Monolog\Formatter\LineFormatter;
use Monolog\Handler\ErrorLogHandler;
use Monolog\Logger;

class LogServiceProvider extends ServiceProvider
{
    public function register()
    {
        $logger = new Logger(getenv('LOG_NAME'));

        $errorLogHandler = new ErrorLogHandler();
        $errorLogHandler->setFormatter(new LineFormatter(null, null, false, true));
        $logger->pushHandler($errorLogHandler);

        $this->app->instance(Logger::class, $logger);
    }
}