// 적, 파워업, 총알 스폰 시스템

class SpawnSystem {
  constructor(scene) {
    this.scene = scene;
    this.enemyTimer = null;
    this.bulletTimer = null;
    this.powerupTimer = null;
    this.isActive = false;
    this.hasPowerupActive = false; // 파워업이 화면에 있는지 추적
  }

  // 스폰 시스템 시작
  startSpawning() {
    this.isActive = true;
    this.spawnEnemies();
    this.spawnEnemyBullets();
  }

  // 스폰 시스템 정지
  stopSpawning() {
    this.isActive = false;
    this.hasPowerupActive = false; // 파워업 상태도 초기화
    this.clearAllTimers();
  }

  // 공통: 체력바 생성
  createHealthBar(x, y, width, height, bgAlpha = 0.7, fillColor = 0x00ff00) {
    const healthBarBg = this.scene.add.rectangle(x, y, width, height, 0x000000, bgAlpha);
    const healthBarFill = this.scene.add.rectangle(x, y, width, height - 2, fillColor);
    return { healthBarBg, healthBarFill };
  }

  // 공통: 에너미 기본 설정
  setupEnemy(enemy, x, y, scale, velocityY, tint, health) {
    enemy.setScale(scale);
    enemy.setVelocityY(velocityY);
    if (tint) enemy.setTint(tint);
    
    enemy.health = health;
    enemy.maxHealth = health;
    
    return enemy;
  }

  // 공통: 총알 생성
  createBullet(x, y, scale, tint, velocityX = 0, velocityY = 0, angularVelocity = 0) {
    const bullet = enemyBullets.create(x, y, 'enemyBullet');
    bullet.setScale(scale);
    if (tint) bullet.setTint(tint);
    if (velocityX || velocityY) bullet.setVelocity(velocityX, velocityY);
    if (angularVelocity) bullet.setAngularVelocity(angularVelocity);
    return bullet;
  }

  // 공통: 다음 스폰 예약
  scheduleNextSpawn(callback, minTime, maxTime) {
    if (this.isActive) {
      return this.scene.time.delayedCall(Phaser.Math.Between(minTime, maxTime), callback);
    }
    return null;
  }

  // 겹치지 않는 위치 찾기 (화면의 기존 적들과도 비교)
  findNonOverlappingPosition(existingPositions, minDistance = 80) {
    let attempts = 0;
    let x;
    
    // 화면에 있는 기존 적들의 위치도 수집
    const allPositions = [...existingPositions];
    
    // 화면 상단에 있는 적들 위치 추가 (y < 100인 적들만)
    enemies.children.iterate((enemy) => {
      if (enemy && enemy.active && enemy.y < 100) {
        allPositions.push(enemy.x);
      }
    });
    
    do {
      x = Phaser.Math.Between(50, 430);
      attempts++;
      
      // 무한 루프 방지 (50번 시도 후 포기)
      if (attempts > 50) {
        break;
      }
      
      // 모든 위치들과 최소 거리 체크
      let tooClose = false;
      for (let pos of allPositions) {
        if (Math.abs(x - pos) < minDistance) {
          tooClose = true;
          break;
        }
      }
      
      if (!tooClose) {
        break;
      }
    } while (true);
    
    return x;
  }

  // 일반 적 스폰
  spawnEnemies() {
    if (isGameOver || !this.isActive) return;
    
    const enemyCount = Phaser.Math.Between(2, 3);
    const spawnedPositions = []; // 이미 스폰된 위치들 저장
    
    for (let i = 0; i < enemyCount; i++) {
      // 겹치지 않는 위치 찾기
      const x = this.findNonOverlappingPosition(spawnedPositions, 80);
      spawnedPositions.push(x); // 새 위치를 배열에 추가
      
      const enemy = enemies.create(x, -50, 'enemy');
      this.setupEnemy(enemy, x, -50, 0.5, 150, null, GAME_CONSTANTS.ENEMY_HEALTH);
      
      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar(x, -70, 60, 6, 0.6);
      enemy.healthBarBg = healthBarBg;
      enemy.healthBarFill = healthBarFill;
    }
    
    // 다음 스폰 예약
    this.enemyTimer = this.scheduleNextSpawn(() => this.spawnEnemies(), 1500, 3000);
  }

