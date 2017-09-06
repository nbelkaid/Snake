var sn;
var scl = 10;
var food;
var score;
var socket = io(); 
var rate = 10;


//Demande le Meilleur score actuel au serveur
socket.emit('get_high_score');

// Reception du meilleur score actuel
socket.on('send_score', (data) => {
	var score = document.getElementById('score');
	score.innerHTML = data;
})

function setup() {
	createCanvas(500, 500);
	sn = new snake();
	food = new food();
	score = new score();
	frameRate(10);
}

function draw() {
	// Rate pour croitre la vitesse en fonction de la longueur du seprent
	rate = constrain(10 + floor(sn.length_history/5), 5, 20)
	frameRate(rate);
	background(51);
	//Calcul position du serpent et affichage
	sn.update();
	sn.display();
	//Creation et affichage de nourriture
	if (sn.eat(food)) {
		food.create();
	}
	food.display();
	score.display();
}

// Gestion evenement clavier
function keyPressed() {
	 if (keyCode === UP_ARROW && (sn.yv != 1 || score.value == 0)) {
	 	sn.update_dir(0, -1);
	 } else if (keyCode === DOWN_ARROW && (sn.yv != -1 || score.value == 0)) {
	 	sn.update_dir(0, 1);
	 } else if (keyCode === LEFT_ARROW && (sn.xv != 1 || score.value == 0)) {
	 	sn.update_dir(-1, 0);
	 } else if (keyCode === RIGHT_ARROW && (sn.xv != -1 || score.value == 0)) {
	 	sn.update_dir(1, 0);
	 }
}

function snake() {
	//coordonnes
	this.x = 0;
	this.y = 0;
	//vitesse et direction selon x et y
	this.xv = 1;
	this.yv = 0;
	// Historique position et longueur historique
	this.length_history = 0;
	this.history = [];

	// Update position serpent
	this.update = function() {
		if (this.length_history === this.history.length) {
			//Pas de nouveau bloc, Maj des positions dans l'historique
			for (var i = 0 ; i < this.history.length ; i++) {
				this.history[i] = this.history[i + 1];
			}
		}
		if (this.length_history > 0) {
			//Sauvegarde derniere position dans historique
			this.history[this.length_history - 1] = createVector(this.x, this.y)
		}

		//calcul nouvel position
		this.x += (this.xv * scl);
		this.y += (this.yv * scl);

		//Test pour savoir si partie perdue 
		sn.end(this.x, this.y);

		//Contraintes sur position x et y (Creation mur)
		this.x = constrain(this.x, 0, width - scl)
		this.y = constrain(this.y, 0, height - scl)
	}

	// Changement de direction
	this.update_dir = function(xv, yv) {
		this.xv = xv
		this.yv = yv;
	}

	// Affichage du serpent
	this.display = function() {
		fill("#3FBF3F");
		//Affichage Queue du serpent
		for (var i = 0; i < this.history.length; i++) {
			rect(this.history[i].x, this.history[i].y, scl, scl);
		}
		//Affichage tete du serpent
		fill("#194C19");
		rect(this.x, this.y, scl, scl);
	}

	//Verification si serpent sur nourriture
	this.eat = function(food_pos) {
		//Calcul distance entre tete serpent et nourriture
		var d = dist(this.x, this.y, food_pos.x, food_pos.y);
		if (d < scl) {
			//Serpent mange nouriture, +1 bloc
			this.length_history++;
			fill("255");
			text("+10", this.x, this.y);
			score.add_point();
			return true;
		}
		else {
			return false;
		}
	}

	//Fin de partie
	this.end = function(x, y) {
		for (var i = 0; i < this.history.length; i++) {
			// Si le serpent se mord la queue 	
			if (dist(x, y, this.history[i].x, this.history[i].y) < 1) {
				this.length_history = 0;
				this.history = [];
				score.reset();
			}
		}
		//Serpent hors limite 
		if (x > width - scl || y > height - scl || x < 0 || y < 0) {
			this.length_history = 0;
			this.history = [];
			score.reset();
		}
	}
}


function food() {
	//Creation bloc nourriture
	this.create = function() {
		this.x = floor(random(50))*scl;
		this.y = floor(random(50))*scl;
	}
	//Affichage nourriture
	this.display = function() {
		fill("#E24040");
		if (!this.x) {
			this.create();
		}
		rect(this.x, this.y, scl, scl);
	}
}

//Creation systeme de score
function score() {
	this.value = 0;
	this.reset = function () {
		//Verification si meilleur score
		var high_score = document.getElementById('score').innerHTML;
		if (score.value > 0 && parseInt(high_score.replace(/[^0-9\.]/g, ''), 10) < score.value) {
			//New high score!
			socket.emit("save_score", score.value);
		}
		this.value = 0;
	}
	this.add_point = function () {
		this.value = this.value + 10;
	}
	this.display = function() {
		fill(255);
		text("Score: "+this.value, 10, 30);
	}
}