<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/*Clase: StoreReportRequest
Descripción: Esta clase se encarga de validar los datos para crear un nuevo reporte.
*/
class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        // El acceso ya lo limita el middleware abilities:admin
        return true;
    }

    public function rules(): array
    {
        return [
            'evidence_id' => ['required', 'exists:evidences,id'],
            'periodo_id'  => ['nullable', 'exists:periods,id'],
            'period_id'   => ['nullable', 'exists:periods,id'],
            'titulo'       => ['required', 'string', 'max:255'],
            'descripcion'  => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'attachment'   => ['nullable', 'file', 'max:4096'],
        ];
    }
}
