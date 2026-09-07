// Catégories de prestations — textes rédigés spécialement pour Nsokoze
// (contenu original FR + EN, adapté au Burundi).

export const CATEGORIES = [
  {
    slug: 'coiffure',
    nom: 'Coiffure',
    nom_en: 'Hair',
    titre: 'Réserver en ligne un RDV avec un coiffeur',
    titre_en: 'Book a hair appointment online',
    accent: '#a3671f',
    teinte: '#f6efe5',
    qDefaut: 'coiffure',
    sousCategories: [
      { nom: 'Tresses & nattes', nom_en: 'Braids & plaits', q: 'tresses', photo: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Coiffure femme', nom_en: 'Women’s hair', q: 'coiffure femme', photo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Coiffure homme', nom_en: 'Men’s hair', q: 'coiffure homme', photo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=60' },
    ],
    intro:
      'Entre le travail, la famille et les imprévus, trouver le temps de passer au salon relève parfois du défi. Avec Nsokoze, vous repérez un salon de coiffure près de chez vous, vous comparez les prestations et leurs prix en francs burundais, puis vous bloquez votre créneau en quelques secondes — le tout sans passer un seul appel.',
    intro_en:
      'Between work, family and life’s surprises, finding time for the salon can be a challenge. With Nsokoze you spot a hair salon near you, compare services and their prices in Burundian francs, then lock in your slot in seconds — without making a single phone call.',
    sections: [
      {
        titre: 'Tresses & nattes',
        titre_en: 'Braids & plaits',
        paragraphes: [
          'Box braids, nattes collées, twists, crochets ou vanilles : le tressage est un art qui demande du temps et un vrai savoir-faire. Réserver à l’avance vous garantit que la tresseuse vous consacre les heures nécessaires, sans file d’attente ni déplacement inutile.',
          'Sur Nsokoze, chaque salon affiche la durée estimée et le tarif de ses modèles de tresses. Vous choisissez votre style, votre jour et votre heure — et vous arrivez au salon l’esprit tranquille.',
        ],
        paragraphes_en: [
          'Box braids, cornrows, twists, crochet or vanilla braids: braiding is an art that takes time and real skill. Booking ahead guarantees your braider sets aside the hours you need — no queueing, no wasted trip.',
          'On Nsokoze, every salon lists the estimated duration and price of its braid styles. Pick your style, your day and your time — and walk into the salon with peace of mind.',
        ],
      },
      {
        titre: 'Coiffure femme',
        titre_en: 'Women’s hair',
        paragraphes: [
          'Brushing pour une cérémonie, défrisage, coloration, soin profond ou coupe de rafraîchissement : votre coiffeuse vous conseille selon la nature de vos cheveux et l’occasion.',
          'En réservant en ligne, vous évitez les heures de pointe du samedi et vous êtes certaine d’être attendue. En cas d’empêchement, le numéro du salon est sous la main pour prévenir.',
        ],
        paragraphes_en: [
          'A blow-dry for a ceremony, relaxing, colouring, a deep treatment or a refresh cut: your stylist advises you based on your hair type and the occasion.',
          'Booking online means skipping the Saturday rush and being sure you’re expected. If something comes up, the salon’s number is right there to let them know.',
        ],
      },
      {
        titre: 'Coiffure homme',
        titre_en: 'Men’s hair',
        paragraphes: [
          'Coupe classique, dégradé net ou entretien régulier : quelques minutes bien placées dans la journée suffisent, à condition de ne pas patienter derrière cinq autres clients.',
          'Choisissez votre créneau sur Nsokoze et passez au salon à l’heure exacte — idéal entre deux rendez-vous ou à la sortie du travail.',
        ],
        paragraphes_en: [
          'A classic cut, a sharp fade or regular upkeep: a few well-placed minutes in your day are enough — as long as you’re not waiting behind five other clients.',
          'Pick your slot on Nsokoze and show up at the exact time — perfect between meetings or straight after work.',
        ],
      },
    ],
  },
  {
    slug: 'barbier',
    nom: 'Barbier',
    nom_en: 'Barber',
    titre: 'Réserver en ligne un RDV chez le barbier',
    titre_en: 'Book a barber appointment online',
    accent: '#33506b',
    teinte: '#e9edf2',
    qDefaut: 'barbier coupe homme',
    sousCategories: [
      { nom: 'Coupe & dégradé', nom_en: 'Cut & fade', q: 'coupe homme', photo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Taille de barbe', nom_en: 'Beard trim', q: 'barbe', photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Soins pour homme', nom_en: 'Men’s grooming', q: 'soin homme', photo: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=800&q=60' },
    ],
    intro:
      'Le barbier, c’est plus qu’une coupe : c’est un moment pour soi. Repérez les meilleurs barbiers de Bujumbura et d’ailleurs, regardez leurs prestations et réservez le créneau qui s’insère dans votre journée.',
    intro_en:
      'The barbershop is more than a haircut: it’s time for yourself. Find the best barbers in Bujumbura and beyond, browse their services and book the slot that fits your day.',
    sections: [
      {
        titre: 'Coupe & dégradé',
        titre_en: 'Cut & fade',
        paragraphes: [
          'Un dégradé propre se joue au millimètre. Les barbiers présents sur Nsokoze détaillent leurs coupes — classique, dégradé américain, contours travaillés — avec leur durée et leur prix.',
          'Fini l’attente sur le banc du salon : votre créneau est réservé, la tondeuse vous attend.',
        ],
        paragraphes_en: [
          'A clean fade is a matter of millimetres. Barbers on Nsokoze detail their cuts — classic, taper fade, sharp edges — with duration and price.',
          'No more waiting on the salon bench: your slot is booked and the clippers are ready.',
        ],
      },
      {
        titre: 'Taille de barbe',
        titre_en: 'Beard trim',
        paragraphes: [
          'Ligne de joue nette, moustache égalisée, barbe sculptée à la forme du visage : la taille de barbe est une prestation à part entière, souvent combinable avec la coupe.',
          'Réservez les deux d’un coup et ressortez impeccable en une seule visite.',
        ],
        paragraphes_en: [
          'A crisp cheek line, an even moustache, a beard sculpted to your face shape: the beard trim is a service in its own right, often combined with a cut.',
          'Book both at once and walk out sharp after a single visit.',
        ],
      },
    ],
  },
  {
    slug: 'manucure',
    nom: 'Manucure',
    nom_en: 'Nails',
    titre: 'Réserver en ligne un RDV manucure',
    titre_en: 'Book a nail appointment online',
    accent: '#a2496f',
    teinte: '#f8ebf1',
    qDefaut: 'manucure ongles',
    sousCategories: [
      { nom: 'Manucure', nom_en: 'Manicure', q: 'manucure', photo: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Pédicure', nom_en: 'Pedicure', q: 'pedicure', photo: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Pose d’ongles & vernis', nom_en: 'Nail extensions & polish', q: 'vernis pose ongles', photo: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=800&q=60' },
    ],
    intro:
      'Des mains soignées se remarquent au premier regard. Onglerie de quartier ou institut, trouvez sur Nsokoze le spécialiste qui prendra soin de vos ongles, au prix affiché et à l’heure qui vous convient.',
    intro_en:
      'Well-kept hands get noticed at first glance. Neighbourhood nail bar or institute — find the specialist who will care for your nails on Nsokoze, at the displayed price and at a time that suits you.',
    sections: [
      {
        titre: 'Manucure',
        titre_en: 'Manicure',
        paragraphes: [
          'Limage, soin des cuticules, polissage puis mise en beauté : la manucure redonne aux mains un aspect net et soigné, que vous choisissiez un fini naturel ou une couleur audacieuse.',
          'Sur Nsokoze, vous voyez d’un coup d’œil les prestations de chaque onglerie et vous réservez le créneau qui s’accorde à votre emploi du temps.',
        ],
        paragraphes_en: [
          'Filing, cuticle care, buffing, then the finishing touch: a manicure gives hands a clean, polished look, whether you go natural or bold.',
          'On Nsokoze you can see each nail bar’s services at a glance and book the slot that fits your schedule.',
        ],
      },
      {
        titre: 'Pédicure',
        titre_en: 'Pedicure',
        paragraphes: [
          'La pédicure allie soin et détente : bain de pieds, gommage, traitement des zones sèches et pose de vernis si vous le souhaitez.',
          'Un rendez-vous régulier garde vos pieds en pleine forme — particulièrement appréciable sous le climat de Bujumbura, où les sandales sont de sortie toute l’année.',
        ],
        paragraphes_en: [
          'A pedicure combines care and relaxation: foot bath, scrub, treatment of dry areas, and polish if you like.',
          'A regular appointment keeps your feet in great shape — especially welcome in Bujumbura’s climate, where sandals are out all year round.',
        ],
      },
      {
        titre: 'Pose d’ongles & vernis semi-permanent',
        titre_en: 'Nail extensions & gel polish',
        paragraphes: [
          'Gel, capsules, ou vernis semi-permanent qui tient plusieurs semaines : les techniques de pose se sont perfectionnées et demandent une vraie expertise.',
          'Vérifiez les modèles proposés par le salon, la durée de la pose et son tarif en BIF avant de réserver — aucune surprise à l’arrivée.',
        ],
        paragraphes_en: [
          'Gel, tips, or semi-permanent polish that lasts for weeks: application techniques have come a long way and require real expertise.',
          'Check the styles the salon offers, the application time and the price in BIF before booking — no surprises on arrival.',
        ],
      },
    ],
  },
  {
    slug: 'institut-de-beaute',
    nom: 'Institut de beauté',
    nom_en: 'Beauty institute',
    titre: 'Réserver en ligne un RDV en institut de beauté',
    titre_en: 'Book a beauty institute appointment online',
    accent: '#7a4f8a',
    teinte: '#f3ecf6',
    qDefaut: 'soin visage épilation maquillage',
    sousCategories: [
      { nom: 'Soins du visage', nom_en: 'Facials', q: 'soin visage', photo: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Épilation', nom_en: 'Hair removal', q: 'epilation', photo: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Maquillage', nom_en: 'Makeup', q: 'maquillage', photo: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=800&q=60' },
    ],
    intro:
      'Prendre rendez-vous en institut, c’est s’offrir une parenthèse : un soin adapté à votre peau, une épilation bien faite ou un maquillage de fête réalisé par une professionnelle. Nsokoze réunit les instituts près de chez vous et leurs prestations détaillées.',
    intro_en:
      'Booking at a beauty institute means giving yourself a break: a treatment suited to your skin, a proper hair removal session or party makeup done by a professional. Nsokoze gathers the institutes near you with their detailed services.',
    sections: [
      {
        titre: 'Soins du visage',
        titre_en: 'Facials',
        paragraphes: [
          'Nettoyage de peau, gommage, masque hydratant ou soin éclat : l’esthéticienne analyse votre peau et adapte le protocole à ses besoins réels — sécheresse, excès de sébum, teint fatigué.',
          'Un soin régulier entretient la peau bien mieux qu’une routine improvisée. Réservez votre séance au calme, à l’heure qui vous arrange.',
        ],
        paragraphes_en: [
          'Deep cleansing, scrub, hydrating mask or glow treatment: the beautician analyses your skin and adapts the protocol to what it really needs — dryness, excess oil, tired complexion.',
          'Regular treatments care for your skin far better than an improvised routine. Book your session in peace, at a time that works for you.',
        ],
      },
      {
        titre: 'Épilation',
        titre_en: 'Hair removal',
        paragraphes: [
          'À la cire ou au fil, en cabine propre et avec du matériel à usage unique : l’épilation en institut est plus durable et plus nette que le rasoir.',
          'Les instituts sur Nsokoze affichent leurs zones et leurs tarifs — sourcils, aisselles, jambes complètes — pour composer votre séance sans mauvaise surprise.',
        ],
        paragraphes_en: [
          'Wax or thread, in a clean room with single-use equipment: salon hair removal lasts longer and looks neater than the razor.',
          'Institutes on Nsokoze list their areas and prices — brows, underarms, full legs — so you can build your session with no bad surprises.',
        ],
      },
      {
        titre: 'Maquillage',
        titre_en: 'Makeup',
        paragraphes: [
          'Mariage, dot, remise de diplôme ou shooting photo : un maquillage professionnel tient toute la journée et met en valeur votre carnation.',
          'Réservez votre mise en beauté à l’avance, surtout en saison des mariages où les créneaux du samedi partent vite.',
        ],
        paragraphes_en: [
          'A wedding, a dowry ceremony, a graduation or a photo shoot: professional makeup lasts all day and flatters your skin tone.',
          'Book your beauty session ahead of time — especially in wedding season, when Saturday slots go fast.',
        ],
      },
    ],
  },
  {
    slug: 'bien-etre',
    nom: 'Bien-être',
    nom_en: 'Wellness',
    titre: 'Réserver en ligne un RDV bien-être',
    titre_en: 'Book a wellness appointment online',
    accent: '#5b7d46',
    teinte: '#ecf1e6',
    qDefaut: 'massage spa',
    sousCategories: [
      { nom: 'Massage relaxant', nom_en: 'Relaxing massage', q: 'massage relaxant', photo: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Spa & hammam', nom_en: 'Spa & hammam', q: 'spa hammam', photo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=60' },
      { nom: 'Massage sportif', nom_en: 'Sports massage', q: 'massage sportif', photo: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=60' },
    ],
    intro:
      'Le stress s’accumule sans prévenir ; le relâcher se programme. Salons de massage, spas et espaces bien-être du Burundi vous accueillent sur rendez-vous : choisissez votre soin, votre durée et votre créneau, Nsokoze s’occupe du reste.',
    intro_en:
      'Stress builds up without warning; letting it go can be scheduled. Massage salons, spas and wellness spaces across Burundi welcome you by appointment: choose your treatment, your duration and your slot — Nsokoze handles the rest.',
    sections: [
      {
        titre: 'Massage relaxant',
        titre_en: 'Relaxing massage',
        paragraphes: [
          'Une heure de massage aux huiles suffit souvent à dénouer les épaules, calmer le mental et retrouver un sommeil de qualité. Les gestes lents et enveloppants du praticien relancent la circulation et relâchent les tensions installées.',
          'Sur Nsokoze, vous comparez les durées (30, 60 ou 90 minutes) et les tarifs des salons de massage près de chez vous, puis vous réservez l’horaire qui vous permet d’en profiter sans regarder votre montre.',
        ],
        paragraphes_en: [
          'An hour of oil massage is often enough to loosen the shoulders, quiet the mind and restore proper sleep. The practitioner’s slow, enveloping strokes boost circulation and release built-up tension.',
          'On Nsokoze you compare durations (30, 60 or 90 minutes) and prices of massage salons near you, then book a time that lets you enjoy it without watching the clock.',
        ],
      },
      {
        titre: 'Spa & hammam',
        titre_en: 'Spa & hammam',
        paragraphes: [
          'Vapeur chaude, gommage du corps et moment de repos : le rituel du hammam nettoie la peau en profondeur et procure une détente durable.',
          'Seule, en couple ou entre amies, réservez votre passage au spa à l’avance pour être sûre de la disponibilité, surtout le week-end.',
        ],
        paragraphes_en: [
          'Hot steam, a full-body scrub and a moment of rest: the hammam ritual deep-cleans the skin and leaves a lasting sense of calm.',
          'Alone, as a couple or with friends, book your spa visit ahead to be sure of availability — especially at weekends.',
        ],
      },
      {
        titre: 'Massage sportif',
        titre_en: 'Sports massage',
        paragraphes: [
          'Après l’effort, les muscles ont besoin d’aide pour récupérer. Le massage sportif cible les zones sollicitées, réduit les courbatures et prévient les blessures.',
          'Footballeurs du dimanche, coureurs du bord du lac ou sportifs réguliers : un rendez-vous après votre séance d’entraînement fait toute la différence.',
        ],
        paragraphes_en: [
          'After a workout, muscles need help to recover. Sports massage targets the areas you worked, eases soreness and helps prevent injury.',
          'Sunday footballers, lakeside runners or regular athletes: an appointment after your training session makes all the difference.',
        ],
      },
    ],
  },
]

export function categorieParSlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) ?? null
}
