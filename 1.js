function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

var monTableau = [];

for (var i = 0; i < 20; i++){
    monTableau.push(getRandomArbitrary(-10,40))
}

console.log(monTableau);


