import type { EnAffirmationProblem } from '@/lib/en-affirmation-problems';

export type EsAffirmationProblem = Omit<
  EnAffirmationProblem,
  'jaSlug' | 'campaignPrefix'
> & {
  enSlug: string;
  jaSlug: string;
  campaignPrefix: 'seo_es';
};

export const ES_AFFIRMATION_APP_STORE_BASE =
  'https://apps.apple.com/es/app/id6755129214';

export function esAffirmationAppStoreUrl(slug: string): string {
  const url = new URL(ES_AFFIRMATION_APP_STORE_BASE);
  url.searchParams.set('pt', '93486075');
  url.searchParams.set('ct', `seo_es_${slug}`);
  url.searchParams.set('mt', '8');
  return url.toString();
}

export const ES_AFFIRMATION_PROBLEMS: EsAffirmationProblem[] = [
  {
    slug: 'afirmaciones-para-la-ansiedad-del-domingo',
    enSlug: 'affirmations-for-sunday-scaries',
    jaSlug: 'sunday-scaries',
    title:
      'Afirmaciones para la ansiedad del domingo (2026): frases para el agobio antes del lunes',
    shortTitle: 'Afirmaciones para la ansiedad del domingo',
    metaDescription:
      'Afirmaciones tranquilas para la ansiedad del domingo por la noche y un ejercicio de dos minutos. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
    whyItHappens: [
      'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no cambiarán tu trabajo ni tu lunes. Pueden hacer que el agobio suene un poco más bajo para que el domingo por la noche no se pierda del todo.',
      'La ansiedad del domingo es esa sensación pesada que muchas personas notan cuando se acaba el fin de semana. Suele venir de anticipar la semana: una tarea pendiente, una conversación difícil o una lista larga que la mente ensaya una y otra vez. Preocuparse por el futuro le quita espacio al presente.',
      'Las frases que ayudan son modestas. No prometen que el lunes será genial. Reconocen el agobio, recuerdan que la semana llega una tarea a la vez y te dan permiso para disfrutar lo que queda del día.',
      'Anicca envía una frase corta a la hora que elijas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
    ],
    affirmations: [
      'No tengo que resolver toda la semana esta noche.',
      'Puedo sentir agobio y aun así disfrutar esta tarde.',
      'El lunes llegará una tarea a la vez.',
      'Ya he pasado semanas difíciles antes.',
      'Mis preocupaciones no son un pronóstico.',
      'Puedo escribir la preocupación y dejarla esperar hasta mañana.',
      'Puedo elegir una cosa pequeña esta noche que haga mañana más fácil.',
      'Descansar ahora es parte de estar listo después.',
      'No necesito tener todas las respuestas antes de que empiece la semana.',
      'Puedo ser amable conmigo mientras termina el fin de semana.',
    ],
    practice: {
      heading: 'Un reinicio de dos minutos para el domingo por la noche',
      steps: [
        'Escribe con palabras sencillas una o dos cosas del lunes que más te preocupan. Junto a cada una, anota un primer paso pequeño o "nada que hacer esta noche".',
        'Elige algo de la semana que esperes con ganas o que puedas llevar bien, aunque sea pequeño, como un café.',
        'Lee una afirmación de la lista dos veces, despacio. Luego cierra la lista y haz algo que disfrutes durante diez minutos.',
      ],
    },
    closing:
      'Guías relacionadas: afirmaciones para pensar demasiado por la noche y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si el agobio por el trabajo es constante, afecta tu sueño o tu salud durante semanas o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
    h1: 'Afirmaciones para la ansiedad del domingo',
    directAnswer: [
      'Las afirmaciones para la ansiedad del domingo son frases cortas y realistas que reconocen el agobio antes del lunes sin prometer que todo saldrá bien.',
      'No sustituyen el apoyo profesional, pero pueden ayudarte a hablarte con más amabilidad cuando acaba el fin de semana.',
      'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
    ],
    campaignPrefix: 'seo_es',
  },
  {
    slug: 'afirmaciones-para-la-ansiedad-social-en-el-trabajo',
    enSlug: 'affirmations-for-social-anxiety-at-work',
    jaSlug: 'social-anxiety-at-work',
    title:
      'Afirmaciones para la ansiedad social en el trabajo (2026): frases para reuniones, chats y charlas',
    shortTitle: 'Afirmaciones para la ansiedad social en el trabajo',
    metaDescription:
      'Afirmaciones serenas para la ansiedad social en el trabajo y un ejercicio de dos minutos antes de una reunión. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
    whyItHappens: [
      'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no quitarán los nervios ni reemplazan el apoyo profesional. Pueden darte algo más tranquilo que decirte justo antes de una reunión, un mensaje o una conversación.',
      'La ansiedad social en el trabajo suele verse así: ensayar lo que vas a decir, quedarte callado en las reuniones, evitar la charla informal o repasar una conversación después. Es común y suele venir del miedo a ser juzgado, no de una falta de capacidad.',
      'Las frases que ayudan son realistas. No dicen que te sentirás seguro. Dicen que puedes estar nervioso y aun así hablar, que una pausa o una frase imperfecta está bien, y que la mayoría está pensando en su propio trabajo.',
      'Anicca envía una frase corta a la hora que elijas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
    ],
    affirmations: [
      'Puedo estar nervioso y aun así hablar.',
      'Pertenezco a esta reunión.',
      'Una respuesta corta es una buena respuesta.',
      'La mayoría está pendiente de su propio trabajo, no del mío.',
      'Una pausa está bien. Puedo respirar antes de hablar.',
      'No tengo que decir algo perfecto.',
      'Un momento incómodo no define cómo me ven.',
      'Puedo hacer una pregunta sin pedir perdón.',
      'Puedo soltar la conversación cuando termina.',
      'Cada paso pequeño en el trabajo cuenta, incluso los silenciosos.',
    ],
    practice: {
      heading: 'Un ejercicio de dos minutos antes de la reunión',
      steps: [
        'Con los pies firmes en el suelo, suelta el aire despacio contando hasta seis. Repite tres veces.',
        'Decide una pequeña aportación, como una pregunta o una frase, y escríbela con palabras sencillas.',
        'Lee una afirmación de la lista dos veces, despacio, y entra sabiendo que una sola frase es suficiente.',
      ],
    },
    closing:
      'Guías relacionadas: afirmaciones para pensar demasiado por la noche y afirmaciones contra el síndrome del impostor (enlaces abajo, en inglés). Si la ansiedad social afecta tu vida o tu trabajo durante mucho tiempo, o viene con tristeza intensa o desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
    h1: 'Afirmaciones para la ansiedad social en el trabajo',
    directAnswer: [
      'Las afirmaciones para la ansiedad social en el trabajo son frases cortas y realistas que te recuerdan que puedes estar nervioso y aun así participar.',
      'No eliminan los nervios ni sustituyen el apoyo profesional, pero pueden servirte como un apoyo tranquilo antes de una reunión.',
      'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
    ],
    campaignPrefix: 'seo_es',
  },
];

export function getEsAffirmationProblem(
  slug: string,
): EsAffirmationProblem | undefined {
  return ES_AFFIRMATION_PROBLEMS.find((p) => p.slug === slug);
}

export function allEsAffirmationSlugs(): string[] {
  return ES_AFFIRMATION_PROBLEMS.map((p) => p.slug);
}
