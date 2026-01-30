const zoneAffichage = document.getElementById('temp-zone');
const zoneMessage = document.getElementById('msg-zone');
const zoneHistorique = document.getElementById('historique-liste');
let index = 0;

const chrono = setInterval(function() {

    if (index < monTableau.length) {
        let valeur = monTableau[index];
        zoneAffichage.textContent = valeur + "°C";

        zoneAffichage.className = '';
        zoneMessage.textContent = '';

        let classeCouleur = '';

        if (valeur <= 0) {
            classeCouleur = 'bordure-bleue';
        } else if (valeur > 0 && valeur <= 20) {
            classeCouleur = 'bordure-verte';
        } else if (valeur > 20 && valeur <= 30) {
            classeCouleur = 'bordure-orange';
        } else if (valeur > 30) {
            classeCouleur = 'bordure-rouge';
        }

        zoneAffichage.classList.add(classeCouleur);

        if (valeur < 0) {
            zoneMessage.textContent = "Brrrrrrr, un peu froid ce matin, mets ta cagoule !";
        } else if (valeur > 30) {
            zoneMessage.textContent = "Caliente ! Vamos a la playa, ho hoho hoho !!";
        }

        let li = document.createElement('li');
        li.textContent = valeur + "°C";
        li.classList.add(classeCouleur);
        zoneHistorique.appendChild(li);

        index++;

    } else {
        clearInterval(chrono);
        console.log("Fin de l'affichage");
    }

}, 2000);