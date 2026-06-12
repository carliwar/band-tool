import type { RuleRow } from '../types/models';

export const RULES_TEMPLATE: RuleRow[] = [
  {
    regla: 'Norte de la canción',
    detalle: '1 frase consensuada antes de empezar. No se vota dos veces.',
  },
  {
    regla: 'Bloques de captura',
    detalle:
      'Tamaño = 1 frase musical completa (4, 6, 8 o 16 compases según el riff). No partir frases.',
  },
  {
    regla: 'Regla de los 15 min',
    detalle: 'Si un bloque no sale en 15 min, se marca "revisar" y se sigue.',
  },
  {
    regla: 'Productor + Ingeniero',
    detalle:
      'Misma persona, sombreros separados: ingeniero al grabar, productor al escuchar. Nunca los dos a la vez.',
  },
  {
    regla: 'Rotación de productor',
    detalle:
      'Cuando el productor/ingeniero es quien toca, otro miembro toma el sombrero de productor para ese bloque.',
  },
  {
    regla: 'Una voz por vez',
    detalle: 'Al escuchar tomas, habla una persona. Productor decide.',
  },
  {
    regla: 'Pausas',
    detalle: 'La banda decide cuándo. Cada 90 min recomendado.',
  },
];
