// 게임 매니저 - 게임 상태 관리 및 업데이트

class GameManager {
  constructor(scene) {
    this.scene = scene;
  }

  // 게임 상태 초기화
  resetGameState() {
    score = 0;
    distance = 0;
    lastKingSpawn = 0;
    lastKingKingSpawn = 0;
    isGameOver = false;
    lastFired = 0;
    isDoubleBullet = false;
    doubleBulletEndTime = 0;
    isTouching = false;
  }

  // 배경 스크롤 및 거리 업데이트
  updateGameProgress() {
    if (isGameOver) return;

    // 배경 스크롤
    background.tilePositionY -= 2;

    // 주행거리 업데이트
    distance += 2;
    distanceText.setText('Distance: ' + Math.floor(distance / 10) + 'm');
  }

  // 보스 스폰 체크
  checkBossSpawn() {
    if (isGameOver) return;

    const currentDistance = Math.floor(distance / 10);
    
    // 킹 에너미 스폰 (200m마다)
    if (currentDistance > 0 && currentDistance % GAME_CONSTANTS.KING_SPAWN_DISTANCE === 0 && currentDistance > lastKingSpawn) {
      lastKingSpawn = currentDistance;
      this.scene.spawnSystem.spawnKingEnemy();
    }

    // 킹킹 에너미 스폰 (500m마다)
    if (currentDistance > 0 && currentDistance % GAME_CONSTANTS.KING_KING_SPAWN_DISTANCE === 0 && currentDistance > lastKingKingSpawn) {
      lastKingKingSpawn = currentDistance;
      this.scene.spawnSystem.spawnKingKingEnemy();
    }
  }

  // 화면 밖 오브젝트 정리
  cleanupOffscreenObjects() {
    if (isGameOver) return;

    // 총알 정리
    bullets.children.iterate((bullet) => {
      if (bullet && bullet.y < -50) bullet.destroy();
    });

    // 일반 적 정리
    enemies.children.iterate((enemy) => {
      if (enemy && enemy.y > 850) {
        // 체력바가 있으면 함께 제거
        if (enemy.healthBarBg) enemy.healthBarBg.destroy();
        if (enemy.healthBarFill) enemy.healthBarFill.destroy();
        enemy.destroy();
      } else if (enemy && enemy.active) {
        // 체력바 위치 업데이트
        this.updateHealthBarPosition(enemy, -20);
      }
    });

    // 킹 에너미 정리
    kingEnemies.children.iterate((kingEnemy) => {
      if (kingEnemy && kingEnemy.y > 850) {
        if (kingEnemy.healthBarBg) kingEnemy.healthBarBg.destroy();
        if (kingEnemy.healthBarFill) kingEnemy.healthBarFill.destroy();
        kingEnemy.destroy();
      } else if (kingEnemy && kingEnemy.active) {
        // 체력바 위치 업데이트
        this.updateHealthBarPosition(kingEnemy, -40);
      }
    });

    // 킹킹 에너미 정리
    kingKingEnemies.children.iterate((kingKingEnemy) => {
      if (kingKingEnemy && kingKingEnemy.y > 850) {
        if (kingKingEnemy.healthBarBg) kingKingEnemy.healthBarBg.destroy();
        if (kingKingEnemy.healthBarFill) kingKingEnemy.healthBarFill.destroy();
        kingKingEnemy.destroy();
      } else if (kingKingEnemy && kingKingEnemy.active) {
        // 체력바 위치 업데이트
        this.updateHealthBarPosition(kingKingEnemy, -50);
      }
    });

    // 적 총알 정리
    enemyBullets.children.iterate((enemyBullet) => {
      if (enemyBullet && enemyBullet.y > 850) enemyBullet.destroy();
    });

    // 파워업 정리
    powerups.children.iterate((powerup) => {
      if (powerup && powerup.y > 850) powerup.destroy();
    });
  }

  // 동전 애니메이션 업데이트
  updateCoinAnimations() {
    coins.children.iterate((coin) => {
      if (coin && coin.y > 850) {
        coin.destroy();
      } else if (coin && coin.active) {
        // 동전 회전 애니메이션
        coin.coinRotation += 0.15;
        const x = Math.cos(coin.coinRotation) * 0.4;
        coin.setScale(Math.abs(x), 0.4);
        
        if (Math.cos(coin.coinRotation) < 0) {
          coin.setTint(0xcccccc); // 뒷면
        } else {
          coin.clearTint(); // 앞면
        }
      }
    });
  }

  // 체력바 위치 업데이트 헬퍼
  updateHealthBarPosition(enemy, offsetY) {
    if (enemy.healthBarBg) {
      enemy.healthBarBg.x = enemy.x;
      enemy.healthBarBg.y = enemy.y + offsetY;
    }
    if (enemy.healthBarFill) {
      enemy.healthBarFill.x = enemy.x;
      enemy.healthBarFill.y = enemy.y + offsetY;
    }
  }
}
