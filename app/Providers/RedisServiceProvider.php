<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Predis\Client;
use Symfony\Component\Cache\Adapter\RedisAdapter;

class RedisServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $parameters = [
            'scheme' => 'tcp',
            'host'   => getenv("REDIS_HOST"),
            'port'   => getenv("REDIS_PORT"),
        ];

        $password = getenv("REDIS_PASSWORD");
        if ($password) {
            $parameters['password'] = $password;
        }

        $this->app->instance(Client::class, new Client($parameters));
        $this->app->instance(RedisAdapter::class, new RedisAdapter(app(Client::class)));
    }
}
