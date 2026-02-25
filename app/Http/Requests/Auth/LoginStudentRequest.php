<?php
namespace App\Http\Requests\Auth;
use Illuminate\Foundation\Http\FormRequest;
/*Clase: LoginStudentRequest
Descripción: Esta clase se encarga de validar los datos de inicio de sesión para el estudiante.
*/
class LoginStudentRequest extends FormRequest {
    public function authorize(): bool { return true; }
    public function rules(): array {
        return [
            'no_control' => ['required','string','max:50'],
            'password'   => ['required','string','min:4'],
        ];
    }
}