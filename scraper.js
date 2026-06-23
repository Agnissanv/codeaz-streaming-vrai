const puppeteer = require('puppeteer');
const fs = require('fs');

const TARGET_URL = 'https://www.fctv33hd.mom/fr';

async function recupererMatchs() {
  try {
    console.log('🤖 Lancement du robot Code A-Z en mode détective...');
    
    const browser = await puppeteer.launch({ 
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    const page = await browser.newPage();
    
    // Identité humaine
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log('🌐 Connexion au site de streaming...');
    // On utilise 'domcontentloaded' qui est plus stable sur les serveurs distants
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }); 

    // 👀 ESPIONNAGE DU SERVEUR : On regarde ce que GitHub voit vraiment
    const titrePage = await page.title();
    console.log(`📝 [LOG DEBOGAGE] Titre de la page vue par GitHub : "${titrePage}"`);

    console.log('⏳ Pause de 8 secondes pour laisser les scripts charger les matchs...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // Extraction
    const donnees = await page.evaluate(() => {
      const matchs = [];
      const liensMatchs = document.querySelectorAll('a[href*="-match-"], a[href*="/live/"], a[href*="/stream/"]');

      // Compteur interne pour le débug
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
        matchs Trouves: matchs,
        totalLiens: totalLiensDeLaPage
      };
    });

    console.log(`📊 [LOG DEBOGAGE] Nombre total de liens <a> sur la page : ${donnees.totalLiens}`);

    await browser.close();
    
    // Sauvegarde du fichier JSON
    fs.writeFileSync('matchs.json', JSON.stringify(donnees.matchsTrouves, null, 2));
    console.log(`\n✅ Opération terminée. ${donnees.matchsTrouves.length} matchs enregistrés.`);

  } catch (erreur) {
    console.error('❌ Erreur critique durant le scraping :', erreur.message);
  }
}

recupererMatchs();