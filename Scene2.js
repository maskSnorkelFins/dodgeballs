class Scene2 extends Phaser.Scene {
	constructor() {
		super('playGame');
	}

	init() {
		this.ballStart = 10,
		this.ballCount = 0;
		this.ballYStart = 80;
		this.speedFactor = 2.5;
		this.player;
		this.balls;
		this.gameRunning = false;
		this.timer;
		this.elapsedTime = 0;
		// this.cursors; // for keyboard listener

		// responsive design
		this.ballRatio = (GAME_SETTINGS.gameWidth/800 + GAME_SETTINGS.gameHeight/600) / 3;
		this.xStep = GAME_SETTINGS.gameWidth / (this.ballStart + 1);
		this.yStep = GAME_SETTINGS.gameHeight / (this.ballStart + 1);

		this.gameWidth = GAME_SETTINGS.gameWidth;
		this.gameWidthDIV2 = GAME_SETTINGS.gameWidth/2;
		this.gameWidthDIV4 = GAME_SETTINGS.gameWidth/4;
		this.gameHeight = GAME_SETTINGS.gameHeight;
		this.gameHeightDIV2 = GAME_SETTINGS.gameHeight/2;
		this.gameHeightDIV4 = GAME_SETTINGS.gameHeight/4;

		console.log(`Window ${this.gameWidth} x ${this.gameHeight}`);
		console.log("ballRatio: " + this.ballRatio);
		console.log("xStep = " + this.xStep);
		console.log("yStep = " + this.yStep);
	}



	preload() {
		// images
		this.load.image('ball', 'assets/ball.png');
		this.load.image('player', 'assets/player.png');
		// sounds
		this.load.audio('bonk', 'assets/bonk.mp3');
		this.load.audio('newball', 'assets/newball.mp3');
		this.load.audio('dead', 'assets/dead.mp3');
	}



	create() {
		// sounds
		this.bonkSound = this.sound.add('bonk');
		this.newballSound = this.sound.add('newball');
		this.deadSound = this.sound.add('dead');


		// physics objects
		// player
		this.player = this.physics.add.image(this.gameWidthDIV2, this.gameHeightDIV2 + this.gameHeightDIV4, 'player'); // physics.add has Dynamic physics by default
		this.player.setScale(this.ballRatio);
		this.player.setCollideWorldBounds(true);
		this.player.body.setCircle(this.player.width/2); // circular hitbox
		this.player.body.setAllowGravity(false); // no gravity for player
		this.player.body.setImmovable(true); // no player rebound


		// balls
		this.balls = this.physics.add.group({
			key: 'ball', // texture
			repeat: this.ballStart - 1, // 1 is created by default + X more = X+1 total
			setXY: { x: this.xStep, y: this.ballYStart, stepX: this.xStep, stepY: 0 }
		});
		this.balls.children.iterate(ball => {
			this.ballCount++;
			this.setBall(ball);
			ball.setVelocity(0, 0); // stop balls before game starts
		});


		// text output, default font = Courier
		this.ballCountText = this.add.text(16, 16, 'Count: ' + this.ballCount,
			{ fontSize: '20px', fill: '#000' }
		);
		this.timeText = this.add.text(200, 16, "Time: 0",
			{ fontSize: '20px', fill: '#000' }
		);
		this.centerText = this.add.text(this.gameWidthDIV2, this.gameHeightDIV2, 'click to begin',
			{ fontSize: '20px', fill: '#000', backgroundColor: "#ccc", align: 'center' }
		).setOrigin(0.5, 0.5); // center-align text



		// balls collide
		this.ballCollider = this.physics.add.collider(this.balls, this.balls, () => {
			this.bonkSound.play( { volume: 0.2, rate: 1.5 } );
		});



		// stop game
		this.playerCollider = this.physics.add.collider(this.player, this.balls, () => {
			// end the game
			this.gameRunning = false;
			this.timer.remove();
			this.player.setTint(0x000000); // turn player black
			// this.physics.pause(); // stop physics
			
			// turn off collisions
			this.ballCollider.active = false;
			this.playerCollider.active = false;

			// drop all balls
			this.balls.getChildren().forEach(ball => {
				ball.setCollideWorldBounds(false);
			});
			this.physics.world.gravity.y = 1500;

			// this.input.enabled = false; // stop pointer events
			// this.input.keyboard.enabled = false; // stop keyboard input
			this.deadSound.play();
			this.centerText.setText("you lasted " + this.elapsedTime
				+ " seconds\nyou reached " + this.ballCount
				+ " balls\n\nclick to play again").setOrigin(0.5);

			document.body.style.cursor = 'default'; // hide pointer arrow
		}, null, this);


		// start game
		this.input.on('pointerdown', () => {
			if (!this.gameRunning) {
				this.gameRunning = true;
				this.physics.world.gravity.y = 0; // gravity off

				document.body.style.cursor = 'none'; // hide pointer arrow
				this.centerText.setText("");

				// reset player
				this.player.clearTint(); // undo tint
				this.player.setPosition(this.gameWidthDIV2, this.gameHeightDIV2 + this.gameHeightDIV4);
				
				// remove added balls
				let allBalls = this.balls.getChildren();
				for (let i = allBalls.length-1; i >= this.ballStart; i--) {
					allBalls[i].destroy();
				}
				this.ballCount = this.balls.getChildren().length;

				// reset original balls
				let index = 0;
				this.balls.children.iterate(ball => {
					ball.x = this.xStep + index * this.xStep;
					ball.y = this.ballYStart;
					ball.setCollideWorldBounds(true);
					ball.setBounce(1);
					let tempV = this.gameWidth/this.speedFactor;
					ball.setVelocity(
						Phaser.Math.Between(-tempV, tempV),
						Phaser.Math.Between(-tempV, tempV),
					);
					index++;
				});

				this.physics.resume(); // resume physics
				this.ballCollider.active = true;
				this.playerCollider.active = true;

				// track time
				this.elapsedTime = 0;
				this.timer = this.time.addEvent({
					delay: 1000,
					callback: () => {
						this.elapsedTime++;
						this.timeText.setText('Time: ' + this.elapsedTime);

						// release new ball
						if (this.elapsedTime % 10 == 0) {

							// create new ball
							this.ballCount++;
							this.ballCountText.setText('Count: ' + this.ballCount);

							var x = (this.player.x < this.gameWidthDIV2) ? Phaser.Math.Between(this.gameWidthDIV2 + this.gameWidthDIV4, this.gameWidth) : Phaser.Math.Between(0, this.gameWidthDIV4);

							var ball = this.balls.create(x, GAME_SETTINGS.gameHeight/2, 'ball');
							this.setBall(ball);
							
							ball.setTint(0x00ff00);
							this.time.delayedCall(2500, () => { // remove tint
								ball.clearTint();
							});
							// halo around new ball
							let halo = this.add.graphics();
							halo.lineStyle(30, 0x00ff00, 0.5); // thickness, color, opacity
							halo.strokeCircle(ball.x, ball.y, ball.width);
							halo.setDepth(ball.depth - 1); // behind ball
							// remove halo
							this.time.delayedCall(1000, () => {
								halo.destroy();
							});

							this.newballSound.play( { volume: 10, rate: 1 } );
						}
					},
					callbackScope: this,
					loop: true
				});

				// reset text outputs
				this.ballCountText.setText("Count: " + this.ballCount);
				this.timeText.setText('Time: 0');
			}
		});


		// trackpad listener
		this.input.on('pointermove', pointer => {
			if (!this.gameRunning) { return; }
			this.player.x = pointer.x;
			this.player.y = pointer.y;
		});
	}



	update() {

	}



	// set ball properties
	setBall(ball) {
		ball.setScale(this.ballRatio);
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
		let tempV = this.gameWidth/this.speedFactor;
		ball.setVelocity(
			Phaser.Math.Between(-tempV, tempV),
			Phaser.Math.Between(-tempV, tempV),
		);
		ball.body.setCircle(ball.width/2); // circular hitbox
	}



}