<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DownloadGeneratedDocumentPdfRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->filled('periodo_id') && $this->filled('period_id')) {
            $this->merge([
                'periodo_id' => $this->input('period_id'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'periodo_id' => ['nullable', 'integer', 'exists:periods,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
        ];
    }
}
