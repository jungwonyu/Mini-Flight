// 충돌 처리 시스템

class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // 일반 적과 총알 충돌
  hitEnemy(bullet, enemy) {
    bullet.destroy();
    
    enemy.health--;
    
    // 체력바 업데이트 (일반 적용)
    this.updateHealthBar(enemy, 60);
    
    // 깜빡이는 효과
    this.createHitEffect(enemy, 0xffffff); // 일반 적은 흰색으로 복구
    
    // 체력에 따라 크기 조정
    const healthRatio = enemy.health / enemy.maxHealth;
    enemy.setScale(0.4 + (healthRatio * 0.1)); // 0.4 ~ 0.5 사이로 크기 조정
    
    if (enemy.health <= 0) {
      // 체력바 제거
      if (enemy.healthBarBg) enemy.healthBarBg.destroy();
      if (enemy.healthBarFill) enemy.healthBarFill.destroy();
      
      // 동전 생성
      const coin = coins.create(enemy.x, enemy.y, 'coin');
      coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-50, 50));
      coin.coinRotation = 0;

      // 점수 획득
      score += 5;
      scoreText.setText('Score: ' + score);
      
      enemy.destroy();
    } else {
      // 아직 살아있으면 작은 점수 획득
      score += 2;
      scoreText.setText('Score: ' + score);
    }
  }

  // 킹 에너미와 총알 충돌
  hitKingEnemy(bullet, kingEnemy) {
    bullet.destroy();
    
    kingEnemy.health--;
    
    // 체력바 업데이트
    this.updateHealthBar(kingEnemy, 100);
    
    // 깜빡이는 효과
    this.createHitEffect(kingEnemy, 0xff6600);
    
    // 체력에 따라 크기 조정
    const healthRatio = kingEnemy.health / kingEnemy.maxHealth;
    kingEnemy.setScale(0.8 + (healthRatio * 0.2));
    
    if (kingEnemy.health <= 0) {
      this.destroyKingEnemy(kingEnemy, 5, 100);
    } else {
      score += 5;
      scoreText.setText('Score: ' + score);
    }
  }

  // 킹킹 에너미와 총알 충돌
  hitKingKingEnemy(bullet, kingKingEnemy) {
    bullet.destroy();
    
    kingKingEnemy.health--;
    
    // 체력바 업데이트 (킹킹용)
    this.updateKingKingHealthBar(kingKingEnemy);
    
    // 깜빡이는 효과
    this.createHitEffect(kingKingEnemy, 0xff0000);
    
    // 체력에 따라 크기 조정
    const healthRatio = kingKingEnemy.health / kingKingEnemy.maxHealth;
    kingKingEnemy.setScale(1.2 + (healthRatio * 0.3));
    
    if (kingKingEnemy.health <= 0) {
      this.destroyKingKingEnemy(kingKingEnemy);
    } else {
      score += 8;
      scoreText.setText('Score: ' + score);
    }
  }

  // 동전 수집
  collectCoin(player, coin) {
    coin.setAlpha(0.7);

    setTimeout(() => {
      if (coin && coin.active) {
        coin.destroy();
      }
    }, 100);
    
    score += 10;
    scoreText.setText('Score: ' + score);
  }

  // 파워업 수집
  collectPowerup(player, powerup) {
    powerup.setScale(0.8).setTint(0xffffff);
    
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
    player.setTint(0x00ff00);
    
    // 5초 후 원래 색으로 되돌리기
    this.scene.time.delayedCall(GAME_CONSTANTS.POWERUP_DURATION, () => {
      if (player && player.active) {
        player.clearTint();
      }
    });
    
    score += 50;
    scoreText.setText('Score: ' + score);
  }

  // 플레이어 충돌 (적과)
  playerHit(player, enemy) {
    enemy.destroy();
    
    // 체력바가 있는 적이면 체력바도 제거
    if (enemy.healthBarBg) enemy.healthBarBg.destroy();
    if (enemy.healthBarFill) enemy.healthBarFill.destroy();
    
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
    this.scene.physics.pause();
    player.setTint(0xff0000);
    
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

  // 체력바 업데이트 (킹 에너미용)
  updateHealthBar(enemy, maxWidth) {
    if (enemy.healthBarFill) {
      const healthRatio = enemy.health / enemy.maxHealth;
      enemy.healthBarFill.width = maxWidth * healthRatio;
      
      // 체력에 따라 색상 변경
      if (healthRatio > 0.6) {
        enemy.healthBarFill.fillColor = 0x00ff00; // 초록색
      } else if (healthRatio > 0.3) {
        enemy.healthBarFill.fillColor = 0xffff00; // 노란색
      } else {
        enemy.healthBarFill.fillColor = 0xff0000; // 빨간색
      }
    }
  }

  // 킹킹 에너미 체력바 업데이트
  updateKingKingHealthBar(enemy) {
    if (enemy.healthBarFill) {
      const healthRatio = enemy.health / enemy.maxHealth;
      enemy.healthBarFill.width = 150 * healthRatio;
      
      // 체력에 따라 색상 변경
      if (healthRatio > 0.7) {
        enemy.healthBarFill.fillColor = 0xff0000; // 빨간색
      } else if (healthRatio > 0.4) {
        enemy.healthBarFill.fillColor = 0xff6600; // 주황색
      } else {
        enemy.healthBarFill.fillColor = 0x660000; // 진한 빨간색
      }
    }
  }

  // 타격 효과
  createHitEffect(enemy, originalTint) {
    enemy.setTint(0xffffff);
    setTimeout(() => {
      if (enemy && enemy.active) {
        enemy.setTint(originalTint);
      }
    }, 100);
  }

  // 킹 에너미 파괴
  destroyKingEnemy(kingEnemy, coinCount, scoreValue) {
    // 체력바 제거
    if (kingEnemy.healthBarBg) kingEnemy.healthBarBg.destroy();
    if (kingEnemy.healthBarFill) kingEnemy.healthBarFill.destroy();
    
    // 동전 드랍
    for (let i = 0; i < coinCount; i++) {
      const coin = coins.create(
        kingEnemy.x + Phaser.Math.Between(-40, 40),
        kingEnemy.y + Phaser.Math.Between(-30, 30),
        'coin'
      );
      coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-120, 120));
      coin.coinRotation = 0;
    }
    
    score += scoreValue;
    scoreText.setText('Score: ' + score);
    
    kingEnemy.destroy();
  }

  // 킹킹 에너미 파괴
  destroyKingKingEnemy(kingKingEnemy) {
    // 체력바 제거
    if (kingKingEnemy.healthBarBg) kingKingEnemy.healthBarBg.destroy();
    if (kingKingEnemy.healthBarFill) kingKingEnemy.healthBarFill.destroy();
    
    // 동전 10개 드랍
    for (let i = 0; i < 10; i++) {
      const coin = coins.create(
        kingKingEnemy.x + Phaser.Math.Between(-60, 60),
        kingKingEnemy.y + Phaser.Math.Between(-40, 40),
        'coin'
      );
      coin.setScale(0.4).setVelocityY(200).setVelocityX(Phaser.Math.Between(-150, 150));
      coin.coinRotation = 0;
    }
    
    score += 300;
    scoreText.setText('Score: ' + score);
    
    kingKingEnemy.destroy();
  }
}
