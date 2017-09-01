<?php

namespace App\Http\Controllers;

use Laravel\Lumen\Routing\Controller;

class DemoController extends Controller
{
    public function hi()
    {
        return ['userInfo' => config('userInfo')];
    }
}
