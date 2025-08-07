// 충돌 처리 시스템

class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // 적 타입별 설정
  getEnemyConfig(enemyType) {
    const configs = {
      'normal': {
        healthBarWidth: 60,
        tintColor: GAME_COLORS.NORMAL_ENEMY,
        baseScale: 0.4,
        scaleMultiplier: 0.1,
        coinDrop: 1,
        destroyScore: 5,
        hitScore: 2
      },
      'king': {
        healthBarWidth: 100,
        tintColor: GAME_COLORS.KING_ENEMY,
        baseScale: 0.8,
        scaleMultiplier: 0.2,
        coinDrop: 5,
        destroyScore: 100,
        hitScore: 5
      },
      'kingking': {
        healthBarWidth: 150,
        tintColor: GAME_COLORS.KING_KING_ENEMY,
        baseScale: 1.2,
        scaleMultiplier: 0.3,
        coinDrop: 10,
        destroyScore: 300,
        hitScore: 8
      }
    };
    return configs[enemyType];
  }

  // 공통 적 충돌 처리
  hitEnemyCommon(bullet, enemy, enemyType) {
    bullet.destroy();
    enemy.health--;
    
    const config = this.getEnemyConfig(enemyType);
    
    // 체력바 업데이트
    this.updateHealthBar(enemy, config.healthBarWidth);
    
    // 타격 효과
    this.createHitEffect(enemy, config.tintColor);
    
    // 체력에 따라 크기 조정
    const healthRatio = enemy.health / enemy.maxHealth;
    enemy.setScale(config.baseScale + (healthRatio * config.scaleMultiplier));
    
    if (enemy.health <= 0) {
      this.destroyEnemy(enemy, config.coinDrop, config.destroyScore);
    } else {
      this.updateScore(config.hitScore);
    }
  }

  // 일반 적과 총알 충돌
  hitEnemy(bullet, enemy) {
    this.hitEnemyCommon(bullet, enemy, 'normal');
  }

  // 킹 에너미와 총알 충돌
  hitKingEnemy(bullet, kingEnemy) {
    this.hitEnemyCommon(bullet, kingEnemy, 'king');
  }

  // 킹킹 에너미와 총알 충돌
  hitKingKingEnemy(bullet, kingKingEnemy) {
    this.hitEnemyCommon(bullet, kingKingEnemy, 'kingking');
  }

  // 점수 업데이트 공통 함수
  updateScore(points) {
    score += points;
    scoreText.setText('Score: ' + score);
  }

  // 동전 수집
  collectCoin(player, coin) {
    coin.setAlpha(0.7);

    setTimeout(() => {
      if (coin && coin.active) {
        coin.destroy();
      }
    }, 100);
    
    this.updateScore(10);
  }

  // 파워업 수집
  collectPowerup(player, powerup) {
    powerup.setScale(0.8).setTint(GAME_COLORS.POWERUP_EFFECT);
    
    // 더블 총알 활성화
    isDoubleBullet = true;
    doubleBulletEndTime = this.scene.time.now + GAME_CONSTANTS.POWERUP_DURATION;
    
    // 파워업 폭발 효과
    this.scene.tweens.add({
      targets: powerup,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        powerup.destroy();
      }
    });
    
    // 플레이어 색상 변화
    player.setTint(GAME_COLORS.PLAYER_POWERUP);
    
    // 5초 후 원래 색으로 되돌리기
    this.scene.time.delayedCall(GAME_CONSTANTS.POWERUP_DURATION, () => {
      if (player && player.active) {
        player.clearTint();
      }
    });
    
    this.updateScore(10);
  }

  // 적 체력바 제거 공통 함수
  removeEnemyHealthBar(enemy) {
    if (enemy.healthBarBg) enemy.healthBarBg.destroy();
    if (enemy.healthBarFill) enemy.healthBarFill.destroy();
  }

  // 플레이어 충돌 (적과)
  playerHit(player, enemy) {
    enemy.destroy();
    this.removeEnemyHealthBar(enemy);
    this.gameOver(player);
  }

  // 플레이어 총알 충돌
  playerHitByBullet(player, enemyBullet) {
    enemyBullet.destroy();
    this.gameOver(player);
  }

  // 게임 오버 처리
  gameOver(player) {
    isGameOver = true;
    gameState = 'gameover';
    this.scene.physics.pause();
    player.setTint(GAME_COLORS.GAME_OVER);
    
    // 진동 효과
    this.scene.cameras.main.shake(300, 0.015);
    
    // 게임 오버 UI 표시
    gameOverText.setVisible(true);
    gameOverText.setText('GAME OVER\n\nFinal Score: ' + score + '\nDistance: ' + Math.floor(distance / 10) + 'm');
    
    restartButton.setVisible(true);
    
    // 상단 텍스트 숨김
    scoreText.setVisible(false);
    distanceText.setVisible(false);
  }

  // 체력바 업데이트
  updateHealthBar(enemy, maxWidth) {
    if (enemy.healthBarFill) {
      const healthRatio = enemy.health / enemy.maxHealth;
      enemy.healthBarFill.width = maxWidth * healthRatio;
      
      // 체력에 따라 색상 변경
      if (healthRatio > 0.6) {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_HIGH;
      } else if (healthRatio > 0.3) {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_MEDIUM;
      } else {
        enemy.healthBarFill.fillColor = GAME_COLORS.HEALTH_LOW;
      }
    }
  }

  // 타격 효과
  createHitEffect(enemy, originalTint) {
    enemy.setTint(GAME_COLORS.HIT_EFFECT);
    setTimeout(() => {
      if (enemy && enemy.active) {
        enemy.setTint(originalTint);
      }
    }, 100);
  }

  // 에너미 제거 및 동전 드랍
  destroyEnemy(enemy, coinCount, scoreValue) {
    // 체력바 제거
    this.removeEnemyHealthBar(enemy);
    
    // 동전 드랍
    this.dropCoins(enemy.x, enemy.y, coinCount);
    
    this.updateScore(scoreValue);
    enemy.destroy();
  }

  // 동전 드랍 공통 함수
  dropCoins(x, y, coinCount) {
    for (let i = 0; i < coinCount; i++) {
      const coin = coins.create( x + Phaser.Math.Between(-40, 40), y + Phaser.Math.Between(-30, 30), 'coin');
      coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-120, 120));
      coin.coinRotation = 0;
    }
  }
}