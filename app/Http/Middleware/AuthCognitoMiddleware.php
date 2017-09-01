<?php

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
            /** @var Logger $log */
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