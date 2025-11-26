<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

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
            'titulo'       => ['required', 'string', 'max:255'],
            'descripcion'  => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'attachment'   => ['nullable', 'file', 'max:4096'],
        ];
    }
}
