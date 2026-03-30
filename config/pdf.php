<?php

return [
    'fonts_path' => storage_path('app/pdf-fonts'),

    'base_template' => storage_path('app/pdf-assets/base-template.pdf'),

    'risk_tables' => [
        'es' => storage_path('app/pdf-assets/risk-section-es.pdf'),
        'en' => storage_path('app/pdf-assets/risk-section-en.pdf'),
    ],

    'logo' => public_path('images/logo-secon.svg'),

    'colors' => [
        'primary' => [34, 58, 129],    // #223A81
        'body'    => [114, 112, 112],   // #727070
        'white'   => [255, 255, 255],
    ],

    'fonts' => [
        'black_condensed' => 'HelveticaNeueLTStd-BlkCn.otf',
        'heavy'           => 'HelveticaNeueLTStd-Hv.otf',
        'bold_condensed'  => 'HelveticaNeueLTStd-BdCn.otf',
        'bold'            => 'HelveticaNeueLTStd-Bd.otf',
        'medium'          => 'HelveticaNeueLTStd-Md.otf',
        'roman'           => 'HelveticaNeueLTStd-Roman.otf',
    ],
];
