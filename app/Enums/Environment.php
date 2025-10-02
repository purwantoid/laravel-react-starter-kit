<?php

declare(strict_types=1);

namespace App\Enums;

enum Environment: string
{
    case Production = 'production';
    case Staging = 'staging';
    case Local = 'local';
}
