# Vocast tools

## Présentation

Procédures utilisées pour la gestion des podcasts du projet [Vocast](https://vocast.fr)

- Ajout d'un épisode : chapitrage, génération des pochettes par épisode et par chapitre d'épisode, normalisation et publication avec [Auphonic](https://auphonic.com) (hébergement sur [Spreaker](https://spreaker.com) et [Youtube](https://youtube.com))
- Mise à jour du site web : Regénération via le langage de templating [Nunjucks](https://mozilla.github.io/nunjucks/templating.html) puis téléversement FTP.

## Pile technologique

- Node.JS
- AWS DynamoDB
- Ffmpeg, GraphicsMagick

## Notes

### Version de node.js

Testé avec la version v10.0.0

### GraphicsMagick pour la génération des images

```
sudo apt-get install software-properties-common &&
sudo add-apt-repository ppa:rwky/graphicsmagick &&
sudo apt-get update &&
sudo apt-get install graphicsmagick
```

### Mentions légales

Les mentions légales ont été automatiquement générées via [Orson](https://fr.orson.io/). Le résultat peut être modifié, mais doit être présent dans le fichier `terms.html` (à la racine de ce projet).
