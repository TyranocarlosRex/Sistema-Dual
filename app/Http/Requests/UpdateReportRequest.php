<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
/*Clase: UpdateReportRequest
Descripción: Esta clase se encarga de validar los datos para actualizar un reporte existente.
*/
class UpdateReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Igual que en StoreReportRequest
        return $this->user() && $this->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'evidence_id' => ['sometimes', 'required', 'exists:evidences,id'],
            'titulo'       => ['required', 'string', 'max:255'],
            'descripcion'  => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'attachment'   => ['nullable', 'file', 'max:4096'],
            'remove_attachment' => ['nullable', 'boolean'],
        ];
    }
}
