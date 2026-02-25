/*Este código define la interface llamada TokenIssuer que requiere que
las clases que la implementen tengan un método llamado issue que toma un objeto User, 
un array de habilidades y un nombre opcional, y devuelve una cadena de texto.*/
<?php
namespace App\Contracts\Auth;
use App\Models\User;
interface TokenIssuer {
    public function issue(User $user, array $abilities, ?string $name = 'api'): string;
}