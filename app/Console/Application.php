<?php

namespace App\Console;

use App\Console\Support\LaravelAwareContainerCommandLoader;
use Illuminate\Console\Application as BaseApplication;

class Application extends BaseApplication
{
    public function setContainerCommandLoader()
    {
        $this->setCommandLoader(new LaravelAwareContainerCommandLoader($this->getLaravel(), $this->commandMap));

        return $this;
    }
}
