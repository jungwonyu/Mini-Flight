// 적, 파워업, 총알 스폰 시스템

class SpawnSystem {
  // 스폰 시스템 재개 (resume)
  resumeSpawning() {
  this.clearAllTimers();
  this.isActive = true;
  this.startSpawning();
  // 이어하기 직후 파워업 강제 스폰
  this.hasPowerupActive = false;
  this.spawnPowerup();
  }
  // key 오브젝트 스폰
  spawnKey() {
    if (typeof keys === 'undefined' || !keys) {
      keys = this.scene.physics.add.group();
    }
    const x = Phaser.Math.Between(60, 420);
    const keyObj = keys.create(x, -40, 'key');
    keyObj.setScale(0.7).setVelocityY(160);
    // 반짝임 효과
    this.scene.tweens.add({
      targets: keyObj,
      alpha: 0.5,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // 회전 효과
    keyObj.setAngularVelocity(180);
    return keyObj;
  }

  // 피버타임 코인 비 효과
  startFeverTimeCoinRain() {
    if (!this.scene || typeof isFeverTime === 'undefined') return;
    if (!isFeverTime) return;

    const xPositions = [120, 360]; // 두 줄의 x좌표
    const yStart = -40; // 시작 y좌표
    const yGap = 120; // 코인 간 y 간격

    for (let i = 0; i < 1; i++) {
      for (let j = 0; j < xPositions.length; j++) {
        const y = yStart - i * yGap;
        const coin = coins.create(xPositions[j], y, 'coin');
        coin
          .setScale(0.7)
          .setVelocityY(200)
          .setVelocityX(Phaser.Math.Between(-30, 30)); // 코인 크기 증가
        coin.coinRotation = 0;
      }
    }

    // 피버타임이 유지되는 동안 반복적으로 코인 생성
    if (isFeverTime) {
      this.scene.time.delayedCall(800, () => {
        this.startFeverTimeCoinRain();
      });
    }
  }

  constructor(scene) {
    this.scene = scene;
    this.enemyTimer = null;
    this.bulletTimer = null;
    this.powerupTimer = null;
    this.isActive = false;
    this.hasPowerupActive = false;
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
  createHealthBar( x, y, width, height, bgAlpha = 0.7, fillColor = GAME_COLORS.GREEN) {
    const healthBarBg = this.scene.add.rectangle( x, y, width, height, GAME_COLORS.BLACK, bgAlpha );
    const healthBarFill = this.scene.add.rectangle( x, y, width, height - 2, fillColor );
    return { healthBarBg, healthBarFill };
  }

  // 공통: 에너미 기본 설정
  setupEnemy(enemy, x, y, scale, velocityY, tint, health) {
    // 적 애니메이션 적용 (spritesheet 사용 시)
    if (enemy.anims && enemy.texture && enemy.texture.key === 'enemy') {
      if (!enemy.scene.anims.exists('enemyFly')) {
        enemy.scene.anims.create({
          key: 'enemyFly',
          frames: enemy.scene.anims.generateFrameNumbers('enemy', { start: 0, end: 1 }),
          frameRate: 5,
          repeat: -1
        });
      }
      enemy.anims.play('enemyFly', true);
      enemy.setSize(enemy.width * 0.6, enemy.height * 0.6);
    }

    if (enemy.anims && enemy.texture && enemy.texture.key === 'king_enemy') {
      if (!enemy.scene.anims.exists('king_enemyFly')) {
        enemy.scene.anims.create({
          key: 'king_enemyFly',
          frames: enemy.scene.anims.generateFrameNumbers('king_enemy', { start: 0, end: 4 }),
          frameRate: 4,
          repeat: -1
        });
      }
      enemy.anims.play('king_enemyFly', true);
      enemy.setSize(enemy.width * 0.6, enemy.height * 0.6);
    }

    if (enemy.anims && enemy.texture && enemy.texture.key === 'king_king_enemy') {
      if (!enemy.scene.anims.exists('king_king_enemyFly')) {
        enemy.scene.anims.create({
          key: 'king_king_enemyFly',
          frames: enemy.scene.anims.generateFrameNumbers('king_king_enemy', { start: 0, end: 5 }),
          frameRate: 5,
          repeat: -1
        });
      }
      enemy.anims.play('king_king_enemyFly', true);
      enemy.setSize(enemy.width * 0.6, enemy.height * 0.6);
    }

    enemy.setVelocityY(velocityY);
    if (tint) enemy.setTint(tint);

    enemy.health = health;
    enemy.maxHealth = health;

    return enemy;
  }

  // 공통: 총알 생성
  createBullet( x, y, scale, tint, velocityX = 0, velocityY = 0, angularVelocity = 0 ) {
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
      return this.scene.time.delayedCall(
        Phaser.Math.Between(minTime, maxTime),
        callback
      );
    }
    return null;
  }

  // 겹치지 않는 위치 찾기
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
    if (isGameOver || !this.isActive || isKingKingEnemyActive) return;

    // 피버타임이면 적 더 많이, 더 자주 스폰
    let fever = typeof isFeverTime !== 'undefined' && isFeverTime;
    // 피버타임이면 적 스폰 중단, 동전만 떨어지게
    if (typeof isFeverTime !== 'undefined' && isFeverTime) {
      // 적 스폰 중단, 대신 코인 비 효과만 유지
      // 피버타임이 끝나면 적 스폰 재개 예약
      this.enemyTimer = this.scene.time.delayedCall(600, () => this.spawnEnemies());
      return;
    }
    const enemyCount = Phaser.Math.Between(2, 3);
    const spawnedPositions = []; // 이미 스폰된 위치들 저장

    for (let i = 0; i < enemyCount; i++) {
      // 겹치지 않는 위치 찾기
      const x = this.findNonOverlappingPosition(spawnedPositions, 80);
      spawnedPositions.push(x); // 새 위치를 배열에 추가

      const enemy = enemies.create(x, -50, 'enemy');
      this.setupEnemy( enemy, x, -50, 0.9, 150, null, GAME_CONSTANTS.ENEMY_HEALTH );
      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar( x, -70, 60, 6, 0.6 );
      enemy.healthBarBg = healthBarBg;
      enemy.healthBarFill = healthBarFill;
    }

    // 다음 스폰 예약
    this.enemyTimer = this.scheduleNextSpawn(
      () => this.spawnEnemies(), 1500, 3000
    );
  }

  // 적 총알 스폰
  spawnEnemyBullets() {
    if (isGameOver || !this.isActive) return;

    this.createWarningEffect(0.4, 150, 2, () => {
      if (!this.isActive) return; // 중간에 정지될 수 있으므로 다시 체크

      const x = Phaser.Math.Between(20, 460);
      const enemyBullet = this.createBullet( x, 0, 3, null, Phaser.Math.Between(-30, 30), 400, 720 );

      // 크기 펄스 효과
      this.scene.tweens.add({
        targets: enemyBullet,
        scaleX: 3.3,
        scaleY: 3.3,
        duration: 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // 다음 스폰 예약
    this.bulletTimer = this.scheduleNextSpawn(
      () => this.spawnEnemyBullets(),
      5000,
      10000
    );
  }

  // 킹 에너미 스폰
  spawnKingEnemy() {
    if (isGameOver) return;

    this.createWarningEffect(0.6, 200, 4, () => {
      const kingEnemy = kingEnemies.create(240, -50, 'king_enemy');
      this.setupEnemy( kingEnemy, 240, -50, 5, 100, GAME_COLORS.ORANGE, GAME_CONSTANTS.KING_ENEMY_HEALTH);
      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar( 240, -20, 100, 8 );
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
    const angle = Phaser.Math.Angle.Between( kingEnemy.x, kingEnemy.y, player.x, player.y );
    const speed = GAME_CONSTANTS.KING_BULLET_SPEED;
    // const kingBullet = this.createBullet( kingEnemy.x, kingEnemy.y + 25, 1.5, GAME_COLORS.ORANGE, Math.cos(angle) * speed, Math.sin(angle) * speed, 270
    // );

    // 다음 발사 예약 (킹 에너미가 살아있는 동안 계속 발사)
    this.scene.time.delayedCall(kingEnemy.fireRate, () => {
      this.startKingEnemyFiring(kingEnemy);
    });
  }

  // 킹킹 에너미 스폰
  spawnKingKingEnemy() {
    if (isGameOver) return;
    // 화면에 있는 모든 적 제거 (커졌다가 짠! 하고 사라지는 애니메이션)
    enemies.children.iterate((enemy) => {
      if (enemy) {
        this.scene.tweens.add({
          targets: enemy,
          scale: 2.5,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (enemy.healthBarBg) enemy.healthBarBg.destroy();
            if (enemy.healthBarFill) enemy.healthBarFill.destroy();
            enemy.destroy();
          },
        });
      }
    });

    kingEnemies.children.iterate((kingEnemy) => {
      if (kingEnemy) {
        this.scene.tweens.add({
          targets: kingEnemy,
          scale: 2.5,
          alpha: 0,
          duration: 700,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            if (kingEnemy.healthBarBg) kingEnemy.healthBarBg.destroy();
            if (kingEnemy.healthBarFill) kingEnemy.healthBarFill.destroy();
            kingEnemy.destroy();
          },
        });
      }
    });
    enemyBullets.children.iterate((bullet) => {
      if (bullet && bullet.active) bullet.destroy();
    });

    this.createWarningEffect(0.8, 300, 6, () => {
      isKingKingEnemyActive = true;
      const kingKingEnemy = kingKingEnemies.create(240, -50, 'king_king_enemy');
      this.setupEnemy( kingKingEnemy, 240, -50, 1.0, 80, GAME_COLORS.RED, GAME_CONSTANTS.KING_KING_ENEMY_HEALTH );

      // 체력바 생성
      const { healthBarBg, healthBarFill } = this.createHealthBar( 240, -20, 150, 12, 0.8, GAME_COLORS.RED );
      kingKingEnemy.healthBarBg = healthBarBg;
      kingKingEnemy.healthBarFill = healthBarFill;

      // 킹킹 에너미가 화면에 완전히 들어왔을 때 총알 발사 시작
      this.scene.time.delayedCall(2000, () => {
        this.startKingKingEnemyFiring(kingKingEnemy);
      });
      // 킹킹에너미가 죽으면 일반 적 스폰 재개
      kingKingEnemy.on('destroy', () => {
        isKingKingEnemyActive = false;
        // 킹킹에너미가 죽으면 일반 적 스폰 즉시 재개
        this.spawnEnemies();
      });
    });
  }

  // 킹킹 에너미 총알 발사 시스템
  startKingKingEnemyFiring(kingKingEnemy) {
    if (!kingKingEnemy || !kingKingEnemy.active || isGameOver) return;

    // 총알 패턴 함수들
    const bulletPatterns = [
      // 아래쪽 부채꼴
      () => {
        for (let i = 0; i < 10; i++) {
          const angle = Phaser.Math.DegToRad(30 + i * 13.33);
          const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
          this.createBullet(
            kingKingEnemy.x,
            kingKingEnemy.y + 30,
            2,
            GAME_COLORS.RED,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            360
          );
        }
      },
      // 원형(360도)
      () => {
        for (let i = 0; i < 12; i++) {
          const angle = Phaser.Math.DegToRad(i * 30);
          const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
          this.createBullet(
            kingKingEnemy.x,
            kingKingEnemy.y + 30,
            2,
            GAME_COLORS.RED,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            360
          );
        }
      },
      // 십자 패턴
      () => {
        const angles = [0, 90, 180, 270];
        for (let i = 0; i < angles.length; i++) {
          const angle = Phaser.Math.DegToRad(angles[i]);
          const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
          this.createBullet(
            kingKingEnemy.x,
            kingKingEnemy.y + 30,
            2,
            GAME_COLORS.RED,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            360
          );
        }
      },
      // 나선형
      () => {
        for (let i = 0; i < 10; i++) {
          const angle = Phaser.Math.DegToRad(i * 36 + (this.scene.time.now % 360));
          const speed = GAME_CONSTANTS.KING_KING_BULLET_SPEED;
          this.createBullet(
            kingKingEnemy.x,
            kingKingEnemy.y + 30,
            2,
            GAME_COLORS.RED,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            360
          );
        }
      },
      // 직선 패턴
      () => {
        for (let i = -4; i <= 4; i++) {
          const offsetX = i * 20;
          this.createBullet(
            kingKingEnemy.x + offsetX,
            kingKingEnemy.y + 30,
            2,
            GAME_COLORS.RED,
            0,
            GAME_CONSTANTS.KING_KING_BULLET_SPEED,
            360
          );
        }
      }
    ];

    // 랜덤 패턴 선택
    const randomPattern = Phaser.Math.Between(0, bulletPatterns.length - 1);
    bulletPatterns[randomPattern].call(this);
  }

  // 파워업 스폰
  spawnPowerup() {
  // 이어하기(재시작) 직후에도 파워업이 반드시 나오게 수정
  if (isGameOver || this.hasPowerupActive) return;

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
    powerup.setScale(0.5);
    powerup.setVelocityY(120);
    // 색상 tint 제거 (기본 이미지 색상)

    // 파워업이 제거될 때 플래그 리셋
    powerup.on('destroy', () => {
      this.hasPowerupActive = false;
    });

    // 파워업이 화면 밖으로 나가면 자동 destroy
    powerup.update = () => {
      if (powerup.y > this.scene.scale.height + 40) {
        powerup.destroy();
      }
    };
    // 모든 파워업에 대해 update 체크 (Phaser 그룹의 iterate 활용)
    this.scene.events.on('update', () => {
      powerups.children.iterate((powerup) => {
        if (powerup && typeof powerup.update === 'function') {
          powerup.update();
        }
      });
    });

    // 반짝이는 효과
    this.scene.tweens.add({
      targets: powerup,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 회전 효과
    powerup.setAngularVelocity(540);

    // 크기 펄스 효과
    this.scene.tweens.add({
      targets: powerup,
      scaleX: 0.7,
      scaleY: 0.7,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 다음 파워업 스폰 예약
    if (this.isActive) {
      this.powerupTimer = this.scene.time.delayedCall(
        Phaser.Math.Between(
          GAME_CONSTANTS.POWERUP_MIN_SPAWN_TIME,
          GAME_CONSTANTS.POWERUP_MAX_SPAWN_TIME
        ),
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
      },
    });
  }

  // 모든 타이머 정리
  clearAllTimers() {
    this.isActive = false;
    this.hasPowerupActive = false;

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

    // 스폰 시스템의 모든 지연된 호출 정리
    if (this.scene.time) {
      this.scene.time.removeAllEvents();
    }

    // 모든 트윈 애니메이션 정리
    if (this.scene.tweens) {
      this.scene.tweens.killAll();
    }
  }
}

// 킹킹에너미 등장 상태 변수
let isKingKingEnemyActive = false;