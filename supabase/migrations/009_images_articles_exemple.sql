-- ============================================================
-- Nsokoze — migration 009 : images de couverture pour les articles
-- d'exemple créés dans la migration 008.
-- Facultatif : à exécuter une fois après la migration 008.
--
-- Les images sont des URLs externes (Unsplash), stockées ici en
-- clair dans la colonne "image" — le composant blogPhotoUrl()
-- détecte les URLs déjà complètes et les retourne telles quelles.
-- ============================================================

update articles set image = 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=60'
  where slug = 'entretenir-ses-tresses';

update articles set image = 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=60'
  where slug = 'bien-choisir-son-salon';

update articles set image = 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=60'
  where slug = 'nsokoze-nouvelles-fonctionnalites';

update articles set image = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=900&q=60'
  where slug = 'portrait-chez-keny';

update articles set image = 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=60'
  where slug = 'preparer-mariage-planning-beaute';

update articles set image = 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=900&q=60'
  where slug = 'devenir-partenaire-nsokoze';
