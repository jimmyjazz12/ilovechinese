const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read Excel reference
const wb = XLSX.readFile(path.join(__dirname, '..', 'hsk_reference_complete.xlsx'));
const sheets = { 'HSK 1 (300 mots)': 1, 'HSK 2 (200 nouveaux)': 2, 'HSK 3 (500 nouveaux)': 3, 'HSK 4 (1000 nouveaux)': 4 };

// Build Excel lookup: simplified -> English translation
const excelLookup = {};
for (const [sheetName, level] of Object.entries(sheets)) {
  const data = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  for (const row of data) {
    let chinese = (row['Chinois (汉字)'] || '').replace(/[（(][^）)]*[）)]/g, '').split(/[｜|]/)[0].trim();
    if (chinese) excelLookup[chinese] = (row['Traduction'] || '').trim();
  }
}

// Comprehensive EN->FR dictionary
const D = {
"love":"amour, aimer","hobby":"passe-temps, loisir","eight":"huit","dad":"papa","father":"père","white":"blanc","half":"demi, moitié","help":"aider","bag":"sac","cup":"tasse, verre","north":"nord","compare":"comparer","other":"autre","sick":"malade","wrong":"faux, incorrect","often":"souvent","sing":"chanter","long":"long","eat":"manger","go out":"sortir","wear":"porter (vêtement)","big":"grand","everyone":"tout le monde","but":"mais","certainly":"certainement","arrive":"arriver","road":"route, chemin","wait":"attendre","time":"temps, fois","place":"endroit, lieu","earth":"terre","younger brother":"petit frère","first":"premier","point":"point","phone":"téléphone","computer":"ordinateur","movie":"film","thing":"chose, objet","east":"est","winter":"hiver","all":"tous, tout","read":"lire","right":"correct, droit","sorry":"désolé","many":"beaucoup","how much":"combien","hungry":"avoir faim","child":"enfant","son":"fils","two":"deux","rice":"riz","restaurant":"restaurant","room":"chambre, salle","fly":"voler","airplane":"avion","very":"très","minute":"minute","clothes":"vêtements","happy":"heureux, content","tall":"grand (taille)","tell":"dire, raconter","give":"donner","work":"travailler, travail","dog":"chien","expensive":"cher","country":"pays","return":"retourner, rendre","still":"encore","good":"bon","drink":"boire","behind":"derrière","flower":"fleur","bad":"mauvais","welcome":"bienvenue","can":"pouvoir","fire":"feu","or":"ou","chicken":"poulet","egg":"oeuf","how many":"combien","family":"famille","between":"entre","see":"voir","teach":"enseigner","call":"appeler","sister":"soeur","today":"aujourd'hui","enter":"entrer","nine":"neuf","open":"ouvrir","begin":"commencer","look":"regarder","test":"examen, test","fast":"rapide","come":"venir","teacher":"professeur","cold":"froid","old":"vieux, ancien","inside":"à l'intérieur, dedans","zero":"zéro","six":"six","mother":"mère","horse":"cheval","buy":"acheter","cat":"chat","slow":"lent","busy":"occupé","not":"ne pas","which":"quel, lequel","that":"ce, cela","south":"sud","man":"homme","you":"tu, toi, vous","girl":"fille","warm":"chaud, tiède","friend":"ami, amie","woman":"femme","run":"courir","next to":"à côté de","seven":"sept","money":"argent","front":"devant","please":"s'il vous plaît","go":"aller","hot":"chaud","person":"personne","know":"savoir, connaître","day":"jour, journée","meat":"viande","three":"trois","store":"magasin","what":"quoi, que","ten":"dix","is":"être","book":"livre","water":"eau","sleep":"dormir","speak":"parler","four":"quatre","year":"année","he":"il","she":"elle","it":"il/elle (chose)","too":"aussi, trop","weather":"temps (météo), météo","play":"jouer","I":"je, moi","ask":"demander","five":"cinq","west":"ouest","like":"aimer","wash":"laver","small":"petit","want":"vouloir","laugh":"rire","new":"nouveau","thank":"remercier","star":"étoile","week":"semaine","student":"étudiant, étudiante","school":"école","study":"étudier","rain":"pluie","Chinese":"chinois","desk":"bureau (meuble)","sit":"s'asseoir","do":"faire","yesterday":"hier","walk":"marcher","most":"le plus","left":"gauche","mouth":"bouche","word":"mot, parole","character":"caractère","safe":"sûr, en sécurité","arrange":"arranger, organiser","install":"installer","according to":"selon","hundred":"cent","move":"déménager, bouger","full":"plein, complet","newspaper":"journal","report":"rapport, rapporter","example":"exemple","change":"changer, changer","become":"devenir","express":"exprimer","not bad":"pas mal","however":"cependant, pourtant","not enough":"pas assez","grass":"herbe","tea":"thé","produce":"produire","success":"succès, réussir","city":"ville","grow up":"grandir","only":"seulement","spring":"printemps","this":"ceci, ce","ever":"jamais","need":"avoir besoin","use":"utiliser","exist":"exister","have":"avoir","hand":"main","above":"au-dessus","class":"classe, cours","morning":"matin","afternoon":"après-midi","evening":"soir","night":"nuit","hour":"heure","number":"nombre, numéro","name":"nom","year old":"ans, âge","month":"mois","think":"penser","mean":"signifier, vouloir dire","should":"devoir","snow":"neige","color":"couleur","red":"rouge","eye":"oeil, yeux","doctor":"médecin","already":"déjà","with":"avec","prepare":"préparer","true":"vrai","really":"vraiment","just":"juste, exactement","husband":"mari, époux","wife":"épouse, femme","stand":"se tenir debout, se lever","clock":"horloge, pendule","live":"vivre, habiter","table":"table","letter":"lettre","again":"encore, de nouveau","meet":"rencontrer","finish":"finir, terminer","self":"soi-même","take":"prendre","take a taxi":"prendre un taxi","turn on":"allumer","get":"obtenir, recevoir","drive":"conduire","make fun of":"plaisanter, se moquer de","back to":"retourner à","such as":"par exemple, tel que","watch":"montre, regarder","no way":"impossible, pas possible","set out":"partir","a lot of":"beaucoup de","bring":"apporter","keep":"garder, maintenir","back":"dos, retour","also":"aussi, également","always":"toujours","be engaged in":"exercer, s'engager dans","be amazed":"être étonné, surpris","put on":"mettre, enfiler","stop up; block up":"boucher, bloquer","spend":"dépenser, passer (temps)","no matter":"peu importe, quel que soit","dark":"sombre, foncé","dry":"sec, sécher","light":"léger, clair, lumière","swim":"nager","hold":"tenir","cut":"couper","hit":"frapper","pull":"tirer","push":"pousser","send":"envoyer","grow":"grandir, pousser","show":"montrer","stop":"arrêter","try":"essayer","win":"gagner","lose":"perdre","feel":"sentir, ressentir","leave":"partir, quitter","follow":"suivre","draw":"dessiner","drop":"laisser tomber","fill":"remplir","miss":"manquer, regretter","throw":"lancer","touch":"toucher","cook":"cuisiner","fix":"réparer","climb":"grimper","sell":"vendre","dance":"danser","ride":"monter (véhicule)","carry":"porter, transporter","break":"casser","join":"rejoindre","add":"ajouter","receive":"recevoir","accept":"accepter","refuse":"refuser","introduce":"présenter, introduire","improve":"améliorer","exchange":"échanger","borrow":"emprunter","lend":"prêter","rent":"louer","steal":"voler, dérober","search":"chercher","discover":"découvrir","protect":"protéger","check":"vérifier","invite":"inviter","succeed":"réussir","fail":"échouer","explain":"expliquer","discuss":"discuter","complain":"se plaindre","praise":"féliciter, louer","encourage":"encourager","support":"soutenir, supporter","respect":"respecter","trust":"faire confiance","doubt":"douter","worry":"s'inquiéter","organize":"organiser","manage":"gérer","control":"contrôler","influence":"influencer","replace":"remplacer","repair":"réparer","destroy":"détruire","belong":"appartenir","contain":"contenir","divide":"diviser","connect":"relier, connecter","separate":"séparer","achieve":"réaliser, accomplir","avoid":"éviter","prevent":"empêcher","allow":"permettre","forbid":"interdire","collect":"collecter, rassembler","recover":"récupérer","relax":"se détendre","rest":"se reposer","exercise":"faire de l'exercice","practice":"pratiquer, s'entraîner","train":"former, s'entraîner","compete":"concourir","fight":"se battre, combattre","body":"corps","head":"tête","face":"visage","nose":"nez","ear":"oreille","hair":"cheveux","finger":"doigt","foot":"pied","leg":"jambe","arm":"bras","shoulder":"épaule","neck":"cou","heart":"coeur","stomach":"estomac","tooth":"dent","blood":"sang","bone":"os","skin":"peau","brother":"frère","grandfather":"grand-père","grandmother":"grand-mère","uncle":"oncle","aunt":"tante","baby":"bébé","parents":"parents","sun":"soleil","moon":"lune","mountain":"montagne","river":"rivière, fleuve","sea":"mer","lake":"lac","forest":"forêt","tree":"arbre","wind":"vent","cloud":"nuage","ice":"glace","stone":"pierre","sand":"sable","bread":"pain","fish":"poisson","milk":"lait","coffee":"café","sugar":"sucre","salt":"sel","oil":"huile","fruit":"fruit","vegetable":"légume","noodle":"nouilles","soup":"soupe","cake":"gâteau","beer":"bière","wine":"vin","juice":"jus","pen":"stylo","paper":"papier","chair":"chaise","door":"porte","window":"fenêtre","bed":"lit","car":"voiture","bus":"bus, autobus","train":"train","ship":"bateau","bicycle":"vélo","key":"clé","box":"boîte","bottle":"bouteille","plate":"assiette","knife":"couteau","shirt":"chemise","pants":"pantalon","shoes":"chaussures","hat":"chapeau","coat":"manteau","umbrella":"parapluie","gift":"cadeau","ticket":"billet","map":"carte","photo":"photo","camera":"appareil photo","magazine":"magazine","medicine":"médicament","house":"maison","university":"université","hospital":"hôpital","hotel":"hôtel","bank":"banque","library":"bibliothèque","museum":"musée","park":"parc","airport":"aéroport","station":"gare, station","office":"bureau","factory":"usine","market":"marché","town":"ville, bourg","village":"village","street":"rue","bridge":"pont","garden":"jardin","farm":"ferme","nurse":"infirmier/infirmière","worker":"ouvrier, travailleur","manager":"directeur, gérant","boss":"patron","colleague":"collègue","neighbor":"voisin, voisine","guest":"invité, hôte","customer":"client","soldier":"soldat","police":"police","artist":"artiste","writer":"écrivain","actor":"acteur","singer":"chanteur, chanteuse","driver":"conducteur","farmer":"agriculteur","scientist":"scientifique","lawyer":"avocat","journalist":"journaliste","engineer":"ingénieur","question":"question","answer":"réponse","problem":"problème","idea":"idée","reason":"raison","result":"résultat","way":"chemin, manière, façon","fact":"fait","rule":"règle","law":"loi","news":"nouvelles, informations","story":"histoire, récit","history":"histoire","culture":"culture","art":"art","music":"musique","science":"science","technology":"technique, technologie","sport":"sport","game":"jeu","experience":"expérience","chance":"chance, occasion","opportunity":"opportunité","power":"pouvoir, puissance","energy":"énergie","peace":"paix","war":"guerre","price":"prix","quality":"qualité","type":"type, sorte","level":"niveau","age":"âge","size":"taille","weight":"poids","speed":"vitesse","distance":"distance","direction":"direction","situation":"situation","condition":"condition, état","relationship":"relation","society":"société","economy":"économie","politics":"politique","education":"éducation","environment":"environnement","nature":"nature","health":"santé","dream":"rêve","wish":"souhait, voeu","goal":"objectif, but","plan":"plan, projet","method":"méthode","habit":"habitude","interest":"intérêt","memory":"mémoire, souvenir","opinion":"opinion, avis","feeling":"sentiment","emotion":"émotion","truth":"vérité","secret":"secret","mistake":"erreur","accident":"accident","effort":"effort","progress":"progrès","advantage":"avantage","effect":"effet","cause":"cause","purpose":"but, objectif","sometimes":"parfois","suddenly":"soudainement","finally":"finalement","exactly":"exactement","probably":"probablement","perhaps":"peut-être","maybe":"peut-être","almost":"presque","enough":"assez","quite":"assez, plutôt","rather":"plutôt","together":"ensemble","immediately":"immédiatement","actually":"en fait","mainly":"principalement","generally":"généralement","and":"et","because":"parce que","so":"donc","although":"bien que","while":"pendant que","since":"depuis, puisque","until":"jusqu'à","unless":"à moins que","as":"comme","than":"que (comparaison)","about":"à propos de, environ","after":"après","before":"avant","during":"pendant","without":"sans","against":"contre","toward":"vers","through":"à travers","instead of":"au lieu de","except":"sauf","yellow":"jaune","blue":"bleu","green":"vert","black":"noir","orange":"orange","pink":"rose","purple":"violet","brown":"marron","gray":"gris","one":"un","thousand":"mille","second":"deuxième","third":"troisième","middle":"milieu","beside":"à côté de","tomorrow":"demain","now":"maintenant","soon":"bientôt","later":"plus tard","recently":"récemment","forever":"pour toujours","turn off":"éteindre","take off":"enlever","pick up":"ramasser","give up":"abandonner","come from":"venir de","look for":"chercher","look at":"regarder","listen to":"écouter","wait for":"attendre","think of":"penser à","take care of":"prendre soin de","get up":"se lever","sit down":"s'asseoir","lie down":"s'allonger","come in":"entrer","come back":"revenir","go back":"retourner","wake up":"se réveiller","fall asleep":"s'endormir","a kind of":"une sorte de","not only":"non seulement","in fact":"en fait","at last":"enfin","at least":"au moins","at most":"au plus","of course":"bien sûr","traffic jam":"embouteillage","gas station":"station-service","instant noodles":"nouilles instantanées","Beijing opera":"opéra de Pékin","martial arts":"arts martiaux","cell phone":"téléphone portable","train station":"gare","bus stop":"arrêt de bus","post office":"bureau de poste","swimming pool":"piscine","measure word":"classificateur","auxiliary word":"mot auxiliaire","particle":"particule","conjunction":"conjonction","preposition":"préposition","adverb":"adverbe","pronoun":"pronom","correct":"correct, juste","convenient":"pratique, commode","comfortable":"confortable","popular":"populaire","famous":"célèbre","strict":"strict","polite":"poli","lazy":"paresseux","brave":"courageux","proud":"fier","lonely":"solitaire","nervous":"nerveux","gentle":"doux, gentil","patient":"patient","curious":"curieux","honest":"honnête","lively":"vif, animé","active":"actif","positive":"positif","negative":"négatif","equal":"égal","similar":"similaire","basic":"fondamental, basique","main":"principal","whole":"entier, tout","complete":"complet","single":"seul, unique","double":"double","various":"divers","average":"moyen","normal":"normal","serious":"sérieux","necessary":"nécessaire","important":"important","possible":"possible","special":"spécial","different":"différent","simple":"simple","difficult":"difficile","dangerous":"dangereux","beautiful":"beau, belle","ugly":"laid","pretty":"joli","thin":"mince, fin","thick":"épais","fat":"gros","narrow":"étroit","wide":"large","deep":"profond","cheap":"bon marché","fresh":"frais","quiet":"calme, silencieux","loud":"bruyant","flat":"plat","round":"rond","straight":"droit","obvious":"évident","false":"faux","common":"commun, courant","strong":"fort","weak":"faible","empty":"vide","heavy":"lourd","soft":"doux, mou","hard":"dur, difficile","rich":"riche","poor":"pauvre","clean":"propre, nettoyer","dirty":"sale","wet":"mouillé","afraid":"avoir peur","tired":"fatigué","free":"libre, gratuit","easy":"facile","young":"jeune","sky":"ciel","we":"nous","they":"ils, elles","short":"court, petit","high":"haut","low":"bas","behind":"derrière","outside":"à l'extérieur, dehors","great":"grand, formidable","real":"réel, vrai","clear":"clair","sure":"sûr, certain","ready":"prêt","own":"propre","public":"public","early":"tôt","late":"tard, en retard","little":"petit, peu","large":"grand, vaste",
};

