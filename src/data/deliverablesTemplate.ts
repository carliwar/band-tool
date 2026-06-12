import type { DeliverableRow } from '../types/models';

export const DELIVERABLES_TEMPLATE: DeliverableRow[] = [
  {
    entregable: 'Estructura de la canción',
    estadoEsperado: 'Cerrada, escrita, con tamaño de bloque por sección.',
  },
  {
    entregable: 'Mapa vocal',
    estadoEsperado:
      'Cada sección con rol (melódico / gutural / grito / armonía), densidad y dinámica.',
  },
  {
    entregable: 'Concepto temático',
    estadoEsperado:
      '1 palabra + 1 frase. (Letra final NO; se escribe en frío durante la semana.)',
  },
  {
    entregable: 'Guitarras L + R',
    estadoEsperado:
      'Capturadas con tono de pedal, no es toma final, sirve como referencia y posible base si queda bien.',
  },
  {
    entregable: 'Bajo',
    estadoEsperado: 'Capturado.',
  },
  {
    entregable: 'Voz scratch',
    estadoEsperado: 'Encima de cuerdas reales, con melodías y roles claros.',
  },
  {
    entregable: 'Bounce mp3',
    estadoEsperado: 'Repartido a todos, para escuchar toda la semana.',
  },
  {
    entregable: 'Lista de pendientes',
    estadoEsperado:
      'Bloques marcados a revisar, ideas de letra, ajustes de arreglo para próxima sesión.',
  },
];
