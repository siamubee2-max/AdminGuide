# MonAdmin

Assistant administratif IA pour seniors - Scannez vos courriers, comprenez tout simplement.

## Description

MonAdmin est une application mobile conçue pour aider les personnes âgées à comprendre et gérer leurs courriers administratifs. L'application utilise l'intelligence artificielle pour analyser les documents et les expliquer de manière simple.

## Fonctionnalités

### Accueil
- Salutation personnalisée selon l'heure de la journée
- Alerte des courriers en attente avec indication des urgents
- Accès rapide aux fonctions principales

### Scanner un courrier
- Capture photo de documents
- Analyse automatique par IA
- Détection du type, de l'urgence et des actions requises

### Résultat d'analyse
- Affichage clair du type de document et niveau d'urgence
- Explication simplifiée du contenu
- Actions recommandées
- Lecteur audio intégré avec deux modes :
  - **Courrier complet** : lecture mot pour mot du texte OCR extrait
  - **Résumé simplifié** : lecture du titre, explication et action à faire
- Animation d'ondes sonores pendant la lecture
- Arrêt automatique en quittant l'écran
- Options: répondre, rappeler, partager, archiver

### Mes documents
- Liste de tous les documents scannés
- Filtrage par catégorie (Santé, Énergie, Pension, Banque)
- Recherche textuelle et vocale
- Indicateurs visuels d'urgence

### Mode vocal
- Interface vocale pour poser des questions
- Commandes comme "Lis-moi mon dernier courrier"

### Pages légales et aide
- **FAQ** : Questions fréquentes organisées par catégorie avec accordéons interactifs
- **Politique de confidentialité** : Collecte, stockage, partage des données et droits RGPD
- **CGU** : Conditions générales d'utilisation en 9 articles
- Accessibles depuis Réglages > À propos

## Design

L'application suit un design "senior-friendly" avec:
- Textes grands et lisibles (police Nunito)
- Boutons larges (min 72px de hauteur)
- Couleurs à fort contraste
- Pas de gestes complexes requis
- Indicateurs d'urgence colorés (vert/orange/rouge)

## Structure technique

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Navigation par onglets
│   │   ├── index.tsx       # Écran d'accueil
│   │   ├── scanner.tsx     # Scanner de documents
│   │   └── documents.tsx   # Liste des documents
│   ├── resultat.tsx        # Résultat d'analyse
│   ├── vocal.tsx           # Mode vocal
│   ├── confidentialite.tsx # Politique de confidentialité
│   ├── cgu.tsx             # Conditions générales d'utilisation
│   ├── faq.tsx             # Questions fréquentes
│   └── _layout.tsx         # Layout racine
├── lib/
│   ├── state/
│   │   └── document-store.ts  # État Zustand
│   └── types.ts               # Types TypeScript
└── components/
```

## Catégories de documents

- Santé (mutuelle, médecin)
- Énergie (électricité, gaz)
- Pension (retraite)
- Banque (relevés, cartes)

## Niveaux d'urgence

- **Vert** - Pas urgent (à conserver)
- **Orange** - Cette semaine (action requise)
- **Rouge** - Urgent (action immédiate)
