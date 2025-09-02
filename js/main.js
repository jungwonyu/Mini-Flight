// 메인 게임 파일 - 리팩터링된 버전

// 시스템 인스턴스들
let spawnSystem;
let collisionSystem;
let inputSystem;
let gameManager;

// 게임 리소스 로드
function preload() {
  // image
  // this.load.image('bg', 'assets/bg2.png');
  this.load.image('bg', 'assets/bg3.png');
  this.load.image('bg_fever', 'assets/bg_fever.png');
  // this.load.image('bg', 'assets/background.png');
  // this.load.image('player', 'assets/player.png');
  // this.load.image('player', 'assets/player1.png');
  // 캐릭터 이미지 로드
  // this.load.image('player', 'assets/player2.png');
  this.load.spritesheet('player', 'assets/player2.png', { frameWidth: 100, frameHeight: 100 });
  this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullet.png');
  this.load.image('enemyBullet', 'https://labs.phaser.io/assets/sprites/enemy-bullet.png');
  // this.load.image('enemy', 'assets/enemy.png');
  // this.load.image('king_enemy', 'assets/king_enemy.png');
  // this.load.image('king_king_enemy', 'assets/king_king_enemy.png');
  // this.load.image('enemy', 'assets/enemy1.png');
  this.load.spritesheet('enemy', 'assets/enemy11.png', { frameWidth: 100, frameHeight: 100 });
  // this.load.image('king_enemy', 'assets/enemy2.png');
  this.load.spritesheet('king_enemy', 'assets/enemy22.png',  { frameWidth: 125, frameHeight: 100 });
  // this.load.image('king_king_enemy', 'assets/enemy3.png');
  this.load.spritesheet('king_king_enemy', 'assets/enemy33.png', { frameWidth: 156, frameHeight: 200 });
  
  // this.load.image('coin', 'assets/coin.png');
  this.load.image('coin', 'assets/coin2.png');
  // this.load.image('powerup', 'assets/powerup.png');
  this.load.image('powerup', 'assets/powerup2.png');
  this.load.image('potion', 'assets/potion.png');
  this.load.image('key', 'assets/key.png');
  // sound
  this.load.audio('coinSound', 'assets/coin.wav');
  this.load.audio('explosionSound', 'assets/explosion.wav');
  this.load.audio('powerupSound', 'assets/powerup.wav');
  // this.load.audio('bgm', 'assets/bgm.wav');
  this.load.audio('bgm', 'assets/emergence.ogg');
  this.load.audio('gameOverSound', 'assets/gameover.wav');
  this.load.audio('enemyHitSound', 'assets/enemyhit.mp3');
  this.load.audio('feverSound', 'assets/fever.ogg');
  this.load.audio('successSound', 'assets/success.mp3');
  this.load.audio('failSound', 'assets/fail.mp3');
  this.load.audio('buttonSound', 'assets/button.mp3');
  // this.load.audio('emergenceSound', 'assets/emergence.ogg');
}

