<?php

namespace Tests\Unit;

use App\Http\Requests\Auth\LoginAdminRequest;
use App\Http\Requests\Auth\LoginCoordinatorRequest;
use App\Http\Requests\Auth\LoginStudentRequest;
use App\Http\Requests\DownloadGeneratedDocumentPdfRequest;
use App\Http\Requests\GenerateDocumentTemplateRequest;
use App\Http\Requests\StoreDocumentTemplateRequest;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use Tests\TestCase;

class FormRequestRulesTest extends TestCase
{
    public function test_login_requests_match_role_credentials(): void
    {
        $adminRules = (new LoginAdminRequest())->rules();
        $coordinatorRules = (new LoginCoordinatorRequest())->rules();
        $studentRules = (new LoginStudentRequest())->rules();

        $this->assertSame(['required', 'email', 'max:255'], $adminRules['email']);
        $this->assertSame(['required', 'string', 'min:4'], $adminRules['password']);
        $this->assertSame(['required', 'email', 'max:255'], $coordinatorRules['email']);
        $this->assertSame(['required', 'string', 'min:4'], $coordinatorRules['password']);
        $this->assertSame(['required', 'string', 'max:50'], $studentRules['no_control']);
        $this->assertSame(['required', 'string', 'min:4'], $studentRules['password']);
    }

    public function test_report_requests_validate_evidence_context_and_attachments(): void
    {
        $storeRules = (new StoreReportRequest())->rules();
        $updateRules = (new UpdateReportRequest())->rules();

        $this->assertSame(['required', 'exists:evidences,id'], $storeRules['evidence_id']);
        $this->assertSame(['nullable', 'exists:periods,id'], $storeRules['periodo_id']);
        $this->assertSame(['required', 'string', 'max:255'], $storeRules['titulo']);
        $this->assertArrayNotHasKey('fecha_limite', $storeRules);
        $this->assertSame(['nullable', 'file', 'max:4096'], $storeRules['attachment']);

        $this->assertSame(['sometimes', 'required', 'exists:evidences,id'], $updateRules['evidence_id']);
        $this->assertArrayNotHasKey('fecha_limite', $updateRules);
        $this->assertSame(['nullable', 'boolean'], $updateRules['remove_attachment']);
    }

    public function test_document_template_requests_validate_content_and_generation_scope(): void
    {
        $templateRules = (new StoreDocumentTemplateRequest())->rules();
        $generationRules = (new GenerateDocumentTemplateRequest())->rules();
        $pdfRules = (new DownloadGeneratedDocumentPdfRequest())->rules();

        $this->assertSame(['required', 'string', 'max:255'], $templateRules['titulo']);
        $this->assertSame(['required', 'string', 'max:400000'], $templateRules['body_html']);
        $this->assertSame(['nullable', 'string', 'max:20', 'regex:/^[a-z0-9]+$/i'], $templateRules['source_extension']);

        $this->assertContains('required', $generationRules['scope']);
        $this->assertContains('required_if:scope,student', $generationRules['student_id']);
        $this->assertContains('required_if:scope,career', $generationRules['career']);
        $this->assertSame(['nullable', 'integer', 'exists:periods,id'], $generationRules['periodo_id']);

        $this->assertSame(['required', 'integer', 'exists:students,id'], $pdfRules['student_id']);
        $this->assertSame(['nullable', 'integer', 'exists:periods,id'], $pdfRules['periodo_id']);
    }
}
