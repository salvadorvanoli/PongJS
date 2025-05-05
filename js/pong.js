const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PAL_WIDTH = 20;
const PAL_HEIGHT = 100;
const PAL_SPEED = 6;
const BALL_SPEED = 3;
const BALL_RADIUS = 10;

let scoreLeft = 0;
let scoreRight = 0;

let lastWinner = null;
let isBot = false;

let gameState = 'menu';
let winner = '';

class Entidad {
    constructor(x, y, w, h, color) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.color = color;
        this.dx = 0;
        this.dy = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Paleta extends Entidad {
    constructor(x, color, isBot = false) {
        super(x, HEIGHT / 2 - PAL_HEIGHT / 2, PAL_WIDTH, PAL_HEIGHT, color);
        this.isBot = isBot;
    }

    // Método para mover la paleta, solo si no es un bot
    move(dy) {
        if (!this.isBot) {
            this.y += dy;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
            this.difficulty = 'normal';
        }
    }

    moveBot(pelota) {
        // Movimiento automático de la paleta del bot
        if (this.isBot) {
            const targetY = pelota.y + BALL_RADIUS - this.height / 2;

            if (this.difficulty === 'normal') {
                // Bot con retraso en la reacción
                // Entre 0 y 1, donde 1 es perfecto
                const reactionSpeed = 0.4;
                if (Math.random() < reactionSpeed) {
                    if (this.y < targetY) this.y += PAL_SPEED;
                    if (this.y > targetY) this.y -= PAL_SPEED;
                }
            } else if (this.difficulty === 'imposible') {
                // Bot perfecto, sigue la pelota sin errores
                if (this.y < targetY) this.y += PAL_SPEED;
                if (this.y > targetY) this.y -= PAL_SPEED;
            }

            // Limitar movimiento dentro del canvas
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;
        }
    }
}

class Pelota extends Entidad {
    constructor() {
        super(WIDTH / 2 - BALL_RADIUS, HEIGHT / 2 - BALL_RADIUS, BALL_RADIUS * 2, BALL_RADIUS * 2, 'white');
        this.reset();
    }

    reset() {
        // Reinicia la posición de la pelota al centro del canvas
        this.x = WIDTH / 2 - BALL_RADIUS;
        this.y = HEIGHT / 2 - BALL_RADIUS;
        
        // Reinicia la velocidad de la pelota para esperar a que el timeout le dé una nueva dirección
        this.dx = 0;
        this.dy = 0;

        // Espera 1 segundo antes de enviar la pelota para que el jugador pueda prepararse
        setTimeout( () => {
            // Envía la pelota en la dirección del último perdedor o aleatoriamente si no hay ganador anterior
            if (lastWinner === 'left') {
                this.dx = BALL_SPEED;
            } else if (lastWinner === 'right') {
                this.dx = -BALL_SPEED;
            } else {
                this.dx = Math.random() > 0.5 ? BALL_SPEED : -BALL_SPEED;
            }
            this.dy = (Math.random() - 0.5) * BALL_SPEED * 2;
        }, 1000);
        
    }

    update(leftPal, rightPal) {
        this.x += this.dx;
        this.y += this.dy;
    
        // Colisión con bordes superior/inferior
        if (this.y <= 0 || this.y + this.height >= HEIGHT) {
            this.dy *= -1;
        }
    
        // Colisión con paletas
        if (this.dx < 0 && this.collidesWith(leftPal)) {
            this.dx *= -1;

            // Incrementa la velocidad en un 5% al golpear la paleta
            this.dx *= 1.05; 
            this.dy *= 1.05;

            // Ajustar el ángulo de rebote según el punto de impacto
            const relativeIntersectY = (this.y + BALL_RADIUS) - (leftPal.y + leftPal.height / 2);
            const normalizedRelativeIntersectY = relativeIntersectY / (leftPal.height / 2);
            this.dy = normalizedRelativeIntersectY * BALL_SPEED;
            
        } else if (this.dx > 0 && this.collidesWith(rightPal)) {
            this.dx *= -1;

            // Incrementa la velocidad en un 5% al golpear la paleta
            this.dx *= 1.05; 
            this.dy *= 1.05;

            // Ajustar el ángulo de rebote según el punto de impacto
            const relativeIntersectY = (this.y + BALL_RADIUS) - (rightPal.y + rightPal.height / 2);
            const normalizedRelativeIntersectY = relativeIntersectY / (rightPal.height / 2);
            this.dy = normalizedRelativeIntersectY * BALL_SPEED;
        }
    
        // Punto para un jugador
        if (this.x <= 0) {
            scoreRight++;
            lastWinner = 'right';
            this.reset();
        }
    
        if (this.x + this.width >= WIDTH) {
            scoreLeft++;
            lastWinner = 'left';
            this.reset();
        }
    }

