<?php

namespace App\Console\Support;

use Illuminate\Console\Command as LaravelCommand;
use Illuminate\Console\ContainerCommandLoader;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Exception\CommandNotFoundException;

class LaravelAwareContainerCommandLoader extends ContainerCommandLoader
{
    public function get(string $name): Command
    {
        if (! $this->has($name)) {
            throw new CommandNotFoundException(sprintf('Command "%s" does not exist.', $name));
        }

        $command = $this->container->get($this->commandMap[$name]);

        if ($command instanceof LaravelCommand) {
            $command->setLaravel($this->container);
        }

        return $command;
    }
}
