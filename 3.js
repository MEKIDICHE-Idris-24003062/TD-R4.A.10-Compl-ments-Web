const zoneAffichage = document.getElementById('temp-zone');
let index = 0;
const chrono = setInterval(function() {
    
    if (index < monTableau.length) {
        zoneAffichage.textContent = monTableau[index];
    
        index++; 

    } else {
        clearInterval(chrono);
        console.log("Fin de l'affichage");
    }

}, 2000);