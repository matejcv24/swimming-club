<?php

namespace App\Http\Controllers;

use App\Support\MonthlyReport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MonthlyReportController extends Controller
{
    public function download(Request $request): Response
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'between:2000,2100'],
            'month' => ['required', 'integer', 'between:1,12'],
        ]);

        $report = MonthlyReport::for((int) $validated['year'], (int) $validated['month']);

        $pdf = Pdf::loadView('reports.monthly', [
            ...$report,
            'logo' => 'data:image/png;base64,'.base64_encode(file_get_contents(resource_path('images/report-logo.png'))),
            'generatedAt' => now('Europe/Skopje'),
            'generatedBy' => $request->user()->name,
        ])->setPaper('a4')
            // Embed only the characters used instead of whole fonts (~900 KB -> tens of KB)
            ->setOption('isFontSubsettingEnabled', true);

        // CSS can't count the total pages in dompdf, so stamp "Page X of Y" after
        // rendering, right-aligned in the footer area of every page.
        $pdf->render();
        $dompdf = $pdf->getDomPDF();
        $canvas = $dompdf->getCanvas();
        $canvas->page_script(function (int $page, int $pages, $canvas, $fontMetrics) {
            $font = $fontMetrics->getFont('DejaVu Sans');
            $text = "Page {$page} of {$pages}";
            $width = $fontMetrics->getTextWidth($text, $font, 6);
            $canvas->text($canvas->get_width() - 30 - $width, $canvas->get_height() - 20.5, $text, $font, 6, [0.42, 0.45, 0.5]);
        });

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="SC-Hydra-Report-'.$report['month']->format('F-Y').'.pdf"',
        ]);
    }
}
