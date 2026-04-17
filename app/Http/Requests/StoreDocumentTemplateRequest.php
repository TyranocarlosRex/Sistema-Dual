<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'header_html' => ['nullable', 'string', 'max:200000'],
            'body_html' => ['required', 'string', 'max:400000'],
            'footer_html' => ['nullable', 'string', 'max:200000'],
            'source_filename' => ['nullable', 'string', 'max:255'],
            'source_extension' => ['nullable', 'string', 'max:20', 'regex:/^[a-z0-9]+$/i'],
        ];
    }
}
