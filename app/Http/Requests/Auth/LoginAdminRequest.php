<?php
namespace App\Http\Requests\Auth;
use Illuminate\Foundation\Http\FormRequest;

/*Clase: LoginAdminRequest
Descripción: Esta clase se encarga de validar los datos de inicio de sesión para el administrador.
*/
class LoginAdminRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'email'    => ['required','email','max:255'],
            'password' => ['required','string','min:4'],
        ];
    }
}