// 메인 게임 파일 - 리팩터링된 버전

// 시스템 인스턴스들
let spawnSystem;
let collisionSystem;
let inputSystem;
let gameManager;

// 게임 리소스 로드
function preload() {
  // image
  this.load.image('bg', 'assets/images/bg.png');
  this.load.image('bg_fever', 'assets/images/bg_fever.png');

  // 캐릭터 이미지 로드
  this.load.spritesheet('player', 'assets/images/player.png', { frameWidth: 150, frameHeight: 150 });
  this.load.spritesheet('player_double', 'assets/images/player_double.png', { frameWidth: 150, frameHeight: 150 });
  this.load.spritesheet('player_fever', 'assets/images/player_fever.png', { frameWidth: 150, frameHeight: 150 });
  this.load.image('bullet', 'assets/images/bullet.png');
  this.load.image('enemyBullet', 'https://labs.phaser.io/assets/sprites/enemy-bullet.png');

  this.load.spritesheet('enemy', 'assets/images/enemy11.png', { frameWidth: 100, frameHeight: 100 });
  this.load.spritesheet('king_enemy', 'assets/images/enemy22.png',  { frameWidth: 178, frameHeight: 150 });
  this.load.spritesheet('king_king_enemy', 'assets/images/enemy33.png', { frameWidth: 156, frameHeight: 200 });

  this.load.spritesheet('coin', 'assets/images/coin.png', { frameWidth: 36, frameHeight: 36 });
  this.load.image('powerup', 'assets/images/helper1.png');
  this.load.image('potion', 'assets/images/helper2.png');
  this.load.image('key', 'assets/images/key.png');

  // sound
  this.load.audio('bgm', 'assets/sounds/bgm2.mp3');
  this.load.audio('gameOverBgm', 'assets/sounds/gameover.mp3');
  this.load.audio('feverBgm', 'assets/sounds/fever_bgm.mp3');

  this.load.audio('coinSound', 'assets/sounds/coin.wav');
  this.load.audio('explosionSound', 'assets/sounds/explosion.wav');
  this.load.audio('powerupSound', 'assets/sounds/powerup.wav');
  this.load.audio('enemyHitSound', 'assets/sounds/enemyhit.mp3');
  this.load.audio('successSound', 'assets/sounds/success.mp3');
  this.load.audio('failSound', 'assets/sounds/fail.mp3');
  this.load.audio('buttonSound', 'assets/sounds/button.mp3');

  // interface image
  this.load.image('ico_score', 'assets/images/ico_score.png');
  this.load.image('ico_count', 'assets/images/ico_count.png');
  this.load.image('ico_distance', 'assets/images/ico_distance.png');
  this.load.image('btn_play', 'assets/images/btn_play.png');
  this.load.image('btn_pause', 'assets/images/btn_pause.png');
  this.load.image('player_pause', 'assets/images/player_pause.png');
}

