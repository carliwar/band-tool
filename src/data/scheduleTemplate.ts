import type { ScheduleTemplateRow } from '../types/models';

export const SCHEDULE_TEMPLATE: ScheduleTemplateRow[] = [
  {
    id: 'pizarra',
    tiempo: '0:00–0:30',
    fase: 'Pizarra',
    actividad:
      'Norte en 1 frase + 2 referencias sonoras (1 instrumental, 1 vocal) + repaso de estructura desde Guitar Pro + asignar roles (productor/ingeniero, músicos, tomador de notas).',
    quien: 'Todos',
    entregableParcial:
      'Pizarra con norte, estructura por bloques etiquetados (Intro / Riff A / Pre / Coro / etc.) y tamaño de bloque definido por frase musical.',
  },
  {
    id: 'topline',
    tiempo: '0:30–1:30',
    fase: 'Topline (definición vocal)',
    actividad:
      'Reproducir el MIDI guía completo. Cantante improvisa melodías en gibberish (sonidos sin palabras) sobre cada sección, 3–4 pasadas. Banda escucha y reacciona.',
    quien: 'Cantante + banda escucha',
    entregableParcial: 'Audio scratch con melodías guía marcadas por sección.',
  },
  {
    id: 'cierre-vocal',
    tiempo: '1:30–2:00',
    fase: 'Cierre de secciones vocales',
    actividad:
      'Decidir por sección: rol vocal (melódico / hablado / gutural / grito), densidad (solo / coros / armonías), dinámica (sube / baja / explota). Definir tema en 1 palabra + 1 frase.',
    quien: 'Productor lidera',
    entregableParcial: 'Mapa de roles vocales por sección + concepto temático.',
  },
  {
    id: 'validacion',
    tiempo: '2:00–2:15',
    fase: 'Validación de estructura',
    actividad:
      'Tocar la canción de corrido 1 vez (banda + cantante con gibberish ya definido). Si una sección no funciona con la voz encima → ajustar estructura AHORA, no durante la grabación.',
    quien: 'Todos',
    entregableParcial: 'Estructura final congelada. No se toca más en el día.',
  },
  {
    id: 'guitarra-l',
    tiempo: '2:15–3:45',
    fase: 'Captura guitarra rítmica L',
    actividad:
      'Por bloques (frase musical), 3 tomas → mejor → siguiente. Empezar por el bloque más difícil. Tono directo de pedal, monitoreo cómodo.',
    quien: 'Guita 1 toca / otro miembro hace de productor',
    entregableParcial: 'Guitarra L grabada por bloques.',
  },
  {
    id: 'guitarra-r',
    tiempo: '3:45–4:45',
    fase: 'Captura guitarra rítmica R',
    actividad: 'Mismo método por bloques, encima de L ya grabada.',
    quien: 'Guita 2 toca / rotar productor',
    entregableParcial: 'Guitarra R grabada.',
  },
  {
    id: 'bajo',
    tiempo: '4:45–5:30',
    fase: 'Captura bajo',
    actividad: 'Siguiendo rítmicas ya grabadas, por bloques.',
    quien: 'Bajista / rotar productor',
    entregableParcial: 'Bajo grabado.',
  },
  {
    id: 'voz-scratch',
    tiempo: '5:30–6:15',
    fase: 'Voz scratch sobre cuerdas reales',
    actividad:
      'Cantante regraba el gibberish/melodía guía encima de las cuerdas ya capturadas (no es la voz final, es la guía para llevarse a casa). Marcar dónde irá letra, dónde grito, dónde armonía.',
    quien: 'Cantante + productor',
    entregableParcial: 'Scratch vocal con melodías y roles confirmados.',
  },
  {
    id: 'bounce',
    tiempo: '6:15–6:30',
    fase: 'Bounce y cierre',
    actividad:
      'Mix rough plano (volúmenes parejos, sin procesar), bounce mp3, repartir a todos. Anotar pendientes ("revisar bloque X", "letra coro", "armonía pre").',
    quien: 'Ingeniero',
    entregableParcial: 'mp3 de la maqueta + lista de pendientes.',
  },
];
