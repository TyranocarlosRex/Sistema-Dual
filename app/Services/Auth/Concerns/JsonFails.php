<?php

namespace App\Services\Auth\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;

trait JsonFails
{
    /** @return never */
    private function fail(string $message, int $status): never
    {
        throw new HttpResponseException(
            response()->json(['message' => $message], $status)
        );
    }
}
