const config = {
  type: Phaser.AUTO,
  width: 480,
  height: 800,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 568
    },
    max: {
      width: 480,
      height: 800
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scene: { preload, create, update }
};

let player;
let bullets;
let enemies;
let kingEnemies; 
let kingKingEnemies;
let enemyBullets;
let coins;
let powerups;
let score = 0;
let isDoubleBullet = false; // 더블 총알 활성화 상태
let doubleBulletEndTime = 0; // 더블 총알 종료 시간
let scoreText;
let distance = 0;
let distanceText;
let lastKingSpawn = 0;
let lastKingKingSpawn = 0;
let lastFired = 0;
let background;
let cursors;
let warningOverlay;
let gameOverText;
let restartButton;
let isGameOver = false;

// 모바일 터치 컨트롤 변수들
let isMobile = false;
let touchTargetX = 0;
let isTouching = false;

const game = new Phaser.Game(config);

// ---------------------------------------------------------------------------------------------------------- functions

function preload() { // 게임 리소스 로드
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

function create() { // 게임 오브젝트 생성 및 초기화
  // 배경
  background = this.add.tileSprite(0, 0, 480, 800, 'bg').setOrigin(0);

  // 플레이어
  player = this.physics.add.sprite(240, 700, 'player').setScale(0.6);
  player.setCollideWorldBounds(true); // setCollideWorldBounds: 플레이어가 밖으로 벗어나지 않도록 설정

  // 총알 그룹
  bullets = this.physics.add.group();

  // 적 그룹
  enemies = this.physics.add.group();
  kingEnemies = this.physics.add.group();
  kingKingEnemies = this.physics.add.group();

  // 적 총알 그룹
  enemyBullets = this.physics.add.group();

  // 동전 그룹
  coins = this.physics.add.group();

  // 파워업 그룹
  powerups = this.physics.add.group();

  // 점수 텍스트
  scoreText = this.add.text(10, 10, 'Score: 0', {
    fontSize: '20px',
    fill: '#000000'
  });

  // 주행거리 텍스트
  distanceText = this.add.text(480 - 10, 10, 'Distance: 0m', {
    fontSize: '20px',
    fill: '#000000'
  }).setOrigin(1, 0); // 오른쪽 정렬

  // 경고 오버레이 (화면 전체를 덮는 반투명 빨간색)
  warningOverlay = this.add.rectangle(240, 400, 480, 800, 0xff0000, 0.3);
  warningOverlay.setVisible(false); // 처음에는 보이지 않음

  // 게임 오버 텍스트 (화면 중앙)
  gameOverText = this.add.text(240, 350, 'GAME OVER', {
    fontSize: '30px',
    fill: '#ff0000',
    fontWeight: 'bold',
    stroke: '#ffffff',
    strokeThickness: 4
  }).setOrigin(0.5).setVisible(false).setDepth(1000); // 처음에는 보이지 않음, 최상위 깊이

  // 다시하기 버튼
  restartButton = this.add.text(240, 450, '다시하기', {
    fontSize: '24px',
    fill: '#ffffff',
    backgroundColor: '#4CAF50',
    padding: { x: 20, y: 10 },
    borderRadius: 5
  }).setOrigin(0.5).setVisible(false).setInteractive().setDepth(1000); // 처음에는 보이지 않음, 클릭 가능, 최상위 깊이

  // 다시하기 버튼 클릭 이벤트
  restartButton.on('pointerdown', () => {
    // 게임 상태 초기화
    score = 0;
    distance = 0;
    lastKingSpawn = 0; // 킹 에너미 스폰 기록 초기화
    lastKingKingSpawn = 0; // 킹킹 에너미 스폰 기록 초기화
    isGameOver = false;
    lastFired = 0;
    isDoubleBullet = false; // 더블 총알 상태 초기화
    doubleBulletEndTime = 0; // 더블 총알 타이머 초기화
    
    // 터치 상태 초기화
    isTouching = false;
    
    // 게임 재시작
    this.scene.restart();
  });

  // 적 생성 함수
  const spawnEnemies = () => {
    if (isGameOver) { // 게임 오버 상태면 적 생성 중단
      return;
    }
    
    // 2~3개 사이 랜덤 개수
    const enemyCount = Phaser.Math.Between(2, 3);
    
    // 적들을 랜덤 위치에 배치
    for (let i = 0; i < enemyCount; i++) {
      const x = Phaser.Math.Between(50, 430);
      const enemy = enemies.create(x, -50, 'enemy');
      enemy.setScale(0.5);
      enemy.setVelocityY(150);
    }
    
    // 다음 스폰을 위한 랜덤 타이머 설정
    this.time.delayedCall(Phaser.Math.Between(1500, 3000), spawnEnemies);
  };
  
  // 첫 번째 적 그룹 생성
  spawnEnemies();

  // 적 총알 생성 함수
  const spawnEnemyBullets = () => {
    if (isGameOver) { // 게임 오버 상태면 적 총알 생성 중단
      return;
    }
    
    // 경고 효과 시작 - 화면 반짝임
    warningOverlay.setVisible(true);
    warningOverlay.setAlpha(0.4);
    
    // 반짝임 효과
    this.tweens.add({
      targets: warningOverlay,
      alpha: 0,
      duration: 150,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        warningOverlay.setVisible(false);
        
        // 경고 효과 후 적 총알 생성
        const x = Phaser.Math.Between(20, 460);
        const enemyBullet = enemyBullets.create(x, 0, 'enemyBullet');
        enemyBullet.setScale(3);
        enemyBullet.setVelocityY(400);
        
        // 볼내면서 날아오는 효과 - 빠른 회전
        enemyBullet.setAngularVelocity(720); // 초당 720도 회전
        
        // 약간의 좌우 흔들림 효과
        enemyBullet.setVelocityX(Phaser.Math.Between(-30, 30));
        
        // 크기 펄스 효과
        this.tweens.add({
          targets: enemyBullet,
          scaleX: 3.3,
          scaleY: 3.3,
          duration: 100,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });
    
    // 다음 적 총알을 위한 랜덤 타이머 설정
    this.time.delayedCall(Phaser.Math.Between(2000, 6000), spawnEnemyBullets);
  };
  
  // 첫 번째 적 총알 생성
  spawnEnemyBullets();

  // 킹 에너미 생성 함수
  const spawnKingEnemy = () => {
    if (isGameOver) { // 게임 오버 상태면 킹 에너미 생성 중단
      return;
    }
    
    // 경고 효과 시작 - 화면 반짝임
    warningOverlay.setVisible(true);
    warningOverlay.setAlpha(0.6);
    
    // 반짝임 효과
    this.tweens.add({
      targets: warningOverlay,
      alpha: 0,
      duration: 200,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        warningOverlay.setVisible(false);
        
        // 경고 효과 후 킹 에너미 생성 (화면 중앙 상단)
        const kingEnemy = kingEnemies.create(240, -50, 'king_enemy');
        kingEnemy.setScale(1.0); // 킹 에너미는 큰 크기
        kingEnemy.setVelocityY(100); // 일반 적보다 느리게 이동
        kingEnemy.setTint(0xff6600); // 주황색으로 구분
        
        // 킹 에너미는 체력이 있음 (10번 맞아야 죽음)
        kingEnemy.health = 10;
        kingEnemy.maxHealth = 10;
        
        // 킹 에너미 체력바 생성
        const healthBarBg = this.add.rectangle(240, -20, 100, 8, 0x000000, 0.7);
        const healthBarFill = this.add.rectangle(240, -20, 100, 6, 0x00ff00);
        
        // 체력바를 킹 에너미의 속성으로 저장
        kingEnemy.healthBarBg = healthBarBg;
        kingEnemy.healthBarFill = healthBarFill;
      }
    });
  };

  // 킹 에너미 스폰 함수를 전역으로 접근 가능하게 저장
  this.spawnKingEnemy = spawnKingEnemy;

  // 킹킹 에너미 생성 함수
  const spawnKingKingEnemy = () => {
    if (isGameOver) { // 게임 오버 상태면 킹킹 에너미 생성 중단
      return;
    }
    
    // 경고 효과 시작 - 화면 반짝임
    warningOverlay.setVisible(true);
    warningOverlay.setAlpha(0.8);
    
    // 반짝임 효과
    this.tweens.add({
      targets: warningOverlay,
      alpha: 0,
      duration: 300,
      yoyo: true,
      repeat: 6,
      onComplete: () => {
        warningOverlay.setVisible(false);
        
        // 경고 효과 후 킹킹 에너미 생성 (화면 중앙 상단)
        const kingKingEnemy = kingKingEnemies.create(240, -50, 'king_king_enemy');
        kingKingEnemy.setScale(1.5); // 킹킹 에너미는 매우 큰 크기
        kingKingEnemy.setVelocityY(80); // 킹보다도 더 느리게 이동
        kingKingEnemy.setTint(0xff0000); // 빨간색으로 구분
        
        // 킹킹 에너미는 매우 높은 체력 (20번 맞아야 죽음)
        kingKingEnemy.health = 20;
        kingKingEnemy.maxHealth = 20;
        
        // 킹킹 에너미 체력바 생성 (더 크게)
        const healthBarBg = this.add.rectangle(240, -20, 150, 12, 0x000000, 0.8);
        const healthBarFill = this.add.rectangle(240, -20, 150, 10, 0xff0000);
        
        // 체력바를 킹킹 에너미의 속성으로 저장
        kingKingEnemy.healthBarBg = healthBarBg;
        kingKingEnemy.healthBarFill = healthBarFill;
      }
    });
  };

  // 킹킹 에너미 스폰 함수를 전역으로 접근 가능하게 저장
  this.spawnKingKingEnemy = spawnKingKingEnemy;

  // 파워업 스폰 함수
  const spawnPowerup = () => {
    if (isGameOver) { // 게임 오버 상태면 파워업 생성 중단
      return;
    }
    
    // 랜덤 위치에 파워업 생성
    const x = Phaser.Math.Between(50, 430);
    const powerup = powerups.create(x, -30, 'powerup');
    powerup.setScale(2);
    powerup.setVelocityY(120);
    
    // 파워업 반짝이는 효과
    powerup.setTint(0x00ff00); // 초록색
    this.tweens.add({
      targets: powerup,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 빙글빙글 도는 효과
    powerup.setAngularVelocity(540); // 초당 540도 회전
    
    // 크기 펄스 효과
    this.tweens.add({
      targets: powerup,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 다음 파워업을 위한 랜덤 타이머 설정 (15-25초 간격)
    this.time.delayedCall(Phaser.Math.Between(15000, 25000), spawnPowerup);
  };
  
  // 첫 번째 파워업 생성 (게임 시작 후 10초 후)
  this.time.delayedCall(10000, spawnPowerup);

  // 충돌 처리
  this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
  this.physics.add.overlap(bullets, kingEnemies, hitKingEnemy, null, this); // 킹 에너미 충돌 처리
  this.physics.add.overlap(bullets, kingKingEnemies, hitKingKingEnemy, null, this); // 킹킹 에너미 충돌 처리
  this.physics.add.overlap(player, enemies, playerHit, null, this);
  this.physics.add.overlap(player, kingEnemies, playerHit, null, this); // 킹 에너미와 플레이어 충돌
  this.physics.add.overlap(player, kingKingEnemies, playerHit, null, this); // 킹킹 에너미와 플레이어 충돌
  this.physics.add.overlap(player, enemyBullets, playerHitByBullet, null, this);
  this.physics.add.overlap(player, coins, collectCoin, null, this);
  this.physics.add.overlap(player, powerups, collectPowerup, null, this); // 파워업 수집

  // 키보드 입력 설정
  cursors = this.input.keyboard.createCursorKeys();

  // 모바일 감지 및 터치 컨트롤 설정
  isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  if (isMobile) {
    // 전체 화면 터치 영역 설정
    this.input.on('pointerdown', (pointer) => {
      touchTargetX = pointer.x;
      isTouching = true;
    });
    
    this.input.on('pointerup', () => {
      isTouching = false;
    });
    
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        touchTargetX = pointer.x;
      }
    });
  }
}

function update(time) { // 게임 업데이트
  if (isGameOver) { // 게임 오버 상태면 모든 업데이트 중단
    return;
  }

  // 배경 스크롤
  background.tilePositionY -= 2;

  // 주행거리
  distance += 2; // 배경 스크롤 속도와 동일
  distanceText.setText('Distance: ' + Math.floor(distance / 10) + 'm'); // 10픽셀 = 1미터로 변환

  // 200m마다 킹 에너미 스폰
  const currentDistance = Math.floor(distance / 10);
  if (currentDistance > 0 && currentDistance % 200 === 0 && currentDistance > lastKingSpawn) {
    lastKingSpawn = currentDistance;
    this.spawnKingEnemy(); // 킹 에너미 스폰 함수 호출
  }

  // 500m마다 킹킹 에너미 스폰
  if (currentDistance > 0 && currentDistance % 500 === 0 && currentDistance > lastKingKingSpawn) {
    lastKingKingSpawn = currentDistance;
    this.spawnKingKingEnemy(); // 킹킹 에너미 스폰 함수 호출
  }

  // 키보드 및 터치 입력으로 플레이어 이동
  let moveSpeed = 5;
  
  // 키보드 입력 (PC)
  if (cursors.left.isDown) {
    player.x -= moveSpeed;
  } else if (cursors.right.isDown) {
    player.x += moveSpeed;
  }
  
  // 터치 입력 (모바일)
  if (isTouching && isMobile) {
    const distance = touchTargetX - player.x;
    const touchMoveSpeed = 8;
    
    if (Math.abs(distance) > 5) { // 5픽셀 이상 차이날 때만 이동
      if (distance > 0) {
        player.x += Math.min(touchMoveSpeed, distance);
      } else {
        player.x += Math.max(-touchMoveSpeed, distance);
      }
    }
  }
  
  // 플레이어가 화면 밖으로 나가지 않도록 제한
  player.x = Phaser.Math.Clamp(player.x, 30, 450);

  // 더블 총알 타이머 확인
  if (isDoubleBullet && time > doubleBulletEndTime) {
    isDoubleBullet = false;
  }

  // 자동 발사
  if (time > lastFired) {
    if (isDoubleBullet) {
      // 더블 총알 - 두 발을 양쪽으로
      const leftBullet = bullets.create(player.x - 15, player.y - 20, 'bullet');
      leftBullet.setScale(1.5);
      leftBullet.setVelocityY(-300);
      const rightBullet = bullets.create(player.x + 15, player.y - 20, 'bullet');
      rightBullet.setScale(1.5);
      rightBullet.setVelocityY(-300);
    } else {
      // 일반 총알
      const bullet = bullets.create(player.x, player.y - 20, 'bullet');
      bullet.setScale(1.5);
      bullet.setVelocityY(-300);
    }
    lastFired = time + 250;
  }

  // 화면 밖 총알 제거
  bullets.children.iterate((bullet) => (bullet && bullet.y < -50) && bullet.destroy());

  // 화면 밖 적 제거
  enemies.children.iterate((enemy) => (enemy && enemy.y > 850) && enemy.destroy());

  // 화면 밖 킹 에너미 제거
  kingEnemies.children.iterate((kingEnemy) => {
    if (kingEnemy && kingEnemy.y > 850) {
      if (kingEnemy.healthBarBg) kingEnemy.healthBarBg.destroy();
      if (kingEnemy.healthBarFill) kingEnemy.healthBarFill.destroy();
      kingEnemy.destroy();
    } else if (kingEnemy && kingEnemy.active) {
      // 킹 에너미와 함께 체력바도 이동
      if (kingEnemy.healthBarBg) {
        kingEnemy.healthBarBg.x = kingEnemy.x;
        kingEnemy.healthBarBg.y = kingEnemy.y - 40;
      }
      if (kingEnemy.healthBarFill) {
        kingEnemy.healthBarFill.x = kingEnemy.x;
        kingEnemy.healthBarFill.y = kingEnemy.y - 40;
      }
    }
  });

  // 화면 밖 킹킹 에너미 제거
  kingKingEnemies.children.iterate((kingKingEnemy) => {
    if (kingKingEnemy && kingKingEnemy.y > 850) {
      // 킹킹 에너미와 함께 체력바도 제거
      if (kingKingEnemy.healthBarBg) kingKingEnemy.healthBarBg.destroy();
      if (kingKingEnemy.healthBarFill) kingKingEnemy.healthBarFill.destroy();
      kingKingEnemy.destroy();
    } else if (kingKingEnemy && kingKingEnemy.active) {
      // 킹킹 에너미와 함께 체력바도 이동
      if (kingKingEnemy.healthBarBg) {
        kingKingEnemy.healthBarBg.x = kingKingEnemy.x;
        kingKingEnemy.healthBarBg.y = kingKingEnemy.y - 50;
      }
      if (kingKingEnemy.healthBarFill) {
        kingKingEnemy.healthBarFill.x = kingKingEnemy.x;
        kingKingEnemy.healthBarFill.y = kingKingEnemy.y - 50;
      }
    }
  });

  // 화면 밖 적 총알 제거
  enemyBullets.children.iterate((enemyBullet) => {
    if (enemyBullet && enemyBullet.y > 850) enemyBullet.destroy();
  });

  // 화면 밖 동전 제거
  coins.children.iterate((coin) => {
    if (coin && coin.y > 850) {
      coin.destroy();
    } else if (coin && coin.active) {
      // 동전 회전 애니메이션 업데이트
      coin.coinRotation += 0.15; // 회전 속도 조절
      const x = Math.cos(coin.coinRotation) * 0.4; // X축 회전
      coin.setScale(Math.abs(x), 0.4); // X축만 변화, Y축은 0.4로 고정
      if (Math.cos(coin.coinRotation) < 0) {
        coin.setTint(0xcccccc); // 뒷면일 때는 살짝 어둡게
      } else {
        coin.clearTint();
      }
    }
  });

  // 화면 밖 파워업 제거
  powerups.children.iterate((powerup) => {
    if (powerup && powerup.y > 850) powerup.destroy();
  });
}

function hitEnemy(bullet, enemy) { // 적과 총알 충돌 처리
  bullet.destroy(); // 총알 제거
  
  // 적이 있던 위치에 동전 생성
  const coin = coins.create(enemy.x, enemy.y, 'coin');
  coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-50, 50)); // 크기, 속도 설정
  
  // 동전 회전 애니메이션 - X축 스케일을 변화시켜 뒤집히는 효과
  coin.coinRotation = 0;

  // 적 처치 시 점수 획득
  score += 5;
  scoreText.setText('Score: ' + score);
  
  enemy.destroy();
}

function hitKingEnemy(bullet, kingEnemy) { // 킹 에너미와 총알 충돌 처리
  bullet.destroy(); // 총알 제거
  
  // 킹 에너미 체력 감소
  kingEnemy.health--;
  
  // 체력바 업데이트
  if (kingEnemy.healthBarFill) {
    const healthRatio = kingEnemy.health / kingEnemy.maxHealth;
    kingEnemy.healthBarFill.width = 100 * healthRatio;
    
    // 체력에 따라 체력바 색상 변경
    if (healthRatio > 0.6) {
      kingEnemy.healthBarFill.fillColor = 0x00ff00; // 초록색
    } else if (healthRatio > 0.3) {
      kingEnemy.healthBarFill.fillColor = 0xffff00; // 노란색
    } else {
      kingEnemy.healthBarFill.fillColor = 0xff0000; // 빨간색
    }
  }
  
  // 맞을 때마다 깜빡이는 효과
  kingEnemy.setTint(0xffffff);
  setTimeout(() => {
    if (kingEnemy && kingEnemy.active) {
      kingEnemy.setTint(0xff6600);
    }
  }, 100);
  
  // 체력에 따라 크기 조정 (체력이 줄수록 작아짐)
  const healthRatio = kingEnemy.health / kingEnemy.maxHealth;
  kingEnemy.setScale(0.8 + (healthRatio * 0.2)); // 0.8 ~ 1.0 사이로 크기 조정
  
  if (kingEnemy.health <= 0) {
    // 킹 에너미가 죽으면 체력바도 제거
    if (kingEnemy.healthBarBg) kingEnemy.healthBarBg.destroy();
    if (kingEnemy.healthBarFill) kingEnemy.healthBarFill.destroy();
    
    // 킹 에너미가 죽으면 동전 5개 드랍 (더 많은 보상)
    for (let i = 0; i < 5; i++) {
      const coin = coins.create( kingEnemy.x + Phaser.Math.Between(-40, 40),  kingEnemy.y + Phaser.Math.Between(-30, 30),  'coin');
      coin.setScale(0.4).setVelocityY(200). setVelocityX(Phaser.Math.Between(-120, 120));
      coin.coinRotation = 0;
    }
    
    // 킹 에너미 처치 시 큰 점수 획득
    score += 100;
    scoreText.setText('Score: ' + score);
    
    kingEnemy.destroy();
  } else {
    // 아직 살아있으면 점수 조금 획득
    score += 5;
    scoreText.setText('Score: ' + score);
  }
}

function hitKingKingEnemy(bullet, kingKingEnemy) {
  bullet.destroy();
  
  // 킹킹 에너미 체력 감소
  kingKingEnemy.health--;
  
  // 체력바 업데이트
  if (kingKingEnemy.healthBarFill) {
    const healthRatio = kingKingEnemy.health / kingKingEnemy.maxHealth;
    kingKingEnemy.healthBarFill.width = 150 * healthRatio;
    
    // 체력에 따라 체력바 색상 변경
    if (healthRatio > 0.7) {
      kingKingEnemy.healthBarFill.fillColor = 0xff0000; // 빨간색
    } else if (healthRatio > 0.4) {
      kingKingEnemy.healthBarFill.fillColor = 0xff6600; // 주황색
    } else {
      kingKingEnemy.healthBarFill.fillColor = 0x660000; // 진한 빨간색
    }
  }
  
  // 맞을 때마다 깜빡이는 효과
  kingKingEnemy.setTint(0xffffff);
  setTimeout(() => {
    if (kingKingEnemy && kingKingEnemy.active) {
      kingKingEnemy.setTint(0xff0000);
    }
  }, 100);
  
  // 체력에 따라 크기 조정 (체력이 줄수록 작아짐)
  const healthRatio = kingKingEnemy.health / kingKingEnemy.maxHealth;
  kingKingEnemy.setScale(1.2 + (healthRatio * 0.3)); // 1.2 ~ 1.5 사이로 크기 조정
  
  if (kingKingEnemy.health <= 0) {
    // 킹킹 에너미가 죽으면 체력바도 제거
    if (kingKingEnemy.healthBarBg) kingKingEnemy.healthBarBg.destroy();
    if (kingKingEnemy.healthBarFill) kingKingEnemy.healthBarFill.destroy();
    
    // 킹킹 에너미가 죽으면 동전 10개 드랍 (매우 많은 보상)
    for (let i = 0; i < 10; i++) {
      const coin = coins.create(kingKingEnemy.x + Phaser.Math.Between(-60, 60),  kingKingEnemy.y + Phaser.Math.Between(-40, 40),  'coin');
      coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-150, 150));
      coin.coinRotation = 0;
    }
    
    // 킹킹 에너미 처치 시 엄청난 점수 획득
    score += 300;
    scoreText.setText('Score: ' + score);
    
    kingKingEnemy.destroy();
  } else {
    // 아직 살아있으면 점수 조금 획득
    score += 8;
    scoreText.setText('Score: ' + score);
  }
}