// 게임 오브젝트 생성 및 초기화
function create() {
  // 시스템 인스턴스 생성
  spawnSystem = new SpawnSystem(this);
  collisionSystem = new CollisionSystem(this);
  inputSystem = new InputSystem(this);
  gameManager = new GameManager(this);
  
  // 시스템을 씬에 저장 (스폰 함수들을 위해)
  this.spawnSystem = spawnSystem;
  this.collisionSystem = collisionSystem;
  this.gameManager = gameManager;

  // 효과음 객체 생성 및 저장
  this.coinSound = this.sound.add('coinSound');
  this.explosionSound = this.sound.add('explosionSound');
  this.powerupSound = this.sound.add('powerupSound');
  this.gameOverSound = this.sound.add('gameOverSound');
  this.enemyHitSound = this.sound.add('enemyHitSound');
  this.feverSound = this.sound.add('feverSound');
  this.successSound = this.sound.add('successSound');
  this.failSound = this.sound.add('failSound');
  this.buttonSound = this.sound.add('buttonSound');

  // 배경 음악 객체 생성만 (재생은 start 버튼에서)
  this.bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });

  // 배경을 tileSprite로 복구
  background = this.add.tileSprite(0, 0, 480, 800, 'bg').setOrigin(0);
  background.isFever = false;

  // 플레이어
  player = this.physics.add.sprite(240, 200, 'player', 0);

  this.anims.create({
    key: 'fly',
    frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
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

  player.anims.play('fly', true);
  player.setDisplaySize(100 * 2, 100 * 2); // 플레이어 크기 2배
  player.setCollideWorldBounds(true);
  player.setVisible(false); // 시작 화면에서는 숨김

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
  keyInventoryText = this.add.text(65, 770, keyInventoryCount, {
    fontSize: '22px', fill: '#ffe066', fontFamily: 'PFStardustS, Arial, sans-serif', stroke: '#333', strokeThickness: 3
  }).setDepth(10);

  // UI 텍스트 생성
  createUIElements.call(this);

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
}

// UI 요소 생성
function createUIElements() {
  scoreText = this.add.text(10, 10, 'Score: 0', {
    fontSize: '20px',
    fill: '#ffffff',
    fontFamily: 'PFStardustS, Arial, sans-serif'
  });
  gameOverCountText = this.add.text(10, 35, 'Game Over: 0', {
    fontSize: '18px',
    fill: '#ff6666',
    fontFamily: 'PFStardustS, Arial, sans-serif'
  });
  scoreText.setVisible(false);
  gameOverCountText.setVisible(false);

  distanceText = this.add.text(480 - 10, 10, 'Distance: 0m', {
    fontSize: '20px',
    fill: '#ffffff',
    fontFamily: 'PFStardustS, Arial, sans-serif'
  }).setOrigin(1, 0);
  distanceText.setVisible(false);
}

// HTML 시작 버튼 이벤트 연결
function setupStartButton() {
  const startButton = document.getElementById('startButton');
  const startScreen = document.getElementById('startScreen');
  
  if (startButton) {
    startButton.addEventListener('click', () => {
      startGame.call(this);
      startScreen.classList.add('hidden');
    });
  }
}

// 게임 시작 함수
function startGame() {
  // 완전한 게임 상태 초기화 (다시하기와 동일)
  gameManager.resetGameState();
  
  // 게임 상태를 playing으로 변경
  gameState = 'playing';
  
  // 게임 UI 표시
  scoreText.setVisible(true);
  gameOverCountText.setVisible(true);
  distanceText.setVisible(true);
  player.setVisible(true);
  
  // 스폰 시작
  startSpawning.call(this);
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
  this.physics.add.overlap(bullets, enemies, (bullet, enemy) => {
    collisionSystem.hitEnemy(bullet, enemy);
  }, null, this);
  
  this.physics.add.overlap(bullets, kingEnemies, (bullet, kingEnemy) => {
    collisionSystem.hitKingEnemy(bullet, kingEnemy);
  }, null, this);
  
  this.physics.add.overlap(bullets, kingKingEnemies, (bullet, kingKingEnemy) => {
    collisionSystem.hitKingKingEnemy(bullet, kingKingEnemy);
  }, null, this);

  // 플레이어 vs 적들
  this.physics.add.overlap(player, enemies, (player, enemy) => {
    collisionSystem.playerHit(player, enemy);
  }, null, this);
  
  this.physics.add.overlap(player, kingEnemies, (player, kingEnemy) => {
    collisionSystem.playerHit(player, kingEnemy);
  }, null, this);
  
  this.physics.add.overlap(player, kingKingEnemies, (player, kingKingEnemy) => {
    collisionSystem.playerHit(player, kingKingEnemy);
  }, null, this);

  // 플레이어 vs 총알
  this.physics.add.overlap(player, enemyBullets, (player, enemyBullet) => {
    collisionSystem.playerHitByBullet(player, enemyBullet);
  }, null, this);

  // 수집 아이템들
  this.physics.add.overlap(player, coins, (player, coin) => {
    collisionSystem.collectCoin(player, coin);
  }, null, this);
  
  this.physics.add.overlap(player, powerups, (player, powerup) => {
    collisionSystem.collectPowerup(player, powerup);
  }, null, this);

  // 플레이어 vs 포션
  this.physics.add.overlap(player, potions, (player, potion) => {
    collisionSystem.collectPotion(player, potion);
  }, null, this);

  // 플레이어 vs 키
  this.physics.add.overlap(player, keys, (player, keyObj) => {
    if (!keyObj.isInventory) {
      collisionSystem.collectKey(player, keyObj);
    }
  }, null, this);
}

// 재시작 함수
let gameOverCount = 0;

// 게임 시작
const game = new Phaser.Game(config);
