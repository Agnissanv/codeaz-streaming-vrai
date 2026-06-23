const fs = require('fs');
const cheerio = require('cheerio');

const TARGET_URL = 'https://www.fctv33hd.mom/fr';

async function recupererMatchs() {
  console.log("🚀 Lancement du robot Code A-Z en mode Crawlbase...");

  // Récupération de la clé sécurisée
  const token = process.env.CRAWLBASE_TOKEN;
  if (!token) {
    console.error("❌ Erreur : Le jeton CRAWLBASE_TOKEN est introuvable. Nous allons le configurer au prochain pas !");
    process.exit(1);
  }

  // URL magique qui passe par les serveurs de Crawlbase pour effacer Cloudflare
  const crawlbaseUrl = `https://api.crawlbase.com/?token=${token}&url=${encodeURIComponent(TARGET_URL)}`;

  try {
    console.log("🛰️ Connexion au serveur de contournement...");
    const response = await fetch(crawlbaseUrl);

    if (!response.ok) {
      throw new Error(`Erreur HTTP ! Statut : ${response.status}`);
    }

    const html = await response.text();

    // Double vérification au cas où
    if (html.includes("Just a moment...")) {
      console.log("❌ Cloudflare fait de la résistance. Il faudra vérifier le type de Token.");
      return;
    }

    console.log("✅ Sécurité Cloudflare contournée ! Analyse du site en cours...");

    // On donne le code HTML à Cheerio pour qu'il puisse l'analyser
    const $ = cheerio.load(html);
    const matchs = [];

    // On cible exactement tes liens comme avant
    const liensMatchs = $('a[href*="-match-"], a[href*="/live/"], a[href*="/stream/"], a[href*="/fr/"]');
    console.log(`📝 [LOG DEBOGAGE] Nombre total de liens <a> sur la page : ${$('a').length}`);

    liensMatchs.each((i, el) => {
      let urlPageMatch = $(el).attr('href');
      if (!urlPageMatch) return;

      // Si le lien est relatif (ex: /live/match), on le transforme en lien complet
      if (!urlPageMatch.startsWith('http')) {
        urlPageMatch = new URL(urlPageMatch, TARGET_URL).href;
      }

      let texteComplet = $(el).text().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      if (texteComplet && urlPageMatch) {
        const matchHeure = texteComplet.match(/\d{2}:\d{2}/);
        let heure = matchHeure ? matchHeure[0] : "LIVE";
        let titreEquipes = texteComplet.replace(heure, '').trim();

        // Algorithme Code A-Z pour trouver la compétition (remonter les parents)
        let compet = "Match International"; 
        let parentRecherche = $(el).parent();
        for (let j = 0; j < 4; j++) {
          if (!parentRecherche.length) break;
          let titreLigue = parentRecherche.find('.league-title, .competition-name, h2, h3, th, .title, [class*="head"]').first();
          if (titreLigue.length && titreLigue.text().trim()) {
            compet = titreLigue.text().split('\n')[0].trim();
            break;
          }
          parentRecherche = parentRecherche.parent();
        }

        // Détection automatique du sport
        let sport = "⚽ Football";
        const analyseTexte = (compet + " " + urlPageMatch + " " + titreEquipes).toLowerCase();
        if (analyseTexte.includes('basket') || analyseTexte.includes('nba')) sport = "🏀 Basketball";
        else if (analyseTexte.includes('tennis')) sport = "🎾 Tennis";
        else if (analyseTexte.includes('mma') || analyseTexte.includes('ufc')) sport = "🥊 Combat";
        else if (analyseTexte.includes('f1') || analyseTexte.includes('moto')) sport = "🏎️ Auto/Moto";

        matchs.push({ heure, sport, compet, titre: titreEquipes, urlPageMatch });
      }
    });

    // Enregistrement final des données propres
    fs.writeFileSync('matchs.json', JSON.stringify(matchs, null, 2));
    console.log(`\n✅ Réussite totale ! ${matchs.length} matchs enregistrés.`);

  } catch (erreur) {
    console.error('❌ Erreur durant le traitement :', erreur.message);
  }
}

recupererMatchs();