<?php

namespace App\Services\Auth\Concerns;

use Illuminate\Http\Exceptions\HttpResponseException;

/*Trait: JsonFails
Descripción: Este trait proporciona un método para lanzar excepciones HTTP con respuestas 
JSON personalizadas,lo que es útil para manejar errores de autenticación en una API.
*/
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