// 게임 오브젝트 생성 및 초기화
function create() {
  spawnSystem = new SpawnSystem(this);
  collisionSystem = new CollisionSystem(this);
  inputSystem = new InputSystem(this);
  gameManager = new GameManager(this);
  
  this.spawnSystem = spawnSystem;
  this.collisionSystem = collisionSystem;
  this.gameManager = gameManager;

  // 효과음 객체 생성 및 저장
  this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
  this.feverBgm = this.sound.add('feverBgm');
  this.gameOverBgm = this.sound.add('gameOverBgm');
  this.coinSound = this.sound.add('coinSound');
  // UI 생성 함수에 play/pause 버튼 추가
  function createGameUI(scene) {
    const centerX = scene.scale.width / 2;
    scene.pauseButton = scene.add.image(centerX, 40, 'btn_pause').setInteractive({ cursor: 'pointer' }).setVisible(true).setScale(0.5).setDepth(100);
    scene.playButton = scene.add.image(centerX, 40, 'btn_play').setInteractive({ cursor: 'pointer' }).setVisible(false).setScale(0.5).setDepth(100);

    // 버튼 클릭 이벤트
    scene.playButton.on('pointerdown', () =>{
      gameState = 'playing';
      scene.playButton.setVisible(false);
      scene.pauseButton.setVisible(true);
      if (scene.physics) scene.physics.resume();
      if (scene.time) scene.time.paused = false;
      if (scene.tweens) scene.tweens.resumeAll();
      if (scene.anims) scene.anims.resumeAll();
      if (scene.bgm && !scene.bgm.isPlaying) { scene.bgm.resume(); }
      if (isFeverTime && scene.feverBgm && !scene.feverBgm.isPlaying) { scene.feverBgm.resume(); }
      scene.children.list.forEach(child => {
        if (child.texture && child.texture.key === 'player_pause') child.destroy();
        if (child.type === 'Rectangle' && child.fillColor === 0x000000) child.destroy();
      });
    });

    scene.pauseButton.on('pointerdown', () =>{
      gameState = 'paused';
      scene.pauseButton.setVisible(false);
      scene.playButton.setVisible(true);
      if (scene.physics) scene.physics.pause();
      if (scene.time) scene.time.paused = true;
      if (scene.tweens) scene.tweens.pauseAll();
      if (scene.anims) scene.anims.pauseAll();
      if (scene.bgm && scene.bgm.isPlaying) { scene.bgm.pause(); }
      if (scene.feverBgm && scene.feverBgm.isPlaying) { scene.feverBgm.pause(); }
      scene.add.image(centerX, scene.scale.height / 2, 'player_pause').setScale(1).setDepth(200);
      scene.add.rectangle(centerX, scene.scale.height / 2, scene.scale.width, scene.scale.height, 0x000000, 0.5).setDepth(99);
    });
  }

  createGameUI(this);
  this.explosionSound = this.sound.add('explosionSound');
  this.powerupSound = this.sound.add('powerupSound');
  this.enemyHitSound = this.sound.add('enemyHitSound');
  this.successSound = this.sound.add('successSound');
  this.failSound = this.sound.add('failSound');
  this.buttonSound = this.sound.add('buttonSound');

  // 배경을 tileSprite로 복구
  background = this.add.tileSprite(0, 0, 480, 800, 'bg').setOrigin(0);
  background.isFever = false;

  this.anims.create({
    key: 'fly',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'fly2',
    frames: this.anims.generateFrameNumbers('player_double', { start: 0, end: 1 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'fly3',
    frames: this.anims.generateFrameNumbers('player_fever', { start: 0, end: 1 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'coin',
    frames: this.anims.generateFrameNumbers('coin', { start: 0, end: 1 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'enemyFly',
    frames: this.anims.generateFrameNumbers('enemy', { start: 0, end: 1 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'king_enemyFly',
    frames: this.anims.generateFrameNumbers('king_enemy', { start: 0, end: 4 }),
    frameRate: 5,
    repeat: -1
  });

  this.anims.create({
    key: 'king_king_enemyFly',
    frames: this.anims.generateFrameNumbers('king_king_enemy', { start: 0, end: 5 }),
    frameRate: 5,
    repeat: -1
  });

  player = this.physics.add.sprite(240, 720, 'player')
  player.anims.play('fly', true);
  player.setSize(player.width * 0.5, player.height * 0.7);
  player.setCollideWorldBounds(true);
  player.setVisible(false); // 시작 화면에서는 숨김

  coin = this.physics.add.staticSprite(this.scale.width + 50, this.pathY, 'coin');
  coin.anims.play('coin', true);

  // 게임 오브젝트 그룹 생성
  bullets = this.physics.add.group();
  enemies = this.physics.add.group();
  kingEnemies = this.physics.add.group();
  kingKingEnemies = this.physics.add.group();
  enemyBullets = this.physics.add.group();
  coins = this.physics.add.group();
  powerups = this.physics.add.group();
  potions = this.physics.add.group();
  keys = this.physics.add.group();

  // 화면 왼쪽 하단에 key 아이콘 1개와 x3 숫자 표시
  keyInventoryCount = 3;
  keyInventoryIcon = this.add.image(40, 780, 'key').setScale(0.5).setDepth(10);
  keyInventoryText = this.add.text(65, 770, keyInventoryCount, { fontSize: '26px', fill: '#ffe066', fontFamily: 'PFStardustS, Arial, sans-serif', stroke: '#000', strokeThickness: 5 }).setDepth(10);

  // Phaser 캔버스 내 인터페이스 생성
  this.add.image(30, 30, 'ico_score').setScale(0.3).setDepth(20);
  this.scoreText = this.add.text(50, 20, score, {
    fontSize: '26px',
    fill: '#fff',
    fontFamily: 'PFStardustS, Arial, sans-serif',
    fontWeight: 'bold',
    stroke: '#000',
    strokeThickness: 5
  }).setDepth(20);

  this.add.image(30, 70, 'ico_count').setScale(0.3).setDepth(20);
  this.gameOverCountText = this.add.text(50, 60, gameOverCount, {
    fontSize: '26px',
    fill: '#ff6666',
    fontFamily: 'PFStardustS, Arial, sans-serif',
    fontWeight: 'bold',
    stroke: '#000',
    strokeThickness: 5
  }).setDepth(20);

  this.add.image(380, 50, 'ico_distance').setScale(0.3).setDepth(20);
  this.distanceText = this.add.text(400, 40, Math.floor(distance / 10) + 'm', {
    fontSize: '28px',
    fill: '#fff',
    fontFamily: 'PFStardustS, Arial, sans-serif',
    fontWeight: 'bold',
    stroke: '#000',
    strokeThickness: 5
  }).setDepth(20);

  // 경고 오버레이
  warningOverlay = this.add.rectangle(240, 400, 480, 800, 0xff0000, 0.8);
  warningOverlay.setVisible(false);

  // 충돌 처리 설정
  setupCollisions.call(this);

  // HTML 시작 버튼 이벤트 연결
  setupStartButton.call(this);
}

// 게임 업데이트 루프
function update(time) {
  if (gameState !== 'playing') return;
  if (isGameOver) return;

  // 각 시스템 업데이트
  gameManager.updateGameProgress();
  gameManager.checkBossSpawn();
  inputSystem.handlePlayerMovement();
  inputSystem.handleWeaponSystem(time);
  gameManager.cleanupOffscreenObjects();
  gameManager.updateCoinAnimations();

  // Phaser UI에 값 업데이트
  if (this.scoreText) this.scoreText.setText(score);
  if (this.distanceText) this.distanceText.setText(Math.floor(distance / 10) + 'm');
  if (this.gameOverCountText) this.gameOverCountText.setText(gameOverCount);
}

// HTML 시작 버튼 이벤트 연결
function setupStartButton() {
  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('startScreen');
  const gameScreen = document.getElementById('gameScreen');
  // const canvas = document.querySelector('canvas');
  
  if (startButton) {
    startButton.addEventListener('click', () => {
      startGame.call(this);
      startScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
    });
  }
}

// 게임 시작 함수
function startGame() {
  // 완전한 게임 상태 초기화 (다시하기와 동일)
  gameManager.resetGameState();
  // Phaser UI도 0으로 초기화
  if (this.scoreText) this.scoreText.setText(0);
  if (this.distanceText) this.distanceText.setText('0m');
  if (this.gameOverCountText) this.gameOverCountText.setText(0);
  
  // 게임 상태를 playing으로 변경
  gameState = 'playing';
  
  // 게임 UI 표시
  player.setVisible(true);
  
  // 스폰 시작
  startSpawning.call(this);
  spawnSystem.hasPowerupActive = false;
  isFeverTime = false;
  spawnSystem.spawnPowerup();  // 첫 powerup 즉시 스폰

  // 피버타임 코인 비 효과도 즉시 시작 (피버타임 상태일 때만)
  // if (isFeverTime) spawnSystem.startFeverTimeCoinRain();
  // 배경음악 재생 (이미 재생 중이면 중복 방지)
  if (this.bgm && !this.bgm.isPlaying) {
    this.bgm.play();
  }
}

// 스폰 시작
function startSpawning() {
  // 스폰 시스템 시작
  spawnSystem.startSpawning();
  
  // 첫 번째 파워업은 5초 후 (더 빠르게)
  this.time.delayedCall(GAME_CONSTANTS.POWERUP_FIRST_SPAWN_DELAY, () => {
    spawnSystem.spawnPowerup();
  });
}

// 충돌 처리 설정
function setupCollisions() {
  // 총알 vs 적들
  this.physics.add.overlap(bullets, enemies, (bullet, enemy) => collisionSystem.hitEnemy(bullet, enemy), null, this);
  this.physics.add.overlap(bullets, kingEnemies, (bullet, kingEnemy) => collisionSystem.hitKingEnemy(bullet, kingEnemy), null, this);
  this.physics.add.overlap(bullets, kingKingEnemies, (bullet, kingKingEnemy) =>  collisionSystem.hitKingKingEnemy(bullet, kingKingEnemy), null, this);

  // 플레이어 vs 적들
  this.physics.add.overlap(player, enemies, (player, enemy) => collisionSystem.playerHit(player, enemy), null, this);
  this.physics.add.overlap(player, kingEnemies, (player, kingEnemy) => collisionSystem.playerHit(player, kingEnemy), null, this);
  this.physics.add.overlap(player, kingKingEnemies, (player, kingKingEnemy) => collisionSystem.playerHit(player, kingKingEnemy), null, this);

  // 플레이어 vs 총알
  this.physics.add.overlap(player, enemyBullets, (player, enemyBullet) => collisionSystem.playerHitByBullet(player, enemyBullet), null, this);

  // 수집 아이템들
  this.physics.add.overlap(player, coins, (player, coin) => collisionSystem.collectCoin(player, coin), null, this);
  this.physics.add.overlap(player, powerups, (player, powerup) => collisionSystem.collectPowerup(player, powerup), null, this);
  this.physics.add.overlap(player, potions, (player, potion) => collisionSystem.collectPotion(player, potion), null, this);
  this.physics.add.overlap(player, keys, (player, keyObj) => {
    if (!keyObj.isInventory) collisionSystem.collectKey(player, keyObj)
  }, null, this);
}

// 게임 시작
const game = new Phaser.Game(config);