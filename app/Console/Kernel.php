<?php

namespace App\Console;

use Symfony\Component\EventDispatcher\EventDispatcher;

class Kernel extends \Illuminate\Foundation\Console\Kernel
{
    protected function getArtisan()
    {
        if (is_null($this->artisan)) {
            $this->artisan = (new Application($this->app, $this->events, $this->app->version()))
                ->resolveCommands($this->commands)
                ->setContainerCommandLoader();

            if ($this->symfonyDispatcher instanceof EventDispatcher) {
                $this->artisan->setDispatcher($this->symfonyDispatcher);
                $this->artisan->setSignalsToDispatchEvent();
            }
        }

        return $this->artisan;
    }
}
