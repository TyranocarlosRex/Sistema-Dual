<?php

namespace App\Services\Auth\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;

trait JsonFails
{
    /**
     * Throw a JSON HttpResponseException with a short message.
     *
     * @return never
     */
    private function fail(string $message, int $status): never
    {
        throw new HttpResponseException(
            response()->json(['message' => $message], $status)
        );
    }
}
