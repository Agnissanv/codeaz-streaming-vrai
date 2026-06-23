const puppeteer = require('puppeteer');
const fs = require('fs');

const TARGET_URL = 'https://www.fctv33hd.mom/fr';

async function recupererMatchs() {
  try {
    console.log('🤖 Lancement du robot intelligent Code A-Z...');
    
    const browser = await puppeteer.launch({ 
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1280,800' // 👈 Fait croire à un vrai écran d'ordinateur
      ]
    });
    const page = await browser.newPage();
    
    // 👈 Force la taille de l'écran et l'identité du navigateur
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

    console.log('🌐 Visite du site...');
    // 👈 Augmente le temps d'attente à 60 secondes pour éviter les chargements infinis
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 }); 

    console.log('📸 Prise d\'une capture d\'écran pour le débogage...');
    // 👈 Le robot prend une photo ! On pourra la voir sur GitHub.
    await page.screenshot({ path: 'vision_du_robot.png' });

    console.log('⏳ Analyse et extraction des blocs de sports...');
    // 👈 Laisse 10 secondes au site pour faire apparaître les matchs
    await new Promise(resolve => setTimeout(resolve, 10000));

    const listeDesMatchs = await page.evaluate(() => {
      const matchs = [];
      const liensMatchs = document.querySelectorAll('a[href*="-match-"], a[href*="/live/"], a[href*="/stream/"]');

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

          matchs.push({
            heure: heure,
            sport: sport,
            compet: compet,
            titre: titreEquipes,
            urlPageMatch: urlPageMatch
          });
        }
      });
      return matchs;
    });

    await browser.close();
    fs.writeFileSync('matchs.json', JSON.stringify(listeDesMatchs, null, 2));
    console.log(`\n✅ Réussite ! ${listeDesMatchs.length} matchs structurés en JSON.`);

  } catch (erreur) {
    console.error('❌ Erreur :', erreur.message);
  }
}

recupererMatchs();