import type {
  EnAffirmationFaq,
  EnAffirmationProblem,
} from '@/lib/en-affirmation-problems';

export type EsAffirmationProblem = Omit<
  EnAffirmationProblem,
  'jaSlug' | 'campaignPrefix'
> & {
  enSlug: string;
  jaSlug?: string;
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
    faq: [
      {
        q: '¿Qué son las afirmaciones para la ansiedad del domingo?',
        a: 'Son frases cortas y realistas que reconocen el agobio antes del lunes sin prometer que todo saldrá bien. Las afirmaciones no cambiarán tu trabajo ni tu lunes, pero pueden hacer que el agobio suene un poco más bajo para que el domingo por la noche no se pierda del todo.',
      },
      {
        q: '¿Qué afirmaciones puedo leer el domingo por la noche?',
        a: 'Frases modestas que no prometen que el lunes será genial, por ejemplo: “No tengo que resolver toda la semana esta noche.” “El lunes llegará una tarea a la vez.” “Descansar ahora es parte de estar listo después.” Elige una y léela dos veces, despacio.',
      },
      {
        q: '¿Cómo uso las afirmaciones en dos minutos el domingo por la noche?',
        a: 'Escribe con palabras sencillas una o dos cosas del lunes que más te preocupan. Junto a cada una, anota un primer paso pequeño o "nada que hacer esta noche". Elige algo de la semana que esperes con ganas o que puedas llevar bien, aunque sea pequeño, como un café. Lee una afirmación de la lista dos veces, despacio. Luego cierra la lista y haz algo que disfrutes durante diez minutos.',
      },
      {
        q: '¿Las afirmaciones sustituyen la ayuda profesional?',
        a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el agobio por el trabajo es constante, afecta tu sueño o tu salud durante semanas o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
      },
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
    faq: [
      {
        q: '¿Qué son las afirmaciones para la ansiedad social en el trabajo?',
        a: 'Son frases cortas y realistas que te recuerdan que puedes estar nervioso y aun así participar. Las afirmaciones no quitarán los nervios ni reemplazan el apoyo profesional, pero pueden darte algo más tranquilo que decirte justo antes de una reunión, un mensaje o una conversación.',
      },
      {
        q: '¿Qué afirmaciones puedo leer antes de una reunión?',
        a: 'Frases realistas que no dicen que te sentirás seguro, por ejemplo: “Puedo estar nervioso y aun así hablar.” “Pertenezco a esta reunión.” “No tengo que decir algo perfecto.” Elige una y léela dos veces, despacio.',
      },
      {
        q: '¿Cómo uso las afirmaciones en dos minutos antes de una reunión?',
        a: 'Con los pies firmes en el suelo, suelta el aire despacio contando hasta seis. Repite tres veces. Decide una pequeña aportación, como una pregunta o una frase, y escríbela con palabras sencillas. Lee una afirmación de la lista dos veces, despacio, y entra sabiendo que una sola frase es suficiente.',
      },
      {
        q: '¿Las afirmaciones sustituyen la ayuda profesional?',
        a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la ansiedad social afecta tu vida o tu trabajo durante mucho tiempo, o viene con tristeza intensa o desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
      },
    ],
    campaignPrefix: 'seo_es',
  },
// Batch 8 ES entry for ES_AFFIRMATION_PROBLEMS (apps/landing/lib/es-affirmation-problems.ts). Append verbatim at end of array.
// Target phrase: "afirmaciones positivas para dormir" (KEYWORDS-2026-10-16.md ES #1). Slug checked absent on origin/main c5bae77 (2026-10-17).
// True counterpart of EN affirmations-to-fall-asleep-to -> hreflang en+es (+x-default=EN); NO ja. jaSlug intentionally omitted (see prompt 8).
// Honest-claims: App Store lists Spanish among supported languages (UI). We do NOT claim generated lines arrive in Spanish.
  {
    slug: 'afirmaciones-para-dormir-con-calma',
    enSlug: 'affirmations-to-fall-asleep-to',
    title: 'Afirmaciones positivas para dormir (2026): frases tranquilas para la noche y un ejercicio de dos minutos',
    shortTitle: 'Afirmaciones positivas para dormir',
    metaDescription:
      'Afirmaciones positivas para dormir, cómo usarlas antes de acostarte y un ejercicio de dos minutos. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
    whyItHappens: [
      'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no te dormirán por orden ni son un tratamiento para problemas de sueño. A algunas personas unas pocas frases tranquilas antes de acostarse les ayudan a dejar el día a un lado.',
      'Una razón habitual por la que cuesta dormir es una mente ocupada: repasar el día, ensayar el mañana o discutir con una preocupación. Una frase corta y serena le da a la mente algo sencillo donde descansar en lugar del bucle. Es una pausa, no un interruptor.',
      'Las frases funcionan mejor cuando son suaves y creíbles. "Esta noche voy a dormir perfecto" puede crear presión. Frases como "No tengo que resolver el mañana esta noche" o "Descansar es suficiente por ahora" no exigen un resultado, así que no hay nada que fallar.',
      'Mantén todo con poca estimulación: luz tenue, el móvil en modo noche o apartado después de leer una frase, y un ritmo lento. Las afirmaciones van junto a lo básico: horarios regulares, un cuarto oscuro y fresco, y calmarte antes de acostarte.',
      'Anicca envía una frase corta a la hora que elijas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
    ],
    affirmations: [
      'No tengo que resolver el mañana esta noche.',
      'Descansar es suficiente por ahora.',
      'Hoy hice lo que pude, y eso cuenta.',
      'Mis pensamientos pueden esperar hasta la mañana.',
      'Puedo soltar los hombros y respirar despacio.',
      'No tengo que forzar el sueño. Puedo simplemente quedarme aquí y descansar.',
      'El día ha terminado y puedo dejarlo a un lado.',
      'Las preocupaciones se pueden escribir y dejar para mañana.',
      'Ahora es seguro ir más despacio.',
      'Esta noche puedo ser amable conmigo.',
    ],
    practice: {
      heading: 'Un ejercicio de dos minutos antes de dormir',
      steps: [
        'Escribe en un papel algo que quedó pendiente, con un primer paso para mañana si quieres, para que tu mente no tenga que sostenerlo toda la noche.',
        'Suelta el aire despacio contando hasta seis, tres veces, con los hombros relajados.',
        'Lee una frase de la lista, despacio, dos veces. Deja el móvil y mantén la luz baja. Si sigues despierto, no pasa nada: descansa en silencio en lugar de forzar el sueño.',
      ],
    },
    closing:
      'Guías relacionadas: afirmaciones para pensar demasiado por la noche y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si te cuesta dormir durante semanas, afecta tu día a día o tu salud, o viene con tristeza o pánico, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
    h1: 'Afirmaciones positivas para dormir',
    directAnswer: [
      'Las afirmaciones positivas para dormir son frases cortas y tranquilas que se leen antes de acostarse para dejar el día a un lado, sin prometer que dormirás.',
      'No sustituyen el apoyo profesional ni son un tratamiento, pero pueden ayudarte a hablarte con más calma por la noche.',
      'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
    ],
    faq: [
      {
        q: '¿Qué son las afirmaciones positivas para dormir?',
        a: 'Son frases cortas y tranquilas que se leen antes de acostarse para dejar el día a un lado, sin prometer que dormirás. Las afirmaciones no te dormirán por orden ni son un tratamiento para problemas de sueño, pero a algunas personas unas pocas frases tranquilas antes de acostarse les ayudan a dejar el día a un lado.',
      },
      {
        q: '¿Qué afirmaciones puedo leer antes de dormir?',
        a: 'Frases suaves y creíbles que no exigen un resultado, por ejemplo: “No tengo que resolver el mañana esta noche.” “Descansar es suficiente por ahora.” “El día ha terminado y puedo dejarlo a un lado.” Elige una y léela despacio, dos veces.',
      },
      {
        q: '¿Cómo uso las afirmaciones en dos minutos antes de dormir?',
        a: 'Escribe en un papel algo que quedó pendiente, con un primer paso para mañana si quieres, para que tu mente no tenga que sostenerlo toda la noche. Suelta el aire despacio contando hasta seis, tres veces, con los hombros relajados. Lee una frase de la lista, despacio, dos veces. Deja el móvil y mantén la luz baja. Si sigues despierto, no pasa nada: descansa en silencio en lugar de forzar el sueño.',
      },
      {
        q: '¿Las afirmaciones sustituyen la ayuda profesional?',
        a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si te cuesta dormir durante semanas, afecta tu día a día o tu salud, o viene con tristeza o pánico, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
      },
    ],
    campaignPrefix: 'seo_es',
  },
{
  slug: 'afirmaciones-para-la-mente-que-no-para-por-la-noche',
  enSlug: 'overthinking-at-night',
  title: 'Afirmaciones para la mente que no para por la noche (2026): frases suaves para soltar el día',
  shortTitle: 'Afirmaciones para la mente que no para por la noche',
  metaDescription: 'Afirmaciones suaves para cuando la mente no para por la noche, con un ejercicio breve antes de dormir. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no borran las preocupaciones ni son un tratamiento para problemas de sueño. Una frase corta y creíble puede acortar la discusión interna y darte un lugar más suave donde descansar.',
    'Por la noche baja el ruido del día y la lista de pendientes se oye más fuerte. Sin reuniones, mensajes ni recados que te interrumpan, la mente por fin tiene espacio, y a menudo lo usa para preocuparse, repasar conversaciones y pensar en todo lo que podría pasar. Eso no significa que estés roto. Significa que tu sistema nervioso sigue de guardia cuando el día ya terminó.',
    'Pensar demasiado por la noche rara vez busca una respuesta perfecta. Casi siempre es la mente intentando sentirse segura resolviéndolo todo antes de dormir. El coste es que el sueño se vuelve una negociación: otro escenario más, otro mensaje ensayado en la cabeza, otra revisión de una conversación. El cuerpo quiere descansar y la mente quiere certezas.',
    'Una frase honesta no exige que te sientas en calma al instante. Frases como “No tengo que resolverlo todo esta noche para merecer descansar” no prometen nada imposible, y por eso son más fáciles de aceptar. Elige una sola, léela despacio y deja que el resto espere hasta la mañana.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'No tengo que resolverlo todo esta noche para merecer descansar.',
    'Esta preocupación se oye fuerte, pero no siempre dice la verdad.',
    'Una respiración lenta basta para este minuto.',
    'Estar acostado también cuenta, aunque el sueño tarde.',
    'La versión de mí de la mañana no castigará a la de la noche por necesitar silencio.',
    'Los pensamientos pueden visitarme sin quedarse a vivir aquí.',
    'Puedo dejar el móvil y sentir el peso de mi cuerpo.',
    'Una noche imperfecta también es una noche que atravesé.',
    'La imaginación asustada y esta habitación oscura no son el mismo lugar.',
    'La calma no exige una lista de tareas terminada.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para la noche',
    steps: [
      'Siéntate o acuéstate sin moverte. Nombra en silencio cosas que puedes sentir, como la sábana, la almohada o el aire. No hay nada que arreglar, solo notar.',
      'Elige una afirmación de la lista y dila una vez en voz alta o en un susurro. Si suena falsa, suavízala: “Estoy dispuesto a descansar sin resolverlo todo”.',
      'Suelta el aire más despacio de lo que lo tomas, un par de veces, y para ahí. No conviertas esto en otro proyecto. Si la mente vuelve, recíbela con la misma frase una vez más y déjala ahí.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para pensar demasiado y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si las noches se vuelven insoportables una y otra vez, habla con alguien de confianza, con un médico o un terapeuta, o con una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la mente que no para por la noche',
  directAnswer: [
    'Si tu mente no para por la noche, la respuesta honesta es que el silencio forma parte del problema: cuando baja el ruido del día, la lista de pendientes se oye más fuerte y la mente intenta sentirse segura resolviéndolo todo antes de dormir. Las afirmaciones no borran la preocupación, pero una frase corta y creíble puede acortar la discusión interna.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas. Está disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si las noches siguen siendo insoportables, busca el apoyo de alguien de confianza, de un profesional de la salud o de una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Por qué pienso demasiado por la noche?',
      a: 'Porque por la noche baja el ruido del día y la lista de pendientes se oye más fuerte. Sin reuniones, mensajes ni recados que te interrumpan, la mente tiene espacio y a menudo lo usa para preocuparse y repasar. Casi siempre es un intento de sentirse segura resolviéndolo todo antes de dormir, no una señal de que estés roto.'
    },
    {
      q: '¿Las afirmaciones detienen los pensamientos nocturnos?',
      a: 'No. Las afirmaciones no borran la preocupación, y el sueño no es una negociación que se gane resolviendo un escenario más. Una frase corta y creíble puede acortar la discusión interna y darte un lugar más suave donde descansar, aunque la mente siga ruidosa.'
    },
    {
      q: '¿Qué afirmaciones sirven para la mente que no para por la noche?',
      a: 'Frases cortas y creíbles con las que no tengas que discutir, por ejemplo: “No tengo que resolverlo todo esta noche para merecer descansar.” “Esta preocupación se oye fuerte, pero no siempre dice la verdad.” “Los pensamientos pueden visitarme sin quedarse a vivir aquí.” Elige una y dila una vez, despacio.'
    },
    {
      q: '¿Qué app ayuda cuando la mente no para por la noche?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-cuando-dudas-de-ti-mismo',
  enSlug: 'self-doubt',
  title: 'Afirmaciones para cuando dudas de ti mismo (2026): frases honestas para días de inseguridad',
  shortTitle: 'Afirmaciones para cuando dudas de ti mismo',
  metaDescription: 'Afirmaciones cortas y honestas para los días en que dudas de ti mismo, con un ejercicio breve para cambiar el tono interno. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: dudar de ti no es una prueba de que estés fallando, y las afirmaciones no son un tratamiento. Son interrupciones pequeñas y honestas que se niegan a aceptar la historia más dura durante un momento.',
    'La duda sobre uno mismo a menudo aparece como un juicio privado. Repasas un mensaje, una reunión, una foto o un silencio, y el veredicto llega antes que las pruebas. El “no es suficiente” se vuelve el ajuste por defecto, incluso en días en los que no pasó nada grave. Muchas veces es un hábito de buscar amenazas para que la crítica no te pille por sorpresa.',
    'La comparación, el perfeccionismo y los comentarios antiguos mantienen vivo ese hábito. Las redes comprimen lo mejor de otras personas en un marcador, el trabajo premia producir sin parar y los mensajes familiares sobre ser responsable o impresionar se quedan dentro. Nada de eso convierte tu valor en una nota. Solo significa que tu atención aprendió a buscar huecos.',
    'Por eso estas frases no intentan animarte a la fuerza. Buscan ser creíbles: cosas que podrías decirle a un amigo sin sonar falso. Si una frase suena demasiado grande, hazla más pequeña y más cercana a lo que hoy sí puedes aceptar.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo ocupar mi espacio sin un currículum perfecto.',
    'Mi valor no es una evaluación de rendimiento.',
    'La duda puede hablar sin tener el voto final.',
    'Puedo estar en proceso y aun así merecer amabilidad.',
    'Una frase amable hacia mí también es un avance.',
    'No tengo que ganarme el descanso con excelencia.',
    'Ser humano incluye días desiguales.',
    'Puedo avanzar a mi ritmo sin pedir perdón por ello.',
    'Los comentarios son información, no toda mi identidad.',
    'Hoy estoy de mi lado, aunque sea en voz baja.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para resetear la duda',
    steps: [
      'Escribe la frase más dura que tu mente está repitiendo. Una sola línea, tal como suena.',
      'Subraya las palabras absolutas, como “siempre”, “nunca” o “todo el mundo”. Pregúntate si se la dirías así a un amigo al que quieres.',
      'Cámbiala por una afirmación de la lista, o por una versión más suave que sí te creas. Léela despacio un par de veces y para ahí. Si quieres, programa un recordatorio para más tarde, para que la amabilidad no sea solo una herramienta de emergencia.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones de amor propio y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si la desesperanza, el pánico o los pensamientos de hacerte daño aparecen o persisten, habla cuanto antes con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para cuando dudas de ti mismo',
  directAnswer: [
    'Si hoy la duda suena fuerte, la respuesta honesta es que dudar no demuestra que estés fallando. La duda sobre uno mismo a menudo aparece como un juicio privado en el que el veredicto llega antes que las pruebas, y el “no es suficiente” se vuelve el ajuste por defecto. Muchas veces es un hábito de buscar amenazas para no ser sorprendido por la crítica.',
    'Las afirmaciones para estos días no son animación vacía. Son interrupciones: frases pequeñas y honestas que se niegan a aceptar la historia más dura durante un momento. Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si aparecen desesperanza persistente, pánico o pensamientos de hacerte daño, busca apoyo humano real: habla con un médico, un terapeuta o una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Dudar de mí significa que estoy fallando?',
      a: 'No. La duda no es una prueba de fracaso. A menudo es un hábito de buscar amenazas para que la crítica no te sorprenda. Aparece como un juicio privado donde el veredicto llega antes que las pruebas, y el “no es suficiente” se vuelve el ajuste por defecto incluso en días tranquilos.'
    },
    {
      q: '¿Las afirmaciones para la duda son solo frases de ánimo?',
      a: 'No. No intentan animarte a la fuerza. Son interrupciones: frases pequeñas y honestas que se niegan a aceptar la historia más dura durante un momento. Tu valor no es una nota, y los comentarios son información, no toda tu identidad.'
    },
    {
      q: '¿Qué afirmaciones sirven cuando dudo de mí?',
      a: 'Frases pequeñas y honestas de esta página, por ejemplo: “Puedo ocupar mi espacio sin un currículum perfecto.” “Mi valor no es una evaluación de rendimiento.” “La duda puede hablar sin tener el voto final.”'
    },
    {
      q: '¿Qué app ayuda cuando dudo de mí mismo?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-cuando-te-comparas',
  enSlug: 'comparing-yourself',
  title: 'Afirmaciones para cuando te comparas (2026): frases para salir de la espiral de mirar y mirar',
  shortTitle: 'Afirmaciones para cuando te comparas',
  metaDescription: 'Afirmaciones para la comparación y la espiral de mirar redes sin parar, con un ejercicio breve para soltar el móvil. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: lo que ves en redes no son datos sobre tu valor, y las afirmaciones no arreglan las redes sociales. Una frase honesta puede darte algo a lo que agarrarte mientras dejas el móvil boca abajo.',
    'La espiral de mirar es eficiente: los mejores momentos de otras personas llegan en alta resolución, mientras tu propia vida llega como ropa por lavar, borradores y pestañas sin cerrar. Tu mente trata ese flujo como si midiera tu valor. No lo hace. Es una mezcla de selección cuidada y vidas reales que solo ves desde fuera.',
    'La comparación se alimenta de información incompleta. Ves el ascenso, no la ansiedad. El viaje, no la tarjeta. La foto serena, no la discusión de minutos antes. Aun así, el cuerpo reacciona como si hubieras perdido una carrera en la que nunca te apuntaste. Esa reacción es humana, y seguir mirando suele hacerla más fuerte.',
    'Estas afirmaciones son para ese momento en el que el pulgar sigue moviéndose y el pecho se aprieta. No necesitan convencerte de que todo va bien. Solo necesitan ser creíbles el tiempo suficiente para que puedas parar, respirar y elegir algo fuera de la pantalla.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'El calendario de otra persona no es mi tarea.',
    'Un momento destacado no es una vida entera.',
    'Puedo cerrar la app sin ganarme el permiso.',
    'Mi etapa puede verse distinta, y está bien.',
    'La envidia puede señalar un deseo sin hacerme más pequeño.',
    'El avance silencioso también cuenta.',
    'No voy atrasado. Estoy aquí.',
    'Los me gusta no son el precio de mi corazón.',
    'Puedo celebrar a otros sin desaparecer.',
    'Mi ritmo es un ritmo válido.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos contra la espiral de mirar',
    steps: [
      'Deja el móvil boca abajo y siente ambos pies en el suelo durante unos segundos.',
      'Nombra aquello con lo que te estabas comparando: el trabajo, el cuerpo, una relación, el dinero o la creatividad. Ponerle nombre reduce la niebla.',
      'Lee una afirmación despacio. Si quieres un paso siguiente fuera de la pantalla, elige una acción pequeña y real, como beber agua, estirarte o escribir a un amigo, y no otro flujo de contenido.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para cuando dudas de ti mismo y afirmaciones de amor propio (enlaces abajo, en inglés). Si la comparación se mezcla con depresión, problemas con la comida o sentimientos de crisis, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para cuando te comparas',
  directAnswer: [
    'Si no paras de compararte con otros, la respuesta honesta es que ese flujo de imágenes no son datos sobre tu valor. Ves los mejores momentos de otras personas en alta resolución mientras tu vida llega como tareas, borradores y cosas sin terminar. La comparación se alimenta de información incompleta: ves el ascenso, no la ansiedad; el viaje, no la tarjeta.',
    'Las afirmaciones para estos momentos no arreglan las redes sociales, pero pueden darte una frase a la que agarrarte mientras dejas el móvil boca abajo. Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si la comparación se mezcla con depresión, problemas con la comida o sentimientos de crisis, habla con un profesional o con una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Por qué me comparo tanto con otros en redes sociales?',
      a: 'Porque la comparación se alimenta de información incompleta. Ves el ascenso, no la ansiedad. El viaje, no la tarjeta. La foto serena, no la discusión de minutos antes. Tu mente trata ese flujo como datos sobre tu valor, y no lo son: es una selección cuidada mezclada con vidas que solo ves desde fuera.'
    },
    {
      q: '¿Qué afirmaciones sirven cuando me comparo?',
      a: 'Frases pequeñas y honestas de esta página, por ejemplo: “El calendario de otra persona no es mi tarea.” “Un momento destacado no es una vida entera.” “No voy atrasado. Estoy aquí.”'
    },
    {
      q: '¿Qué puedo hacer cuando me descubro comparándome?',
      a: 'Deja el móvil boca abajo, siente ambos pies en el suelo durante unos segundos y nombra aquello con lo que te comparabas: el trabajo, el cuerpo, una relación, el dinero o la creatividad. Lee una afirmación despacio y elige una acción pequeña y real, no otro flujo de contenido.'
    },
    {
      q: '¿Qué app ayuda cuando me comparo con otros?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-pensar-demasiado',
  enSlug: 'affirmations-for-overthinking',
  title: 'Afirmaciones para pensar demasiado (2026): frases tranquilas que interrumpen el bucle',
  shortTitle: 'Afirmaciones para pensar demasiado',
  metaDescription: 'Afirmaciones tranquilas para pensar demasiado que interrumpen el bucle en lugar de luchar contra él, con un ejercicio breve para soltar la rumiación. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: ninguna frase apaga los pensamientos como un interruptor, y las afirmaciones no son un tratamiento. Funcionan mejor como una interrupción pequeña: una frase tranquila y creíble le da a tu atención otro lugar donde apoyarse un momento.',
    'Pensar demasiado es el hábito de darle vueltas a lo mismo: repasar una conversación, ensayar un mensaje o recorrer todos los resultados posibles de una decisión que aún no ocurrió. Puede parecer que estás resolviendo algo, porque la mente está ocupada y el tema parece importante. Pero el bucle a menudo no trae información nueva: terminas la vuelta sabiendo lo mismo que al principio, y más cansado.',
    'Ayuda notar qué intenta hacer ese exceso de pensamiento. Casi siempre intenta comprar certeza o protegerte de un error: si lo piensas lo suficiente, quizá nada te sorprenda ni te avergüence. Es un objetivo comprensible, y también uno que pensar solo rara vez consigue. Algunas cosas se aclaran cuando actúas, cuando preguntas a una persona o cuando dejas pasar el tiempo.',
    'Por eso las frases que mejor funcionan son creíbles y un poco aburridas. No “todo es perfecto”, sino “No necesito resolver toda la historia hoy”. Elige frases que podrías decirle a un amigo sin sonrojarte, léelas despacio y acompáñalas de una acción pequeña o de algo que puedas hacer con las manos.',
    'Anicca es una app para iPhone pensada para esa idea: en lugar de una biblioteca que tienes que acordarte de abrir, envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo pensar en esto más tarde. Ahora solo necesito el siguiente paso pequeño.',
    'Un pensamiento repetido muchas veces sigue siendo un solo pensamiento.',
    'No necesito resolver toda la historia hoy.',
    'Todavía no saber está permitido.',
    'Puedo actuar con lo que sé y dejar el resto abierto.',
    'Mi mente intenta ayudar. Puedo agradecérselo y soltarla un rato.',
    'Esto se siente urgente, pero puedo hacer una pausa antes de responder.',
    'No tengo que ganar la discusión que solo existe en mi cabeza.',
    'Suficientemente bueno también es una decisión real.',
    'Puedo volver a mi cuerpo: pies, manos, respiración.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para romper el bucle',
    steps: [
      'Escribe el pensamiento que se repite como una frase sencilla, por ejemplo: “No paro de repasar lo que dije en la reunión”. Verlo en una sola línea a menudo lo hace más pequeño.',
      'Hazte una pregunta: ¿hay alguna acción que pueda hacer en los próximos minutos? Si la hay, escríbela y haz solo eso. Si no la hay, escribe “nada que hacer ahora mismo” y deja que esa sea la respuesta de hoy.',
      'Lee una afirmación de la lista despacio, un par de veces. Después haz algo con las manos, como lavar una taza o estirarte, para que el pensamiento tenga menos espacio para volver a empezar.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la ansiedad y afirmaciones de amor propio (enlaces abajo, en inglés). Si pensar demasiado es constante, te impide dormir o trabajar durante semanas o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para pensar demasiado',
  directAnswer: [
    'La respuesta corta: las afirmaciones ayudan a pensar demasiado cuando interrumpen el bucle en lugar de luchar contra él. Una frase creíble y un poco aburrida, como “No necesito resolver toda la historia hoy”, le da a tu atención otro lugar donde apoyarse un momento. Léela despacio y después haz una acción pequeña o algo con las manos.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas. Está disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si la rumiación es constante o viene con desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Qué afirmaciones sirven para pensar demasiado?',
      a: 'Frases tranquilas y creíbles funcionan mejor que las grandes frases positivas, por ejemplo: “Un pensamiento repetido muchas veces sigue siendo un solo pensamiento.” “No necesito resolver toda la historia hoy.” “Todavía no saber está permitido.” Elige una que podrías decirle a un amigo sin sonrojarte.'
    },
    {
      q: '¿Las afirmaciones detienen el exceso de pensamiento?',
      a: 'Ninguna frase apaga los pensamientos. Una afirmación funciona como una interrupción pequeña: una frase tranquila, leída despacio, le da a tu atención otro lugar donde apoyarse un momento. Acompáñala de una acción pequeña, porque algunas cosas solo se aclaran cuando actúas, preguntas o dejas pasar el tiempo.'
    },
    {
      q: '¿Cómo rompo un bucle de pensamiento en dos minutos?',
      a: 'Escribe el pensamiento que se repite como una frase sencilla. Pregúntate si hay alguna acción que puedas hacer en los próximos minutos; si la hay, haz solo eso, y si no, escribe “nada que hacer ahora mismo”. Después lee una afirmación despacio, un par de veces, y haz algo con las manos, como lavar una taza o estirarte.'
    },
    {
      q: '¿La app de afirmaciones Anicca es gratis?',
      a: 'Anicca es de descarga gratuita en App Store para iPhone, con suscripción opcional. Envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y está disponible en español.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-ansiedad',
  enSlug: 'affirmations-for-anxiety',
  title: 'Afirmaciones para la ansiedad (2026): frases suaves para momentos de tensión',
  shortTitle: 'Afirmaciones para la ansiedad',
  metaDescription: 'Afirmaciones suaves para momentos de ansiedad, con un ejercicio sencillo de arraigo que puedes hacer en poco tiempo. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento para la ansiedad y no sustituyen el apoyo profesional. Son frases pequeñas y honestas que reconocen lo que sientes en lugar de luchar contra ello.',
    'La ansiedad es una experiencia humana muy común. El cuerpo se prepara para algo difícil: el pecho se aprieta, los pensamientos se aceleran y la atención se estrecha hacia todo lo que podría salir mal. A veces hay una razón clara, como una fecha límite o una conversación difícil. Otras veces llega sin causa evidente, y esa puede ser la versión más inquietante.',
    'En medio de eso, discutir con la sensación rara vez funciona. “Cálmate ya” no es una frase que alguien haya encontrado útil alguna vez. Suele ayudar más algo pequeño y amable que no te exija sentirte distinto de inmediato: una frase breve y firme que acompañe el momento mientras pasa.',
    'Las mejores frases son honestas. “Estoy completamente a salvo y nada saldrá mal” puede sonar falso, y una frase falsa aumenta la tensión. En cambio, “Esta sensación es incómoda, y cambiará” es más fácil de aceptar porque es verdad. Elige las palabras que hagan que tus hombros bajen un poco, aunque sea apenas.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas como quieras, con o sin la app.'
  ],
  affirmations: [
    'Esta sensación es incómoda, y cambiará.',
    'Puedo sentir ansiedad y aun así dar un paso pequeño.',
    'Mi cuerpo intenta protegerme. Puedo ayudarlo a ir más despacio.',
    'No tengo que creer cada pensamiento que llega con el corazón acelerado.',
    'Ya atravesé momentos difíciles antes, y puedo recibir este con suavidad.',
    'Solo necesito atravesar este minuto.',
    'Está bien pedir ayuda o compañía.',
    'Puedo dejar que mi respiración sea lenta, aunque mis pensamientos sean rápidos.',
    'Sentir ansiedad no significa estar roto.',
    'Puedo ser amable conmigo mientras esto pasa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para volver al presente',
    steps: [
      'Mira a tu alrededor y nombra en voz baja cosas que puedes ver, después cosas que puedes tocar y cosas que puedes oír. El objetivo es simplemente llevar tu atención a la habitación en la que estás.',
      'Respira por la nariz despacio y suelta el aire más lentamente todavía. Repítelo unas veces. Si contar te tensa más, olvida los números y haz solo que la salida del aire sea un poco más larga que la entrada.',
      'Elige una afirmación de la lista y léela una vez en voz alta. Si no te suena creíble, suavízala hasta que lo sea, y para ahí. No hay nada más que conseguir.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para pensar demasiado y afirmaciones de amor propio (enlaces abajo, en inglés). Si la ansiedad es intensa, frecuente o interfiere con tu vida diaria, o si alguna vez te sientes en peligro, contacta con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la ansiedad',
  directAnswer: [
    'Si la ansiedad suena fuerte ahora mismo, la respuesta honesta es que discutir con la sensación rara vez funciona. La ansiedad es una experiencia humana muy común: el cuerpo se prepara para algo difícil, el pecho se aprieta, los pensamientos se aceleran y la atención se estrecha hacia lo que podría salir mal. A veces hay una razón clara y otras no, y “cálmate ya” nunca ha ayudado a nadie.',
    'Las afirmaciones para la ansiedad son frases pequeñas y honestas que reconocen la sensación en lugar de luchar contra ella. Una frase falsa aumenta la tensión, mientras que “Esta sensación es incómoda, y cambiará” es más fácil de aceptar porque es verdad. Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Las frases de esta página puedes usarlas como quieras, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento, y Anicca no sustituye el apoyo profesional. Si la ansiedad es intensa, frecuente o interfiere con tu vida diaria, o si alguna vez te sientes en peligro, contacta con un profesional de la salud o con una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Por qué decir “cálmate ya” nunca ayuda con la ansiedad?',
      a: 'Porque discutir con la sensación rara vez funciona. La ansiedad es el cuerpo preparándose para algo difícil: el pecho se aprieta, los pensamientos se aceleran y la atención se estrecha hacia lo que podría salir mal. Suele ayudar más algo pequeño y amable que no te exija sentirte distinto de inmediato.'
    },
    {
      q: '¿Qué afirmaciones sirven para la ansiedad?',
      a: 'Frases pequeñas y honestas de esta página, por ejemplo: “Esta sensación es incómoda, y cambiará.” “Solo necesito atravesar este minuto.” “Sentir ansiedad no significa estar roto.” Una frase que suena falsa aumenta la tensión, así que suaviza cualquier frase hasta que te resulte creíble.'
    },
    {
      q: '¿Qué puedo hacer en un momento de ansiedad?',
      a: 'Prueba el ejercicio de esta página: nombra cosas que puedes ver, tocar y oír para volver a la habitación en la que estás. Después respira despacio haciendo que la salida del aire sea un poco más larga que la entrada. Elige una afirmación, léela una vez en voz alta y para ahí.'
    },
    {
      q: '¿Qué app ayuda con la ansiedad?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-de-amor-propio',
  enSlug: 'affirmations-for-self-love',
  title: 'Afirmaciones de amor propio (2026): frases creíbles, sin positividad forzada',
  shortTitle: 'Afirmaciones de amor propio',
  metaDescription: 'Afirmaciones de amor propio que sí puedes creerte, con un ejercicio breve para tratarte con más amabilidad. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: el amor propio no es un tratamiento ni una meta enorme, y estas frases no sustituyen el apoyo profesional. En la práctica es algo más pequeño: tratarte con el respeto y la paciencia básicos que le ofrecerías a un amigo.',
    'El amor propio puede sonar como un objetivo grande y vago, como si tuvieras que despertar un día adorando todo de ti. En la práctica es más sencillo: se trata menos de sentirte increíble y más de no añadir crueldad a un día difícil. Es un tono, no un examen que haya que aprobar.',
    'Muchas personas viven con una voz interna estricta entrenada durante años. Señala los errores rápido y rara vez menciona lo que salió bien. Quizá empezó como una forma de mantenerte a salvo o de hacerte mejorar, pero una voz que solo critica cansa, y no suele hacer a nadie más capaz. A menudo solo hace que dé más miedo intentarlo.',
    'Las afirmaciones pueden ayudarte a practicar otro tono, con una condición: tienen que ser creíbles. Si te dices “Me encanta todo de mí” mientras sientes lo contrario, tu mente discutirá y el ejercicio se volverá en tu contra. Empieza desde donde estás de verdad. “Puedo estar en proceso” es una frase que casi cualquiera puede aceptar, y esa aceptación es la parte que importa.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas, sin pedirte que recuerdes una rutina. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Abajo tienes frases para tomar prestadas y un ejercicio breve que puedes repetir cuando quieras.'
  ],
  affirmations: [
    'Puedo estar en proceso, y eso está permitido.',
    'Puedo hablarme como le hablaría a un amigo.',
    'Mi valor no es algo que tenga que ganarme hoy.',
    'Puedo cometer un error y seguir siendo alguien que merece cuidado.',
    'Descansar no es una recompensa. Es parte de ser persona.',
    'No tengo que ser el mejor para ser suficiente en este momento.',
    'Puedo notar lo que hice bien, aunque haya sido pequeño.',
    'Estoy aprendiendo, y aprender es desordenado.',
    'Puedo poner un límite y seguir siendo amable.',
    'Estoy de mi lado, incluso en los días silenciosos.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para revisarte con amabilidad',
    steps: [
      'Piensa en lo más duro que te dijiste hoy y escríbelo tal como llegó.',
      'Imagina que un amigo cercano dice esa misma frase sobre sí mismo. Escribe lo que le responderías con honestidad: algo corto y verdadero, no alegre a la fuerza.',
      'Lee tu respuesta para ti, despacio, una vez. Después elige una afirmación de la lista para llevarla contigo el resto del día, quizá como nota en el móvil.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para pensar demasiado y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si convives con ánimo bajo persistente, pensamientos de hacerte daño o sentimientos de desesperanza, busca el apoyo de un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones de amor propio',
  directAnswer: [
    'Si buscas afirmaciones de amor propio, la respuesta honesta es que el amor propio es más pequeño y práctico de lo que suena. No es despertar un día adorando todo de ti. Es tratarte con el respeto y la paciencia básicos que le ofrecerías a un amigo: menos sentirte increíble y más no añadir crueldad a un día difícil.',
    'Estas afirmaciones te ayudan a practicar otro tono contigo, con una condición: tienen que ser creíbles. “Me encanta todo de mí” puede sonar falso cuando sientes lo contrario, y una frase falsa hace que la mente discuta. En cambio, “Puedo estar en proceso” es una frase que casi cualquiera puede aceptar. Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Las frases de esta página puedes usarlas como quieras, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si convives con ánimo bajo persistente, pensamientos de hacerte daño o desesperanza, busca el apoyo de un profesional de la salud mental o de una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Qué significa el amor propio en la práctica?',
      a: 'En la práctica es más pequeño y sencillo de lo que suena: tratarte con el respeto y la paciencia básicos que le ofrecerías a un amigo. Se trata menos de sentirte increíble y más de no añadir crueldad a un día difícil.'
    },
    {
      q: '¿Qué afirmaciones de amor propio son buenas?',
      a: 'Frases creíbles de esta página, por ejemplo: “Puedo estar en proceso, y eso está permitido.” “Puedo hablarme como le hablaría a un amigo.” “Mi valor no es algo que tenga que ganarme hoy.” Una frase tiene que ser creíble: si te dices “Me encanta todo de mí” sintiendo lo contrario, tu mente discutirá y el ejercicio se volverá en tu contra.'
    },
    {
      q: '¿Cómo practico afirmaciones de amor propio en dos minutos?',
      a: 'Prueba el ejercicio de esta página: escribe lo más duro que te dijiste hoy, tal como llegó. Imagina que un amigo cercano dice esa frase sobre sí mismo y escribe lo que le responderías con honestidad, corto y verdadero. Lee tu respuesta para ti, despacio, una vez, y elige una afirmación de la lista para el resto del día.'
    },
    {
      q: '¿Qué app ayuda con las afirmaciones de amor propio?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-sindrome-del-impostor',
  enSlug: 'affirmations-for-imposter-syndrome',
  title: 'Afirmaciones para el síndrome del impostor (2026): frases que no te piden fingir seguridad',
  shortTitle: 'Afirmaciones para el síndrome del impostor',
  metaDescription: 'Afirmaciones honestas para el síndrome del impostor, con un ejercicio breve para cuando te sientes un fraude en el trabajo. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: el síndrome del impostor no es un diagnóstico oficial, y estas frases no son un tratamiento. Es la sensación persistente de que tus resultados son suerte o un error, y de que pronto alguien lo notará, incluso cuando estás haciendo el trabajo de verdad.',
    'La pregunta práctica no es “¿cómo hago para sentirme seguro?”, sino “¿qué puedo decirme hoy que sí pueda creerme?”. La sensación crece porque la vara se mueve sin parar: terminas un proyecto y enseguida miras lo que faltó, recibes un elogio y lo archivas como amabilidad ajena. Con el tiempo, la mente guarda cada duda como prueba y descarta cada logro como excepción.',
    'Eso no significa que en secreto no estés cualificado. Significa que tu atención tiene un filtro, y ese filtro está ajustado para buscar fallos. Por eso las afirmaciones del tipo “Soy el mejor” a menudo salen mal: la mente discute, y la discusión gana.',
    'Las frases que funcionan mejor son concretas y modestas: cosas que hiciste, cosas que estás aprendiendo, cosas que pueden ser verdad al mismo tiempo que la duda. Sentirte principiante y ser capaz pueden convivir. No tienes que elegir una de las dos.',
    'Anicca es una app para iPhone pensada para ese tipo de frase: envía una línea breve a la hora que elijas o cuando la necesitas. Es de descarga gratuita en App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Me contrataron, me eligieron o confiaron en mí por razones. No tengo que volver a demostrarlas cada día.',
    'Sentirme principiante y ser capaz pueden ser verdad a la vez.',
    'Puedo hacer una pregunta sin que eso cancele mi competencia.',
    'Un elogio también es información. Puedo dejar que una parte se quede.',
    'No necesito saberlo todo para hacer esto bien.',
    'Mi duda suena fuerte, pero no es el registro de mi trabajo.',
    'Las personas a mi alrededor también están resolviendo partes de esto sobre la marcha.',
    'Puedo nombrar algo que manejé bien esta semana.',
    'Aprender algo en público no es lo mismo que quedar expuesto.',
    'Puedo ocupar mi espacio en esta sala.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos con una lista de pruebas',
    steps: [
      'Escribe hechos sencillos sobre trabajo que hiciste en el último tiempo, como “Entregué el informe” o “Respondí la pregunta de un cliente”. Quédate con los hechos, sin adjetivos.',
      'Junto a cada hecho, escribe a quién o a qué ayudó. Si no se te ocurre nadie, escribe “no lo sé” y sigue adelante. No tienes que forzarlo.',
      'Lee una afirmación de la lista despacio, un par de veces, y después lee tu lista una vez. Guarda la lista en un lugar donde puedas seguir añadiendo, porque tu mente no hará este trabajo sola.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones de amor propio y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si la sensación de ser un fraude es constante, afecta tu sueño o tu trabajo durante semanas o viene con desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el síndrome del impostor',
  directAnswer: [
    'Si buscas afirmaciones para el síndrome del impostor, la respuesta honesta es que se trata de la sensación persistente de que tus resultados son suerte o un error, y de que pronto alguien lo notará. No es un diagnóstico oficial, y aparece en personas que objetivamente están haciendo el trabajo. La pregunta práctica no es cómo sentirte seguro, sino qué puedes decirte hoy que sí puedas creerte.',
    'Esa sensación crece porque la mente guarda cada duda como prueba y descarta cada logro como excepción: tu atención tiene un filtro ajustado para buscar fallos. Por eso las frases del tipo “Soy el mejor” a menudo salen mal. Funcionan mejor las frases concretas y modestas, porque sentirte principiante y ser capaz pueden ser verdad a la vez. Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si la sensación de ser un fraude es constante, afecta tu sueño o tu trabajo durante semanas o viene con desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.'
  ],
  faq: [
    {
      q: '¿Qué es el síndrome del impostor?',
      a: 'Es la sensación persistente de que tus resultados son suerte o un error, y de que pronto alguien lo notará. No es un diagnóstico oficial, y aparece en personas que están haciendo el trabajo de verdad. No significa que en secreto no estés cualificado: significa que tu atención tiene un filtro ajustado para buscar fallos.'
    },
    {
      q: '¿Qué afirmaciones sirven para el síndrome del impostor?',
      a: 'Frases concretas y modestas de esta página, por ejemplo: “Me contrataron, me eligieron o confiaron en mí por razones. No tengo que volver a demostrarlas cada día.” “Sentirme principiante y ser capaz pueden ser verdad a la vez.” “Mi duda suena fuerte, pero no es el registro de mi trabajo.” Las frases del tipo “Soy el mejor” a menudo salen mal porque la mente discute; funciona mejor una frase que hoy sí puedas creerte.'
    },
    {
      q: '¿Cómo practico estas afirmaciones en dos minutos?',
      a: 'Prueba la lista de pruebas de esta página: escribe hechos sencillos sobre trabajo reciente, como “Entregué el informe”, sin adjetivos. Junto a cada hecho, escribe a quién o a qué ayudó. Después lee una afirmación de la lista despacio, un par de veces, y lee tu lista una vez. Guárdala donde puedas seguir añadiendo.'
    },
    {
      q: '¿Qué app ayuda con el síndrome del impostor?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, pensada para frases concretas y modestas, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-agotamiento',
  enSlug: 'affirmations-for-burnout',
  title: 'Afirmaciones para el agotamiento (2026): frases pequeñas para cuando no te queda nada',
  shortTitle: 'Afirmaciones para el agotamiento',
  metaDescription: 'Afirmaciones suaves para el agotamiento y el cansancio profundo, con un ejercicio breve para cerrar un día que drena. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero y más honesto: las afirmaciones no arreglan el agotamiento, y no son un tratamiento. Si estás desgastado por la carga de trabajo, por cuidar a otros o por largas temporadas sin descanso, lo que de verdad ayuda es descansar, recibir apoyo y cambiar esa carga.',
    'El agotamiento suele describirse como un cansancio que no se va del todo con un fin de semana normal, a menudo acompañado de cinismo hacia el trabajo y de la sensación de que nada de lo que haces basta. No es un defecto de carácter ni pereza. Suele crecer en silencio, y la reacción habitual es esforzarse más, lo que empeora el cansancio.',
    'Cuando estás así de cansado, las rutinas largas de autoayuda se convierten en una tarea más. Por eso las frases útiles aquí son cortas y dan permiso: puedes parar por hoy, puedes hacer menos, descansar no es fallar. Deberían sonar como algo que diría un amigo amable, no como un póster motivacional.',
    'Una frase breve no cambia tu situación, pero puede hacer que una tarde difícil sea un poco menos dura, para que no tengas que luchar también contra ti. Úsala como un cierre pequeño del día, no como otra obligación que cumplir bien.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas que te castiguen por saltarte un día. Es de descarga gratuita en App Store, con suscripción opcional y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Estoy cansado porque he estado cargando mucho, no porque sea débil.',
    'Descansar no es una recompensa que tenga que ganarme.',
    'Puedo hacer menos hoy y seguir siendo una persona responsable.',
    'Terminar por hoy es un lugar real donde parar.',
    'No necesito sentirme motivado para dar un paso pequeño.',
    'Mi valor no se mide por lo que produje esta semana.',
    'Puedo decir “ahora no” sin una explicación larga.',
    'Necesitar apoyo es una parte normal de ser humano.',
    'Una pausa honesta vale más que varias pausas con culpa.',
    'Puedo dejar que los problemas de mañana esperen hasta mañana.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para cerrar el día',
    steps: [
      'Escribe la única cosa que sí o sí tiene que pasar mañana, y solo esa. Todo lo demás va a una lista de “más tarde” que esta noche no vas a mirar.',
      'Nombra algo pequeño que ayudaría a tu cuerpo, como beber agua, ducharte, estirarte o acostarte un poco antes. Hazlo si puedes.',
      'Lee una afirmación de la lista despacio, un par de veces. Después deja el móvil unos minutos, si puedes.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la ansiedad y afirmaciones para pensar demasiado (enlaces abajo, en inglés). Si el cansancio dura semanas, afecta tu salud o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona, y considera hablar con tu empleador sobre la carga de trabajo cuando sea posible. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el agotamiento',
  directAnswer: [
    'Si estás agotado, la respuesta honesta es que las afirmaciones no arreglan el agotamiento. Si estás desgastado por la carga de trabajo, por cuidar a otros o por largas temporadas sin descanso, lo que de verdad ayuda es descansar, recibir apoyo y cambiar esa carga. El agotamiento es un cansancio que no se va del todo con un fin de semana normal, y no es un defecto de carácter ni pereza. Una frase breve que da permiso puede hacer que una tarde difícil sea un poco menos dura.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas que te castiguen por saltarte un día, que envía una línea breve a la hora que elijas o cuando la necesitas. Está disponible en español. Las frases de esta página puedes usarlas gratis, con o sin la app.',
    'Esta página es texto de autocuidado, no consejo médico, diagnóstico ni tratamiento. Si el cansancio dura semanas, afecta tu salud o viene con desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona, y considera hablar con tu empleador sobre la carga de trabajo cuando sea posible.'
  ],
  faq: [
    {
      q: '¿El agotamiento es solo pereza o un defecto de carácter?',
      a: 'No. El agotamiento suele describirse como un cansancio que no se va del todo con un fin de semana normal, a menudo con cinismo hacia el trabajo y la sensación de que nada basta. No es un defecto de carácter ni pereza. Suele crecer en silencio, y esforzarse más normalmente empeora el cansancio.'
    },
    {
      q: '¿Las afirmaciones arreglan el agotamiento?',
      a: 'No. Las afirmaciones no arreglan el agotamiento. Si estás desgastado por la carga de trabajo, por cuidar a otros o por largas temporadas sin descanso, lo que de verdad ayuda es descansar, recibir apoyo y cambiar esa carga. Una frase breve puede hacer que una tarde difícil sea un poco menos dura, para que no luches también contra ti.'
    },
    {
      q: '¿Qué afirmaciones sirven para el agotamiento?',
      a: 'Frases cortas que dan permiso y suenan como un amigo amable, por ejemplo: “Estoy cansado porque he estado cargando mucho, no porque sea débil.” “Descansar no es una recompensa que tenga que ganarme.” “Puedo hacer menos hoy y seguir siendo una persona responsable.”'
    },
    {
      q: '¿Qué app ayuda con el agotamiento?',
      a: 'Anicca es una app de afirmaciones para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas que te castiguen por saltarte un día, que envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-soledad',
  enSlug: 'affirmations-for-loneliness',
  title: 'Afirmaciones para la soledad (2026): frases amables para las noches en que te sientes solo',
  shortTitle: 'Afirmaciones para la soledad',
  metaDescription: 'Afirmaciones amables para la soledad y un ejercicio de dos minutos para acercarte a alguien con un gesto pequeño. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero, con honestidad: una afirmación no puede reemplazar a las personas. Lo que sí puede hacer es suavizar esa voz que dice “algo anda mal conmigo” cuando te sientes solo, para que tengas un poco más de energía para acercarte a alguien.',
    'La soledad es la distancia entre la conexión que deseas y la que tienes. No es lo mismo que estar solo: puedes sentirla entre una multitud, dentro de una relación o después de mudarte a una ciudad nueva. Es común, duele, y suele hacerse más fuerte por la noche y los fines de semana, cuando desaparece la estructura del día.',
    'Una trampa frecuente es interpretar la soledad como prueba de que no eres una persona querible. Esa historia hace que acercarte parezca más arriesgado, y así la soledad se mantiene. Las frases que ayudan son cálidas y un poco prácticas: tienes derecho a desear compañía, un mensaje breve cuenta, y la conexión crece despacio.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'Sentirme solo no significa que no sea una persona querible.',
    'Desear conexión es una necesidad humana normal.',
    'Este sentimiento es real, y puede cambiar.',
    'Hoy puedo acercarme a alguien con un gesto pequeño.',
    'Un mensaje breve cuenta como comienzo de conversación.',
    'No tengo que estar en mi mejor momento para merecer compañía.',
    'La conexión crece despacio, y despacio está bien.',
    'Mientras tanto, puedo ser amable conmigo.',
    'Hay personas a las que les alegraría saber de mí.',
    'Puedo pasar esta noche con calma, aunque esté solo.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para acercarte con un gesto pequeño',
    steps: [
      'Elige a una persona con la que hayas perdido el contacto, o a alguien que te gustaría conocer mejor. No tiene que ser tu amistad más cercana.',
      'Escribe un mensaje sin presión, como “Vi esto y pensé en ti” o “¿Cómo has estado?”. No tienes que enviarlo ahora mismo, pero intenta enviarlo hoy.',
      'Lee una afirmación de la lista dos veces, despacio. Si enviarlo te resulta demasiado difícil, anota el nombre para mañana y deja que eso baste por esta noche.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para el amor propio y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si la soledad es constante, viene con sentimientos de desesperanza o te sientes en riesgo, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la soledad',
  directAnswer: [
    'Las afirmaciones para la soledad son frases cálidas y un poco prácticas para los momentos en que te sientes solo. No pueden reemplazar a las personas, pero pueden suavizar la voz que dice que algo anda mal contigo.',
    'No sustituyen el apoyo profesional, pero pueden darte un poco más de energía para acercarte a alguien con un gesto pequeño, como un mensaje breve.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la soledad?',
      a: 'Son frases cálidas y un poco prácticas para cuando te sientes solo. Una afirmación no puede reemplazar a las personas; lo que puede hacer es suavizar la voz que dice “algo anda mal conmigo”, para que tengas un poco más de energía para acercarte a alguien.',
    },
    {
      q: '¿Qué afirmaciones puedo leer cuando me siento solo?',
      a: 'Frases cálidas que no se castigan, por ejemplo: “Sentirme solo no significa que no sea una persona querible.” “Desear conexión es una necesidad humana normal.” “Hoy puedo acercarme a alguien con un gesto pequeño.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos cuando me siento solo?',
      a: 'Elige a una persona con la que hayas perdido el contacto o que te gustaría conocer mejor. Escribe un mensaje sin presión, como “Vi esto y pensé en ti”, e intenta enviarlo hoy. Lee una afirmación de la lista dos veces, despacio. Si enviarlo te resulta demasiado difícil, anota el nombre para mañana y deja que eso baste por esta noche.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la soledad es constante, viene con sentimientos de desesperanza o te sientes en riesgo, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-de-motivacion-cuando-estas-cansado',
  enSlug: 'affirmations-for-motivation-when-tired',
  title: 'Afirmaciones de motivación cuando estás cansado (2026): frases honestas para días de poca energía',
  shortTitle: 'Afirmaciones de motivación cuando estás cansado',
  metaDescription: 'Afirmaciones honestas para encontrar un poco de motivación cuando estás cansado y un ejercicio de dos minutos para empezar poco a poco. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: cuando estás cansado de verdad, un discurso de ánimo no te dará energía. Si el cansancio viene de dormir poco o de una sobrecarga, lo primero es descansar. Pero en un día común de poca energía, una frase pequeña y acertada puede ayudarte a empezar, y empezar suele ser la parte más difícil.',
    'Mucha gente espera a sentir motivación antes de empezar, y luego se siente peor cuando no aparece. En la práctica, la motivación suele venir después de la acción, no antes. Un comienzo muy pequeño baja el costo de empezar, y una vez que estás en movimiento la tarea a menudo se siente menos pesada. Es una observación común, no una garantía.',
    'Por eso las frases del tipo “¡puedes con todo!” suelen fallar cuando estás agotado. Funcionan mejor las frases creíbles: bajan la vara, te dan permiso para hacer la versión pequeña y separan “estoy cansado” de “estoy fracasando”.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'No necesito sentirme listo. Solo necesito empezar poco a poco.',
    'Unos minutos cuentan como un comienzo de verdad.',
    'Estar cansado es información, no un veredicto sobre mí.',
    'Hoy puedo hacer la versión más pequeña de esto.',
    'El progreso no tiene que verse impresionante para ser progreso.',
    'Puedo empezar mal e ir mejorando sobre la marcha.',
    'Puedo descansar después de este paso pequeño.',
    'Mi energía cambia a lo largo del día, y eso es normal.',
    'Puedo elegir primero lo útil más fácil.',
    'Hoy estoy haciendo lo que puedo, y eso es suficiente.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para empezar poco a poco',
    steps: [
      'Elige una tarea y redúcela hasta que parezca casi ridícula, por ejemplo “abrir el documento y escribir una frase” en lugar de “terminar el informe”.',
      'Pon un temporizador breve y dite que puedes parar cuando suene. A menudo seguirás, pero no tienes la obligación.',
      'Lee una afirmación de la lista dos veces, despacio, y luego enciende el temporizador. Si paras cuando suena, eso también fue un logro.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para pensar demasiado y afirmaciones para el amor propio (enlaces abajo, en inglés). Si te sientes cansado y sin motivación casi todo el tiempo durante semanas, o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones de motivación cuando estás cansado',
  directAnswer: [
    'Las afirmaciones de motivación cuando estás cansado son frases breves y creíbles para días de poca energía. No te darán energía si necesitas dormir, pero pueden ayudarte a bajar la vara y dar un primer paso pequeño.',
    'No sustituyen el apoyo profesional, pero recuerdan algo útil: la motivación suele venir después de la acción, no antes, y un comienzo muy pequeño basta para arrancar.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones de motivación cuando estás cansado?',
      a: 'Son frases breves y creíbles que bajan la vara en días de poca energía. Cuando estás cansado de verdad, un discurso de ánimo no te dará energía: si el cansancio viene de dormir poco o de una sobrecarga, lo primero es descansar. En un día común, una frase acertada puede ayudarte a empezar poco a poco.',
    },
    {
      q: '¿Qué afirmaciones puedo leer cuando estoy cansado?',
      a: 'Frases que bajan la vara y separan “estoy cansado” de “estoy fracasando”, por ejemplo: “No necesito sentirme listo. Solo necesito empezar poco a poco.” “Unos minutos cuentan como un comienzo de verdad.” “Hoy puedo hacer la versión más pequeña de esto.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos cuando estoy cansado?',
      a: 'Elige una tarea y redúcela hasta que parezca casi ridícula, como abrir el documento y escribir una frase. Pon un temporizador breve y dite que puedes parar cuando suene. Lee una afirmación de la lista dos veces, despacio, y luego enciende el temporizador. Si paras cuando suena, eso también fue un logro.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si te sientes cansado y sin motivación casi todo el tiempo durante semanas, o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-para-la-procrastinacion',
  enSlug: 'affirmations-for-procrastination',
  title: 'Afirmaciones para la procrastinación (2026): frases que bajan el costo de empezar',
  shortTitle: 'Afirmaciones para la procrastinación',
  metaDescription: 'Afirmaciones honestas para la procrastinación y un ejercicio de dos minutos para empezar esa tarea que vienes evitando. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no harán la tarea por ti. Lo que sí pueden hacer es suavizar la autocrítica que suele acompañar a la procrastinación, para que empezar se sienta un poco menos pesado.',
    'La procrastinación suele tener menos que ver con gestionar el tiempo y más con evitar una sensación: aburrimiento, miedo a hacerlo mal o la impresión de que la tarea es demasiado grande. Posponerla da un alivio breve, luego llega la culpa, y la culpa hace que la tarea se sienta aún peor. Ese ciclo es común y no es señal de que seas una persona floja.',
    'Por eso las frases del tipo “¡simplemente hazlo!” suelen rebotar. Funcionan mejor las frases pequeñas que dan permiso: puedes empezar mal, puedes avanzar un rato breve y puedes sentir resistencia y aun así comenzar.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'Puedo empezar antes de sentirme listo.',
    'Un rato breve de trabajo imperfecto vale más que un plan perfecto sin empezar.',
    'Evitar esta tarea no me convierte en una mala persona.',
    'Puedo sentir resistencia y aun así dar un paso pequeño.',
    'La primera versión puede ser imperfecta.',
    'Puedo partir esto en un pedazo lo bastante pequeño para empezar ahora.',
    'La culpa no es una buena forma de empezar. La amabilidad sí.',
    'Puedo comenzar por la parte más fácil.',
    'Empezar es la parte difícil, y solo necesito hacer esa parte ahora.',
    'Puedo retomar esto mañana sin castigarme.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para encontrar el paso siguiente más pequeño',
    steps: [
      'Nombra la tarea que estás evitando en una frase sencilla y luego escribe la primera acción física, como “abrir el archivo” o “escribir el asunto del correo”.',
      'Di en voz alta qué sensación estás evitando, por ejemplo “Me preocupa que no quede bien”. Nombrarla no la resuelve, pero a menudo la afloja un poco.',
      'Lee una afirmación de la lista dos veces, despacio, y luego haz esa primera acción durante un rato breve. Puedes parar cuando suene el temporizador.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones de motivación cuando estás cansado y afirmaciones para pensar demasiado (enlaces abajo, en inglés). Si llevas semanas sin poder empezar nada, o viene con un ánimo bajo persistente, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la procrastinación',
  directAnswer: [
    'Las afirmaciones para la procrastinación son frases pequeñas y creíbles que bajan el costo de empezar. Posponer algo no suele ser flojera: a menudo es evitar una sensación, como el aburrimiento o el miedo a hacerlo mal.',
    'No sustituyen el apoyo profesional ni harán la tarea por ti, pero pueden suavizar la autocrítica para que el primer paso, el más pequeño posible, se sienta menos pesado.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la procrastinación?',
      a: 'Son frases pequeñas y creíbles que bajan el costo de empezar una tarea que vienes evitando. La procrastinación suele ser una forma de evitar una sensación —aburrimiento, miedo a hacerlo mal o una tarea que se siente demasiado grande— y no una señal de flojera.',
    },
    {
      q: '¿Qué afirmaciones puedo leer cuando procrastino?',
      a: 'Frases pequeñas que dan permiso para empezar, por ejemplo: “Puedo empezar antes de sentirme listo.” “La primera versión puede ser imperfecta.” “Puedo partir esto en un pedazo lo bastante pequeño para empezar ahora.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para dejar de posponer?',
      a: 'Nombra la tarea que evitas en una frase sencilla y escribe la primera acción física, como abrir el archivo. Di en voz alta qué sensación estás evitando; nombrarla a menudo la afloja un poco. Lee una afirmación de la lista dos veces, despacio, y haz esa primera acción durante un rato breve.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si llevas semanas sin poder empezar nada, o viene con un ánimo bajo persistente o sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-para-tu-valor-personal',
  enSlug: 'affirmations-for-self-worth',
  title: 'Afirmaciones para tu valor personal (2026): frases que no dependen de lo que lograste hoy',
  shortTitle: 'Afirmaciones para tu valor personal',
  metaDescription: 'Afirmaciones con los pies en la tierra para tu valor personal y un ejercicio de dos minutos para separar tu valor de tu rendimiento. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: repetir “yo valgo” no cambiará por sí solo cómo te sientes. Suele ayudar más cuando la frase es creíble y la acompañas de acciones pequeñas que van en la misma dirección.',
    'Un valor personal bajo suele venir de reglas condicionadas aprendidas temprano: estoy bien cuando rindo, cuando los demás me aprueban o cuando no cometo errores. Cuando el valor depende de los resultados, cada día malo se vuelve un veredicto y cada día bueno se siente temporal.',
    'Las frases que ayudan son serenas, no grandiosas. Dicen que el valor no se gana cada día, que puedes ser imperfecto y aun así merecer cuidado, y que puedes tratarte como tratarías a una amistad en la misma situación.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'Mi valor no es una puntuación que tenga que mantener.',
    'Puedo ser imperfecto y aun así merecer amabilidad.',
    'No tengo que ganarme el descanso ni el respeto cada día.',
    'Un error es algo que hice, no algo que soy.',
    'Puedo hablarme como le hablaría a una amistad.',
    'Tengo derecho a tener necesidades.',
    'Las opiniones de los demás son información, no un fallo sobre mi valor.',
    'Hoy puedo hacer una acción pequeña que sea buena para mí.',
    'Soy más que mi productividad.',
    'Puedo seguir practicando esto, aunque hoy solo lo crea a medias.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos con la voz de una amistad',
    steps: [
      'Escribe, palabra por palabra, lo más duro que te dijiste hoy.',
      'Imagina que una amistad dijera eso mismo sobre sí misma. Escribe lo que honestamente le responderías, en una o dos frases sencillas.',
      'Lee una afirmación de la lista dos veces, despacio, y luego vuelve a leer una vez tu respuesta con la voz de una amistad.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para el amor propio y afirmaciones para el síndrome del impostor (enlaces abajo, en inglés). Si los sentimientos de no valer nada son constantes, duran semanas o vienen con desesperanza o pensamientos de hacerte daño, habla cuanto antes con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para tu valor personal',
  directAnswer: [
    'Las afirmaciones para tu valor personal son frases serenas y creíbles que no dependen de lo que lograste hoy. Repetir una frase no cambiará por sí solo cómo te sientes; ayuda más acompañarla de acciones pequeñas que van en la misma dirección.',
    'No sustituyen el apoyo profesional, pero pueden recordarte que tu valor no se gana cada día y que puedes tratarte como tratarías a una amistad en la misma situación.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para tu valor personal?',
      a: 'Son frases serenas y creíbles que dicen que tu valor no depende de lo que lograste hoy. Un valor personal bajo suele venir de reglas condicionadas aprendidas temprano: estoy bien cuando rindo, cuando los demás me aprueban o cuando no cometo errores. Las frases que ayudan no son grandiosas; son constantes.',
    },
    {
      q: '¿Qué afirmaciones puedo leer para mi valor personal?',
      a: 'Frases serenas de esta página, por ejemplo: “Mi valor no es una puntuación que tenga que mantener.” “Puedo ser imperfecto y aun así merecer amabilidad.” “Un error es algo que hice, no algo que soy.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para mi valor personal?',
      a: 'Prueba el ejercicio con la voz de una amistad de esta página: escribe, palabra por palabra, lo más duro que te dijiste hoy. Imagina que una amistad dijera eso sobre sí misma y escribe lo que honestamente le responderías. Lee una afirmación de la lista dos veces, despacio, y vuelve a leer tu respuesta una vez.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si los sentimientos de no valer nada son constantes, duran semanas o vienen con desesperanza o pensamientos de hacerte daño, habla cuanto antes con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-para-el-perfeccionismo',
  enSlug: 'affirmations-for-perfectionism',
  title: 'Afirmaciones para el perfeccionismo (2026): frases para cuando lo suficientemente bueno se siente inseguro',
  shortTitle: 'Afirmaciones para el perfeccionismo',
  metaDescription: 'Afirmaciones serenas para el perfeccionismo y un ejercicio de dos minutos para entregar algo lo suficientemente bueno. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no eliminarán tus estándares altos, y quizá no quieras que lo hagan. Pueden ayudar con la parte dura, esa voz que trata cada defecto como un fracaso.',
    'El perfeccionismo suele describirse como estándares muy altos combinados con un juicio severo hacia uno mismo cuando no se alcanzan. Puede verse como reescribir algo muchas veces, evitar empezar o nunca sentir que algo está terminado. A menudo viene del deseo de estar a salvo de la crítica, algo comprensible.',
    'El costo es que consume tiempo y energía y puede alimentar la procrastinación. Las frases que ayudan no dicen “baja tus estándares”; separan la calidad del miedo. Que algo sea lo suficientemente bueno por ahora puede ser una elección real y deliberada.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'Lo suficientemente bueno por ahora es una elección real, no un fracaso.',
    'Puedo hacer un trabajo cuidadoso sin exigir que sea impecable.',
    'Un defecto no es lo mismo que un fracaso.',
    'Puedo terminar algo y mejorarlo después.',
    'Mis estándares pueden ser altos y mi voz puede seguir siendo amable.',
    'Los errores son parte de cómo aprendo esto.',
    'Hoy puedo permitir que una cosa sea imperfecta.',
    'Terminar es un buen lugar donde estar.',
    'La gente rara vez nota aquello que temo que notará.',
    'Puedo sentir orgullo por el esfuerzo, no solo por los resultados.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para comprobar si ya es suficiente',
    steps: [
      'Elige aquello que estás puliendo y escribe en una frase cómo se vería honestamente “lo suficientemente bueno para su propósito”.',
      'Anota el cambio o los dos cambios que importarían a la persona que lo va a usar. Ignora el resto por ahora.',
      'Lee una afirmación de la lista dos veces, despacio, y luego haz solo esos cambios y ponte una hora para parar.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para la procrastinación y afirmaciones para tu valor personal (enlaces abajo, en inglés). Si el perfeccionismo te causa un malestar constante, afecta tu salud o tu sueño o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el perfeccionismo',
  directAnswer: [
    'Las afirmaciones para el perfeccionismo son frases serenas para cuando “lo suficientemente bueno” se siente inseguro. No eliminarán tus estándares altos; pueden ayudar con la voz dura que trata cada defecto como un fracaso.',
    'No sustituyen el apoyo profesional, pero pueden ayudarte a separar la calidad del miedo, para que terminar algo y mejorarlo después sea una elección posible.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el perfeccionismo?',
      a: 'Son frases serenas y creíbles para la voz dura que acompaña a los estándares muy altos. El perfeccionismo suele describirse como estándares altos combinados con un juicio severo hacia uno mismo cuando no se alcanzan, y a menudo viene del deseo de estar a salvo de la crítica.',
    },
    {
      q: '¿Qué afirmaciones puedo leer para el perfeccionismo?',
      a: 'Frases serenas de esta página, por ejemplo: “Lo suficientemente bueno por ahora es una elección real, no un fracaso.” “Un defecto no es lo mismo que un fracaso.” “Puedo terminar algo y mejorarlo después.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para el perfeccionismo?',
      a: 'Prueba la comprobación de esta página: elige lo que estás puliendo y escribe en una frase cómo se vería lo suficientemente bueno para su propósito. Anota el cambio o los dos cambios que importarían a quien lo va a usar e ignora el resto. Lee una afirmación dos veces, despacio, haz solo esos cambios y ponte una hora para parar.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el perfeccionismo te causa un malestar constante, afecta tu salud o tu sueño o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-para-el-miedo-al-fracaso',
  enSlug: 'affirmations-for-fear-of-failure',
  title: 'Afirmaciones para el miedo al fracaso (2026): frases para intentarlo aunque puedas equivocarte',
  shortTitle: 'Afirmaciones para el miedo al fracaso',
  metaDescription: 'Afirmaciones serenas para el miedo al fracaso y un ejercicio de dos minutos para dar un paso con un riesgo pequeño. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: una afirmación no garantizará que salga bien. Puede hacer que el costo de intentarlo se sienta un poco menor, y eso suele ser lo que se necesita para empezar.',
    'El miedo al fracaso es la preocupación de que equivocarte diga algo malo de ti o te haga perder el respeto de los demás. Es común y suele mostrarse como evitación, preparación excesiva o no intentarlo en absoluto. Evitar el riesgo se siente seguro en el momento, pero puede alejarte de cosas que te importan.',
    'Las frases creíbles separan el resultado de tu valor. Reconocen que fracasar es incómodo y que puedes atravesarlo, aprender de ello y volver a intentarlo. No prometen que saldrá bien.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app.',
  ],
  affirmations: [
    'Puedo intentar algo sin saber cómo saldrá.',
    'Un intento fallido es información, no un veredicto sobre mí.',
    'Ya he estado incómodo antes y lo superé.',
    'Hoy puedo asumir un riesgo pequeño.',
    'No intentarlo también es una elección con un costo.',
    'Mi valor no depende de este resultado.',
    'Puedo aprender de esto y volver a intentarlo.',
    'Está bien estar nervioso y aun así empezar.',
    'Puedo prepararme lo suficiente y luego soltar.',
    'Aunque esto no funcione, yo estaré bien.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos: el peor caso y luego el paso siguiente',
    steps: [
      'Escribe el peor resultado realista en una frase y luego escribe cómo lo afrontarías, aunque sea a grandes rasgos.',
      'Escribe una versión pequeña y de bajo riesgo del intento que podrías hacer pronto, como enviar un borrador a una sola persona.',
      'Lee una afirmación de la lista dos veces, despacio, y luego agenda ese paso pequeño en tu calendario.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para el perfeccionismo y afirmaciones para la ansiedad (enlaces abajo, en inglés). Si el miedo te impide llevar tu vida diaria durante semanas, o viene con pánico o sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el miedo al fracaso',
  directAnswer: [
    'Las afirmaciones para el miedo al fracaso son frases serenas y creíbles para intentarlo aunque puedas equivocarte. No garantizarán que salga bien; pueden hacer que el costo de intentarlo se sienta un poco menor.',
    'No sustituyen el apoyo profesional, pero pueden ayudarte a separar el resultado de tu valor: fracasar es incómodo, y puedes atravesarlo, aprender y volver a intentarlo.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el miedo al fracaso?',
      a: 'Son frases serenas y creíbles que separan el resultado de tu valor. El miedo al fracaso es la preocupación de que equivocarte diga algo malo de ti o te haga perder el respeto de los demás, y suele mostrarse como evitación, preparación excesiva o no intentarlo en absoluto.',
    },
    {
      q: '¿Qué afirmaciones puedo leer si tengo miedo a fracasar?',
      a: 'Frases constantes de esta página, por ejemplo: “Un intento fallido es información, no un veredicto sobre mí.” “Mi valor no depende de este resultado.” “Puedo intentar algo sin saber cómo saldrá.” Elige una y léela dos veces, despacio. No prometen que saldrá bien.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para el miedo al fracaso?',
      a: 'Prueba el ejercicio de esta página: escribe el peor resultado realista en una frase y cómo lo afrontarías, aunque sea a grandes rasgos. Escribe una versión pequeña y de bajo riesgo del intento que podrías hacer pronto. Lee una afirmación dos veces, despacio, y agenda ese paso pequeño en tu calendario.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el miedo te impide llevar tu vida diaria durante semanas, o viene con pánico o sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'app-de-afirmaciones-sin-rachas',
  enSlug: 'affirmation-app-no-streaks',
  title: 'App de afirmaciones sin rachas (2026): frases amables sin culpa por perder un día',
  shortTitle: 'App de afirmaciones sin rachas',
  metaDescription: '¿Buscas una app de afirmaciones sin rachas? Anicca es una app de afirmaciones para iPhone, gratis de descargar, que envía una línea amable cuando la necesitas, sin contadores ni culpa.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: una app sin rachas es una app que no te castiga por perder un día con un contador roto ni con un aviso de culpa.',
    'Muchas apps de hábitos tratan un día perdido como un fracaso: la racha se reinicia, la insignia desaparece y la próxima vez que abres la app recibes una lección. Con las afirmaciones, ese diseño suele salir al revés. Quienes buscan una frase amable a menudo ya son duros consigo mismos, y añadir un marcador convierte el autocuidado en otra tarea en la que pueden “fallar”.',
    'Una app de afirmaciones sin rachas mantiene la práctica como algo opcional. Puedes faltar un día y volver al siguiente sin una cadena rota. Lo importante es una frase útil cuando tu mente da vueltas, no un calendario perfecto.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas con o sin la app, sin ningún contador.',
  ],
  affirmations: [
    'Perder un día no borra la amabilidad que ya practiqué.',
    'Puedo abrir esta app sin ganarme antes una semana perfecta.',
    'Una racha es opcional. La suavidad no.',
    'Puedo volver sin pedirle perdón a un contador.',
    'Una frase honesta hoy es suficiente.',
    'No tengo que representar el autocuidado para merecerlo.',
    'Los días tranquilos también cuentan como ser humano.',
    'Puedo empezar de nuevo a mitad de semana, sin nada acumulado.',
    'La culpa no es una buena entrenadora para la amabilidad.',
    'Aparezco cuando puedo, y eso también es una práctica.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para reiniciar sin rachas',
    steps: [
      'Si perdiste días, nómbralo una vez sin discursos: “Estuve ausente”. Luego deja de explicarlo.',
      'Elige una afirmación de la lista y léela dos veces. No añadas una sesión de recuperación por los días que saltaste.',
      'Si quieres, programa en Anicca un solo recordatorio diario a una hora en la que sueles darle vueltas a las cosas, no varios recordatorios que vuelvan a crear presión.',
    ],
  },
  closing: 'Guías relacionadas: afirmaciones para pensar demasiado por la noche y recordatorios de afirmaciones durante el día (enlaces abajo, en inglés). Anicca es una app de autocuidado, no consejo médico. Si el malestar es constante o viene con sentimientos de desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona; esta página no sustituye el apoyo profesional.',
  h1: 'App de afirmaciones sin rachas',
  directAnswer: [
    'Una app de afirmaciones sin rachas es una app que no te castiga por perder un día con un contador roto ni con un aviso de culpa. Puedes faltar un día y volver al siguiente sin una cadena rota.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas, que envía una línea breve y amable a la hora que elijas o cuando la necesitas.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué significa “sin rachas” en una app de afirmaciones?',
      a: 'Significa que la app no sigue una cadena diaria ininterrumpida que se reinicia cuando pierdes un día. Puedes saltarte un día y volver sin un marcador de culpa. Lo importante es una frase útil cuando la necesitas, no un calendario perfecto.',
    },
    {
      q: '¿Qué afirmaciones puedo leer sin seguir una racha?',
      a: 'Frases amables que no exigen una semana perfecta, por ejemplo: “Perder un día no borra la amabilidad que ya practiqué.” “Una frase honesta hoy es suficiente.” “Puedo empezar de nuevo a mitad de semana, sin nada acumulado.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos sin rachas?',
      a: 'Si perdiste días, nómbralo una vez sin discursos: “Estuve ausente”. Elige una afirmación de la lista y léela dos veces, sin añadir una sesión de recuperación por los días que saltaste. Si quieres, programa un solo recordatorio diario a una hora en la que sueles darle vueltas a las cosas.',
    },
    {
      q: '¿Anicca tiene rachas?',
      a: 'No. Anicca no tiene rachas ni avisos de culpa por perder un día. Es una app para iPhone, gratis de descargar, con suscripción opcional, y está disponible en español. Es una herramienta de autocuidado, no un tratamiento médico.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'afirmaciones-para-pensar-demasiado-por-la-noche',
  enSlug: 'affirmations-for-overthinking-at-night',
  title: 'Afirmaciones para pensar demasiado por la noche (2026): frases breves para calmar el bucle antes de dormir',
  shortTitle: 'Afirmaciones para pensar demasiado por la noche',
  metaDescription: 'Afirmaciones breves para pensar demasiado por la noche y un ejercicio de dos minutos para calmarte. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no borrarán cada preocupación. Pueden interrumpir la vuelta número diez del mismo pensamiento, para que tu cuerpo tenga un lugar más pequeño donde aterrizar.',
    'La noche elimina las interrupciones del día que mantenían la preocupación en pausa. Sin reuniones ni encargos, la mente suele repasar mensajes, plazos y escenas de “¿y si…?”. Eso no significa que hayas fallado el día; significa que tu sistema nervioso aún tiene energía sin un lugar útil donde gastarla.',
    'Pensar demasiado por la noche suele ser una búsqueda de certeza antes de dormir. Las afirmaciones funcionan mejor cuando son modestas: no “todo está bien”, sino “no tengo que resolver esta noche para merecer descanso”. Lo creíble le gana a lo dramático.',
    'Anicca envía una línea breve a la hora que elijas o cuando la necesitas, incluso tarde por la noche, no tiene rachas y es gratis de descargar, con suscripción opcional. La app está disponible en español en la App Store. Las frases de abajo puedes usarlas como marcadores para la noche, con o sin la app.',
  ],
  affirmations: [
    'No tengo que resolver esta noche para merecer descanso.',
    'Esta preocupación suena fuerte, pero no siempre dice la verdad.',
    'Una respiración lenta basta para este minuto.',
    'Estar acostado cuenta, aunque el sueño llegue tarde.',
    'Los pensamientos pueden visitarme sin quedarse a vivir.',
    'Mi yo de la mañana no castigará a mi yo de la noche por necesitar silencio.',
    'Puedo dejar el móvil y sentir el peso de mi cuerpo.',
    'La imaginación con miedo y este cuarto oscuro no son el mismo lugar.',
    'La calma no exige una lista terminada.',
    'Puedo encontrarme con este pensamiento una vez y dejarlo aquí.',
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para calmarte por la noche',
    steps: [
      'Quédate quieto y nombra tres cosas que puedas sentir: la sábana, la almohada, el aire. Sin arreglar nada, solo notar.',
      'Elige una afirmación y dila una vez en voz alta o en un susurro. Si se siente falsa, suavízala hasta que sea creíble.',
      'Suelta el aire más despacio de lo que lo tomas, dos veces. Luego para. Si la mente vuelve, usa la misma frase una vez más y déjala ahí.',
    ],
  },
  closing: 'Guías relacionadas: una app de afirmaciones sin rachas y recordatorios de afirmaciones durante el día (enlaces abajo, en inglés). Si las noches se sienten insoportables una y otra vez, busca a alguien de confianza o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional. Si el insomnio o la ansiedad nocturna persisten, habla con un médico o un terapeuta.',
  h1: 'Afirmaciones para pensar demasiado por la noche',
  directAnswer: [
    'Las afirmaciones para pensar demasiado por la noche son frases breves y creíbles para cuando el día sin terminar se hace ruidoso y el sueño se siente lejos. No borrarán cada preocupación, pero pueden interrumpir el bucle del mismo pensamiento.',
    'No sustituyen el apoyo profesional, pero una frase modesta y honesta puede acortar la discusión con la preocupación lo suficiente para descansar.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.',
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para pensar demasiado por la noche?',
      a: 'Son frases breves y creíbles que se leen cuando el bucle de pensamientos no se detiene por la noche. No son una cura ni borran cada preocupación; son una interrupción pequeña, un lugar más tranquilo donde aterrizar antes de descansar.',
    },
    {
      q: '¿Qué afirmaciones puedo leer por la noche?',
      a: 'Frases modestas que no prometen que todo está bien, por ejemplo: “No tengo que resolver esta noche para merecer descanso.” “Esta preocupación suena fuerte, pero no siempre dice la verdad.” “Estar acostado cuenta, aunque el sueño llegue tarde.” Elige una y léela dos veces, despacio.',
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos por la noche?',
      a: 'Quédate quieto y nombra tres cosas que puedas sentir: la sábana, la almohada, el aire. Elige una afirmación y dila una vez en voz alta o en un susurro; si se siente falsa, suavízala hasta que sea creíble. Suelta el aire más despacio de lo que lo tomas, dos veces, y luego para.',
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si las noches se sienten insoportables una y otra vez, o el insomnio persiste, busca a alguien de confianza, una línea de ayuda de tu zona, un médico o un terapeuta.',
    },
  ],
  campaignPrefix: 'seo_es',
},
{
  slug: 'recordatorios-de-afirmaciones-durante-el-dia',
  enSlug: 'affirmation-reminders-throughout-the-day',
  title: 'Recordatorios de afirmaciones durante el día en iPhone (2026): una frase amable a tu hora',
  shortTitle: 'Recordatorios de afirmaciones durante el día',
  metaDescription: 'Recordatorios de afirmaciones durante el día en iPhone: una frase breve y amable a la hora que elijas. Anicca es una app para iPhone, gratis de descargar, sin rachas y con suscripción opcional.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo más difícil de las afirmaciones rara vez es encontrar una frase bonita. Es acordarte de ella cuando tu atención ya está agotada. Una biblioteca que nunca abres ayuda poco en una tarde difícil entre semana.',
    'Los recordatorios funcionan mejor cuando coinciden con momentos reales de fricción, como después de comer, antes de una reunión o ya entrada la noche, en lugar de llenar la pantalla de bloqueo a cada hora hasta que terminas silenciando todo.',
    'Una notificación puede ser suave y no urgente. No necesitas una rutina perfecta para usar un recordatorio: basta una hora que encaje con tu día real y una frase que te resulte creíble hoy.',
    'Puedes cambiar la hora hasta que encaje, silenciar los recordatorios que sobren y quedarte solo con el que te ayuda. La amabilidad con horario también cuenta como amabilidad.',
    'Anicca es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas. Envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Este recordatorio es una pausa, no un examen.',
    'Puedo tomar una frase amable y volver a mi día.',
    'No necesito una rutina perfecta para usar un recordatorio.',
    'Una línea en el momento justo es suficiente.',
    'Puedo silenciar lo que sobra y quedarme con lo que ayuda.',
    'Una notificación puede ser suave, no urgente.',
    'Puedo cambiar la hora hasta que encaje conmigo.',
    'La amabilidad con horario también cuenta como amabilidad.',
    'Puedo leer esto una vez y dejar el móvil.',
    'Mi día no tiene que estar optimizado para incluir cuidado.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para configurar tu recordatorio',
    steps: [
      'Elige la hora del día en que tu mente suele ponerse más dura, solo una, no varias. Escríbela en un papel.',
      'Elige una afirmación de la lista, o escribe una parecida que suene a ti y te resulte creíble.',
      'En Anicca, o en tu app de recordatorios, configura esa única hora. Vive con ella unos días antes de añadir otra.'
    ]
  },
  closing: 'Guías relacionadas: app de afirmaciones sin rachas, alternativa a I Am y alternativa a ThinkUp (enlaces abajo). Si la ansiedad o el ánimo bajo duran semanas, afectan tu sueño, tu trabajo o tu salud, o vienen con pánico o desesperanza, habla con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Recordatorios de afirmaciones durante el día en iPhone',
  directAnswer: [
    'Los recordatorios de afirmaciones durante el día en iPhone son notificaciones programadas que te traen una frase breve, para que no tengas que acordarte de abrir una app.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar, que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas y con suscripción opcional.',
    'Si quieres recordatorios que se sientan como una amiga y no como un marcador de hábitos, elige una o pocas horas que encajen con tu día real y mantén frases creíbles.'
  ],
  faq: [
    {
      q: '¿Cuántos recordatorios de afirmaciones al día son útiles?',
      a: 'Empieza con uno. Muchas personas silencian las apps que avisan sin parar. Añade una segunda hora solo si la primera ya te ayuda de verdad.'
    },
    {
      q: '¿Anicca envía recordatorios en iPhone?',
      a: 'Sí. Anicca es una app para iPhone, gratis de descargar en la App Store, pensada para enviarte una línea breve a la hora que elijas o cuando la necesitas, sin rachas.'
    },
    {
      q: '¿Necesito una suscripción para los recordatorios?',
      a: 'Anicca es gratis de descargar, con suscripción opcional. Lo que incluye cada opción puede cambiar, así que revisa la pantalla de compra actual de la App Store antes de decidir.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la ansiedad o el ánimo bajo duran semanas o afectan tu vida diaria, habla con un médico o un terapeuta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'alternativa-a-i-am',
  enSlug: 'i-am-app-alternative',
  title: 'Alternativa a I Am (2026): afirmaciones diarias sin rachas en iPhone',
  shortTitle: 'Alternativa a I Am',
  metaDescription: '¿Buscas una alternativa a I Am? Comparación honesta entre I am - Daily Affirmations y Anicca: widgets y muchos recordatorios frente a una línea a tu hora y sin rachas. Solo datos públicos de la App Store.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral y esta página tiene un conflicto de interés. Por eso, los datos de la competencia de abajo se limitan a lo que aparece en su página pública de la App Store. No invento valoraciones, descargas ni precios.',
    'Cuando alguien busca una alternativa a I Am, suele referirse a I am - Daily Affirmations, de Monkey Taps, en la App Store. La búsqueda suele aparecer cuando quieres menos widgets, un tono más tranquilo, nada de presión por rachas o una sola línea bien temporizada en lugar de muchos recordatorios.',
    'Según su ficha pública, I am - Daily Affirmations pone el acento en las afirmaciones diarias, los widgets positivos, las afirmaciones en la pantalla de bloqueo y en la pantalla de inicio, las intenciones diarias y los recordatorios a lo largo del día. Figura como gratis con compras dentro de la app, con opciones de suscripción descritas en su propia ficha.',
    'Anicca, en cambio, pone el acento en una línea breve y amable a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por un día perdido. Es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y disponible en español.',
    'Lee tú misma o tú mismo ambas fichas antes de decidir. Las preferencias sobre widgets, grabación de voz, rachas y volumen de notificaciones son personales, y ninguna de las dos apps sustituye la terapia ni la atención médica.'
  ],
  affirmations: [
    'Puedo elegir la herramienta que encaja con mi día.',
    'No le debo una prueba larga a ninguna app.',
    'Menos notificaciones también puede ser cuidado.',
    'Una línea en el momento justo es suficiente.',
    'Puedo cambiar de opinión después de probar.',
    'Mi rutina no necesita un marcador para contar.',
    'Puedo quedarme con lo sencillo si me ayuda más.',
    'Comparar con calma es parte de cuidarme.',
    'No necesito widgets para hablarme bien.',
    'Puedo borrar lo que no encaje, sin culpa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para elegir entre ambas',
    steps: [
      'Abre los enlaces de la App Store de abajo. Lee solo la descripción y las capturas actuales de cada app, e ignora los sitios de terceros que prometen cifras de descargas.',
      'Pregúntate qué flujo quieres: widgets y muchos recordatorios, como describe la ficha de I am, o una línea a tu hora y sin rachas, como describe la ficha de Anicca.',
      'Descarga la versión gratuita de la que encaje contigo. Puedes borrarla después; no le debes a ninguna app una prueba larga.'
    ]
  },
  closing: 'Guías relacionadas: recordatorios de afirmaciones durante el día y alternativa a ThinkUp (enlaces abajo), además de los enlaces a ambas fichas de la App Store para que verifiques por tu cuenta. Los detalles de la tienda pueden cambiar; vuelve a revisar las fichas actuales. Esta página es texto de autocuidado; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Alternativa a I Am',
  directAnswer: [
    'Si buscas una alternativa a I Am, probablemente quieres afirmaciones diarias en iPhone con otro estilo de recordatorio, otro tono u otro nivel de presión.',
    'I am - Daily Affirmations, de Monkey Taps, y Anicca son apps gratuitas de descargar con compras opcionales dentro de la app, y cada una pone el acento en un flujo distinto, según sus fichas públicas de la App Store.',
    'Abajo tienes un resumen neutral de lo que cada ficha pública dice que ofrece, con enlaces a ambas para que puedas verificarlo por tu cuenta antes de decidir.'
  ],
  faq: [
    {
      q: '¿Anicca sustituye directamente a I am - Daily Affirmations?',
      a: 'No exactamente. La ficha pública de I am pone el acento en los widgets y en los recordatorios a lo largo del día. La de Anicca pone el acento en una línea a tu hora y sin rachas. Si dudas, prueba la descarga gratuita de cada una.'
    },
    {
      q: '¿De dónde salen los datos de esta comparación?',
      a: 'De las páginas públicas de la App Store de ambas apps, leídas por quien hace Anicca. Aquí se omiten a propósito los recuentos de valoraciones y los precios en dinero, para que la página no invente cifras ni quede desactualizada.'
    },
    {
      q: '¿Hay una alternativa gratuita a I Am?',
      a: 'Tanto I am - Daily Affirmations como Anicca son gratis de descargar en la App Store, con planes de pago opcionales. Si sobre todo quieres menos notificaciones y nada de rachas, la descarga gratuita de Anicca envía una línea a la hora que elijas.'
    },
    {
      q: '¿Quién escribió esta página?',
      a: 'Quien hace Anicca. Se dice a propósito, para que lo sepas. Se incluyen enlaces a las dos fichas de la App Store para que puedas verificar todo de forma independiente.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'alternativa-a-thinkup',
  enSlug: 'thinkup-alternative',
  title: 'Alternativa a ThinkUp (2026): afirmaciones diarias sin grabar tu voz en iPhone',
  shortTitle: 'Alternativa a ThinkUp',
  metaDescription: 'Comparación neutral entre ThinkUp y Anicca basada solo en datos públicos de sus fichas de la App Store, con enlaces a ambas. Sin valoraciones, cifras ni precios inventados.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral y esta página tiene un conflicto de interés. Por eso, los datos de la competencia de abajo se limitan a su página pública de la App Store. No invento valoraciones, descargas ni precios.',
    'En la App Store, ThinkUp figura como ThinkUp-Daily Affirmations app, de Precise Wellness LLC. La gente busca alternativas cuando prefiere no grabar audio, no quiere un seguimiento de la práctica en la app de Salud o prefiere una sola línea que llega a su hora en lugar de una sesión de escuchar y repetir.',
    'Según su ficha pública, ThinkUp pone el acento en elegir o crear afirmaciones, grabarlas con tu propia voz, añadir imágenes y música, recibir notificaciones y escucharlas a diario, y también menciona el registro de minutos de atención plena en Apple Health. Figura como gratis con compras dentro de la app, y su ficha describe diferencias entre la versión gratuita y la de pago.',
    'Anicca, en cambio, pone el acento en recibir una línea breve y amable a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por un día perdido. Es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y disponible en español, pensada como compañera de autocuidado y no como consejo médico.',
    'Abre ambas fichas y decide a partir de las capturas y la descripción actuales. Ninguna de las dos apps sustituye la terapia ni la atención médica.'
  ],
  affirmations: [
    'Puedo elegir la herramienta que encaja con mi día.',
    'No necesito grabar mi voz para hablarme bien.',
    'Una línea que llega a su hora también cuenta.',
    'Puedo probar con calma y cambiar después.',
    'Mi rutina no necesita un marcador para contar.',
    'Menos pasos también puede ser cuidado.',
    'Puedo quedarme con el flujo más sencillo para mí.',
    'Comparar con calma es parte de cuidarme.',
    'No le debo una prueba larga a ninguna app.',
    'Puedo borrar lo que no encaje, sin culpa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para elegir entre ambas',
    steps: [
      'Abre los enlaces de la App Store de abajo. Lee con calma qué te pide hacer cada app a diario: grabar y escuchar, o recibir una línea.',
      'Si quieres tu propia voz con música en bucle, la ficha de ThinkUp describe ese enfoque. Si quieres una línea a tu hora y sin rachas, la ficha de Anicca describe ese otro enfoque.',
      'Descarga primero una versión gratuita. Cambia después si la fricción diaria no es la adecuada para ti.'
    ]
  },
  closing: 'Guías relacionadas: recordatorios de afirmaciones durante el día y alternativa a I Am (enlaces abajo), además de los enlaces a ambas fichas de la App Store para que verifiques por tu cuenta. Los detalles de la tienda pueden cambiar; vuelve a revisar las fichas actuales. Esta página es texto de autocuidado; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Alternativa a ThinkUp',
  directAnswer: [
    'Si buscas una alternativa a ThinkUp, puede que quieras afirmaciones diarias sin grabar tu propia voz, o un estilo de recordatorio más tranquilo en iPhone.',
    'ThinkUp-Daily Affirmations app, de Precise Wellness LLC, y Anicca son apps gratuitas de descargar con compras opcionales dentro de la app, y cada una pone el acento en un flujo distinto, según sus fichas públicas de la App Store.',
    'Abajo tienes un resumen neutral de lo que cada ficha pública dice que ofrece, con enlaces a ambas para que puedas verificarlo por tu cuenta antes de decidir.'
  ],
  faq: [
    {
      q: '¿Anicca me permite grabar afirmaciones con mi propia voz?',
      a: 'La ficha pública de Anicca pone el acento en las tarjetas de afirmaciones que recibes y en las líneas a tu hora, no en grabar una biblioteca con tu propia voz. La ficha de ThinkUp sí pone el acento en la grabación de voz. Elige según el flujo que quieras.'
    },
    {
      q: '¿De dónde salen los datos de esta comparación?',
      a: 'De las páginas públicas de la App Store de ambas apps, leídas por quien hace Anicca. Aquí se omiten a propósito los recuentos de valoraciones y los precios en dinero.'
    },
    {
      q: '¿Quién escribió esta página?',
      a: 'Quien hace Anicca. Se dice a propósito, para que lo sepas. Se incluyen enlaces a las dos fichas de la App Store para que puedas verificar todo de forma independiente.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la ansiedad o el ánimo bajo duran semanas o afectan tu vida diaria, habla con un médico o un terapeuta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'funcionan-las-afirmaciones-para-la-ansiedad',
  enSlug: 'do-affirmations-help-anxiety',
  title: '¿Funcionan las afirmaciones para la ansiedad? Una respuesta honesta (2026)',
  shortTitle: '¿Funcionan las afirmaciones para la ansiedad?',
  metaDescription: '¿Funcionan las afirmaciones para la ansiedad? Una respuesta honesta: qué pueden y qué no pueden hacer, qué frases suelen funcionar mejor y un ejercicio de dos minutos. De Anicca, app para iPhone gratis de descargar.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. La respuesta breve y honesta: las afirmaciones no son un tratamiento para la ansiedad y no harán que desaparezca. Para algunas personas son un hábito pequeño y tranquilizador que cambia lo que te dices en un momento de tensión.',
    'Lo que mejor parecen hacer es interrumpir un bucle. El pensamiento ansioso tiende a repetir la misma frase de peor escenario, y sustituirla por una frase más estable y creíble le da a tu mente otra cosa a la que agarrarse un momento. Es una pausa, no una cura.',
    'Las frases suelen funcionar mejor cuando puedes creértelas. “Estoy en calma total” suele sonar falso cuando no lo estás, y puede hacerte sentir peor. Frases modestas como “Puedo sentir ansiedad y aun así dar el siguiente paso” son más fáciles de aceptar porque no discuten con lo que sientes.',
    'También funcionan mejor junto a lo básico: respirar despacio, dormir, moverte y hablar con alguien de confianza. Si la ansiedad es frecuente o intensa, el apoyo profesional, como la terapia, es lo que tiene evidencia real detrás, y las afirmaciones son como mucho una compañía.',
    'Anicca es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas. Envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo sentir ansiedad y aun así dar el siguiente paso.',
    'Esta sensación es incómoda, y pasará.',
    'No tengo que creerme cada pensamiento preocupado.',
    'Solo necesito ocuparme de este momento, no de todo el día.',
    'Mi cuerpo intenta protegerme, y puedo calmarlo con una respiración.',
    'Ya he superado momentos de ansiedad antes.',
    'Puedo pedir ayuda cuando la necesito.',
    'No necesito estar en calma para estar bien.',
    'Una preocupación no es un hecho.',
    'Puedo ser amable conmigo ahora mismo.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para probarlo por tu cuenta',
    steps: [
      'Nombra la preocupación en una frase sencilla y nota mentalmente qué tan fuerte es la sensación en este momento.',
      'Suelta el aire despacio contando hasta seis, tres veces. Después lee una frase de la lista dos veces, despacio, eligiendo la que te resulte más creíble, no la más positiva.',
      'Nota de nuevo la sensación. Si no se movió, también está bien y es útil saberlo: prueba con otra frase, un paseo o hablar con alguien.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la ansiedad y afirmaciones para pensar demasiado (enlaces abajo). Si la ansiedad es frecuente, afecta tu sueño, tu trabajo o tu salud durante semanas, o viene con pánico o desesperanza, habla por favor con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: '¿Funcionan las afirmaciones para la ansiedad?',
  directAnswer: [
    'Si te preguntas si las afirmaciones ayudan con la ansiedad, la respuesta honesta es que no son un tratamiento para la ansiedad y no harán que desaparezca. Para algunas personas son un hábito pequeño y tranquilizador que cambia lo que te dices en un momento de tensión.',
    'Lo que mejor parecen hacer es interrumpir un bucle: el pensamiento ansioso tiende a repetir la misma frase de peor escenario, y sustituirla por una frase más estable y creíble le da a tu mente otra cosa a la que agarrarse un momento. Es una pausa, no una cura.',
    'Las frases suelen funcionar mejor cuando puedes creértelas y junto a lo básico: respirar despacio, dormir, moverte y hablar con alguien de confianza. Si la ansiedad es frecuente o intensa, busca apoyo profesional; las afirmaciones son como mucho una compañía.'
  ],
  faq: [
    {
      q: '¿Funcionan las afirmaciones para la ansiedad?',
      a: 'Las afirmaciones no son un tratamiento para la ansiedad y no harán que desaparezca. Para algunas personas son un hábito pequeño y tranquilizador que cambia lo que te dices en un momento de tensión. Lo que mejor parecen hacer es interrumpir un bucle, dándole a tu mente una frase más estable y creíble a la que agarrarse un momento. Es una pausa, no una cura.'
    },
    {
      q: '¿Qué afirmaciones son buenas para la ansiedad?',
      a: 'Frases creíbles de esta página, por ejemplo: “Puedo sentir ansiedad y aun así dar el siguiente paso.” “No tengo que creerme cada pensamiento preocupado.” “Una preocupación no es un hecho.” Las frases modestas son más fáciles de aceptar porque no discuten con lo que sientes.'
    },
    {
      q: '¿Cómo pruebo en dos minutos si las afirmaciones me ayudan con la ansiedad?',
      a: 'Prueba el ejercicio de dos minutos de esta página: nombra la preocupación en una frase sencilla y nota qué tan fuerte es la sensación. Suelta el aire despacio contando hasta seis, tres veces. Lee una frase de la lista dos veces, despacio, eligiendo la más creíble. Nota la sensación de nuevo; si no se movió, prueba con otra frase, un paseo o hablar con alguien.'
    },
    {
      q: '¿Qué app ayuda con afirmaciones para la ansiedad?',
      a: 'Anicca es una app para iPhone, gratis de descargar, con suscripción opcional y sin rachas, que envía una línea breve a la hora que elijas. Las frases de esta página puedes usarlas gratis, con o sin la app. Es una herramienta de autocuidado, no consejo médico ni un tratamiento.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-empezar-el-dia',
  enSlug: 'morning-affirmations',
  title: 'Afirmaciones para empezar el día (2026): frases tranquilas y una rutina de dos minutos',
  shortTitle: 'Afirmaciones para empezar el día',
  metaDescription: 'Las afirmaciones para empezar el día son frases cortas que te dices al despertar para marcar el tono. Aquí tienes frases tranquilas y creíbles, cuántas usar y una rutina de dos minutos antes de mirar el móvil. De Anicca, app para iPhone gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. La respuesta breve y honesta: una afirmación por la mañana no cambiará tu día por sí sola, y no es un tratamiento para el ánimo bajo ni para la ansiedad. Para algunas personas es una forma pequeña y estable de elegir la primera frase del día en lugar de dejar que la elija una notificación.',
    'Las mañanas importan porque lo primero que lees suele marcar el tono emocional. Revisar noticias o redes nada más despertar tiende a llevar la atención hacia la comparación y la urgencia. Una frase elegida, leída antes que el móvil, le da a tu mente un punto de partida más tranquilo.',
    'Las frases suelen funcionar mejor cuando puedes creértelas hoy. “Hoy va a ser perfecto” puede sonar falso en una mañana difícil. Frases modestas como “Puedo hacer la siguiente cosa pequeña” o “No tengo que sentirme lista o listo para empezar” no exigen un resultado, así que no hay nada que fallar.',
    'Menos es mejor. La mayoría recuerda unas pocas frases; una lista larguísima es fácil de leer y fácil de olvidar. Quédate con la que te llegue y vuelve a ella a mediodía, que es donde un recordatorio ayuda más que la fuerza de voluntad.',
    'Anicca es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas. Envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo afrontar hoy paso a paso.',
    'No tengo que sentirme lista o listo para empezar.',
    'Puedo hacer la siguiente cosa pequeña.',
    'Hoy no tiene que ser perfecto para ser bueno.',
    'Ya he superado mañanas difíciles antes.',
    'Puedo empezar despacio.',
    'Puedo elegir a dónde va mi atención primero.',
    'Una frase amable para mí es un buen comienzo.',
    'Puedo estar en calma y aun así hacer las cosas.',
    'Pase lo que pase hoy, puedo volver a mi respiración.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos por la mañana, antes de mirar el móvil',
    steps: [
      'Antes de abrir mensajes o noticias, siéntate, apoya los dos pies en el suelo y suelta el aire despacio contando hasta seis, tres veces.',
      'Lee la lista una vez y elige una frase que te resulte creíble hoy, no la más positiva. Dila despacio, en voz alta o en silencio, dos veces.',
      'Escribe esa frase en un papel o déjala como recordatorio de mediodía, para volver a encontrarla cuando el día se llene. Si deja de encajar, cámbiala por otra mañana.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la motivación cuando hay cansancio y afirmaciones para dormir (enlaces abajo). Si el ánimo bajo o la ansiedad hacen difíciles las mañanas durante semanas, o vienen con desesperanza, habla por favor con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para empezar el día: frases tranquilas y creíbles',
  directAnswer: [
    'Las afirmaciones para empezar el día son frases cortas, en primera persona y en presente, que te dices poco después de despertar, antes de que los mensajes y las noticias marquen el tono por ti.',
    'Las que suelen funcionar son tranquilas y creíbles, como “Puedo afrontar hoy paso a paso”, y no frases que discuten con lo que sientes. Elige unas pocas, di cada una despacio y vuelve a una de ellas más tarde en el día.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca, que es gratis de descargar para iPhone, sin rachas y con suscripción opcional.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para empezar el día?',
      a: 'Son frases cortas, en primera persona y en presente, que te dices poco después de despertar, antes de que los mensajes y las noticias marquen el tono. Las frases tranquilas y creíbles suelen funcionar mejor que las que discuten con lo que sientes.'
    },
    {
      q: '¿Qué afirmaciones son buenas para empezar el día?',
      a: 'Frases cortas y creíbles, por ejemplo: “Puedo afrontar hoy paso a paso.” “No tengo que sentirme lista o listo para empezar.” “Puedo hacer la siguiente cosa pequeña.” Elige unas pocas y di cada una despacio.'
    },
    {
      q: '¿Cómo uso las afirmaciones por la mañana en dos minutos?',
      a: 'Antes de mirar el móvil, siéntate con los pies en el suelo y suelta el aire despacio contando hasta seis, tres veces. Lee la lista, elige la frase más creíble hoy y dila despacio dos veces. Escríbela o déjala como recordatorio de mediodía para volver a ella.'
    },
    {
      q: '¿La app de afirmaciones Anicca es gratis?',
      a: 'Anicca es gratis de descargar en la App Store para iPhone, con suscripción opcional. Envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas, y está disponible en español.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-estres',
  enSlug: 'affirmations-for-stress',
  title: 'Afirmaciones para el estrés (2026): frases tranquilas y un respiro de dos minutos',
  shortTitle: 'Afirmaciones para el estrés',
  metaDescription: 'Las afirmaciones para el estrés son frases cortas y tranquilas que acompañas con una respiración lenta cuando la presión crece. Aquí tienes frases creíbles y un ejercicio breve de respiración. De Anicca, app para iPhone gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. La respuesta breve y honesta: una afirmación no arreglará una carga de trabajo pesada, las preocupaciones de dinero ni una conversación difícil, y no es un tratamiento para la ansiedad ni para la depresión. Lo que sí puede hacer es interrumpir el momento en que el estrés se convierte en una lista acelerada de todo a la vez.',
    'El estrés tiende a estrechar la atención. La mente salta entre cada tarea sin terminar y cada posible mal resultado, y el cuerpo sigue: mandíbula tensa, hombros subidos, respiración corta. Una frase breve, dicha despacio, le da a la atención un solo lugar donde posarse un momento.',
    'Las frases creíbles suelen ayudar más que las grandes. “Todo es perfecto” puede sonar falso en mitad de una fecha límite. Las frases que admiten la presión y aun así señalan un siguiente paso, como “Solo tengo que hacer la siguiente cosa”, no dejan nada con lo que discutir.',
    'Acompañar la frase con la salida del aire es la parte en la que coinciden la mayoría de las guías. Una exhalación más larga es una forma sencilla que mucha gente usa para ir más despacio, y decir la frase en esa exhalación une las palabras a algo que tu cuerpo ya está haciendo.',
    'Anicca es una app para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas. Envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Esto es mucho, y puedo afrontarlo pieza a pieza.',
    'Solo tengo que hacer la siguiente cosa.',
    'Esta sensación es fuerte ahora, y pasará.',
    'Puedo soltar lo que hoy no me toca controlar.',
    'Puedo elegir cómo respondo, aunque no pueda elegir lo que pasa.',
    'Soltar el aire despacio es algo real que puedo hacer ahora.',
    'Puedo pedir ayuda o más tiempo.',
    'Una tarea sin terminar no me convierte en un fracaso.',
    'Ya he superado días de estrés antes.',
    'Mi valor no se mide por cuánto haga hoy.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para respirar con una frase',
    steps: [
      'Baja los hombros y suelta la mandíbula. Toma aire por la nariz contando hasta cuatro.',
      'Suelta el aire despacio contando hasta seis y di una frase de la lista en tu mente durante esa exhalación. Repite tres veces.',
      'Escribe la única acción siguiente que puedas hacer en los próximos minutos, haz solo esa, y vuelve a la misma frase más tarde en el día.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la ansiedad y afirmaciones para el agotamiento (enlaces abajo). Si el estrés dura semanas, afecta tu sueño, tu apetito o tu salud, o viene con pánico o desesperanza, habla por favor con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el estrés: frases tranquilas y creíbles para días pesados',
  directAnswer: [
    'La respuesta breve: las afirmaciones para el estrés funcionan mejor como una pausa, no como un discurso de ánimo. Elige una frase tranquila y creíble, como “Esto es mucho, y puedo afrontarlo pieza a pieza”, y dila despacio en una exhalación larga.',
    'No eliminará la causa del estrés, pero puede darte unos segundos de espacio antes de decidir qué hacer después, en lugar de reaccionar desde la lista acelerada de todo a la vez.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca, que es gratis de descargar para iPhone, sin rachas y con suscripción opcional.'
  ],
  faq: [
    {
      q: '¿Qué afirmaciones son buenas para el estrés?',
      a: 'Frases tranquilas y creíbles que admiten la presión y señalan un siguiente paso, por ejemplo: “Esto es mucho, y puedo afrontarlo pieza a pieza.” “Solo tengo que hacer la siguiente cosa.” “Esta sensación es fuerte ahora, y pasará.”'
    },
    {
      q: '¿Las afirmaciones ayudan con el estrés?',
      a: 'No eliminarán la causa del estrés y no son un tratamiento. Usada como una pausa breve, acompañada de una exhalación lenta, una afirmación puede darte unos segundos de espacio antes de decidir qué hacer después.'
    },
    {
      q: '¿Cómo uso las afirmaciones para el estrés en dos minutos?',
      a: 'Toma aire contando hasta cuatro, suelta el aire contando hasta seis y di una frase despacio durante la exhalación. Repite tres veces y después haz una acción pequeña. A mucha gente le resulta más fácil recordar una frase usada a menudo que una lista larga leída una sola vez.'
    },
    {
      q: '¿La app de afirmaciones Anicca es gratis?',
      a: 'Anicca es gratis de descargar en la App Store para iPhone, con suscripción opcional. Envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas, y está disponible en español.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-confianza',
  enSlug: 'affirmations-for-confidence',
  title: 'Afirmaciones para la confianza (2026): frases tranquilas para confiar en ti',
  shortTitle: 'Afirmaciones para la confianza',
  metaDescription: 'Afirmaciones creíbles para la confianza, construidas sobre promesas pequeñas cumplidas en lugar de exageración, más un ejercicio de dos minutos para los momentos que te encogen. Frases gratis de Anicca, app para iPhone gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. La confianza rara vez desaparece de golpe. Se escapa en momentos pequeños: la reunión en la que ensayas una frase tres veces y nunca la dices, el mensaje que reescribes hasta que casi no dice nada, la oportunidad de la que te convences de salir antes de que nadie más pueda hacerlo. Debajo no suele haber falta de capacidad, sino el hábito de tratar tu propia voz como la menos fiable de la sala.',
    'Ayuda separar la confianza del volumen. La persona que más alto habla no es la más segura; a menudo es solo la que más ha practicado sonar segura. La confianza real es más tranquila: es el recuerdo de las veces en que tuviste miedo e hiciste la cosa igualmente, mal al principio, y sobreviviste. Ese recuerdo se construye, no se nace con él, y cada promesa pequeña cumplida es un depósito.',
    'Por eso las afirmaciones ruidosas suelen rebotar. Una frase grandilocuente puede sonar falsa un martes por la mañana, y tu mente discute con ella, lo que te deja menos segura o seguro que antes. Las frases que funcionan están más cerca del suelo: son concretas, creíbles y están atadas a evidencia que ya tienes. No intentas convertirte en otra persona; le recuerdas a la que ya eres lo que ya ha hecho.',
    'Las afirmaciones para la confianza funcionan mejor cuando suenan como una amiga tranquila y no como un discurso de ánimo. La confianza es, sobre todo, confianza en ti construida con promesas pequeñas cumplidas, así que las frases creíbles aterrizan mejor que las exageradas.',
    'Anicca es una app de afirmaciones para iPhone construida alrededor de esa idea. Envía una línea breve a la hora que elijas o cuando la necesitas, en lugar de pedirte que abras una biblioteca y te motives por tu cuenta. Es gratis de descargar en la App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Ya he superado cosas difíciles antes, y recuerdo cómo.',
    'Puedo estar nerviosa o nervioso y aun así empezar.',
    'Mi voz no necesita ser la más alta para contar.',
    'Confío en mí para resolver el siguiente paso, no toda la escalera.',
    'Una promesa pequeña cumplida es prueba de que puedo cumplir la siguiente.',
    'Puedo ocupar una cantidad normal de espacio.',
    'No saber todavía es una etapa, no un veredicto.',
    'Puedo decirlo con sencillez y dejar que eso baste.',
    'Mis intentos pasados cuentan como entrenamiento, no como fracaso.',
    'No necesito sentirme lista o listo para empezar.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para depositar confianza',
    steps: [
      'Escribe una cosa que hiciste en el último mes que fue difícil y que terminaste igualmente. Una línea, con palabras sencillas. Esta es tu evidencia, no un discurso de ánimo.',
      'Lee una afirmación de la lista despacio, dos veces. Si te parece demasiado grande, hazla más pequeña: una versión válida es “Estoy aprendiendo a confiar en mí con esto”.',
      'Elige el paso visible más pequeño hacia eso que estás evitando, como abrir el archivo, redactar la primera frase o reservar el hueco, y haz solo ese paso ahora.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la duda sobre ti y afirmaciones para el miedo a fallar (enlaces abajo). Si la falta de confianza está enredada con depresión o ansiedad que domina tus días, habla por favor con un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la confianza: frases tranquilas para confiar en ti',
  directAnswer: [
    'Las afirmaciones para la confianza funcionan mejor cuando suenan como una amiga tranquila, no como un discurso de ánimo. La confianza es, sobre todo, confianza construida con promesas pequeñas cumplidas.',
    'Por eso las frases creíbles, como “Ya he superado cosas difíciles antes”, aterrizan mejor que las exageradas: señalan evidencia que ya tienes en lugar de discutir con lo que sientes.',
    'Elige una frase, dila antes del momento que suele encogerte y después haz la cosa pequeña que esa frase señala. Puedes leer las frases de esta página gratis, con o sin la app.'
  ],
  faq: [
    {
      q: '¿Qué afirmaciones son buenas para la confianza?',
      a: 'Funcionan mejor las frases que señalan evidencia, por ejemplo: “Ya he superado cosas difíciles antes.” “Puedo estar nerviosa o nervioso y aun así empezar.” “Mi voz no necesita ser la más alta para contar.” Elige una que parezca casi verdad, no una que parezca un disfraz.'
    },
    {
      q: '¿Las afirmaciones construyen confianza de verdad?',
      a: 'Una frase por sí sola no construye confianza; las promesas cumplidas sí. Una afirmación ayuda eligiendo el pensamiento desde el que actúas. Di la frase y después haz la acción pequeña que señala. Esa acción se convierte en la evidencia sobre la que se apoya la siguiente frase.'
    },
    {
      q: '¿Cómo uso las afirmaciones para la confianza en dos minutos?',
      a: 'Nombra el momento que tienes delante en una frase sencilla. Lee una afirmación despacio, dos veces. Después decide el paso visible más pequeño que darás en ese momento, como hacer una pregunta o abrir el documento. Pequeño y hecho gana a grande e imaginado.'
    },
    {
      q: '¿La app de afirmaciones Anicca es gratis?',
      a: 'Anicca es gratis de descargar en la App Store para iPhone, con suscripción opcional. Envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas, y está disponible en español.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-exito',
  enSlug: 'affirmations-for-success',
  title: 'Afirmaciones para el éxito (2026): frases estables para quien hace el trabajo',
  shortTitle: 'Afirmaciones para el éxito',
  metaDescription: 'Afirmaciones estables para el éxito que se centran en el trabajo y no en el trofeo, más un ejercicio de dos minutos para empezar el día. Frases gratis de Anicca, app para iPhone gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. La mayoría busca afirmaciones para el éxito en un tipo concreto de día: el lanzamiento que fracasó, la solicitud que no llegó a ninguna parte, la colega o el colega que llegó antes. El éxito empieza a parecer una puerta que se abre para otras personas, y en esa mirada se pierde lo desigual que es el progreso real: tramos largos y planos, después un salto, después otro tramo plano. El tramo plano no es lo contrario del éxito; es la mayor parte de él.',
    'Las afirmaciones de resultado tienden a derrumbarse justo en esos días, porque la distancia entre la frase y la realidad es demasiado ancha para cruzarla. Lo que aguanta mejor es definir el éxito a la escala de hoy: la página escrita, la llamada hecha, la habilidad practicada con honestidad un rato. Esa definición no es una ambición más pequeña; es ambición con un asa por donde agarrarla.',
    'También hay una trampa más silenciosa: usar los tiempos de otras personas como tu cinta de medir. Su salto visible esconde sus años planos. Tu tramo plano, visto desde dentro, parece prueba de que vas por detrás. Una frase más estable, que te devuelve a tu propio trabajo y a tu propia definición de una vida que va bien, protege los años en los que todavía no parece que pase nada.',
    'Las afirmaciones para el éxito son más útiles cuando describen a quien trabaja, no el trofeo. Las frases que mantienen tu atención en la parte que controlas, el trabajo de hoy, aguantan mejor en los días normales, que es cuando el éxito se construye de verdad.',
    'Anicca es una app de afirmaciones para iPhone pensada para los tramos planos. Envía una línea breve a la hora que elijas o cuando la necesitas, para que el recordatorio llegue antes de empezar la jornada o justo después del correo desalentador, sin que tengas que ir a buscar motivación. Es gratis de descargar en la App Store, con suscripción opcional, sin rachas y disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Termino lo que empiezo, pieza pequeña a pieza pequeña.',
    'El progreso lento también es progreso que puedo conservar.',
    'Puedo querer más sin insultar lo que tengo.',
    'Mi ritmo puede ser distinto del de los demás.',
    'Una semana plana es parte del trabajo, no su final.',
    'Mido hoy por lo que hice, no por lo que llegó.',
    'Estoy construyendo algo que tarda lo que tarda.',
    'Una hora honesta gana a un plan perfecto que nunca empiezo.',
    'Los contratiempos son información, no identidad.',
    'Puedo descansar sin rendirme.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para empezar a trabajar',
    steps: [
      'Antes de abrir cualquier otra cosa, escribe el trabajo de hoy como una pieza pequeña que se pueda terminar: no el proyecto entero, sino redactar la primera parte. El éxito necesita un tamaño que tu día pueda sostener.',
      'Lee una afirmación de la lista despacio. Deja que marque el marco: estable, no frenético.',
      'Empieza esa pieza pequeña de inmediato y trabaja solo en ella durante el primer tramo. Cuando esté hecha, el día ya contiene una promesa cumplida, pase lo que pase después.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la confianza y afirmaciones para la motivación cuando hay cansancio (enlaces abajo). Esta página es texto de autocuidado para una app de afirmaciones. No promete ingresos, ascensos ni ningún resultado concreto; trata del marco desde el que trabajas mientras haces el trabajo. No es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el éxito: frases estables para quien hace el trabajo',
  directAnswer: [
    'Las afirmaciones para el éxito son más útiles cuando describen a quien trabaja, no el trofeo. Mantienen tu atención en la parte que controlas, el trabajo de hoy, en lugar de en resultados que llegan después y de forma desigual.',
    'Ninguna frase atrae resultados por sí sola. Lo que una buena frase sí puede hacer es marcar el marco en el que trabajas: con paciencia en lugar de frenesí, con estabilidad en lugar de comparación. El trabajo sigue teniendo que hacerse.',
    'Lee una frase antes de empezar y después haz la primera pieza pequeña. Puedes leer las frases de esta página gratis, con o sin la app Anicca, que es gratis de descargar para iPhone, sin rachas y con suscripción opcional.'
  ],
  faq: [
    {
      q: '¿Qué afirmaciones son buenas para el éxito?',
      a: 'Las frases de proceso ganan a las de resultado, por ejemplo: “Termino lo que empiezo, pieza pequeña a pieza pequeña.” “El progreso lento también es progreso que puedo conservar.” “Puedo querer más sin insultar lo que tengo.” Siguen siendo creíbles en los días normales, que es cuando el éxito se construye de verdad.'
    },
    {
      q: '¿Las afirmaciones atraen el éxito?',
      a: 'Ninguna frase atrae resultados por sí sola. Lo que una buena frase puede hacer es marcar el marco en el que trabajas: con paciencia en lugar de frenesí, con estabilidad en lugar de comparación. El trabajo sigue teniendo que hacerse; la afirmación solo te ayuda a empezarlo y a volver a él después de una semana plana.'
    },
    {
      q: '¿Cómo uso las afirmaciones para el éxito en dos minutos?',
      a: 'Únelas a un momento que ya existe: antes de abrir el portátil, después de un rechazo o al cerrar el día. Escribe el trabajo de hoy como una pieza pequeña, lee una frase despacio y empieza esa pieza de inmediato. Una frase, leída despacio, en el mismo momento cada día vale más que una lista larga leída una vez al mes.'
    },
    {
      q: '¿La app de afirmaciones Anicca es gratis?',
      a: 'Anicca es gratis de descargar en la App Store para iPhone, con suscripción opcional. Envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas, y está disponible en español.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-sanar',
  enSlug: 'affirmations-for-healing',
  title: 'Afirmaciones para sanar (2026): frases suaves para reparaciones lentas',
  shortTitle: 'Afirmaciones para sanar',
  metaDescription: 'Afirmaciones suaves para sanar, sin prisas y sin exigencias, y un ejercicio de dos minutos para los días pesados. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no sanan por orden ni son un tratamiento. A algunas personas una frase amable les ayuda a atravesar un día difícil con un poco menos de peso.',
    'Sanar tiene un problema de imagen: desde fuera se supone que debería parecer una escalera, primero mal, después mejor y al final bien. Desde dentro se parece más al tiempo que cambia. Puedes tener una buena semana y que después un olor, una canción o una silla vacía te deje sin fuerzas. Las personas cercanas preguntan, con buena intención, si ya te sientes más como antes, y la respuesta honesta es que te estás convirtiendo en alguien un poco distinto, a un ritmo que no elegiste.',
    'La parte más dura suele ser la segunda herida: el juicio sobre la primera. Frases como “ya debería haberlo superado” o “otras personas pasaron por cosas peores” convierten el dolor en una evaluación. Sanar se hace más lento cuando cada día malo se trata como prueba de que lo estás haciendo mal. No hay una velocidad incorrecta para esto. Solo está la velocidad a la que realmente va.',
    'Por eso, las afirmaciones para sanar no son mensajes de ánimo forzado. Son permisos. Una frase como “descansar forma parte de sanar, no es un retraso” no arregla nada; quita el peso extra de la culpa de un día que ya es pesado. Dicha despacio, en el momento en que empieza la espiral, una frase amable puede marcar la diferencia entre cargar con el día y, además, pelear contigo durante todo el día.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas, para que una frase más suave pueda llegar a ti sin que tengas que ir a buscarla. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'No tengo que haberlo superado ya.',
    'Descansar forma parte de sanar, no es un retraso.',
    'Un día difícil es una ola, no todo el mar.',
    'Puedo extrañar lo que fue y aun así construir lo que viene.',
    'Ir despacio también es una velocidad. Puedo sanar a la mía.',
    'Mi cuerpo y mi corazón están haciendo un trabajo silencioso que no veo.',
    'No necesito ganarme el descanso sufriendo primero lo suficiente.',
    'Está bien que esto todavía duela a veces.',
    'Puedo ser amable con la versión de mí que está sufriendo.',
    'Los pequeños momentos buenos también pueden entrar, incluso ahora.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para los días pesados',
    steps: [
      'Apoya una mano en un lugar que se sienta estable: el pecho, la mesa o tu otra mano. Nota el calor y el peso durante unas respiraciones. Le estás dando a tu cuerpo un dato sencillo: ahora, en este minuto, estás aquí.',
      'Lee una afirmación de la lista, despacio. Si una frase te trae lágrimas, eso no significa que el ejercicio esté fallando; déjalo ser información, no un problema que hay que arreglar.',
      'Elige la cosa amable más pequeña que puedas hacer en la próxima hora: agua, luz del día, un mensaje a una persona segura o acostarte sin una pantalla. Pequeño y hecho es toda la tarea.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para el duelo y afirmaciones para soltar (enlaces abajo, en inglés). Si estás sanando de un trauma, una enfermedad o una pérdida y el peso es más de lo que puedes cargar, busca ayuda de un médico, un terapeuta o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para sanar',
  directAnswer: [
    'Las afirmaciones para sanar nunca deberían apurarte. Sanar es lento y desigual, así que las frases que ayudan suenan a compañía, no a instrucciones, como por ejemplo: “No tengo que haberlo superado ya”.',
    'Lee una cuando el día se sienta más pesado de lo esperado y deja que lo pequeño y lo lento cuenten como un avance real. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para sanar?',
      a: 'Son frases cortas y suaves que acompañan un proceso lento de reparación, sin plazos ni exigencias. No sanan por orden ni son un tratamiento, pero a algunas personas una frase amable les ayuda a atravesar un día difícil con un poco menos de peso.'
    },
    {
      q: '¿Qué afirmaciones puedo leer para sanar?',
      a: 'Frases suaves que dan permiso, por ejemplo: “No tengo que haberlo superado ya.” “Descansar forma parte de sanar, no es un retraso.” “Puedo extrañar lo que fue y aun así construir lo que viene.” Evita las frases que exigen gratitud o un lado positivo antes de que estés lista o listo.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos en un día pesado?',
      a: 'Apoya una mano en un lugar que se sienta estable y nota el calor y el peso durante unas respiraciones. Lee una afirmación de la lista, despacio, y deja que las lágrimas, si vienen, sean información y no un problema. Elige la cosa amable más pequeña que puedas hacer en la próxima hora: agua, luz del día, un mensaje a una persona segura o acostarte sin una pantalla.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si lo que cargas incluye trauma, depresión o algo que no se siente seguro, un médico o un terapeuta es el paso adecuado.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-de-gratitud',
  enSlug: 'affirmations-for-gratitude',
  title: 'Afirmaciones de gratitud (2026): frases concretas para días ordinarios',
  shortTitle: 'Afirmaciones de gratitud',
  metaDescription: 'Afirmaciones de gratitud concretas para días ordinarios, sin positividad forzada, y un ejercicio de dos minutos para notar lo bueno. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento y no te obligan a sentirte agradecida o agradecido. A algunas personas una frase concreta les ayuda a notar una cosa real y buena de un día ordinario.',
    'La gratitud tiene un problema de imagen. A menudo se presenta como un estado en el que se supone que deberías vivir: radiante, agradecida y sin que nada te afecte. Eso la vuelve inútil justo en los días en que más la necesitas: los martes grises, las semanas en las que nada está mal exactamente, pero tampoco nada se siente como mucho. En esos días, “sé agradecida” suena a una orden de sentir otra cosa, y los sentimientos no aceptan órdenes.',
    'Lo que sí funciona es más pequeño: notar. La mente está hecha para buscar problemas, así que las partes buenas de un día ordinario —el tren que llegó a tiempo, la compañera que te cubrió, un rato de silencio— pasan sin quedar registradas. La práctica de la gratitud es, sobre todo, un hábito de registro. No estás fabricando un sentimiento; le estás dando a tu atención una cosa concreta y verdadera donde apoyarse antes de que vuelva la búsqueda de problemas.',
    'Por eso, la unidad creíble de la gratitud es una sola cosa, nombrada con sencillez. Una frase enorme sobre una vida abundante se resbala. En cambio, recordar que alguien te preparó un té hoy sin que lo pidieras se queda, porque se puede comprobar. Las afirmaciones de abajo están escritas a esa escala a propósito. Lee una y después busca la versión de hoy de esa frase. Buscarla es la práctica.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas; una frase por la mañana funciona bien para la gratitud, para que el acto de notar empiece antes que la búsqueda de problemas. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Algo de hoy fue bueno en silencio, y lo noté.',
    'Me han ayudado más veces de las que puedo contar.',
    'Los días ordinarios son la mayor parte de una vida, y los míos cuentan.',
    'Puedo agradecer a las personas mientras todavía tengo la oportunidad.',
    'Lo que ya tengo fue alguna vez lo que esperaba tener.',
    'Mis sentidos me traen pequeños regalos todo el día; puedo detenerme en uno.',
    'No necesito una vida perfecta para encontrar una cosa buena en esta.',
    'Las personas de mi vida no son el fondo. Son la historia.',
    'Lo suficiente es un lugar real, y lo visito más seguido de lo que creo.',
    'Hoy me dio algo. Lo estoy buscando a propósito.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para notar lo bueno',
    steps: [
      'Recorre hoy —o ayer, si hoy apenas empieza— en busca de una cosa buena y concreta. No una categoría, sino un momento: no “mi familia”, sino el instante en que alguien te envió algo sin que lo pidieras. Lo concreto es lo que lo hace real.',
      'Lee una afirmación de la lista, despacio, y une mentalmente tu momento a esa frase. Di el momento en voz alta si puedes; escucharlo hace que quede registrado con más fuerza.',
      'Si una persona forma parte de ese momento, considera decírselo hoy en un mensaje corto. La gratitud que se entrega suele volver en forma de conexión, y eso es material para mañana.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la mañana y afirmaciones de amor propio (enlaces abajo, en inglés). La gratitud no es un tratamiento para la depresión ni para el duelo, y una temporada difícil no es un fracaso de gratitud. Si el ánimo bajo continúa, habla con un médico o un terapeuta. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones de gratitud',
  directAnswer: [
    'Las afirmaciones de gratitud funcionan cuando nombran algo concreto y pequeño —el café que todavía estaba caliente, la amiga que respondió el mensaje— en lugar de anunciar que todo es maravilloso.',
    'Lee una despacio y deja que apunte a una cosa real de hoy. Lo concreto le gana a lo grandioso, siempre. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones de gratitud?',
      a: 'Son frases cortas que nombran algo concreto y pequeño de un día real, en lugar de anunciar que todo es maravilloso. No son un tratamiento, pero a algunas personas una frase verdadera les ayuda a notar una cosa buena antes de que vuelva la búsqueda de problemas.'
    },
    {
      q: '¿Qué afirmaciones de gratitud puedo leer?',
      a: 'Frases concretas, por ejemplo: “Algo de hoy fue bueno en silencio, y lo noté.” “Me han ayudado más veces de las que puedo contar.” “Los días ordinarios son la mayor parte de una vida, y los míos cuentan.” Si una frase no podría describir tu día real, hazla más pequeña hasta que pueda.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para notar lo bueno?',
      a: 'Recorre hoy en busca de una cosa buena y concreta, un momento y no una categoría. Lee una afirmación de la lista, despacio, y une mentalmente tu momento a esa frase, diciéndolo en voz alta si puedes. Si una persona forma parte de ese momento, considera decírselo hoy en un mensaje corto.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. La gratitud no es un tratamiento para la depresión ni para el duelo, y si el ánimo bajo continúa, habla con un médico o un terapeuta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-soltar',
  enSlug: 'affirmations-for-letting-go',
  title: 'Afirmaciones para soltar (2026): frases para aflojar lo que pesa',
  shortTitle: 'Afirmaciones para soltar',
  metaDescription: 'Afirmaciones tranquilas para soltar errores, finales y opiniones ajenas, y un ejercicio de dos minutos para soltar. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no borran el pasado ni son un tratamiento. A algunas personas una frase creíble les ayuda a aflojar, durante esta hora, algo que no pueden cambiar.',
    'Aferrarse rara vez se siente como una elección. Se siente como si el momento simplemente no se fuera: la conversación que repites en la ducha, la decisión que vuelves a juzgar en tu cabeza de madrugada, la versión de los hechos en la que dijiste lo más inteligente. Debajo de esa repetición suele haber una esperanza: si lo examino una vez más, quizá cambie, o quizá por fin estaré lista o listo si vuelve a pasar. El examen nunca entrega ninguna de las dos cosas. Solo mantiene la herida en tu horario en lugar de dejarla en el de la vida.',
    'Algunos agarres son de amor, no de control. Soltar a una persona, un lugar o una versión anterior de tu vida puede sentirse como una traición, como si soltarlo significara que no importó. Sí importó. Soltar no es una declaración sobre el pasado; es una decisión sobre dónde puede vivir tu atención ahora. Puedes honrar algo por completo y aun así dejar de cargarlo a cada cuarto al que entras.',
    'Una afirmación no puede abrirte los dedos a la fuerza, y no debería intentarlo. Lo que hace una buena frase es darle a ese aflojar una oración: un recordatorio pequeño y repetible de que soltar está permitido, de que no es aprobar lo que pasó y de que esta hora puede vivirse en el presente. Usada en el momento en que empieza la repetición, se vuelve una bifurcación que tu mente aprende a reconocer.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas; muchas personas eligen las horas en que suele empezar la repetición, como el trayecto al trabajo o la última hora antes de dormir. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo aprender de esto sin vivir dentro de esto.',
    'Lo que no puedo controlar, practico soltarlo.',
    'Soltar no es decir que estuvo bien.',
    'Puedo honrar lo que fue y aun así elegir lo que es.',
    'Mis manos tienen permiso de abrirse.',
    'Repetirlo no me protegerá. Descansar quizá sí.',
    'Suelto la versión de la historia en la que soy castigada o castigado para siempre.',
    'Las opiniones de otras personas son suyas para cargarlas.',
    'Este capítulo puede terminar sin que yo firme el permiso con enojo.',
    'Tengo permiso de viajar más ligera o más ligero desde aquí.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para soltar',
    steps: [
      'Nombra aquello a lo que te aferras en una frase sencilla, escrita si es posible, por ejemplo el comentario que sigues repitiendo desde hace días. Las frases sencillas son más pequeñas que las espirales.',
      'Pregúntate qué te corresponde hacer hoy al respecto. Si hay una acción real, escríbela y prográmala. Si no la hay, escribe que ya no te corresponde nada más y deja que esa frase se sostenga.',
      'Lee una afirmación despacio y después haz algo con las manos durante un rato: lavar una taza, doblar ropa o salir un momento. Dale a tu atención una dirección en tiempo presente.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para el perdón y afirmaciones para sanar (enlaces abajo, en inglés). Si lo que cargas incluye un trauma o te impide dormir o trabajar, habla con un médico o un terapeuta. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para soltar',
  directAnswer: [
    'Las afirmaciones para soltar ayudan cuando tu mente vuelve una y otra vez a algo que no puedes cambiar: un error, un final o la opinión de otra persona.',
    'Una frase creíble como “Puedo aprender de esto sin vivir dentro de esto” no borra el pasado; afloja tu agarre durante esta hora. Lee una y después pon las manos y la atención en algo del presente. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para soltar?',
      a: 'Son frases cortas que separan aprender de vivir en el pasado y que dan permiso para aflojar un agarre, sin aprobar lo que pasó. No borran el pasado ni son un tratamiento, pero pueden ayudar a pasar esta hora en el presente.'
    },
    {
      q: '¿Qué afirmaciones puedo leer para soltar?',
      a: 'Frases que separan aprender de vivir en el pasado, por ejemplo: “Puedo aprender de esto sin vivir dentro de esto.” “Lo que no puedo controlar, practico soltarlo.” “Soltar no es decir que estuvo bien.” Esto último importa: soltar no es aprobar lo que pasó.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para soltar?',
      a: 'Nombra aquello a lo que te aferras en una frase sencilla, escrita si es posible. Pregúntate qué te corresponde hacer hoy: si hay una acción real, escríbela y prográmala, y si no la hay, deja escrito que ya no te corresponde nada más. Lee una afirmación despacio y haz algo con las manos durante un rato.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si lo que cargas incluye un trauma o te impide dormir o trabajar, habla con un médico o un terapeuta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-perdon',
  enSlug: 'affirmations-for-forgiveness',
  title: 'Afirmaciones para el perdón (2026): soltar sin excusar',
  shortTitle: 'Afirmaciones para el perdón',
  metaDescription: 'Afirmaciones honestas para el perdón, hacia otras personas y hacia ti, sin pedirte que digas que estuvo bien, y un ejercicio de dos minutos. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no obligan a perdonar ni son un tratamiento. A algunas personas una frase honesta les ayuda a empezar, al tamaño de hoy, a soltar un peso que siguen cargando.',
    'El perdón tiene mala fama porque suele presentarse como un regalo que le debes a la persona que te lastimó, idealmente rápido e idealmente con un abrazo. No es raro que la gente se resista. La versión que vale la pena es otra: el perdón como algo que haces por tus propias manos. La herida ocurrió una vez, o durante una temporada. La repetición —la discusión que vuelve en la ducha, la frase que ojalá hubieras dicho— puede ocurrir muchas veces, y cada repetición te vuelve a cobrar.',
    'También ayuda saber lo que el perdón no es. No es excusar, no es olvidar, no es reconciliarse y no es una fecha límite. No tienes que estar lista o listo, y no tienes que hacerlo de una sola pieza. Algunas personas perdonan y mantienen el límite para siempre. Otras perdonan por capas, con el tiempo. Ambas formas cuentan. Lo primero que cambia suele ser pequeño: el recuerdo visita y se lleva un poco menos del día.',
    'La versión dirigida a ti es un trabajo propio. Perdonarte pide dos cosas que se sienten opuestas: honestidad completa sobre lo que hiciste y negarte a convertirlo en toda tu identidad. Repara lo que se pueda reparar. Pide perdón donde todavía sea posible y bienvenido. Después practica la frase que separa el acto de la persona, porque tendrás que vivir con esta persona, contigo, el resto de la historia.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas, para que una frase más suave pueda llegar a la hora en que suele empezar la repetición. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Puedo dejar este peso sin llamarlo liviano.',
    'Perdonar es algo que hago por mis propias manos.',
    'No tengo que terminar de perdonar hoy.',
    'Puedo dejar de ensayar la herida y aun así recordar la lección.',
    'Lo que hicieron fue real. También lo es mi decisión de viajar más ligera o más ligero.',
    'Soy una persona que hizo algo dañino, no una persona dañina.',
    'La reparación que pueda hacer, la haré. El resto, practico soltarlo.',
    'Mis límites y mi perdón pueden existir al mismo tiempo.',
    'Suelto la deuda sin llamarla pagada.',
    'La paz tiene permiso de llegar por capas.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para desengancharte',
    steps: [
      'Escribe la herida en una frase sencilla y después escribe una frase sobre lo que todavía te cuesta cada semana: sueño, atención o una relación. Ver el precio continuo, con claridad, suele hacer que soltar se sienta práctico y no solo noble.',
      'Lee una afirmación de la lista, despacio. Si decir “perdono” es demasiado grande hoy, usa la versión más pequeña y verdadera: estás practicando dejar esto a un lado.',
      'Si una reparación es posible y bienvenida —una disculpa, devolver algo o un mensaje claro de límites—, escribe ahora su primera línea. Si no lo es, cierra el cuaderno y haz una cosa ordinaria y amable por ti.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para soltar y afirmaciones para la culpa hacia ti (enlaces abajo, en inglés). Si lo que pasó incluye abuso o trauma, el perdón nunca es una obligación, y un terapeuta puede ayudarte a decidir cómo se ve sanar en tus propios términos. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para el perdón',
  directAnswer: [
    'Las afirmaciones para el perdón funcionan cuando son honestas sobre lo que el perdón es: desengancharte de una deuda que te sigue cobrando. No es excusar lo que pasó y no es una fecha límite.',
    'Una frase como “Puedo dejar este peso sin llamarlo liviano” te permite empezar al tamaño de hoy. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el perdón?',
      a: 'Son frases cortas y honestas para desengancharte de una herida que sigues ensayando, sin excusar lo que pasó y sin imponerte una fecha límite. No obligan a perdonar ni son un tratamiento, pero pueden ayudar a empezar al tamaño de hoy.'
    },
    {
      q: '¿Qué afirmaciones puedo leer para el perdón?',
      a: 'Frases honestas, por ejemplo: “Puedo dejar este peso sin llamarlo liviano.” “Perdonar es algo que hago por mis propias manos.” “No tengo que terminar de perdonar hoy; solo tengo que dejar de ensayar la herida.” Evita las frases que fingen que no dolió; tu mente las rechazará, con razón.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para desengancharme?',
      a: 'Escribe la herida en una frase sencilla y una frase sobre lo que todavía te cuesta cada semana. Lee una afirmación despacio y, si decir que perdonas es demasiado grande hoy, usa la versión más pequeña y verdadera de que estás practicando soltarlo. Si una reparación es posible y bienvenida, escribe ahora su primera línea; si no lo es, haz una cosa ordinaria y amable por ti.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si lo que pasó incluye abuso o trauma, el perdón nunca es una obligación, y un terapeuta puede ayudarte en tus propios términos.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-nuevos-comienzos',
  enSlug: 'affirmations-for-new-beginnings',
  title: 'Afirmaciones para nuevos comienzos (2026): frases de primer paso para empezar de nuevo',
  shortTitle: 'Afirmaciones para nuevos comienzos',
  metaDescription: 'Afirmaciones de primer paso para nuevos comienzos: un trabajo nuevo, una mudanza o un nuevo capítulo, y un ejercicio de dos minutos. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento y no eliminan los nervios de empezar. A algunas personas una frase pequeña y valiente les ayuda a dar el primer paso concreto de una mañana.',
    'Los comienzos suelen fotografiarse en el momento equivocado. Imaginamos la versión segura —llaves nuevas en la mano, escritorio nuevo, ciudad nueva— y saltamos la textura real de empezar: no saber dónde están las cosas, ser la persona con menos experiencia en el cuarto, extrañar la rutina anterior incluso cuando esa rutina era el problema. Casi todo comienzo real contiene algo de duelo por lo que reemplazó. Esa mezcla no es una señal de alarma. Es la receta habitual.',
    'La ilusión del tamaño lo hace más difícil. Desde la puerta, se ve todo el capítulo a la vez —todo el trabajo, toda la recuperación, toda la carrera— y todo el capítulo es demasiado grande para empezarlo. En realidad, nadie empieza un capítulo. Se empieza una mañana dentro de él: un formulario llenado, una presentación hecha, una caja desempacada. Las personas que empiezan de nuevo y les va bien son, en su mayoría, personas que se volvieron buenas en las primeras cosas pequeñas, repetidas.',
    'Por eso, una afirmación para un comienzo debería ser pequeña y un poco valiente, no triunfal. Debería darte permiso de ser principiante, recordarte que los capítulos anteriores no se borran y apuntar a la siguiente acción física. Leída en la puerta —literalmente, antes del primer paso de lo nuevo— se vuelve parte del ritual que te ayuda a cruzar el umbral en los días inestables.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas; puedes ponerla para el momento justo antes de que empiece la rutina nueva. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Solo tengo que hacer la primera cosa pequeña.',
    'Las personas principiantes tienen permiso de hacerlo mal durante un tiempo.',
    'Un capítulo nuevo no exige borrar los anteriores.',
    'Puedo estar nerviosa o nervioso y aun así entrar.',
    'No saber todavía es la primera etapa correcta.',
    'Ya empecé desde cero antes. Sé cómo va esto.',
    'Este comienzo tiene permiso de ser imperfecto y aun así real.',
    'Dejaré que las primeras semanas sean práctica, no un veredicto.',
    'Lo que estoy dejando me enseñó algo que puedo conservar.',
    'Hoy soy una persona que empieza.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos en la puerta',
    steps: [
      'Nombra el comienzo en una frase sencilla: estás empezando un trabajo nuevo, viviendo en una ciudad nueva o empezando de nuevo después de un final. Nombrarlo con sencillez lo vuelve un hecho, no una niebla.',
      'Lee una afirmación de la lista, despacio, justo antes de la primera acción de la rutina nueva. La misma frase, en el mismo momento, durante las primeras semanas si puedes.',
      'Elige la primera cosa pequeña —una presentación, un formulario o un estante ordenado— y hazla ahora. Los comienzos se construyen con primeras cosas pequeñas, apiladas.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la mañana y afirmaciones para soltar (enlaces abajo, en inglés). Si tu nuevo comienzo viene después de una pérdida y el duelo es el clima más grande, la guía de afirmaciones para el duelo puede ajustarse mejor. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para nuevos comienzos',
  directAnswer: [
    'Las afirmaciones para nuevos comienzos ayudan más cuando hacen más pequeño el arranque. Un trabajo, una ciudad, una rutina o un capítulo nuevos se sienten enormes desde la puerta; una frase creíble como “Solo tengo que hacer la primera cosa pequeña” lo vuelve a convertir en una mañana.',
    'Lee una y después haz la primera cosa pequeña antes de que el día se vuelva ruidoso. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para nuevos comienzos?',
      a: 'Son frases cortas de primer paso para empezar algo nuevo, escritas para respetar los nervios en lugar de discutir con ellos. No eliminan la inseguridad ni son un tratamiento, pero pueden ayudar a convertir un capítulo enorme en una mañana concreta.'
    },
    {
      q: '¿Qué afirmaciones puedo leer para un nuevo comienzo?',
      a: 'Frases de primer paso, por ejemplo: “Solo tengo que hacer la primera cosa pequeña.” “Las personas principiantes tienen permiso de hacerlo mal durante un tiempo.” “Un capítulo nuevo no exige borrar los anteriores.” Respetan los nervios en lugar de discutir con ellos.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos en la puerta?',
      a: 'Nombra el comienzo en una frase sencilla, para volverlo un hecho y no una niebla. Lee una afirmación despacio, justo antes de la primera acción de la rutina nueva, usando la misma frase en el mismo momento durante las primeras semanas si puedes. Elige la primera cosa pequeña y hazla ahora.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si tu nuevo comienzo viene después de una pérdida y el duelo pesa más, busca el apoyo de un médico o un terapeuta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-mujeres',
  enSlug: 'affirmations-for-women',
  title: 'Afirmaciones para mujeres (2026): frases para los días en que cargas mucho',
  shortTitle: 'Afirmaciones para mujeres',
  metaDescription: 'Afirmaciones honestas para mujeres sobre el descanso, los límites y ser más que tu utilidad, y un ejercicio de dos minutos en una transición. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento y no quitan la carga real de un día. A algunas personas una frase que nombra esa carga les ayuda a darse un permiso concreto dentro de ella.',
    'Muchas mujeres llevan un segundo trabajo invisible: recordar los cumpleaños, notar que la nevera está vacía, seguir quién está pasando por un mal momento y quién necesita una llamada, mantener regulado el clima emocional de una casa o de un equipo. El trabajo es real, requiere habilidad y casi nunca aparece escrito en ninguna parte. Cuando sale bien, parece que no pasó nada. Esa invisibilidad agota de una manera particular: estás cansada de un trabajo que otras personas experimentan como que las cosas simplemente salen bien.',
    'Encima de eso hay un entrenamiento que muchas mujeres absorbieron temprano: sé amable, sé fácil, no crees incomodidad. Así, el descanso se pospone hasta que todo esté terminado —y todo nunca está terminado— y decir que no llega envuelto en una disculpa y una explicación. La positividad genérica no toca nada de esto. Lo que sí lo toca es el permiso, dicho con claridad, en frases que suenan escritas por alguien que vio tu día real.',
    'Las afirmaciones de abajo están escritas para ese día. Hablan de un descanso que no necesita ganarse, de necesidades que no son interrupciones y de una persona que no se mide por su utilidad. Lee una en una transición —el café, el trayecto, el momento de cerrar la computadora— y deja que marque la frontera entre cargar cosas y ser una persona.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas, para que la frase pueda llegar justo en esa transición sin que tengas que recordarla ni ir a buscarla. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'El descanso no es algo que me gano terminando todo.',
    'Mis necesidades no son una interrupción de mi vida; son parte de ella.',
    'Puedo ser amable sin estar disponible sin fin.',
    'Tengo permiso de ser una persona, no solo una función.',
    'Decir que no con claridad no es ser poco amable.',
    'El trabajo invisible que hago es trabajo real, y puedo soltar una parte.',
    'No tengo que ser fácil para merecer amor.',
    'Mi cuerpo no es una disculpa.',
    'Puedo querer cosas para mí sin convocar una reunión.',
    'Estar cansada es información, no un defecto de carácter.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos en una transición',
    steps: [
      'Elige una transición diaria: el primer café, el trayecto, cerrar la computadora o volver de llevar a las niñas y los niños a la escuela. Ese momento ahora es la frontera: antes, cargar cosas; después, dos minutos que son tuyos.',
      'En la frontera, lee una afirmación de la lista, despacio. Deja que sea sobre permiso, no sobre productividad: no te estás preparando para rendir más, estás soltando algo.',
      'Usa ese rato para una cosa pequeña que sea solo para ti: salir un momento, sentarte con la bebida mientras todavía está caliente o escuchar una canción con los ojos cerrados. Lo pequeño y diario le gana a lo raro y elaborado.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones de amor propio y afirmaciones para el agotamiento (enlaces abajo, en inglés). Si la carga que llevas incluye depresión, ansiedad o una situación que no es segura, busca ayuda de una profesional o un profesional, o de una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para mujeres',
  directAnswer: [
    'Las afirmaciones para mujeres funcionan mejor cuando responden a la presión real: ser la madre por defecto, la compañera confiable, la que recuerda todo, y aun así sentirse culpable por descansar.',
    'Una frase creíble como “El descanso no es algo que me gano terminando todo” habla de eso directamente. Lee una en el momento en que suele empezar la culpa. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para mujeres?',
      a: 'Son frases cortas que responden a la presión real de cargar mucho —la carga mental, el trabajo invisible y la culpa por descansar— con un permiso concreto dentro de esa situación. No son un tratamiento, pero pueden sonar menos a un póster y más a una amiga que vio tu día real.'
    },
    {
      q: '¿Qué afirmaciones puedo leer como mujer?',
      a: 'Frases que responden a la presión real, por ejemplo: “El descanso no es algo que me gano terminando todo.” “Mis necesidades no son una interrupción de mi vida; son parte de ella.” “Puedo ser amable sin estar disponible sin fin.” La prueba es si podrías decírsela a tu amiga más cercana y decirla en serio.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos en una transición?',
      a: 'Elige una transición diaria, como el primer café, el trayecto o cerrar la computadora, y trátala como una frontera. En la frontera, lee una afirmación despacio y deja que sea sobre permiso, no sobre productividad. Usa ese rato para una cosa pequeña que sea solo para ti, como salir un momento o sentarte con la bebida mientras todavía está caliente.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la carga incluye depresión, ansiedad o una situación que no es segura, busca ayuda de una profesional o un profesional, o de una línea de ayuda de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-yo-soy',
  enSlug: 'i-am-affirmations',
  title: 'Afirmaciones yo soy (2026): frases creíbles y cómo escribir las tuyas',
  shortTitle: 'Afirmaciones yo soy',
  metaDescription: 'Afirmaciones yo soy creíbles y un método sencillo para escribir las tuyas sin que se sientan falsas, con un ejercicio de dos minutos. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento y una frase enorme que no te crees no ayudará por repetirla. A algunas personas una frase yo soy pequeña, casi verdadera, les ayuda a reunir pruebas a su favor durante el día.',
    '“Yo soy” es el marco gramatical más fuerte que puede tomar una frase sobre ti. “Me siento atrasada” describe el clima; “soy una persona atrasada” describe una identidad, y las frases de identidad son las que guían el comportamiento en silencio, porque actuamos para ser coherentes con quien creemos ser. Esa es toda la oportunidad y todo el riesgo de las afirmaciones yo soy: el marco es poderoso en ambas direcciones, y la mayoría de las personas ya repite frases yo soy poderosas todo el día. Solo que son negativas y llevan años repitiéndose.',
    'El error habitual es exagerar. Alguien cuya frase honesta hoy es “soy un desastre” intenta instalar una frase radiante de paz completa, y la mente rechaza la descarga. La frase tiene que vivir a la vista de tus pruebas actuales. Las palabras puente hacen ese trabajo: aprendiendo, volviéndome, practicando, en camino. “Estoy aprendiendo a descansar sin culpa” es una frase dentro de la cual una persona real puede estar hoy, y estar dentro de ella cambia lo que haces después, lo que cambia las pruebas, lo que permite que la frase crezca.',
    'La otra regla es la concreción en el comportamiento. Las frases yo soy que cambian días están unidas a cosas que puedes verte hacer: terminar cosas pequeñas, decir la verdad con amabilidad, volver después de una pausa. La identidad construida sobre el comportamiento es estable porque el día sigue aportando pruebas. Elige una frase de abajo —o escribe la tuya con el método del ejercicio— y dale unas semanas de pruebas pequeñas.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas, para que tu frase pueda llegar en el momento en que sueles olvidarla: la mañana, el trayecto o la hora en que aparece la crítica interna. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Estoy aprendiendo a confiar en mí.',
    'Soy suficiente tal como soy, y sigo creciendo.',
    'Soy una persona que termina cosas pequeñas.',
    'Tengo permiso de ocupar una cantidad normal de espacio.',
    'Me estoy volviendo más tranquila o más tranquilo, un día ordinario a la vez.',
    'No estoy atrasada ni atrasado; estoy en mi propio camino.',
    'Merezco descansar antes de quedar vacía o vacío.',
    'Soy el tipo de persona que vuelve después de una pausa.',
    'Soy más que lo peor que hice o que sobreviví.',
    'Estoy aquí, y aquí es un lugar viable para empezar.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para escribir la tuya',
    steps: [
      'Escribe la frase yo soy que tu mente ya repite, tal como suena, como la idea de estar siempre atrasada o de ser demasiado. Verla en papel la convierte en una frase en lugar de un hecho.',
      'Respóndela a la misma escala con una palabra puente: estás aprendiendo a hacer lo siguiente, eres una persona que puede pedir menos carga o estás practicando terminar cosas pequeñas. Casi verdadera es el objetivo.',
      'Di tu frase nueva despacio, dos veces. Después haz una acción diminuta que la vuelva un poco más verdadera hoy: terminar una cosa pequeña, descansar un rato sin ganártelo o enviar ese mensaje. Las pruebas son el abono.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones de amor propio y afirmaciones de valor propio (enlaces abajo, en inglés). Si tus frases yo soy actuales están enredadas con depresión o trauma, un terapeuta puede ayudarte a reescribirlas a un ritmo que se sostenga. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones yo soy',
  directAnswer: [
    'Las afirmaciones yo soy son frases cortas de identidad —como “estoy aprendiendo” o “soy suficiente tal como soy”— que funcionan cuando son creíbles y honestas en tiempo presente.',
    'El truco es el tamaño: una frase en proceso, como estar volviéndote más tranquila o más tranquilo, llega donde una frase de calma perfecta provoca discusión interna. Elige una frase que se sienta casi verdadera, dila despacio y deja que tu día reúna las pruebas. No son un tratamiento ni sustituyen el apoyo profesional.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones yo soy?',
      a: 'Son frases cortas de identidad en tiempo presente que funcionan cuando son creíbles, como estar aprendiendo a confiar en ti. No son un tratamiento, y una frase demasiado lejana de tus pruebas actuales se sentirá falsa; por eso conviene hacerla casi verdadera.'
    },
    {
      q: '¿Qué afirmaciones yo soy puedo leer?',
      a: 'Las creíbles, por ejemplo: “Estoy aprendiendo a confiar en mí.” “Soy suficiente tal como soy, y sigo creciendo.” “Soy una persona que termina cosas pequeñas.” Las frases con una palabra puente pequeña —aprendiendo, volviéndome, practicando— resisten mucho mejor un día real que las absolutas.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para escribir la mía?',
      a: 'Escribe la frase yo soy que tu mente ya repite, tal como suena, y respóndela a la misma escala con una palabra puente, buscando que sea casi verdadera. Di tu frase nueva despacio, dos veces. Haz una acción diminuta que la vuelva un poco más verdadera hoy, como terminar una cosa pequeña o descansar un rato sin ganártelo.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si tus frases yo soy actuales están enredadas con depresión o trauma, un terapeuta puede ayudarte a reescribirlas a un ritmo que se sostenga.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-duelo',
  enSlug: 'affirmations-for-grief',
  title: 'Afirmaciones para el duelo (2026): frases suaves sin ningún plazo',
  shortTitle: 'Afirmaciones para el duelo',
  metaDescription: 'Afirmaciones suaves para el duelo, sin plazos y sin lados positivos forzados, y un ejercicio de dos minutos para los días de ola. Anicca es una app de afirmaciones para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no son un tratamiento para el duelo y esta página no sustituye el apoyo profesional. Si el duelo te supera, te da miedo lo que sientes o te cuesta dormir, comer o funcionar durante un tiempo largo, habla con un médico o un terapeuta cuanto antes; pedir esa ayuda es parte de cuidarte, no un paso extra. Dicho esto, a algunas personas una frase suave les hace compañía en un día difícil.',
    'El duelo es la estructura de precio del amor, y nadie en su sano juicio rechazaría el amor para evitar el precio. Pero saberlo no hace soportable el supermercado cuando suena su canción favorita, ni la primera fiesta, ni el martes ordinario en que buscas el teléfono para contarle algo antes de recordar. El duelo vive en el cuerpo y en la logística: la silla vacía, el chiste sin compartir, el formulario que pide un contacto de emergencia.',
    'Las personas bienintencionadas te entregarán plazos —el primer año es el más duro, para la primavera te sentirás mejor— sobre todo porque tu dolor las hace sentirse impotentes y un plazo hace que se sienta manejable. No hay ningún plazo. Hay olas, que en general se hacen más pequeñas y más espaciadas, y aniversarios, que no consultan tu progreso. Quien te diga que ya deberías estar más adelante está describiendo su incomodidad, no tu duelo.',
    'Por eso, las afirmaciones de aquí hacen un solo tipo de promesa: compañía. No interpretarán tu pérdida, no la llamarán una lección y no te apurarán hacia la gratitud. Dicen que el día puede sobrevivirse por horas, que el amor y la pérdida pueden cargarse al mismo tiempo y que la persona a la que lloras no se honra con tu castigo. Y si en algún momento el peso es demasiado, vuelve a la primera idea de esta página: un médico, un terapeuta o una línea de ayuda de tu zona pueden acompañarte de una forma que una página no puede.',
    'Anicca es una app para iPhone que envía una línea breve a la hora que elijas, o cuando la necesitas; algunas personas la ponen para la hora en que la casa se queda en silencio, para que en los días en que no puedes ir a buscar consuelo, una frase amable pueda venir a ti. Es de descarga gratuita en App Store, con suscripción opcional, no tiene rachas y está disponible en español. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'No hay ningún plazo para esto.',
    'Puedo cargar amor y pérdida al mismo tiempo.',
    'Hoy solo tengo que hacer hoy.',
    'Una ola es una ola. Pasará a través de mí, no se quedará para siempre.',
    'Extrañar es una forma de amar, no un problema que hay que arreglar.',
    'He sobrevivido todos los días difíciles hasta ahora, incluido el peor.',
    'Descansar está permitido, incluso en duelo. Sobre todo en duelo.',
    'No tengo que ser fuerte en la forma en que la gente lo dice.',
    'Su amor sigue siendo parte de mi vida, en una forma distinta.',
    'Puedo dejar entrar un pequeño momento bueno sin traicionar a nadie.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para los días de ola',
    steps: [
      'Cuando llegue una ola, nómbrala con sencillez: esto es una ola de duelo. Nombrarla te separa un poco de ella; eres la orilla, no solo el agua.',
      'Lee una afirmación de la lista, despacio. Si vienen lágrimas, déjalas; llorar es el cuerpo haciendo el duelo correctamente, no un retroceso.',
      'Haz solo la siguiente cosa física: un vaso de agua, algo pequeño de comer o salir un minuto a tomar aire. En los días de ola, el cuidado se mide en vasos de agua, no en grandes avances.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para sanar y afirmaciones para soltar (enlaces abajo, en inglés). Si el duelo viene acompañado de sentimientos que te asustan, o no puedes dormir, comer o funcionar durante un tiempo largo, busca ayuda de un médico, un terapeuta especializado en duelo o una línea de ayuda de tu zona. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no sustituye el apoyo profesional.',
  h1: 'Afirmaciones para el duelo',
  directAnswer: [
    'Las afirmaciones para el duelo nunca deberían incluir un plazo ni un lado positivo forzado. Las frases que ayudan son compañía para el día tal como es, como “No hay ningún plazo para esto” o recordar que el amor no termina solo porque cambió su forma.',
    'Lee una cuando llegue una ola y deja que la única tarea sea atravesar esta hora con amabilidad. No son un tratamiento ni sustituyen el apoyo profesional; si el duelo te supera, habla con un médico o un terapeuta.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el duelo?',
      a: 'Son frases cortas y suaves que hacen compañía en el día tal como es, sin plazos y sin lados positivos forzados. No son un tratamiento para el duelo ni sustituyen el apoyo profesional; si el peso es demasiado, un médico o un terapeuta es el paso adecuado.'
    },
    {
      q: '¿Qué afirmaciones puedo leer para el duelo?',
      a: 'Frases suaves y sin plazos, por ejemplo: “No hay ningún plazo para esto.” “Puedo cargar amor y pérdida al mismo tiempo.” “Hoy solo tengo que hacer hoy.” Evita todo lo que llame al duelo un regalo o una lección antes de que tú lo dijeras, cosa que quizá no pase nunca, y eso está permitido.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos en un día de ola?',
      a: 'Cuando llegue una ola, nómbrala con sencillez como una ola de duelo. Lee una afirmación despacio y, si vienen lágrimas, déjalas, porque llorar no es un retroceso. Haz solo la siguiente cosa física: un vaso de agua, algo pequeño de comer o salir un minuto a tomar aire.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No, y en el duelo esto importa especialmente. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el duelo viene con sentimientos que te asustan, o no puedes dormir, comer o funcionar durante un tiempo largo, busca ayuda de un médico, un terapeuta especializado en duelo o una línea de ayuda de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-autoestima',
  enSlug: 'affirmations-for-self-esteem',
  title: 'Afirmaciones para la autoestima (2026): respeto que resiste un día normal',
  shortTitle: 'Afirmaciones para la autoestima',
  metaDescription: '10 afirmaciones creíbles para la autoestima cuando una crítica se convierte en un veredicto sobre tu valor, más un ejercicio de dos minutos para describirte con justicia. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no reparan una autoestima dañada por orden ni son un tratamiento. Son recordatorios breves para tratarte con un respeto básico incluso en los días en que no te sientes precisamente impresionante.',
    'La baja autoestima se nota en las pequeñas traducciones que haces durante el día. Una cita olvidada se convierte en “soy un desastre”. Que elijan a otra persona se convierte en “no tengo nada que ofrecer”. El hecho es concreto, pero la frase sobre ti no tiene límites. Al llegar la noche, unas pocas decepciones ordinarias pueden parecer un retrato completo de quién eres.',
    'Si la aprobación solía llegar después de un logro, puede resultar extraño ofrecerte respeto antes de haber ganado un elogio. Incluso puedes temer que la amabilidad te vuelva descuidado. Pero describir un error con precisión te deja una reparación concreta que hacer. Insultar a todo tu carácter, en cambio, te deja un problema mucho más grande y ningún paso claro que seguir. Si no puedes creerte un elogio, empieza por el trato justo: no tienes que admirarte antes de dejar de hablarte con crueldad.',
    'Las frases de abajo mantienen esa distinción pequeña y práctica: tus decisiones pueden necesitar trabajo mientras tú sigues siendo una persona que merece cuidado. Prueba una después de atrapar un juicio absoluto, sobre todo palabras como “inútil” o “imposible de querer”. No intentas ganar un debate sobre lo maravilloso que eres. Practicas una descripción más justa de lo que pasó.',
    'Si el veredicto más duro suele llegar a la misma hora cada noche, ese puede ser un buen momento para un recordatorio. Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. También puedes dejar una de estas frases gratis junto al cuaderno donde repasas tu día.'
  ],
  affirmations: [
    'Mi yo ordinario merece una amabilidad ordinaria.',
    'Puedo rechazar una decisión sin rechazar a la persona que la tomó.',
    'Un error puede necesitar reparación sin que yo pierda mi valor.',
    'No pierdo mi derecho al respeto cuando alguien se decepciona.',
    'Mis cualidades discretas cuentan aunque nadie las aplauda.',
    'Puedo aceptar un cumplido sin discutir contra mí.',
    'Tengo derecho a describirme sin añadir un insulto.',
    'Un momento incómodo no puede contener todo lo que soy.',
    'Puedo mejorar algo sin declararme defectuoso.',
    'Merezco una descripción justa, también de mí mismo.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para describirte con justicia',
    steps: [
      'Durante treinta segundos, escribe el juicio que acabas de hacer sobre ti. Debajo, nombra el hecho que lo provocó, usando solo lo que pasó.',
      'Dedica treinta segundos a leer una afirmación despacio. Sustituye el insulto por una descripción concreta: “olvidé la cita” es suficiente.',
      'Usa el último minuto para nombrar una reparación o una necesidad. Escribe “reprogramar la cita” o “hacer una pausa”, y deja el veredicto más grande sin escribir.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la confianza y afirmaciones para el amor propio (enlaces abajo, en inglés). Que el respeto siga disponible en los días en que el elogio parece fuera de alcance. Si el desprecio hacia ti es constante y afecta tu vida diaria, habla con un médico o un terapeuta. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, ni sustituye el apoyo profesional.',
  h1: 'Afirmaciones para la autoestima',
  directAnswer: [
    'Las afirmaciones para la autoestima son recordatorios para tratarte con un respeto básico incluso cuando te sientes poco impresionante. Una frase como “puedo rechazar una decisión sin rechazar a la persona que la tomó” separa un error de toda tu identidad.',
    'No sustituyen el apoyo profesional ni son un tratamiento, pero pueden ayudarte a describir lo que pasó con más justicia antes de decidir qué reparar.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una después de un juicio duro contra ti y luego nombra la cosa concreta que sí puedes cambiar.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la autoestima?',
      a: 'Son recordatorios breves para tratarte con un respeto básico incluso cuando te sientes poco impresionante. Una frase como “puedo rechazar una decisión sin rechazar a la persona que la tomó” separa un error de toda tu identidad. No son un tratamiento, pero pueden ayudarte a describir lo que pasó con más justicia.'
    },
    {
      q: '¿Qué afirmaciones son buenas para la autoestima?',
      a: 'Elige frases que dejen espacio para un día imperfecto: “Mi yo ordinario merece una amabilidad ordinaria.” “Un error puede necesitar reparación sin que yo pierda mi valor.” Ofrecen respeto sin pedirte que finjas que lo hiciste todo bien.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para describirme con justicia?',
      a: 'Escribe el juicio que acabas de hacer sobre ti y, debajo, el hecho que lo provocó, usando solo lo que pasó. Lee una afirmación despacio y sustituye el insulto por una descripción concreta: “olvidé la cita” es suficiente. Nombra una reparación o una necesidad, como reprogramar la cita o hacer una pausa, y deja el veredicto más grande sin escribir.'
    },
    {
      q: '¿En qué se diferencia la autoestima de la confianza?',
      a: 'La confianza tiene que ver con fiarte de ti para una tarea; la autoestima tiene que ver con cómo te miras cuando la tarea sale mal. Puedes dudar sobre una presentación y aun así creer que mereces que te escuchen. Estas frases se centran en esa segunda parte. Si el desprecio hacia ti es constante, habla con un médico o un terapeuta; esta página no sustituye el apoyo profesional.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-trabajo',
  enSlug: 'affirmations-for-work',
  title: 'Afirmaciones para el trabajo (2026): frases firmes para un día laboral lleno',
  shortTitle: 'Afirmaciones para el trabajo',
  metaDescription: '10 afirmaciones prácticas para el trabajo sobre prioridades, reuniones, comentarios y cerrar el turno, más un ejercicio de dos minutos para ordenar la carga. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no crearán personal, tiempo ni un trato justo en tu trabajo. Son recordatorios breves para afrontar prioridades, comentarios y límites durante la jornada.',
    'Un día laboral lleno suele empezar con varias personas tratando su petición como lo siguiente. La bandeja de entrada, el turno, el cliente y la reunión tienen relojes distintos. Puedes pasarte la mañana respondiendo y aun así sentir que no has empezado. Esa sensación puede reflejar demandas que compiten entre sí, más que un fracaso personal a la hora de organizarte.',
    'Las expectativas poco claras añaden otra capa. Si nadie ha dicho cómo se ve un trabajo terminado, es fácil seguir puliendo, quedarte hasta tarde o leer un mensaje breve como una decepción. Una afirmación no puede aclarar esas expectativas por ti. Sí puede darte una frase sencilla en la que apoyarte mientras pides la información que falta.',
    'Aquí las afirmaciones para el trabajo sirven como señales para acciones concretas: aclarar una prioridad, reconocer un error, hacer una pregunta o anotar dónde te quedaste. No necesitan hacer que te encante cada tarea. Una frase que te ayuda a llevar una reunión con honestidad ya está haciendo un trabajo razonable.',
    'Para un recordatorio al empezar o terminar un turno, Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Guarda estas frases donde ocurre tu trabajo de verdad: junto al escritorio, en una libreta de bolsillo o cerca del lugar donde dejas las llaves después del turno.'
  ],
  affirmations: [
    'Puedo aclarar la prioridad antes de aceptar el plazo.',
    'Una bandeja llena no hace que cada mensaje sea igual de urgente.',
    'Puedo preguntar cómo se ve el trabajo terminado antes de empezar.',
    'Mi aportación incluye las preguntas que evitan confusiones.',
    'Puedo asumir un error sin convertirlo en mi puesto de trabajo.',
    'Puedo no estar de acuerdo con una propuesta y seguir respetando a la persona.',
    'Una entrega clara es un buen lugar para parar.',
    'Puedo pedir apoyo antes de que la tarea se convierta en una crisis.',
    'Mi descanso forma parte de la jornada, no solo llega después del agotamiento.',
    'Puedo dejar una nota para mañana en lugar de llevarme todo el turno a casa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para ordenar la carga de trabajo',
    steps: [
      'Dedica treinta segundos a listar las peticiones que compiten por tu atención. Rodea la que tenga una prioridad acordada y clara; si ninguna la tiene, marca la pregunta que necesitas hacer.',
      'Lee una afirmación para el trabajo durante treinta segundos. Redacta una frase sencilla, como “¿cuál de estas debería ir primero hoy?”.',
      'Usa el último minuto para escribir la primera acción de la tarea acordada, o prepara la petición de aclaración. Deja las demás peticiones en la lista en lugar de llevarlas en la cabeza.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para el agotamiento laboral y afirmaciones para la confianza (enlaces abajo, en inglés). Un día laboral llevadero necesita expectativas realistas además de un diálogo interno amable. Esta página ofrece texto de autocuidado; no es una promesa de ascenso ni una solución para condiciones de trabajo inseguras, y no sustituye el consejo médico ni el apoyo profesional.',
  h1: 'Afirmaciones para el trabajo',
  directAnswer: [
    'Las afirmaciones para el trabajo son recordatorios breves para manejar prioridades, comentarios y límites durante la jornada. “Puedo aclarar la prioridad antes de aceptar el plazo” apunta a una conversación concreta en lugar de fingir que la carga es fácil.',
    'No sustituyen el apoyo profesional ni arreglan una carga injusta, pero pueden ayudarte a preparar una petición concreta sobre prioridades o apoyo.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una antes de abrir la bandeja de entrada, entrar en una reunión o cerrar tu turno.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el trabajo?',
      a: 'Son recordatorios breves para manejar prioridades, comentarios y límites durante la jornada. “Puedo aclarar la prioridad antes de aceptar el plazo” apunta a una conversación concreta en lugar de fingir que la carga es fácil. No crean personal ni tiempo, pero pueden darte una frase sencilla en la que apoyarte.'
    },
    {
      q: '¿Qué afirmaciones son útiles para el trabajo?',
      a: 'Usa frases sobre acciones disponibles en tu puesto: “Puedo preguntar cómo se ve el trabajo terminado antes de empezar.” “Una bandeja llena no hace que cada mensaje sea igual de urgente.” Te dan un siguiente paso cuando las expectativas vagas o las peticiones que compiten llenan el día.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos durante la jornada?',
      a: 'Lista las peticiones que compiten por tu atención y rodea la que tenga una prioridad acordada y clara. Lee una afirmación despacio y redacta una frase sencilla, como “¿cuál de estas debería ir primero hoy?”. Escribe la primera acción de la tarea acordada o prepara la petición de aclaración, y deja las demás peticiones en la lista.'
    },
    {
      q: '¿Las afirmaciones significan que debo tolerar una carga irrazonable?',
      a: 'No. Un recordatorio no puede crear personal, tiempo ni un trato justo. Úsalo para preparar una petición concreta sobre prioridades o apoyo. Si tu puesto te da poco control, preguntar qué puede cambiar es más honesto que prometer que lo llevarás todo con alegría. Después de un error, prueba con “puedo asumir un error sin convertirlo en mi puesto de trabajo” y luego identifica quién necesita saberlo y qué hay que corregir.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-estudiantes',
  enSlug: 'affirmations-for-students',
  title: 'Afirmaciones para estudiantes (2026): aprender sin que cada nota sea un veredicto',
  shortTitle: 'Afirmaciones para estudiantes',
  metaDescription: '10 afirmaciones para estudiantes ante exámenes, clases confusas y notas decepcionantes, más un ejercicio de dos minutos para empezar a estudiar. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no garantizan notas ni sustituyen la práctica, la enseñanza o el apoyo. Son frases creíbles para estudiar, hacer preguntas y responder a las calificaciones.',
    'La escuela le pone un marcador visible al aprendizaje: notas, plazos, clasificaciones, cartas de admisión. Esas medidas pueden importar sin contar toda la historia de un estudiante. Cuando cada resultado se siente como un juicio sobre tu inteligencia, los momentos que el aprendizaje exige —atascarte, preguntar otra vez, hacer un intento— pueden empezar a dar vergüenza.',
    'La comparación hace que la clase parezca más segura de lo que es. Ves a alguien terminar pronto, pero no la práctica que hizo ayer ni el tema que le cuesta en otra asignatura. Si además trabajas, te desplazas o cuidas a tu familia, comparar horas de estudio puede ocultar diferencias reales en el tiempo disponible. Tu siguiente paso útil de estudio tiene que encajar en tu día real.',
    'Estas frases buscan hacer espacio para la parte inacabada del aprendizaje. Apuntan a hacer una pregunta concreta, probar un ejemplo resuelto o leer los comentarios sin convertirlos en una etiqueta personal. Una afirmación es una señal para volver al material; no puede sustituir la práctica, la enseñanza ni el apoyo cuando el curso avanza demasiado rápido.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Un recordatorio antes de tu rato habitual de estudio puede marcar el comienzo sin convertirse en otra nota que ganar. Estas frases gratis también funcionan en una tarjeta guardada dentro del libro de texto.'
  ],
  affirmations: [
    'Una pregunta sin responder me muestra qué estudiar después.',
    'Tengo derecho a necesitar otra explicación.',
    'Mi primer intento es material del que puedo aprender.',
    'Puedo leer la pregunta que tengo delante antes de preocuparme por la siguiente.',
    'Una nota describe esta entrega, no todas mis posibilidades.',
    'Preguntar en tutorías forma parte de ser estudiante.',
    'Puedo estudiar un ejemplo sin dominar el capítulo esta noche.',
    'Mi aprendizaje cuenta aunque tarde más en verse.',
    'Puedo comparar mis apuntes con la lección en lugar de mi vida con la de un compañero.',
    'Puedo llevar una pregunta clara a la siguiente clase.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para empezar a estudiar',
    steps: [
      'Durante treinta segundos, abre el material y elige una pregunta que todavía no sabes responder. Haz el objetivo más pequeño que todo el capítulo.',
      'Dedica treinta segundos a leer una afirmación y a escribir lo que ya sabes de esa pregunta, aunque sea solo una definición.',
      'Usa el último minuto para intentar el primer paso o marcar el punto exacto donde necesitas una explicación. Ese es tu punto de partida para estudiar o pedir ayuda.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la confianza y afirmaciones para concentrarte (enlaces abajo, en inglés). Si la carga supera el tiempo o el apoyo que tienes, lleva un ejemplo concreto a un profesor o a un orientador. Estas frases son textos de autocuidado, no una garantía de resultados en los exámenes ni un sustituto del apoyo profesional.',
  h1: 'Afirmaciones para estudiantes',
  directAnswer: [
    'Las afirmaciones para estudiantes son frases creíbles para estudiar, hacer preguntas y responder a las notas. “Una pregunta sin responder me muestra qué estudiar después” convierte la confusión en un punto de partida concreto.',
    'No garantizan resultados ni sustituyen la enseñanza o el apoyo profesional, pero pueden ayudarte a volver al material sin convertir cada nota en un veredicto.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una antes de una sesión de estudio y luego elige una sola pregunta o un solo problema en el que trabajar.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para estudiantes?',
      a: 'Son frases creíbles para estudiar, hacer preguntas y responder a las notas. “Una pregunta sin responder me muestra qué estudiar después” convierte la confusión en un punto de partida concreto. No garantizan resultados, pero pueden ayudarte a volver al material sin convertir cada nota en un veredicto sobre ti.'
    },
    {
      q: '¿Qué afirmaciones son buenas para estudiantes?',
      a: 'Prueba frases que permitan que el aprendizaje esté inacabado: “Tengo derecho a necesitar otra explicación.” “Mi primer intento es material del que puedo aprender.” Encajan mejor en una sesión real de estudio que una promesa de saber todas las respuestas o sacar la nota más alta.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos antes de estudiar?',
      a: 'Abre el material y elige una pregunta que todavía no sabes responder, más pequeña que todo el capítulo. Lee una afirmación despacio y escribe lo que ya sabes de esa pregunta, aunque sea solo una definición. Intenta el primer paso o marca el punto exacto donde necesitas una explicación: ese es tu punto de partida.'
    },
    {
      q: '¿Qué afirmación puedo usar antes de un examen?',
      a: 'Prueba con “puedo leer la pregunta que tengo delante antes de preocuparme por la siguiente”. Acompáñala de una revisión práctica de las instrucciones y del tiempo disponible. Una frase no puede garantizar un resultado, pero puede recordarte qué estás haciendo en este minuto. Después de una nota decepcionante, lee una frase que separe el resultado de tu identidad y mira un solo comentario para saber qué preguntar a tu profesor.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-hombres',
  enSlug: 'affirmations-for-men',
  title: 'Afirmaciones para hombres (2026): espacio para ser humano detrás de la cara capaz',
  shortTitle: 'Afirmaciones para hombres',
  metaDescription: '10 afirmaciones para hombres sobre el apoyo, la responsabilidad y el valor más allá de los logros, más un ejercicio de dos minutos para mirarte con honestidad. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: estas frases no definen la masculinidad ni sustituyen el apoyo profesional. Ofrecen una forma sencilla de cuestionar la presión de ser útil, seguro de ti y silencioso ante la dificultad.',
    'Algunos hombres aprenden a responder a casi cualquier pregunta sobre cómo están con un “bien”. Puede ser más fácil hablar del trabajo, de un resultado o de un aparato roto que decir que te sientes solo o inseguro. Si ser capaz se ha convertido en tu principal forma de pertenecer, admitir una dificultad puede sentirse como renunciar justo a eso que la gente valora de ti.',
    'Esa presión no se ve igual en cada vida. Puede ser la expectativa de ganar más, resolver un problema familiar, esconder una decepción o no necesitar nunca que te tranquilicen. El hilo común es una descripción de puesto muy estrecha para ser persona: útil cuando te necesitan, discreto cuando te duele algo. Nadie puede vivir dentro de esa descripción todo el tiempo.',
    'Las frases de abajo ofrecen más espacio sin pedirte que abandones la responsabilidad. Pedir ayuda puede convivir con cumplir una promesa. Nombrar un sentimiento puede convivir con decidir qué hacer con él. Elige la frase que responde a tu presión real y úsala para que una conversación sea un poco más honesta.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Un recordatorio breve antes del camino a casa puede ser un momento para comprobar cómo estás por debajo de la lista de cosas que resolviste. Estas frases gratis también caben en una nota que guardes para ti.'
  ],
  affirmations: [
    'Puedo ser de fiar sin ser invulnerable.',
    'Mi valor no es una nómina ni un rendimiento.',
    'Puedo contarle a un amigo la parte que suelo omitir.',
    'Necesitar que me tranquilicen no me hace menos hombre.',
    'Puedo nombrar una decepción sin convertirla en una pelea.',
    'Mi cuidado importa aunque no pueda resolver el problema.',
    'Puedo recibir apoyo sin devolverlo de inmediato.',
    'Ser honesto sobre mis límites forma parte de ser de fiar.',
    'Tengo derecho a amistades con espacio para conversaciones difíciles.',
    'Puedo elegir qué significa ser hombre en mis actos de cada día.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para mirarte con honestidad',
    steps: [
      'Durante treinta segundos, completa la frase “debajo del bien, me siento...” con una palabra sencilla. No hace falta justificarla.',
      'Lee una afirmación durante treinta segundos. Nombra una cosa que necesitas hoy: compañía, silencio, ayuda con una tarea o una oportunidad de hablar.',
      'Usa el último minuto para redactar una petición concreta a alguien de confianza. Si no estás listo para enviarla, guarda las palabras para que la próxima conversación tenga un punto de partida.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la autoestima y afirmaciones para el agotamiento laboral (enlaces abajo, en inglés). Puedes tomarte en serio tus responsabilidades y aun así dejar que otra persona vea cómo estás. Si la dificultad es constante o te desborda, habla con un médico o un terapeuta. Estas frases son texto de autocuidado, no una definición de masculinidad ni un sustituto del apoyo profesional.',
  h1: 'Afirmaciones para hombres',
  directAnswer: [
    'Las afirmaciones para hombres pueden ofrecer una forma sencilla de cuestionar la presión de ser útil, seguro y silencioso ante la dificultad. “Puedo ser de fiar sin ser invulnerable” deja espacio tanto para la responsabilidad como para el apoyo.',
    'No definen cómo debe ser un hombre ni sustituyen el apoyo profesional, pero pueden ayudarte a nombrar lo que pasa de verdad en lugar de responder que estás bien.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una antes de una conversación en la que sueles decir que estás bien, y luego nombra lo que está pasando en realidad.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para hombres?',
      a: 'Son frases que ofrecen una forma sencilla de cuestionar la presión de ser útil, seguro y silencioso ante la dificultad. “Puedo ser de fiar sin ser invulnerable” deja espacio tanto para la responsabilidad como para el apoyo. No definen la masculinidad ni sustituyen el apoyo profesional.'
    },
    {
      q: '¿Qué afirmaciones son buenas para hombres?',
      a: 'Prueba frases que hagan espacio para una necesidad humana ordinaria: “Puedo ser de fiar sin ser invulnerable.” “Mi valor no es una nómina ni un rendimiento.” Elige la presión que reconoces en lugar de una frase sobre cómo debería ser cada hombre. No son solo para padres o proveedores: los hombres tienen papeles y vidas distintos.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para mirarme con honestidad?',
      a: 'Completa la frase “debajo del bien, me siento...” con una palabra sencilla, sin justificarla. Lee una afirmación despacio y nombra una cosa que necesitas hoy: compañía, silencio, ayuda con una tarea o hablar. Redacta una petición concreta a alguien de confianza; si no la envías, guarda las palabras como punto de partida.'
    },
    {
      q: '¿Las afirmaciones para hombres tienen que sonar duras?',
      a: 'No. Si ya pasas el día tratando de parecer inquebrantable, otra exigencia de ser fuerte puede sumar peso. Una frase útil puede ser tranquila y práctica, como “puedo contarle a un amigo la parte que suelo omitir”. Y pedir ayuda puede empezar por una petición concreta: “¿podemos hablar diez minutos? He tenido una semana dura”.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-amor',
  enSlug: 'affirmations-for-love',
  title: 'Afirmaciones para el amor (2026): conexión con espacio para las dos personas',
  shortTitle: 'Afirmaciones para el amor',
  metaDescription: '10 afirmaciones para el amor sobre el cuidado mutuo, las peticiones honestas y los límites, más un ejercicio de dos minutos para conectar. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: ninguna frase puede hacer que una persona concreta te ame ni decidir los sentimientos o el consentimiento de otra persona. Estas afirmaciones son recordatorios para buscar conexión sin abandonar tus necesidades ni intentar controlar a nadie.',
    'Querer amor puede hacer que las pequeñas incertidumbres se sientan enormes. Una respuesta tardía se convierte en una historia sobre perder interés; un desacuerdo se convierte en una pregunta sobre si la relación durará. Cuando la conexión importa, es tentador buscar certezas en detalles que no pueden darlas. Puedes acabar ensayando una conversación que en realidad no has tenido.',
    'Otra presión es la idea de que ser fácil de querer significa necesitar muy poco. Puedes aceptar planes que no te gustan, esconder una decepción o cuidar mientras esperas que la otra persona adivine lo que necesitas a cambio. Eso deja a las dos personas trabajando con información incompleta. Una petición clara puede dar exposición, pero le da a la relación algo real a lo que responder.',
    'Las afirmaciones de aquí se centran en el cuidado mutuo, no en atraer o asegurar a una persona. Dejan espacio para el afecto, el desacuerdo, los límites y una respuesta que no puedes elegir. Usa una frase para preparar tu parte de un intercambio honesto, no para predecir cómo irá la otra parte.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Un recordatorio durante una pausa de la tarde puede ser una señal para notar el cuidado que ya existe en tu vida. Puedes usar estas frases gratis también en amistades y conversaciones familiares, no solo en relaciones de pareja.'
  ],
  affirmations: [
    'Puedo querer cercanía y aun así pedir claridad.',
    'Mis necesidades tienen lugar en la conversación sobre nuestra relación.',
    'Puedo ofrecer afecto sin convertirlo en un trato.',
    'Puedo escuchar una necesidad distinta sin borrar la mía.',
    'Un límite puede hacer espacio para una conexión más honesta.',
    'Puedo recibir amabilidad sin buscar la trampa.',
    'La incertidumbre de otra persona no decide si merezco que me quieran.',
    'Puedo disfrutar la conexión sin apresurarla hacia una promesa.',
    'El amor en mis amistades cuenta como amor en mi vida.',
    'Puedo preguntar directamente en lugar de construir una historia desde el silencio.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para conectar',
    steps: [
      'Dedica treinta segundos a nombrar un momento de una relación que tienes en mente. Escribe lo que pasó separado de lo que crees que significó.',
      'Lee una afirmación durante treinta segundos. Identifica si quieres expresar agradecimiento, hacer una pregunta o plantear una necesidad.',
      'Usa el último minuto para escribir una frase clara que compartir cuando sea el momento. Que sea una petición o una observación, dejando espacio para que la otra persona responda.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para el amor propio y afirmaciones para soltar (enlaces abajo, en inglés). La cercanía puede incluir peticiones claras y espacio para un no. Estas frases son textos de autocuidado, no promesas de romance ni motivos para pasar por alto una conducta dañina; si una relación te hace sentir inseguro, busca apoyo profesional o una línea de ayuda de tu zona.',
  h1: 'Afirmaciones para el amor',
  directAnswer: [
    'Las afirmaciones para el amor son recordatorios para buscar conexión sin abandonar tus necesidades ni intentar controlar a otra persona. “Puedo querer cercanía y aun así pedir claridad” te da un punto de partida para una conversación honesta.',
    'Ninguna frase puede decidir los sentimientos de otra persona, y estas líneas no sustituyen el apoyo profesional; pueden ayudarte a separar lo que sabes de lo que necesitas preguntar.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca, también si no tienes pareja: el amor también está en las amistades y en la familia.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el amor?',
      a: 'Son recordatorios para buscar conexión sin abandonar tus necesidades ni intentar controlar a otra persona. “Puedo querer cercanía y aun así pedir claridad” te da un punto de partida para una conversación honesta. Ninguna frase puede decidir los sentimientos de otra persona.'
    },
    {
      q: '¿Qué afirmaciones son buenas para el amor?',
      a: 'Elige frases que permitan la elección mutua: “Puedo querer cercanía y aun así pedir claridad.” “Puedo ofrecer afecto sin convertirlo en un trato.” Dejan espacio para tus necesidades y para la otra persona, en lugar de prometer una respuesta concreta. También sirven sin pareja: el amor también está en las amistades y en la familia.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para conectar?',
      a: 'Nombra un momento de una relación que tienes en mente y escribe lo que pasó separado de lo que crees que significó. Lee una afirmación despacio e identifica si quieres expresar agradecimiento, hacer una pregunta o plantear una necesidad. Escribe una frase clara para compartir cuando sea el momento, dejando espacio para que la otra persona responda.'
    },
    {
      q: '¿Pueden las afirmaciones hacer que una persona concreta me ame?',
      a: 'No. Una frase no puede decidir los sentimientos ni el consentimiento de otra persona. Usa las afirmaciones para aclarar cómo quieres participar en una relación: con honestidad, con cuidado y con límites. La elección de la otra persona sigue siendo suya. Ante un desacuerdo, prueba con “puedo escuchar una necesidad distinta sin borrar la mía” y nombra el tema concreto en lugar de adivinar motivos.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-dinero',
  enSlug: 'affirmations-for-money',
  title: 'Afirmaciones para el dinero (2026): una forma más amable de mirar los números',
  shortTitle: 'Afirmaciones para el dinero',
  metaDescription: '10 afirmaciones con los pies en la tierra para las preocupaciones de dinero, sin promesas de riqueza, más un ejercicio de dos minutos para afrontar una tarea económica. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: ninguna afirmación puede garantizar ingresos, borrar una factura ni cambiar un precio. Estas frases son una señal para mirar un documento o hacer una pregunta que has estado evitando, no un método financiero.',
    'Un número en una pantalla puede parecer que dice mucho más de lo que dice. Un saldo se convierte en un veredicto sobre tu vida adulta; un gasto inesperado se convierte en la prueba de que deberías haber planificado mejor. El dinero tiene consecuencias prácticas, así que la preocupación no es imaginaria. Pero un juicio sobre todo tu carácter añade otra carga a una situación que ya necesita atención.',
    'Cuando abrir un extracto se siente como abrir una crítica, posponerlo puede ofrecer un momento de alivio. El documento sin abrir ocupa entonces un espacio al fondo del día. Ese es el pequeño momento al que apuntan estas frases: acercarte a la información sin exigirte sentirte tranquilo, capaz u orgulloso antes.',
    'Las afirmaciones sobre riqueza sin esfuerzo se saltan ese momento. Pueden sonar especialmente lejanas cuando los ingresos son inciertos o los costes han subido más de lo que puedes manejar. Las frases de abajo hacen afirmaciones más pequeñas sobre la dignidad, las preguntas y mirar lo que realmente hay. Son textos para hablarte a ti, no un presupuesto, un método de inversión ni una explicación de por qué alguien tiene menos.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Si ya reservas un rato para el papeleo, un recordatorio breve puede marcar ese momento. También puedes guardar una frase gratis de esta página junto a la carpeta que sueles dejar cerrada.'
  ],
  affirmations: [
    'Puedo mirar un saldo sin convertirlo en una medida de mí.',
    'Una factura sin abrir es una tarea, no una descripción de mi carácter.',
    'Puedo hacer una pregunta sobre dinero sin disculparme por no saber.',
    'Mi situación merece atención sin vergüenza añadida.',
    'Puedo nombrar un coste con honestidad aunque desee que fuera distinto.',
    'El gasto de otra persona no marca el nivel de mi día.',
    'Un término económico que no conozco es algo que puedo preguntar.',
    'Puedo decir que un plan está fuera de mi presupuesto sin inventar una excusa.',
    'Merezco ayuda respetuosa con una situación económica difícil.',
    'Un dato claro es un buen lugar para empezar este papeleo.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para el papeleo económico',
    steps: [
      'Durante treinta segundos, elige un extracto, una factura o una pregunta sobre dinero. Deja el resto de la pila fuera de esta tarea de dos minutos.',
      'Dedica treinta segundos a leer una afirmación. Nombra la sensación que aparece sin convertirla en una etiqueta sobre tu capacidad.',
      'Usa el último minuto para anotar un dato del documento y una cosa que no entiendes. Guarda esa pregunta para la próxima conversación práctica o sesión de papeleo.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para el éxito y afirmaciones para la autoestima (enlaces abajo, en inglés). Un problema de dinero puede ser real sin ser un veredicto sobre ti. Esta página ofrece texto de autocuidado, no asesoramiento financiero ni una promesa de ingresos; si necesitas ayuda para entender tu situación, consulta a un profesional cualificado.',
  h1: 'Afirmaciones para el dinero',
  directAnswer: [
    'Las afirmaciones para el dinero pueden ayudarte a afrontar una tarea económica incómoda sin convertir los números en un juicio sobre tu carácter. “Puedo mirar un saldo sin convertirlo en una medida de mí” mantiene la tarea concreta.',
    'Ninguna frase garantiza ingresos ni sustituye el asesoramiento financiero profesional; puede servir como señal para abrir un documento o hacer la pregunta que has estado evitando.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una antes de abrir un extracto y luego escribe un dato y una pregunta que necesites responder.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el dinero?',
      a: 'Son frases para afrontar una tarea económica incómoda sin convertir los números en un juicio sobre tu carácter. “Puedo mirar un saldo sin convertirlo en una medida de mí” mantiene la tarea concreta. Ninguna garantiza ingresos ni sustituye el asesoramiento financiero profesional.'
    },
    {
      q: '¿Qué afirmaciones realistas hay para el dinero?',
      a: 'Usa frases sobre mirar la información de frente: “Puedo mirar un saldo sin convertirlo en una medida de mí.” “Un término económico que no conozco es algo que puedo preguntar.” Siguen siendo utilizables cuando el dinero escasea porque no afirman que ya tienes de sobra. Si sientes vergüenza, elige una frase que separe tu situación de tu valor y describe un dato sin insultos: “esta factura está sin abrir” funciona mejor que “soy un desastre con el dinero”.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos ante el papeleo?',
      a: 'Elige un extracto, una factura o una pregunta sobre dinero, y deja el resto de la pila fuera de la tarea. Lee una afirmación despacio y nombra la sensación que aparece sin convertirla en una etiqueta sobre tu capacidad. Anota un dato del documento y una cosa que no entiendes, y guarda esa pregunta para la próxima conversación práctica.'
    },
    {
      q: '¿Las afirmaciones sobre dinero atraen riqueza?',
      a: 'No. Ninguna afirmación puede garantizar ingresos, borrar una factura ni cambiar un precio. Una frase puede servir como señal para abrir un documento o hacer una pregunta que has estado evitando. La situación económica sigue necesitando atención práctica por su cuenta, y si mirar todo a la vez te desborda, limítate a un documento y una pregunta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-concentrarte',
  enSlug: 'affirmations-for-focus',
  title: 'Afirmaciones para concentrarte (2026): un lugar claro al que devolver tu atención',
  shortTitle: 'Afirmaciones para concentrarte',
  metaDescription: '10 afirmaciones para concentrarte que hacen del regreso tras una distracción parte de la práctica, más un ejercicio de dos minutos para una sola tarea. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: estas frases son señales de autocuidado, no un diagnóstico ni un tratamiento para problemas de concentración. Sirven para elegir una tarea y volver a ella después de una distracción.',
    'A veces lo difícil de concentrarse es decidir qué merece el siguiente minuto. Un documento está abierto, un mensaje necesita respuesta y un recado sin relación sigue apareciendo en tus pensamientos. Cada cosa se siente inacabada, así que cada una pide atención. Cambiar entre ellas puede dejarte ocupado sin darle a ninguna tarea espacio suficiente para avanzar.',
    'Una tarea vaga hace el problema más difícil. “Trabajar en el proyecto” ofrece muchas entradas posibles, mientras que “escribir el primer encabezado” te dice dónde poner las manos. La distracción también puede reflejar interrupciones, cansancio o un entorno que dificulta la atención sostenida. Una frase severa sobre disciplina no elimina esas condiciones.',
    'Estas afirmaciones tratan la concentración como un regreso que puedes hacer, no como un estado perfecto que debes proteger. Acompaña una con una siguiente acción visible y un lugar donde poner los pensamientos sin relación. Cuando la atención se mueve, la frase te da una ruta corta de vuelta sin añadir un discurso sobre lo que te pasa.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Si los recordatorios encajan en tu rutina, pon uno antes de un rato de trabajo; durante el rato, una frase escrita junto a la tarea puede ser suficiente.'
  ],
  affirmations: [
    'Durante este minuto, este párrafo es mi tarea.',
    'Puedo volver a esta frase sin criticar el desvío.',
    'Puedo aparcar una idea nueva sin seguirla de inmediato.',
    'Mi siguiente acción puede ser más pequeña que todo mi proyecto.',
    'Notar la distracción me da una oportunidad de volver.',
    'Puedo dejar otra pestaña sin abrir mientras termino este pensamiento.',
    'Un momento de dispersión no borra la atención que ya di.',
    'Puedo hacer mi espacio más silencioso antes de exigirme más.',
    'Puedo escribir el recordatorio y soltarlo en lugar de ensayarlo.',
    'Estoy practicando el regreso, no demostrando que nunca me disperso.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para volver a una sola tarea',
    steps: [
      'Usa treinta segundos para nombrar una acción visible: leer un párrafo, etiquetar un diagrama o redactar una respuesta. Pon una nota libre al lado para los pensamientos sin relación.',
      'Dedica treinta segundos a leer una afirmación y cerrar una fuente de interrupción que puedas evitar. Mantén a la vista el material de la acción elegida.',
      'Trabaja en esa acción durante el último minuto. Si aparece otra cosa en tu mente, anota unas palabras en la nota libre y vuelve a tu sitio.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para estudiantes y afirmaciones para el trabajo (enlaces abajo, en inglés). Una práctica de concentración útil te deja un lugar claro al que volver. Si la concentración altera tu vida diaria de forma regular, un profesional cualificado puede ayudarte a explorar qué está pasando; estas frases son textos de autocuidado, no un tratamiento para dificultades de atención.',
  h1: 'Afirmaciones para concentrarte',
  directAnswer: [
    'Las afirmaciones para concentrarte son señales breves para elegir una tarea y volver a ella después de una distracción. “Puedo volver a esta frase sin criticar el desvío” hace que el regreso forme parte de la práctica.',
    'No son un diagnóstico ni un tratamiento para dificultades de atención, pero pueden ayudarte a nombrar la siguiente acción visible y darle un rato corto de atención.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una, nombra la siguiente acción visible y dale a esa acción un tramo breve de atención.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para concentrarte?',
      a: 'Son señales breves para elegir una tarea y volver a ella después de una distracción. “Puedo volver a esta frase sin criticar el desvío” hace que el regreso forme parte de la práctica. No son un diagnóstico ni un tratamiento para dificultades de atención.'
    },
    {
      q: '¿Qué afirmaciones son buenas para concentrarte?',
      a: 'Elige una frase que te diga a dónde volver: “Durante este minuto, este párrafo es mi tarea.” “Puedo aparcar una idea nueva sin seguirla de inmediato.” Las señales concretas son más fáciles de usar que exigirte una concentración perfecta todo el día. También sirven estudiando: ajusta la frase a una unidad pequeña, como un ejemplo, un párrafo o una pregunta.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos para volver a una tarea?',
      a: 'Nombra una acción visible, como leer un párrafo o redactar una respuesta, y pon una nota libre al lado para los pensamientos sin relación. Lee una afirmación despacio y cierra una fuente de interrupción que puedas evitar. Trabaja en esa acción durante un minuto; si aparece otra cosa, anota unas palabras en la nota y vuelve a tu sitio.'
    },
    {
      q: '¿Qué me digo cuando noto que estoy distraído?',
      a: 'Prueba con “notar la distracción me da una oportunidad de volver”. Después encuentra tu sitio y haz la siguiente acción pequeña. Una discusión larga sobre por qué te desviaste puede convertirse en otra interrupción; los obstáculos que se repiten puedes revisarlos después del rato de trabajo. Si la concentración altera tu vida de forma regular, consulta a un profesional cualificado en lugar de tratar la dificultad persistente como un fracaso al repetir la frase correcta.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-paciencia',
  enSlug: 'affirmations-for-patience',
  title: 'Afirmaciones para la paciencia (2026): un poco de espacio entre esperar y reaccionar',
  shortTitle: 'Afirmaciones para la paciencia',
  metaDescription: '10 afirmaciones para la paciencia durante retrasos, avances lentos y conversaciones tensas, más un ejercicio de dos minutos para pausar antes de responder. Frases gratis de Anicca.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: estas frases no te obligan a disfrutar de la espera ni a aceptar un descuido o un daño. Son recordatorios para elegir tu respuesta cuando las cosas avanzan más despacio de lo que quieres.',
    'Esperar se siente distinto cuando ya has pasado el día con prisa. Una cola lenta o una pregunta repetida pueden convertirse en el punto donde llega toda la frustración anterior. El retraso presente es real, pero puede estar cargando el peso de un autobús perdido, una tarea inacabada y un plan que no tenía minutos de sobra.',
    'La impaciencia también puede venir de la historia que se pega al retraso: nadie respeta tu tiempo, nada está mejorando, siempre estarás atascado aquí. A veces hay un problema real que atender. A veces la historia se ha adelantado a la información. Separar las dos cosas te da más posibilidades de pedir lo que realmente necesitas.',
    'Las frases de abajo hacen espacio entre la sensación y la respuesta. No tienes que convertirte en una persona a la que le encantan las colas o el avance lento. Puedes notar la irritación, decidir si hay una acción útil disponible y elegir palabras que no creen un segundo problema. Un límite dicho con calma también puede ser una respuesta paciente.',
    'Anicca es una app de afirmaciones para iPhone, gratis de descargar en la App Store, con suscripción opcional y sin rachas: envía una línea breve a la hora que elijas o cuando la necesitas, y está disponible en español. Un recordatorio antes de una transición que suele ir con prisa puede poner una de estas frases a tu alcance. Guarda una frase gratis cerca del lugar donde sueles enviar respuestas apresuradas.'
  ],
  affirmations: [
    'Puedo sentir impaciencia sin hacer que otra persona la cargue.',
    'Un retraso puede ser un inconveniente sin convertirse en un insulto.',
    'Puedo pedir una novedad sin exigir un resultado instantáneo.',
    'Mi siguiente frase puede ser más lenta que mi primera reacción.',
    'Otra persona tiene derecho a tiempo para entender mi petición.',
    'Puedo poner un límite sin lanzarme a una pelea.',
    'El avance lento merece una mirada más cercana antes de llamarlo ningún avance.',
    'Puedo reparar una respuesta brusca sin defenderla.',
    'Esperar no me exige ensayar mi frustración.',
    'Puedo dejar que esta pausa siga siendo una pausa en lugar de llenarla de reproches.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para pausar antes de responder',
    steps: [
      'Durante treinta segundos, describe el retraso con hechos sencillos. Separa “he esperado diez minutos” del significado que le estás dando.',
      'Dedica treinta segundos a leer una afirmación antes de enviar o decir tu siguiente respuesta. Nombra si necesitas información, un límite o simplemente más tiempo.',
      'Usa el último minuto para redactar una petición respetuosa o elegir cuándo volver a preguntar. Si no hay nada útil que hacer ahora, deja las manos en reposo en lugar de actualizar la pantalla durante ese minuto.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para soltar y afirmaciones para el trabajo (enlaces abajo, en inglés). La paciencia puede incluir un seguimiento honesto y un punto claro donde parar. Estas frases ofrecen una pausa de autocuidado, no un motivo para ignorar un problema que necesita acción ni un sustituto del apoyo profesional.',
  h1: 'Afirmaciones para la paciencia',
  directAnswer: [
    'Las afirmaciones para la paciencia son recordatorios para elegir tu respuesta cuando las cosas avanzan más despacio de lo que quieres. “Puedo sentir impaciencia sin hacer que otra persona la cargue” permite la sensación mientras deja abiertas tus siguientes palabras.',
    'No significan esperar indefinidamente ni sustituyen el apoyo profesional; pueden ayudarte a decidir si el momento necesita una pausa, una pregunta o un límite claro.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca. Lee una durante un retraso y luego decide qué necesita el momento.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la paciencia?',
      a: 'Son recordatorios para elegir tu respuesta cuando las cosas avanzan más despacio de lo que quieres. “Puedo sentir impaciencia sin hacer que otra persona la cargue” permite la sensación mientras deja abiertas tus siguientes palabras. No significan esperar indefinidamente.'
    },
    {
      q: '¿Qué afirmaciones son buenas para la paciencia?',
      a: 'Prueba con “puedo sentir impaciencia sin hacer que otra persona la cargue” o “un retraso puede ser un inconveniente sin convertirse en un insulto”. Estas frases reconocen la frustración en lugar de pedirte que disfrutes de la espera. Cuando alguien avanza despacio, lee una frase antes de repetir tu petición y comprueba si necesita información, tiempo o una explicación más clara.'
    },
    {
      q: '¿Cómo uso las afirmaciones en dos minutos antes de responder?',
      a: 'Describe el retraso con hechos sencillos, separando “he esperado diez minutos” del significado que le estás dando. Lee una afirmación despacio antes de enviar o decir tu siguiente respuesta, y nombra si necesitas información, un límite o más tiempo. Redacta una petición respetuosa o elige cuándo volver a preguntar.'
    },
    {
      q: '¿La paciencia significa esperar indefinidamente?',
      a: 'No. Una entrega, una decisión o una petición sin respuesta pueden necesitar una hora de seguimiento o un límite. La paciencia puede significar hacer esa petición con claridad, sin convertir el retraso en una pelea. No exige aceptar un descuido o un daño. Y si ya respondiste con brusquedad, prueba con “puedo reparar una respuesta brusca sin defenderla”: reconoce tus palabras, pide disculpas con sencillez y repite tu petición si sigue importando.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-creatividad',
  enSlug: 'affirmations-for-creativity',
  title: 'Afirmaciones para la creatividad (2026): permiso para hacer la versión en borrador',
  shortTitle: 'Afirmaciones para la creatividad',
  metaDescription: 'Afirmaciones para la creatividad cuando el juicio llega antes que el primer borrador, y un ejercicio de dos minutos para hacer una versión en borrador. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no garantizan ideas ni inspiración. Son frases cortas que dan permiso para explorar una idea antes de decidir si es buena.',
    'Una página en blanco puede llenarse antes de que pongas algo en ella. Imaginas la pieza terminada, la respuesta que podría recibir y todo lo que le faltará. Evaluar un trabajo que todavía no existe deja poco espacio para descubrir qué quieres hacer de verdad, y la primera marca empieza a cargar con las exigencias de la última.',
    'Ver trabajos pulidos durante todo el día puede hacer que ese comienzo se sienta especialmente torpe. Ves la imagen elegida, no los bocetos descartados; la canción terminada, no las decisiones inciertas del camino. Las referencias pueden enseñar mucho, pero compararlas con tu primer intento privado puede convertir la exploración en un examen que no querías hacer.',
    'Estas frases intentan que crear y juzgar no ocupen el mismo instante. Puedes esbozar una opción ahora y decidir más tarde qué merece una revisión. No es una promesa de que cada experimento saldrá bien: es permiso para producir algo concreto de lo que aprender, que puedas cambiar, combinar o dejar atrás.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, por ejemplo antes de tu momento habitual de crear. Las frases de abajo también pueden vivir en la primera página de un cuaderno de bocetos, con o sin la app.'
  ],
  affirmations: [
    'Mi primer borrador puede hacer las preguntas que la versión final responderá.',
    'Puedo hacer algo antes de saber cómo llamarlo.',
    'Una versión en borrador le da a mi idea un lugar donde desarrollarse.',
    'Puedo seguir un detalle que me despierta curiosidad sin conocer todo el diseño.',
    'Mi trabajo sin terminar todavía no necesita un público.',
    'Puedo admirar a otra persona creadora sin abandonar mi propio intento.',
    'Un experimento que descarto también puede enseñarme una elección útil.',
    'Tengo permiso para probar una forma distinta para esta idea.',
    'Puedo dejar la evaluación para cuando haya algo que evaluar.',
    'Una marca imperfecta basta para darle un comienzo a esta página.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para hacer una versión en borrador',
    steps: [
      'Durante medio minuto, elige un punto de partida pequeño: una frase sobre un objeto, un boceto de su contorno o unas notas que sugieran su ambiente.',
      'Dedica medio minuto a leer una afirmación y a apartar una fuente de comparación. Dale a este intento un lugar privado donde no necesite verse terminado.',
      'Usa el minuto final para hacer una versión en borrador sin corregirla sobre la marcha. Al terminar, rodea con un círculo un detalle que podrías explorar después, en lugar de calificar toda la pieza.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para los nuevos comienzos y afirmaciones para la confianza (enlaces abajo, en inglés). Una pieza sin terminar puede seguir siendo un lugar de descubrimiento. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y no promete inspiración, reconocimiento ni ingresos creativos.',
  h1: 'Afirmaciones para la creatividad',
  directAnswer: [
    'Las afirmaciones para la creatividad son permisos breves para explorar una idea antes de decidir si es buena, como “Mi primer borrador puede hacer las preguntas que la versión final responderá”, una frase que le da un propósito al trabajo sin terminar.',
    'No sustituyen el apoyo profesional ni prometen inspiración, pero pueden ayudarte a separar el momento de crear del momento de juzgar.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca: lee una ante la página en blanco y haz después un boceto, una frase o una variación pequeña que todavía no necesite público.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la creatividad?',
      a: 'Son frases cortas que dan permiso para explorar una idea antes de decidir si es buena. No garantizan inspiración ni un resultado, pero ayudan a que crear y juzgar no ocupen el mismo instante.'
    },
    {
      q: '¿Qué afirmaciones puedo usar para la creatividad?',
      a: 'Frases que apoyan el comienzo incierto, por ejemplo: “Puedo hacer algo antes de saber cómo llamarlo.” “Una versión en borrador le da a mi idea un lugar donde desarrollarse.” Elige una que no te exija sentirte inspirada o inspirado por orden.'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Elige un punto de partida pequeño, como una frase sobre un objeto o el contorno de un boceto. Lee una afirmación, aparta una fuente de comparación y haz una versión en borrador sin corregirla. Al final, marca un detalle que podrías explorar después.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el malestar afecta tu día a día o tu salud, habla con un médico, un terapeuta o una línea de ayuda de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-deportistas',
  enSlug: 'affirmations-for-athletes',
  title: 'Afirmaciones para deportistas (2026): diálogo interno sereno más allá del marcador',
  shortTitle: 'Afirmaciones para deportistas',
  metaDescription: 'Afirmaciones para deportistas sobre la preparación, los errores y el valor más allá de los resultados, y un ejercicio de dos minutos con una señal familiar. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no garantizan marcas, victorias ni un lugar en el equipo. Son recordatorios breves para volver a la preparación, a una señal practicada y a la siguiente acción.',
    'El deporte hace que algunos resultados sean muy visibles: un tiempo, un marcador, una lista de selección, un puesto en el banquillo. Esos resultados importan dentro de la actividad, pero pueden empezar a sentirse como una valoración completa de la persona que los consigue. Una actuación decepcionante puede acompañarte a casa mucho después de que la sesión haya terminado.',
    'Durante la competición, repasar un error también puede competir con la tarea siguiente. Quizá sigues repitiendo la jugada fallida mientras la situación frente a ti ya cambió. Exigir certeza sobre el resultado final añade otro trabajo a un momento que ya pide mucha atención, y una señal familiar te da algo más inmediato con lo que trabajar.',
    'Las frases de abajo se centran en la preparación, en una valoración honesta y en la siguiente acción disponible en tu papel dentro del equipo o de la prueba. No piden ignorar los límites ni sustituir el plan de entrenamiento o la orientación profesional. Su propósito es que el diálogo interno siga siendo útil, para que un resultado difícil se pueda hablar y aprender de él en lugar de convertirse en un insulto hacia ti.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, por ejemplo antes de salir hacia el entrenamiento. Las frases de abajo también caben en una tarjeta dentro de tu bolsa de deporte, lista antes de guardar el móvil.'
  ],
  affirmations: [
    'Puedo devolver mi atención a la señal que practiqué.',
    'La última jugada es información, no una orden de entrar en pánico.',
    'Mi esfuerzo merece una valoración honesta, no un insulto.',
    'Puedo competir con entrega sin prometerme una victoria.',
    'Una decisión de selección no contiene toda mi vida deportiva.',
    'Puedo hacerle a mi entrenadora o entrenador una pregunta clara sobre qué trabajar.',
    'Puedo expresar una preocupación sin tratarla como una excusa.',
    'El descanso que forma parte de mi plan es algo que puedo respetar.',
    'El buen rendimiento de una compañera o un compañero no anula mi aportación.',
    'Puedo dejar el marcador en el recinto y seguir siendo una persona completa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos con una señal familiar',
    steps: [
      'Antes de la sesión, dedica medio minuto a nombrar una parte de tu papel a la que puedas prestar atención hoy. Elige algo que ya forme parte de tu preparación o de tu plan de entrenamiento.',
      'Lee una afirmación durante medio minuto y únela a una señal breve que ya hayas practicado, en lugar de añadir una instrucción técnica nueva.',
      'Usa el minuto final para escribir cuándo volverás a esa señal, por ejemplo después de un error o en una pausa prevista. Después guarda la nota y sigue tu preparación habitual.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la confianza y afirmaciones para la concentración (enlaces abajo, en inglés). Un resultado merece contexto, y la persona que lo consiguió merece cuidado. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y tampoco es asesoramiento deportivo ni sobre lesiones.',
  h1: 'Afirmaciones para deportistas',
  directAnswer: [
    'Las afirmaciones para deportistas son recordatorios breves para volver a la preparación, a una señal practicada y a la siguiente acción, en lugar de juzgarte por cada resultado, como “La última jugada es información, no una orden de entrar en pánico”, una frase que le da al error un papel más pequeño.',
    'No sustituyen el apoyo profesional ni prometen resultados deportivos, pero pueden ayudarte a mantener un diálogo interno más sereno antes y después de competir.',
    'Puedes leer las frases de esta página gratis, con o sin la app Anicca: elige una antes de entrenar o de competir y únela a una señal que ya uses.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para deportistas?',
      a: 'Son frases cortas centradas en la preparación, en la siguiente acción y en una valoración honesta del esfuerzo. No prometen victorias ni marcas, y siguen siendo útiles después de una sesión difícil.'
    },
    {
      q: '¿Qué afirmaciones puedo usar antes de competir?',
      a: 'Frases sobre tu parte en la siguiente acción, por ejemplo: “Puedo devolver mi atención a la señal que practiqué.” “Mi esfuerzo merece una valoración honesta, no un insulto.” Elige una antes del evento y únela a una parte familiar de tu preparación, breve para recordarla bajo presión.'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Nombra una parte de tu papel a la que prestar atención hoy, lee una afirmación y únela a una señal que ya practicaste. Escribe cuándo volverás a esa señal, por ejemplo después de un error, y sigue después tu preparación habitual.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento, y una frase nunca debe pasar por encima de tu plan de entrenamiento ni de la orientación profesional. Si algo te duele o te preocupa, dilo y busca apoyo profesional.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-la-depresion',
  enSlug: 'affirmations-for-depression',
  title: 'Afirmaciones para la depresión (2026): palabras suaves para días pesados y vacíos',
  shortTitle: 'Afirmaciones para la depresión',
  metaDescription: 'Afirmaciones breves y honestas para días pesados de depresión, y un ejercicio de dos minutos. Anicca es una app para iPhone, gratis de descargar y sin rachas. Una herramienta de apoyo, no un tratamiento médico.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no tratan la depresión ni sustituyen el apoyo profesional. Si el ánimo bajo persiste o empeora, consulta a un médico o a un terapeuta; y si estás en crisis o sientes que puedes hacerte daño, busca ayuda inmediata con los servicios de emergencia de tu zona o una línea de crisis.',
    'Un día con depresión suele encogerlo todo: levantarse, responder un mensaje y preparar comida pueden sentirse como montañas separadas. Eso no es pereza ni un defecto de carácter. El ánimo bajo agota la energía de la que dependen en silencio las tareas ordinarias, así que el mismo día cuesta mucho más que antes.',
    'El diálogo interno duro tiende a ocupar el espacio vacío. Frases como “todo el mundo lo está llevando bien” o “ya debería haber superado esto” pueden sonar a hechos cuando estás baja o bajo, pero son los síntomas hablando, no veredictos. Las afirmaciones por sí solas no levantarán una depresión; una frase breve y honesta aún puede darle a la voz interior un guion menos cruel para la próxima hora.',
    'Por eso las frases de abajo son pequeñas y creíbles, no consignas alegres. Una línea con la que no tengas que discutir, como “Hoy puede ser más pequeño que ayer”, pide mucho menos que sentirte bien por orden. Puedes leerla una vez, despacio, y dejar que el resto del día también sea más pequeño.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, para que el apoyo llegue sin que tengas que salir a buscarlo en un día en que buscar cualquier cosa ya cuesta. Es una herramienta de apoyo para la vida diaria, no un tratamiento médico. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Hoy puede ser más pequeño que ayer, y eso está permitido.',
    'Sentirme vacía o vacío es un estado en el que estoy, no un veredicto sobre quién soy.',
    'No tengo que sentirme mejor para merecer amabilidad hoy.',
    'Una cosa pequeña hecha despacio también cuenta.',
    'Descansar no es lo mismo que rendirse.',
    'Esta pesadez es real, y los estados cambian.',
    'Puedo responder un mensaje y dejar que el resto espere.',
    'Necesitar ayuda es información, no un fracaso.',
    'He sobrevivido a todos los días difíciles hasta ahora, también a los silenciosos que nadie vio.',
    'Puedo ser amable con la versión de mí que lo está pasando mal.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para un día pesado',
    steps: [
      'Encoge el día a propósito: nombra la única cosa siguiente más pequeña, como sentarte, beber agua o abrir una cortina. Todavía no existe nada después de eso.',
      'Elige una afirmación de la lista y léela una vez, despacio. Si te parece falsa, suavízala: “Estoy dispuesta o dispuesto a creer que hoy puede ser más pequeño.”',
      'Haz esa única cosa pequeña. Después detente y descansa sin puntuarte. Si el ánimo bajo dura semanas o empeora, trátalo como un motivo para buscar apoyo profesional, no como un fracaso personal.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para un día difícil y afirmaciones para una vida difícil (enlaces abajo, en inglés). Si los días bajos se vuelven insoportables, habla con alguien de confianza, con un médico o un terapeuta, o con una línea de crisis de tu zona; y en una crisis, busca ayuda inmediata. Anicca es una app de autocuidado, una herramienta de apoyo: esta página no sustituye el apoyo profesional y no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para la depresión',
  directAnswer: [
    'Cuando sientes depresión, las palabras que ayudan son pequeñas y creíbles: no consignas alegres, sino una línea honesta con la que no tengas que discutir, como “Hoy puede ser más pequeño que ayer”.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita, que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por los días perdidos. Puedes leer las frases de esta página gratis, con o sin la app.',
    'Anicca es una herramienta de apoyo para la vida diaria, no un tratamiento médico, y no sustituye la atención profesional. Si el ánimo bajo persiste o empeora, consulta a un médico, a un terapeuta o a alguien de confianza; y si te sientes en peligro, busca ayuda inmediata.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para la depresión?',
      a: 'Son frases cortas, modestas y creíbles para días pesados, que no exigen sentirte bien. No son un tratamiento para la depresión ni sustituyen la atención profesional; son una pequeña herramienta de autocuidado que puede suavizar por un rato el diálogo interno duro.'
    },
    {
      q: '¿Qué afirmaciones puedo usar en un día de depresión?',
      a: 'Frases lo bastante modestas para creerlas en un mal día, por ejemplo: “Hoy puede ser más pequeño que ayer, y eso está permitido.” “Sentirme vacía o vacío es un estado en el que estoy, no un veredicto sobre quién soy.” “No tengo que sentirme mejor para merecer amabilidad hoy.”'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Nombra la única cosa siguiente más pequeña, como sentarte o beber agua. Lee una afirmación una vez, despacio, y suavízala si te parece falsa. Haz esa cosa pequeña y después descansa sin puntuarte.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Anicca es una app de apoyo para el autocuidado, no un tratamiento médico, y no ofrece diagnóstico ni terapia. Si el ánimo bajo persiste, empeora o afecta tu capacidad de funcionar, busca apoyo profesional; y si te sientes en peligro o en crisis, busca ayuda inmediata con alguien de confianza, una línea de crisis o los servicios de emergencia de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-el-toc',
  enSlug: 'affirmations-for-ocd',
  title: 'Afirmaciones para el TOC (2026): palabras serenas para pensamientos intrusivos y bucles de búsqueda de seguridad',
  shortTitle: 'Afirmaciones para el TOC',
  metaDescription: 'Afirmaciones breves y serenas para los días difíciles del TOC y los pensamientos intrusivos en bucle, y un ejercicio de dos minutos. Anicca es una app para iPhone, gratis de descargar y sin rachas. Una herramienta de apoyo, no un tratamiento médico.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no tratan el TOC ni sustituyen el apoyo profesional ni la terapia. Si los pensamientos intrusivos o los bucles de comprobación se están apoderando de tu día, consulta a un médico o a un terapeuta; y si te sientes en crisis o en peligro, busca ayuda inmediata con los servicios de emergencia de tu zona o una línea de crisis.',
    'Un pensamiento intrusivo es no deseado y repetitivo, y la mente lo trata como urgente precisamente porque se siente incorrecto. Comprobar, repasar y buscar que alguien te tranquilice puede calmarlo un momento, pero después el bucle vuelve, a menudo más fuerte, porque el cerebro aprende que el pensamiento debía de ser importante si necesitó tanto trabajo.',
    'Ese bucle no es un defecto de carácter ni una señal de que el pensamiento sea verdad. Las afirmaciones por sí solas no tratarán el TOC, y discutir con un pensamiento línea por línea rara vez termina el bucle. Una frase breve y honesta aún puede darte un guion más sereno para los próximos minutos: observar el pensamiento, nombrarlo como un bucle y volver a lo que estabas haciendo.',
    'Por eso las frases de abajo no discuten con el pensamiento ni prometen certeza. Una línea como “Un pensamiento es un pensamiento; no es una instrucción” no intenta demostrar que el pensamiento se equivoca. Léela una vez, como un recordatorio, y no la repitas como un ritual para que el pensamiento desaparezca.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, para que una frase más serena llegue sin que tengas que buscarla en mitad de un bucle. Es una herramienta de apoyo para la vida diaria, no un tratamiento médico. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Un pensamiento es un pensamiento; no es una instrucción.',
    'Puedo observar este bucle sin obedecerlo.',
    'La incertidumbre es incómoda, y puedo dejar que esté ahí por ahora.',
    'No tengo que resolver este pensamiento para continuar mi día.',
    'Buscar seguridad calma el bucle un minuto; la paciencia lo calma más tiempo.',
    'Este impulso de comprobar subirá, llegará a un punto alto y pasará.',
    'Puedo hacer la siguiente cosa ordinaria mientras el pensamiento sigue hablando.',
    'Tener un pensamiento que asusta no me convierte en una persona que asusta.',
    'Tengo permiso para dejar esta pregunta sin responder por hoy.',
    'Puedo ser amable con la mente que intenta, con demasiado esfuerzo, mantenerme a salvo.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos cuando un pensamiento entra en bucle',
    steps: [
      'Nómbralo con sencillez: “Es el bucle otra vez.” Nombrar el patrón no es discutir con el contenido, y evita que trates el pensamiento como una prueba nueva.',
      'Elige una afirmación de la lista y léela una vez, despacio. No la repitas como un ritual para que el pensamiento desaparezca: léela una vez, como un recordatorio, y déjala estar.',
      'Vuelve a la siguiente cosa ordinaria que estabas haciendo. Si los pensamientos intrusivos o los rituales ocupan horas de tu día o empeoran, trátalo como un motivo para buscar apoyo profesional, no como un fracaso personal.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para la depresión y afirmaciones para un día difícil (enlaces abajo, en inglés). Si los pensamientos intrusivos o los bucles de comprobación se están apoderando de tus días, habla con alguien de confianza, con un médico o con un terapeuta; y en una crisis, busca ayuda inmediata. Anicca es una app de autocuidado, una herramienta de apoyo: esta página no sustituye el apoyo profesional ni la terapia, y no es consejo médico, diagnóstico ni tratamiento.',
  h1: 'Afirmaciones para el TOC',
  directAnswer: [
    'Cuando los pensamientos intrusivos entran en bucle, las palabras que ayudan son serenas y no discuten: una línea honesta que no intenta demostrar que el pensamiento se equivoca, como “Un pensamiento es un pensamiento; no es una instrucción”.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita, que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por los días perdidos. Puedes leer las frases de esta página gratis, con o sin la app.',
    'Anicca es una herramienta de apoyo para la vida diaria, no un tratamiento médico, y no sustituye la atención profesional ni la terapia. Si los pensamientos intrusivos o los bucles de comprobación se están apoderando de tu día, consulta a un médico, a un terapeuta o a alguien de confianza; y si te sientes en peligro, busca ayuda inmediata.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para el TOC?',
      a: 'Son frases cortas y serenas que no discuten con el pensamiento ni prometen certeza. No son un tratamiento para el TOC ni sustituyen la atención profesional o la terapia; son una pequeña herramienta de autocuidado que puede ayudarte por un rato a observar un bucle sin obedecerlo.'
    },
    {
      q: '¿Qué afirmaciones puedo usar para el TOC y los pensamientos intrusivos?',
      a: 'Frases que no discuten con el pensamiento ni prometen certeza, por ejemplo: “Un pensamiento es un pensamiento; no es una instrucción.” “Puedo observar este bucle sin obedecerlo.” “No tengo que resolver este pensamiento para continuar mi día.”'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Nombra el patrón con sencillez: “Es el bucle otra vez.” Lee una afirmación una vez, despacio, sin repetirla como un ritual para que el pensamiento desaparezca. Después vuelve a la siguiente cosa ordinaria que estabas haciendo.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Anicca es una app de apoyo para el autocuidado, no un tratamiento médico, y no ofrece diagnóstico ni terapia. Si los pensamientos intrusivos o los rituales están afectando tu vida, busca apoyo profesional; y si te sientes en peligro o abrumada o abrumado, busca ayuda inmediata con alguien de confianza, una línea de crisis o los servicios de emergencia de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-un-dia-dificil',
  enSlug: 'affirmations-for-a-hard-day',
  title: 'Afirmaciones para un día difícil (2026): palabras honestas para esta noche, después de un día que dolió',
  shortTitle: 'Afirmaciones para un día difícil',
  metaDescription: 'Afirmaciones breves y honestas para esta noche después de un día muy difícil, y un ejercicio de dos minutos para cerrar el día. Anicca es una app para iPhone, gratis de descargar y sin rachas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no arreglarán el día ni son un tratamiento. Son frases cortas y honestas que admiten que el día fue duro y aun así le permiten terminar.',
    'Un día difícil rara vez duele por un solo motivo. Se acumula: una conversación complicada, un error repetido toda la tarde, muy poco sueño la noche anterior y una mente que sigue puntuando el día mucho después de que haya terminado. Al anochecer el cuerpo está cansado y el comentario interior está en su punto más duro, que es justo cuando sus veredictos son menos fiables.',
    'Intentar recuperar el día por la noche suele salir al revés: más pantalla, más repetición, más promesas de ser otra persona mañana. Lo que ayuda, en cambio, es más pequeño: cerrar el día a propósito. Una frase breve y honesta le da a la mente una última oración distinta de la repetición que estaba a punto de reproducir otra vez.',
    'No tienes que resolver todo el día esta noche. Come algo, descansa y deja que una línea amable sea la última voz del día. Una frase como “Hoy fue duro, y hoy tiene permiso para terminar” no exige positividad: nombra lo que pasó y pone un borde al día.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, por ejemplo por la noche, la hora en que los días difíciles suelen repetirse en la cabeza. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Hoy fue duro, y hoy tiene permiso para terminar.',
    'Un día difícil es un día que tuve, no una vida en la que estoy atrapada o atrapado.',
    'No tengo que resolver hoy antes de tener permiso para descansar.',
    'El peor momento de hoy no es el resumen de hoy.',
    'Puedo sentir decepción y seguir estando de mi lado.',
    'Descansar esta noche forma parte de afrontar las cosas, no es una recompensa que deba ganarme.',
    'Mañana tendrá sus propias pruebas; no hereda el veredicto de esta noche.',
    'Sobreviví a este día al ritmo que tuve, no al ritmo que deseaba.',
    'Dejar que el día termine no es rendirme con mi vida.',
    'Este sentimiento es el clima de esta noche, y el clima pasa.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para cerrar un día difícil',
    steps: [
      'Nombra el día en una frase, en voz alta o en papel: “Hoy fue el día que pasó.” Nombrarlo como un solo día, con bordes, evita que se sienta como un para siempre.',
      'Elige una afirmación de la lista y léela una vez, despacio, como la última palabra sobre el día. Después haz una amabilidad ordinaria: agua, comida, una ducha o apagar la luz antes de lo habitual.',
      'Si la repetición vuelve en la cama, regresa a la misma línea en lugar de discutir con la repetición. Si los días difíciles se convierten en la mayoría de los días, trátalo como un motivo para hablar con alguien de confianza o con una profesional o un profesional.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para una vida difícil y afirmaciones para la depresión (enlaces abajo, en inglés). Sea como sea que haya ido hoy, no tienes que llevarte su veredicto al sueño. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el ánimo bajo, el agotamiento o la desesperanza duran semanas, afectan tu capacidad de funcionar o alguna vez se sienten inseguros, busca apoyo profesional o ayuda inmediata en una crisis.',
  h1: 'Afirmaciones para un día difícil',
  directAnswer: [
    'Después de un día difícil, las palabras que ayudan son honestas y cercanas al suelo: no un “mantén la positividad”, sino una línea que admite que el día fue duro y aun así le permite terminar, como “Hoy fue duro, y hoy tiene permiso para terminar”.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita, que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por los días perdidos. Puedes leer las frases de esta página gratis, con o sin la app.',
    'No tienes que arreglar todo el día esta noche. Come algo, descansa y deja que una línea amable sea la última voz del día. Si los días difíciles se están convirtiendo en la mayoría de los días, habla con alguien de confianza o con una profesional o un profesional.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para un día difícil?',
      a: 'Son frases cortas y honestas para cerrar el día a propósito, que admiten que fue duro sin exigir positividad. No arreglan el día ni son un tratamiento; le dan a la mente una última oración distinta de la repetición.'
    },
    {
      q: '¿Qué afirmaciones puedo usar después de un día difícil?',
      a: 'Frases lo bastante honestas para creerlas esta noche, por ejemplo: “Hoy fue duro, y hoy tiene permiso para terminar.” “Un día difícil es un día que tuve, no una vida en la que estoy atrapada o atrapado.” “No tengo que resolver hoy antes de tener permiso para descansar.”'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Nombra el día en una frase, en voz alta o en papel, para darle bordes. Lee una afirmación una vez, despacio, como la última palabra sobre el día. Después haz una amabilidad ordinaria: agua, comida, una ducha o apagar la luz antes.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el ánimo bajo, el agotamiento o la desesperanza duran semanas, afectan tu capacidad de funcionar o alguna vez se sienten inseguros, habla con alguien de confianza, con un médico, un terapeuta o una línea de crisis de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
},
{
  slug: 'afirmaciones-para-una-vida-dificil',
  enSlug: 'affirmations-for-a-hard-life',
  title: 'Afirmaciones para una vida difícil (2026): palabras honestas cuando la vida se siente insoportable',
  shortTitle: 'Afirmaciones para una vida difícil',
  metaDescription: 'Afirmaciones breves y honestas para una vida difícil, y un ejercicio de dos minutos para hoy. Anicca es una app para iPhone, gratis de descargar y sin rachas, que envía una línea amable a la hora que elijas.',
  whyItHappens: [
    'Transparencia: yo hago Anicca, una app de afirmaciones, así que no soy neutral. Lo primero: las afirmaciones no arreglarán una vida ni son un tratamiento. Son frases cortas y honestas que admiten que esta etapa es dura y aun así la separan de un para siempre.',
    'Una vida difícil rara vez se siente difícil por un solo motivo. Se acumula durante meses: presión por el dinero, un trabajo que agota, relaciones que duelen, una salud que no se estabiliza y pérdidas a las que nunca se les dio tiempo. Cuando los días difíciles dejan de tener huecos entre ellos, la mente empieza a llamar veredicto a la etapa —“así es mi vida ahora”—, que es justo cuando ese veredicto es menos fiable.',
    'Intentar arreglar una vida entera de una vez suele salir al revés: la lista es demasiado larga, así que nada se mueve, y la quietud se convierte en más pruebas. Lo que ayuda, en cambio, es más pequeño y más honesto: separar el hoy de un para siempre. Una frase breve que nombra esto como una etapa, no como un resumen, le da a la mente una oración distinta que cargar.',
    'No tienes que arreglar toda tu vida hoy. Da el siguiente paso ordinario: comida, descanso, una persona de confianza. Una línea como “Esta es una etapa difícil de mi vida, no toda mi vida” no dice que todo pasa por una razón: nombra la etapa y le devuelve sus bordes.',
    'Anicca es una app para iPhone, de descarga gratuita en App Store, con suscripción opcional y sin rachas, disponible en español. Envía una línea breve a la hora que elijas o cuando la necesitas, para que una frase más amable pueda llegar cada día, en mitad de una etapa difícil, sin que tengas que salir a buscarla. Las frases de abajo puedes usarlas con o sin la app.'
  ],
  affirmations: [
    'Esta es una etapa difícil de mi vida, no toda mi vida.',
    'Una vida difícil es una vida que estoy viviendo, no un veredicto sobre quién soy.',
    'No tengo que arreglar toda mi vida hoy; solo tengo que dar el siguiente paso de hoy.',
    'El capítulo más difícil hasta ahora no es el resumen del libro.',
    'Puedo lamentar lo que esta etapa me costó y seguir estando de mi lado.',
    'Descansar forma parte de atravesar una vida difícil, no es una recompensa por escapar de ella.',
    'Las etapas cambian, y esta no es una excepción.',
    'He sobrevivido a todos los días difíciles hasta ahora, al ritmo que tuve, no al ritmo que deseaba.',
    'Pedir ayuda forma parte de afrontar las cosas, no es la prueba de que fracasé en la vida.',
    'Hoy tendrá sus propias pruebas; no tiene que heredar el veredicto de ayer.'
  ],
  practice: {
    heading: 'Un ejercicio de dos minutos para una vida difícil, hoy',
    steps: [
      'Nombra la etapa en una frase, en voz alta o en papel: “Esta es una etapa difícil, y las etapas tienen bordes.” Nombrarla como una etapa, no como una condena de por vida, evita que se sienta como un para siempre.',
      'Elige una afirmación de la lista y léela una vez, despacio. Después haz una amabilidad ordinaria que hoy sí esté a tu alcance: agua, comida, una ducha, un paseo corto o apagar la luz antes de lo habitual.',
      'Si vuelve el veredicto de que tu vida nunca mejorará, regresa a la misma línea en lugar de discutir con él. Si el ánimo bajo, el agotamiento o la desesperanza persisten, afectan tu capacidad de funcionar o alguna vez se sienten inseguros, trátalo como un motivo para hablar con alguien de confianza o con una profesional o un profesional.'
    ]
  },
  closing: 'Guías relacionadas: afirmaciones para un día difícil y afirmaciones para la depresión (enlaces abajo, en inglés). Por dura que sea esta etapa, no tienes que cargar su veredicto como el resumen de tu vida. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si la vida alguna vez se siente insoportable o insegura, habla con alguien de confianza, con un médico o un terapeuta, o con una línea de crisis de tu zona, y busca ayuda inmediata en una crisis.',
  h1: 'Afirmaciones para una vida difícil',
  directAnswer: [
    'Cuando la vida se siente difícil todo el tiempo, las palabras que ayudan son honestas: no un “todo pasa por una razón”, sino una línea que admite que esta etapa es dura y aun así la separa de un para siempre, como “Esta es una etapa difícil de mi vida, no toda mi vida”.',
    'Anicca es una app de afirmaciones para iPhone, de descarga gratuita, que envía una línea breve a la hora que elijas o cuando la necesitas, sin rachas y sin culpa por los días perdidos. Puedes leer las frases de esta página gratis, con o sin la app.',
    'No tienes que arreglar toda tu vida hoy. Da el siguiente paso ordinario —comida, descanso, una persona de confianza— y deja que una línea amable cargue el día de hoy. Si la vida alguna vez se siente insoportable o insegura, habla con alguien de confianza, con un médico o un terapeuta, o con una línea de crisis de tu zona, y busca ayuda inmediata.'
  ],
  faq: [
    {
      q: '¿Qué son las afirmaciones para una vida difícil?',
      a: 'Son frases cortas y honestas para una etapa dura, que la nombran como una etapa y no como el resumen de una vida. No arreglan una vida ni son un tratamiento; le dan a la mente una oración distinta del veredicto que estaba a punto de repetir.'
    },
    {
      q: '¿Qué afirmaciones puedo usar para una vida difícil?',
      a: 'Frases lo bastante honestas para creerlas en una etapa difícil, por ejemplo: “Esta es una etapa difícil de mi vida, no toda mi vida.” “Una vida difícil es una vida que estoy viviendo, no un veredicto sobre quién soy.” “No tengo que arreglar toda mi vida hoy; solo tengo que dar el siguiente paso de hoy.”'
    },
    {
      q: '¿Cómo uso las afirmaciones en un ejercicio de dos minutos?',
      a: 'Nombra la etapa en una frase, en voz alta o en papel, para darle bordes. Lee una afirmación una vez, despacio. Después haz una amabilidad ordinaria que hoy esté a tu alcance: agua, comida, una ducha, un paseo corto o apagar la luz antes.'
    },
    {
      q: '¿Las afirmaciones sustituyen la ayuda profesional?',
      a: 'No. Esta página es texto de autocuidado para una app de afirmaciones; no es consejo médico, diagnóstico ni tratamiento. Si el ánimo bajo, el agotamiento o la desesperanza duran semanas, afectan tu capacidad de funcionar o alguna vez se sienten inseguros, busca ayuda inmediata con alguien de confianza, un médico, un terapeuta, una línea de crisis o los servicios de emergencia de tu zona.'
    }
  ],
  campaignPrefix: 'seo_es'
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

export type EsAffirmationFaq = EnAffirmationFaq;

/**
 * FAQ shown on every /affirmation-app/es/a/* page (visible + FAQPage JSON-LD).
 * Pages with a hand-written `faq` keep it; others get questions built only
 * from their own on-page content (no new claims).
 */
export function esAffirmationFaq(
  problem: EsAffirmationProblem,
): EsAffirmationFaq[] {
  if (problem.faq && problem.faq.length > 0) return problem.faq;
  const out: EsAffirmationFaq[] = [];
  const topic =
    problem.shortTitle.charAt(0).toLowerCase() + problem.shortTitle.slice(1);
  if (problem.affirmations.length >= 3) {
    const [a, b, c] = problem.affirmations;
    out.push({
      q: `¿Qué ${topic} puedo leer?`,
      a: `Las frases cortas y creíbles funcionan mejor, por ejemplo: “${a}” “${b}” “${c}” Elige una y léela despacio, una vez, en lugar de repetir una lista larga.`,
    });
  }
  if (problem.practice.steps.length > 0) {
    out.push({
      q: `¿Cómo uso ${topic} en unos dos minutos?`,
      a: problem.practice.steps.join(' '),
    });
  }
  out.push({
    q: '¿La app de afirmaciones Anicca es gratis?',
    a: 'Anicca se puede descargar gratis en la App Store para iPhone, con suscripciones opcionales dentro de la app. Los planes disponibles y los precios locales se muestran en la pantalla de compra. No hay rachas.',
  });
  return out;
}
