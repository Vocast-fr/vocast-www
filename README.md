# Vocast tools

## Présentation

Procédures utilisées pour la gestion des podcasts du projet [Vocast](https://vocast.fr)

- Ajout d'un épisode : Normalisation avec [Auphonic](https://auphonic.com) et publication sur l'hébergeur [Spreaker](https://spreaker.com)
- Mise à jour du site web : Regénération via le langage de templating [Nunjucks](https://mozilla.github.io/nunjucks/templating.html) puis téléversement FTP.

## Installations

### Génération automatique d'images

```
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:rwky/graphicsmagick
sudo apt-get update
sudo apt-get install graphicsmagick
```

## How-to

### Fichier `podcastMap.json`

C'est le fichier de configuration.

#### Propriété "header"

Ici sont présent les valeurs par défault pour les _headers_ des pages web. Ces valeurs sont écrasées par des paramètres informées dans `podcasts`.

### Mentions légales

Les mentions légales ont été automatiquement générées via [Orson](https://fr.orson.io/). Le résultat peut être modifié, mais doit être présent dans le fichier `terms.html` (à la racine de ce projet).