function collectCoin(player, coin) { // 동전 수집
  coin.setAlpha(0.7);

  setTimeout(() => {
    if (coin && coin.active) {
      coin.destroy();
    }
  }, 100);
  
  score += 10;
  scoreText.setText('Score: ' + score);
}

function collectPowerup(player, powerup) { // 파워업 수집
  powerup.setScale(0.8).setTint(0xffffff); // 파워업 수집 효과 - 폭발하면서 사라짐
  
  // 파워업 획득 시 더블 총알 활성화 (5초간)
  isDoubleBullet = true;
  doubleBulletEndTime = this.time.now + 5000;
  
  this.tweens.add({ // tweens는 Phaser의 애니메이션 시스템
    targets: powerup,
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0,
    duration: 200,
    onComplete: () => {
      powerup.destroy();
    }
  });
  
  // 플레이어 색상 변화로 더블 총알 상태 표시
  player.setTint(0x00ff00); // 초록색으로 변경
  
  // 5초 후 원래 색으로 되돌리기
  this.time.delayedCall(5000, () => {
    if (player && player.active) {
      player.clearTint();
    }
  });
  
  score += 50; // 파워업 수집 시 보너스 점수
  scoreText.setText('Score: ' + score);
}

function playerHit(player, enemy) {
  enemy.destroy();
  
  // 만약 킹 에너미 또는 킹킹 에너미와 충돌했다면 체력바도 제거
  if (enemy.healthBarBg) enemy.healthBarBg.destroy();
  if (enemy.healthBarFill) enemy.healthBarFill.destroy();
  
  isGameOver = true;
  this.physics.pause();
  player.setTint(0xff0000);
  
  // 플레이어가 맞을 때 짧은 진동 효과
  this.cameras.main.shake(300, 0.015); // 0.3초 동안 강도 0.015로 진동
  
  // 게임 오버 텍스트 표시
  gameOverText.setVisible(true);
  gameOverText.setText('GAME OVER\n\nFinal Score: ' + score + '\nDistance: ' + Math.floor(distance / 10) + 'm');
  
  // 다시하기 버튼 표시
  restartButton.setVisible(true);
  
  // 화면 상단 텍스트는 숨김
  scoreText.setVisible(false);
  distanceText.setVisible(false);
}

function playerHitByBullet(player, enemyBullet) {
  enemyBullet.destroy();
  isGameOver = true;
  this.physics.pause();
  player.setTint(0xff0000);
  
  // 플레이어가 총알에 맞을 때 짧은 진동 효과
  this.cameras.main.shake(300, 0.015); // 0.3초 동안 강도 0.015로 진동
  
  // 게임 오버 텍스트 표시
  gameOverText.setVisible(true);
  gameOverText.setText('GAME OVER\n\nFinal Score: ' + score + '\nDistance: ' + Math.floor(distance / 10) + 'm');
  
  // 다시하기 버튼 표시
  restartButton.setVisible(true);
  
  // 화면 상단 텍스트는 숨김
  scoreText.setVisible(false);
  distanceText.setVisible(false);
}
