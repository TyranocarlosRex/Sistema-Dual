<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Period;
use Illuminate\Http\Request;

trait ResolvesPeriodContext
{
    protected function resolvePeriodFromRequest(Request $request): ?Period
    {
        $requestedPeriodId = $request->query(
            'periodo_id',
            $request->input('periodo_id', $request->query('period_id', $request->input('period_id')))
        );

        if (blank($requestedPeriodId)) {
            return Period::current();
        }

        return Period::query()->findOrFail($requestedPeriodId);
    }
}
