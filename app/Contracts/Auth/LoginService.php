<?php
namespace App\Contracts\Auth;
/*Este código define la interface llamada LoginService que requiere que 
las clases que la implementen tengan un método llamado login.*/
interface LoginService {
    /** @return array{token:string, abilities:array<string>, user:\App\Models\User} */
    public function login(array $credentials): array;
}