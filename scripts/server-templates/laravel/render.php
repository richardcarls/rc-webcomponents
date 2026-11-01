<?php

// Renders the guide's Blade components for scripts/test-server-templates.mjs.
//
//   php render.php <extracted app root> <cases.json>

use Illuminate\Container\Container;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\View\Factory as FactoryContract;
use Illuminate\Events\Dispatcher;
use Illuminate\Filesystem\Filesystem;
use Illuminate\View\Compilers\BladeCompiler;
use Illuminate\View\Engines\CompilerEngine;
use Illuminate\View\Engines\EngineResolver;
use Illuminate\View\Factory;
use Illuminate\View\FileViewFinder;

require (getenv('COMPOSER_VENDOR_DIR') ?: __DIR__ . '/vendor') . '/autoload.php';

[, $root, $casesPath] = $argv;
$cases = json_decode(file_get_contents($casesPath), true, flags: JSON_THROW_ON_ERROR);

require "$root/app/Support/Rc.php";

$container = new Container();
Container::setInstance($container);

$files = new Filesystem();
$cache = sys_get_temp_dir() . '/rc-blade-' . getmypid();
$files->ensureDirectoryExists($cache);

$blade = new BladeCompiler($files, $cache);
$resolver = new EngineResolver();
$resolver->register('blade', fn () => new CompilerEngine($blade, $files));

$finder = new FileViewFinder($files, ["$root/resources/views", __DIR__ . '/views']);
$factory = new Factory($resolver, $finder, new Dispatcher($container));
$factory->setContainer($container);

$container->instance(FactoryContract::class, $factory);
$container->instance('view', $factory);
$container->instance('blade.compiler', $blade);
// Component tag compilation asks the application for its namespace.
$container->instance(Application::class, new class {
    public function getNamespace(): string
    {
        return 'App\\';
    }
});

$fill = fn (string $pattern, array $values) => strtr(
    $pattern,
    array_combine(array_map(fn ($name) => '{' . $name . '}', array_keys($values)), array_values($values)),
);

$html = [];

foreach ($cases['pagination'] as $case) {
    $html["pagination/{$case['name']}"] = $factory->make('harness.pagination', [
        'page' => $case['page'],
        'total' => $case['total'],
        'href' => fn (int $page) => $fill($case['href'], ['page' => $page]),
        'label' => $case['label'] ?? null,
    ])->render();
}

foreach ($cases['breadcrumbs'] as $case) {
    $html["breadcrumbs/{$case['name']}"] = $factory->make('harness.breadcrumbs', [
        'items' => $case['items'],
        'label' => $case['label'] ?? null,
    ])->render();
}

foreach ($cases['sortHeaders'] as $case) {
    $html["sort-header/{$case['name']}"] = $factory->make('harness.sort-header', [
        'key' => $case['key'],
        'label' => $case['label'],
        'sort' => $case['sort'],
        'direction' => $case['direction'],
        'href' => fn (string $key, string $direction) => $fill($case['href'], ['key' => $key, 'direction' => $direction]),
        'first' => $case['first'] ?? 'ascending',
    ])->render();
}

$ranges = [];

foreach (range(0, 13) as $total) {
    foreach (range(0, 14) as $page) {
        foreach (range(0, 2) as $siblings) {
            foreach (range(0, 2) as $boundaries) {
                $ranges["$total,$page,$siblings,$boundaries"] =
                    \App\Support\Rc::paginationRange($page, $total, $siblings, $boundaries);
            }
        }
    }
}

$files->deleteDirectory($cache);

echo json_encode(['html' => $html, 'ranges' => $ranges], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