  // 적 총알 스폰
  spawnEnemyBullets() {
    if (isGameOver || !this.isActive) return;
    
    this.createWarningEffect(0.4, 150, 2, () => {
      if (!this.isActive) return; // 중간에 정지될 수 있으므로 다시 체크
      
      const x = Phaser.Math.Between(20, 460);
      const enemyBullet = this.createBullet(x, 0, 3, null, Phaser.Math.Between(-30, 30), 400, 720);
      
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
    
    // 다음 스폰 예약
    this.bulletTimer = this.scheduleNextSpawn(() => this.spawnEnemyBullets(), 2000, 6000);
  }

  // 킹 에너미 스폰
  spawnKingEnemy() {
    if (isGameOver) return;
    
    this.createWarningEffect(0.6, 200, 4, () => {
      const kingEnemy = kingEnemies.create(240, -50, 'king_enemy');
      this.setupEnemy(kingEnemy, 240, -50, 1.0, 100, 0xff6600, GAME_CONSTANTS.KING_ENEMY_HEALTH);
      
      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar(240, -20, 100, 8);
      kingEnemy.healthBarBg = healthBarBg;
      kingEnemy.healthBarFill = healthBarFill;
      
      // 킹 에너미 총알 발사 설정
      kingEnemy.fireRate = GAME_CONSTANTS.KING_FIRE_RATE;
      
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
    const angle = Phaser.Math.Angle.Between(kingEnemy.x, kingEnemy.y, player.x, player.y);
    const speed = GAME_CONSTANTS.KING_BULLET_SPEED;
    
    const kingBullet = this.createBullet(
      kingEnemy.x, kingEnemy.y + 25, 1.5, 0xff6600,
      Math.cos(angle) * speed, Math.sin(angle) * speed, 270
    );
    
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
      this.setupEnemy(kingKingEnemy, 240, -50, 1.5, 80, 0xff0000, GAME_CONSTANTS.KING_KING_ENEMY_HEALTH);
      
      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar(240, -20, 150, 12, 0.8, 0xff0000);
      kingKingEnemy.healthBarBg = healthBarBg;
      kingKingEnemy.healthBarFill = healthBarFill;
      
      // 킹킹 에너미가 화면에 완전히 들어왔을 때 총알 발사 시작
      this.scene.time.delayedCall(2000, () => {
        this.startKingKingEnemyFiring(kingKingEnemy);
      });
    });
  }

  // 킹킹 에너미 총알 발사 시스템
  startKingKingEnemyFiring(kingKingEnemy) {
    if (!kingKingEnemy || !kingKingEnemy.active || isGameOver) return;
    
    // 아래쪽 부채꼴 모양으로 10개 총알 발사
    for (let i = 0; i < 10; i++) {
      // 아래쪽 부채꼴 각도 (30도 ~ 150도 사이, 아래 방향만)
      const angle = Phaser.Math.DegToRad(30 + (i * 13.33)); // 30, 43.33, 56.66, 70, 83.33, 96.66, 110, 123.33, 136.66, 150도
      const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
      
      this.createBullet(
        kingKingEnemy.x, kingKingEnemy.y + 30, 2, 0xff0000,
        Math.cos(angle) * speed, Math.sin(angle) * speed, 360
      );
    }
    
    // 반복 호출 제거 - 한 번만 발사
  }

  // 파워업 스폰
  spawnPowerup() {
    if (isGameOver || !this.isActive || this.hasPowerupActive) return;
    
    // 파워업이 화면에 있는지 체크
    let activePowerups = 0;
    powerups.children.iterate((powerup) => {
      if (powerup && powerup.active) {
        activePowerups++;
      }
    });
    
    // 이미 파워업이 화면에 있으면 스폰하지 않음
    if (activePowerups > 0) {
      // 다음 파워업 스폰 예약 (짧은 시간 후 다시 체크)
      if (this.isActive) {
        this.powerupTimer = this.scene.time.delayedCall(2000, () => {
          this.spawnPowerup();
        });
      }
      return;
    }
    
    this.hasPowerupActive = true; // 파워업 스폰 시작
    
    const x = Phaser.Math.Between(50, 430);
    const powerup = powerups.create(x, -30, 'powerup');
    powerup.setScale(2);
    powerup.setVelocityY(120);
    powerup.setTint(0x00ff00);
    
    // 파워업이 제거될 때 플래그 리셋하는 이벤트 추가
    powerup.on('destroy', () => {
      this.hasPowerupActive = false;
    });
    
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
    
    // 다음 파워업 스폰 예약
    if (this.isActive) {
      this.powerupTimer = this.scene.time.delayedCall(
        Phaser.Math.Between(GAME_CONSTANTS.POWERUP_MIN_SPAWN_TIME, GAME_CONSTANTS.POWERUP_MAX_SPAWN_TIME),
        () => {
          this.spawnPowerup();
        }
      );
    }
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

  // 모든 타이머 정리
  clearAllTimers() {
    this.isActive = false;
    this.hasPowerupActive = false; // 파워업 상태도 초기화
    
    // 개별 타이머 제거
    if (this.enemyTimer) {
      this.enemyTimer.remove();
      this.enemyTimer = null;
    }
    if (this.bulletTimer) {
      this.bulletTimer.remove();
      this.bulletTimer = null;
    }
    if (this.powerupTimer) {
      this.powerupTimer.remove();
      this.powerupTimer = null;
    }
    
    // 스폰 시스템의 모든 지연된 호출과 트윈 정리
    if (this.scene.time) {
      this.scene.time.removeAllEvents();
    }
    if (this.scene.tweens) {
      this.scene.tweens.killAll();
    }
  }
}
