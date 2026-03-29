<?php

namespace App\Console\Commands;

use App\Models\PlanFile;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CleanOrphanFiles extends Command
{
    protected $signature = 'files:clean-orphans';
    protected $description = 'Remove DB records for files that no longer exist on disk';

    public function handle(): int
    {
        $orphans = 0;

        PlanFile::chunk(100, function ($files) use (&$orphans) {
            foreach ($files as $file) {
                if (!Storage::disk('public')->exists($file->file_path)) {
                    $this->line("Orphan: [{$file->id}] {$file->file_category} → {$file->file_path}");
                    $file->delete();
                    $orphans++;
                }
            }
        });

        $this->info("Cleaned {$orphans} orphan record(s).");
        return self::SUCCESS;
    }
}