// Process each HSK file
let totalFixed = 0;
let totalTagged = 0;

for (let level = 1; level <= 4; level++) {
  const filePath = path.join(__dirname, '..', 'src', 'data', `hsk${level}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let fixed = 0;
  let tagged = 0;

  for (const word of data) {
    const currentFr = (word.french || '').trim();

    // Skip if already good French (has accents or common French words)
    if (/[àâäéèêëïîôùûüçœæ]/.test(currentFr)) continue;
    if (/^(je|tu|il|elle|nous|vous|ils|un|une|le|la|les|de|du|des|au|aux|en|dans|sur|pour|par|avec|chez|sans|sous|vers|entre|à côté|à l'|bon marché|pas cher|s'il|c'est|n'est|aujourd'hui|déjà)/i.test(currentFr)) continue;

    // Look up English from Excel
    const english = excelLookup[word.simplified] || '';
    if (!english) continue;

    // Try to translate
    const lowerEn = english.toLowerCase().trim();

    // Try exact match first
    if (D[lowerEn]) {
      word.french = D[lowerEn];
      fixed++;
      continue;
    }

    // Try case-insensitive
    if (D[english]) {
      word.french = D[english];
      fixed++;
      continue;
    }

    // Try first word/phrase before comma
    const firstPart = lowerEn.split(/[,;]/)[0].trim();
    if (D[firstPart]) {
      word.french = D[firstPart];
      fixed++;
      continue;
    }

    // Try matching individual words
    const words = lowerEn.split(/\s+/);
    if (words.length === 1 && D[words[0]]) {
      word.french = D[words[0]];
      fixed++;
      continue;
    }

    // If the current translation is suspicious (very common word used for many entries)
    const suspicious = ['ou', 'il', 'il/elle', 'être', 'manger', 'tous', 'faire', 'aller', 'fils', 'chat', 'venir', 'homme', 'lire', 'vieux', 'thé', 'utiliser', 'autre', 'dix', 'ne pas', 'chanter'];
    if (suspicious.includes(currentFr.toLowerCase())) {
      // This is likely wrong - try harder to translate
      if (D[lowerEn]) {
        word.french = D[lowerEn];
        fixed++;
      } else if (D[firstPart]) {
        word.french = D[firstPart];
        fixed++;
      } else {
        // Tag it
        word.french = `[EN] ${english}`;
        tagged++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`HSK ${level}: ${fixed} fixed, ${tagged} tagged [EN]`);
  totalFixed += fixed;
  totalTagged += tagged;
}

console.log(`\nTotal: ${totalFixed} fixed, ${totalTagged} still tagged [EN]`);
