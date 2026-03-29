regle a memoriser : tu ecris les commantaire en anglais

regle a memoriser : tu ecris le code en anglais

regle a memoriser : la communication humain et assitant ia en français

regle a memoriser : pose des question tant que tout n'est pas clair

regle a memoriser : tu es root donc pas besoin de sudo

regle a memoriser :
si mon-app est lié à /apps/{mon-app}/app alors regarde où tu te trouve dans le sistème de ficher

regle a memoriser : le user de la bdd est {mon-app}
regle a memoriser : le nom de la bdd est {mon-app}
regle a memoriser : le mot de passe est contenu dans le fichier /apps/{mon-app}/etc/mysql/localhost/passwd
prefere toujours aller cherche le mot de passe directement dans ce fichier pour une application transportable

regle a memoriser : DB via cli pour l'agent IA
regle a memoriser : DB via language de programmation pour le programme

regle a memoriser : la base de donnees exite déjà
regle a memoriser : le user de la bdd exite déjà
regle a memoriser : le mot de pass de la bdd existe déjà

regle a memoriser : NE JAMAIS utiliser alert(), confirm() ou prompt() JavaScript
- utiliser des modales
- meilleure UX et cohérence avec le design
- plus de contrôle sur le style et le comportement
- exemple : créer un composant ConfirmModal pour les confirmations de suppression

regle a memoriser : structure des repertoires sous /apps/{mon-app}/
app     => code source de l'application
etc     => fichiers de configuration
log     => logs de l'application
sav     => fichiers a conserver (factures, fichiers generes) — hors git
tmp     => fichiers temporaires
nosav   => cache et fichiers non sauvegardes

regle a memoriser : nom de la bdd = nom du user de bdd = {mon-app}
exemple : pour le projet iachat-v1 => bdd = iachat-v1, user bdd = iachat-v1

regle a memoriser : toujours verifier dans quel repertoire on se trouve avant d'agir

regle à mémoriser : toutes les modales doivent pouvoir se fermer avec la touche Echap ou en cliquant en dehors de la modale ou click sur la croix de fermeture en haut a droite
- ajouter un useEffect qui ecoute keydown 'Escape' et appelle la fonction de fermeture
- le backdrop (overlay) doit appeler la fonction de fermeture au onClick
- ne jamais bloquer la fermeture (sauf champ obligatoire non rempli)
