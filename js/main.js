// 메인 게임 파일 - 리팩터링된 버전

// 시스템 인스턴스들
let spawnSystem;
let collisionSystem;
let inputSystem;
let gameManager;

// 게임 리소스 로드
function preload() {
  this.load.image('bg', '/assets/background.png');
  this.load.image('player', '/assets/player.png');
  this.load.image('bullet', 'https://labs.phaser.io/assets/sprites/bullet.png');
  this.load.image('enemyBullet', 'https://labs.phaser.io/assets/sprites/enemy-bullet.png');
  this.load.image('enemy', '/assets/enemy.png');
  this.load.image('king_enemy', '/assets/king_enemy.png');
  this.load.image('king_king_enemy', '/assets/king_king_enemy.png');
  this.load.image('coin', '/assets/coin.png');
  this.load.image('powerup', '/assets/powerup.png');
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

  // 배경
  background = this.add.tileSprite(0, 0, 480, 800, 'bg').setOrigin(0);

  // 플레이어
  player = this.physics.add.sprite(240, 700, 'player').setScale(0.6);
  player.setCollideWorldBounds(true);

  // 게임 오브젝트 그룹 생성
  bullets = this.physics.add.group();
  enemies = this.physics.add.group();
  kingEnemies = this.physics.add.group();
  kingKingEnemies = this.physics.add.group();
  enemyBullets = this.physics.add.group();
  coins = this.physics.add.group();
  powerups = this.physics.add.group();

  // UI 텍스트 생성
  createUIElements.call(this);

  // 경고 오버레이
  warningOverlay = this.add.rectangle(240, 400, 480, 800, 0xff0000, 0.3);
  warningOverlay.setVisible(false);

  // 게임 오버 UI 생성
  createGameOverUI.call(this);

  // 스폰 시작
  startSpawning.call(this);

  // 충돌 처리 설정
  setupCollisions.call(this);
}

// 게임 업데이트 루프
function update(time) {
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
    fill: '#000000'
  });

  distanceText = this.add.text(480 - 10, 10, 'Distance: 0m', {
    fontSize: '20px',
    fill: '#000000'
  }).setOrigin(1, 0);
}

// 게임 오버 UI 생성
function createGameOverUI() {
  gameOverText = this.add.text(240, 350, 'GAME OVER', {
    fontSize: '30px',
    fill: '#ff0000',
    fontWeight: 'bold',
    stroke: '#ffffff',
    strokeThickness: 4
  }).setOrigin(0.5).setVisible(false).setDepth(1000);

  restartButton = this.add.text(240, 450, '다시하기', {
    fontSize: '24px',
    fill: '#ffffff',
    backgroundColor: '#4CAF50',
    padding: { x: 20, y: 10 },
    borderRadius: 5
  }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(1000);

  // 다시하기 버튼 이벤트
  restartButton.on('pointerdown', () => {
    gameManager.resetGameState();
    this.scene.restart();
  });
}

// 스폰 시작
function startSpawning() {
  // 각 스폰 시작
  spawnSystem.spawnEnemies();
  spawnSystem.spawnEnemyBullets();
  
  // 첫 번째 파워업은 5초 후 (더 빠르게)
  this.time.delayedCall(GAME_CONSTANTS.POWERUP_FIRST_SPAWN_DELAY, () => spawnSystem.spawnPowerup());
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
}

// 게임 시작
const game = new Phaser.Game(config);
