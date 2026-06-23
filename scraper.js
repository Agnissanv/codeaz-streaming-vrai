const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');

// 🕵️‍♂️ On active le camouflage ultra-secret avant le lancement
puppeteer.use(StealthPlugin());

const TARGET_URL = 'https://www.fctv33hd.mom/fr';

async function recupererMatchs() {
  try {
    console.log('🤖 Lancement du robot Code A-Z en mode FURTIF...');
    
    const browser = await puppeteer.launch({ 
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    const page = await browser.newPage();
    
    // Forcer une taille d'écran standard humaine
    await page.setViewport({ width: 1280, height: 720 });

    console.log('🌐 Tentative de connexion discrète au site...');
    // 'networkidle2' attend qu'il n'y ait plus de requêtes réseau pour valider le chargement
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 }); 

    // 👀 ESPIONNAGE DU SERVEUR : Est-ce qu'on a passé la sécurité ?
    const titrePage = await page.title();
    console.log(`📝 [LOG DEBOGAGE] Titre de la page vue par le robot furtif : "${titrePage}"`);

    console.log('⏳ Pause de 5 secondes pour stabiliser l\'affichage...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extraction des données
    const donnees = await page.evaluate(() => {
      const matchs = [];
      const liensMatchs = document.querySelectorAll('a[href*="-match-"], a[href*="/live/"], a[href*="/stream/"]');
      const totalLiensDeLaPage = document.querySelectorAll('a').length;

      liensMatchs.forEach(lien => {
        const urlPageMatch = lien.href;
        let texteComplet = lien.innerText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

        if (texteComplet && urlPageMatch) {
          const matchHeure = texteComplet.match(/\d{2}:\d{2}/);
          let heure = matchHeure ? matchHeure[0] : "LIVE";
          let titreEquipes = texteComplet.replace(heure, '').trim();

          let compet = "Match International"; 
          let parentRecherche = lien.parentElement;
          for (let i = 0; i < 4; i++) {
            if (!parentRecherche) break;
            let titreLigue = parentRecherche.querySelector('.league-title, .competition-name, h2, h3, th, .title, [class*="head"]');
            if (titreLigue && titreLigue.innerText.trim()) {
              compet = titreLigue.innerText.split('\n')[0].trim();
              break;
            }
            parentRecherche = parentRecherche.parentElement;
          }

          let sport = "⚽ Football";
          const analyseTexte = (compet + " " + urlPageMatch + " " + titreEquipes).toLowerCase();
          if (analyseTexte.includes('basket') || analyseTexte.includes('nba')) sport = "🏀 Basketball";
          else if (analyseTexte.includes('tennis')) sport = "🎾 Tennis";
          else if (analyseTexte.includes('mma') || analyseTexte.includes('ufc')) sport = "🥊 Combat";
          else if (analyseTexte.includes('f1') || analyseTexte.includes('moto')) sport = "🏎️ Auto/Moto";

          matchs.push({ heure, sport, compet, titre: titreEquipes, urlPageMatch });
        }
      });

      return {
        matchsTrouves: matchs,
        totalLiens: totalLiensDeLaPage
      };
    });

    console.log(`📊 [LOG DEBOGAGE] Nombre total de liens <a> trouvés : ${donnees.totalLiens}`);

    await browser.close();
    
    // Sauvegarde
    fs.writeFileSync('matchs.json', JSON.stringify(donnees.matchsTrouves, null, 2));
    console.log(`\n✅ Opération terminée. ${donnees.matchsTrouves.length} matchs enregistrés.`);

  } catch (erreur) {
    console.error('❌ Erreur critique durant le scraping furtif :', erreur.message);
  }
}

recupererMatchs();