import { useParams } from 'react-router-dom'
import { useMeta } from '../lib/useMeta.js'
import { CONTACT, DELAI_ANNULATION_H } from '../lib/config.js'
import SiteHeader from '../components/SiteHeader.jsx'
import SiteFooter from '../components/SiteFooter.jsx'
import NotFound from './NotFound.jsx'

// Textes juridiques en français (langue de référence).
// ⚠ Modèles à faire relire par un juriste avant la mise en ligne, et à
// compléter avec les informations de src/lib/config.js.
const MAJ = '7 octobre 2026'

const PAGES = {
  'mentions-legales': {
    titre: 'Mentions légales',
    sections: [
      ['Éditeur du site', [
        `Le site Nsokoze est édité par ${CONTACT.editeur}, ${CONTACT.adresse_editeur}.`,
        `Responsable de la publication : ${CONTACT.responsable_publication}.`,
        `Contact : ${CONTACT.email} — WhatsApp ${CONTACT.whatsapp}.`,
      ]],
      ['Hébergement', [
        `Site : ${CONTACT.hebergeur}.`,
        'Base de données et authentification : Supabase, Inc. [adresse et région d’hébergement du projet à compléter].',
      ]],
      ['Propriété intellectuelle', [
        'Les textes, logos et éléments graphiques de Nsokoze sont protégés. Les photos et descriptions des salons restent la propriété de leurs auteurs, qui garantissent en détenir les droits.',
      ]],
    ],
  },

  cgu: {
    titre: 'Conditions générales d’utilisation',
    sections: [
      ['Objet', [
        'Nsokoze met en relation des clientes et clients avec des salons de coiffure et de beauté au Burundi, et fournit aux salons un agenda de réservation en ligne. Nsokoze n’est pas partie au contrat de prestation conclu entre la cliente et le salon.',
      ]],
      ['Compte', [
        'Réserver nécessite un compte. Vous vous engagez à fournir un nom et un numéro de téléphone exacts : le salon les utilise pour vous recevoir et vous contacter.',
        'Vous êtes responsable de la confidentialité de votre mot de passe.',
      ]],
      ['Réservations et annulations', [
        'Une réservation confirmée engage la cliente à se présenter à l’heure. Le prix affiché est indicatif ; le salon reste seul responsable de ses tarifs et de ses prestations.',
        `Une réservation peut être annulée en ligne jusqu’à ${DELAI_ANNULATION_H} heures avant le rendez-vous, depuis « Mon compte ». Passé ce délai, contactez directement le salon.`,
        'Pour éviter les abus, le nombre de rendez-vous à venir par compte est limité. Les absences répétées peuvent entraîner la suspension du compte.',
      ]],
      ['Salons', [
        'Le gérant garantit l’exactitude des informations de son salon (nom, adresse, horaires, prix, photos) et honore les rendez-vous qu’il reçoit, ou prévient la cliente en cas d’empêchement.',
      ]],
      ['Avis', [
        'Seule une cliente ayant eu un rendez-vous peut laisser un avis sur un salon. Les avis injurieux, diffamatoires ou sans rapport avec la prestation peuvent être supprimés.',
      ]],
      ['Responsabilité', [
        'Nsokoze s’efforce d’assurer la disponibilité du service mais ne peut garantir l’absence d’interruption. Nsokoze ne saurait être tenu responsable de la qualité des prestations réalisées par les salons.',
      ]],
      ['Droit applicable', [
        'Les présentes conditions sont soumises au droit burundais.',
      ]],
    ],
  },

  confidentialite: {
    titre: 'Politique de confidentialité',
    sections: [
      ['Données collectées', [
        'Compte : adresse email et mot de passe (chiffré, jamais visible par Nsokoze).',
        'Profil : nom et numéro de téléphone, transmis au salon chez qui vous réservez.',
        'Rendez-vous : salon, prestation, date et statut ; avis que vous publiez (seul votre prénom est affiché).',
        'Salons : informations de l’établissement, photos, horaires, prestations et agenda.',
      ]],
      ['Pourquoi', [
        'Gérer votre compte et vos réservations, permettre au salon de vous recevoir et de vous contacter (appel, SMS, WhatsApp), produire des statistiques globales et anonymes.',
        'Nsokoze ne vend pas vos données et ne les utilise pas à des fins publicitaires.',
      ]],
      ['Qui y a accès', [
        'Le salon chez qui vous réservez voit votre nom, votre téléphone et l’historique de vos rendez-vous chez lui — jamais ceux pris dans d’autres salons.',
        'Les autres visiteurs ne voient que les créneaux occupés, sans aucun nom.',
        'Nos sous-traitants techniques (Supabase pour la base de données, l’hébergeur du site) traitent les données pour notre compte.',
      ]],
      ['Durée de conservation', [
        'Vos données sont conservées tant que votre compte existe. Vous pouvez le supprimer à tout moment depuis « Mon compte » : votre profil, votre salon éventuel et son agenda sont alors effacés.',
      ]],
      ['Vos droits', [
        `Vous pouvez consulter, corriger ou supprimer vos données, ou poser toute question, en écrivant à ${CONTACT.email}.`,
      ]],
      ['Stockage local', [
        'Le site enregistre dans votre navigateur votre langue préférée et votre session de connexion. Aucun cookie publicitaire ni traceur tiers n’est utilisé.',
      ]],
    ],
  },
}

export default function Legal() {
  const { page } = useParams()
  const contenu = PAGES[page]
  useMeta({ titre: contenu?.titre, noindex: !contenu })

  if (!contenu) return <NotFound />

  return (
    <>
      <SiteHeader />
      <div className="page page-texte">
        <h1>{contenu.titre}</h1>
        <p className="aide-champ">Dernière mise à jour : {MAJ}</p>
        {contenu.sections.map(([titre, paragraphes]) => (
          <section key={titre}>
            <h2>{titre}</h2>
            {paragraphes.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
      </div>
      <SiteFooter />
    </>
  )
}