    collidesWith(paleta) {
        return this.x < paleta.x + paleta.width &&
               this.x + this.width > paleta.x &&
               this.y < paleta.y + paleta.height &&
               this.y + this.height > paleta.y;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x + BALL_RADIUS, this.y + BALL_RADIUS, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
}

const leftPaleta = new Paleta(30, 'red');
let rightPaleta = new Paleta(WIDTH - 30 - PAL_WIDTH, 'blue');
const pelota = new Pelota();

const teclas = {
    KeyW: false,
    KeyS: false,
    ArrowUp: false,
    ArrowDown: false,
};

document.addEventListener('keydown', e => {
    if (e.code in teclas) teclas[e.code] = true;
});
document.addEventListener('keyup', e => {
    if (e.code in teclas) teclas[e.code] = false;
});

function checkVictory() {
    if (scoreLeft >= 10) {
        winner = 'Jugador Izquierdo';
        gameState = 'victoria';
    } else if (scoreRight >= 10) {
        winner = 'Jugador Derecho';
        gameState = 'victoria';
    }
}

function update() {
    if (teclas.KeyW) leftPaleta.move(-PAL_SPEED);
    if (teclas.KeyS) leftPaleta.move(PAL_SPEED);

    // Movimiento de la paleta derecha
    // Si es un bot, mueve la paleta automáticamente
    // Si no, permite el movimiento manual
    if (!rightPaleta.isBot) {
        if (teclas.ArrowUp) rightPaleta.move(-PAL_SPEED);
        if (teclas.ArrowDown) rightPaleta.move(PAL_SPEED);
    } else {
        rightPaleta.moveBot(pelota);
    }

    pelota.update(leftPaleta, rightPaleta);

    checkVictory();
}

function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Dibuja la línea punteada central
    ctx.strokeStyle = 'white';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    leftPaleta.draw();
    rightPaleta.draw();
    pelota.draw();

    // Dibuja el marcador
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${scoreLeft} : ${scoreRight}`, WIDTH / 2, 30);
}

function drawMenu() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PONG', WIDTH / 2, HEIGHT / 4);

    ctx.font = '30px sans-serif';
    ctx.fillText('1. Jugar contra otro jugador', WIDTH / 2, HEIGHT / 2 - 60);
    ctx.fillText('2. Jugar contra la computadora (Normal)', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillText('3. Jugar contra la computadora (Imposible)', WIDTH / 2, HEIGHT / 2 + 40);
}

canvas.addEventListener('click', (e) => {
    if (gameState === 'menu') {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Detectar clic en las opciones
        const textWidth1 = ctx.measureText('1. Jugar contra otro jugador').width;
        const textWidth2 = ctx.measureText('2. Jugar contra la computadora (Normal)').width;
        const textWidth3 = ctx.measureText('3. Jugar contra la computadora (Imposible)').width;

        // Jugador humano
        if (y >= HEIGHT / 2 - 80 && y <= HEIGHT / 2 - 40 &&
            x >= WIDTH / 2 - textWidth1 / 2 && x <= WIDTH / 2 + textWidth1 / 2) {
            isBot = false;
            rightPaleta = new Paleta(WIDTH - 30 - PAL_WIDTH, 'blue', false);
            gameState = 'jugando';
        }
        // Jugador bot con dificultad normal
        else if (y >= HEIGHT / 2 - 20 && y <= HEIGHT / 2 + 20 &&
                 x >= WIDTH / 2 - textWidth2 / 2 && x <= WIDTH / 2 + textWidth2 / 2) {
            isBot = true;
            rightPaleta = new Paleta(WIDTH - 30 - PAL_WIDTH, 'blue', true);
            rightPaleta.difficulty = 'normal';
            gameState = 'jugando';
        }
        // Jugador bot con dificultad imposible
        else if (y >= HEIGHT / 2 + 20 && y <= HEIGHT / 2 + 60 &&
                 x >= WIDTH / 2 - textWidth3 / 2 && x <= WIDTH / 2 + textWidth3 / 2) {
            isBot = true;
            rightPaleta = new Paleta(WIDTH - 30 - PAL_WIDTH, 'blue', true);
            rightPaleta.difficulty = 'imposible';
            gameState = 'jugando';
        }
    }
});

function drawVictory() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'white';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡Victoria!', WIDTH / 2, HEIGHT / 2 - 40);
    ctx.font = '30px sans-serif';
    ctx.fillText(`${winner} gana`, WIDTH / 2, HEIGHT / 2);
    ctx.fillText('Haz clic para volver al menú', WIDTH / 2, HEIGHT / 2 + 40);
}

canvas.addEventListener('click', () => {
    if (gameState === 'victoria') {
        scoreLeft = 0;
        scoreRight = 0;
        lastWinner = null;
        winner = '';
        gameState = 'menu';
    }
});

function loop() {
    if (gameState === 'menu') {
        drawMenu();
    } else if (gameState === 'jugando') {
        update();
        draw();
    } else if (gameState === 'victoria') {
        drawVictory();
    }
    requestAnimationFrame(loop);
}

loop();
