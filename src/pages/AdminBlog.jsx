import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, blogPhotoUrl, slugify } from '../lib/supabase'
import { CATEGORIES_BLOG } from '../lib/categories.js'
import SiteHeader from '../components/SiteHeader.jsx'
import { useMeta } from '../lib/useMeta.js'

const VIDE = {
  id: null,
  slug: '',
  categorie: 'conseils',
  titre: '',
  titre_en: '',
  extrait: '',
  extrait_en: '',
  contenu: '',
  contenu_en: '',
  image: null,
  publie: false,
}

export default function AdminBlog() {
  const nav = useNavigate()
  useMeta({ titre: 'Admin — Blog', noindex: true })
  const [statut, setStatut] = useState('verification') // verification | refuse | pret
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [edite, setEdite] = useState(null) // article en cours d'édition, ou null

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return nav('/compte')
      const { data } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!data) { setStatut('refuse'); return }
      setStatut('pret')
      chargerArticles()
    })
  }, [nav])

  async function chargerArticles() {
    setLoading(true)
    const { data } = await supabase
      .from('articles')
      .select('id, slug, categorie, titre, publie, created_at')
      .order('created_at', { ascending: false })
    setArticles(data ?? [])
    setLoading(false)
  }

  async function supprimer(id) {
    if (!window.confirm('Supprimer définitivement cet article ?')) return
    await supabase.from('articles').delete().eq('id', id)
    chargerArticles()
  }

  if (statut === 'verification') {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <div className="chargement"><span className="spinner" />Vérification…</div>
        </div>
      </>
    )
  }

  if (statut === 'refuse') {
    return (
      <>
        <SiteHeader />
        <div className="page">
          <h1>Accès refusé</h1>
          <p className="sous-titre">Cette page est réservée aux administrateurs de Nsokoze.</p>
        </div>
      </>
    )
  }

  if (edite) {
    return (
      <EditeurArticle
        article={edite}
        onFini={() => { setEdite(null); chargerArticles() }}
      />
    )
  }

  return (
    <>
      <SiteHeader />
      <div className="page">
        <h1>Administration du blog</h1>
        <p className="sous-titre">
          {articles.length} article{articles.length > 1 ? 's' : ''} · {articles.filter((a) => a.publie).length} publié(s)
        </p>

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setEdite({ ...VIDE })}>+ Nouvel article</button>
        </div>

        <p style={{ marginBottom: 24 }}>
          <Link to="/admin/kpi" className="btn-lien">Voir le tableau de bord →</Link>
        </p>

        {loading && <div className="chargement"><span className="spinner" />Chargement…</div>}

        {!loading && articles.length === 0 && (
          <div className="vide">Aucun article pour l’instant. Créez le premier !</div>
        )}

        {articles.map((a) => (
          <div key={a.id} className="carte ligne">
            <span style={{ flex: 2 }}>
              <strong>{a.titre}</strong>
              <span className="sous-titre" style={{ margin: 0 }}>
                {' '}· {a.categorie} · {a.publie ? 'Publié' : 'Brouillon'}
              </span>
            </span>
            <button className="btn-lien" onClick={() => setEdite(a)}>Modifier</button>
            <button className="btn-lien" onClick={() => supprimer(a.id)}>Supprimer</button>
          </div>
        ))}

        <p style={{ marginTop: 24 }}>
          <Link to="/blog" className="btn-lien">Voir le blog public →</Link>
        </p>
      </div>
    </>
  )
}

