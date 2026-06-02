<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'evidence_id' => ['sometimes', 'required', 'exists:evidences,id'],
            'periodo_id'  => ['sometimes', 'nullable', 'exists:periods,id'],
            'period_id'   => ['sometimes', 'nullable', 'exists:periods,id'],
            'titulo'       => ['required', 'string', 'max:255'],
            'descripcion'  => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'attachment'   => ['nullable', 'file', 'max:4096'],
            'remove_attachment' => ['nullable', 'boolean'],
        ];
    }
}
