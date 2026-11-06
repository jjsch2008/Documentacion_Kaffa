<?php
// Reloj de demostración SOLO para las capturas del manual.
// No forma parte del backend ni se usa en producción.
require_once '/home/juanjose/Escritorio/KAFFA/backend-kaffa/vendor/autoload.php';
\Carbon\Carbon::setTestNow(\Carbon\Carbon::parse('2026-10-22 10:30:00', 'America/Bogota'));
