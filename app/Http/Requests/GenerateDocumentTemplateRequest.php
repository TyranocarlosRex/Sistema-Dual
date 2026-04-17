<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateDocumentTemplateRequest extends FormRequest
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
            'scope' => ['required', Rule::in(['student', 'all', 'career'])],
            'student_id' => ['nullable', 'integer', 'exists:students,id', 'required_if:scope,student'],
            'career' => ['nullable', 'string', 'max:255', 'required_if:scope,career'],
            'periodo_id' => ['nullable', 'integer', 'exists:periods,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
        ];
    }
}
