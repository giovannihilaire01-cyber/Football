# GitHub Pages Setup et Accès

## 🎮 Accéder au Simulateur

Le simulateur est déployé automatiquement sur GitHub Pages à cette adresse:

**URL**: `https://giovannihilaire01-cyber.github.io/Football/`

## 🚀 Configuration Automatique

Le projet utilise GitHub Actions pour déployer automatiquement:

1. **Chaque push sur `main`** déclenche le workflow
2. Le code est **construit** avec `npm run build`
3. Les fichiers sont **déployés** sur la branche `gh-pages`
4. Le site est **accessible** dans les 1-2 minutes

## 📋 Configuration Manuelle (si nécessaire)

Si le déploiement automatique ne fonctionne pas:

1. Va dans les **paramètres du repo** (Settings)
2. Va à **Pages** (sur la gauche)
3. Sélectionne `gh-pages` comme source
4. Sélectionne `/(root)` comme répertoire
5. Clique **Save**

## ✅ Statut du Déploiement

Pour vérifier le statut:

1. Va dans l'onglet **Actions** du repo
2. Vérifie que le workflow "Deploy to GitHub Pages" est **réussi** (checkmark ✓)
3. Si vous voyez une croix rouge (✗), clique pour voir les détails de l'erreur

## 🎯 Fonctionnalités du Simulateur

Une fois le site chargé:

- **Vue Aérienne** du terrain de football
- **2 équipes** de 11 joueurs avec IA
- **Physique réaliste** du ballon
- **Détection de but** automatique
- **Contrôles**: Flèches directionnelles pour déplacer les joueurs

## 🔧 Développement Local

Pour tester en local avant le déploiement:

```bash
npm install
npm run dev
# Visite http://localhost:5173
```

## 📦 Build et Test Avant Déploiement

```bash
npm run build
npm run preview
# Vérifie que le fichier dist/ s'ouvre correctement
```

## 🐛 Troubleshooting

### Le site ne charge pas
- Attends 2-3 minutes après un push
- Vide le cache du navigateur (Ctrl+Shift+Delete)
- Essaie avec un navigateur différent

### Les assets ne se chargent pas
- Le fichier `.nojekyll` est présent (empêche Jekyll de traiter les fichiers)
- Vérifiez la URL de base dans `vite.config.ts` : doit être `/Football/`

### Le site charge mais est vide/noir
- Ouvre la console du navigateur (F12)
- Cherche les erreurs en rouge
- Vérifie les chemins des fichiers dans les assets

## 🔗 Liens Utiles

- **Repo**: https://github.com/giovannihilaire01-cyber/Football
- **Pages Settings**: https://github.com/giovannihilaire01-cyber/Football/settings/pages
- **Actions**: https://github.com/giovannihilaire01-cyber/Football/actions
