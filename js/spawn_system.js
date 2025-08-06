// 적, 파워업, 총알 스폰 시스템

class SpawnSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // 일반 적 스폰
  spawnEnemies() {
    if (isGameOver) return;
    
    const enemyCount = Phaser.Math.Between(2, 3);
    
    for (let i = 0; i < enemyCount; i++) {
      const x = Phaser.Math.Between(50, 430);
      const enemy = enemies.create(x, -50, 'enemy');
      enemy.setScale(0.5);
      enemy.setVelocityY(150);
      
      // 일반 적도 체력 설정 (3번 맞아야 죽음)
      enemy.health = GAME_CONSTANTS.ENEMY_HEALTH;
      enemy.maxHealth = GAME_CONSTANTS.ENEMY_HEALTH;
      
      // 체력바 생성
      const healthBarBg = this.scene.add.rectangle(x, -70, 60, 6, 0x000000, 0.6);
      const healthBarFill = this.scene.add.rectangle(x, -70, 60, 4, 0x00ff00);
      
      // 체력바를 적의 속성으로 저장
      enemy.healthBarBg = healthBarBg;
      enemy.healthBarFill = healthBarFill;
    }
    
    this.scene.time.delayedCall(Phaser.Math.Between(1500, 3000), () => this.spawnEnemies());
  }

  // 적 총알 스폰
  spawnEnemyBullets() {
    if (isGameOver) return;
    
    this.createWarningEffect(0.4, 150, 2, () => {
      const x = Phaser.Math.Between(20, 460);
      const enemyBullet = enemyBullets.create(x, 0, 'enemyBullet');
      enemyBullet.setScale(3);
      enemyBullet.setVelocityY(400);
      
      // 회전 및 흔들림 효과
      enemyBullet.setAngularVelocity(720);
      enemyBullet.setVelocityX(Phaser.Math.Between(-30, 30));
      
      // 크기 펄스 효과
      this.scene.tweens.add({
        targets: enemyBullet,
        scaleX: 3.3,
        scaleY: 3.3,
        duration: 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
    
    this.scene.time.delayedCall(Phaser.Math.Between(2000, 6000), () => this.spawnEnemyBullets());
  }

  // 킹 에너미 스폰
  spawnKingEnemy() {
    if (isGameOver) return;
    
    this.createWarningEffect(0.6, 200, 4, () => {
      const kingEnemy = kingEnemies.create(240, -50, 'king_enemy');
      kingEnemy.setScale(1.0);
      kingEnemy.setVelocityY(100);
      kingEnemy.setTint(0xff6600);
      
      // 킹 에너미 체력 설정
      kingEnemy.health = GAME_CONSTANTS.KING_ENEMY_HEALTH;
      kingEnemy.maxHealth = GAME_CONSTANTS.KING_ENEMY_HEALTH;
      
      // 체력바 생성
      const healthBarBg = this.scene.add.rectangle(240, -20, 100, 8, 0x000000, 0.7);
      const healthBarFill = this.scene.add.rectangle(240, -20, 100, 6, 0x00ff00);
      
      kingEnemy.healthBarBg = healthBarBg;
      kingEnemy.healthBarFill = healthBarFill;
      
      // 킹 에너미 총알 발사 타이머 설정
      kingEnemy.lastFired = 0;
      kingEnemy.fireRate = GAME_CONSTANTS.KING_FIRE_RATE; // 2초마다 발사
      
      // 킹 에너미가 화면에 완전히 들어왔을 때 총알 발사 시작
      this.scene.time.delayedCall(2500, () => {
        this.startKingEnemyFiring(kingEnemy);
      });
    });
  }

  // 킹 에너미 총알 발사 시스템
  startKingEnemyFiring(kingEnemy) {
    if (!kingEnemy || !kingEnemy.active || isGameOver) return;
    
    // 플레이어 방향으로 총알 발사
    const kingBullet = enemyBullets.create(kingEnemy.x, kingEnemy.y + 25, 'enemyBullet');
    kingBullet.setScale(1.5);
    kingBullet.setTint(0xff6600); // 주황색 총알
    
    // 플레이어 방향 계산
    const angle = Phaser.Math.Angle.Between(kingEnemy.x, kingEnemy.y, player.x, player.y);
    const speed = GAME_CONSTANTS.KING_BULLET_SPEED;
    
    kingBullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    
    // 총알 회전 효과
    kingBullet.setAngularVelocity(270);
    
    // 다음 발사 예약 (킹 에너미가 살아있는 동안 계속 발사)
    this.scene.time.delayedCall(kingEnemy.fireRate, () => {
      this.startKingEnemyFiring(kingEnemy);
    });
  }

  // 킹킹 에너미 스폰
  spawnKingKingEnemy() {
    if (isGameOver) return;
    
    this.createWarningEffect(0.8, 300, 6, () => {
      const kingKingEnemy = kingKingEnemies.create(240, -50, 'king_king_enemy');
      kingKingEnemy.setScale(1.5);
      kingKingEnemy.setVelocityY(80);
      kingKingEnemy.setTint(0xff0000);
      
      // 킹킹 에너미 체력 설정
      kingKingEnemy.health = GAME_CONSTANTS.KING_KING_ENEMY_HEALTH;
      kingKingEnemy.maxHealth = GAME_CONSTANTS.KING_KING_ENEMY_HEALTH;
      
      // 체력바 생성
      const healthBarBg = this.scene.add.rectangle(240, -20, 150, 12, 0x000000, 0.8);
      const healthBarFill = this.scene.add.rectangle(240, -20, 150, 10, 0xff0000);
      
      kingKingEnemy.healthBarBg = healthBarBg;
      kingKingEnemy.healthBarFill = healthBarFill;
      
      // 킹킹 에너미 총알 발사 타이머 설정
      kingKingEnemy.lastFired = 0;
      kingKingEnemy.fireRate = GAME_CONSTANTS.KING_KING_FIRE_RATE; // 1초마다 발사
      
      // 킹킹 에너미가 화면에 완전히 들어왔을 때 총알 발사 시작
      this.scene.time.delayedCall(2000, () => {
        this.startKingKingEnemyFiring(kingKingEnemy);
      });
    });
  }

  // 킹킹 에너미 총알 발사 시스템
  startKingKingEnemyFiring(kingKingEnemy) {
    if (!kingKingEnemy || !kingKingEnemy.active || isGameOver) return;
    
    // 플레이어 방향으로 총알 발사
    const kingKingBullet = enemyBullets.create(kingKingEnemy.x, kingKingEnemy.y + 30, 'enemyBullet');
    kingKingBullet.setScale(2);
    kingKingBullet.setTint(0xff0000); // 빨간색 총알
    
    // 플레이어 방향 계산
    const angle = Phaser.Math.Angle.Between(kingKingEnemy.x, kingKingEnemy.y, player.x, player.y);
    const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
    
    kingKingBullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    
    // 총알 회전 효과
    kingKingBullet.setAngularVelocity(360);
    
    // 다음 발사 예약 (킹킹 에너미가 살아있는 동안 계속 발사)
    this.scene.time.delayedCall(kingKingEnemy.fireRate, () => {
      this.startKingKingEnemyFiring(kingKingEnemy);
    });
  }

  // 파워업 스폰
  spawnPowerup() {
    if (isGameOver) return;
    
    const x = Phaser.Math.Between(50, 430);
    const powerup = powerups.create(x, -30, 'powerup');
    powerup.setScale(2);
    powerup.setVelocityY(120);
    powerup.setTint(0x00ff00);
    
    // 반짝이는 효과
    this.scene.tweens.add({
      targets: powerup,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // 회전 효과
    powerup.setAngularVelocity(540);
    
    // 크기 펄스 효과
    this.scene.tweens.add({
      targets: powerup,
      scaleX: 2.4,
      scaleY: 2.4,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.scene.time.delayedCall(Phaser.Math.Between(GAME_CONSTANTS.POWERUP_MIN_SPAWN_TIME, GAME_CONSTANTS.POWERUP_MAX_SPAWN_TIME), () => this.spawnPowerup());
  }

  // 경고 효과 생성 헬퍼 함수
  createWarningEffect(alpha, duration, repeat, callback) {
    warningOverlay.setVisible(true);
    warningOverlay.setAlpha(alpha);
    
    this.scene.tweens.add({
      targets: warningOverlay,
      alpha: 0,
      duration: duration,
      yoyo: true,
      repeat: repeat,
      onComplete: () => {
        warningOverlay.setVisible(false);
        callback();
      }
    });
  }
}