function EditeurArticle({ article, onFini }) {
  const estNouveau = !article.id
  const [form, setForm] = useState({ ...VIDE, ...article })
  const [slugModifieManuellement, setSlugModifieManuellement] = useState(!estNouveau)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fichierRef = useRef(null)
  const [imageLocaleUrl, setImageLocaleUrl] = useState(null)

  // Chargement complet de l'article (l'éditeur peut être ouvert depuis
  // la liste allégée qui ne contient pas contenu/extrait/image).
  useEffect(() => {
    if (estNouveau) return
    supabase.from('articles').select('*').eq('id', article.id).single()
      .then(({ data }) => { if (data) setForm(data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function champ(k, v) {
    setForm((f) => ({ ...f, [k]: v }))
    if (k === 'titre' && !slugModifieManuellement) {
      setForm((f) => ({ ...f, titre: v, slug: slugify(v) }))
    }
  }

  async function choisirImage(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('Le fichier choisi n’est pas une image.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
      const chemin = `${user.id}/${crypto.randomUUID()}.${ext}`
      const { error: err } = await supabase.storage
        .from('blog-photos')
        .upload(chemin, f, { contentType: f.type, cacheControl: '31536000' })
      if (err) throw err
      setForm((prev) => ({ ...prev, image: chemin }))
      setImageLocaleUrl(URL.createObjectURL(f))
    } catch (ex) {
      setError('Envoi de l’image impossible. ' + (ex.message ?? ex))
    }
    setBusy(false)
  }

  async function enregistrer(publie) {
    setBusy(true)
    setError(null)
    const payload = { ...form, publie, updated_at: new Date().toISOString() }
    delete payload.id
    let res
    if (estNouveau) {
      res = await supabase.from('articles').insert(payload).select().single()
    } else {
      res = await supabase.from('articles').update(payload).eq('id', form.id).select().single()
    }
    setBusy(false)
    if (res.error) {
      setError(
        res.error.message.includes('slug')
          ? 'Ce lien (slug) est déjà utilisé par un autre article. Modifiez-le.'
          : 'Enregistrement impossible. ' + res.error.message
      )
      return
    }
    onFini()
  }

  const imageAffichee = imageLocaleUrl || (form.image ? blogPhotoUrl(form.image) : null)

  return (
    <>
      <SiteHeader />
      <div className="page" style={{ maxWidth: 720 }}>
        <p className="sous-titre" style={{ marginBottom: 4 }}>
          <button className="btn-lien" onClick={onFini}>← Retour à la liste</button>
        </p>
        <h1>{estNouveau ? 'Nouvel article' : 'Modifier l’article'}</h1>

        <div className="carte">
          <label>Catégorie</label>
          <select value={form.categorie} onChange={(e) => champ('categorie', e.target.value)}>
            {CATEGORIES_BLOG.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>

          <label htmlFor="ab-titre">Titre (français)</label>
          <input id="ab-titre" value={form.titre} onChange={(e) => champ('titre', e.target.value)} placeholder="5 astuces pour entretenir vos tresses" />

          <label htmlFor="ab-titre-en">Titre (anglais, optionnel)</label>
          <input id="ab-titre-en" value={form.titre_en ?? ''} onChange={(e) => champ('titre_en', e.target.value)} placeholder="5 tips to care for your braids" />

          <label htmlFor="ab-slug">Lien de l’article</label>
          <input
            id="ab-slug"
            value={form.slug}
            onChange={(e) => { setSlugModifieManuellement(true); champ('slug', slugify(e.target.value)) }}
          />
          <p className="aide-champ">nsokoze.bi/blog/{form.slug || '…'}</p>

          <label htmlFor="ab-extrait">Extrait (français)</label>
          <textarea id="ab-extrait" rows={2} maxLength={220} value={form.extrait ?? ''} onChange={(e) => champ('extrait', e.target.value)} placeholder="Résumé court affiché dans la liste du blog." />

          <label htmlFor="ab-extrait-en">Extrait (anglais, optionnel)</label>
          <textarea id="ab-extrait-en" rows={2} maxLength={220} value={form.extrait_en ?? ''} onChange={(e) => champ('extrait_en', e.target.value)} />

          <label htmlFor="ab-contenu">Contenu (français)</label>
          <textarea id="ab-contenu" rows={10} value={form.contenu} onChange={(e) => champ('contenu', e.target.value)} placeholder="Rédigez l’article. Séparez les paragraphes par une ligne vide." />

          <label htmlFor="ab-contenu-en">Contenu (anglais, optionnel)</label>
          <textarea id="ab-contenu-en" rows={10} value={form.contenu_en ?? ''} onChange={(e) => champ('contenu_en', e.target.value)} />

          <label>Image de couverture</label>
          {imageAffichee && (
            <img src={imageAffichee} alt="" style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 10 }} />
          )}
          <button type="button" className="btn-secondaire" disabled={busy} onClick={() => fichierRef.current?.click()}>
            {form.image ? 'Changer l’image' : 'Ajouter une image'}
          </button>
          <input ref={fichierRef} type="file" accept="image/*" hidden onChange={choisirImage} />

          {error && <p className="erreur">{error}</p>}

          <div className="ligne" style={{ marginTop: 18 }}>
            <button
              type="button"
              className="btn-secondaire"
              disabled={busy || !form.titre || !form.slug || !form.contenu}
              onClick={() => enregistrer(false)}
            >
              Enregistrer le brouillon
            </button>
            <button
              type="button"
              disabled={busy || !form.titre || !form.slug || !form.contenu}
              onClick={() => enregistrer(true)}
            >
              {busy ? 'Enregistrement…' : 'Publier'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
